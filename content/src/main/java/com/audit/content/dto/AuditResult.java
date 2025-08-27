package com.audit.content.dto;

import java.util.List;

public class AuditResult {
    private String contentHash;
    private String contentType;
    private Boolean isViolation;
    private Double confidence;
    private String reason;
    private List<String> categories;
    private String status;
    private Long timestamp;
    
    // Getters and Setters
    public String getContentHash() { return contentHash; }
    public void setContentHash(String contentHash) { this.contentHash = contentHash; }
    
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    
    public Boolean getIsViolation() { return isViolation; }
    public void setIsViolation(Boolean isViolation) { this.isViolation = isViolation; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public List<String> getCategories() { return categories; }
    public void setCategories(List<String> categories) { this.categories = categories; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
} 