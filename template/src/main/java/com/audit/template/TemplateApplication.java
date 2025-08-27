package com.audit.template;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@EnableDiscoveryClient
@ComponentScan(basePackages = {"com.audit.template"})
public class TemplateApplication {
    
    @RestController
    public static class TestController {
        @GetMapping("/test")
        public String test() {
            return "Template Application is working!";
        }
    }
    
    public static void main(String[] args) {
        SpringApplication.run(TemplateApplication.class, args);
    }
} 