package com.audit.content.dto;

public class TrendData {
    private String date;
    private Long pass;
    private Long reject;
    private Long review;
    
    public TrendData() {}
    
    public TrendData(String date, Long pass, Long reject, Long review) {
        this.date = date;
        this.pass = pass;
        this.reject = reject;
        this.review = review;
    }
    
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    
    public Long getPass() { return pass; }
    public void setPass(Long pass) { this.pass = pass; }
    
    public Long getReject() { return reject; }
    public void setReject(Long reject) { this.reject = reject; }
    
    public Long getReview() { return review; }
    public void setReview(Long review) { this.review = review; }
} 