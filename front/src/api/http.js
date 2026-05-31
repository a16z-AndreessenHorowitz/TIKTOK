export class ApiError extends Error {
  constructor(message, { status, payload } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export async function readPayload(response) {
  return response.json().catch(() => ({}));
}

export function isAuthError(response) {
  return response.status === 401 || response.status === 403;
}

export function throwApiError(response, payload, fallbackMessage) {
  throw new ApiError(payload?.message || fallbackMessage, {
    status: response.status,
    payload,
  });
}
