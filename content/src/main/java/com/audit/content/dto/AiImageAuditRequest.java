package com.audit.content.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AiImageAuditRequest {
    @JsonProperty("image_url")
    private String imageUrl;
    
    @JsonProperty("image_base64")
    private String imageBase64;
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    
    // Add getter methods to match AI service expectations
    @JsonProperty("image_url")
    public String getImage_url() { return imageUrl; }
    
    @JsonProperty("image_base64")
    public String getImage_base64() { return imageBase64; }
} 