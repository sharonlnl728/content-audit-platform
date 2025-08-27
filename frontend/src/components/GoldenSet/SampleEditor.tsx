import React, { useState } from 'react';
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Select,
  Row,
  Col,
  Upload,
  Progress
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ImportOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { GoldenSample } from '../../types/goldenSet';
import api from '../../api';
import { goldenSetApi } from '../../api/goldenSet';



interface SampleEditorProps {
  samples: GoldenSample[];
  onSamplesChange: (samples: GoldenSample[]) => void;
  onClose?: () => void;
  templateConfig?: any;
}

interface TestResult {
  sampleId: string;
  content: string;
  aiResult: string;
  normalizedAiResult: string;
  aiCategories: string[];
  isCorrect: boolean;
  expectedResult: string;
  warning?: string;
}

type EvalStats = { 
  accuracy: number; 
  precision: number; 
  recall: number; 
  f1: number; 
  count: number 
};

const SampleEditor: React.FC<SampleEditorProps> = ({
  samples,
  onSamplesChange,
  templateConfig,
}) => {
  const [editingSample, setEditingSample] = useState<GoldenSample | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<EvalStats | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [currentTestSample, setCurrentTestSample] = useState<number>(0);
  const [testProgress, setTestProgress] = useState<number>(0);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState('');

  // Filtered and paginated samples
  const filteredSamples = samples.filter(sample => 
    sample.content.toLowerCase().includes(searchText.toLowerCase()) ||
    sample.expectedResult.toLowerCase().includes(searchText.toLowerCase()) ||
    sample.category.toLowerCase().includes(searchText.toLowerCase()) ||
    (sample.notes && sample.notes.toLowerCase().includes(searchText.toLowerCase()))
  );

  const paginatedSamples = filteredSamples.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle page turning
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (_current: number, size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      setImportLoading(true);
      const response = await goldenSetApi.uploadForTemplate('default', file);
      if (response?.data?.ok) {
        const template = response.data.template;
        const newSamples: GoldenSample[] = template.samples.map((s: any) => ({
          id: s.id,
          content: s.content,
          expectedResult: s.expectedResult,
          category: s.category,
          severity: s.severity,
          notes: s.notes
        }));
        
        // Replace existing samples
        onSamplesChange(newSamples);
        message.success(`File "${response.data.fileName}" imported successfully with ${newSamples.length} samples`);
      } else {
        message.error(response?.data?.error || 'Failed to import file');
      }
    } catch (error) {
      console.error('Failed to import file:', error);
      message.error('Failed to import file');
    } finally {
      setImportLoading(false);
    }
    return false; // Prevent default upload behavior
  };

  // Import preset samples (simplified version)
  const handleImportPresetSamples = () => {
    setImportModalVisible(true);
  };

  // Edit sample
  const handleEditSample = (sample: GoldenSample) => {
    setEditingSample(sample);
    form.setFieldsValue(sample);
    setIsModalVisible(true);
  };

  // Save sample
  const handleSaveSample = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingSample) {
        // Edit existing sample
        const updatedSamples = samples.map(s => 
          s.id === editingSample.id ? { ...s, ...values } : s
        );
        onSamplesChange(updatedSamples);
        message.success('Sample updated successfully');
      } else {
        // Add new sample
        const newSample: GoldenSample = {
          id: `sample-${Date.now()}`,
          ...values
        };
        onSamplesChange([...samples, newSample]);
        message.success('Sample added successfully');
      }
      
      setIsModalVisible(false);
      setEditingSample(null);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save sample:', error);
    }
  };

  // Delete sample
  const handleDeleteSample = (id: string) => {
    const newSamples = samples.filter(s => s.id !== id);
    onSamplesChange(newSamples);
    message.success('Sample deleted successfully');
  };

  // Batch delete
  const handleBatchDelete = () => {
    const newSamples = samples.filter(s => !selectedRowKeys.includes(s.id));
    onSamplesChange(newSamples);
    setSelectedRowKeys([]);
    message.success('Selected samples deleted successfully');
  };

  // Run test
  const handleRunTest = async () => {
    if (samples.length === 0) {
      message.warning('No samples to test');
      return;
    }

    setTestStatus('running');
    setCurrentTestSample(0);
    setTestProgress(0);
    const results: TestResult[] = [];
    
    try {
      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        
        // Update progress
        setCurrentTestSample(i + 1);
        setTestProgress(((i + 1) / samples.length) * 100);
        
        try {
          const response = await api.auditText(sample.content, templateConfig);
          
          if (response?.data?.code === 200) {
            const auditResult = response.data.data;
            const aiResult = auditResult.status;
            const normalizedAiResult = aiResult === 'REJECT' ? 'BLOCK' : aiResult === 'APPROVE' ? 'PASS' : aiResult;
            const isCorrect = normalizedAiResult === sample.expectedResult;
            
            let warning = '';
            if (sample.expectedResult === 'PASS' && aiResult === 'BLOCK') {
              warning = 'AI over-classified normal business content as spam';
            }
            
            results.push({
              sampleId: sample.id,
              content: sample.content,
              aiResult,
              normalizedAiResult,
              aiCategories: auditResult.categories || [],
              isCorrect,
              expectedResult: sample.expectedResult,
              warning
            });
          } else {
            results.push({
              sampleId: sample.id,
              content: sample.content,
              aiResult: 'ERROR',
              normalizedAiResult: 'ERROR',
              aiCategories: [],
              isCorrect: false,
              expectedResult: sample.expectedResult
            });
          }
        } catch (error) {
          results.push({
            sampleId: sample.id,
            content: sample.content,
            aiResult: 'ERROR',
            normalizedAiResult: 'ERROR',
            aiCategories: [],
            isCorrect: false,
            expectedResult: sample.expectedResult
          });
        }
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setTestResults(results);
      setTestStatus('completed');
      setTestProgress(100);
      
      // Calculate statistics (three categories: PASS/BLOCK/REVIEW)
      const total = results.length;
      const correct = results.filter(r => r.isCorrect).length;
      
      // Calculate accuracy for each category
      const passCorrect = results.filter(r => r.expectedResult === 'PASS' && r.normalizedAiResult === 'PASS').length;
      const blockCorrect = results.filter(r => r.expectedResult === 'BLOCK' && r.normalizedAiResult === 'BLOCK').length;
      const reviewCorrect = results.filter(r => r.expectedResult === 'REVIEW' && r.normalizedAiResult === 'REVIEW').length;
      
      const passTotal = results.filter(r => r.expectedResult === 'PASS').length;
      const blockTotal = results.filter(r => r.expectedResult === 'BLOCK').length;
      const reviewTotal = results.filter(r => r.expectedResult === 'REVIEW').length;
      
      // Macro average precision and recall
      const passAccuracy = passTotal > 0 ? (passCorrect / passTotal) * 100 : 0;
      const blockAccuracy = blockTotal > 0 ? (blockCorrect / blockTotal) * 100 : 0;
      const reviewAccuracy = reviewTotal > 0 ? (reviewCorrect / reviewTotal) * 100 : 0;
      
      const precision = (passAccuracy + blockAccuracy + reviewAccuracy) / 3;
      const recall = precision; // For balanced multi-class, precision and recall are equal
      const f1 = precision;
      
      setStats({
        accuracy: (correct / total) * 100,
        precision,
        recall,
        f1,
        count: total
      });
      
      // Display detailed error analysis
      const incorrect = results.filter(r => !r.isCorrect);
      
      message.success(`Test completed! Accuracy: ${((correct / total) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('Test failed:', error);
      setTestStatus('failed');
      message.error('Test failed');
    }
  };

  // Get table column definitions
  const getColumns = (): ColumnsType<GoldenSample> => {
    const baseColumns: ColumnsType<GoldenSample> = [
      {
        title: 'Content',
        dataIndex: 'content',
        key: 'content',
        width: '30%',
        render: (text: string) => (
          <Tooltip title={text}>
            <span className="truncate-text">{text}</span>
          </Tooltip>
        ),
      },
      {
        title: 'Expected',
        dataIndex: 'expectedResult',
        key: 'expectedResult',
        width: '10%',
        render: (text: string) => (
          <Tag color={text === 'BLOCK' ? 'red' : text === 'REVIEW' ? 'orange' : 'blue'}>
            {text}
          </Tag>
        ),
      },
    ];

    // If there are test results, add extra columns
    if (testResults.length > 0) {
      baseColumns.push(
        {
          title: 'AI Result',
          key: 'aiResult',
          width: '10%',
          render: (_: any, record: GoldenSample) => {
            const result = testResults.find(r => r.sampleId === record.id);
            if (!result) return '-';
            
            return (
              <Tag color={result.aiResult === 'BLOCK' || result.aiResult === 'REJECT' ? 'red' : result.aiResult === 'PASS' || result.aiResult === 'APPROVE' ? 'blue' : 'orange'}>
                {result.aiResult}
              </Tag>
            );
          },
        },
        {
          title: 'Match?',
          key: 'isCorrect',
          width: '8%',
          render: (_: any, record: GoldenSample) => {
            const result = testResults.find(r => r.sampleId === record.id);
            if (!result) return '-';
            
            return result.isCorrect ? (
              <CheckCircleOutlined className="text-green-500 text-lg" />
            ) : (
              <ExclamationCircleOutlined className="text-red-500 text-lg" />
            );
          },
        },
        {
          title: 'Category',
          dataIndex: 'category',
          key: 'category',
          width: '12%',
          render: (text: string) => (
            <Tag color="default">{text}</Tag>
          ),
        },
        {
          title: 'Severity',
          dataIndex: 'severity',
          key: 'severity',
          width: '10%',
          render: (text: string) => (
            <Tag color={text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
              {text}
            </Tag>
          ),
        },
        {
          title: 'AI Categories',
          key: 'aiCategories',
          width: '15%',
          render: (_: any, record: GoldenSample) => {
            const result = testResults.find(r => r.sampleId === record.id);
            if (!result) return '-';
            
            const displayCategories = result.aiCategories.slice(0, 2);
            const remainingCount = result.aiCategories.length - 2;
            
            return (
              <div>
                {displayCategories.map((cat, index) => (
                  <Tag key={index} className="mb-1">
                    {cat}
                  </Tag>
                ))}
                {remainingCount > 0 && (
                  <Tag className="mb-1">
                    +{remainingCount}
                  </Tag>
                )}
                {result.warning && (
                  <div className="text-xs text-red-500 mt-1">
                    ⚠️ {result.warning}
                  </div>
                )}
              </div>
            );
          },
        },
        {
          title: 'Notes',
          dataIndex: 'notes',
          key: 'notes',
          width: '15%',
          render: (text: string) => text || '-',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: '15%',
          render: (_: any, record: GoldenSample) => (
            <div className="flex items-center space-x-2">
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditSample(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure you want to delete this sample?"
                onConfirm={() => handleDeleteSample(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </div>
          )
        }
      );
    } else {
      // Columns when no test results
      baseColumns.push(
        {
          title: 'Category',
          dataIndex: 'category',
          key: 'category',
          width: '12%',
          render: (text: string) => (
            <Tag color="default">{text}</Tag>
          ),
        },
        {
          title: 'Severity',
          dataIndex: 'severity',
          key: 'severity',
          width: '10%',
          render: (text: string) => (
            <Tag color={text === 'high' ? 'red' : text === 'medium' ? 'orange' : 'green'}>
              {text}
            </Tag>
          ),
        },
        {
          title: 'Notes',
          dataIndex: 'notes',
          key: 'notes',
          width: '15%',
          render: (text: string) => text || '-',
        },
        {
          title: 'Actions',
          key: 'actions',
          width: '15%',
          render: (_: any, record: GoldenSample) => (
            <div className="flex items-center space-x-2">
              <Tooltip title="Edit">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEditSample(record)}
                />
              </Tooltip>
              <Popconfirm
                title="Are you sure you want to delete this sample?"
                onConfirm={() => handleDeleteSample(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </div>
          )
        }
      );
    }

    return baseColumns;
  };

  return (
    <div className="sample-editor">
      {/* Operation button area */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          Add Sample
        </Button>
        
        <Button
          icon={<ImportOutlined />}
          onClick={handleImportPresetSamples}
        >
          Import
        </Button>
        
        <Button
          icon={<PlayCircleOutlined />}
          onClick={handleRunTest}
          loading={testStatus === 'running'}
          disabled={samples.length === 0}
        >
          Run Test
        </Button>
        
        {testResults.length > 0 && (
          <Button
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setTestResults([]);
              setStats(null);
              setTestStatus('idle');
              setCurrentTestSample(0);
              setTestProgress(0);
            }}
          >
            Clear Results
          </Button>
        )}
        
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title="Are you sure you want to delete the selected samples?"
            onConfirm={handleBatchDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete Selected ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}
        
        {/* Search box */}
        <div className="ml-auto">
          <Input.Search
            placeholder="Search samples..."
            allowClear
            onSearch={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
          />
        </div>
      </div>

      {/* Simple progress bar */}
      {testStatus === 'running' && (
        <div className="mb-4 p-4 border rounded-lg bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span>Running test...</span>
            <span>{currentTestSample} / {samples.length}</span>
          </div>
          <Progress percent={testProgress} />
        </div>
      )}



      {/* Test results statistics */}
      {stats && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <Row gutter={16}>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.accuracy.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.precision.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Precision</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.recall.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Recall</div>
              </div>
            </Col>
            <Col span={6}>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.f1.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">F1 Score</div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Sample table */}
      <Table
        columns={getColumns()}
        dataSource={paginatedSamples}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        pagination={{
          total: filteredSamples.length,
          current: currentPage,
          pageSize: pageSize,
          onChange: handlePageChange,
          onShowSizeChange: handlePageSizeChange,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} samples`,
        }}
        scroll={{ x: 1200 }}
      />

      {/* Edit sample modal */}
      <Modal
        title={editingSample ? "Edit Sample" : "Add Sample"}
        open={isModalVisible}
        onOk={handleSaveSample}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingSample(null);
          form.resetFields();
        }}
        confirmLoading={false}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Please input content!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="expectedResult"
                label="Expected Result"
                rules={[{ required: true, message: "Please select expected result!" }]}
              >
                <Select>
                  <Select.Option value="PASS">PASS</Select.Option>
                  <Select.Option value="BLOCK">BLOCK</Select.Option>
                  <Select.Option value="REVIEW">REVIEW</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: "Please select category!" }]}
              >
                <Select>
                  <Select.Option value="compliance">Compliance</Select.Option>
                  <Select.Option value="common_violation">Common Violation</Select.Option>
                  <Select.Option value="edge_case">Edge Case</Select.Option>
                  <Select.Option value="boundary_test">Boundary Test</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="severity"
                label="Severity"
                rules={[{ required: true, message: "Please select severity!" }]}
              >
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Import template modal */}
      <Modal
        title="Import Golden Set"
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-medium mb-2">Paste JSON Content</h4>
            <div className="text-sm text-gray-600 mb-2">
              Paste your Golden Set JSON content here. The JSON should contain a "samples" array.
            </div>
            <Input.TextArea
              id="json-paste-area"
              rows={15}
              placeholder={`{
  "name": "Your Golden Set Name",
  "description": "Description of your Golden Set",
  "samples": [
    {
      "id": "sample-1",
      "content": "Content to test",
      "expectedResult": "PASS",
      "category": "compliance",
      "severity": "low",
      "notes": "Optional notes"
    }
  ]
}`}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setImportModalVisible(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={() => {
                const jsonText = (document.getElementById('json-paste-area') as HTMLTextAreaElement).value;
                if (jsonText.trim()) {
                  try {
                    const jsonData = JSON.parse(jsonText);
                    
                    // Support two formats:
                    // 1. Directly containing samples array
                    // 2. Nested format, find the first key containing 'samples'
                    let templateData = null;
                    let samples = null;
                    
                    if (jsonData.samples && Array.isArray(jsonData.samples)) {
                      // Direct format
                      templateData = jsonData;
                      samples = jsonData.samples;
                    } else {
                      // Nested format, find the first key containing 'samples'
                      for (const [, value] of Object.entries(jsonData)) {
                        if (typeof value === 'object' && value !== null && 'samples' in value && Array.isArray((value as any).samples)) {
                          templateData = value;
                          samples = (value as any).samples;
                          break;
                        }
                      }
                    }
                    
                    if (templateData && samples && Array.isArray(samples)) {
                      const newSamples: GoldenSample[] = samples.map((s: any) => ({
                        id: s.id || `sample-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        content: s.content,
                        expectedResult: s.expectedResult,
                        category: s.category || 'compliance',
                        severity: s.severity || 'medium',
                        notes: s.notes || ''
                      }));
                      
                      onSamplesChange(newSamples);
                      message.success(`JSON content imported successfully with ${newSamples.length} samples`);
                      setImportModalVisible(false);
                    } else {
                      message.error('Invalid JSON format: missing "samples" array or template structure');
                    }
                  } catch (error) {
                    console.error('JSON parsing error:', error);
                    message.error('Invalid JSON format. Please check your JSON syntax.');
                  }
                } else {
                  message.warning('Please paste JSON content first');
                }
              }}
            >
              Import JSON
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="text-lg font-medium mb-2">Or Upload File</h4>
            <Upload.Dragger
              accept=".json"
              beforeUpload={handleFileUpload}
              showUploadList={false}
              disabled={importLoading}
            >
              <p className="ant-upload-drag-icon">
                <ImportOutlined />
              </p>
              <p className="ant-upload-text">Click or drag JSON file to this area to upload</p>
              <p className="ant-upload-hint">
                Support for JSON files only. File should contain a "samples" array.
              </p>
            </Upload.Dragger>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SampleEditor;
