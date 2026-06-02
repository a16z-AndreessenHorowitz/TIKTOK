import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useLocation } from "react-router-dom"
import {
  loginWithPassword,
  registerWithEmail,
  resetForgotPassword,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../../api/authApi"
import { useAuth } from "../../features/auth/hooks/useAuth"
import { saveSessionFromAuthData } from "../../features/auth/model/authSession"
import { consumeToast } from "../../shared/lib/toastSession"
import { getUserAvatarSrc } from "../../shared/lib/userAvatar"
import { TikTokIconSmall } from "./tiktok-icon"
import "./Sidebar.css"

function IconQr() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h7v7H4V4Zm2 2v3h3V6H6Zm9-2h7v7h-7V4Zm2 2v3h3V6h-3ZM4 13h7v7H4v-7Zm2 2v3h3v-3H6Zm4-2h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm2 2h2v2h-2v-2Zm2-2h2v2h-2v-2Zm4 2h2v4h-2v-4Zm-2 0h2v2h-2v-2Z" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" fill="currentColor" aria-hidden>
      <path d="M24 3a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 1 0 0 12A6 6 0 0 0 24 7Zm0 19c10.3 0 16.67 6.99 17 17 .02.55-.43 1-1 1h-2c-.54 0-.98-.45-1-1-.3-7.84-4.9-13-13-13s-12.7 5.16-13 13c-.02.55-.46 1-1.02 1h-2c-.55 0-1-.45-.98-1 .33-10.01 6.7-17 17-17Z" />
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconGoogle() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function IconLine() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path fill="#06C755" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 19.075 0 12.791 0H11.21C4.925 0 0 4.943 0 10.314c0 5.071 4.584 9.275 10.5 9.275h.75l2.25 3.75c.15.225.375.375.675.375.45 0 .825-.375.825-.825V19.59c5.916-.6 10.5-5.204 10.5-10.276" />
    </svg>
  )
}

function IconKakao() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FEE500"
        d="M12 3C6.58 3 2 6.45 2 10.75c0 2.35 1.55 4.42 3.9 5.55l-.65 2.45c-.09.32.19.6.5.45l2.9-1.55c.78.15 1.6.23 2.35.23 5.42 0 10-3.45 10-7.75S17.42 3 12 3Z"
      />
      <path
        fill="#3C1E1E"
        d="M7.5 9.75h1.1v2.5H7.5v-2.5Zm2.65 0h1l1.15 1.85L13.45 9.75h1v2.5h-1v-1.65l-.85 1.3h-.65l-.85-1.3v1.65h-1v-2.5Zm4.35 0H16v2.5h-1v-.95h-.9v.95h-1v-2.5Z"
      />
    </svg>
  )
}

function IconApple() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

const SIGNUP_OPTIONS = [
  {
    id: "phone",
    label: "Sử dụng số điện thoại hoặc email",
    icon: "user",
    action: "email",
  },
  { id: "facebook", label: "Tiếp tục với Facebook", icon: "facebook" },
  { id: "google", label: "Tiếp tục với Google", icon: "google" },
  { id: "line", label: "Tiếp tục với LINE", icon: "line" },
  { id: "kakao", label: "Tiếp tục với KakaoTalk", icon: "kakao" },
  { id: "apple", label: "Tiếp tục với Apple", icon: "apple" },
]

const LOGIN_OPTIONS = [
  { id: "qr", label: "Sử dụng mã QR", icon: "qr" },
  { id: "phone", label: "Số điện thoại / Email / Tên người dùng", icon: "user" },
  { id: "facebook", label: "Tiếp tục với Facebook", icon: "facebook", lastLogin: true },
  { id: "google", label: "Tiếp tục với Google", icon: "google" },
  { id: "line", label: "Tiếp tục với LINE", icon: "line" },
  { id: "kakao", label: "Tiếp tục với KakaoTalk", icon: "kakao" },
  { id: "apple", label: "Tiếp tục với Apple", icon: "apple" },
]

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}))

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

function buildYearOptions() {
  const y = new Date().getFullYear()
  const out = []
  for (let i = 0; i < 100; i += 1) out.push({ value: String(y - i), label: String(y - i) })
  return out
}

