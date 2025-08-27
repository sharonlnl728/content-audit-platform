package com.audit.content.service;

import com.alibaba.fastjson.JSON;
import com.audit.content.client.AiServiceClient;
import com.audit.content.dto.*;
import com.audit.content.entity.AuditRecord;
import com.audit.content.repository.AuditRecordRepository;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;


import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.HashMap;

@Service
public class ContentAuditService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private AiServiceClient aiServiceClient;
    
    @Autowired
    private AuditRecordRepository auditRecordRepository;
    
    /**
     * Audit text content with template configuration and force refresh option
     */
    public AuditResult auditText(String userInfo, String content, Map<String, Object> templateConfig, Boolean forceRefresh) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Extract userId from userInfo (support both "id" and "userId" for backward compatibility)
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            userIdObj = userMap.get("userId"); // Fallback to "userId" for backward compatibility
        }
        if (userIdObj == null) {
            throw new RuntimeException("Missing userId in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        Long userId = Long.valueOf(userIdObj.toString());
        
        // 1. Calculate content hash (include template config in cache key if available)
        String cacheKey = "audit:text:" + DigestUtils.sha256Hex(content);
        if (templateConfig != null) {
            cacheKey += ":" + DigestUtils.sha256Hex(JSON.toJSONString(templateConfig));
        }
        
        // 2. Check cache (skip if force refresh is enabled)
        System.out.println("=== FORCE REFRESH DEBUG ===");
        System.out.println("forceRefresh parameter: " + forceRefresh);
        System.out.println("Will skip cache: " + (forceRefresh != null && forceRefresh));
        System.out.println("========================");
        
        if (forceRefresh == null || !forceRefresh) {
            AuditResult cachedResult = (AuditResult) redisTemplate.opsForValue().get(cacheKey);
            if (cachedResult != null) {
                System.out.println("Returning cached result");
                return cachedResult;
            }
        }
        
        // 3. Call AI model with template configuration
        System.out.println("=== SERVICE DEBUG ===");
        System.out.println("templateConfig received: " + (templateConfig != null));
        if (templateConfig != null) {
            System.out.println("templateConfig keys: " + templateConfig.keySet());
            System.out.println("templateConfig size: " + templateConfig.size());
            
            // Try to extract specific fields
            Object aiPromptTemplate = templateConfig.get("ai_prompt_template");
            System.out.println("ai_prompt_template: " + (aiPromptTemplate != null ? "FOUND" : "NULL"));
            
            if (aiPromptTemplate != null) {
                System.out.println("ai_prompt_template type: " + aiPromptTemplate.getClass().getSimpleName());
                System.out.println("ai_prompt_template content: " + aiPromptTemplate.toString().substring(0, Math.min(100, aiPromptTemplate.toString().length())));
                

            }
        }
        System.out.println("===================");
        
        AiTextAuditRequest aiRequest = new AiTextAuditRequest();
        aiRequest.setContent(content);
        aiRequest.setTemplateConfig(templateConfig);  // Pass template configuration
        
        System.out.println("aiRequest.templateConfig: " + (aiRequest.getTemplateConfig() != null));
        
        AiAuditResponse aiResponse = aiServiceClient.auditText(aiRequest);
        
        // 4. Build audit result
        AuditResult result = new AuditResult();
        result.setContentHash(DigestUtils.sha256Hex(content));
        result.setContentType("TEXT");
        result.setIsViolation(aiResponse.getIsViolation() != null ? aiResponse.getIsViolation() : false);
        result.setConfidence(aiResponse.getConfidence());
        result.setReason(aiResponse.getReason());
        result.setCategories(aiResponse.getCategories());
        
        // Determine status based on confidence
        if (aiResponse.getConfidence() > 0.9) {
            result.setStatus(aiResponse.getIsViolation() != null && aiResponse.getIsViolation() ? "REJECT" : "PASS");
        } else {
            result.setStatus("REVIEW");
        }
        
        result.setTimestamp(System.currentTimeMillis());
        
        // 5. Cache result (24 hours)
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        
        // 6. Asynchronously record audit log
        CompletableFuture.runAsync(() -> saveAuditRecord(userId, content, null, result, aiResponse));
        
        return result;
    }
    
    /**
     * Audit text content without template configuration (backward compatibility)
     */
    public AuditResult auditText(String userInfo, String content) {
        return auditText(userInfo, content, null, false);
    }
    
    public AuditResult auditImage(String userInfo, String imageUrl, String imageBase64) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Extract userId from userInfo (support both "id" and "userId" for backward compatibility)
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            userIdObj = userMap.get("userId"); // Fallback to "userId" for backward compatibility
        }
        if (userIdObj == null) {
            throw new RuntimeException("Missing userId in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        Long userId = Long.valueOf(userIdObj.toString());
        
        // 1. Calculate content hash
        String content = imageUrl != null ? imageUrl : imageBase64;
        String contentHash = DigestUtils.sha256Hex(content);
        String cacheKey = "audit:image:" + contentHash;
        
        // 2. Check cache
        AuditResult cachedResult = (AuditResult) redisTemplate.opsForValue().get(cacheKey);
        if (cachedResult != null) {
            return cachedResult;
        }
        
        // 3. Call AI model
        AiImageAuditRequest aiRequest = new AiImageAuditRequest();
        aiRequest.setImageUrl(imageUrl);
        aiRequest.setImageBase64(imageBase64);
        
        AiAuditResponse aiResponse = aiServiceClient.auditImage(aiRequest);
        
        // 4. Build audit result
        AuditResult result = new AuditResult();
        result.setContentHash(contentHash);
        result.setContentType("IMAGE");
        result.setIsViolation(aiResponse.getIsViolation() != null ? aiResponse.getIsViolation() : false);
        result.setConfidence(aiResponse.getConfidence());
        result.setReason(aiResponse.getReason());
        result.setCategories(aiResponse.getCategories());
        
        // Determine status based on confidence
        if (aiResponse.getConfidence() > 0.9) {
            result.setStatus(aiResponse.getIsViolation() != null && aiResponse.getIsViolation() ? "REJECT" : "PASS");
        } else {
            result.setStatus("REVIEW");
        }
        
        result.setTimestamp(System.currentTimeMillis());
        
        // 5. Cache result (24 hours)
        redisTemplate.opsForValue().set(cacheKey, result, 24, TimeUnit.HOURS);
        
        // 6. Asynchronously record audit log
        CompletableFuture.runAsync(() -> saveAuditRecord(userId, null, imageUrl, result, aiResponse));
        
        return result;
    }
    
    public List<AuditResult> auditBatch(String userInfo, BatchAuditRequest request) {
        List<AuditResult> results = new ArrayList<>();
        
        for (BatchAuditRequest.AuditItem item : request.getItems()) {
            try {
                AuditResult result;
                if ("TEXT".equals(item.getType())) {
                    // Pass templateConfig to auditText method
                    result = auditText(userInfo, item.getContent(), item.getTemplateConfig(), false);
                } else {
                    result = auditImage(userInfo, item.getContent(), null);
                }
                
                // If this is a Study-related audit, update the Study record
                if (item.getStudyId() != null && item.getRecordId() != null) {
                    updateStudyRecord(item.getStudyId(), item.getRecordId(), result);
                }
                
                results.add(result);
            } catch (Exception e) {
                AuditResult errorResult = new AuditResult();
                errorResult.setStatus("ERROR");
                errorResult.setReason("Audit failed: " + e.getMessage());
                results.add(errorResult);
                
                // If this is a Study-related audit, also update the Study record status to error
                if (item.getStudyId() != null && item.getRecordId() != null) {
                    updateStudyRecordError(item.getStudyId(), item.getRecordId(), e.getMessage());
                }
            }
        }
        
        return results;
    }
    
    public Page<AuditRecord> getHistory(String userInfo, int page, int size) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        
        // Extract userId from userInfo
        Object userIdObj = userMap.get("id");
        if (userIdObj == null) {
            throw new RuntimeException("Missing id in user info. Please clear browser storage and login again. User info: " + userInfo);
        }
        Long userId = Long.valueOf(userIdObj.toString());
        
        PageRequest pageRequest = PageRequest.of(page, size, 
                Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return auditRecordRepository.findByUserId(userId, pageRequest);
    }

    public void reviewAudit(String userInfo, Long auditId, ReviewRequest request) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        Long reviewerId = Long.valueOf(userMap.get("id").toString());
        
        AuditRecord record = auditRecordRepository.findById(auditId)
                .orElseThrow(() -> new RuntimeException("Audit record not found"));
        
        // Check permissions: can only review own content
        if (!record.getUserId().equals(reviewerId)) {
            throw new RuntimeException("You can only review your own content");
        }
        
        // Check status: can only review REVIEW status content
        if (record.getStatus() != AuditRecord.AuditStatus.REVIEW) {
            throw new RuntimeException("Only REVIEW status records can be manually reviewed");
        }
        
        // Update review status
        record.setStatus(AuditRecord.AuditStatus.valueOf(request.getStatus()));
        record.setManualResult(JSON.parseObject(JSON.toJSONString(request), Map.class));
        record.setReviewerId(reviewerId);
        record.setReviewedAt(LocalDateTime.now());
        
        auditRecordRepository.save(record);
    }
    
    public AuditStatistics getStatistics(String userInfo) {
        @SuppressWarnings("unchecked")
        Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
        Long userId = Long.valueOf(userMap.get("id").toString());
        
        AuditStatistics statistics = new AuditStatistics();
        statistics.setTotalCount(auditRecordRepository.countByUserId(userId));
        statistics.setPassCount(auditRecordRepository.countByUserIdAndStatus(userId, AuditRecord.AuditStatus.PASS));
        statistics.setRejectCount(auditRecordRepository.countByUserIdAndStatus(userId, AuditRecord.AuditStatus.REJECT));
        statistics.setReviewCount(auditRecordRepository.countByUserIdAndStatus(userId, AuditRecord.AuditStatus.REVIEW));
        statistics.setTextCount(auditRecordRepository.countByUserIdAndContentType(userId, AuditRecord.ContentType.TEXT));
        statistics.setImageCount(auditRecordRepository.countByUserIdAndContentType(userId, AuditRecord.ContentType.IMAGE));
        
        // Generate trend data for the last 7 days
        List<TrendData> trendData = generateTrendData(userId);
        statistics.setTrendData(trendData);
        
        return statistics;
    }
    
    private List<TrendData> generateTrendData(Long userId) {
        List<TrendData> trendData = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        
        // Generate data for the last 7 days
        for (int i = 6; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            String dateStr = date.format(formatter);
            
            // Query actual data from database for this date
            Long pass = auditRecordRepository.countByUserIdAndStatusAndDate(userId, AuditRecord.AuditStatus.PASS, date);
            Long reject = auditRecordRepository.countByUserIdAndStatusAndDate(userId, AuditRecord.AuditStatus.REJECT, date);
            Long review = auditRecordRepository.countByUserIdAndStatusAndDate(userId, AuditRecord.AuditStatus.REVIEW, date);
            
            trendData.add(new TrendData(dateStr, pass, reject, review));
        }
        
        return trendData;
    }
    
    private void saveAuditRecord(Long userId, String contentText, String contentUrl, 
                               AuditResult result, AiAuditResponse aiResponse) {
        try {
            AuditRecord record = new AuditRecord();
            record.setUserId(userId);
            record.setContentType(AuditRecord.ContentType.valueOf(result.getContentType()));
            record.setContentText(contentText);
            record.setContentUrl(contentUrl);
            record.setContentHash(result.getContentHash());
            record.setAuditResult(JSON.parseObject(JSON.toJSONString(result), Map.class));
            record.setConfidence(new BigDecimal(result.getConfidence()));
            
            // Handle null status
            String status = result.getStatus();
            if (status != null && !status.isEmpty()) {
                record.setStatus(AuditRecord.AuditStatus.valueOf(status));
            } else {
                record.setStatus(AuditRecord.AuditStatus.REVIEW);
            }
            
            record.setAiResult(JSON.parseObject(JSON.toJSONString(aiResponse), Map.class));
            
            auditRecordRepository.save(record);
        } catch (Exception e) {
            // Log the error, but do not affect the main flow
            e.printStackTrace();
        }
    }

    /**
     * Update Study record status and results
     */
    private void updateStudyRecord(Long studyId, Long recordId, AuditResult auditResult) {
        try {
            // Build update request
            Map<String, Object> updateRequest = new HashMap<>();
            updateRequest.put("status", auditResult.getStatus());
            updateRequest.put("confidence", auditResult.getConfidence());
            updateRequest.put("reason", auditResult.getReason());
            updateRequest.put("aiResult", JSON.toJSONString(auditResult));
            updateRequest.put("reviewedAt", LocalDateTime.now().toString());
            
            // Call Study Service to update record
            // Use RestTemplate to call Study Service
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://audit-study:8085/api/study/" + studyId + "/records/" + recordId + "/update-from-audit";
            
            System.out.println("DEBUG: Updating study record - Study ID: " + studyId + ", Record ID: " + recordId);
            System.out.println("DEBUG: Update URL: " + url);
            System.out.println("DEBUG: Update data: " + JSON.toJSONString(updateRequest));
            
            // Send PUT request to Study Service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updateRequest, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("DEBUG: Successfully updated study record via HTTP call");
            } else {
                System.err.println("DEBUG: Failed to update study record, HTTP status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("Failed to update study record: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Update Study record to error status
     */
    private void updateStudyRecordError(Long studyId, Long recordId, String errorMessage) {
        try {
            Map<String, Object> updateRequest = new HashMap<>();
            updateRequest.put("status", "REJECT");
            updateRequest.put("reason", "AI processing failed: " + errorMessage);
            updateRequest.put("aiResult", "{\"error\":\"" + errorMessage + "\"}");
            updateRequest.put("reviewedAt", LocalDateTime.now().toString());
            
            // Call Study Service to update record
            RestTemplate restTemplate = new RestTemplate();
            String url = "http://audit-study:8085/api/study/" + studyId + "/records/" + recordId + "/update-from-audit";
            
            System.out.println("DEBUG: Updating study record with error - Study ID: " + studyId + ", Record ID: " + recordId);
            System.out.println("DEBUG: Error URL: " + url);
            System.out.println("DEBUG: Error data: " + JSON.toJSONString(updateRequest));
            
            // Send PUT request to Study Service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(updateRequest, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("DEBUG: Successfully updated study record with error via HTTP call");
            } else {
                System.err.println("DEBUG: Failed to update study record with error, HTTP status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            System.err.println("Failed to update study record with error: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 