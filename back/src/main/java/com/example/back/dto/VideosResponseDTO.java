package com.example.back.dto;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VideosResponseDTO {
  private Long id;

    private String videoUrl;
    private String thumbnailUrl;

    private String caption;

    // 👤 thông tin user (có thể trả ra cho frontend)
    private Long userId;
    private String username;
    private String avatarUrl;

    // 📊 thống kê
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private Long shareCount;

    // 🔥 trạng thái user hiện tại
    private Boolean isLiked;   // user hiện tại đã like chưa
    private Boolean isFollowed; // đã follow chưa

    // ⏰ thời gian
    private LocalDateTime createdAt;
}
