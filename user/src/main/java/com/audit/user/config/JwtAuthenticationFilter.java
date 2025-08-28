package com.audit.user.config;

import com.alibaba.fastjson.JSON;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {
        
        String userInfo = request.getHeader("X-User-Info");
        
        if (userInfo != null && !userInfo.isEmpty()) {
            try {
                // Parse user information
                @SuppressWarnings("unchecked")
                Map<String, Object> userMap = JSON.parseObject(userInfo, Map.class);
                
                // Create authentication object
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userMap.get("username"),
                    null,
                    new ArrayList<>()
                );
                
                // Set authentication info to SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } catch (Exception e) {
                logger.error("Failed to parse user info", e);
            }
        }
        
        filterChain.doFilter(request, response);
    }
} 