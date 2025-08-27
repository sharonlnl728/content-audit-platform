package com.audit.template.controller;

import com.audit.template.dto.AuditTemplateDto;
import com.audit.template.dto.ApiResponse;
import com.audit.template.service.AuditTemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/template")
public class AuditTemplateController {
    
    @Autowired
    private AuditTemplateService templateService;
    
    @GetMapping
    public ApiResponse<List<AuditTemplateDto>> getTemplates(@RequestHeader("X-User-Info") String userInfo) {
        try {
            List<AuditTemplateDto> templates = templateService.getTemplates(userInfo);
            return ApiResponse.success(templates);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ApiResponse<AuditTemplateDto> getTemplate(@RequestHeader("X-User-Info") String userInfo,
                                                   @PathVariable Long id) {
        try {
            AuditTemplateDto template = templateService.getTemplate(userInfo, id);
            return ApiResponse.success(template);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @PostMapping
    public ApiResponse<AuditTemplateDto> createTemplate(@RequestHeader("X-User-Info") String userInfo,
                                                      @RequestBody AuditTemplateDto templateDto) {
        try {
            AuditTemplateDto template = templateService.createTemplate(userInfo, templateDto);
            return ApiResponse.success(template);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<AuditTemplateDto> updateTemplate(@RequestHeader("X-User-Info") String userInfo,
                                                      @PathVariable Long id,
                                                      @RequestBody AuditTemplateDto templateDto) {
        try {
            AuditTemplateDto template = templateService.updateTemplate(userInfo, id, templateDto);
            return ApiResponse.success(template);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteTemplate(@RequestHeader("X-User-Info") String userInfo,
                                            @PathVariable Long id) {
        try {
            templateService.deleteTemplate(userInfo, id);
            return ApiResponse.success("Template deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @PostMapping("/{id}/set-default")
    public ApiResponse<AuditTemplateDto> setDefaultTemplate(@RequestHeader("X-User-Info") String userInfo,
                                                          @PathVariable Long id) {
        try {
            AuditTemplateDto template = templateService.setDefaultTemplate(userInfo, id);
            return ApiResponse.success(template);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
} 