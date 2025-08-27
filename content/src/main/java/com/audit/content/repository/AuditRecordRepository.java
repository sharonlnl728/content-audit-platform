package com.audit.content.repository;

import com.audit.content.entity.AuditRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditRecordRepository extends JpaRepository<AuditRecord, Long> {
    
    Page<AuditRecord> findByUserId(Long userId, Pageable pageable);
    
    Page<AuditRecord> findByStatus(String status, Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM AuditRecord a WHERE a.createdAt >= ?1")
    Long countByCreatedAtAfter(LocalDateTime dateTime);
    
    @Query("SELECT COUNT(a) FROM AuditRecord a WHERE a.status = ?1 AND a.createdAt >= ?2")
    Long countByStatusAndCreatedAtAfter(String status, LocalDateTime dateTime);
    
    @Query("SELECT COUNT(a) FROM AuditRecord a WHERE a.contentType = ?1 AND a.createdAt >= ?2")
    Long countByContentTypeAndCreatedAtAfter(String contentType, LocalDateTime dateTime);
    
    List<AuditRecord> findByContentHash(String contentHash);
    
    // Additional methods needed by ContentAuditService
    Long countByUserId(Long userId);
    
    Long countByUserIdAndStatus(Long userId, AuditRecord.AuditStatus status);
    
    Long countByUserIdAndContentType(Long userId, AuditRecord.ContentType contentType);
    
    // Methods needed by AdminService
    Long countByStatus(AuditRecord.AuditStatus status);
    
    Long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    Long countByStatusAndCreatedAtBetween(AuditRecord.AuditStatus status, LocalDateTime start, LocalDateTime end);
    
    List<AuditRecord> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    // Methods for trend data
    @Query("SELECT COUNT(a) FROM AuditRecord a WHERE a.userId = ?1 AND a.status = ?2 AND DATE(a.createdAt) = DATE(?3)")
    Long countByUserIdAndStatusAndDate(Long userId, AuditRecord.AuditStatus status, LocalDateTime date);
} 