function SignupEmailView({ onBack, onPickPhone, onRegisterSuccess }) {
  const yearOptions = useMemo(() => buildYearOptions(), [])
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [year, setYear] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [consent, setConsent] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState("")

  const canContinue =
    month &&
    day &&
    year &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    consent

  async function handleRegister() {
    if (!canContinue || registerLoading) return
    setRegisterError("")
    const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setRegisterLoading(true)
    try {
      await registerWithEmail({
        email: email.trim(),
        password,
        birthDate,
      })
      onRegisterSuccess?.()
    } catch (err) {
      setRegisterError(
        err?.status ? err.message : "Không kết nối được máy chủ. Hãy chạy backend và thử lại.",
      )
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="signup-email">
      <div className="signup-email__top">
        <button
          type="button"
          className="signup-email__back"
          aria-label="Quay lại"
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left" aria-hidden />
        </button>
        <h2 id="auth-modal-title" className="signup-email__heading">
          Đăng ký
        </h2>
        <span className="signup-email__top-spacer" aria-hidden />
      </div>

      <div className="signup-email__scroll">
        <div className="signup-email__block">
          <p className="signup-email__label">Vui lòng cho biết ngày sinh của bạn.</p>
          <div className="signup-email__dob-row">
            <select
              className="signup-email__select"
              aria-label="Tháng"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            >
              <option value="">Tháng</option>
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              className="signup-email__select"
              aria-label="Ngày"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            >
              <option value="">Ngày</option>
              {DAY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <select
              className="signup-email__select"
              aria-label="Năm"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Năm</option>
              {yearOptions.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
          <p className="signup-email__hint">
            Ngày sinh của bạn sẽ không được hiển thị công khai.
          </p>
        </div>

        <div className="signup-email__block">
          <div className="signup-email__row-title">
            <span className="signup-email__email-title">Email</span>
            <button type="button" className="signup-email__link" onClick={onPickPhone}>
              Đăng ký bằng số điện thoại
            </button>
          </div>
          <input
            type="email"
            className="signup-email__input"
            placeholder="Địa chỉ email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="signup-email__input-wrap">
            <input
              type={showPw ? "text" : "password"}
              className="signup-email__input signup-email__input--has-suffix"
              placeholder="Mật khẩu"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="signup-email__suffix-btn"
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPw((v) => !v)}
            >
              <i className={showPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} aria-hidden />
            </button>
          </div>
        </div>

        <label className="signup-email__consent">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          <span>
            Nhận nội dung thịnh hành, bản tin, khuyến mại, đề xuất và thông tin cập nhật tài khoản
            được gửi đến email của bạn
          </span>
        </label>

        {registerError ? <p className="signup-email__error">{registerError}</p> : null}

        <button
          type="button"
          className="signup-email__next"
          disabled={!canContinue || registerLoading}
          onClick={handleRegister}
        >
          {registerLoading ? "Đang xử lý…" : "Đăng ký"}
        </button>
      </div>
    </div>
  )
}

function LoginEmailView({ onBack, onForgotPassword, onPickPhone, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  const canSubmit = identifier.trim().length > 0 && password.length > 0

  async function handleLogin() {
    if (!canSubmit || loginLoading) return
    setLoginError("")
    setLoginLoading(true)
    try {
      const authData = await loginWithPassword({
        identifier: identifier.trim(),
        password,
      })
      saveSessionFromAuthData(authData)
      onLoginSuccess?.()
    } catch (err) {
      setLoginError(err?.status ? err.message : "Không kết nối được máy chủ.")
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="signup-email signup-email--login">
      <div className="signup-email__top">
        <button
          type="button"
          className="signup-email__back"
          aria-label="Quay lại"
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left" aria-hidden />
        </button>
        <h2 id="auth-modal-title" className="signup-email__heading">
          Đăng nhập
        </h2>
        <span className="signup-email__top-spacer" aria-hidden />
      </div>

      <div className="signup-email__scroll">
        <div className="signup-email__block">
          <div className="signup-email__row-title">
            <span className="signup-email__email-title">Email hoặc TikTok ID</span>
            <button type="button" className="signup-email__link" onClick={onPickPhone}>
              Đăng nhập bằng số điện thoại
            </button>
          </div>
          <input
            className="signup-email__input"
            placeholder="Email hoặc TikTok ID"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value)
              setLoginError("")
            }}
          />
          <div
            className={`signup-email__input-wrap${loginError.trim() ? " signup-email__input-wrap--error" : ""}`}
          >
            <input
              type={showPw ? "text" : "password"}
              className="signup-email__input signup-email__input--has-suffix"
              placeholder="Mật khẩu"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setLoginError("")
              }}
            />
            <button
              type="button"
              className="signup-email__suffix-btn"
              aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPw((v) => !v)}
            >
              <i className={showPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} aria-hidden />
            </button>
          </div>
          {loginError.trim() ? (
            <p className="signup-email__error signup-email__error--inline" role="alert">
              {loginError}
            </p>
          ) : null}
          <button type="button" className="login-email__forgot" onClick={onForgotPassword}>
            Bạn quên mật khẩu?
          </button>
        </div>

        <button
          type="button"
          className="signup-email__next"
          disabled={!canSubmit || loginLoading}
          onClick={handleLogin}
        >
          {loginLoading ? "Đang xử lý…" : "Đăng nhập"}
        </button>
      </div>
    </div>
  )
}

