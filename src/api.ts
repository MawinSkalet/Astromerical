export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      method,
      credentials: "include",
      headers: data === undefined ? {} : { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
  } catch {
    throw new ApiError(
      "Cannot connect to the learning server. Check your connection and try again.",
      0,
    );
  }
  if (!response.ok) {
    let body;
    try {
      body = await response.json();
    } catch {
      body = { detail: "The server is unavailable. Please try again." };
    }
    throw new ApiError(
      typeof body.detail === "string"
        ? body.detail
        : "Please check your inputs and try again.",
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
