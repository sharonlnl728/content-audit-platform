package com.audit.user.controller;

import com.audit.user.dto.LoginRequest;
import com.audit.user.dto.RegisterRequest;
import com.audit.user.dto.ChangePasswordRequest;
import com.audit.user.dto.TwoFactorRequest;
import com.audit.user.dto.ApiResponse;
import com.audit.user.entity.User;
import com.audit.user.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/register")
    public ApiResponse<User> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ApiResponse<String> login(@RequestBody LoginRequest request) {
        try {
            String token = userService.login(request);
            return ApiResponse.success(token);
        } catch (Exception e) {
            return ApiResponse.error(401, e.getMessage());
        }
    }
    
    @GetMapping("/profile")
    public ApiResponse<User> getProfile(@RequestHeader("X-User-Info") String userInfo) {
        try {
            User user = userService.getProfile(userInfo);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(404, e.getMessage());
        }
    }
    
    @PutMapping("/profile")
    public ApiResponse<User> updateProfile(@RequestHeader("X-User-Info") String userInfo, 
                                         @RequestBody User updateUser) {
        try {
            User user = userService.updateProfile(userInfo, updateUser);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
    
    @PostMapping("/change-password")
    public ApiResponse<String> changePassword(@RequestHeader("X-User-Info") String userInfo,
                                            @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(userInfo, request);
            return ApiResponse.success("Password changed successfully");
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
    
    @PostMapping("/two-factor")
    public ApiResponse<String> manageTwoFactor(@RequestHeader("X-User-Info") String userInfo,
                                             @RequestBody TwoFactorRequest request) {
        try {
            String result = userService.manageTwoFactor(userInfo, request);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(400, e.getMessage());
        }
    }
    
    @GetMapping("/all")
    public ApiResponse<List<User>> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            return ApiResponse.success(users);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
    
    @GetMapping("/statistics")
    public ApiResponse<Map<String, Object>> getUserStatistics(@RequestHeader("X-User-Info") String userInfo) {
        try {
            Map<String, Object> statistics = userService.getUserStatistics(userInfo);
            return ApiResponse.success(statistics);
        } catch (Exception e) {
            return ApiResponse.error(500, e.getMessage());
        }
    }
} 