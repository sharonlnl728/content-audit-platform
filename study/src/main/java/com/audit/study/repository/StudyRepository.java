package com.audit.study.repository;

import com.audit.study.entity.Study;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyRepository extends JpaRepository<Study, Long> {
    
    List<Study> findByUserId(Long userId);
    
    List<Study> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    @Query("SELECT s FROM Study s WHERE s.userId = ?1 AND s.name LIKE %?2%")
    List<Study> findByUserIdAndNameContaining(Long userId, String name);
    
    @Query("SELECT COUNT(s) FROM Study s WHERE s.userId = ?1")
    Long countByUserId(Long userId);
    
    Optional<Study> findByIdAndUserId(Long id, Long userId);
} 