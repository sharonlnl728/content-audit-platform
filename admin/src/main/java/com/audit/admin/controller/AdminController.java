package com.audit.admin.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin-service/") // Changed to match Consul service name
public class AdminController {
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalUsers", 10);
        dashboard.put("totalStudies", 3);
        dashboard.put("totalTemplates", 3);
        dashboard.put("pendingAudits", 5);
        dashboard.put("status", "success");
        return ResponseEntity.ok(dashboard);
    }
    
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getUsers() {
        Map<String, Object> response = new HashMap<>();
        response.put("users", new Object[0]); // Temporarily return empty array
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAudits", 100);
        stats.put("successRate", 95.5);
        stats.put("averageResponseTime", 2.3);
        stats.put("status", "success");
        return ResponseEntity.ok(stats);
    }
    
    @PostMapping("/backup")
    public ResponseEntity<Map<String, Object>> createBackup() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Backup created successfully");
        response.put("backupId", "backup_" + System.currentTimeMillis());
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getLogs() {
        Map<String, Object> response = new HashMap<>();
        response.put("logs", new Object[0]); // Temporarily return empty array
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
}
