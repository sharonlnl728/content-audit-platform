package com.audit.content.dto;

import java.util.List;
import java.util.Map;

public class BatchAuditRequest {
    private List<AuditItem> items;
    
    public List<AuditItem> getItems() { return items; }
    public void setItems(List<AuditItem> items) { this.items = items; }
    
    public static class AuditItem {
        private String type; // TEXT or IMAGE
        private String content;
        private Long studyId; // New: Study ID
        private Long recordId; // New: Study Record ID
        private Map<String, Object> templateConfig; // New: Template Configuration
        
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        
        public Long getStudyId() { return studyId; }
        public void setStudyId(Long studyId) { this.studyId = studyId; }
        
        public Long getRecordId() { return recordId; }
        public void setRecordId(Long recordId) { this.recordId = recordId; }
        
        public Map<String, Object> getTemplateConfig() { return templateConfig; }
        public void setTemplateConfig(Map<String, Object> templateConfig) { this.templateConfig = templateConfig; }
    }
} 