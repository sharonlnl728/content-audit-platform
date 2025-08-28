import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Tag, 
  Space, 
  Typography,
  Tabs,
  Popconfirm,
  Input,
  App
} from 'antd';
import { 
  ArrowLeftOutlined,
  PlusOutlined,
  CopyOutlined,
  DeleteOutlined,
  CloseOutlined,
  EditOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoldenSet, GoldenSample } from '../../types/goldenSet';
import { AuditTemplate } from '../../types/template';
import SampleEditor from '../../components/GoldenSet/SampleEditor';
import TemplateEditModal from '../../components/Template/TemplateEditModal';
import ConfigurationEditModal from '../../components/Template/ConfigurationEditModal';
import api from '../../api';
import { goldenSetApi } from '../../api/goldenSet';


const { Title, Text } = Typography;

const TemplateDetail: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { message: messageApi } = App.useApp();
  const [template, setTemplate] = useState<AuditTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [goldenSets, setGoldenSets] = useState<GoldenSet[]>([]);
  const [selectedGoldenSet, setSelectedGoldenSet] = useState<GoldenSet | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editRulesMode, setEditRulesMode] = useState(false);
  const [editDecisionMode, setEditDecisionMode] = useState(false);
  const [editPromptMode, setEditPromptMode] = useState(false);
  const [editMetadataMode, setEditMetadataMode] = useState(false);
  const [editingGoldenSetId, setEditingGoldenSetId] = useState<string | null>(null);
  const [editingGoldenSetName, setEditingGoldenSetName] = useState('');


  // Get template details
  useEffect(() => {
    if (templateId) {
      fetchTemplateDetail(templateId);
    }
  }, [templateId]);

  const fetchTemplateDetail = async (templateIdParam: string) => {
    setLoading(true);
    try {
      // Validate templateId parameter
      const templateId = parseInt(templateIdParam);
      if (isNaN(templateId)) {
        console.error('Invalid templateId:', templateIdParam);
        messageApi.error('Invalid template ID');
        navigate('/templates');
        return;
      }
      
      // Use correct API to get single template details
      const response = await api.getTemplate(templateId);
      if (response?.data?.code === 200) {
        const templateData = response.data.data;
        setTemplate(templateData);
        // Load existing Golden Sets data (but don't auto-create new ones)
        // Use the string templateId from template data to match database storage
        loadExistingGoldenSets(templateData.templateId);
      } else {
        messageApi.error('Failed to fetch template details');
        navigate('/templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      messageApi.error('Failed to fetch template details');
      navigate('/templates');
    } finally {
      setLoading(false);
    }
  };



  // Load existing Golden Sets data (without auto-creating new ones)
  const loadExistingGoldenSets = (templateId: string) => {
    goldenSetApi.getGoldenSetsByTemplateId(templateId).then((response: any) => {
      if (response?.data?.ok === true) {
        setGoldenSets(response.data.data || []);
        setSelectedGoldenSet(response.data.data?.[0] || null);
      } else {
        // If no existing data, just set empty array
        setGoldenSets([]);
        setSelectedGoldenSet(null);
      }
    }).catch((error: any) => {
      console.error('Failed to fetch existing golden sets:', error);
      // If API fails, just set empty array
      setGoldenSets([]);
      setSelectedGoldenSet(null);
    });
  };

  // Save Golden Sets to API - deprecated, now each operation directly calls API
  // const saveGoldenSetsToStorage = (newGoldenSets: GoldenSet[]) => {
  //   if (template) {
  //     // We don't need to call API here, as each operation will call API separately
  //     // Just update local state
  //     setGoldenSets(newGoldenSets);
  //   }
  // };



  // Create new Golden Set
  const handleCreateGoldenSet = async () => {
    if (!template) return;
    
    try {
      const newGoldenSetData = {
        name: `New Golden Set ${goldenSets.length + 1}`,
        description: 'Newly created test set',
        category: 'content_moderation' as const,
        version: '1.0.0'
      };
      
      // Call API to create Golden Set
      const response = await goldenSetApi.createGoldenSet(template.templateId, newGoldenSetData);
      
      if (response?.data?.ok === true) {
        const createdGoldenSet = response.data.data;
        const newGoldenSets = [...goldenSets, createdGoldenSet];
        setGoldenSets(newGoldenSets);
        setSelectedGoldenSet(createdGoldenSet);
        setActiveTab('goldenSets');
        messageApi.success('Golden Set created successfully');
      } else {
        messageApi.error('Failed to create Golden Set');
      }
    } catch (error) {
      console.error('Error creating Golden Set:', error);
      messageApi.error('Failed to create Golden Set');
    }
  };

  // Delete Golden Set
  const handleDeleteGoldenSet = async (id: string) => {
    // First find the Golden Set's database ID
    const goldenSet = goldenSets.find(gs => gs.id === id);
    if (!goldenSet || typeof goldenSet.id !== 'number') {
      messageApi.error('Invalid golden set ID');
      return;
    }
    
    try {
      // Call API to delete Golden Set
      const response = await goldenSetApi.deleteGoldenSet(goldenSet.id);
      
      if (response?.data?.ok === true) {
        // Remove from local state after successful deletion
        const newGoldenSets = goldenSets.filter(gs => gs.id !== id);
        setGoldenSets(newGoldenSets);
        if (selectedGoldenSet?.id === id) {
          setSelectedGoldenSet(newGoldenSets[0] || null);
        }
        messageApi.success('Golden Set deleted successfully');
      } else {
        messageApi.error('Failed to delete Golden Set');
      }
    } catch (error) {
      console.error('Error deleting Golden Set:', error);
      messageApi.error('Failed to delete Golden Set');
    }
  };

  // Copy Golden Set
  const handleCopyGoldenSet = async (goldenSet: GoldenSet) => {
    if (!template) return;
    
    try {
      const copyData = {
        name: `${goldenSet.name} (Copy)`,
        description: goldenSet.description,
        category: goldenSet.category,
        version: '1.0.0'
      };
      
      // Call API to create a copy
      const response = await goldenSetApi.createGoldenSet(template.templateId, copyData);
      
      if (response?.data?.ok === true) {
        const copiedGoldenSet = response.data.data;
        const newGoldenSets = [...goldenSets, copiedGoldenSet];
        setGoldenSets(newGoldenSets);
        messageApi.success('Golden Set copied successfully');
      } else {
        messageApi.error('Failed to copy Golden Set');
      }
    } catch (error) {
      console.error('Error copying Golden Set:', error);
      messageApi.error('Failed to copy Golden Set');
    }
  };



  // Save Golden Set changes - if edit functionality is needed, can implement here
  // const handleSaveGoldenSet = async (goldenSet: GoldenSet) => { ... };

  // Handle Golden Set name editing - Click edit button to edit
  const handleEditGoldenSetName = (goldenSet: GoldenSet) => {
    setEditingGoldenSetId(goldenSet.id);
    setEditingGoldenSetName(goldenSet.name);
  };

  const handleSaveGoldenSetName = async () => {
    if (!editingGoldenSetId || !editingGoldenSetName.trim()) return;
    
    try {
      const goldenSet = goldenSets.find(gs => gs.id === editingGoldenSetId);
      if (!goldenSet) return;

      // Only send the fields that the backend expects
      const updateData = {
        name: editingGoldenSetName.trim(),
        description: goldenSet.description,
        category: goldenSet.category,
        version: goldenSet.version
      };
      
      const response = await goldenSetApi.updateGoldenSet(parseInt(goldenSet.id), updateData);
      if (response?.data?.ok === true) {
        // Create updated Golden Set for local state
        const updatedGoldenSet = {
          ...goldenSet,
          name: editingGoldenSetName.trim()
        };
        
        // Update local state
        const newGoldenSets = goldenSets.map(gs =>
          gs.id === editingGoldenSetId ? updatedGoldenSet : gs
        );
        setGoldenSets(newGoldenSets);
        
        // Update selectedGoldenSet if it's the one being edited
        if (selectedGoldenSet?.id === editingGoldenSetId) {
          setSelectedGoldenSet(updatedGoldenSet);
        }
        
        setEditingGoldenSetId(null);
        setEditingGoldenSetName('');
        messageApi.success('Golden Set name updated successfully');
      } else {
        messageApi.error('Failed to update Golden Set name');
      }
    } catch (error) {
      console.error('Error updating Golden Set name:', error);
      messageApi.error('Failed to update Golden Set name');
    }
  };

  const handleCancelEditGoldenSetName = () => {
    setEditingGoldenSetId(null);
    setEditingGoldenSetName('');
  };




  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-700">Loading template details...</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-700">Template not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/templates')}
              className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
            >
              Back to Templates
            </Button>
            <div>
              <Title level={2} className="text-slate-800 mb-2">
                {template.name}
              </Title>
              <Text className="text-slate-600">
                Template ID: {template.templateId} | Version: {template.version}
              </Text>
            </div>
          </div>

        </div>

        {/* Main Content Area */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <div className="space-y-6">
                  {/* Template Basic Information */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Template Information</Title>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="primary"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => setEditMode(true)}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Edit Template
                        </Button>
                        {template.isActive ? (
                          <Tag color="green">Active</Tag>
                        ) : (
                          <Tag color="red">Inactive</Tag>
                        )}
                        {template.isDefault && <Tag color="blue">Default</Tag>}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Text className="text-slate-600 text-sm">Description</Text>
                        <div className="text-slate-800 mt-1">{template.description || 'No description'}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Text className="text-slate-600 text-sm">Template ID</Text>
                          <div className="text-slate-800 mt-1 font-mono text-blue-600">{template.templateId}</div>
                        </div>
                        <div>
                          <Text className="text-slate-600 text-sm">Version</Text>
                          <div className="text-slate-800 mt-1 font-mono text-green-600">{template.version}</div>
                        </div>
                      </div>
                      
                      <div>
                        <Text className="text-slate-600 text-sm">Content Type</Text>
                        <div className="text-slate-800 mt-1">{template.contentType}</div>
                      </div>
                    </div>
                  </Card>

                  {/* Golden Set Statistics Overview */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Golden Sets Overview</Title>
                      <Button 
                        type="link"
                        onClick={() => setActiveTab('goldenSets')}
                        className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                      >
                        Manage Golden Sets →
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{goldenSets.length}</div>
                        <div className="text-slate-600 text-sm">Golden Sets</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-700">
                          {goldenSets.reduce((sum, gs) => sum + gs.samples.length, 0)}
                        </div>
                        <div className="text-slate-600 text-sm">Total Samples</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: 'configuration',
              label: 'Configuration',
              children: (
                <div className="space-y-6">
                  {/* Configuration Header */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Template Configuration</Title>
                      <Space>
                        <Button
                          type="default"
                          icon={<ReloadOutlined />}
                          onClick={() => fetchTemplateDetail(template.templateId)}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                        >
                          Refresh Config
                        </Button>
                      </Space>
                    </div>
                    <div className="text-slate-600 text-sm">
                      Last updated: {template?.updatedAt ? new Date(template.updatedAt).toLocaleString() : 'Unknown'}
                    </div>
                  </Card>
                  
                  {/* Rules Configuration Editor */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Rules Configuration</Title>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEditRulesMode(true)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Edit Rules
                      </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {(() => {
                        try {
                          // Handle both array and string formats for backward compatibility
                          let rulesData = template.rules;
                          if (typeof rulesData === 'string') {
                            rulesData = JSON.parse(rulesData || '[]');
                          }
                          
                          return (
                            <div className="space-y-2">
                              {Array.isArray(rulesData) && rulesData.map((rule: string, index: number) => (
                                <div key={index} className="bg-white p-2 rounded border border-slate-200 shadow-sm">
                                  <Tag color="green" className="text-xs">{rule}</Tag>
                                </div>
                              ))}
                              {(!Array.isArray(rulesData) || rulesData.length === 0) && (
                                <div className="text-slate-500 text-sm">No rules configured</div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          return (
                            <pre className="text-green-300 text-sm overflow-x-auto">
                              {JSON.stringify(template.rules || '[]', null, 2)}
                            </pre>
                          );
                        }
                      })()}
                    </div>
                  </Card>
                  
                  {/* Decision Logic Editor */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Decision Logic</Title>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEditDecisionMode(true)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Edit Decision Logic
                      </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {(() => {
                        try {
                          // Handle both object and string formats for backward compatibility
                          let decisionData: any = template.decisionLogic;
                          if (typeof decisionData === 'string') {
                            decisionData = JSON.parse(decisionData || '{}');
                          }
                          
                          return (
                            <div className="space-y-3">
                              {decisionData.autoRejectOn && (
                                <div>
                                  <div className="text-slate-700 font-medium mb-1">Auto-reject on:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {decisionData.autoRejectOn.map((level: string, index: number) => (
                                      <Tag key={index} color="red" className="text-xs">{level}</Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {decisionData.autoReviewOn && (
                                <div>
                                  <div className="text-slate-700 font-medium mb-1">Auto-review on:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {decisionData.autoReviewOn.map((level: string, index: number) => (
                                      <Tag key={index} color="orange" className="text-xs">{level}</Tag>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {decisionData.aggregation && (
                                <div>
                                  <div className="text-slate-700 font-medium mb-1">Aggregation:</div>
                                  <Tag color="blue" className="text-xs">{decisionData.aggregation}</Tag>
                                </div>
                              )}
                              {Object.keys(decisionData).length === 0 && (
                                <div className="text-slate-500 text-sm">No decision logic configured</div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          return (
                            <pre className="text-purple-300 text-sm overflow-x-auto">
                              {JSON.stringify(template.decisionLogic || '{}', null, 2)}
                            </pre>
                          );
                        }
                      })()}
                    </div>
                  </Card>
                  
                  {/* AI Prompt Template Editor */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">AI Prompt Template</Title>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEditPromptMode(true)}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Edit Prompt
                      </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      {(() => {
                        try {
                          // Handle both object and string formats for backward compatibility
                          let promptData: any = template.aiPromptTemplate;
                          if (typeof promptData === 'string') {
                            promptData = JSON.parse(promptData || '{}');
                          }
                          
                          return (
                            <div className="space-y-4">
                              {/* System Prompt */}
                              <div>
                                <div className="text-slate-700 font-medium mb-2">System Prompt:</div>
                                <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                  <Text className="text-slate-800 text-sm whitespace-pre-wrap">
                                    {promptData.system_prompt || 'No system prompt configured'}
                                  </Text>
                                </div>
                              </div>
                              
                              {/* Content Prompt */}
                              <div>
                                <div className="text-slate-700 font-medium mb-2">Content Prompt:</div>
                                <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                  <Text className="text-slate-800 text-sm">
                                    {promptData.content_prompt || 'No content prompt configured'}
                                  </Text>
                                </div>
                              </div>
                              
                              {/* Rule Prompts */}
                              {promptData.rule_prompts && Object.keys(promptData.rule_prompts).length > 0 && (
                                <div>
                                  <div className="text-slate-700 font-medium mb-2">Rule Prompts:</div>
                                  <div className="space-y-2">
                                    {Object.entries(promptData.rule_prompts).map(([rule, prompt]) => (
                                      <div key={rule} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                        <div className="text-blue-600 text-sm font-medium mb-1">{rule}:</div>
                                        <Text className="text-slate-800 text-sm">
                                          {prompt as string}
                                        </Text>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        } catch (error) {
                          return (
                            <pre className="text-orange-300 text-sm overflow-x-auto">
                              {JSON.stringify(template.aiPromptTemplate || '{}', null, 2)}
                            </pre>
                          );
                        }
                      })()}
                    </div>
                  </Card>
                  
                  {/* Metadata Editor */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Metadata</Title>
                      <Button
                        type="primary"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => setEditMetadataMode(true)}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Edit Metadata
                      </Button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <pre className="text-slate-800 text-sm overflow-x-auto">
                        {JSON.stringify(template.metadata || '{}', null, 2)}
                      </pre>
                    </div>
                  </Card>
                </div>
              )
            },
            {
              key: 'goldenSets',
              label: 'Golden Sets',
              children: (
                <div className="space-y-6">
                  {/* Golden Set List and Management */}
                  <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="text-slate-800">Golden Sets Management</Title>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleCreateGoldenSet}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Create Golden Set
                      </Button>
                    </div>
                    
                    {goldenSets.length > 0 ? (
                      <div className="space-y-3">
                        {goldenSets.map((goldenSet) => (
                          <div 
                            key={goldenSet.id}
                            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                              selectedGoldenSet?.id === goldenSet.id 
                                ? 'bg-purple-100 border-purple-300' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                            onClick={() => setSelectedGoldenSet(goldenSet)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  {editingGoldenSetId === goldenSet.id ? (
                                    <Input
                                      value={editingGoldenSetName}
                                      onChange={(e) => setEditingGoldenSetName(e.target.value)}
                                      onPressEnter={handleSaveGoldenSetName}
                                      onBlur={handleSaveGoldenSetName}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Escape') {
                                          handleCancelEditGoldenSetName();
                                        }
                                      }}
                                      autoFocus
                                      className="flex-1 max-w-xs"
                                      size="small"
                                    />
                                  ) : (
                                    <Text 
                                      strong 
                                      className="text-slate-800"
                                    >
                                      {goldenSet.name}
                                    </Text>
                                  )}
                                  <Tag color="blue" className="text-xs">{goldenSet.category.replace('_', ' ').toUpperCase()}</Tag>
                                  <Tag color="green" className="text-xs">{goldenSet.samples.length}</Tag>
                                </div>
                                <Text className="text-slate-600 text-xs">{goldenSet.description}</Text>
                              </div>
                              <Space size="small">
                                {/* Edit Button - Small and elegant */}
                                <Button 
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditGoldenSetName(goldenSet);
                                  }}
                                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                                  title="Edit Name"
                                />
                                <Button 
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyGoldenSet(goldenSet);
                                  }}
                                  className="border-purple-300 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                                />
                                <Popconfirm
                                  title="Delete this Golden Set?"
                                  onConfirm={(e) => {
                                    e?.stopPropagation();
                                    handleDeleteGoldenSet(goldenSet.id);
                                  }}
                                  okText="Delete"
                                  cancelText="Cancel"
                                >
                                  <Button 
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                                  />
                                </Popconfirm>
                              </Space>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Text className="text-gray-400">No Golden Sets available. Create one to get started.</Text>
                      </div>
                                          )}
                      

                    </Card>

                                    {/* Sample editor */}
                  {selectedGoldenSet && (
                    <>
                      {/* Sample Editor */}
                      <Card className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border-white/20 shadow-xl">
                                                    <div className="flex items-center justify-between mb-4">
                              <div>
                                <Title level={4} className="text-white mb-1">
                                  Samples
                                </Title>
                                <Text className="text-gray-400 text-sm">
                                  {selectedGoldenSet.name} • {selectedGoldenSet.samples.length} samples
                                </Text>
                              </div>
                              <Button 
                                icon={<CloseOutlined />}
                                onClick={() => setSelectedGoldenSet(null)}
                                className="text-gray-400 border-gray-400 hover:bg-gray-400/20"
                              />
                            </div>
                        
                        <SampleEditor
                          samples={selectedGoldenSet.samples}
                          onSamplesChange={async (updatedSamples: GoldenSample[], operationType?: string) => {
                            try {
                              console.log('onSamplesChange called with operationType:', operationType);
                              
                              if (operationType === 'delete') {
                                // For delete operations, we need to handle it differently
                                // The updatedSamples already has the deleted samples removed
                                // We need to save this state to the backend
                                const updatedGoldenSet: GoldenSet = {
                                  ...selectedGoldenSet,
                                  samples: updatedSamples,
                                  updatedAt: new Date().toISOString()
                                };
                                
                                // Clean up samples data, remove id field to avoid backend type errors
                                const cleanedSamples = updatedSamples.map(sample => {
                                  const { id, ...sampleWithoutId } = sample;
                                  return sampleWithoutId;
                                });
                                
                                // Save to database
                                const response = await goldenSetApi.updateGoldenSet(parseInt(selectedGoldenSet.id), {
                                  id: parseInt(selectedGoldenSet.id),
                                  templateId: selectedGoldenSet.templateId,
                                  name: selectedGoldenSet.name,
                                  description: selectedGoldenSet.description,
                                  category: selectedGoldenSet.category,
                                  version: selectedGoldenSet.version,
                                  createdAt: selectedGoldenSet.createdAt,
                                  updatedAt: updatedGoldenSet.updatedAt,
                                  samples: cleanedSamples
                                });
                                
                                if (response?.data?.ok === true) {
                                  // Update local state after successful save
                                  const newGoldenSets = goldenSets.map(gs =>
                                    gs.id === selectedGoldenSet.id ? updatedGoldenSet : gs
                                  );
                                  setGoldenSets(newGoldenSets);
                                  setSelectedGoldenSet(updatedGoldenSet);
                                } else {
                                  messageApi.error(response?.data?.error || 'Failed to delete Golden Set samples');
                                }
                              } else {
                                // For other operations (add, edit, update), use existing logic
                                const updatedGoldenSet: GoldenSet = {
                                  ...selectedGoldenSet,
                                  samples: updatedSamples,
                                  updatedAt: new Date().toISOString()
                                };
                                
                                // Clean up samples data, remove id field to avoid backend type errors
                                const cleanedSamples = updatedSamples.map(sample => {
                                  const { id, ...sampleWithoutId } = sample;
                                  return sampleWithoutId;
                                });
                                
                                // Save to database first - pass complete GoldenSet data
                                const response = await goldenSetApi.updateGoldenSet(parseInt(selectedGoldenSet.id), {
                                  id: parseInt(selectedGoldenSet.id),
                                  templateId: selectedGoldenSet.templateId,
                                  name: selectedGoldenSet.name,
                                  description: selectedGoldenSet.description,
                                  category: selectedGoldenSet.category,
                                  version: selectedGoldenSet.version,
                                  createdAt: selectedGoldenSet.createdAt,
                                  updatedAt: updatedGoldenSet.updatedAt,
                                  samples: cleanedSamples
                                });
                                
                                if (response?.data?.ok === true) {
                                  // Update local state after successful save
                                  const newGoldenSets = goldenSets.map(gs =>
                                    gs.id === selectedGoldenSet.id ? updatedGoldenSet : gs
                                  );
                                  setGoldenSets(newGoldenSets);
                                  setSelectedGoldenSet(updatedGoldenSet);
                                  
                                  // No need to show additional messages, as SampleEditor already shows specific operation messages
                                } else {
                                  messageApi.error(response?.data?.error || 'Failed to save Golden Set samples');
                                }
                              }
                            } catch (error) {
                              console.error('Error saving Golden Set samples:', error);
                              messageApi.error('Failed to save Golden Set samples');
                            }
                          }}
                          templateConfig={(() => {
                            try {
                              const config = {
                                ...template,
                                ai_prompt_template: template?.aiPromptTemplate || null,
                                rules: template?.rules || null,
                                decision_logic: template?.decisionLogic || null,
                                metadata: template?.metadata || null,
                                cache_buster: Date.now() // Force cache invalidation
                              };

                              return config;
                            } catch (error) {
                              console.error('Error creating template config:', error);
                              return template;
                            }
                          })()}
                        />
                      </Card>
                    </>
                  )}
                </div>
              )
            },
          ]}
        />
      </motion.div>

      {/* Template Edit Modal */}
      {editMode && (
        <TemplateEditModal
          visible={editMode}
          template={template}
          onCancel={() => setEditMode(false)}
          onSuccess={(updatedTemplate) => {
            setTemplate(updatedTemplate);
            setEditMode(false);
            messageApi.success('Template updated successfully');
          }}
        />
      )}

      {/* Configuration Edit Modals */}
      {editRulesMode && (
        <ConfigurationEditModal
          visible={editRulesMode}
          type="rules"
          template={template}
          onCancel={() => setEditRulesMode(false)}
          onSuccess={(updatedTemplate) => {
            setTemplate(updatedTemplate);
            setEditRulesMode(false);
            messageApi.success('Rules configuration updated successfully');
          }}
        />
      )}

      {editDecisionMode && (
        <ConfigurationEditModal
          visible={editDecisionMode}
          type="decision"
          template={template}
          onCancel={() => setEditDecisionMode(false)}
          onSuccess={(updatedTemplate) => {
            setTemplate(updatedTemplate);
            setEditDecisionMode(false);
            messageApi.success('Decision logic updated successfully');
          }}
        />
      )}

      {editPromptMode && (
        <ConfigurationEditModal
          visible={editPromptMode}
          type="prompt"
          template={template}
          onCancel={() => setEditPromptMode(false)}
          onSuccess={(updatedTemplate) => {
            setTemplate(updatedTemplate);
            setEditPromptMode(false);
            messageApi.success('AI prompt template updated successfully');
          }}
        />
      )}

      {editMetadataMode && (
        <ConfigurationEditModal
          visible={editMetadataMode}
          type="metadata"
          template={template}
          onCancel={() => setEditMetadataMode(false)}
          onSuccess={(updatedTemplate) => {
            setTemplate(updatedTemplate);
            setEditMetadataMode(false);
            messageApi.success('Metadata updated successfully');
          }}
        />
      )}
    </div>
  );
};

export default TemplateDetail;
