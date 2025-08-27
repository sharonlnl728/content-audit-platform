package com.audit.content.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class AiTextAuditRequest {
    @JsonProperty("content")
    private String content;
    
    @JsonProperty("template_config")
    private Map<String, Object> templateConfig;  // Add template configuration support
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public Map<String, Object> getTemplateConfig() { return templateConfig; }
    public void setTemplateConfig(Map<String, Object> templateConfig) { this.templateConfig = templateConfig; }
} 