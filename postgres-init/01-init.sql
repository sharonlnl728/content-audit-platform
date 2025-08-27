-- PostgreSQL initialization script
-- Create database (if not exists)
-- Note: PostgreSQL container will automatically create content_audit database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit records table
CREATE TABLE IF NOT EXISTS audit_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('TEXT', 'IMAGE')),
    content_text TEXT,
    content_url VARCHAR(500),
    content_hash VARCHAR(64) NOT NULL,
    audit_result JSONB NOT NULL,
    confidence DECIMAL(5,4),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PASS', 'REJECT', 'REVIEW')),
    ai_result TEXT,
    manual_result JSONB,
    reviewer_id BIGINT,
    reviewed_at TIMESTAMP,
    template_id VARCHAR(50), -- New: associated template
    rule_results JSONB, -- New: rule execution results
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Audit rules table
CREATE TABLE IF NOT EXISTS audit_rules (
    id BIGSERIAL PRIMARY KEY,
    rule_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    label VARCHAR(100),
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    conditions JSONB NOT NULL,
    action VARCHAR(20) CHECK (action IN ('REJECT', 'REVIEW', 'WARN')),
    prompt JSONB NOT NULL,
    content_types VARCHAR(100) DEFAULT 'TEXT,IMAGE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit templates table
CREATE TABLE IF NOT EXISTS audit_templates (
    id BIGSERIAL PRIMARY KEY,
    template_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    version VARCHAR(20) DEFAULT 'v1.0',
    content_type VARCHAR(50),
    description TEXT,
    industry VARCHAR(50),
    rules JSONB NOT NULL, -- Array of rule IDs (keep as JSONB as you want)
    decision_logic JSONB NOT NULL, -- Decision configuration (keep as JSONB as you want)
    ai_prompt_template TEXT, -- Added missing field
    metadata TEXT, -- Added missing field
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Studies table
CREATE TABLE IF NOT EXISTS studies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_PROGRESS', 'COMPLETED')),
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Study records table
CREATE TABLE IF NOT EXISTS study_records (
    id BIGSERIAL PRIMARY KEY,
    study_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'TEXT' CHECK (content_type IN ('TEXT', 'IMAGE')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PASS', 'REJECT', 'REVIEW')),
    confidence DECIMAL(3,2),
    reason TEXT,
    ai_result TEXT,
    reviewed_at TIMESTAMP,
    reviewer_id BIGINT,
    manual_result VARCHAR(20) CHECK (manual_result IN ('PASS', 'REJECT')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (study_id) REFERENCES studies(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Sensitive words table
CREATE TABLE IF NOT EXISTS sensitive_words (
    id BIGSERIAL PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('POLITICS', 'PORN', 'VIOLENCE', 'SPAM')),
    level VARCHAR(20) DEFAULT 'MEDIUM' CHECK (level IN ('LOW', 'MEDIUM', 'HIGH')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(word)
);

-- Audit statistics table
CREATE TABLE IF NOT EXISTS audit_statistics (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_count INTEGER DEFAULT 0,
    pass_count INTEGER DEFAULT 0,
    reject_count INTEGER DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    text_count INTEGER DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_records_user_id ON audit_records(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_content_hash ON audit_records(content_hash);
CREATE INDEX IF NOT EXISTS idx_audit_records_status ON audit_records(status);
CREATE INDEX IF NOT EXISTS idx_audit_records_created_at ON audit_records(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_records_template_id ON audit_records(template_id);
CREATE INDEX IF NOT EXISTS idx_audit_rules_rule_id ON audit_rules(rule_id);
CREATE INDEX IF NOT EXISTS idx_audit_rules_category ON audit_rules(category);
CREATE INDEX IF NOT EXISTS idx_audit_rules_severity ON audit_rules(severity);
CREATE INDEX IF NOT EXISTS idx_audit_templates_template_id ON audit_templates(template_id);
CREATE INDEX IF NOT EXISTS idx_audit_templates_content_type ON audit_templates(content_type);
CREATE INDEX IF NOT EXISTS idx_studies_user_id ON studies(user_id);
CREATE INDEX IF NOT EXISTS idx_study_records_study_id ON study_records(study_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_words_category ON sensitive_words(category);

-- JSONB indexes (PostgreSQL specific)
CREATE INDEX IF NOT EXISTS idx_audit_rules_conditions ON audit_rules USING GIN (conditions);
CREATE INDEX IF NOT EXISTS idx_audit_rules_prompt ON audit_rules USING GIN (prompt);
CREATE INDEX IF NOT EXISTS idx_audit_templates_rules ON audit_templates USING GIN (rules);
CREATE INDEX IF NOT EXISTS idx_audit_templates_decision ON audit_templates USING GIN (decision);
CREATE INDEX IF NOT EXISTS idx_audit_records_audit_result ON audit_records USING GIN (audit_result);
CREATE INDEX IF NOT EXISTS idx_audit_records_rule_results ON audit_records USING GIN (rule_results);

-- Insert test data
INSERT INTO users (username, password, email, role) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iMJ.X2NS', 'admin@test.com', 'ADMIN'),
('testuser', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iMJ.X2NS', 'user@test.com', 'USER')
ON CONFLICT (username) DO NOTHING;

-- Insert sample audit rules
INSERT INTO audit_rules (rule_id, category, label, severity, conditions, action, prompt) VALUES 
(
    'RULE-ADULT-NUDITY',
    'adult',
    'Adult nudity or sexual content',
    'CRITICAL',
    '[
        {"type": "model_score", "model": "nudity_v2", "scoreField": "prob", "gte": 0.85},
        {"type": "keyword", "keywords": ["nude", "naked", "sexual", "porn"], "caseSensitive": false}
    ]'::jsonb,
    'REJECT',
    '{
        "system": "You are a content moderation expert specializing in detecting adult content and nudity.",
        "user": "Analyze the following content for adult content, nudity, or sexual material. Consider:\n1. Explicit sexual content\n2. Nudity or partial nudity\n3. Suggestive or inappropriate content\n\nContent: {content}\n\nRespond with JSON format:\n{\n  \"is_violation\": true/false,\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"explanation\",\n  \"categories\": [\"adult\", \"nudity\"]\n}",
        "examples": [
            {"input": "This is a normal product description", "output": "{\"is_violation\": false, \"confidence\": 0.95, \"reason\": \"Normal content\", \"categories\": []}"},
            {"input": "Explicit adult content here", "output": "{\"is_violation\": true, \"confidence\": 0.98, \"reason\": \"Contains explicit adult content\", \"categories\": [\"adult\"]}"}
        ]
    }'::jsonb
),
(
    'RULE-SCAM-LINKS',
    'scam',
    'Scam or fraudulent links',
    'HIGH',
    '[
        {"type": "regex", "pattern": "\\\\b(click|earn|money|rich|quick|profit)\\\\b", "caseSensitive": false},
        {"type": "keyword", "keywords": ["scam", "fraud", "fake", "phishing"], "caseSensitive": false}
    ]'::jsonb,
    'REVIEW',
    '{
        "system": "You are a content moderation expert specializing in detecting scam and fraudulent content.",
        "user": "Analyze the following content for scam, fraud, or misleading information. Consider:\n1. Suspicious financial claims\n2. Unrealistic promises\n3. Phishing attempts\n4. Fake offers\n\nContent: {content}\n\nRespond with JSON format:\n{\n  \"is_violation\": true/false,\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"explanation\",\n  \"categories\": [\"scam\", \"fraud\"]\n}",
        "examples": [
            {"input": "Get rich quick! Make $10,000 in your first week!", "output": "{\"is_violation\": true, \"confidence\": 0.95, \"reason\": \"Unrealistic financial claims\", \"categories\": [\"scam\"]}"}
        ]
    }'::jsonb
),
(
    'RULE-PII-EXPOSURE',
    'privacy',
    'Personal information exposure',
    'MEDIUM',
    '[
        {"type": "regex", "pattern": "\\\\b\\\\d{3}-\\\\d{2}-\\\\d{4}\\\\b|\\\\b\\\\d{10}\\\\b|\\\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Z|a-z]{2,}\\\\b", "caseSensitive": false}
    ]'::jsonb,
    'REVIEW',
    '{
        "system": "You are a content moderation expert specializing in detecting personal information exposure.",
        "user": "Analyze the following content for personal information exposure. Consider:\n1. Social Security Numbers\n2. Phone numbers\n3. Email addresses\n4. Physical addresses\n5. Financial information\n\nContent: {content}\n\nRespond with JSON format:\n{\n  \"is_violation\": true/false,\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"explanation\",\n  \"categories\": [\"privacy\", \"pii\"]\n}",
        "examples": [
            {"input": "My phone number is 555-123-4567", "output": "{\"is_violation\": true, \"confidence\": 0.90, \"reason\": \"Contains phone number\", \"categories\": [\"privacy\"]}"}
        ]
    }'::jsonb
)
ON CONFLICT (rule_id) DO NOTHING;

-- Insert sample audit templates
INSERT INTO audit_templates (template_id, name, version, content_type, description, industry, rules, decision_logic, ai_prompt_template, metadata, is_default, created_by) VALUES 
(
    'TPL-AD-REVIEW',
    'Generic Ad Moderation',
    'v1.0',
    'ad',
    'Comprehensive template for advertising content moderation',
    'advertising',
    '["RULE-ADULT-NUDITY", "RULE-SCAM-LINKS", "RULE-PII-EXPOSURE"]'::text,
    '{
        "aggregation": "max_severity",
        "autoRejectOn": ["CRITICAL"],
        "autoReviewOn": ["HIGH", "MEDIUM"],
        "allowOnEmpty": true
    }'::text,
    'You are a content moderation expert specializing in detecting adult content and nudity. Analyze the following content for adult content, nudity, or sexual material. Consider:\n1. Explicit sexual content\n2. Nudity or partial nudity\n3. Suggestive or inappropriate content\n\nContent: {content}\n\nRespond with JSON format:\n{\n  \"is_violation\": true/false,\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"explanation\",\n  \"categories\": [\"adult\", \"nudity\"]\n}',
    '{"key": "value"}',
    TRUE,
    1
),
(
    'TPL-LANDING-PAGE',
    'Landing Page Ad Review',
    'v1.0',
    'landing_page',
    'Specialized template for landing page advertisement review',
    'advertising',
    '["RULE-ADULT-NUDITY", "RULE-SCAM-LINKS"]'::text,
    '{
        "aggregation": "weighted_average",
        "autoRejectOn": ["CRITICAL"],
        "autoReviewOn": ["HIGH"],
        "allowOnEmpty": false
    }'::text,
    'You are a content moderation expert specializing in detecting scam and fraudulent content. Analyze the following content for scam, fraud, or misleading information. Consider:\n1. Suspicious financial claims\n2. Unrealistic promises\n3. Phishing attempts\n4. Fake offers\n\nContent: {content}\n\nRespond with JSON format:\n{\n  \"is_violation\": true/false,\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"explanation\",\n  \"categories\": [\"scam\", \"fraud\"]\n}',
    '{"key": "value"}',
    FALSE,
    1
)
ON CONFLICT (template_id) DO NOTHING;

-- Insert sample study data
INSERT INTO studies (name, description, status, user_id) VALUES 
('Landing Page Ad Review', 'Comprehensive audit of landing page advertisements for inappropriate content, misleading claims, and compliance with advertising standards.', 'IN_PROGRESS', 1),
('Social Media Content Analysis', 'Analysis of social media posts for hate speech, inappropriate content, and community guideline violations.', 'DRAFT', 1),
('E-commerce Product Descriptions', 'Review of product descriptions for accuracy, misleading claims, and compliance with consumer protection laws.', 'COMPLETED', 1)
ON CONFLICT DO NOTHING;

-- Insert sample study records
INSERT INTO study_records (study_id, content, content_type, status, confidence, reason, ai_result) VALUES 
(1, 'Get rich quick! Make $10,000 in your first week with our revolutionary system!', 'TEXT', 'REJECT', 0.95, 'Contains misleading financial claims and unrealistic promises', '{"is_violation": true, "confidence": 0.95, "reason": "Violation detected: Misleading financial claims", "categories": ["scam"]}'),
(1, 'Limited time offer! Only 3 left in stock!', 'TEXT', 'REVIEW', 0.75, 'Potential false scarcity marketing', '{"is_violation": false, "confidence": 0.75, "reason": "Suspicious: Possible false scarcity", "categories": []}'),
(1, 'Professional landing page with clear value proposition and honest pricing', 'TEXT', 'PASS', 0.90, 'Appropriate and professional content', '{"is_violation": false, "confidence": 0.90, "reason": "Normal content", "categories": []}')
ON CONFLICT DO NOTHING;

-- Insert sensitive words
INSERT INTO sensitive_words (word, category, level) VALUES 
('sensitive_word_1', 'POLITICS', 'HIGH'),
('violence', 'VIOLENCE', 'MEDIUM'),
('pornography', 'PORN', 'HIGH')
ON CONFLICT (word) DO NOTHING;

-- Create update time trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update time triggers for all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_records_updated_at BEFORE UPDATE ON audit_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_rules_updated_at BEFORE UPDATE ON audit_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_templates_updated_at BEFORE UPDATE ON audit_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_studies_updated_at BEFORE UPDATE ON studies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_study_records_updated_at BEFORE UPDATE ON study_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_statistics_updated_at BEFORE UPDATE ON audit_statistics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create statistics views
CREATE OR REPLACE VIEW audit_summary AS
SELECT 
    DATE(created_at) as audit_date,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'PASS' THEN 1 END) as pass_count,
    COUNT(CASE WHEN status = 'REJECT' THEN 1 END) as reject_count,
    COUNT(CASE WHEN status = 'REVIEW' THEN 1 END) as review_count,
    COUNT(CASE WHEN content_type = 'TEXT' THEN 1 END) as text_count,
    COUNT(CASE WHEN content_type = 'IMAGE' THEN 1 END) as image_count
FROM audit_records 
GROUP BY DATE(created_at)
ORDER BY audit_date DESC;

-- Create rule statistics views
CREATE OR REPLACE VIEW rule_usage_summary AS
SELECT 
    r.rule_id,
    r.category,
    r.label,
    COUNT(ar.id) as usage_count,
    COUNT(CASE WHEN ar.status = 'REJECT' THEN 1 END) as reject_count,
    COUNT(CASE WHEN ar.status = 'REVIEW' THEN 1 END) as review_count
FROM audit_rules r
LEFT JOIN audit_records ar ON ar.rule_results @> jsonb_build_array(jsonb_build_object('ruleId', r.rule_id))
GROUP BY r.rule_id, r.category, r.label
ORDER BY usage_count DESC;

-- 设置权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO admin;

-- 创建只读用户（可选）
-- CREATE USER readonly WITH PASSWORD 'readonly123';
-- GRANT CONNECT ON DATABASE content_audit TO readonly;
-- GRANT USAGE ON SCHEMA public TO readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

COMMIT; 