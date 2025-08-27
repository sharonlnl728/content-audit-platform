import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button, message } from 'antd';
import { AuditTemplate } from '../../types/template';
import api from '../../api'; // Added import for api

interface TemplateEditModalProps {
  visible: boolean;
  template: AuditTemplate | null;
  onCancel: () => void;
  onSuccess: (updatedTemplate: AuditTemplate) => void;
}

const TemplateEditModal: React.FC<TemplateEditModalProps> = ({
  visible,
  template,
  onCancel,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        contentType: template.contentType,
        industry: template.industry,
        isActive: template.isActive,
        isDefault: template.isDefault
      });
    }
  }, [visible, template, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      if (template) {
        const updatedTemplate: AuditTemplate = {
          ...template,
          ...values,
          updatedAt: new Date().toISOString()
        };
        
        // Call API to update template
        await api.updateTemplate(template.id, updatedTemplate);
        
        onSuccess(updatedTemplate);
      }
    } catch (error) {
      message.error('Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Template"
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
          Update Template
        </Button>
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="name"
          label="Template Name"
          rules={[{ required: true, message: 'Please enter template name' }]}
        >
          <Input placeholder="Enter template name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea 
            placeholder="Enter template description" 
            rows={3}
          />
        </Form.Item>

        <Form.Item
          name="contentType"
          label="Content Type"
          rules={[{ required: true, message: 'Please select content type' }]}
        >
          <Select placeholder="Select content type">
            <Select.Option value="text">Text</Select.Option>
            <Select.Option value="image">Image</Select.Option>
            <Select.Option value="mixed">Mixed</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="industry"
          label="Industry"
        >
          <Select placeholder="Select industry">
            <Select.Option value="advertising">Advertising</Select.Option>
            <Select.Option value="ecommerce">E-commerce</Select.Option>
            <Select.Option value="social_media">Social Media</Select.Option>
            <Select.Option value="news">News</Select.Option>
            <Select.Option value="gaming">Gaming</Select.Option>
            <Select.Option value="healthcare">Healthcare</Select.Option>
            <Select.Option value="financial">Financial</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="isActive"
          label="Active Status"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="isDefault"
          label="Default Template"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TemplateEditModal;
