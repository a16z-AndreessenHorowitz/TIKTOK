package com.example.back.dto.auth;

import com.example.back.entity.UserEntity.UserRole;

public record AuthUserDto(
    long id, String username, String email, String avatarUrl, UserRole role) {}
