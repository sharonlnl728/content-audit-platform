package com.audit.content.client;

import com.audit.content.dto.AiAuditResponse;
import com.audit.content.dto.AiImageAuditRequest;
import com.audit.content.dto.AiTextAuditRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "ai-service", url = "${ai.service.url}")
public interface AiServiceClient {
    
    @PostMapping("/ai/text/audit")
    AiAuditResponse auditText(@RequestBody AiTextAuditRequest request);
    
    @PostMapping("/ai/image/audit")
    AiAuditResponse auditImage(@RequestBody AiImageAuditRequest request);
} 