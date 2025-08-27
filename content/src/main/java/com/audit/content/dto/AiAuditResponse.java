package com.audit.content.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class AiAuditResponse {
    @JsonProperty("is_violation")
    private Boolean isViolation;
    private Double confidence;
    private String reason;
    private List<String> categories;
    private String status;  // Added status field
    
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
} 