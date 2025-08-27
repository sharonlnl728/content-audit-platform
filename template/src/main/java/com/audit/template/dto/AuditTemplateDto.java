package com.audit.template.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.HashMap;

@JsonIgnoreProperties(ignoreUnknown = true)
public class AuditTemplateDto {
    private Long id;
    private String templateId;
    private String name;
    private String version;
    private String description;
    private String contentType;
    private String industry;
    @JsonProperty("rules")
    private List<String> rules = new ArrayList<>();

    @JsonProperty("decisionLogic")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NONE)
    private Map<String, Object> decisionLogic = new HashMap<>();

    @JsonProperty("aiPromptTemplate")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NONE)
    private Map<String, Object> aiPromptTemplate = new HashMap<>();

    @JsonProperty("metadata")
    @JsonTypeInfo(use = JsonTypeInfo.Id.NONE)
    private Map<String, Object> metadata = new HashMap<>();
    private Boolean isActive;
    private Boolean isDefault;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Helper field for frontend display
    private Integer textRuleCount;
    private Integer imageRuleCount;
    private Integer videoRuleCount;
    private String[] supportedContentTypes;
    private String[] applicableRegions;
    private Double successRate;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTemplateId() { return templateId; }
    public void setTemplateId(String templateId) { this.templateId = templateId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public List<String> getRules() { return rules; }
    public void setRules(List<String> rules) { this.rules = rules; }

    public Map<String, Object> getDecisionLogic() { return decisionLogic; }
    public void setDecisionLogic(Map<String, Object> decisionLogic) { this.decisionLogic = decisionLogic; }

    public Map<String, Object> getAiPromptTemplate() { return aiPromptTemplate; }
    public void setAiPromptTemplate(Map<String, Object> aiPromptTemplate) { this.aiPromptTemplate = aiPromptTemplate; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getTextRuleCount() { return textRuleCount; }
    public void setTextRuleCount(Integer textRuleCount) { this.textRuleCount = textRuleCount; }

    public Integer getImageRuleCount() { return imageRuleCount; }
    public void setImageRuleCount(Integer imageRuleCount) { this.imageRuleCount = imageRuleCount; }

    public Integer getVideoRuleCount() { return videoRuleCount; }
    public void setVideoRuleCount(Integer videoRuleCount) { this.videoRuleCount = videoRuleCount; }

    public String[] getSupportedContentTypes() { return supportedContentTypes; }
    public void setSupportedContentTypes(String[] supportedContentTypes) { this.supportedContentTypes = supportedContentTypes; }

    public String[] getApplicableRegions() { return applicableRegions; }
    public void setApplicableRegions(String[] applicableRegions) { this.applicableRegions = applicableRegions; }

    public Double getSuccessRate() { return successRate; }
    public void setSuccessRate(Double successRate) { this.successRate = successRate; }
}