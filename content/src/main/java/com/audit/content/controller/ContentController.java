    package com.audit.content.controller;

    import com.audit.content.dto.*;
    import com.audit.content.entity.AuditRecord;
    import com.audit.content.service.ContentAuditService;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.data.domain.Page;
    import org.springframework.web.bind.annotation.*;

    import java.util.List;
    import javax.annotation.PostConstruct;
    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;

    @RestController
    @RequestMapping("/api/content")
    public class ContentController {
        
        private static final Logger log = LoggerFactory.getLogger(ContentController.class);
        
        @Autowired
        private ContentAuditService contentAuditService;
        
        @PostConstruct
        public void init() {
            log.info("[Controller] ContentController initialized.");
            log.info("[Controller] Statistics endpoint should be available at: /api/content/statistics");
        }
        
        @PostMapping("/audit/text")
        public ApiResponse<AuditResult> auditText(@RequestHeader("X-User-Info") String userInfo,
                                                @RequestBody TextAuditRequest request) {
            try {
                System.out.println("=== CONTROLLER DEBUG ===");
                System.out.println("Content length: " + (request.getContent() != null ? request.getContent().length() : 0));
                System.out.println("TemplateConfig: " + (request.getTemplateConfig() != null ? "RECEIVED" : "NULL"));
                System.out.println("ForceRefresh: " + request.getForceRefresh() + " (type: " + (request.getForceRefresh() != null ? request.getForceRefresh().getClass().getSimpleName() : "null") + ")");
                
                // Debug: Log raw request data
                System.out.println("=== RAW REQUEST DEBUG ===");
                System.out.println("Raw request object: " + request);
                System.out.println("Raw request class: " + request.getClass().getName());
                System.out.println("Raw forceRefresh field: " + request.getForceRefresh());
                System.out.println("=========================");
                
                if (request.getTemplateConfig() != null) {
                    System.out.println("TemplateConfig keys: " + request.getTemplateConfig().keySet());
                    System.out.println("TemplateConfig size: " + request.getTemplateConfig().size());
                }
                System.out.println("========================");
                
                AuditResult result = contentAuditService.auditText(userInfo, request.getContent(), request.getTemplateConfig(), request.getForceRefresh());
                return ApiResponse.success(result);
            } catch (Exception e) {
                System.err.println("Controller Error: " + e.getMessage());
                e.printStackTrace();
                return ApiResponse.error(500, e.getMessage());
            }
        }
        
        @PostMapping("/audit/image")
        public ApiResponse<AuditResult> auditImage(@RequestHeader("X-User-Info") String userInfo,
                                                @RequestBody ImageAuditRequest request) {
            try {
                AuditResult result = contentAuditService.auditImage(userInfo, request.getImageUrl(), request.getImageBase64());
                return ApiResponse.success(result);
            } catch (Exception e) {
                return ApiResponse.error(500, e.getMessage());
            }
        }
        
        @PostMapping("/audit/batch")
        public ApiResponse<List<AuditResult>> auditBatch(@RequestHeader("X-User-Info") String userInfo,
                                                    @RequestBody BatchAuditRequest request) {
            try {
                List<AuditResult> results = contentAuditService.auditBatch(userInfo, request);
                return ApiResponse.success(results);
            } catch (Exception e) {
                return ApiResponse.error(500, e.getMessage());
            }
        }
        
        @GetMapping("/history")
        public ApiResponse<Page<AuditRecord>> getHistory(@RequestHeader("X-User-Info") String userInfo,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
            try {
                Page<AuditRecord> records = contentAuditService.getHistory(userInfo, page, size);
                return ApiResponse.success(records);
            } catch (Exception e) {
                return ApiResponse.error(500, e.getMessage());
            }
        }

        @GetMapping("/test")
        public ApiResponse<String> test() {
            log.info("Test endpoint called");
            return ApiResponse.success("ContentController is working!");
        }

        @PutMapping("/audit/{id}/review")
        public ApiResponse<String> reviewAudit(@RequestHeader("X-User-Info") String userInfo,
                                            @PathVariable Long id,
                                            @RequestBody ReviewRequest request) {
            try {
                contentAuditService.reviewAudit(userInfo, id, request);
                return ApiResponse.success("Review completed successfully");
            } catch (Exception e) {
                return ApiResponse.error(500, e.getMessage());
            }
        }

        @GetMapping("/statistics")
        public ApiResponse<AuditStatistics> getStatistics(@RequestHeader("X-User-Info") String userInfo) {
            log.info("[Controller] Statistics endpoint called with userInfo: {}", userInfo);
            try {
                AuditStatistics statistics = contentAuditService.getStatistics(userInfo);
                log.info("[Controller] Statistics retrieved successfully: {}", statistics);
                return ApiResponse.success(statistics);
            } catch (Exception e) {
                log.error("[Controller] Error getting statistics: {}", e.getMessage(), e);
                return ApiResponse.error(500, e.getMessage());
            }
        }
    } 