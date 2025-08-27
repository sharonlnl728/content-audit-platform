package com.audit.user.dto;

public class TwoFactorRequest {
    private String action; // "enable" or "disable"
    private String code;   // verification code for enabling

    // Default constructor
    public TwoFactorRequest() {}

    // Constructor with parameters
    public TwoFactorRequest(String action, String code) {
        this.action = action;
        this.code = code;
    }

    // Getters and Setters
    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}





