package com.audit.study.dto;

import com.audit.study.entity.StudyRecord;
import java.util.List;

public class StudyRecordBatchRequest {
    private List<Item> items;

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public static class Item {
        private String content;
        private StudyRecord.ContentType contentType; // TEXT or IMAGE

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public StudyRecord.ContentType getContentType() {
            return contentType;
        }

        public void setContentType(StudyRecord.ContentType contentType) {
            this.contentType = contentType;
        }
    }
}