function ForgotPasswordView({ onBack, onResetSuccess }) {
  const [identifier, setIdentifier] = useState("")
  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [devOtp, setDevOtp] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [step, setStep] = useState("identify")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState("")

  const passwordsMatch = newPassword === confirmPassword
  const canSendOtp = identifier.trim().length > 0
  const canVerifyOtp = otp.trim().length === 6
  const canResetPassword = resetToken && newPassword.length >= 6 && confirmPassword.length >= 6 && passwordsMatch

  async function handleSendOtp() {
    if (!canSendOtp || resetLoading) return
    setResetError("")
    setResetLoading(true)
    try {
      const data = await sendForgotPasswordOtp({ identifier: identifier.trim() })
      setDevOtp(data?.devOtp ? String(data.devOtp) : "")
      setMaskedEmail(data?.maskedEmail || "")
      setStep("otp")
    } catch (err) {
      setResetError(err?.status ? err.message : "Không kết nối được máy chủ.")
    } finally {
      setResetLoading(false)
    }
  }

  async function handleVerifyOtp() {
    if (!canVerifyOtp || resetLoading) return
    setResetError("")
    setResetLoading(true)
    try {
      const data = await verifyForgotPasswordOtp({
        identifier: identifier.trim(),
        otp: otp.trim(),
      })
      setResetToken(data?.resetToken || "")
      setStep("reset")
    } catch (err) {
      setResetError(err?.status ? err.message : "Không kết nối được máy chủ.")
    } finally {
      setResetLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!canResetPassword || resetLoading) return
    setResetError("")
    setResetLoading(true)
    try {
      await resetForgotPassword({ resetToken, newPassword })
      onResetSuccess?.()
    } catch (err) {
      setResetError(err?.status ? err.message : "Không kết nối được máy chủ.")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="signup-email signup-email--login">
      <div className="signup-email__top">
        <button
          type="button"
          className="signup-email__back"
          aria-label="Quay lại"
          onClick={onBack}
        >
          <i className="fa-solid fa-arrow-left" aria-hidden />
        </button>
        <h2 id="auth-modal-title" className="signup-email__heading">
          {step === "identify" ? "Quên mật khẩu" : step === "otp" ? "Nhập mã OTP" : "Đặt lại mật khẩu"}
        </h2>
        <span className="signup-email__top-spacer" aria-hidden />
      </div>

      <div className="signup-email__scroll">
        <div className="signup-email__block">
          {step === "identify" ? (
            <>
              <p className="signup-email__hint">
                Nhập email hoặc TikTok ID để nhận mã OTP xác thực.
              </p>
              <input
                className="signup-email__input"
                placeholder="Email hoặc TikTok ID"
                autoComplete="username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  setResetError("")
                }}
              />
            </>
          ) : null}

          {step === "otp" ? (
            <>
              <p className="signup-email__hint">
                Mã OTP đã được tạo cho {maskedEmail || identifier.trim()}. Trong môi trường local,
                dùng mã: <strong>{devOtp}</strong>
              </p>
              <input
                className="signup-email__input signup-email__input--otp"
                placeholder="Nhập mã OTP 6 chữ số"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  setResetError("")
                }}
              />
              <button
                type="button"
                className="login-email__forgot"
                disabled={resetLoading}
                onClick={handleSendOtp}
              >
                Gửi lại mã OTP
              </button>
            </>
          ) : null}

          {step === "reset" ? (
            <>
              <p className="signup-email__hint">OTP đã xác thực. Tạo mật khẩu mới cho tài khoản.</p>
              <div className="signup-email__input-wrap">
                <input
                  type={showPw ? "text" : "password"}
                  className="signup-email__input signup-email__input--has-suffix"
                  placeholder="Mật khẩu mới"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setResetError("")
                  }}
                />
                <button
                  type="button"
                  className="signup-email__suffix-btn"
                  aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  onClick={() => setShowPw((v) => !v)}
                >
                  <i className={showPw ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} aria-hidden />
                </button>
              </div>
              <input
                type={showPw ? "text" : "password"}
                className={`signup-email__input${confirmPassword && !passwordsMatch ? " signup-email__input--error" : ""}`}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setResetError("")
                }}
              />
              {confirmPassword && !passwordsMatch ? (
                <p className="signup-email__error signup-email__error--inline" role="alert">
                  Mật khẩu nhập lại không khớp.
                </p>
              ) : null}
            </>
          ) : null}

          {resetError.trim() ? (
            <p className="signup-email__error signup-email__error--inline" role="alert">
              {resetError}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="signup-email__next"
          disabled={
            resetLoading ||
            (step === "identify" && !canSendOtp) ||
            (step === "otp" && !canVerifyOtp) ||
            (step === "reset" && !canResetPassword)
          }
          onClick={
            step === "identify"
              ? handleSendOtp
              : step === "otp"
                ? handleVerifyOtp
                : handleResetPassword
          }
        >
          {resetLoading
            ? "Đang xử lý…"
            : step === "identify"
              ? "Gửi mã OTP"
              : step === "otp"
                ? "Xác thực OTP"
                : "Đặt lại mật khẩu"}
        </button>
      </div>
    </div>
  )
}

