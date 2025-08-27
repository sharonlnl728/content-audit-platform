package com.audit.study.repository;

import com.audit.study.entity.StudyRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudyRecordRepository extends JpaRepository<StudyRecord, Long> {
    
    List<StudyRecord> findByStudyId(Long studyId);
    
    List<StudyRecord> findByStudyIdOrderByCreatedAtDesc(Long studyId);
    
    @Query("SELECT r FROM StudyRecord r WHERE r.study.id = ?1 AND r.status = ?2")
    List<StudyRecord> findByStudyIdAndStatus(Long studyId, StudyRecord.RecordStatus status);
    
    @Query("SELECT COUNT(r) FROM StudyRecord r WHERE r.study.id = ?1")
    Long countByStudyId(Long studyId);
    
    @Query("SELECT COUNT(r) FROM StudyRecord r WHERE r.study.id = ?1 AND r.status = ?2")
    Long countByStudyIdAndStatus(Long studyId, StudyRecord.RecordStatus status);
    
    @Query("SELECT COUNT(r) FROM StudyRecord r WHERE r.study.id = ?1 AND r.status IN ('PASS', 'REJECT', 'REVIEW')")
    Long countReviewedByStudyId(Long studyId);
    
    @Query("SELECT COUNT(r) FROM StudyRecord r WHERE r.study.id = ?1 AND r.status = 'PENDING'")
    Long countPendingByStudyId(Long studyId);
} 