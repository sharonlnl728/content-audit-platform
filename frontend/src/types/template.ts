export interface AuditTemplate {
  id: number;
  templateId: string;
  name: string;
  version: string;
  description: string;
  contentType: string;
  industry: string;
  rules: string;
  decisionLogic: string;
  aiPromptTemplate: string;
  metadata: string;
  isActive: boolean;
  isDefault: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormData {
  name: string;
  description: string;
  contentType: string;
  industry: string;
  isActive: boolean;
  isDefault: boolean;
}




