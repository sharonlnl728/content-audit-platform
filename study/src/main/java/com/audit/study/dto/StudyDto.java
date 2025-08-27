package com.audit.study.dto;

import com.audit.study.entity.Study;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

public class StudyDto {
    private Long id;
    private String name;
    private String description;
    
    @JsonProperty("user_id")
    private Long userId;
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;
    
    @JsonProperty("template_id")
    private Long templateId;
    
    @JsonProperty("template_locked_at")
    private LocalDateTime templateLockedAt;
    
    @JsonProperty("template_locked_by")
    private Long templateLockedBy;
    
    private List<StudyRecordDto> records;
    
    @JsonProperty("total_records")
    private Integer totalRecords;
    
    @JsonProperty("reviewed_records")
    private Integer reviewedRecords;
    
    @JsonProperty("pending_records")
    private Integer pendingRecords;
    
    // Constructors
    public StudyDto() {}
    
    public StudyDto(Study study) {
        this.id = study.getId();
        this.name = study.getName();
        this.description = study.getDescription();
        this.userId = study.getUserId();
        this.createdAt = study.getCreatedAt();
        this.updatedAt = study.getUpdatedAt();
        this.templateId = study.getTemplateId();
        this.templateLockedAt = study.getTemplateLockedAt();
        this.templateLockedBy = study.getTemplateLockedBy();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Long getTemplateId() { return templateId; }
    public void setTemplateId(Long templateId) { this.templateId = templateId; }
    
    public LocalDateTime getTemplateLockedAt() { return templateLockedAt; }
    public void setTemplateLockedAt(LocalDateTime templateLockedAt) { this.templateLockedAt = templateLockedAt; }
    
    public Long getTemplateLockedBy() { return templateLockedBy; }
    public void setTemplateLockedBy(Long templateLockedBy) { this.templateLockedBy = templateLockedBy; }
    
    public List<StudyRecordDto> getRecords() { return records; }
    public void setRecords(List<StudyRecordDto> records) { this.records = records; }
    
    public Integer getTotalRecords() { return totalRecords; }
    public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
    
    public Integer getReviewedRecords() { return reviewedRecords; }
    public void setReviewedRecords(Integer reviewedRecords) { this.reviewedRecords = reviewedRecords; }
    
    public Integer getPendingRecords() { return pendingRecords; }
    public void setPendingRecords(Integer pendingRecords) { this.pendingRecords = pendingRecords; }
} 