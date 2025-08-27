package com.audit.content.dto;

import java.util.List;

public class AuditStatistics {
    private Long totalCount;
    private Long passCount;
    private Long rejectCount;
    private Long reviewCount;
    private Long textCount;
    private Long imageCount;
    private List<TrendData> trendData;
    
    public Long getTotalCount() { return totalCount; }
    public void setTotalCount(Long totalCount) { this.totalCount = totalCount; }
    
    public Long getPassCount() { return passCount; }
    public void setPassCount(Long passCount) { this.passCount = passCount; }
    
    public Long getRejectCount() { return rejectCount; }
    public void setRejectCount(Long rejectCount) { this.rejectCount = rejectCount; }
    
    public Long getReviewCount() { return reviewCount; }
    public void setReviewCount(Long reviewCount) { this.reviewCount = reviewCount; }
    
    public Long getTextCount() { return textCount; }
    public void setTextCount(Long textCount) { this.textCount = textCount; }
    
    public Long getImageCount() { return imageCount; }
    public void setImageCount(Long imageCount) { this.imageCount = imageCount; }
    
    public List<TrendData> getTrendData() { return trendData; }
    public void setTrendData(List<TrendData> trendData) { this.trendData = trendData; }
} 