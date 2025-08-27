package com.audit.study.service;

import com.audit.study.dto.StudyDto;
import com.audit.study.dto.StudyRecordBatchRequest;
import com.audit.study.dto.StudyRecordDto;
import com.audit.study.dto.StudyRecordsPageResponse;
import com.audit.study.entity.Study;
import com.audit.study.entity.StudyRecord;
import com.audit.study.repository.StudyRepository;
import com.audit.study.repository.StudyRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class StudyService {
    
    @Autowired
    private StudyRepository studyRepository;
    
    @Autowired
    private StudyRecordRepository studyRecordRepository;
    
    public List<StudyDto> getStudies(String userInfo) {
        Long userId = extractUserId(userInfo);
        List<Study> studies = studyRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return studies.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    public StudyDto getStudy(String userInfo, Long studyId) {
        Long userId = extractUserId(userInfo);
        Optional<Study> study = studyRepository.findByIdAndUserId(studyId, userId);
        if (study.isPresent()) {
            return convertToDto(study.get());
        }
        throw new RuntimeException("Study not found");
    }
    
    public StudyDto createStudy(String userInfo, StudyDto studyDto) {
        Long userId = extractUserId(userInfo);
        
        Study study = new Study();
        study.setName(studyDto.getName());
        study.setDescription(studyDto.getDescription());
        study.setUserId(userId);
        
        Study savedStudy = studyRepository.save(study);
        return convertToDto(savedStudy);
    }
    
    public StudyDto updateStudy(String userInfo, Long studyId, StudyDto studyDto) {
        Long userId = extractUserId(userInfo);
        Optional<Study> studyOpt = studyRepository.findByIdAndUserId(studyId, userId);
        
        if (studyOpt.isPresent()) {
            Study study = studyOpt.get();
            study.setName(studyDto.getName());
            study.setDescription(studyDto.getDescription());
            
            Study savedStudy = studyRepository.save(study);
            return convertToDto(savedStudy);
        }
        throw new RuntimeException("Study not found");
    }
    
    public void deleteStudy(String userInfo, Long studyId) {
        Long userId = extractUserId(userInfo);
        Optional<Study> study = studyRepository.findByIdAndUserId(studyId, userId);
        if (study.isPresent()) {
            studyRepository.delete(study.get());
        } else {
            throw new RuntimeException("Study not found");
        }
    }

    @Transactional
    public StudyDto addRecordsBatch(String userInfo, Long studyId, StudyRecordBatchRequest request) {
        Long userId = extractUserId(userInfo);
        Study study = studyRepository.findByIdAndUserId(studyId, userId).orElseThrow(() -> new RuntimeException("Study not found"));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            return convertToDto(study);
        }

        for (StudyRecordBatchRequest.Item item : request.getItems()) {
            StudyRecord record = new StudyRecord();
            record.setStudy(study);
            record.setContent(item.getContent());
            record.setContentType(item.getContentType());
            record.setStatus(StudyRecord.RecordStatus.PENDING);
            studyRecordRepository.save(record);
        }

        return convertToDto(study);
    }

    @Transactional
    public StudyDto startStudy(String userInfo, Long studyId, String templateId) {
        Long userId = extractUserId(userInfo);
        Study study = studyRepository.findByIdAndUserId(studyId, userId).orElseThrow(() -> new RuntimeException("Study not found"));

        // Now AI processing is handled by Content Service, here we just mark Study as processing
        // Actual AI processing will be done through Content Service's batch review interface
        
        System.out.println("DEBUG: Study " + studyId + " marked for AI processing with template " + templateId);
        System.out.println("DEBUG: AI processing will be handled by Content Service");
        
        // Can add some status update logic here, such as marking Study as "PROCESSING" status
        // But specific record processing is handled by Content Service
        
        return convertToDto(study);
    }

    /**
     * Lock template to specified Study
     */
    @Transactional
    public StudyDto lockTemplate(String userInfo, Long studyId, Long templateId) {
        Long userId = extractUserId(userInfo);
        Study study = studyRepository.findByIdAndUserId(studyId, userId).orElseThrow(() -> new RuntimeException("Study not found"));
        
        // Lock template
        study.setTemplateId(templateId);
        study.setTemplateLockedAt(java.time.LocalDateTime.now());
        study.setTemplateLockedBy(userId);
        
        Study savedStudy = studyRepository.save(study);
        System.out.println("DEBUG: Template " + templateId + " locked for Study " + studyId + " by user " + userId);
        
        return convertToDto(savedStudy);
    }

    private String safeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
    
    /**
     * Update Study record status and results (called by Content Service)
     */
    @Transactional
    public void updateRecordFromAudit(Long studyId, Long recordId, Map<String, Object> updateRequest) {
        try {
            System.out.println("DEBUG: updateRecordFromAudit called with studyId=" + studyId + ", recordId=" + recordId);
            System.out.println("DEBUG: updateRequest: " + updateRequest);
            
            // Find Study record
            StudyRecord record = studyRecordRepository.findById(recordId)
                    .orElseThrow(() -> new RuntimeException("Study record not found"));
            
            // Verify record belongs to specified Study
            if (!record.getStudy().getId().equals(studyId)) {
                throw new RuntimeException("Record does not belong to the specified study");
            }
            
            // Update status
            String status = (String) updateRequest.get("status");
            if (status != null) {
                try {
                    record.setStatus(StudyRecord.RecordStatus.valueOf(status.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    System.err.println("Invalid status: " + status + ", keeping current status");
                }
            }
            
            // Update confidence
            Object confidenceObj = updateRequest.get("confidence");
            if (confidenceObj != null) {
                if (confidenceObj instanceof Number) {
                    record.setConfidence(((Number) confidenceObj).doubleValue());
                } else if (confidenceObj instanceof String) {
                    try {
                        record.setConfidence(Double.parseDouble((String) confidenceObj));
                    } catch (NumberFormatException e) {
                        System.err.println("Invalid confidence value: " + confidenceObj);
                    }
                }
            }
            
            // Update reason
            String reason = (String) updateRequest.get("reason");
            if (reason != null) {
                record.setReason(reason);
            }
            
            // Update AI result
            Object aiResultObj = updateRequest.get("aiResult");
            if (aiResultObj != null) {
                if (aiResultObj instanceof String) {
                    record.setAiResult((String) aiResultObj);
                } else {
                    try {
                        ObjectMapper objectMapper = new ObjectMapper();
                        record.setAiResult(objectMapper.writeValueAsString(aiResultObj));
                    } catch (Exception e) {
                        record.setAiResult(aiResultObj.toString());
                    }
                }
            }
            
            // Update review time
            String reviewedAtStr = (String) updateRequest.get("reviewedAt");
            if (reviewedAtStr != null) {
                try {
                    record.setReviewedAt(java.time.LocalDateTime.parse(reviewedAtStr));
                } catch (Exception e) {
                    record.setReviewedAt(java.time.LocalDateTime.now());
                }
            } else {
                record.setReviewedAt(java.time.LocalDateTime.now());
            }
            
            // Update reviewer ID
            Object reviewerIdObj = updateRequest.get("reviewerId");
            if (reviewerIdObj != null) {
                if (reviewerIdObj instanceof Number) {
                    record.setReviewerId(((Number) reviewerIdObj).longValue());
                } else if (reviewerIdObj instanceof String) {
                    try {
                        record.setReviewerId(Long.parseLong((String) reviewerIdObj));
                    } catch (NumberFormatException e) {
                        System.err.println("Invalid reviewer ID value: " + reviewerIdObj);
                    }
                }
            }
            
            // Update manual result
            String manualResultStr = (String) updateRequest.get("manualResult");
            if (manualResultStr != null) {
                try {
                    record.setManualResult(StudyRecord.ManualResult.valueOf(manualResultStr.toUpperCase()));
                } catch (IllegalArgumentException e) {
                    System.err.println("Invalid manual result: " + manualResultStr + ", keeping current value");
                }
            }
            
            // Save updates
            studyRecordRepository.save(record);
            
            System.out.println("DEBUG: Successfully updated study record - Study ID: " + studyId + ", Record ID: " + recordId);
            System.out.println("DEBUG: New status: " + record.getStatus() + ", Confidence: " + record.getConfidence());
            
        } catch (Exception e) {
            System.err.println("Failed to update study record: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to update study record: " + e.getMessage(), e);
        }
    }

    private AiAuditResult callAiTextAudit(String content, String templateId) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "http://audit-ai-service:8083/ai/text/audit";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Build request body with content and template_config
        String requestBody;
        if (templateId != null && !templateId.isBlank()) {
            // If templateId exists, try to get template configuration
            try {
                // Call template service to get configuration - using correct port and path
                String templateUrl = "http://audit-template-service:8082/api/template/" + templateId;
                System.out.println("DEBUG: Fetching template config from: " + templateUrl);
                
                ResponseEntity<String> templateResponse = restTemplate.getForEntity(templateUrl, String.class);
                if (templateResponse.getStatusCode().is2xxSuccessful()) {
                    // Parse template configuration
                    String templateConfig = templateResponse.getBody();
                    System.out.println("DEBUG: Template config received: " + templateConfig);
                    
                    // Build request with template_config
                    requestBody = "{\"content\": " + toJsonString(content) + ", \"template_config\": " + templateConfig + "}";
                    System.out.println("DEBUG: Request body with template: " + requestBody);
                } else {
                    // If template fetch fails, use default configuration
                    System.out.println("DEBUG: Failed to get template config, status: " + templateResponse.getStatusCode());
                    requestBody = "{\"content\": " + toJsonString(content) + "}";
                }
            } catch (Exception e) {
                // If template fetch fails, use default configuration
                System.out.println("DEBUG: Exception getting template config: " + e.getMessage());
                requestBody = "{\"content\": " + toJsonString(content) + "}";
            }
        } else {
            // No templateId provided, use default configuration
            System.out.println("DEBUG: No templateId provided, using default config");
            requestBody = "{\"content\": " + toJsonString(content) + "}";
        }
        
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
        return restTemplate.postForObject(url, entity, AiAuditResult.class);
    }

    private String toJsonString(String s) {
        if (s == null) return "\"\"";
        String escaped = s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return "\"" + escaped + "\"";
    }

    public static class AiAuditResult {
        public Boolean isViolation;
        public Double confidence;
        public String reason;
        public String categories; // keep raw JSON array string if available
    }

    @Transactional
    public StudyDto uploadRecords(String userInfo,
                                  Long studyId,
                                  MultipartFile file,
                                  String format,
                                  String defaultContentType,
                                  boolean startImmediately) {
        Long userId = extractUserId(userInfo);
        Study study = studyRepository.findByIdAndUserId(studyId, userId).orElseThrow(() -> new RuntimeException("Study not found"));

        try {
            String fmt = (format == null || format.isBlank()) ? guessFormat(file.getOriginalFilename()) : format.toLowerCase();
            StudyRecord.ContentType fallbackType = parseContentType(defaultContentType);

            if ("csv".equals(fmt) || "txt".equals(fmt) || "jsonl".equals(fmt)) {
                String content = new String(file.getBytes());
                List<StudyRecord> toSave = new java.util.ArrayList<>();
                for (String line : content.split("\r?\n")) {
                    String trimmed = line.trim();
                    if (trimmed.isEmpty()) continue;
                    StudyRecord rec = new StudyRecord();
                    rec.setStudy(study);
                    rec.setContent(trimmed);
                    rec.setContentType(fallbackType == null ? StudyRecord.ContentType.TEXT : fallbackType);
                    rec.setStatus(StudyRecord.RecordStatus.PENDING);
                    toSave.add(rec);
                }
                studyRecordRepository.saveAll(toSave);
            } else if ("zip".equals(fmt)) {
                // Minimal placeholder: treat as unsupported for now
                throw new RuntimeException("ZIP upload not yet supported in this minimal implementation");
            } else {
                throw new RuntimeException("Unsupported format: " + fmt);
            }

            if (startImmediately) {
                startStudy(userInfo, studyId, null);
            }
            return convertToDto(study);
        } catch (Exception ex) {
            throw new RuntimeException("Upload failed: " + ex.getMessage(), ex);
        }
    }

    public List<StudyRecordDto> getStudyRecords(String userInfo,
                                                Long studyId,
                                                String status,
                                                String contentType,
                                                String keyword,
                                                int page,
                                                int size) {
        System.out.println("DEBUG: getStudyRecords called with userInfo=" + userInfo + ", studyId=" + studyId + ", size=" + size);
        
        Long userId = extractUserId(userInfo);
        System.out.println("DEBUG: extracted userId=" + userId);
        
        Study study = studyRepository.findByIdAndUserId(studyId, userId)
                .orElseThrow(() -> new RuntimeException("Study not found"));
        System.out.println("DEBUG: found study=" + study.getId());

        List<StudyRecord> all = studyRecordRepository.findByStudyIdOrderByCreatedAtDesc(study.getId());
        System.out.println("DEBUG: found " + all.size() + " records in database");
        
        java.util.stream.Stream<StudyRecord> stream = all.stream();
        if (status != null && !status.isBlank()) {
            try {
                StudyRecord.RecordStatus st = StudyRecord.RecordStatus.valueOf(status.toUpperCase());
                stream = stream.filter(r -> r.getStatus() == st);
            } catch (IllegalArgumentException ignored) {}
        }
        if (contentType != null && !contentType.isBlank()) {
            try {
                StudyRecord.ContentType ct = StudyRecord.ContentType.valueOf(contentType.toUpperCase());
                stream = stream.filter(r -> r.getContentType() == ct);
            } catch (IllegalArgumentException ignored) {}
        }
        if (keyword != null && !keyword.isBlank()) {
            String kw = keyword.toLowerCase();
            stream = stream.filter(r -> r.getContent() != null && r.getContent().toLowerCase().contains(kw));
        }
        List<StudyRecord> filtered = stream.collect(Collectors.toList());
        System.out.println("DEBUG: after filtering, " + filtered.size() + " records");
        
        // If size <= 0, return all records; otherwise paginate
        if (size <= 0) {
            List<StudyRecordDto> result = filtered.stream().map(StudyRecordDto::new).collect(Collectors.toList());
            System.out.println("DEBUG: returning " + result.size() + " records (size <= 0)");
            return result;
        }
        
        // Pagination logic
        int from = Math.max(0, page * size);
        int to = Math.min(filtered.size(), from + size);
        System.out.println("DEBUG: pagination - page=" + page + ", size=" + size + ", filtered.size=" + filtered.size() + ", from=" + from + ", to=" + to);
        if (from >= filtered.size()) {
            System.out.println("DEBUG: no records in page range, returning empty list");
            return java.util.Collections.emptyList();
        }
        List<StudyRecordDto> result = filtered.subList(from, to).stream().map(StudyRecordDto::new).collect(Collectors.toList());
        System.out.println("DEBUG: returning " + result.size() + " records (paginated from " + from + " to " + to + ")");
        System.out.println("DEBUG: total records in database: " + filtered.size());
        return result;
    }

    private String guessFormat(String filename) {
        if (filename == null) return "txt";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".csv")) return "csv";
        if (lower.endsWith(".jsonl")) return "jsonl";
        if (lower.endsWith(".txt")) return "txt";
        if (lower.endsWith(".zip")) return "zip";
        return "txt";
    }

    private StudyRecord.ContentType parseContentType(String val) {
        if (val == null) return null;
        String v = val.trim().toUpperCase();
        try {
            return StudyRecord.ContentType.valueOf(v);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
    
    private StudyDto convertToDto(Study study) {
        StudyDto dto = new StudyDto(study);
        
        // Calculate statistics
        Long totalRecords = studyRecordRepository.countByStudyId(study.getId());
        Long reviewedRecords = studyRecordRepository.countReviewedByStudyId(study.getId());
        Long pendingRecords = studyRecordRepository.countPendingByStudyId(study.getId());
        
        dto.setTotalRecords(totalRecords.intValue());
        dto.setReviewedRecords(reviewedRecords.intValue());
        dto.setPendingRecords(pendingRecords.intValue());
        
        return dto;
    }
    
    private Long extractUserId(String userInfo) {
        // Parse JSON to extract user ID
        try {
            // Parse JSON like {"role":"ADMIN","id":1,"username":"admin"}
            if (userInfo.contains("\"id\":")) {
                // Find the id field value
                int idIndex = userInfo.indexOf("\"id\":");
                int startIndex = idIndex + 5; // Skip "id":
                int endIndex = userInfo.indexOf(",", startIndex);
                if (endIndex == -1) {
                    endIndex = userInfo.indexOf("}", startIndex);
                }
                if (endIndex != -1) {
                    String idStr = userInfo.substring(startIndex, endIndex).trim();
                    return Long.parseLong(idStr);
                }
            }
            return 1L; // Default user ID
        } catch (Exception e) {
            return 1L; // Default user ID
        }
    }
} 