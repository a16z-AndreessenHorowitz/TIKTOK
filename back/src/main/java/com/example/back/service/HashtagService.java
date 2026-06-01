package com.example.back.service;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back.entity.HashtagEntity;
import com.example.back.repository.HashtagRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class HashtagService {

    private final JdbcTemplate jdbcTemplate;
    private final HashtagRepository hashtagRepository;
    
    // Pattern for matching hashtags without accents (alphanumeric only)
    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#(\\w+)");

    @Transactional
    public void processHashtags(long videoId, String caption) {
        if (caption == null || caption.isBlank()) {
            return;
        }

        // 1. Regex & Deduplicate
        Set<String> extractedTags = new HashSet<>();
        Matcher matcher = HASHTAG_PATTERN.matcher(caption);
        while (matcher.find()) {
            extractedTags.add(matcher.group(1).toLowerCase());
        }

        if (extractedTags.isEmpty()) {
            return;
        }

        List<String> tagsList = new ArrayList<>(extractedTags);

        // 2. Bulk SELECT existing tags
        List<HashtagEntity> existingTags = hashtagRepository.findByNameIn(tagsList);
        Set<String> existingNames = existingTags.stream()
                .map(HashtagEntity::getName)
                .collect(Collectors.toSet());

        // 3. Filter new tags
        List<String> newTags = tagsList.stream()
                .filter(name -> !existingNames.contains(name))
                .toList();

        // 4. Bulk INSERT new tags
        if (!newTags.isEmpty()) {
            String insertSql = "INSERT IGNORE INTO hashtags (name, video_count, created_at) VALUES (?, 0, NOW())";
            jdbcTemplate.batchUpdate(insertSql, new BatchPreparedStatementSetter() {
                @Override
                public void setValues(PreparedStatement ps, int i) throws SQLException {
                    ps.setString(1, newTags.get(i));
                }

                @Override
                public int getBatchSize() {
                    return newTags.size();
                }
            });
        }

        // 5. Re-SELECT all to get their IDs
        List<HashtagEntity> allTags = hashtagRepository.findByNameIn(tagsList);
        List<Long> tagIds = allTags.stream().map(HashtagEntity::getId).toList();

        if (tagIds.isEmpty()) {
            return;
        }

        // --- BƯỚC QUAN TRỌNG CHO HÀNG TRIỆU USER: Sắp xếp ID để tránh Deadlock ---
        // Khi nhiều user cùng upload và cùng có chung các hashtag (vd: #xuhuong, #travel)
        // Nếu không sắp xếp, giao dịch A có thể lock #travel rồi đợi #xuhuong
        // Giao dịch B lại lock #xuhuong rồi đợi #travel -> Xảy ra Deadlock.
        List<Long> sortedTagIds = new ArrayList<>(tagIds);
        java.util.Collections.sort(sortedTagIds);

        // 6. Bulk INSERT video_hashtags
        String linkSql = "INSERT IGNORE INTO video_hashtags (video_id, tag_id) VALUES (?, ?)";
        jdbcTemplate.batchUpdate(linkSql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ps.setLong(1, videoId);
                ps.setLong(2, sortedTagIds.get(i));
            }

            @Override
            public int getBatchSize() {
                return sortedTagIds.size();
            }
        });

        // 7. Bulk Update video_count
        String updateCountSql = "UPDATE hashtags SET video_count = video_count + 1 WHERE id = ?";
        jdbcTemplate.batchUpdate(updateCountSql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                ps.setLong(1, sortedTagIds.get(i));
            }

            @Override
            public int getBatchSize() {
                return sortedTagIds.size();
            }
        });
        
        log.info("Processed {} hashtags for video {}", tagsList.size(), videoId);
    }
}
