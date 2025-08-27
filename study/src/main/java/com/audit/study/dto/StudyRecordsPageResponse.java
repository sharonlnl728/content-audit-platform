package com.audit.study.dto;

import java.util.List;

public class StudyRecordsPageResponse {
    private List<StudyRecordDto> records;
    private int total;
    private int page;
    private int size;
    private int totalPages;

    public StudyRecordsPageResponse() {}

    public StudyRecordsPageResponse(List<StudyRecordDto> records, int total, int page, int size) {
        this.records = records;
        this.total = total;
        this.page = page;
        this.size = size;
        this.totalPages = (int) Math.ceil((double) total / size);
    }

    // Getters and Setters
    public List<StudyRecordDto> getRecords() {
        return records;
    }

    public void setRecords(List<StudyRecordDto> records) {
        this.records = records;
    }

    public int getTotal() {
        return total;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}


