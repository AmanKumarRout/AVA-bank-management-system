
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.txn_type AS ENUM ('credit', 'debit');
CREATE TYPE public.account_status AS ENUM ('active', 'blocked');
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'rejected', 'closed');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Accounts
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  card_number TEXT NOT NULL,
  card_expiry TEXT NOT NULL DEFAULT '12/29',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type public.txn_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  balance_after NUMERIC(14,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  counterparty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Loans
CREATE TABLE public.loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  status public.loan_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "admin view profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admin update profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies: user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin view roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: accounts
CREATE POLICY "view own account" ON public.accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admin view accounts" ON public.accounts FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage accounts" ON public.accounts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: transactions
CREATE POLICY "view own transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.accounts a WHERE a.id = account_id AND a.user_id = auth.uid())
);
CREATE POLICY "admin view txns" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies: loans
CREATE POLICY "view own loans" ON public.loans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "create own loans" ON public.loans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin view loans" ON public.loans FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage loans" ON public.loans FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-create profile + account + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_acc_no TEXT;
  new_card TEXT;
  is_admin BOOLEAN;
BEGIN
  is_admin := COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false);

  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN is_admin THEN 'admin'::app_role ELSE 'user'::app_role END);

  IF NOT is_admin THEN
    new_acc_no := 'AC' || lpad((floor(random()*1000000000))::text, 10, '0');
    new_card := '4' || lpad((floor(random()*1000000000000000))::text, 15, '0');
    INSERT INTO public.accounts (user_id, account_number, balance, card_number)
    VALUES (NEW.id, new_acc_no, 5000.00, new_card);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Transfer function (atomic)
CREATE OR REPLACE FUNCTION public.transfer_money(
  _to_account_number TEXT,
  _amount NUMERIC,
  _description TEXT DEFAULT 'Transfer'
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sender_acc public.accounts;
  receiver_acc public.accounts;
  receiver_profile public.profiles;
  sender_profile public.profiles;
  new_sender_balance NUMERIC;
  new_receiver_balance NUMERIC;
BEGIN
  IF _amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Amount must be positive');
  END IF;

  SELECT * INTO sender_acc FROM public.accounts WHERE user_id = auth.uid() LIMIT 1;
  IF sender_acc IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sender account not found');
  END IF;

  SELECT * INTO receiver_acc FROM public.accounts WHERE account_number = _to_account_number LIMIT 1;
  IF receiver_acc IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Receiver account not found');
  END IF;

  IF receiver_acc.id = sender_acc.id THEN
    RETURN jsonb_build_object('success', false, 'message', 'Cannot transfer to your own account');
  END IF;

  IF sender_acc.balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction Failed – Insufficient Balance');
  END IF;

  new_sender_balance := sender_acc.balance - _amount;
  new_receiver_balance := receiver_acc.balance + _amount;

  UPDATE public.accounts SET balance = new_sender_balance WHERE id = sender_acc.id;
  UPDATE public.accounts SET balance = new_receiver_balance WHERE id = receiver_acc.id;

  SELECT * INTO sender_profile FROM public.profiles WHERE id = sender_acc.user_id;
  SELECT * INTO receiver_profile FROM public.profiles WHERE id = receiver_acc.user_id;

  INSERT INTO public.transactions (account_id, type, amount, balance_after, description, counterparty)
  VALUES (sender_acc.id, 'debit', _amount, new_sender_balance, _description, receiver_profile.full_name);

  INSERT INTO public.transactions (account_id, type, amount, balance_after, description, counterparty)
  VALUES (receiver_acc.id, 'credit', _amount, new_receiver_balance, _description, sender_profile.full_name);

  RETURN jsonb_build_object('success', true, 'message', 'Transaction Successful', 'new_balance', new_sender_balance);
END;
$$;
