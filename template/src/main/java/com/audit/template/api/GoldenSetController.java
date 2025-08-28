package com.audit.template.api;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.util.ArrayList;
import java.io.IOException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.audit.template.repository.GoldenSetSampleRepository;
import com.audit.template.entity.GoldenSetSample;
import com.audit.template.service.GoldenSetService;
import com.audit.template.dto.GoldenSetDto;
import com.audit.template.entity.GoldenSet;
import java.util.Optional;
import com.audit.template.dto.GoldenSampleDto;

@RestController
@RequestMapping("/api/template/golden-sets")
public class GoldenSetController {

  private final ObjectMapper objectMapper = new ObjectMapper();
  
  @Autowired
  private GoldenSetSampleRepository goldenSetSampleRepository;

  @GetMapping("/ping")
  public Map<String, Object> ping() {
    return Map.of("ok", true, "service", "audit-template-service", "ts", Instant.now().toString());
  }
  
  @GetMapping("/info")
  public Map<String, Object> info() {
    return Map.of("ok", true, "version", 1, "service", "audit-template-service");
  }
  
  // Get available Golden Set templates for specified template
  @GetMapping("/templates/{templateId}/available")
  public Map<String, Object> getAvailableTemplatesForTemplate(@PathVariable String templateId) {
    Map<String, Object> response = new HashMap<>();
    
    try {
      Map<String, Object> templates = new HashMap<>();
      
      // Return corresponding Golden Set template based on templateId
      switch (templateId) {
        case "TPL-LANDING-PAGE":
          templates.put("landing-page-ad-review", createLandingPageTemplate());
          break;
        case "TPL-SOCIAL-MEDIA":
          templates.put("social-media-moderation", createSocialMediaTemplate());
          break;
        case "TPL-ECOMMERCE":
          templates.put("e-commerce-content", createEcommerceTemplate());
          break;
        default:
          // For unknown template, return generic template
          templates.put("generic-content", createGenericTemplate());
          break;
      }
      
      response.put("ok", true);
      response.put("templateId", templateId);
      response.put("templates", templates);
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to get templates: " + e.getMessage());
    }
    
    return response;
  }
  
  // Import Golden Set template for specified template
  @PostMapping("/templates/{templateId}/import/{templateKey}")
  public Map<String, Object> importTemplateForTemplate(
      @PathVariable String templateId,
      @PathVariable String templateKey,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      Map<String, Object> template = null;
      
      // Get corresponding template based on templateId and templateKey
      switch (templateId) {
        case "TPL-LANDING-PAGE":
          if ("landing-page-ad-review".equals(templateKey)) {
            template = createLandingPageTemplate();
          }
          break;
        case "TPL-SOCIAL-MEDIA":
          if ("social-media-moderation".equals(templateKey)) {
            template = createSocialMediaTemplate();
          }
          break;
        case "TPL-ECOMMERCE":
          if ("e-commerce-content".equals(templateKey)) {
            template = createEcommerceTemplate();
          }
          break;
        default:
          if ("generic-content".equals(templateKey)) {
            template = createGenericTemplate();
          }
          break;
      }
      
      if (template != null) {
        response.put("ok", true);
        response.put("message", "Template imported successfully");
        response.put("template", template);
        response.put("templateId", templateId);
        response.put("importedAt", Instant.now().toString());
        response.put("userInfo", userInfo);
      } else {
        response.put("ok", false);
        response.put("error", "Template not found for templateId: " + templateId + ", templateKey: " + templateKey);
      }
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to import template: " + e.getMessage());
    }
    
