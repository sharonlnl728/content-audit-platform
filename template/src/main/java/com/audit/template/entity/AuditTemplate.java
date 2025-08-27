package com.audit.template.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.Type;
import java.util.ArrayList;
import java.util.HashMap;

@Entity
@Table(name = "audit_templates")
public class AuditTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false, unique = true, length = 50)
    private String templateId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "version", length = 20)
    private String version = "v1.0";

    @Column(name = "description")
    private String description;

    @Column(name = "content_type", length = 50)
    private String contentType;

    @Column(name = "industry", length = 50)
    private String industry;

    @Column(name = "rules", nullable = false, columnDefinition = "jsonb")
    @Type(type = "com.vladmihalcea.hibernate.type.json.JsonType")
    private List<String> rules = new ArrayList<>();

    @Column(name = "decision_logic", nullable = false, columnDefinition = "jsonb")
    @Type(type = "com.vladmihalcea.hibernate.type.json.JsonType")
    private Map<String, Object> decisionLogic = new HashMap<>();

    @Column(name = "ai_prompt_template", columnDefinition = "jsonb")
    @Type(type = "com.vladmihalcea.hibernate.type.json.JsonType")
    private Map<String, Object> aiPromptTemplate = new HashMap<>();

    @Column(name = "metadata", columnDefinition = "jsonb")
    @Type(type = "com.vladmihalcea.hibernate.type.json.JsonType")
    private Map<String, Object> metadata = new HashMap<>();

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

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
}