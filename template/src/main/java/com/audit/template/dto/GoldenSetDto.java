package com.audit.template.dto;

import java.time.LocalDateTime;
import java.util.List;

public class GoldenSetDto {
    private Long id;
    private String templateId;
    private String name;
    private String description;
    private String category;
    private String version;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isDefault;
    private Boolean isActive;
    private List<GoldenSampleDto> samples;
    
    // Default constructor
    public GoldenSetDto() {}
    
    // Constructor with all fields
    public GoldenSetDto(Long id, String templateId, String name, String description, 
                       String category, String version, Long createdBy, 
                       LocalDateTime createdAt, LocalDateTime updatedAt, 
                       Boolean isDefault, Boolean isActive, List<GoldenSampleDto> samples) {
        this.id = id;
        this.templateId = templateId;
        this.name = name;
        this.description = description;
        this.category = category;
        this.version = version;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.isDefault = isDefault;
        this.isActive = isActive;
        this.samples = samples;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public List<GoldenSampleDto> getSamples() { return samples; }
    public void setSamples(List<GoldenSampleDto> samples) { this.samples = samples; }
}
