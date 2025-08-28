import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Tooltip,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Tabs,
  Select,
  Progress,
  Pagination,
  Spin
} from 'antd';
import {
  EyeOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  PictureOutlined,
  UploadOutlined,
  SettingOutlined,
  PlayCircleOutlined,
  EditOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title, Text } = Typography;

interface Study {
  id: number;
  name: string;
  description: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  total_records: number;
  reviewed_records: number;
  pending_records: number;
  template_id?: number;
  template_locked_at?: string;
  template_locked_by?: number;
}

interface StudyRecord {
  id: number;
  study_id: number;  // Backend field name
  content: string;
  content_type: 'TEXT' | 'IMAGE';  // Backend field name
  status: 'PENDING' | 'PASS' | 'REJECT' | 'REVIEW';
  confidence: number;  // AI model confidence (0-1), indicating certainty of audit result
  reason: string;  // AI audit reason explanation
  ai_result: string;  // Backend field name, AI audit detailed result
  reviewed_at: string;  // Backend field name
  reviewer_id: number;  // Backend field name
  manual_result: 'PASS' | 'REJECT' | null;  // Backend field name
  created_at: string;  // Backend field name
  updated_at: string;  // Backend field name
}

const StudyAudit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<Study | null>(null);
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<string>('');
  const [importDefaultType, setImportDefaultType] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [importAutoStart, setImportAutoStart] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isTemplateLocked, setIsTemplateLocked] = useState<boolean>(false);
  const [templateLockedAt, setTemplateLockedAt] = useState<string | null>(null);
  const [templates, setTemplates] = useState<{ id: number; name: string; contentType?: string; description?: string }[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editStudyName, setEditStudyName] = useState('');
  const [editStudyDescription, setEditStudyDescription] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiTotalRecords, setAiTotalRecords] = useState(0);
  const [aiCurrentRecord, setAiCurrentRecord] = useState(0);
  const [aiResults, setAiResults] = useState({pass: 0, reject: 0, review: 0});
  const [templatePageSize] = useState(12);
  
  // Template filtering and pagination states
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
    const [templateFilterType, setTemplateFilterType] = useState<string | undefined>(undefined);
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  
  // Create form instance for review modal
  const [reviewForm] = Form.useForm();
  
  // Record selection state for batch AI processing
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  
  // State filter for records
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    if (id) {
      fetchStudy();
      fetchRecords();
      fetchTemplates();
    }
  }, [id]);

      // Reload data when pagination parameters change
  useEffect(() => {
    if (id) {
      fetchRecords();
    }
  }, [currentPage, pageSize]);

      // Calculate filtered and paginated templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = templates;
    
          // Search filter
    if (templateSearchQuery) {
      const query = templateSearchQuery.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        (template.description && template.description.toLowerCase().includes(query))
      );
    }
    
          // Type filter
    if (templateFilterType) {
      filtered = filtered.filter(template => 
        template.contentType === templateFilterType
      );
    }
    
          // Sort - fixed by name
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    
    return filtered;
  }, [templates, templateSearchQuery, templateFilterType]);
  
  // Filter records by status
  const filteredRecords = React.useMemo(() => {
    if (statusFilter === 'all') return records;
    return records.filter(record => record.status === statusFilter);
  }, [records, statusFilter]);
  


  const paginatedTemplates = React.useMemo(() => {
    const startIndex = (templateCurrentPage - 1) * templatePageSize;
    const endIndex = startIndex + templatePageSize;
    return filteredTemplates.slice(startIndex, endIndex);
  }, [filteredTemplates, templateCurrentPage, templatePageSize]);

  const fetchStudy = async () => {
    try {
      const response = await api.getStudy(parseInt(id!));
      if (response.data.code === 200) {
        const studyData = response.data.data;
        setStudy(studyData);
        setEditStudyName(studyData.name);
        setEditStudyDescription(studyData.description);
        
        // Set template lock status
        if (studyData.template_id) {
          setSelectedTemplateId(studyData.template_id);
          setIsTemplateLocked(true);
          setTemplateLockedAt(studyData.template_locked_at || null);
        } else {
          setSelectedTemplateId(null);
          setIsTemplateLocked(false);
          setTemplateLockedAt(null);
        }
      } else {
        message.error('Failed to fetch study');
      }
    } catch (error) {
      console.error('Failed to fetch study:', error);
      message.error('Failed to fetch study');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      // Get all records without pagination
      const resp = await api.getStudyRecords(Number(id), {
        page: 0,
        size: 0, // size=0 means get all records
      });
      
      if (resp.data?.code === 200) {
        const responseData = resp.data.data;
        // API directly returns array, not object with records field
        const allRecords = Array.isArray(responseData) ? responseData : [];
        
        setRecords(allRecords);

        
        // Set total record count, temporarily use current record count, implement real pagination later

        

        
        // If no records, show message
        if (allRecords.length === 0) {
          // No records found
        }
      } else {
        console.error('API returned error:', resp.data);
        setRecords([]);
        message.warning('No records found or failed to fetch records');
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      message.error('Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.getTemplates();
      if (response.data.code === 200) {
        setTemplates(response.data.data);
      } else {
        message.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      message.error('Failed to fetch templates');
    }
  };

  /**
   * Lock template to specified Study
   */
  const handleLockTemplate = async (templateId: number) => {
    try {
      const response = await api.lockTemplate(parseInt(id!), templateId);
      if (response.data.code === 200) {
        const studyData = response.data.data;
        setStudy(studyData);
        setSelectedTemplateId(templateId);
        setIsTemplateLocked(true);
        setTemplateLockedAt(studyData.template_locked_at || null);
        message.success('Template locked successfully!');
      } else {
        message.error('Failed to lock template');
      }
    } catch (error) {
      console.error('Failed to lock template:', error);
      message.error('Failed to lock template');
    }
  };

    const handleEditTemplate = (templateId: string) => {
            // Navigate to Template Detail page for editing
    navigate(`/templates/${templateId}`);
  };

  const handleStartAIProcessing = async (forceRefresh: boolean = true) => {
    if (!selectedTemplateId) {
      message.error('Please select a template first');
      return;
    }
    
    try {
      setAiProcessing(true);
      setAiProgress(0);
      setAiResults({pass: 0, reject: 0, review: 0});
      
      // Get all records (regardless of status, need to reprocess)
      const allRecordsResp = await api.getStudyRecords(Number(id), {
        page: 0,
        size: 0, // size=0 means get all records
      });
      
      if (allRecordsResp.data?.code === 200) {
        const allRecords = allRecordsResp.data.data || [];
        setAiTotalRecords(allRecords.length);
        
        if (allRecords.length === 0) {
          message.info('No records to process');
          setAiProcessing(false);
          return;
        }
        
        // Get template configuration
        const templateResp = await api.getTemplate(parseInt(selectedTemplateId.toString()));
        if (templateResp.data?.code !== 200) {
          throw new Error('Failed to get template configuration');
        }
        const rawTemplate = templateResp.data.data;
        
        // Convert field names to match AI Service expectations
        const templateConfig = {
          id: rawTemplate.id,
          template_id: rawTemplate.templateId,
          name: rawTemplate.name,
          version: rawTemplate.version,
          description: rawTemplate.description,
          content_type: rawTemplate.contentType,
          industry: rawTemplate.industry,
          is_active: rawTemplate.isActive,
          is_default: rawTemplate.isDefault,
          created_by: rawTemplate.createdBy,
          created_at: rawTemplate.createdAt,
          updated_at: rawTemplate.updatedAt,
          text_rule_count: rawTemplate.textRuleCount,
          image_rule_count: rawTemplate.imageRuleCount,
          video_rule_count: rawTemplate.videoRuleCount,
          supported_content_types: rawTemplate.supportedContentTypes,
          applicable_regions: rawTemplate.applicableRegions,
          success_rate: rawTemplate.successRate,
          rules: rawTemplate.rules,
          decision_logic: rawTemplate.decisionLogic,
          ai_prompt_template: rawTemplate.aiPromptTemplate,
          metadata: rawTemplate.metadata
        };

        
        // Process records one by one, implement real-time progress updates
        let processedCount = 0;
        const results = { pass: 0, reject: 0, review: 0 };
        
        for (let i = 0; i < allRecords.length; i++) {
          const record = allRecords[i];
          
          try {
            // Update currently processed record
            setAiCurrentRecord(i + 1);
            
            // Use auditText interface, consistent with Golden Set
            const response = await api.auditText(record.content, templateConfig, forceRefresh);
            
            if (response?.data?.code === 200) {
              const aiResult = response.data.data;
              
              // Use correct field mapping, consistent with Golden Set
              const status = aiResult.status || 'REVIEW';
              
              if (status === 'PASS') results.pass++;
              else if (status === 'REJECT') results.reject++;
              else results.review++;
              
              // Update record status in database
              try {
                await api.updateRecordFromAudit(Number(id), record.id, {
                  status: status,
                  confidence: aiResult.confidence || 0.5,
                  reason: aiResult.reason || 'AI processing completed',
                  aiResult: JSON.stringify(aiResult),
                  reviewedAt: new Date().toISOString()
                });

                
                // Immediately update records state to show AI processing result
                setRecords(prevRecords => 
                  prevRecords.map(prevRecord => 
                    prevRecord.id === record.id 
                      ? { 
                          ...prevRecord, 
                          status: status,
                          confidence: aiResult.confidence || 0.5,
                          reason: aiResult.reason || 'AI processing completed',
                          aiResult: JSON.stringify(aiResult),
                          reviewedAt: new Date().toISOString()
                        }
                      : prevRecord
                  )
                );
              } catch (updateError) {
                console.error(`Failed to update record ${i + 1} status in database:`, updateError);
              }
            }
            
            // Update progress
            processedCount++;
            const progress = Math.round((processedCount / allRecords.length) * 100);
            setAiProgress(progress);
            setAiResults(results);
            
            // Small delay to let user see progress update
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.error(`Failed to process record ${i + 1}:`, error);
            // Continue processing next record, don't interrupt entire flow
          }
        }
        
        // Process completed
        message.success(`AI processing completed! Processed ${processedCount} records.`);
        
        // Update run statistics
        // setAiRunCount(prev => prev + 1); // This state variable was removed
        // setAiLastRunTime(new Date().toLocaleString()); // This state variable was removed
        
        // Only refresh study statistics, keep records order stable
        fetchStudy(); // Refresh study statistics
        
        setAiProcessing(false);
        setAiProgress(100);
      }
    } catch (error) {
      console.error('Failed to start AI processing:', error);
      message.error('Failed to start AI processing');
      setAiProcessing(false);
    }
  };
  
  // New function for batch AI processing of selected records
  const handleBatchAIProcessing = async (forceRefresh: boolean = true) => {
    if (!selectedTemplateId) {
      message.error('Please select a template first');
      return;
    }
    
    if (selectedRecordIds.length === 0) {
      message.warning('Please select at least one record to process');
      return;
    }
    
    try {
      setAiProcessing(true);
      setAiProgress(0);
      setAiResults({pass: 0, reject: 0, review: 0});
      
      // Get only selected records
      const selectedRecords = records.filter(record => selectedRecordIds.includes(record.id));
      
      setAiTotalRecords(selectedRecords.length);
      
      if (selectedRecords.length === 0) {
        message.info('No selected records to process');
        setAiProcessing(false);
        return;
      }
      
      // Get template configuration
      const templateResp = await api.getTemplate(parseInt(selectedTemplateId.toString()));
      if (templateResp.data?.code !== 200) {
        throw new Error('Failed to get template configuration');
      }
      const rawTemplate = templateResp.data.data;
      
      // Convert field names to match AI Service expectations
      const templateConfig = {
        id: rawTemplate.id,
        template_id: rawTemplate.templateId,
        name: rawTemplate.name,
        version: rawTemplate.version,
        description: rawTemplate.description,
        content_type: rawTemplate.contentType,
        industry: rawTemplate.industry,
        is_active: rawTemplate.isActive,
        is_default: rawTemplate.isDefault,
        created_by: rawTemplate.createdBy,
        created_at: rawTemplate.createdAt,
        updated_at: rawTemplate.updatedAt,
        text_rule_count: rawTemplate.textRuleCount,
        image_rule_count: rawTemplate.imageRuleCount,
        video_rule_count: rawTemplate.videoRuleCount,
        supported_content_types: rawTemplate.supportedContentTypes,
        applicable_regions: rawTemplate.applicableRegions,
        success_rate: rawTemplate.successRate,
        rules: rawTemplate.rules,
        decision_logic: rawTemplate.decisionLogic,
        ai_prompt_template: rawTemplate.aiPromptTemplate,
        metadata: rawTemplate.metadata
      };

      
      // Process selected records one by one
      let processedCount = 0;
      const results = { pass: 0, reject: 0, review: 0 };
      
      for (let i = 0; i < selectedRecords.length; i++) {
        const record = selectedRecords[i];
        
        try {
          // Update currently processed record
          setAiCurrentRecord(i + 1);
          
          // Use auditText interface, consistent with Golden Set
          const response = await api.auditText(record.content, templateConfig, forceRefresh);
          
                      if (response?.data?.code === 200) {
              const aiResult = response.data.data;
              
              // Use correct field mapping, consistent with Golden Set
              const status = aiResult.status || 'REVIEW';
            
            if (status === 'PASS') results.pass++;
            else if (status === 'REJECT') results.reject++;
            else results.review++;
            
            // Update record status in database
            try {
              await api.updateRecordFromAudit(Number(id), record.id, {
                status: status,
                confidence: aiResult.confidence || 0.5,
                reason: aiResult.reason || 'AI processing completed',
                aiResult: JSON.stringify(aiResult),
                reviewedAt: new Date().toISOString()
              });

              
              // Immediately update records state to show AI processing result
              setRecords(prevRecords => 
                prevRecords.map(prevRecord => 
                  prevRecord.id === record.id 
                    ? { 
                        ...prevRecord, 
                        status: status,
                        confidence: aiResult.confidence || 0.5,
                        reason: aiResult.reason || 'AI processing completed',
                        aiResult: JSON.stringify(aiResult),
                        reviewedAt: new Date().toISOString()
                      }
                    : prevRecord
                )
              );
            } catch (updateError) {
              console.error(`Failed to update record ${i + 1} status in database:`, updateError);
            }
          }
          
          // Update progress
          processedCount++;
          const progress = Math.round((processedCount / selectedRecords.length) * 100);
          setAiProgress(progress);
          setAiResults(results);
          
          // Small delay to let user see progress update
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to process record ${i + 1}:`, error);
          // Continue processing next record, don't interrupt entire flow
        }
      }
      
      // Process completed
      message.success(`Batch AI processing completed! Processed ${processedCount} selected records.`);
      
      // Clear selection after processing
      setSelectedRecordIds([]);
      
      // Only refresh study statistics, keep records order stable
      fetchStudy();
      
      setAiProcessing(false);
      setAiProgress(100);
    } catch (error) {
      console.error('Failed to start batch AI processing:', error);
      message.error('Failed to start batch AI processing');
      setAiProcessing(false);
    }
  };

  const handleReviewRecord = async (record: StudyRecord) => {
    // Reset form with current record values
    reviewForm.setFieldsValue({
      status: record.status,
      reason: record.reason || ''
    });
    
    Modal.confirm({
      title: 'Review Record',
      content: (
        <Form 
          form={reviewForm}
          layout="vertical"
          initialValues={{
            status: record.status,
            reason: record.reason || ''
          }}
        >
          <Form.Item 
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select style={{ width: '100%' }}>
              <Select.Option value="PASS">Pass</Select.Option>
              <Select.Option value="REJECT">Reject</Select.Option>
              <Select.Option value="REVIEW">Review</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="reason"
            label="Reason (optional)"
          >
            <Input.TextArea rows={3} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          // Get form values using Form.useForm()
          const formValues = await reviewForm.validateFields();
          
          const newStatus = formValues.status;
          const newReason = formValues.reason || 'Manual review completed';
          
          // Get current user info for reviewer_id and manual_result
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          const userId = userInfo.id;
          
          if (!userId) {
            message.error('User information not found. Please login again.');
            return;
          }
          
          const updateData = {
            status: newStatus,
            confidence: record.confidence || 0.5,
            reason: newReason,
            reviewedAt: new Date().toISOString(),
            reviewerId: userId,
            manualResult: newStatus as 'PASS' | 'REJECT' | 'REVIEW'
          };
          
          await api.updateRecordFromAudit(Number(id), record.id, updateData);
          message.success('Record reviewed successfully!');
          
          // Only update current record, don't refetch all data to maintain order stability
          setRecords(prevRecords => 
            prevRecords.map(prevRecord => 
              prevRecord.id === record.id 
                ? { ...prevRecord, ...updateData }
                : prevRecord
            )
          );
        } catch (error) {
          console.error('Failed to update record:', error);
          message.error('Failed to update record');
        }
      },
      okText: 'Submit Review',
      cancelText: 'Cancel',
      width: 500,
    });
  };

  const handleTemplateSelect = async (templateId: number) => {
    try {
      await handleLockTemplate(templateId);
    } catch (error) {
      console.error('Failed to select and lock template:', error);
    }
  };

  const getContentTypeIcon = (type: string) => {
    return type === 'TEXT' ? <FileTextOutlined /> : <PictureOutlined />;
  };

  const columns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (text: string) => {
        const displayText = text.length > 80 ? text.substring(0, 80) + '...' : text;
        return (
          <Text
            className="text-slate-700 cursor-pointer hover:text-purple-600 transition-colors duration-200"
            onClick={() => {
              Modal.info({
                title: 'Content Details',
                content: (
                  <div className="max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{text}</pre>
                  </div>
                ),
                width: 600,
                okText: 'Close'
              });
            }}
          >
            {displayText}
          </Text>
        );
      }
    },
    {
      title: 'AI Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (status: string) => {
        const statusConfig = {
          'PENDING': { color: 'default', text: 'Pending', icon: <ClockCircleOutlined /> },
          'PASS': { color: 'success', text: 'Pass', icon: <CheckCircleOutlined /> },
          'REJECT': { color: 'error', text: 'Reject', icon: <CloseCircleOutlined /> },
          'REVIEW': { color: 'processing', text: 'Review', icon: <ExclamationCircleOutlined /> }
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['PENDING'];
        
        return (
          <Tag color={config.color} icon={config.icon} className="font-medium">
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      align: 'center' as const,
      render: (confidence: number | null) => {
        if (confidence === null || confidence === undefined) {
          return <Text type="secondary">-</Text>;
        }
        
        const percentage = Math.round(confidence * 100);
        let color = 'default';
        
        if (percentage >= 80) color = 'success';
        else if (percentage >= 60) color = 'processing';
        else color = 'error';
        
        return (
          <Tag color={color} className="font-medium">
            {percentage}%
          </Tag>
        );
      }
    },
    {
      title: 'AI Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 200,
      render: (reason: string | null) => {
        if (!reason || reason === 'null') {
          return <Text type="secondary">No reason provided</Text>;
        }
        
        const displayReason = reason.length > 50 ? reason.substring(0, 50) + '...' : reason;
        
        return (
          <Tooltip title={reason}>
            <Text className="text-slate-600 cursor-help">
              {displayReason}
            </Text>
          </Tooltip>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (record: StudyRecord) => (
        <Space size="small">
          <Tooltip title="Review this record">
            <Button
              type="primary"
              size="small"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg"
              onClick={() => handleReviewRecord(record)}
            >
              Review
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  if (!study) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/studies')}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
          >
            Back
          </Button>
          <Title level={2} style={{ color: '#1e293b', margin: 0 }}>
            {study.name}
          </Title>
        </div>
        <Text style={{ color: '#64748b' }}>
          {study.description}
        </Text>
      </div>

      {/* Study Statistics */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-32">
            <div className="h-full flex flex-col justify-center">
              <Statistic
                title="Total Records"
                value={study.total_records}
                valueStyle={{ color: '#52c41a' }}
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-32">
            <div className="h-full flex flex-col justify-center">
              <Statistic
                title={
                  <div className="flex justify-between items-center">
                    <span>AI Results</span>
                    <span className="text-blue-600 font-medium text-xs">
                      ({study.total_records > 0 ? Math.round(((study.total_records - study.pending_records) / study.total_records) * 100) : 0}%)
                    </span>
                  </div>
                }
                value={0}
                suffix={
                  <div className="text-center mt-3">
                    <div className="text-sm">
                      <span className="text-green-600 font-medium">PASS: {records.filter(r => r.status === 'PASS').length}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-red-600 font-medium">REJECT: {records.filter(r => r.status === 'REJECT').length}</span>
                      <span className="mx-2 text-slate-400">|</span>
                      <span className="text-orange-600 font-medium">REVIEW: {records.filter(r => r.status === 'REVIEW').length}</span>
                    </div>
                  </div>
                }
                valueStyle={{ color: '#1890ff', fontSize: '0px', lineHeight: '0px' }}
                className="[&_.ant-statistic-content-value]:!text-transparent"
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-32">
            <div className="h-full flex flex-col justify-center">
              <Statistic
                title="Pending"
                value={study.pending_records}
                valueStyle={{ color: '#faad14' }}
              />
            </div>
          </Card>
        </Col>
      </Row>



      <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane tab="Overview" key="overview">
            {/* Overview Tab Content */}
            <div className="space-y-6">
              {/* Study Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Study Details</h3>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => setEditModalVisible(true)}
                        className="text-slate-700 hover:text-purple-600 p-0 h-auto"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Name:</span>
                        <span className="text-slate-800 font-medium">{study.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Description:</span>
                        <span className="text-slate-800 font-medium max-w-xs text-right">{study.description}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Created:</span>
                        <span className="text-slate-800">
                          {study.created_at ? 
                            (() => {
                              const date = new Date(study.created_at);
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                            })() 
                            : 'N/A'
                          }
                        </span>
                      </div>
                                         <div className="flex justify-between">
                         <span className="text-slate-600">Last Updated:</span>
                         <span className="text-slate-800">
                           {study.updated_at ? 
                             (() => {
                               const date = new Date(study.updated_at);
                               return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                             })() 
                             : 'N/A'
                           }
                         </span>
                       </div>
                       
                       {/* Template Information */}
                       {selectedTemplateId && (
                         <div className="flex justify-between">
                           <span className="text-slate-600">Template:</span>
                           <span className="text-slate-800 font-medium">
                             {templates.find(t => t.id === selectedTemplateId)?.name || 'Unknown'}
                             {isTemplateLocked && (
                               <Tag color="green" icon={<LockOutlined />} className="ml-2 text-xs">
                                 LOCKED
                               </Tag>
                             )}
                           </span>
                         </div>
                       )}
                       
                       {/* Last AI Processing - Show if we have template and it's been processed */}
                       {selectedTemplateId && (
                         <div className="flex justify-between">
                           <span className="text-slate-600">Last AI Processing:</span>
                           <span className="text-slate-800">
                             {(() => {
                               // Find the most recent AI processing time from records
                               const processedRecords = records.filter(r => r.reviewed_at);
                               if (processedRecords.length === 0) {
                                 return 'Not yet processed';
                               }
                               
                               // Get the most recent reviewed_at time
                               const latestTime = processedRecords.reduce((latest, record) => {
                                 if (!record.reviewed_at) return latest;
                                 
                                 // Force UTC timezone parsing - database time is UTC
                                 let recordTime: Date;
                                 if (typeof record.reviewed_at === 'string') {
                                   // If it's a string without timezone, assume UTC
                                   if (record.reviewed_at.includes('Z') || record.reviewed_at.includes('+')) {
                                     // Already has timezone info
                                     recordTime = new Date(record.reviewed_at);
                                   } else {
                                     // No timezone info, force UTC
                                     recordTime = new Date(record.reviewed_at + 'Z');
                                   }
                                 } else {
                                   recordTime = new Date(record.reviewed_at);
                                 }
                                 
                                 if (isNaN(recordTime.getTime())) return latest;
                                 return latest && recordTime > latest ? recordTime : recordTime;
                               }, null as Date | null);
                               
                               if (!latestTime) {
                                 return 'Not yet processed';
                               }
                               
                                                              // Correct timezone conversion: Database time is UTC, convert to user's local time
                               const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                               

                               
                               // Convert UTC time to user's local timezone
                               const localTime = latestTime.toLocaleString('en-US', {
                                 timeZone: userTimezone,
                                 year: 'numeric',
                                 month: 'numeric',
                                 day: 'numeric',
                                 hour: 'numeric',
                                 minute: 'numeric',
                                 second: 'numeric',
                                 hour12: true
                               });
                               

                               
                               return localTime;
                             })()}
                           </span>
                         </div>
                       )}


                     </div>
                   </div>
                 </Card>
                
                <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => setImportVisible(true)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 shadow-lg"
                      >
                        Import New Records
                      </Button>
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setActiveTab('records')}
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                      >
                        View All Records
                      </Button>
                      <Button
                        icon={<SettingOutlined />}
                        onClick={() => setActiveTab('settings')}
                        className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                      >
                        Study Configuration
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
              

            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Records" key="records">
            {/* AI Processing Section */}
            <Card 
              className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200"
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlayCircleOutlined className="text-purple-600" />
                    <span>AI Processing</span>
                  </div>
                  {selectedTemplateId && (
                    <div className="flex items-center gap-2">
                      <Tag color="purple" className="text-purple-700 border-purple-200 bg-purple-100">
                        {templates.find(t => t.id === selectedTemplateId)?.name}
                      </Tag>
                      {isTemplateLocked && (
                        <Tag color="green" icon={<LockOutlined />} className="text-green-700 border-green-200 bg-green-100">
                          LOCKED
                        </Tag>
                      )}
                    </div>
                  )}
                </div>
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-slate-600 mb-3">
                    <InfoCircleOutlined className="mr-2 text-blue-600" />
                    <span>
                      {selectedRecordIds.length > 0 
                        ? `${selectedRecordIds.length} selected records will be processed with AI.`
                        : 'All records will be re-processed with the selected template.'
                      }
                    </span>
                    <div className="mt-2 text-xs text-slate-500">
                      <span className="font-medium">AI Processing:</span> Always runs new AI analysis for accurate results
                    </div>
                  </div>
                  
                  {aiProcessing && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Progress:</span>
                        <span className="font-medium text-slate-800">
                          {aiCurrentRecord}/{aiTotalRecords} ({aiProgress.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress 
                        percent={aiProgress} 
                        status={aiProgress === 100 ? 'success' : 'active'}
                        strokeColor={{
                          '0%': '#8b5cf6',
                          '100%': '#6366f1',
                        }}
                        className="mb-3"
                      />
                      
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-slate-600">Pass</span>
                          <span className="font-medium text-green-600">{aiResults.pass}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-slate-600">Reject</span>
                          <span className="font-medium text-red-600">{aiResults.reject}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="text-slate-600">Review</span>
                          <span className="font-medium text-orange-600">{aiResults.review}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex gap-2">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => {
                      if (selectedRecordIds.length > 0) {
                        handleBatchAIProcessing(true); // Process selected records, force refresh
                      } else {
                        handleStartAIProcessing(true); // Process all records, force refresh
                      }
                    }}
                    disabled={aiProcessing || !selectedTemplateId || (study?.total_records || 0) === 0}
                    loading={aiProcessing}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {aiProcessing ? 'Processing...' : 
                      selectedRecordIds.length > 0 
                        ? `AI Process Selected (${selectedRecordIds.length})`
                        : 'Start AI Processing (All Records)'
                    }
                  </Button>
                </div>
              </div>
            </Card>



            {/* Prompt when no template is selected */}
            {!selectedTemplateId && (
              <Card className="mb-4 border border-orange-200 bg-orange-50/30">
                <div className="flex items-center gap-3 text-orange-700">
                  <ExclamationCircleOutlined />
                  <div>
                    <span className="font-medium">No Template Selected</span>
                    <span className="ml-2 text-sm">
                      Please go to the Settings tab to select a template before starting AI processing
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-slate-800">Records</h3>
                {loading && <Spin size="small" />}
                
                {/* Status Filter inline */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    style={{ width: 100 }}
                    size="small"
                  >
                    <Select.Option value="all">All</Select.Option>
                    <Select.Option value="PENDING">Pending</Select.Option>
                    <Select.Option value="REVIEW">Review</Select.Option>
                    <Select.Option value="PASS">Pass</Select.Option>
                    <Select.Option value="REJECT">Reject</Select.Option>
                  </Select>

                  {statusFilter !== 'all' && (
                    <Button 
                      size="small" 
                      onClick={() => setStatusFilter('all')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
              <Space>
                <Button onClick={() => { 
                  setCurrentPage(1); // Reset to first page
                  fetchRecords(); 
                }} className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 hover:border-purple-700">Refresh</Button>
                <Button onClick={() => setImportVisible(true)} className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-purple-700">Import</Button>
              </Space>
            </div>
            
            {/* Batch Operations Bar */}
            {selectedRecordIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-blue-700 font-medium">
                      {selectedRecordIds.length} records selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      size="small"
                      onClick={() => setSelectedRecordIds([])}
                      className="text-blue-600 hover:text-blue-800 border-blue-300 hover:border-blue-400"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            )}
            

            

            
            <Table
              rowSelection={{
                selectedRowKeys: selectedRecordIds,
                onChange: (selectedRowKeys, _selectedRows) => {
                  setSelectedRecordIds(selectedRowKeys as number[]);
                },
                getCheckboxProps: (_record) => ({
                  // Temporarily don't disable any records to ensure selection functionality works properly
                  disabled: false
                }),
                // Add selection options
                selections: [
                  {
                    key: 'all',
                    text: 'Select All Current Page',
                    onSelect: () => setSelectedRecordIds(filteredRecords.map(r => r.id))
                  },
                  {
                    key: 'pending',
                    text: 'Select Pending',
                    onSelect: () => setSelectedRecordIds(filteredRecords.filter(r => r.status === 'PENDING').map(r => r.id))
                  },
                  {
                    key: 'clear',
                    text: 'Clear All',
                    onSelect: () => setSelectedRecordIds([])
                  }
                ]
              }}
              columns={columns}
              dataSource={filteredRecords}
              loading={loading}
              rowKey="id"
              className="user-table"
              rowClassName={(record) => {
                const isSelected = selectedRecordIds.includes(record.id);
                return `hover:bg-purple-50/80 transition-colors duration-200 ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`;
              }}
              scroll={{ x: 1000 }} // Add horizontal scroll to ensure normal display on small screens
              size="middle" // Use medium size to balance information density and readability
              pagination={{
                pageSize: pageSize,
                pageSizeOptions: ['10', '20', '50', '100'],
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `Items ${range[0]}-${range[1]} of ${total} records`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                onShowSizeChange: (_current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                },
              }}
            />
          </Tabs.TabPane>
          
          <Tabs.TabPane tab="Settings" key="settings">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card 
                title={
                  <div className="flex items-center gap-2">
                    <SettingOutlined className="text-purple-600" />
                    <span>Template Selection</span>
                  </div>
                } 
                className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  {/* Display when template is selected */}
                  {selectedTemplateId && (
                    <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircleOutlined className="text-2xl text-green-500" />
                            <div>
                              <h4 className="text-lg font-semibold text-slate-800 mb-1">
                                Current Template: {templates.find(t => t.id === selectedTemplateId)?.name}
                              </h4>
                              <div className="text-slate-600">
                                {templates.find(t => t.id === selectedTemplateId)?.description}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm">
                            <Tag color="blue" className="text-xs">
                              {templates.find(t => t.id === selectedTemplateId)?.contentType || 'MIXED'}
                            </Tag>
                            <span className="text-slate-500">Template ID: {selectedTemplateId}</span>
                            {isTemplateLocked && (
                              <>
                                <Tag color="green" icon={<LockOutlined />} className="text-xs">
                                  LOCKED
                                </Tag>
                                <span className="text-slate-500">
                                  Locked at: {templateLockedAt ? new Date(templateLockedAt).toLocaleString() : 'Unknown'}
                                </span>
                              </>
                            )}
                          </div>
                          
                          {isTemplateLocked && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2 text-green-700">
                                <LockOutlined />
                                <span className="text-sm font-medium">
                                  This template is locked for AI processing. All AI results will use this template configuration.
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            icon={<EditOutlined />}
                            onClick={() => handleEditTemplate(selectedTemplateId?.toString() || '')}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                          >
                            Edit Template
                          </Button>
                          {!isTemplateLocked && (
                            <Button 
                              type="text"
                              onClick={() => setSelectedTemplateId(null)}
                              className="text-slate-500 hover:text-slate-700"
                            >
                              Change Template
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Template selection area */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {selectedTemplateId ? 'Select Different Template' : 'Select Template'}
                      </h3>
                      {!selectedTemplateId && (
                        <div className="text-sm text-slate-500">
                          Please select a template to start AI processing
                        </div>
                      )}
                    </div>
                    
                    {/* Search and filter area - simplified version */}
                    <div className="flex items-center gap-3 mb-4">
                      <Input.Search
                        placeholder="Search templates..."
                        allowClear
                        style={{ width: 250 }}
                        className="rounded-lg"
                        onSearch={(value) => setTemplateSearchQuery(value)}
                      />
                      <Select
                        placeholder="Type"
                        allowClear
                        style={{ width: 100 }}
                        className="rounded-lg"
                        onChange={(value) => setTemplateFilterType(value)}
                      >
                        <Select.Option value="TEXT">Text</Select.Option>
                        <Select.Option value="IMAGE">Image</Select.Option>
                        <Select.Option value="MIXED">Mixed</Select.Option>
                      </Select>
                    </div>
                    
                    {/* Template grid display - simplified version */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedTemplates.map(template => (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                            selectedTemplateId === template.id
                              ? 'ring-2 ring-purple-500 bg-purple-50/50 border-purple-300'
                              : 'hover:border-purple-200 hover:bg-purple-50/30'
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <div className="flex items-center gap-3">
                            {getContentTypeIcon(template.contentType || 'TEXT')}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-800 text-base truncate mb-1">
                                {template.name}
                              </div>
                              <div className="text-slate-600 text-sm truncate">
                                {template.description || 'No description'}
                              </div>
                            </div>
                            
                            {selectedTemplateId === template.id && (
                              <div className="flex items-center gap-2">
                                {isTemplateLocked && (
                                  <Tag color="purple" icon={<LockOutlined />} className="text-xs">
                                    LOCKED
                                  </Tag>
                                )}
                                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Pagination control - simplified version */}
                    {filteredTemplates.length > templatePageSize && (
                      <div className="mt-4 flex justify-center">
                        <Pagination
                          current={templateCurrentPage}
                          total={filteredTemplates.length}
                          pageSize={templatePageSize}
                          simple
                          showSizeChanger={false}
                          onChange={(page) => setTemplateCurrentPage(page)}
                        />
                      </div>
                    )}
                    
                    {/* Prompt when no template is found - simplified version */}
                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-6 text-slate-500">
                        <SearchOutlined className="text-3xl mb-2 text-slate-300" />
                        <div>No templates found</div>
                      </div>
                    )}
                  </div>

                  {/* Prompt when no template is selected */}
                  {!selectedTemplateId && (
                    <div className="text-center py-8 text-slate-500">
                      <SettingOutlined className="text-4xl mb-2 text-slate-300" />
                      <div className="text-lg font-medium mb-2">No Template Selected</div>
                      <div className="text-sm">Please select a template to enable AI processing</div>
                      <div className="text-xs mt-2 text-slate-400">
                        After selecting a template, you can run AI processing multiple times from the Records tab
                      </div>
                    </div>
                  )}
                </Space>
              </Card>
            </Space>
          </Tabs.TabPane>
        </Tabs>
      </Card>



      <Modal
        title="Import Records"
        open={importVisible}
        onCancel={() => setImportVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={async () => {
          if (!importFile) { message.error('Please select a file'); return; }
          try {
            setImporting(true);
            await api.uploadStudyRecords(Number(id), importFile, {
              format: importFormat || undefined,
              defaultContentType: importDefaultType,
              startImmediately: importAutoStart,
            });
            message.success('Import completed');
            setImportVisible(false);
            setImportFile(null);
            fetchRecords();
          } catch (e) {
            message.error('Import failed');
          } finally {
            setImporting(false);
          }
        }}>
          <Form.Item label="File">
            <input
              type="file"
              accept=".csv,.txt,.jsonl,.zip"
              onChange={(e) => setImportFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
            />
          </Form.Item>
          <Form.Item label="Format (optional)">
            <Input
              placeholder="csv | jsonl | txt | zip"
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="Default Content Type">
            <Space>
              <Button type={importDefaultType === 'TEXT' ? 'primary' : 'default'} onClick={() => setImportDefaultType('TEXT')}>Text</Button>
              <Button type={importDefaultType === 'IMAGE' ? 'primary' : 'default'} onClick={() => setImportDefaultType('IMAGE')}>Image</Button>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={importing}>
                Upload
              </Button>
              <Button onClick={() => setImportVisible(false)}>Cancel</Button>
              <Button onClick={() => setImportAutoStart(!importAutoStart)}>
                {importAutoStart ? 'Will Auto Start' : 'Do Not Auto Start'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Study"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical" onFinish={async (values) => {
          try {
            const response = await api.updateStudy(Number(id), values);
            if (response.data.code === 200) {
              message.success('Study updated successfully');
              setEditModalVisible(false);
              fetchStudy();
            } else {
              message.error('Failed to update study');
            }
          } catch (error) {
            console.error('Failed to update study:', error);
            message.error('Failed to update study');
          }
        }}>
          <Form.Item 
            label="Name" 
            name="name"
            initialValue={editStudyName}
            rules={[{ required: true, message: 'Please enter study name' }]}
          >
            <Input placeholder="Enter study name" />
          </Form.Item>
          <Form.Item 
            label="Description" 
            name="description"
            initialValue={editStudyDescription}
            rules={[{ required: true, message: 'Please enter study description' }]}
          >
            <Input.TextArea 
              placeholder="Enter study description" 
              rows={3}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default StudyAudit; 