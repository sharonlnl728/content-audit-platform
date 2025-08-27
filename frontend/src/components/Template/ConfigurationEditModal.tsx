import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { AuditTemplate } from '../../types/template';
import api from '../../api';

const { TextArea } = Input;

interface ConfigurationEditModalProps {
  visible: boolean;
  type: 'rules' | 'decision' | 'prompt' | 'metadata';
  template: AuditTemplate | null;
  onCancel: () => void;
  onSuccess: (updatedTemplate: AuditTemplate) => void;
}

const ConfigurationEditModal: React.FC<ConfigurationEditModalProps> = ({
  visible,
  type,
  template,
  onCancel,
  onSuccess
}) => {
  const [jsonValue, setJsonValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && template) {
      let initialValue = '{}';
      try {
        let configData;
        switch (type) {
          case 'rules':
            configData = template.rules;
            break;
          case 'decision':
            configData = template.decisionLogic;
            break;
          case 'prompt':
            configData = template.aiPromptTemplate;
            break;
          case 'metadata':
            configData = template.metadata;
            break;
        }
        
        // Process data: if it's a string, try to parse; if it's an object/array, use directly
        if (typeof configData === 'string') {
          try {
            const parsed = JSON.parse(configData);
            initialValue = JSON.stringify(parsed, null, 2);
          } catch (error) {
            initialValue = '{}';
          }
        } else if (configData && typeof configData === 'object') {
          // Data is already an object/array, convert directly to JSON string
          initialValue = JSON.stringify(configData, null, 2);
        } else {
          // Data is empty or undefined, use default value
          initialValue = '{}';
        }
        
        // Special handling for AI Prompt Template, provide better formatting
        if (type === 'prompt' && initialValue === '{}') {
          const defaultPrompt = {
            system_prompt: "You are a content moderation expert. Please review content for compliance.",
            content_prompt: "Please review the following content: {content}",
            rule_prompts: {
              "RULE-EXAMPLE": "Example rule description"
            }
          };
          initialValue = JSON.stringify(defaultPrompt, null, 2);
        }
      } catch (error) {
        console.error('Error processing configuration data:', error);
        initialValue = '{}';
      }
      setJsonValue(initialValue);
    }
  }, [visible, template, type]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate JSON format
      let parsedValue;
      try {
        parsedValue = JSON.parse(jsonValue);
      } catch (error) {
        message.error('Invalid JSON format');
        return;
      }
      
      if (template) {
        const updatedTemplate: AuditTemplate = {
          ...template,
          updatedAt: new Date().toISOString()
        };
        
        // Update corresponding configuration field
        switch (type) {
          case 'rules':
            updatedTemplate.rules = parsedValue;
            break;
          case 'decision':
            updatedTemplate.decisionLogic = parsedValue;
            break;
          case 'prompt':
            updatedTemplate.aiPromptTemplate = parsedValue;
            break;
          case 'metadata':
            updatedTemplate.metadata = parsedValue;
            break;
        }
        
        // Call API to update template configuration
        const response = await api.updateTemplate(template.id, updatedTemplate);
        
        onSuccess(updatedTemplate);
      }
    } catch (error: any) {
      console.error('Configuration update error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update configuration';
      message.error(`Failed to update configuration: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'rules':
        return 'Edit Rules Configuration';
      case 'decision':
        return 'Edit Decision Logic';
      case 'prompt':
        return 'Edit AI Prompt Template';
      case 'metadata':
        return 'Edit Metadata';
      default:
        return 'Edit Configuration';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'rules':
        return 'Configure content moderation rules and their parameters';
      case 'decision':
        return 'Configure decision logic for content moderation';
      case 'prompt':
        return 'Configure AI prompt templates. Use {content} placeholder for dynamic content insertion.';
      case 'metadata':
        return 'Configure template metadata and settings';
      default:
        return 'Edit configuration settings';
    }
  };

  return (
    <Modal
      title={getTitle()}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
        >
          Update Configuration
        </Button>
      ]}
      width={800}
    >
      <div className="mt-4">
        <div className="mb-4">
          <p className="text-gray-600">{getDescription()}</p>
        </div>
        
        <Form layout="vertical">
          <Form.Item
            label={
              type === 'prompt' ? (
                <div>
                  <span>AI Prompt Template (JSON)</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Structure: system_prompt, content_prompt, rule_prompts
                  </div>
                </div>
              ) : (
                "Configuration (JSON)"
              )
            }
            required
          >
            <TextArea
              value={jsonValue}
              onChange={(e) => setJsonValue(e.target.value)}
              rows={type === 'prompt' ? 20 : 15}
              placeholder={
                type === 'prompt' 
                  ? `{
  "system_prompt": "You are a content moderation expert...",
  "content_prompt": "Please review: {content}",
  "rule_prompts": {
    "RULE-NAME": "Rule description"
  }
}`
                  : "Enter JSON configuration..."
              }
              className="font-mono text-sm"
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default ConfigurationEditModal;
