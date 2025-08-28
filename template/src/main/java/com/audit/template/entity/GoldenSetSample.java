package com.audit.template.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "golden_set_samples")
public class GoldenSetSample {
    
    // AI Status enum
    public enum AiStatus {
        PENDING, PASS, BLOCK, REVIEW
    }
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // Keep goldenSetId field, but use insertable=false and updatable=false to avoid duplicate mapping
    @Column(name = "golden_set_id", nullable = false, insertable = false, updatable = false)
    private Long goldenSetId;
    
    @Column(name = "sample_id", nullable = false)
    private String sampleId;
    
    @Column(nullable = false)
    private String content;
    
    @Column(name = "expected_result", nullable = false)
    private String expectedResult;
    
    @Column(nullable = false)
    private String category;
    
    private String severity;
    
    @Column
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_status", nullable = false)
    private AiStatus aiStatus = AiStatus.PENDING;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "golden_set_id", nullable = false)
    @JsonBackReference
    private GoldenSet goldenSet;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (severity == null) severity = "medium";
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Long getGoldenSetId() { return goldenSetId; }
    public void setGoldenSetId(Long goldenSetId) { this.goldenSetId = goldenSetId; }
    
    public String getSampleId() { return sampleId; }
    public void setSampleId(String sampleId) { this.sampleId = sampleId; }
    
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
    
    public AiStatus getAiStatus() { return aiStatus; }
    public void setAiStatus(AiStatus aiStatus) { this.aiStatus = aiStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public GoldenSet getGoldenSet() { return goldenSet; }
    public void setGoldenSet(GoldenSet goldenSet) { this.goldenSet = goldenSet; }
}




