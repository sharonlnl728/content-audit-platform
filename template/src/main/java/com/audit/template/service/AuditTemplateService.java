package com.audit.template.service;

import com.alibaba.fastjson.JSON;
import com.audit.template.dto.AuditTemplateDto;
import com.audit.template.entity.AuditTemplate;
import com.audit.template.entity.GoldenSet;
import com.audit.template.repository.AuditTemplateRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.ArrayList;

@Service
public class AuditTemplateService {
    
    @Autowired
    private AuditTemplateRepository templateRepository;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    public List<AuditTemplateDto> getTemplates(String userInfo) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());

        // Use standard JPA methods with JSONB converter
        List<AuditTemplate> templates = templateRepository.findByCreatedBy(userId);
        return templates.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public AuditTemplateDto getTemplate(String userInfo, Long templateId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        
        AuditTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        // Check permissions
        if (!template.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        return convertToDto(template);
    }
    
    @Transactional
    public AuditTemplateDto createTemplate(String userInfo, AuditTemplateDto templateDto) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        
        // Use standard JPA methods with JSONB converter
        if (Boolean.TRUE.equals(templateDto.getIsDefault())) {
            templateRepository.findByIsDefaultTrue()
                    .ifPresent(existingDefault -> {
                        existingDefault.setIsDefault(false);
                        templateRepository.save(existingDefault);
                    });
        }

        // Generate or validate Template ID
        String templateId = generateOrValidateTemplateId(templateDto);

        // Create entity and let Hibernate handle JSONB conversion
        AuditTemplate template = new AuditTemplate();
        template.setTemplateId(templateId);
        template.setName(templateDto.getName());
        template.setVersion(templateDto.getVersion());
        template.setDescription(templateDto.getDescription());
        template.setContentType(templateDto.getContentType());
        template.setIndustry(templateDto.getIndustry());
        template.setRules(templateDto.getRules() != null ? templateDto.getRules() : new ArrayList<>());
        template.setDecisionLogic(templateDto.getDecisionLogic() != null ? templateDto.getDecisionLogic() : new HashMap<>());
        template.setAiPromptTemplate(templateDto.getAiPromptTemplate() != null ? templateDto.getAiPromptTemplate() : new HashMap<>());
        template.setMetadata(templateDto.getMetadata() != null ? templateDto.getMetadata() : new HashMap<>());
        template.setIsDefault(templateDto.getIsDefault());
        template.setIsActive(templateDto.getIsActive());
        template.setCreatedBy(userId);

        // Save using Hibernate - let it handle JSONB conversion
        AuditTemplate saved = templateRepository.save(template);
        return convertToDto(saved);
    }
    
    @Transactional
    public AuditTemplateDto updateTemplate(String userInfo, Long templateId, AuditTemplateDto templateDto) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        
        AuditTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        // Check permissions
        if (!template.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Update fields and let Hibernate handle JSONB conversion
        template.setName(templateDto.getName());
        template.setVersion(templateDto.getVersion());
        template.setDescription(templateDto.getDescription());
        template.setContentType(templateDto.getContentType());
        template.setIndustry(templateDto.getIndustry());
        template.setRules(templateDto.getRules() != null ? templateDto.getRules() : new ArrayList<>());
        template.setDecisionLogic(templateDto.getDecisionLogic() != null ? templateDto.getDecisionLogic() : new HashMap<>());
        template.setAiPromptTemplate(parseJsonToMap(templateDto.getAiPromptTemplate()));
        template.setMetadata(parseJsonToMap(templateDto.getMetadata()));
        template.setIsActive(templateDto.getIsActive());
        template.setIsDefault(templateDto.getIsDefault());

        // Save using Hibernate - let it handle JSONB conversion
        AuditTemplate updated = templateRepository.save(template);
        return convertToDto(updated);
    }



    /**
     * Generate Template ID automatically based on name and content type
     */
    private String generateOrValidateTemplateId(AuditTemplateDto templateDto) {
        return generateTemplateId(templateDto.getName(), templateDto.getContentType());
    }
    
    /**
     * Generate a standardized Template ID based on name and content type
     */
    private String generateTemplateId(String name, String contentType) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Template name is required to generate Template ID");
        }
        
        // Clean the name: remove special characters, convert to uppercase, replace spaces with hyphens
        String cleanName = name.trim()
                .replaceAll("[^a-zA-Z0-9\\s-]", "") // Remove special characters except spaces and hyphens
                .replaceAll("\\s+", "-") // Replace multiple spaces with single hyphen
                .toUpperCase();
        
        // Add TPL- prefix
        String templateId = "TPL-" + cleanName;
        
        // Ensure uniqueness
        return ensureUniqueTemplateId(templateId);
    }
    

    
    /**
     * Ensure Template ID is unique by adding suffix if needed
     */
    private String ensureUniqueTemplateId(String baseTemplateId) {
        String templateId = baseTemplateId;
        int suffix = 1;
        
        while (templateRepository.existsByTemplateId(templateId)) {
            templateId = baseTemplateId + "-" + suffix;
            suffix++;
            
            // Prevent infinite loop
            if (suffix > 100) {
                throw new RuntimeException("Unable to generate unique Template ID after 100 attempts");
            }
        }
        
        return templateId;
    }



    /**
     * Parse JSON string or Map object to Map<String, Object>
     * Handles both string and object inputs for flexibility
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonToMap(Object input) {
        if (input == null) {
            return new HashMap<>();
        }
        
        // If it's already a Map, return it directly
        if (input instanceof Map) {
            return (Map<String, Object>) input;
        }
        
        // If it's a String, try to parse as JSON
        if (input instanceof String) {
            String jsonString = (String) input;
            if (jsonString.trim().isEmpty() || jsonString.equals("{}")) {
                return new HashMap<>();
            }
            
            try {
                // Use Jackson ObjectMapper to parse JSON string
                ObjectMapper mapper = new ObjectMapper();
                return mapper.readValue(jsonString, Map.class);
            } catch (Exception e) {
                // If parsing fails, return empty map
                return new HashMap<>();
            }
        }
        
        // For any other type, return empty map
        return new HashMap<>();
    }


    
    @Transactional
    public void deleteTemplate(String userInfo, Long templateId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        
        AuditTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        // Check permissions
        if (!template.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Cannot delete default template
        if (Boolean.TRUE.equals(template.getIsDefault())) {
            throw new RuntimeException("Cannot delete default template");
        }
        
        // Delete related Golden Sets first
        String templateIdStr = template.getTemplateId();
        if (templateIdStr != null) {
            // Import GoldenSetService to delete related Golden Sets
            try {
                // Get GoldenSetService from Spring context
                GoldenSetService goldenSetService = applicationContext.getBean(GoldenSetService.class);
                if (goldenSetService != null) {
                    // Find and delete all Golden Sets for this template
                    List<GoldenSet> goldenSets = goldenSetService.getGoldenSetsByTemplateId(templateIdStr);
                    for (GoldenSet goldenSet : goldenSets) {
                        goldenSetService.deleteGoldenSet(goldenSet.getId(), userId);
                    }
                }
            } catch (Exception e) {
                // Log error but continue with template deletion
                System.err.println("Warning: Failed to delete related Golden Sets: " + e.getMessage());
            }
        }
        
        templateRepository.delete(template);
    }
    
    public AuditTemplateDto setDefaultTemplate(String userInfo, Long templateId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Simple null check with clear error message
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in userInfo. Please clear browser storage and login again. User info: " + userInfo);
        }
        
        Long userId = Long.valueOf(userIdObj.toString());
        
        AuditTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        
        // Check permissions
        if (!template.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Cancel other default templates
        templateRepository.findByIsDefaultTrue()
                .ifPresent(existingDefault -> {
                    existingDefault.setIsDefault(false);
                    templateRepository.save(existingDefault);
                });
        
        // Set new default template
        template.setIsDefault(true);
        template = templateRepository.save(template);
        
        return convertToDto(template);
    }
    


    private AuditTemplateDto convertToDto(AuditTemplate template) {
        AuditTemplateDto dto = new AuditTemplateDto();
        dto.setId(template.getId());
        dto.setTemplateId(template.getTemplateId());
        dto.setName(template.getName());
        dto.setVersion(template.getVersion());
        dto.setDescription(template.getDescription());
        dto.setContentType(template.getContentType());
        dto.setIndustry(template.getIndustry());
        dto.setRules(template.getRules());
        dto.setDecisionLogic(template.getDecisionLogic());
        dto.setAiPromptTemplate(template.getAiPromptTemplate());
        dto.setMetadata(template.getMetadata());
        dto.setIsDefault(template.getIsDefault());
        dto.setIsActive(template.getIsActive());
        dto.setCreatedBy(template.getCreatedBy());
        dto.setCreatedAt(template.getCreatedAt());
        dto.setUpdatedAt(template.getUpdatedAt());
        
        return dto;
    }
} 