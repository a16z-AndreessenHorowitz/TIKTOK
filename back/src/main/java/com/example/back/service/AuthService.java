package com.example.back.service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.ForgotPasswordRequest;
import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.dto.ResetForgotPasswordRequest;
import com.example.back.dto.VerifyForgotPasswordOtpRequest;
import com.example.back.dto.auth.AuthTokenBundle;
import com.example.back.dto.auth.AuthUserDto;
import com.example.back.entity.UserEntity;
import com.example.back.entity.UserEntity.UserRole;
import com.example.back.exception.BadLoginException;
import com.example.back.exception.DuplicateEmailException;
import com.example.back.exception.InvalidTokenException;
import com.example.back.repository.UserRepository;
import com.example.back.security.JwtTokenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

  private static final long FORGOT_PASSWORD_OTP_TTL_SECONDS = 300;
  private static final long FORGOT_PASSWORD_RESET_TOKEN_TTL_SECONDS = 600;
  private static final int MAX_OTP_ATTEMPTS = 5;

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;
  private final Map<String, ForgotPasswordOtp> forgotPasswordOtps = new ConcurrentHashMap<>();
  private final Map<String, ForgotPasswordResetToken> forgotPasswordResetTokens =
      new ConcurrentHashMap<>();

  @Transactional(readOnly = true)
  public AuthTokenBundle login(LoginRequest request) {
    String raw = request.getIdentifier().trim();
    if (raw.isEmpty()) {
      throw new BadLoginException();
    }
    String emailKey = raw.toLowerCase();
    UserEntity user =
        userRepository
            .findByEmail(emailKey)
            .or(() -> userRepository.findByUsername(raw))
            .orElseThrow(BadLoginException::new);
    if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
      throw new BadLoginException();
    }
    return issueTokensForUser(user);
  }

  /** Đổi refresh cookie lấy access token mới (và có thể xoay refresh — hiện giữ nguyên TTL cookie). */
  @Transactional(readOnly = true)
  public AuthTokenBundle refreshFromCookie(String refreshJwt) {
    long userId = jwtTokenService.parseRefreshTokenUserId(refreshJwt);
    UserEntity user =
        userRepository.findById(userId).orElseThrow(InvalidTokenException::new);
    return issueTokensForUser(user);
  }

  private AuthTokenBundle issueTokensForUser(UserEntity user) {
    UserRole role = roleOrDefault(user);
    AuthUserDto brief =
        new AuthUserDto(
            user.getId(), user.getUsername(), user.getEmail(), user.getAvatarUrl(), role);
    String access =
        jwtTokenService.createAccessToken(
            user.getId(), user.getUsername(), user.getEmail(), role);
    String refresh = jwtTokenService.createRefreshToken(user.getId());
    return new AuthTokenBundle(access, refresh, jwtTokenService.accessTtlSeconds(), brief);
  }

  private UserRole roleOrDefault(UserEntity user) {
    return user.getRole() == null ? UserRole.USER : user.getRole();
  }

  @Transactional
  public Map<String, Object> register(RegisterRequest request) {
    String email = request.getEmail().trim();
    if (userRepository.existsByEmail(email.toLowerCase())) {
      throw new DuplicateEmailException();
    }

    UserEntity user = new UserEntity();
    user.setUsername(generateUsername(email));
    user.setEmail(email.toLowerCase());
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setBirthDate(request.getBirthDate());

    userRepository.save(user);

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("id", user.getId());
    data.put("username", user.getUsername());
    data.put("email", user.getEmail());
    data.put("role", roleOrDefault(user).name());
    return data;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> sendForgotPasswordOtp(ForgotPasswordRequest request) {
    UserEntity user = findUserByIdentifier(request.getIdentifier());
    String identifierKey = forgotPasswordIdentifierKey(request.getIdentifier());
    String otp = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1_000_000));

    forgotPasswordOtps.put(
        identifierKey,
        new ForgotPasswordOtp(
            user.getId(), otp, Instant.now().plusSeconds(FORGOT_PASSWORD_OTP_TTL_SECONDS), 0));

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("expiresInSeconds", FORGOT_PASSWORD_OTP_TTL_SECONDS);
    data.put("maskedEmail", maskEmail(user.getEmail()));
    data.put("devOtp", otp);
    return data;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> verifyForgotPasswordOtp(VerifyForgotPasswordOtpRequest request) {
    UserEntity user = findUserByIdentifier(request.getIdentifier());
    String identifierKey = forgotPasswordIdentifierKey(request.getIdentifier());
    ForgotPasswordOtp otpState = forgotPasswordOtps.get(identifierKey);
    if (otpState == null || !otpState.userId().equals(user.getId())) {
      throw new IllegalArgumentException("Vui lòng gửi mã OTP trước.");
    }
    if (otpState.expiresAt().isBefore(Instant.now())) {
      forgotPasswordOtps.remove(identifierKey);
      throw new IllegalArgumentException("Mã OTP đã hết hạn.");
    }
    if (otpState.attempts() >= MAX_OTP_ATTEMPTS) {
      forgotPasswordOtps.remove(identifierKey);
      throw new IllegalArgumentException("Bạn đã nhập sai OTP quá nhiều lần.");
    }
    if (!otpState.otp().equals(request.getOtp())) {
      forgotPasswordOtps.put(identifierKey, otpState.withAttemptAdded());
      throw new IllegalArgumentException("Mã OTP không đúng.");
    }

    forgotPasswordOtps.remove(identifierKey);
    String resetToken = UUID.randomUUID().toString();
    forgotPasswordResetTokens.put(
        resetToken,
        new ForgotPasswordResetToken(
            user.getId(), Instant.now().plusSeconds(FORGOT_PASSWORD_RESET_TOKEN_TTL_SECONDS)));

    Map<String, Object> data = new LinkedHashMap<>();
    data.put("resetToken", resetToken);
    data.put("expiresInSeconds", FORGOT_PASSWORD_RESET_TOKEN_TTL_SECONDS);
    return data;
  }

  @Transactional
  public void resetForgotPassword(ResetForgotPasswordRequest request) {
    ForgotPasswordResetToken resetToken = forgotPasswordResetTokens.remove(request.getResetToken());
    if (resetToken == null || resetToken.expiresAt().isBefore(Instant.now())) {
      throw new IllegalArgumentException("Phiên đặt lại mật khẩu đã hết hạn.");
    }
    userRepository.updatePasswordHash(
        resetToken.userId(), passwordEncoder.encode(request.getNewPassword()));
  }

  private String generateUsername(String email) {
    int at = email.indexOf('@'); // tìm vị trí @
    String local = at > 0 ? email.substring(0, at) : email; // lấy phần trước của email, nếu không có @ thì lấy toàn bộ email
    String base = local.replaceAll("[^a-zA-Z0-9_]", "_");//
    if (base.isEmpty()) { // nếu base là rỗng thì đặt base là "user" ví dụ : @@@ thì thành user
      base = "user";
    }
    if (base.length() > 80) { // nếu base dài hơn 80 ký tự thì cắt bớt
      base = base.substring(0, 80);
    }

    String candidate = base;
    ThreadLocalRandom random = ThreadLocalRandom.current();
    int attempts = 0;
    while (userRepository.existsByUsername(candidate) && attempts < 50) { // nếu username đã tồn tại và số lần thử ít hơn 50 lần thì tạo username mới
      candidate = base + "_" + random.nextInt(100000, 1_000_000);
      attempts++;
    }
    if (userRepository.existsByUsername(candidate)) {
      candidate = base + "_" + System.currentTimeMillis();
    }
    return candidate;
  }

  private UserEntity findUserByIdentifier(String identifier) {
    String raw = identifier == null ? "" : identifier.trim();
    if (raw.isEmpty()) {
      throw new IllegalArgumentException("Nhập email hoặc TikTok ID");
    }

    String usernameKey = raw.startsWith("@") ? raw.substring(1).trim() : raw;
    return userRepository
        .findByEmail(raw.toLowerCase())
        .or(() -> userRepository.findByUsername(usernameKey))
        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản."));
  }

  private static String forgotPasswordIdentifierKey(String identifier) {
    String raw = identifier == null ? "" : identifier.trim();
    return raw.startsWith("@") ? raw.substring(1).trim().toLowerCase() : raw.toLowerCase();
  }

  private static String maskEmail(String email) {
    if (email == null || email.isBlank()) {
      return "";
    }
    int atIndex = email.indexOf('@');
    if (atIndex <= 1) {
      return "***" + email.substring(Math.max(0, atIndex));
    }
    String first = email.substring(0, 1);
    String domain = atIndex >= 0 ? email.substring(atIndex) : "";
    return first + "***" + domain;
  }

  private record ForgotPasswordOtp(Long userId, String otp, Instant expiresAt, int attempts) {
    ForgotPasswordOtp withAttemptAdded() {
      return new ForgotPasswordOtp(userId, otp, expiresAt, attempts + 1);
    }
  }

  private record ForgotPasswordResetToken(Long userId, Instant expiresAt) {}
}
