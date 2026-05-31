import {
  clearSession,
  getAccessToken,
  saveSessionFromAuthData,
} from "../features/auth/model/authSession";
import { readPayload, throwApiError } from "./http";

export async function registerWithEmail({ email, password, birthDate }) {
  const res = await fetch("/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, birthDate }),
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(
      res,
      payload,
      res.status === 409 ? "Email đã được đăng ký" : "Đăng ký thất bại, vui lòng thử lại.",
    );
  }

  return payload.data;
}

export async function loginWithPassword({ identifier, password }) {
  const res = await fetch("/api/v1/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(res, payload, "Đăng nhập thất bại.");
  }

  return payload.data;
}

export async function sendForgotPasswordOtp({ identifier }) {
  const res = await fetch("/api/v1/auth/forgot-password/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier }),
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(res, payload, "Không gửi được mã OTP.");
  }

  return payload.data;
}

export async function verifyForgotPasswordOtp({ identifier, otp }) {
  const res = await fetch("/api/v1/auth/forgot-password/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, otp }),
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(res, payload, "Mã OTP không hợp lệ.");
  }

  return payload.data;
}

export async function resetForgotPassword({ resetToken, newPassword }) {
  const res = await fetch("/api/v1/auth/forgot-password/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const payload = await readPayload(res);

  if (!res.ok) {
    throwApiError(res, payload, "Không đặt lại được mật khẩu.");
  }

  return payload.data;
}

export async function refreshAuthSession({ clearOnFailure = true } = {}) {
  try {
    const res = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      if (clearOnFailure) clearSession();
      return false;
    }

    const payload = await readPayload(res);
    if (payload?.data?.accessToken) {
      saveSessionFromAuthData(payload.data);
      return true;
    }

    if (clearOnFailure) clearSession();
    return false;
  } catch {
    if (clearOnFailure) clearSession();
    return false;
  }
}

export async function bootstrapAuthSession() {
  if (getAccessToken()) return true;
  return refreshAuthSession({ clearOnFailure: false });
}

export async function authLogout() {
  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    clearSession();
  }
}
