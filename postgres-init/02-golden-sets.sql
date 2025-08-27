-- Golden Sets table
CREATE TABLE IF NOT EXISTS golden_sets (
    id BIGSERIAL PRIMARY KEY,
    template_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Golden Set Samples table
CREATE TABLE IF NOT EXISTS golden_set_samples (
    id BIGSERIAL PRIMARY KEY,
    golden_set_id BIGINT NOT NULL,
    sample_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    expected_result VARCHAR(20) NOT NULL CHECK (expected_result IN ('PASS', 'BLOCK', 'REVIEW')),
    category VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(golden_set_id, sample_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_golden_sets_template_id ON golden_sets(template_id);
CREATE INDEX IF NOT EXISTS idx_golden_sets_created_by ON golden_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_golden_sets_category ON golden_sets(category);
CREATE INDEX IF NOT EXISTS idx_golden_sets_active ON golden_sets(is_active);

CREATE INDEX IF NOT EXISTS idx_golden_set_samples_golden_set_id ON golden_set_samples(golden_set_id);
CREATE INDEX IF NOT EXISTS idx_golden_set_samples_expected_result ON golden_set_samples(expected_result);
CREATE INDEX IF NOT EXISTS idx_golden_set_samples_category ON golden_set_samples(category);

-- Insert default Landing Page Golden Set
INSERT INTO golden_sets (template_id, name, description, category, version, is_default, is_active) VALUES
('TPL-LANDING-PAGE', 'Landing Page Content Moderation Set', 'Predefined test set for landing page content moderation', 'content_moderation', '1.0.0', TRUE, TRUE)
ON CONFLICT (template_id) DO NOTHING;

-- 获取刚插入的Golden Set ID
DO $$
DECLARE
    golden_set_id BIGINT;
BEGIN
    SELECT id INTO golden_set_id FROM golden_sets WHERE template_id = 'TPL-LANDING-PAGE' AND name = 'Landing Page Content Moderation Set';
    
    -- 插入11个样本
    INSERT INTO golden_set_samples (golden_set_id, sample_id, content, expected_result, category, severity, notes) VALUES
    (golden_set_id, 'sample-1', 'Get 50% off on premium skincare products. Limited time offer with free shipping. Shop now!', 'PASS', 'compliance', 'low', 'Normal promotional content'),
    (golden_set_id, 'sample-2', 'New smartphone with advanced camera features. 128GB storage, 5G ready. Order today!', 'PASS', 'compliance', 'low', 'Standard product advertisement'),
    (golden_set_id, 'sample-3', 'Professional web design services. Custom websites starting at $299. Contact us for a free quote.', 'PASS', 'compliance', 'low', 'Legitimate service offering'),
    (golden_set_id, 'sample-4', 'Hot singles in your area want to meet! Click here for adult dating and explicit content.', 'BLOCK', 'common_violation', 'high', 'Adult content violation'),
    (golden_set_id, 'sample-5', 'Nude photos and videos available. 18+ content with explicit sexual material.', 'BLOCK', 'common_violation', 'high', 'Explicit adult content'),
    (golden_set_id, 'sample-6', 'You won $1,000,000! Click here to claim your prize. Limited time offer!', 'BLOCK', 'common_violation', 'high', 'Scam - fake prize'),
    (golden_set_id, 'sample-7', 'Your bank account has been suspended. Click here to verify your identity immediately.', 'BLOCK', 'common_violation', 'high', 'Phishing scam'),
    (golden_set_id, 'sample-8', 'Make $10,000 per day working from home! No experience needed. Guaranteed income!', 'BLOCK', 'common_violation', 'high', 'Get-rich-quick scam'),
    (golden_set_id, 'sample-9', 'Discover the ancient secret that modern science is just beginning to understand. Join our exclusive community of wellness seekers.', 'REVIEW', 'edge_case', 'medium', 'Extremely ambiguous: ancient secrets + modern science + exclusive community, no specific claims but sounds suspicious'),
    (golden_set_id, 'sample-10', 'Access the hidden wealth opportunities that only 1% of people know about. Our proprietary system reveals what banks don''t want you to know.', 'REVIEW', 'edge_case', 'medium', 'Extremely ambiguous: conspiracy theory language + proprietary system + hidden knowledge, needs human review'),
    (golden_set_id, 'sample-11', 'Unlock your true potential with our revolutionary mind-body connection program. Results guaranteed or your money back. Limited time enrollment.', 'REVIEW', 'boundary_test', 'medium', 'Extremely ambiguous: mind-body connection + guaranteed results + money back guarantee, borderline misleading')
    ON CONFLICT (golden_set_id, sample_id) DO NOTHING;
END $$;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_golden_sets_updated_at BEFORE UPDATE ON golden_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golden_set_samples_updated_at BEFORE UPDATE ON golden_set_samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
