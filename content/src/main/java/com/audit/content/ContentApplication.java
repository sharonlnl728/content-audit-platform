package com.audit.content;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootApplication
@EnableFeignClients
public class ContentApplication {
    public static void main(String[] args) {
        SpringApplication.run(ContentApplication.class, args);
    }
    
    @Bean
    public CommandLineRunner printAllMappings(@Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping mapping) {
        return args -> {
            System.out.println("=== All Mapped URLs ===");
            mapping.getHandlerMethods().forEach((key, value) -> {
                System.out.println("Mapped URL: " + key + " -> " + value);
            });
            System.out.println("=== End Mapped URLs ===");
        };
    }
} 