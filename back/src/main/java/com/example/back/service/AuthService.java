package com.example.back.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.dto.LoginRequest;
import com.example.back.dto.RegisterRequest;
import com.example.back.dto.auth.AuthTokenBundle;
import com.example.back.dto.auth.AuthUserDto;
import com.example.back.entity.UserEntity;
import com.example.back.exception.BadLoginException;
import com.example.back.exception.DuplicateEmailException;
import com.example.back.exception.InvalidTokenException;
import com.example.back.repository.UserRepository;
import com.example.back.security.JwtTokenService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;

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
    AuthUserDto brief =
        new AuthUserDto(
            user.getId(), user.getUsername(), user.getEmail(), user.getAvatarUrl());
    String access =
        jwtTokenService.createAccessToken(user.getId(), user.getUsername(), user.getEmail());
    String refresh = jwtTokenService.createRefreshToken(user.getId());
    return new AuthTokenBundle(access, refresh, jwtTokenService.accessTtlSeconds(), brief);
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
    return data;
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
}
