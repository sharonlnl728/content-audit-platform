package com.audit.study.controller;

import com.audit.study.dto.ApiResponse;
import com.audit.study.dto.StudyDto;

import com.audit.study.dto.StudyRecordBatchRequest;
import com.audit.study.dto.StudyRecordDto;

import com.audit.study.service.StudyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/study")
public class StudyController {
    
    @Autowired
    private StudyService studyService;
    
    @GetMapping
    public ApiResponse<List<StudyDto>> getStudies(@RequestHeader("X-User-Info") String userInfo) {
        try {
            List<StudyDto> studies = studyService.getStudies(userInfo);
            return ApiResponse.success(studies);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @GetMapping("/{id}")
    public ApiResponse<StudyDto> getStudy(@RequestHeader("X-User-Info") String userInfo,
                                        @PathVariable Long id) {
        try {
            StudyDto study = studyService.getStudy(userInfo, id);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @PostMapping
    public ApiResponse<StudyDto> createStudy(@RequestHeader("X-User-Info") String userInfo,
                                           @RequestBody StudyDto studyDto) {
        try {
            StudyDto study = studyService.createStudy(userInfo, studyDto);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ApiResponse<StudyDto> updateStudy(@RequestHeader("X-User-Info") String userInfo,
                                           @PathVariable Long id,
                                           @RequestBody StudyDto studyDto) {
        try {
            StudyDto study = studyService.updateStudy(userInfo, id, studyDto);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteStudy(@RequestHeader("X-User-Info") String userInfo,
                                         @PathVariable Long id) {
        try {
            studyService.deleteStudy(userInfo, id);
            return ApiResponse.success("Study deleted successfully");
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping("/{id}/records:batch")
    public ApiResponse<StudyDto> addRecordsBatch(@RequestHeader("X-User-Info") String userInfo,
                                                 @PathVariable Long id,
                                                 @RequestBody StudyRecordBatchRequest request) {
        try {
            StudyDto study = studyService.addRecordsBatch(userInfo, id, request);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping("/{id}/start")
    public ApiResponse<StudyDto> startStudy(@RequestHeader("X-User-Info") String userInfo,
                                            @PathVariable Long id,
                                            @RequestParam(value = "templateId", required = false) String templateId) {
        try {
            StudyDto study = studyService.startStudy(userInfo, id, templateId);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * Lock template to specified Study
     */
    @PostMapping("/{id}/lock-template")
    public ApiResponse<StudyDto> lockTemplate(@RequestHeader("X-User-Info") String userInfo,
                                             @PathVariable Long id,
                                             @RequestParam Long templateId) {
        try {
            StudyDto study = studyService.lockTemplate(userInfo, id, templateId);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    /**
     * Update Study record status and results (called by Content Service)
     */
    @PutMapping("/{studyId}/records/{recordId}/update-from-audit")
    public ApiResponse<String> updateRecordFromAudit(@PathVariable Long studyId,
                                                   @PathVariable Long recordId,
                                                   @RequestBody Map<String, Object> updateRequest) {
        try {
            studyService.updateRecordFromAudit(studyId, recordId, updateRequest);
            return ApiResponse.success("Record updated successfully");
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @PostMapping(path = "/{id}/records:upload", consumes = {"multipart/form-data"})
    public ApiResponse<StudyDto> uploadRecords(
            @RequestHeader("X-User-Info") String userInfo,
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "format", required = false) String format,
            @RequestParam(value = "defaultContentType", required = false) String defaultContentType,
            @RequestParam(value = "startImmediately", required = false, defaultValue = "false") boolean startImmediately
    ) {
        try {
            StudyDto study = studyService.uploadRecords(userInfo, id, file, format, defaultContentType, startImmediately);
            return ApiResponse.success(study);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }

    @GetMapping("/{id}/records")
    public ApiResponse<List<StudyRecordDto>> getStudyRecords(
            @RequestHeader("X-User-Info") String userInfo,
            @PathVariable Long id,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "contentType", required = false) String contentType,
            @RequestParam(value = "q", required = false) String keyword,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size
    ) {
        try {
            List<StudyRecordDto> records = studyService.getStudyRecords(userInfo, id, status, contentType, keyword, page, size);
            return ApiResponse.success(records);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
} 