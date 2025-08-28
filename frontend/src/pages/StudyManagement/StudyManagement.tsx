import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Space,
  Table,
  // Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title, Text } = Typography;

interface Study {
  id: number;
  name: string;
  description: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  userId: number;
  created_at: string;
  updated_at: string;
  total_records: number;
  reviewed_records: number;
  pending_records: number;
}

const StudyManagement: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    setLoading(true);
    try {
      const response = await api.getStudies();
      if (response.data.code === 200) {
        setStudies(response.data.data || []);
      } else {
        message.error('Failed to fetch studies');
      }
    } catch (error) {
      console.error('Failed to fetch studies:', error);
      message.error('Failed to fetch studies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudy = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleDeleteStudy = async (id: number) => {
    try {
      const response = await api.deleteStudy(id);
      if (response.data.code === 200) {
        message.success('Study deleted successfully');
        fetchStudies();
      } else {
        message.error('Failed to delete study');
      }
    } catch (error) {
      console.error('Failed to delete study:', error);
      message.error('Failed to delete study');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const response = await api.createStudy(values);
      if (response.data.code === 200) {
        message.success('Study created successfully');
        setModalVisible(false);
        fetchStudies();
      } else {
        message.error('Failed to create study');
      }
    } catch (error) {
      console.error('Failed to submit study:', error);
      message.error('Failed to submit study');
    }
  };

  const handleViewStudy = (study: Study) => {
    navigate(`/study/${study.id}`);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Text strong style={{ color: '#1e293b' }}>{text}</Text>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
      render: (text: string) => (
        <Text 
                      title={text}  // Browser native hover tooltip
          style={{ color: '#475569' }}
        >
          {text?.length > 80 ? `${text.substring(0, 80)}...` : text}
        </Text>
      )
    },
    {
      title: 'Progress',
      key: 'progress',
      width: 200,
      render: (record: Study) => {
        // Progress based on AI processing status: processed records / total records
        const processedRecords = record.total_records - record.pending_records;
        const progress = record.total_records > 0 
          ? Math.round((processedRecords / record.total_records) * 100)
          : 0;
        
        return (
          <div style={{ width: '100%' }}>
            <Progress 
              percent={progress} 
              size="small"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <Text style={{ color: '#64748b', fontSize: '12px' }}>
              {processedRecords}/{record.total_records} processed
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Total Records',
      key: 'records',
      width: 100,
      render: (record: Study) => (
        <Text style={{ color: '#1e293b', fontSize: '14px' }}>
          {record.total_records}
        </Text>
      )
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'createdAt',
      width: 100,
      render: (date: string) => (
        <Text style={{ color: '#64748b' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (record: Study) => (
        <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewStudy(record)}
              className="text-slate-700 hover:text-purple-600 p-0 h-auto"
            />
          <Popconfirm
            title="Are you sure you want to delete this study?"
            onConfirm={() => handleDeleteStudy(record.id)}
            okText="Yes"
            cancelText="No"
          >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                className="text-slate-700 hover:text-red-500 p-0 h-auto"
              />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6"
    >
      <div className="mb-6">
        <Title level={2} style={{ color: '#1e293b', marginBottom: '8px' }}>
          Study Management
        </Title>
        <Text style={{ color: '#475569' }}>
          Create and manage your content audit studies
        </Text>
      </div>

      <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateStudy}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Create Study
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={fetchStudies}
            className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200"
          >
            Refresh
          </Button>
        </div>

        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={studies}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1030 }}  // Adjusted from 1050px to 1030px after reducing Created column width
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            className="user-table"
          />
        </div>
      </Card>

      <Modal
        title="Create Study"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        className="study-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Study Name"
            rules={[{ required: true, message: 'Please enter study name' }]}
          >
            <Input placeholder="Enter study name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter study description' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter study description"
            />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Create
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </motion.div>
  );
};

export default StudyManagement; 