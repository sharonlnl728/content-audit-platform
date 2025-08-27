import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Input,
  Table,
  Tag,
  Typography,
  Popconfirm,
  Space,
  Tooltip,
  message
} from 'antd';
import { motion } from 'framer-motion';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import TemplateForm from './TemplateForm';

const { Title, Text } = Typography;
const { Search } = Input;

interface AuditTemplate {
  id: number;
  templateId: string;
  name: string;
  version: string;
  description: string;
  contentType: string;
  industry: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Template: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => 
      `Items ${range[0]}-${range[1]} of ${total} total records`,
    pageSizeOptions: ['10', '20', '50', '100'],
  });

  const fetchTemplates = async (page = pagination.current, pageSize = pagination.pageSize) => {
    try {
      setLoading(true);
      const response = await api.getTemplates();
      if (response?.data?.code === 200) {
        const allTemplates = response.data.data || [];
        
        // Filter first (search)
        const filteredData = allTemplates.filter((template: AuditTemplate) => 
          template.name.toLowerCase().includes(searchText.toLowerCase()) ||
          template.templateId.toLowerCase().includes(searchText.toLowerCase()) ||
          template.description.toLowerCase().includes(searchText.toLowerCase())
        );
        
        // Then calculate pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        setTemplates(paginatedData);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: filteredData.length,
        }));
      } else {
        const errorMsg = response?.data?.message || 'Unknown error';
        console.error('API Error:', response?.data);
        message.error(`Failed to fetch templates: ${errorMsg}`);
      }
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Network error';
      message.error(`Failed to fetch templates: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    // Reset to first page when searching
    fetchTemplates(1, pagination.pageSize);
  };

  // Handle search box changes (including clear)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    
    // If search box is cleared, immediately restore display of all templates
    if (value === '') {
      fetchTemplates(1, pagination.pageSize);
    }
  };

  // Handle pagination changes
  const handleTableChange = (paginationInfo: any) => {
    const { current, pageSize } = paginationInfo;
    fetchTemplates(current, pageSize);
  };

  // Refresh template list
  const handleRefresh = () => {
    fetchTemplates(pagination.current, pagination.pageSize);
  };

  const handleCreateTemplate = () => {
    setTemplateModalVisible(true);
  };

  const handleModalCancel = () => {
    setTemplateModalVisible(false);
  };

  const handleDeleteTemplate = async (template: AuditTemplate) => {
    try {
      if (typeof template.id !== 'number' || isNaN(template.id)) {
        message.error('Invalid template ID');
        return;
      }
      
      const response = await api.deleteTemplate(template.id);
      if (response?.data?.code === 200) {
      message.success('Template deleted successfully');
      fetchTemplates();
      } else {
        message.error('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      message.error('Failed to delete template');
    }
  };

  const handleManageTemplate = (template: AuditTemplate) => {
    navigate(`/templates/${template.id}`);
  };

  const columns = [
    {
      title: 'Template',
      key: 'template',
      render: (_: any, record: AuditTemplate) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-900 text-base">{record.name}</span>
            {record.isDefault && (
              <Tag color="purple">Default</Tag>
            )}
          </div>
          <div className="text-sm text-slate-700 font-mono">{record.templateId}</div>
          <div className="text-xs text-slate-600 line-clamp-2">{record.description}</div>
        </div>
      ),
      width: 350,
    },
    {
      title: 'Type & Version',
      key: 'type',
      render: (_: any, record: AuditTemplate) => (
        <div className="space-y-2">
          <Tag color="purple" className="text-xs">{record.contentType}</Tag>
          <div className="text-xs text-slate-600">
            <div>v{record.version}</div>
            {record.industry && <div>{record.industry}</div>}
          </div>
        </div>
      ),
      width: 130,
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: AuditTemplate) => (
        <div className="space-y-2">
          <Tag 
            color={record.isActive ? 'green' : 'red'} 
            className="font-medium"
          >
            {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
        </div>
      ),
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Last Updated',
      key: 'updatedAt',
      render: (_: any, record: AuditTemplate) => {
        const dateObj = new Date(record.updatedAt);
        
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          return <div className="text-sm text-slate-500">Invalid Date</div>;
        }
        
        return (
          <div className="text-sm text-slate-700">
            {dateObj.toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        );
      },
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AuditTemplate) => (
        <Space size="middle">
          <Tooltip title="View Template">
            <Button
              type="text"
          icon={<EyeOutlined />} 
              onClick={() => handleManageTemplate(record)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 hover:scale-110 transition-all duration-200"
              size="small"
            />
          </Tooltip>
            <Popconfirm
            title="Delete Template"
            description="Are you sure you want to delete this template? This action cannot be undone."
          onConfirm={() => handleDeleteTemplate(record)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete Template">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:scale-110 transition-all duration-200"
                size="small"
              />
            </Tooltip>
            </Popconfirm>
        </Space>
      ),
      width: 100,
      align: 'center' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
    >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Title level={1} className="text-slate-900 mb-2">
            Template Management
            </Title>
          <Text className="text-slate-700 text-lg">
            Create and manage content moderation templates for different use cases
            </Text>
        </motion.div>

        {/* Search + Actions Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
            <div className="flex justify-between items-center">
              <Search
                placeholder="Search templates..."
                className="w-64"
                allowClear
                value={searchText}
                onChange={handleSearchChange}
                onSearch={handleSearch}
              />
              <div className="flex gap-2">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTemplate}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Create Template
          </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleRefresh}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
                >
                  Refresh
                </Button>
              </div>
        </div>
          </Card>
        </motion.div>

        {/* Template List */}
        <Card 
          className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl"
          title={<span className="text-slate-900 font-semibold">Templates ({templates.length})</span>}
        >
          {templates.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-slate-700 text-lg mb-2">No templates found</div>
              <div className="text-slate-600 text-sm mb-4">
                {searchText ? 'Try adjusting your search criteria' : 'Create your first template to get started'}
              </div>
              {!searchText && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateTemplate}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Create Your First Template
                </Button>
              )}
            </div>
          ) : (
        <Table
          columns={columns}
              dataSource={templates}
            rowKey="id"
          loading={loading}
              pagination={pagination}
              onChange={handleTableChange}
              className="text-slate-900"
              rowClassName="hover:bg-purple-50/80 transition-all duration-200"
              size="middle"
              scroll={{ x: 800 }}
            />
          )}
      </Card>

        {/* Template Form Modal */}
      <TemplateForm
        visible={templateModalVisible}
          template={null}
          onCancel={handleModalCancel}
          onSuccess={async () => {
            setTemplateModalVisible(false);
            await fetchTemplates();
          }}
        />
    </motion.div>
    </div>
  );
};

export default Template; 