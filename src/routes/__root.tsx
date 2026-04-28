import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AVA Bank — Modern Banking Management" },
      { name: "description", content: "Secure online banking. Transfer money, track expenses, manage accounts and loans — all in one elegant dashboard." },
      { property: "og:title", content: "AVA Bank — Modern Banking Management" },
      { name: "twitter:title", content: "AVA Bank — Modern Banking Management" },
      { property: "og:description", content: "Secure online banking. Transfer money, track expenses, manage accounts and loans — all in one elegant dashboard." },
      { name: "twitter:description", content: "Secure online banking. Transfer money, track expenses, manage accounts and loans — all in one elegant dashboard." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/782d13e0-2fc5-483f-b609-78091018aa31/id-preview-763b7fef--c39d83be-75bd-47a1-8dde-511a720b74c5.lovable.app-1777365771197.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/782d13e0-2fc5-483f-b609-78091018aa31/id-preview-763b7fef--c39d83be-75bd-47a1-8dde-511a720b74c5.lovable.app-1777365771197.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <AuthProvider>
      <Outlet />
      <Toaster richColors position="top-right" />
    </AuthProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
