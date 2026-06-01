package com.example.back.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.back.entity.HashtagEntity;

@Repository
public interface HashtagRepository extends JpaRepository<HashtagEntity, Long> {

    @Query(value = "SELECT * FROM hashtags WHERE name IN (:names)", nativeQuery = true)
    List<HashtagEntity> findByNameIn(@Param("names") Collection<String> names);
}