function LoginOptionIcon({ type }) {
  switch (type) {
    case "qr":
      return <IconQr />
    case "user":
      return <IconUser />
    case "facebook":
      return <IconFacebook />
    case "google":
      return <IconGoogle />
    case "line":
      return <IconLine />
    case "kakao":
      return <IconKakao />
    case "apple":
      return <IconApple />
    default:
      return null
  }
}

export default function Sidebar() {
  const location = useLocation()
  const isCollapsed = location.pathname.startsWith("/messages")
  const { isLoggedIn, user } = useAuth()
  const profileAvatarSrc = getUserAvatarSrc(user)
  const [authModal, setAuthModal] = useState(null)
  const [toast, setToast] = useState(() => {
    const pendingToast = consumeToast()
    return pendingToast?.message
      ? { message: pendingToast.message, kind: pendingToast.kind || "success" }
      : null
  })

  const isLoginPicker = authModal === "login"
  const isLoginEmail = authModal === "login-email"
  const isForgotPassword = authModal === "forgot-password"
  const isSignupEmail = authModal === "signup-email"
  const isAuthFormScreen = isSignupEmail || isLoginEmail || isForgotPassword
  const isLoginFooter = isLoginPicker || isLoginEmail || isForgotPassword

  useEffect(() => {
    if (!authModal) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") setAuthModal(null)
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.classList.add("modal-open")
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.classList.remove("modal-open")
      document.body.style.overflow = prevOverflow
    }
  }, [authModal])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const onOpenLogin = () => setAuthModal("login")
    window.addEventListener("tt-open-login", onOpenLogin)
    return () => window.removeEventListener("tt-open-login", onOpenLogin)
  }, [])

  return <>
    <div>
      {/* sidebar */}
      <aside className={`sidebar d-flex flex-column ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="image__logo">
          <Link to="/" style={{ color: "inherit", display: "flex", justifyContent: isCollapsed ? "center" : "flex-start" }}>
            {isCollapsed ? (
              <TikTokIconSmall />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 118 42" height="42" width="118" aria-label="TikTok" className="css-grrs3l-7937d88b--StyledLogoLight e1487oh21">
                <path fill="#25F4EE" d="M9.875 16.842v-1.119A9 9 0 0 0 8.7 15.64c-4.797-.006-8.7 3.9-8.7 8.708a8.7 8.7 0 0 0 3.718 7.134A8.68 8.68 0 0 1 1.38 25.55c0-4.737 3.794-8.598 8.495-8.707"></path>
                <path fill="#25F4EE" d="M10.086 29.526c2.14 0 3.89-1.707 3.967-3.83l.006-18.968h3.463a7 7 0 0 1-.11-1.202h-4.726l-.006 18.969a3.98 3.98 0 0 1-3.967 3.829 3.9 3.9 0 0 1-1.846-.46 3.95 3.95 0 0 0 3.22 1.662m13.905-16.36v-1.055a6.5 6.5 0 0 1-3.583-1.068 6.57 6.57 0 0 0 3.583 2.123"></path>
                <path fill="#FE2C55" d="M20.409 11.044a6.54 6.54 0 0 1-1.616-4.316h-1.265a6.56 6.56 0 0 0 2.88 4.316M8.706 20.365a3.98 3.98 0 0 0-3.973 3.976c0 1.528.869 2.858 2.134 3.523a3.94 3.94 0 0 1-.754-2.321 3.98 3.98 0 0 1 3.973-3.976c.409 0 .805.07 1.175.185v-4.833a9 9 0 0 0-1.175-.083c-.07 0-.134.006-.204.006v3.708a4 4 0 0 0-1.176-.185"></path><path fill="#FE2C55" d="M23.992 13.166v3.676c-2.453 0-4.727-.786-6.58-2.116v9.622c0 4.8-3.902 8.713-8.706 8.713a8.67 8.67 0 0 1-4.988-1.579 8.7 8.7 0 0 0 6.368 2.781c4.797 0 8.707-3.906 8.707-8.714v-9.621a11.25 11.25 0 0 0 6.579 2.116v-4.73q-.72-.002-1.38-.148"></path>
                <path fill="#000" d="M17.413 24.348v-9.622a11.25 11.25 0 0 0 6.58 2.116v-3.676a6.57 6.57 0 0 1-3.584-2.123 6.6 6.6 0 0 1-2.888-4.315H14.06l-.006 18.968a3.98 3.98 0 0 1-3.967 3.83A3.99 3.99 0 0 1 6.86 27.87a3.99 3.99 0 0 1-2.133-3.523A3.98 3.98 0 0 1 8.7 20.372c.409 0 .805.07 1.175.185v-3.708c-4.701.103-8.495 3.964-8.495 8.701 0 2.29.888 4.373 2.338 5.933a8.67 8.67 0 0 0 4.988 1.58c4.798 0 8.707-3.913 8.707-8.714m12.635-11.17h14.775l-1.355 4.232h-3.832v15.644h-4.778V17.41l-4.804.006zm38.984 0h15.12l-1.355 4.232h-4.17v15.644h-4.785V17.41l-4.804.006zM45.73 19.502h4.733v13.553h-4.708zm6.617-6.374h4.733v9.257l4.689-4.61h5.646l-5.934 5.76 6.644 9.52h-5.213l-4.433-6.598-1.405 1.362v5.236H52.34V13.128zm50.143 0h4.734v9.257l4.688-4.61h5.647l-5.934 5.76 6.643 9.52h-5.206l-4.433-6.598-1.405 1.362v5.236h-4.734zm-54.397 4.826a2.384 2.384 0 0 0 2.382-2.384 2.384 2.384 0 1 0-2.382 2.384"></path><path fill="#25F4EE" d="M83.545 24.942a8.11 8.11 0 0 1 7.473-8.087 9 9 0 0 0-.709-.026c-4.478 0-8.106 3.631-8.106 8.113s3.628 8.113 8.106 8.113c.21 0 .498-.013.71-.026-4.178-.326-7.475-3.823-7.475-8.087"></path>
                <path fill="#FE2C55" d="M92.858 16.83c-.217 0-.505.012-.716.025a8.11 8.11 0 0 1 7.468 8.087 8.11 8.11 0 0 1-7.468 8.087c.211.02.499.026.716.026 4.478 0 8.106-3.631 8.106-8.113s-3.628-8.113-8.106-8.113"></path><path fill="#000" d="M91.58 28.887a3.94 3.94 0 0 1-3.94-3.945 3.94 3.94 0 1 1 7.882 0c0 2.18-1.77 3.945-3.942 3.945m0-12.058c-4.477 0-8.106 3.631-8.106 8.113s3.629 8.113 8.106 8.113 8.106-3.631 8.106-8.113-3.628-8.113-8.106-8.113"></path>
              </svg>
            )}
          </Link>
        </div>

        {/* input */}
        <div className="box_search position-relative">
          <span className="box_search__search position-absolute">
            <i className="fa-solid fa-magnifying-glass"></i>
          </span>
          <input type="text"
            placeholder=" Tìm kiếm"
            className="box_search__input"
          />
        </div>

        {/* các ul  */}
        <div className="DivMainNavContainer">
          <ul className="box_ul">
            <li>
              <Link to="/" className="box_li">
                <span>
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M24.95 7.84a1.5 1.5 0 0 0-1.9 0l-16.1 13.2a1.5 1.5 0 0 0 .95 2.66h2.33l1.2 13.03A2.5 2.5 0 0 0 13.9 39h7.59a1 1 0 0 0 1-1v-9.68a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1V38a1 1 0 0 0 1 1h7.59a2.5 2.5 0 0 0 2.49-2.27l1.19-13.03h2.33a1.5 1.5 0 0 0 .95-2.66l-16.1-13.2Z"></path></svg>
                </span> <span className="sidebar-text">Đề xuất</span>
              </Link>
            </li>

            <li>
              <a href="*" className="box_li">
                <span>
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M24 37.4a13.4 13.4 0 1 0 0-26.8 13.4 13.4 0 0 0 0 26.8ZM40.5 24a16.5 16.5 0 1 1-33 0 16.5 16.5 0 0 1 33 0Z"></path><path d="M27.13 27.18 19 32.1a.6.6 0 0 1-.9-.63l1.84-9.33a2 2 0 0 1 .92-1.32L29 15.9a.6.6 0 0 1 .9.63l-1.84 9.33a2 2 0 0 1-.93 1.32Zm-5.04-.45 3.11-1.89.7-3.57-3.1 1.89-.7 3.57Z"></path></svg>
                </span> <span className="sidebar-text">Khám phá</span>
              </a>
            </li>

            <li>
              <a href="*" className="box_li">
                <span>
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M18.99 3a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 1 0 0 12.00A6 6 0 0 0 19 7ZM18.99 26c2.96 0 5.6.58 7.87 1.65l-3.07 3.06a15.38 15.38 0 0 0-4.8-.71C10.9 30 6.3 35.16 6 43c-.02.55-.46 1-1.02 1h-2c-.55 0-1-.45-.98-1C2.33 32.99 8.7 26 19 26ZM35.7 41.88 31.82 38H45a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H31.82l3.88-3.88a1 1 0 0 0 0-1.41l-1.41-1.42a1 1 0 0 0-1.42 0l-7.3 7.3a2 2 0 0 0 0 2.82l7.3 7.3a1 1 0 0 0 1.42 0l1.41-1.42a1 1 0 0 0 0-1.41Z"></path></svg>
                </span> <span className="sidebar-text">Đã follow</span>
              </a>
            </li>

            <li>
              <a href="*" className="box_li">
                <span>
                  <svg fill="currentColor" className="css-fd7pre-7937d88b--StyledLiveIcon e1a809ow2" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M16.78 26.82c-.08.18-.08.41-.08.88v3.9c0 .47 0 .7.08.88.1.25.3.44.54.54.18.08.41.08.88.08.47 0 .7 0 .88-.08a1 1 0 0 0 .54-.54c.08-.18.08-.41.08-.88v-3.9c0-.47 0-.7-.08-.88a1 1 0 0 0-.54-.54c-.18-.08-.41-.08-.88-.08-.47 0-.7 0-.88.08a1 1 0 0 0-.54.54ZM22.5 21.4c0-.47 0-.7.08-.88a1 1 0 0 1 .54-.54c.18-.08.41-.08.88-.08.47 0 .7 0 .88.08.25.1.44.3.54.54.08.18.08.41.08.88v10.2c0 .47 0 .7-.08.88a1 1 0 0 1-.54.54c-.18.08-.41.08-.88.08-.47 0-.7 0-.88-.08a1 1 0 0 1-.54-.54c-.08-.18-.08-.41-.08-.88V21.4ZM28.38 24.32c-.08.18-.08.41-.08.88v6.4c0 .47 0 .7.08.88.1.25.3.44.54.54.18.08.41.08.88.08.47 0 .7 0 .88-.08a1 1 0 0 0 .54-.54c.08-.18.08-.41.08-.88v-6.4c0-.47 0-.7-.08-.88a1 1 0 0 0-.54-.54c-.18-.08-.41-.08-.88-.08-.47 0-.7 0-.88.08a1 1 0 0 0-.54.54Z"></path><path d="M16.57 7.49a1 1 0 0 0-.13 1.4l3.62 4.31H15.7c-2.8 0-4.2 0-5.27.55a5 5 0 0 0-2.18 2.18C7.7 17 7.7 18.4 7.7 21.2v10.7c0 2.8 0 4.2.55 5.27a5 5 0 0 0 2.18 2.19c1.07.54 2.47.54 5.27.54h16.6c2.8 0 4.2 0 5.27-.54a5 5 0 0 0 2.19-2.19c.54-1.07.54-2.47.54-5.27V21.2c0-2.8 0-4.2-.54-5.27a5 5 0 0 0-2.19-2.18c-1.07-.55-2.47-.55-5.27-.55h-4.42l3.61-4.3a1 1 0 0 0-.12-1.41l-.77-.65a1 1 0 0 0-1.4.13l-5.23 6.22-5.23-6.22a1 1 0 0 0-1.4-.13l-.77.65Zm-.87 8.71h16.6c1.45 0 2.36 0 3.04.06.65.05.83.14.87.16.37.19.68.5.87.87.02.04.1.22.16.87.06.68.06 1.6.06 3.04v10.7c0 1.45 0 2.36-.06 3.04-.05.65-.14.83-.16.87a2 2 0 0 1-.87.87c-.04.02-.22.1-.87.16-.68.06-1.59.06-3.04.06H15.7c-1.45 0-2.36 0-3.04-.06a2.47 2.47 0 0 1-.87-.16 2 2 0 0 1-.87-.87c-.02-.04-.1-.22-.16-.87-.06-.68-.06-1.59-.06-3.04V21.2c0-1.45 0-2.36.06-3.04.05-.65.14-.83.16-.87a2 2 0 0 1 .87-.87c.04-.02.22-.1.87-.16a42.2 42.2 0 0 1 3.04-.06Z"></path></svg>
                </span> <span className="sidebar-text">LIVE</span>
              </a>
            </li>

            <li>
              <Link to="/messages" className="box_li" style={{ display: "flex", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2em", height: "2em" }}>
                  <i className="fa-regular fa-paper-plane" style={{ fontSize: "1.5em", transform: "scaleX(-1) rotate(-45deg)", position: "relative", top: "2px" }}></i>
                </span> 
                <span className="sidebar-text" style={{ marginLeft: "4px" }}>Tin nhắn</span>
              </Link>
            </li>

            <li>
              <Link to="/upload" className="box_li">
                <span>
                  <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M25 15a1 1 0 0 1 1 1v6h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-6v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-6h-6a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h6v-6a1 1 0 0 1 1-1h2Z"></path><path d="M33.58 4.5H14.42c-1.33 0-2.45 0-3.37.07-.95.08-1.86.25-2.73.7a7 7 0 0 0-3.06 3.05 7.14 7.14 0 0 0-.69 2.73 44.6 44.6 0 0 0-.07 3.37v19.16c0 1.33 0 2.45.07 3.37.08.95.25 1.86.7 2.73a7 7 0 0 0 3.05 3.06c.87.44 1.78.6 2.73.69.92.07 2.04.07 3.37.07h19.16c1.33 0 2.45 0 3.37-.07a7.14 7.14 0 0 0 2.73-.7 7 7 0 0 0 3.06-3.05c.44-.87.6-1.78.69-2.73.07-.92.07-2.04.07-3.37V14.42c0-1.33 0-2.45-.07-3.37a7.14 7.14 0 0 0-.7-2.73 7 7 0 0 0-3.05-3.06 7.14 7.14 0 0 0-2.73-.69 44.6 44.6 0 0 0-3.37-.07ZM10.14 8.83c.2-.1.53-.21 1.24-.27.73-.06 1.69-.06 3.12-.06h19c1.43 0 2.39 0 3.12.06a3.3 3.3 0 0 1 1.24.27 3 3 0 0 1 1.31 1.3c.1.21.21.54.27 1.25.06.73.06 1.69.06 3.12v19c0 1.43 0 2.39-.06 3.12a3.3 3.3 0 0 1-.27 1.24 3 3 0 0 1-1.3 1.31c-.21.1-.54.21-1.25.27-.73.06-1.69.06-3.12.06h-19c-1.43 0-2.39 0-3.12-.06a3.3 3.3 0 0 1-1.24-.27 3 3 0 0 1-1.31-1.3c-.1-.21-.21-.54-.27-1.25-.06-.73-.06-1.69-.06-3.12v-19c0-1.43 0-2.39.06-3.12a3.3 3.3 0 0 1 .27-1.24 3 3 0 0 1 1.3-1.31Z"></path></svg>
                </span> <span className="sidebar-text">Tải lên</span>
              </Link>
            </li>

            <li>
              {isLoggedIn ? (
                <Link to={`/@${encodeURIComponent(user?.username || "")}`} className="box_li box_li--profile">
                  <span className="sidebar-nav-avatar">
                    <img src={profileAvatarSrc} alt="" />
                  </span>
                  <span className="sidebar-text">Hồ sơ</span>
                </Link>
              ) : (
                <button type="button" className="box_li box_li--profile" onClick={() => setAuthModal("login")}>
                  <span>
                    <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M24 3a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 4a6 6 0 1 0 0 12.00A6 6 0 0 0 24 7Zm0 19c10.3 0 16.67 6.99 17 17 .02.55-.43 1-1 1h-2c-.54 0-.98-.45-1-1-.3-7.84-4.9-13-13-13s-12.7 5.16-13 13c-.02.55-.46 1-1.02 1h-2c-.55 0-1-.45-.98-1 .33-10.01 6.7-17 17-17Z"></path></svg>
                  </span>
                  <span className="sidebar-text">Hồ sơ</span>
                </button>
              )}
            </li>


            <li>
              <button className="btn p-0">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="2em" height="2em"><path d="M5 24a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm15 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm15 0a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"></path></svg>
              </button> <span className="sidebar-text">Thêm</span>
            </li>

          </ul>
        </div>

        {!isLoggedIn ? (
          <div className="box_login">
            <div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setAuthModal("login")}
              >
                Đăng nhập
              </button>
            </div>
          </div>
        ) : null}

        <hr>
        </hr>

        <div className="DivFooterContainer">
          <ul className="box_ul">
            <li>
              <a href="*" className="box_li">
                <span>Công ty</span>
              </a>
            </li>
            <li>
              <a href="*" className="box_li">
                <span>Chương trình</span>
              </a>
            </li>
            <li>
              <a href="*" className="box_li">
                <span>Điều khoản và chính sách</span>
              </a>
            </li>
            <li>
              <a href="*" className="box_li">
                <span data-e2e="copyright" className="css-1191ri1-7937d88b--SpanCopyright enjgv3a1">© 2026 TikTok</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>

    {authModal ? (
      <div
        className="login-modal-backdrop"
        role="presentation"
        onClick={() => setAuthModal(null)}
      >
        <div
          className={`login-modal${isAuthFormScreen ? " login-modal--auth-form" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="login-modal__close"
            aria-label="Đóng"
            onClick={() => setAuthModal(null)}
          >
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>

          {isSignupEmail ? (
            <SignupEmailView
              onBack={() => setAuthModal("signup")}
              onPickPhone={() => setAuthModal("signup")}
              onRegisterSuccess={() => setAuthModal("login")}
            />
          ) : isLoginEmail ? (
            <LoginEmailView
              onBack={() => setAuthModal("login")}
              onForgotPassword={() => setAuthModal("forgot-password")}
              onPickPhone={() => setAuthModal("login")}
              onLoginSuccess={() => {
                setAuthModal(null)
                setToast({ message: "Đã đăng nhập", kind: "success" })
              }}
            />
          ) : isForgotPassword ? (
            <ForgotPasswordView
              onBack={() => setAuthModal("login-email")}
              onResetSuccess={() => {
                setAuthModal("login-email")
                setToast({ message: "Đã đặt lại mật khẩu", kind: "success" })
              }}
            />
          ) : (
            <>
              <h2 id="auth-modal-title" className="login-modal__title">
                {isLoginPicker ? "Đăng nhập vào TikTok" : "Đăng ký TikTok"}
              </h2>

              <div className="login-modal__options">
                {(isLoginPicker ? LOGIN_OPTIONS : SIGNUP_OPTIONS).map((opt) => (
                  <div
                    key={`${authModal}-${opt.id}`}
                    className={
                      isLoginPicker && opt.lastLogin
                        ? "login-modal__option-wrap login-modal__option-wrap--badge"
                        : "login-modal__option-wrap"
                    }
                  >
                    <button
                      type="button"
                      className="login-modal__option"
                      onClick={() => {
                        if (!isLoginPicker && opt.action === "email") setAuthModal("signup-email")
                        if (isLoginPicker && opt.id === "phone") setAuthModal("login-email")
                      }}
                    >
                      <span className="login-modal__option-icon">
                        <LoginOptionIcon type={opt.icon} />
                      </span>
                      <span className="login-modal__option-label">{opt.label}</span>
                    </button>
                  </div>
                ))}
              </div>

              {isLoginPicker ? (
                <p className="login-modal__legal">
                  Bằng việc tiếp tục, bạn đồng ý với{" "}
                  <a href="#">Điều khoản Dịch vụ</a> của TikTok và xác nhận rằng bạn đã đọc{" "}
                  <a href="#">Chính sách Quyền riêng tư</a> của TikTok.
                </p>
              ) : (
                <p className="login-modal__legal">
                  Bằng việc tiếp tục, bạn đồng ý với{" "}
                  <a href="#">Điều khoản dịch vụ</a> của TikTok và xác nhận rằng bạn đã đọc{" "}
                  <a href="#">Chính sách quyền riêng tư</a> của TikTok.
                </p>
              )}
            </>
          )}

          <div className="login-modal__footer">
            {isLoginFooter ? (
              <>
                <span>Bạn không có tài khoản? </span>
                <button
                  type="button"
                  className="login-modal__signup"
                  onClick={() => setAuthModal("signup")}
                >
                  Đăng ký
                </button>
              </>
            ) : (
              <>
                <span>Bạn đã có tài khoản? </span>
                <button
                  type="button"
                  className="login-modal__signup"
                  onClick={() => setAuthModal("login")}
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    ) : null}

    {toast &&
      createPortal(
        <div
          className={`app-toast app-toast--${toast.kind}`}
          role="status"
          aria-live="polite"
        >
          <span className="app-toast__icon" aria-hidden>
            <i className="fa-solid fa-check" />
          </span>
          <span className="app-toast__text">{toast.message}</span>
        </div>,
        document.body,
      )}
  </>
}
