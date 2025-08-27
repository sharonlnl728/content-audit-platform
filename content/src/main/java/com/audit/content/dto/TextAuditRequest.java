package com.audit.content.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class TextAuditRequest {
    @JsonProperty("content")
    private String content;
    
    @JsonProperty("template_config")
    private Map<String, Object> templateConfig;  // Add template configuration support
    
    @JsonProperty("force_refresh")
    private Boolean forceRefresh;  // Add force refresh support
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Map<String, Object> getTemplateConfig() { return templateConfig; }
    public void setTemplateConfig(Map<String, Object> templateConfig) { this.templateConfig = templateConfig; }
    
    public Boolean getForceRefresh() { return forceRefresh; }
    public void setForceRefresh(Boolean forceRefresh) { this.forceRefresh = forceRefresh; }
} 