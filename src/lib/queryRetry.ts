type QueryResult<T> = { data: T | null; error: { message?: string; code?: string } | null };

export async function retryQuery<T>(query: PromiseLike<QueryResult<T>>, attempts = 4): Promise<T | null> {
  let result = await query;

  for (let attempt = 1; result.error && attempt < attempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 650 * attempt));
    result = await query;
  }

  if (result.error) throw new Error(result.error.message || "Could not load data");

  return result.data;
}