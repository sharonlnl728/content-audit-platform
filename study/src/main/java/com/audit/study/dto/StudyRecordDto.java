package com.audit.study.dto;

import com.audit.study.entity.StudyRecord;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class StudyRecordDto {
    private Long id;
    
    @JsonProperty("study_id")
    private Long studyId;
    
    private String content;
    
    @JsonProperty("content_type")
    private StudyRecord.ContentType contentType;
    
    private StudyRecord.RecordStatus status;
    
    private Double confidence;
    
    private String reason;
    
    @JsonProperty("ai_result")
    private String aiResult;
    
    @JsonProperty("reviewed_at")
    private LocalDateTime reviewedAt;
    
    @JsonProperty("reviewer_id")
    private Long reviewerId;
    
    @JsonProperty("manual_result")
    private StudyRecord.ManualResult manualResult;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public StudyRecordDto() {}
    
    public StudyRecordDto(StudyRecord record) {
        this.id = record.getId();
        this.studyId = record.getStudy().getId();
        this.content = record.getContent();
        this.contentType = record.getContentType();
        this.status = record.getStatus();
        this.confidence = record.getConfidence();
        this.reason = record.getReason();
        this.aiResult = record.getAiResult();
        this.reviewedAt = record.getReviewedAt();
        this.reviewerId = record.getReviewerId();
        this.manualResult = record.getManualResult();
        this.createdAt = record.getCreatedAt();
        this.updatedAt = record.getUpdatedAt();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getStudyId() { return studyId; }
    public void setStudyId(Long studyId) { this.studyId = studyId; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public StudyRecord.ContentType getContentType() { return contentType; }
    public void setContentType(StudyRecord.ContentType contentType) { this.contentType = contentType; }
    
    public StudyRecord.RecordStatus getStatus() { return status; }
    public void setStatus(StudyRecord.RecordStatus status) { this.status = status; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public String getAiResult() { return aiResult; }
    public void setAiResult(String aiResult) { this.aiResult = aiResult; }
    
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    
    public Long getReviewerId() { return reviewerId; }
    public void setReviewerId(Long reviewerId) { this.reviewerId = reviewerId; }
    
    public StudyRecord.ManualResult getManualResult() { return manualResult; }
    public void setManualResult(StudyRecord.ManualResult manualResult) { this.manualResult = manualResult; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
} 