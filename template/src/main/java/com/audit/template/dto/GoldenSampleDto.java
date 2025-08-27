package com.audit.template.dto;

public class GoldenSampleDto {
    private Long id;
    private String content;
    private String expectedResult;
    private String category;
    private String severity;
    private String notes;
    
    // Default constructor
    public GoldenSampleDto() {}
    
    // Constructor with all fields
    public GoldenSampleDto(Long id, String content, String expectedResult, 
                          String category, String severity, String notes) {
        this.id = id;
        this.content = content;
        this.expectedResult = expectedResult;
        this.category = category;
        this.severity = severity;
        this.notes = notes;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getExpectedResult() { return expectedResult; }
    public void setExpectedResult(String expectedResult) { this.expectedResult = expectedResult; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