    return response;
  }
  
  // Upload Golden Set file for specified template
  @SuppressWarnings("null")
  @PostMapping("/templates/{templateId}/upload")
  public Map<String, Object> uploadForTemplate(
      @PathVariable String templateId,
      @RequestParam("file") MultipartFile file,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Check file type
      if (!file.getOriginalFilename().endsWith(".json")) {
        response.put("ok", false);
        response.put("error", "Only JSON files are supported");
        return response;
      }
      
      // Read file content
      String fileContent = new String(file.getBytes());
      
      // Parse JSON
      Map<String, Object> importedData = objectMapper.readValue(fileContent, new TypeReference<Map<String, Object>>() {});
      
      // Support two formats:
      // 1. Direct format containing samples array
      // 2. Nested format containing key (e.g., landing-page-ad-review)
      Map<String, Object> templateData = null;
      List<Map<String, Object>> samples = null;
      
      if (importedData.containsKey("samples") && importedData.get("samples") instanceof List) {
        // Direct format
        templateData = importedData;
        samples = castToListOfMaps(importedData.get("samples"));
      } else {
        // Nested format, find first key containing samples
        for (Map.Entry<String, Object> entry : importedData.entrySet()) {
          if (entry.getValue() instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> nestedData = (Map<String, Object>) entry.getValue();
            if (nestedData.containsKey("samples") && nestedData.get("samples") instanceof List) {
              templateData = nestedData;
              samples = castToListOfMaps(nestedData.get("samples"));
              break;
            }
          }
        }
      }
      
      // Verify if valid template data was found
      if (templateData == null || samples == null) {
        response.put("ok", false);
        response.put("error", "Invalid file format: missing 'samples' array or template structure");
        return response;
      }
      
      // Validate sample data
      for (Map<String, Object> sample : samples) {
        if (!sample.containsKey("content") || !sample.containsKey("expectedResult")) {
          response.put("ok", false);
          response.put("error", "Invalid sample format: missing required fields (content, expectedResult)");
          return response;
        }
      }
      
      // Build response
      response.put("ok", true);
      response.put("message", "File imported successfully");
      response.put("template", templateData);
      response.put("templateId", templateId);
      response.put("fileName", file.getOriginalFilename());
      response.put("fileSize", file.getSize());
      response.put("sampleCount", samples.size());
      response.put("importedAt", Instant.now().toString());
      response.put("userInfo", userInfo);
      
    } catch (IOException e) {
      response.put("ok", false);
      response.put("error", "Failed to read file: " + e.getMessage());
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to parse file: " + e.getMessage());
    }
    
    return response;
  }
  
  // Get all available Golden Set templates (maintain backward compatibility)
  @GetMapping("/available-templates")
  public Map<String, Object> getAvailableTemplates() {
    Map<String, Object> templates = new HashMap<>();
    
    // Landing Page Ad Review
    Map<String, Object> landingPage = new HashMap<>();
    landingPage.put("name", "Landing Page Ad Review Golden Set");
    landingPage.put("description", "Specialized Golden Set for testing TPL-LANDING-PAGE template with various ad content scenarios");
    landingPage.put("version", "1.0");
    landingPage.put("category", "content_moderation");
    landingPage.put("sampleCount", 11);
    landingPage.put("templateKey", "landing-page-ad-review");
    landingPage.put("templateId", "TPL-LANDING-PAGE");
    templates.put("landing-page-ad-review", landingPage);
    
    // Social Media Moderation
    Map<String, Object> socialMedia = new HashMap<>();
    socialMedia.put("name", "Social Media Content Moderation Golden Set");
    socialMedia.put("description", "Template for social media content moderation with focus on community safety");
    socialMedia.put("version", "1.0");
    socialMedia.put("category", "content_moderation");
    socialMedia.put("sampleCount", 5);
    socialMedia.put("templateKey", "social-media-moderation");
    socialMedia.put("templateId", "TPL-SOCIAL-MEDIA");
    templates.put("social-media-moderation", socialMedia);
    
    // E-commerce Content
    Map<String, Object> ecommerce = new HashMap<>();
    ecommerce.put("name", "E-commerce Content Review Golden Set");
    ecommerce.put("description", "Template for reviewing e-commerce product descriptions and marketing content");
    ecommerce.put("version", "1.0");
    ecommerce.put("category", "content_moderation");
    ecommerce.put("sampleCount", 4);
    ecommerce.put("templateKey", "e-commerce-content");
    ecommerce.put("templateId", "TPL-ECOMMERCE");
    templates.put("e-commerce-content", ecommerce);
    
    return Map.of("ok", true, "templates", templates);
  }
  
  private Map<String, Object> createLandingPageTemplate() {
    Map<String, Object> template = new HashMap<>();
    template.put("name", "Landing Page Ad Review Golden Set");
    template.put("description", "Specialized Golden Set for testing TPL-LANDING-PAGE template with various ad content scenarios");
    template.put("version", "1.0");
    template.put("category", "content_moderation");
    template.put("templateId", "TPL-LANDING-PAGE");
    
          // Read samples for Golden Set ID 1 from database
    List<GoldenSetSample> dbSamples = goldenSetSampleRepository.findByGoldenSetId(1L);
    
    List<Map<String, Object>> samples = new ArrayList<>();
    for (GoldenSetSample dbSample : dbSamples) {
      Map<String, Object> sample = new HashMap<>();
      sample.put("id", dbSample.getSampleId());
      sample.put("content", dbSample.getContent());
      sample.put("expectedResult", dbSample.getExpectedResult());
      sample.put("category", dbSample.getCategory());
      sample.put("severity", dbSample.getSeverity());
      sample.put("notes", dbSample.getNotes());
      samples.add(sample);
    }
    
    template.put("samples", samples);
    return template;
  }
  
  private Map<String, Object> createSocialMediaTemplate() {
    Map<String, Object> template = new HashMap<>();
    template.put("name", "Social Media Content Moderation Golden Set");
    template.put("description", "Template for social media content moderation with focus on community safety");
    template.put("version", "1.0");
    template.put("category", "content_moderation");
    template.put("templateId", "TPL-SOCIAL-MEDIA");
    
    List<Map<String, Object>> samples = List.of(
      Map.of("id", "sm-1", "content", "Check out our new product line! Great deals this week only.", "expectedResult", "PASS", "category", "compliance", "severity", "low", "notes", "Normal business promotion"),
      Map.of("id", "sm-2", "content", "Join our community discussion about current events.", "expectedResult", "PASS", "category", "compliance", "severity", "low", "notes", "Legitimate community engagement"),
      Map.of("id", "sm-3", "content", "Explicit content available here. Click for adult videos and photos.", "expectedResult", "BLOCK", "category", "common_violation", "severity", "high", "notes", "Adult content violation"),
      Map.of("id", "sm-4", "content", "Hate speech and discriminatory content against specific groups.", "expectedResult", "BLOCK", "category", "common_violation", "severity", "high", "notes", "Hate speech violation"),
      Map.of("id", "sm-5", "content", "This post might contain sensitive information. Please review carefully.", "expectedResult", "REVIEW", "category", "edge_case", "severity", "medium", "notes", "Potentially sensitive content requiring human review")
    );
    
    template.put("samples", samples);
    return template;
  }
  
  private Map<String, Object> createEcommerceTemplate() {
    Map<String, Object> template = new HashMap<>();
    template.put("name", "E-commerce Content Review Golden Set");
    template.put("description", "Template for reviewing e-commerce product descriptions and marketing content");
    template.put("version", "1.0");
    template.put("category", "content_moderation");
    template.put("templateId", "TPL-ECOMMERCE");
    
    List<Map<String, Object>> samples = List.of(
      Map.of("id", "ec-1", "content", "High-quality wireless headphones with noise cancellation. 30-day money-back guarantee.", "expectedResult", "PASS", "category", "compliance", "severity", "low", "notes", "Standard product description"),
      Map.of("id", "ec-2", "content", "Miracle weight loss pill! Lose 20 pounds in 1 week guaranteed!", "expectedResult", "BLOCK", "category", "common_violation", "severity", "high", "notes", "False health claims"),
      Map.of("id", "ec-3", "content", "Limited edition product with exclusive features. While supplies last.", "expectedResult", "PASS", "category", "compliance", "severity", "low", "notes", "Legitimate scarcity marketing"),
      Map.of("id", "ec-4", "content", "This product may have some benefits for certain users. Individual results may vary.", "expectedResult", "REVIEW", "category", "edge_case", "severity", "medium", "notes", "Ambiguous health claims requiring review")
    );
    
    template.put("samples", samples);
    return template;
  }
  
  private Map<String, Object> createGenericTemplate() {
    Map<String, Object> template = new HashMap<>();
    template.put("name", "Generic Content Moderation Golden Set");
    template.put("description", "General purpose content moderation template for various content types");
    template.put("version", "1.0");
    template.put("category", "content_moderation");
    template.put("templateId", "GENERIC");
    
    List<Map<String, Object>> samples = List.of(
      Map.of("id", "gen-1", "content", "Welcome to our platform! We provide quality services.", "expectedResult", "PASS", "category", "compliance", "severity", "low", "notes", "Normal welcome message"),
      Map.of("id", "gen-2", "content", "Explicit adult content and explicit material.", "expectedResult", "BLOCK", "category", "common_violation", "severity", "high", "notes", "Adult content violation"),
      Map.of("id", "gen-3", "content", "This content requires careful review.", "expectedResult", "REVIEW", "category", "edge_case", "severity", "medium", "notes", "Ambiguous content requiring review")
    );
    
    template.put("samples", samples);
    return template;
  }
  
  // CRUD API endpoints for Golden Sets
  
  @Autowired
  private GoldenSetService goldenSetService;
  
  // Get all Golden Sets for a template
  @GetMapping("/templates/{templateId}/golden-sets")
  public Map<String, Object> getGoldenSetsByTemplateId(@PathVariable String templateId) {
    Map<String, Object> response = new HashMap<>();
    
    try {
      List<GoldenSet> goldenSets = goldenSetService.getGoldenSetsByTemplateId(templateId);
      response.put("ok", true);
      response.put("data", goldenSets);
      response.put("count", goldenSets.size());
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to get Golden Sets: " + e.getMessage());
    }
    
    return response;
  }
  
  // Get Golden Set by ID
  @GetMapping("/golden-sets/{id}")
  public Map<String, Object> getGoldenSetById(@PathVariable Long id) {
    Map<String, Object> response = new HashMap<>();
    
    try {
      Optional<GoldenSet> goldenSet = goldenSetService.getGoldenSetById(id);
      if (goldenSet.isPresent()) {
        response.put("ok", true);
        response.put("data", goldenSet.get());
      } else {
        response.put("ok", false);
        response.put("error", "Golden Set not found");
      }
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to get Golden Set: " + e.getMessage());
    }
    
    return response;
  }
  
  // Create new Golden Set
  @PostMapping("/templates/{templateId}/golden-sets")
  public Map<String, Object> createGoldenSet(
      @PathVariable String templateId,
      @RequestBody GoldenSetDto goldenSetDto,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Parse user info to get userId
      @SuppressWarnings("unchecked")
      Map<String, Object> userMap = objectMapper.readValue(userInfo, Map.class);
      Object userIdObj = userMap.get("id");
      if (userIdObj == null) {
        response.put("ok", false);
        response.put("error", "Missing user ID");
        return response;
      }
      
      Long userId = Long.valueOf(userIdObj.toString());
      
      // Convert DTO to entity
      GoldenSet goldenSet = new GoldenSet();
      goldenSet.setTemplateId(templateId);
      goldenSet.setName(goldenSetDto.getName());
      goldenSet.setDescription(goldenSetDto.getDescription());
      goldenSet.setCategory(goldenSetDto.getCategory());
      goldenSet.setVersion(goldenSetDto.getVersion());
      
      // Create Golden Set
      GoldenSet created = goldenSetService.createGoldenSet(goldenSet, userId);
      
      response.put("ok", true);
      response.put("message", "Golden Set created successfully");
      response.put("data", created);
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to create Golden Set: " + e.getMessage());
    }
    
    return response;
  }
  
  // Update Golden Set
  @PutMapping("/golden-sets/{id}")
  public Map<String, Object> updateGoldenSet(
      @PathVariable Long id,
      @RequestBody GoldenSetDto goldenSetDto,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Parse user info to get userId
      @SuppressWarnings("unchecked")
      Map<String, Object> userMap = objectMapper.readValue(userInfo, Map.class);
      Object userIdObj = userMap.get("id");
      if (userIdObj == null) {
        response.put("ok", false);
        response.put("error", "Missing user ID");
        return response;
      }
      
      Long userId = Long.valueOf(userIdObj.toString());
      
      // Convert DTO to entity - properly handle samples field
      GoldenSet goldenSet = new GoldenSet();
      goldenSet.setId(goldenSetDto.getId());
      goldenSet.setName(goldenSetDto.getName());
      goldenSet.setDescription(goldenSetDto.getDescription());
      goldenSet.setCategory(goldenSetDto.getCategory());
      goldenSet.setVersion(goldenSetDto.getVersion());
      goldenSet.setIsDefault(goldenSetDto.getIsDefault());
      
      // Properly handle samples field to prevent cascade deletion
      if (goldenSetDto.getSamples() != null) {
          // Convert GoldenSampleDto to GoldenSetSample entity
        List<GoldenSetSample> samples = new ArrayList<>();
        for (GoldenSampleDto sampleDto : goldenSetDto.getSamples()) {
          GoldenSetSample sample = new GoldenSetSample();
          sample.setId(sampleDto.getId());
          sample.setSampleId(sampleDto.getSampleId());
          sample.setContent(sampleDto.getContent());
          sample.setExpectedResult(sampleDto.getExpectedResult());
          sample.setCategory(sampleDto.getCategory());
          sample.setSeverity(sampleDto.getSeverity());
          sample.setNotes(sampleDto.getNotes());
          sample.setAiStatus(sampleDto.getAiStatus() != null ? 
            GoldenSetSample.AiStatus.valueOf(sampleDto.getAiStatus()) : 
            GoldenSetSample.AiStatus.PENDING);
          sample.setCreatedAt(sampleDto.getCreatedAt());
          sample.setUpdatedAt(sampleDto.getUpdatedAt());
          samples.add(sample);
        }
        goldenSet.setSamples(samples);
      }
      
      // Update Golden Set
      GoldenSet updated = goldenSetService.updateGoldenSet(id, goldenSet, userId);
      
      response.put("ok", true);
      response.put("data", updated);
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to update Golden Set: " + e.getMessage());
    }
    
    return response;
  }
  
  // Delete Golden Set
  @DeleteMapping("/golden-sets/{id}")
  public Map<String, Object> deleteGoldenSet(
      @PathVariable Long id,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Parse user info to get userId
      @SuppressWarnings("unchecked")
      Map<String, Object> userMap = objectMapper.readValue(userInfo, Map.class);
      Object userIdObj = userMap.get("id");
      if (userIdObj == null) {
        response.put("ok", false);
        response.put("error", "Missing user ID");
        return response;
      }
      
      Long userId = Long.valueOf(userIdObj.toString());
      
      // Delete Golden Set
      goldenSetService.deleteGoldenSet(id, userId);
      
      response.put("ok", true);
      response.put("message", "Golden Set deleted successfully");
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to delete Golden Set: " + e.getMessage());
    }
    
    return response;
  }
  
  // Set Golden Set as default
  @PostMapping("/golden-sets/{id}/set-default")
  public Map<String, Object> setDefaultGoldenSet(
      @PathVariable Long id,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Parse user info to get userId
      @SuppressWarnings("unchecked")
      Map<String, Object> userMap = objectMapper.readValue(userInfo, Map.class);
      Object userIdObj = userMap.get("id");
      if (userIdObj == null) {
        response.put("ok", false);
        response.put("error", "Missing user ID");
        return response;
      }
      
      Long userId = Long.valueOf(userIdObj.toString());
      
      // Set Golden Set as default
      GoldenSet updated = goldenSetService.setDefaultGoldenSet(id, userId);
      
      response.put("ok", true);
      response.put("message", "Golden Set set as default successfully");
      response.put("data", updated);
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to set Golden Set as default: " + e.getMessage());
    }
    
    return response;
  }
  
  // Remove default status from Golden Set
  @PostMapping("/golden-sets/{id}/remove-default")
  public Map<String, Object> removeDefaultGoldenSet(
      @PathVariable Long id,
      @RequestHeader("X-User-Info") String userInfo) {
    
    Map<String, Object> response = new HashMap<>();
    
    try {
      // Parse user info to get userId
      @SuppressWarnings("unchecked")
      Map<String, Object> userMap = objectMapper.readValue(userInfo, Map.class);
      Object userIdObj = userMap.get("id");
      if (userIdObj == null) {
        response.put("ok", false);
        response.put("error", "Missing user ID");
        return response;
      }
      
      Long userId = Long.valueOf(userIdObj.toString());
      
      // Remove default status from Golden Set
      GoldenSet updated = goldenSetService.removeDefaultGoldenSet(id, userId);
      
      response.put("ok", true);
      response.put("message", "Default status removed from Golden Set successfully");
      response.put("data", updated);
      
    } catch (Exception e) {
      response.put("ok", false);
      response.put("error", "Failed to remove default status: " + e.getMessage());
    }
    
    return response;
  }
  
  /**
   * Safely cast Object to List<Map<String, Object>>
   * This method provides type-safe conversion and eliminates unchecked cast warnings
   */
  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> castToListOfMaps(Object obj) {
    if (obj instanceof List) {
      List<?> list = (List<?>) obj;
      // Check if all elements are Maps
      for (Object item : list) {
        if (!(item instanceof Map)) {
          return new ArrayList<>();
        }
      }
      // Safe cast after type checking
      List<Map<String, Object>> result = (List<Map<String, Object>>) obj;
      return result;
    }
    return new ArrayList<>();
  }
}
