package com.audit.template.dto;

import java.time.LocalDateTime;

public class GoldenSampleDto {
    private Long id;
    private Long goldenSetId;
    private String sampleId;
    private String content;
    private String expectedResult;
    private String category;
    private String severity;
    private String notes;
    private String aiStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Default constructor
    public GoldenSampleDto() {}
    
    // Constructor with all fields
    public GoldenSampleDto(Long id, Long goldenSetId, String sampleId, String content, String expectedResult, 
                          String category, String severity, String notes, String aiStatus, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.goldenSetId = goldenSetId;
        this.sampleId = sampleId;
        this.content = content;
        this.expectedResult = expectedResult;
        this.category = category;
        this.severity = severity;
        this.notes = notes;
        this.aiStatus = aiStatus;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getGoldenSetId() { return goldenSetId; }
    public void setGoldenSetId(Long goldenSetId) { this.goldenSetId = goldenSetId; }
    
    public String getSampleId() { return sampleId; }
    public void setSampleId(String sampleId) { this.sampleId = sampleId; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getExpectedResult() { return expectedResult; }
    public void setExpectedResult(String expectedResult) { this.expectedResult = expectedResult; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    
    public String getAiStatus() { return aiStatus; }
    public void setAiStatus(String aiStatus) { this.aiStatus = aiStatus; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
