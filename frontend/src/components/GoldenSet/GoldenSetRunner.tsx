import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Progress, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Tag, 
  Space, 
  Alert, 
  Divider,
  Typography,
  Tooltip,
  message
} from 'antd';
import { 
  ExperimentOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { GoldenSet, GoldenSetReport, GoldenSetRunStatus } from '../../types/goldenSet';
import api from '../../api';

const { Title, Text } = Typography;

interface GoldenSetRunnerProps {
  templateId: string;
  templateName: string;
  goldenSet: GoldenSet; // Add goldenSet prop
  templateConfig?: any; // Add templateConfig prop
  onClose?: () => void;
}

const GoldenSetRunner: React.FC<GoldenSetRunnerProps> = ({ 
  templateId, 
  templateName, 
  goldenSet, // Add goldenSet parameter
  templateConfig, // Add templateConfig parameter
  onClose 
}) => {
  const [runStatus, setRunStatus] = useState<GoldenSetRunStatus>({
    status: 'idle',
    progress: 0,
    currentSample: 0,
    totalSamples: 0
  });
  
  const [report, setReport] = useState<GoldenSetReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Clear cache and reset test state
  const clearTestResults = () => {
    setReport(null);
    setLastTestTime(null);
    setStartTime(null);
    setEstimatedTimeRemaining(null);
    setRunStatus({
      status: 'idle',
      progress: 0,
      currentSample: 0,
      totalSamples: 0
    });
    message.info('Test results cleared. Ready for new test.');
  };


  // Run Golden Set test with real AI service
  const runGoldenSet = async () => {
    // Clear previous results and reset state
    setReport(null);
    setIsRunning(true);
    const testStartTime = Date.now();
    setStartTime(testStartTime);
    setEstimatedTimeRemaining(null);
    setRunStatus({
      status: 'running',
      progress: 0,
      currentSample: 0,
      totalSamples: goldenSet.samples.length
    });

    try {
      const results: any[] = [];

      // Add timestamp to ensure unique cache keys
      const testTimestamp = Date.now();

      // Create specialized Golden Set for TPL-LANDING-PAGE
      const landingPageGoldenSet: GoldenSet = {
        id: `golden-set-landing-page-${testTimestamp}`,
        templateId: templateId,
        name: 'Landing Page Ad Review Golden Set',
        description: 'Specialized Golden Set for testing TPL-LANDING-PAGE template with various ad content scenarios',
        version: '1.0',
        category: 'content_moderation',
        createdAt: new Date().toISOString(),
        samples: [
          // Normal content - should PASS
          {
            id: 'sample-1',
            content: 'Get 50% off on premium skincare products. Limited time offer with free shipping. Shop now!',
            expectedResult: 'PASS' as const,
            category: 'compliance' as const,
            notes: 'Normal promotional content'
          },
          {
            id: 'sample-2', 
            content: 'New smartphone with advanced camera features. 128GB storage, 5G ready. Order today!',
            expectedResult: 'PASS' as const,
            category: 'compliance' as const,
            notes: 'Standard product advertisement'
          },
          {
            id: 'sample-3',
            content: 'Professional web design services. Custom websites starting at $299. Contact us for a free quote.',
            expectedResult: 'PASS' as const,
            category: 'compliance' as const,
            notes: 'Legitimate service offering'
          },
          
          // Adult content violations - should BLOCK
          {
            id: 'sample-4',
            content: 'Hot singles in your area want to meet! Click here for adult dating and explicit content.',
            expectedResult: 'BLOCK' as const,
            category: 'common_violation' as const,
            notes: 'Adult content violation'
          },
          {
            id: 'sample-5',
            content: 'Nude photos and videos available. 18+ content with explicit sexual material.',
            expectedResult: 'BLOCK' as const,
            category: 'common_violation' as const,
            notes: 'Explicit adult content'
          },
          
          // Scam content violations - should BLOCK
          {
            id: 'sample-6',
            content: 'You won $1,000,000! Click here to claim your prize. Limited time offer!',
            expectedResult: 'BLOCK' as const,
            category: 'common_violation' as const,
            notes: 'Scam - fake prize'
          },
          {
            id: 'sample-7',
            content: 'Your bank account has been suspended. Click here to verify your identity immediately.',
            expectedResult: 'BLOCK' as const,
            category: 'common_violation' as const,
            notes: 'Phishing scam'
          },
          {
            id: 'sample-8',
            content: 'Make $10,000 per day working from home! No experience needed. Guaranteed income!',
            expectedResult: 'BLOCK' as const,
            category: 'common_violation' as const,
            notes: 'Get-rich-quick scam'
          },
          
          // Extremely ambiguous borderline cases - should REVIEW (AI should be truly confused)
          {
            id: 'sample-9',
            content: 'Discover the ancient secret that modern science is just beginning to understand. Join our exclusive community of wellness seekers.',
            expectedResult: 'REVIEW' as const,
            category: 'edge_case' as const,
            notes: 'Extremely ambiguous: ancient secrets + modern science + exclusive community, no specific claims but sounds suspicious'
          },
          {
            id: 'sample-10',
            content: 'Access the hidden wealth opportunities that only 1% of people know about. Our proprietary system reveals what banks don\'t want you to know.',
            expectedResult: 'REVIEW' as const,
            category: 'edge_case' as const,
            notes: 'Extremely ambiguous: conspiracy theory language + proprietary system + hidden knowledge, needs human review'
          },
          {
            id: 'sample-11',
            content: 'Unlock your true potential with our revolutionary mind-body connection program. Results guaranteed or your money back. Limited time enrollment.',
            expectedResult: 'REVIEW' as const,
            category: 'boundary_test' as const,
            notes: 'Extremely ambiguous: mind-body connection + guaranteed results + money back guarantee, borderline misleading'
          }
        ]
      };

      // Use the specialized Golden Set instead of the generic one
      const testSamples = landingPageGoldenSet.samples;
      setRunStatus(prev => ({ ...prev, totalSamples: testSamples.length }));

      // Process each sample with real AI audit
      for (let i = 0; i < testSamples.length; i++) {
        const sample = testSamples[i];
        
        try {
          // Use the actual template configuration from database
          const response = await api.auditText(sample.content, templateConfig || {});
          
          if (response?.data?.code === 200) {
            const aiResult = response.data.data;
            
            // Map AI result to our expected format
            const actualResult = aiResult.status === 'PASS' ? 'PASS' : 
                               aiResult.status === 'REJECT' ? 'BLOCK' : 'REVIEW';
            
            const isCorrect = actualResult === sample.expectedResult;
            
            results.push({
              sampleId: sample.id,
              content: sample.content,
              expectedResult: sample.expectedResult,
              actualResult,
              isCorrect,
              confidence: aiResult.confidence || 0,
              processingTime: Date.now() - testStartTime,
              aiReasoning: aiResult.reason || 'AI analysis completed',
              ruleMatched: aiResult.categories || []
            });
          } else {
            // Handle API error
            results.push({
              sampleId: sample.id,
              content: sample.content,
              expectedResult: sample.expectedResult,
              actualResult: 'REVIEW',
              isCorrect: false,
              confidence: 0,
              processingTime: Date.now() - testStartTime,
              aiReasoning: 'AI service error',
              ruleMatched: []
            });
          }
        } catch (error) {
          console.error(`Error processing sample ${sample.id}:`, error);
          // Handle individual sample error
          results.push({
            sampleId: sample.id,
            content: sample.content,
            expectedResult: sample.expectedResult,
            actualResult: 'REVIEW',
            isCorrect: false,
            confidence: 0,
            processingTime: Date.now() - testStartTime,
            aiReasoning: 'AI service error',
            ruleMatched: []
          });
        }

        // Calculate time estimation
        const currentTime = Date.now();
        const elapsedTime = currentTime - testStartTime;
        const avgTimePerSample = elapsedTime / (i + 1);
        const remainingSamples = testSamples.length - (i + 1);
        const estimatedRemaining = remainingSamples * avgTimePerSample;
        
        // Update progress with time estimation
        setRunStatus(prev => ({
          ...prev,
          progress: ((i + 1) / testSamples.length) * 100,
          currentSample: i + 1
        }));
        
        setEstimatedTimeRemaining(estimatedRemaining);

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Generate real test report
      const realReport = generateRealReport(landingPageGoldenSet, results, Date.now() - testStartTime);
      
      setReport(realReport);
      setLastTestTime(new Date().toISOString());
      
      setRunStatus({
        status: 'completed',
        progress: 100,
        currentSample: testSamples.length,
        totalSamples: testSamples.length
      });
      
      message.success('Golden Set test completed successfully!');
    } catch (error) {
      console.error('Golden Set test failed:', error);
      setRunStatus({
        status: 'failed',
        progress: 0,
        currentSample: 0,
        totalSamples: goldenSet.samples.length,
        error: 'Test failed: ' + (error as Error).message
      });
      message.error('Golden Set test failed. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  // Generate real test report based on AI results
  const generateRealReport = (goldenSet: GoldenSet, results: any[], totalTime: number): GoldenSetReport => {
    const totalSamples = results.length;
    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectCount = totalSamples - correctCount;
    
    // Calculate precision and recall
    const truePositives = results.filter(r => r.expectedResult === 'BLOCK' && r.actualResult === 'BLOCK').length;
    const falsePositives = results.filter(r => r.expectedResult === 'PASS' && r.actualResult === 'BLOCK').length;
    const falseNegatives = results.filter(r => r.expectedResult === 'BLOCK' && r.actualResult === 'PASS').length;
    
    const precision = truePositives + falsePositives > 0 ? (truePositives / (truePositives + falsePositives)) * 100 : 0;
    const recall = truePositives + falseNegatives > 0 ? (truePositives / (truePositives + falseNegatives)) * 100 : 0;
    const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    
    // Calculate average processing time
    const avgProcessingTime = results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / totalSamples;
    
    // Generate recommendations based on actual results
    const recommendations = [];
    
    if (incorrectCount > 0) {
      if (falsePositives > falseNegatives) {
        recommendations.push({
          type: 'rule_optimization' as const,
          title: 'Reduce False Positives',
          description: 'The model is being too strict, blocking content that should pass',
          priority: 'high' as const,
          suggestedActions: [
            'Lower the confidence threshold for BLOCK decisions',
            'Review and refine content moderation rules',
            'Add more PASS examples to training data'
          ]
        });
      } else {
        recommendations.push({
          type: 'rule_optimization' as const,
          title: 'Reduce False Negatives',
          description: 'The model is missing violations, letting inappropriate content pass',
          priority: 'high' as const,
          suggestedActions: [
            'Increase the confidence threshold for PASS decisions',
            'Strengthen content moderation rules',
            'Add more BLOCK examples to training data'
          ]
        });
      }
    }
    
    if (avgProcessingTime > 2000) {
      recommendations.push({
        type: 'general' as const,
        title: 'Performance Optimization',
        description: 'Processing time is higher than expected',
        priority: 'medium' as const,
        suggestedActions: [
          'Check AI service performance',
          'Consider batch processing for large datasets',
          'Optimize API response times'
        ]
      });
    }
    
    return {
      id: `report_${Date.now()}`,
      templateId,
      goldenSetId: goldenSet.id,
      runAt: new Date().toISOString(),
      summary: {
        totalSamples,
        accuracy: (correctCount / totalSamples) * 100,
        precision,
        recall,
        f1Score,
        correctCount,
        incorrectCount,
        falsePositives,
        falseNegatives
      },
      detailedResults: results,
      recommendations,
      performance: {
        totalProcessingTime: totalTime,
        averageProcessingTime: avgProcessingTime,
        throughput: totalSamples / (totalTime / 1000)
      }
    };
  };

  // Table column definitions
  const columns = [
    {
      title: 'Sample Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => (
        <Tooltip title={text}>
          <Text ellipsis={{ tooltip: text }} style={{ maxWidth: 200 }}>
            {text}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Expected Result',
      dataIndex: 'expectedResult',
      key: 'expectedResult',
      render: (result: string) => {
        const color = result === 'PASS' ? 'green' : result === 'BLOCK' ? 'red' : 'orange';
        const icon = result === 'PASS' ? <CheckCircleOutlined /> : 
                    result === 'BLOCK' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {result}
          </Tag>
        );
      }
    },
    {
      title: 'Actual Result',
      dataIndex: 'actualResult',
      key: 'actualResult',
      render: (result: string) => {
        const color = result === 'PASS' ? 'green' : result === 'BLOCK' ? 'red' : 'orange';
        const icon = result === 'PASS' ? <CheckCircleOutlined /> : 
                    result === 'BLOCK' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
        return (
          <Tag color={color} icon={icon}>
            {result}
          </Tag>
        );
      }
    },
    {
      title: 'Correct',
      dataIndex: 'isCorrect',
      key: 'isCorrect',
      render: (isCorrect: boolean) => (
        <Tag color={isCorrect ? 'green' : 'red'}>
          {isCorrect ? '✓ Correct' : '✗ Wrong'}
        </Tag>
      )
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => (
        <span>{confidence ? `${(confidence * 100).toFixed(1)}%` : '-'}</span>
      )
    },
    {
      title: 'Processing Time',
      dataIndex: 'processingTime',
      key: 'processingTime',
      render: (time: number) => (
        <span>{time ? `${time.toFixed(0)}ms` : '-'}</span>
      )
    },
    {
      title: 'AI Reasoning',
      dataIndex: 'aiReasoning',
      key: 'aiReasoning',
      render: (reasoning: string) => (
        <Tooltip title={reasoning}>
          <Text ellipsis={{ tooltip: reasoning }} style={{ maxWidth: 150 }}>
            {reasoning || '-'}
          </Text>
        </Tooltip>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={3} className="text-white mb-2">
            <ExperimentOutlined className="mr-2 text-purple-400" />
            Golden Set Test
          </Title>
          <Text className="text-gray-400">
            Template: {templateName} | Golden Set: {goldenSet.name}
          </Text>
          {lastTestTime && (
            <Text className="text-blue-400 text-sm block mt-1">
              Last test: {new Date(lastTestTime).toLocaleString()}
            </Text>
          )}
        </div>
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button 
            type="primary" 
            icon={<ExperimentOutlined />}
            onClick={runGoldenSet}
            loading={isRunning}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : 'Run Golden Set Test'}
          </Button>
          <Button 
            type="default" 
            icon={<InfoCircleOutlined />}
            onClick={clearTestResults}
            disabled={!lastTestTime}
          >
            Clear Results
          </Button>
        </Space>
      </div>

      {/* Running Status */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text className="text-white font-medium">Running Golden Set Test...</Text>
                <Text className="text-blue-400 font-mono">
                  {runStatus.currentSample} / {runStatus.totalSamples}
                </Text>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Text className="text-gray-300 text-sm">Overall Progress</Text>
                  <Text className="text-blue-400 text-sm font-mono">
                    {runStatus.progress.toFixed(0)}%
                  </Text>
                </div>
                <Progress 
                  percent={runStatus.progress} 
                  strokeColor={{
                    '0%': '#3b82f6',
                    '50%': '#8b5cf6',
                    '100%': '#10b981'
                  }}
                  trailColor="rgba(255,255,255,0.1)"
                  showInfo={false}
                  className="mb-2"
                  strokeWidth={8}
                />
              </div>
              
              {/* Step-by-step Progress */}
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: runStatus.totalSamples }, (_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index < runStatus.currentSample
                        ? 'bg-green-500 shadow-lg shadow-green-500/50'
                        : index === runStatus.currentSample
                        ? 'bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse'
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
              
              {/* Current Sample Info */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Text className="text-gray-300 text-sm font-medium">
                    Current Sample #{runStatus.currentSample}
                  </Text>
                  {runStatus.currentSample > 0 && (
                    <Tag color="processing">
                      Processing...
                    </Tag>
                  )}
                </div>
                {runStatus.currentSample > 0 && goldenSet.samples[runStatus.currentSample - 1] && (
                  <div>
                    <Text className="text-blue-400 text-xs block">
                      Content: {goldenSet.samples[runStatus.currentSample - 1].content.substring(0, 80)}
                      {goldenSet.samples[runStatus.currentSample - 1].content.length > 80 ? '...' : ''}
                    </Text>
                    <Text className="text-purple-400 text-xs block mt-1">
                      Expected: {goldenSet.samples[runStatus.currentSample - 1].expectedResult}
                    </Text>
                  </div>
                )}
              </div>
              
              {/* Test Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-lg p-2">
                  <Text className="text-green-400 text-lg font-bold block">
                    {runStatus.currentSample > 0 ? runStatus.currentSample - 1 : 0}
                  </Text>
                  <Text className="text-gray-400 text-xs">Completed</Text>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <Text className="text-blue-400 text-lg font-bold block">
                    {runStatus.currentSample > 0 ? 1 : 0}
                  </Text>
                  <Text className="text-gray-400 text-xs">Processing</Text>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <Text className="text-orange-400 text-lg font-bold block">
                    {runStatus.totalSamples - runStatus.currentSample}
                  </Text>
                  <Text className="text-gray-400 text-xs">Remaining</Text>
                </div>
              </div>
              
              {/* Test Info */}
              <div className="text-center text-gray-400 text-xs space-y-1">
                <div>Test started at: {startTime ? new Date(startTime).toLocaleTimeString() : new Date().toLocaleTimeString()}</div>
                <div>Cache cleared for fresh results</div>
                {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
                  <div className="text-blue-400">
                    Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 1000)}s
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>AI service processing...</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Error Status */}
      {runStatus.status === 'failed' && runStatus.error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert
            message="Test Failed"
            description={runStatus.error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={runGoldenSet}>
                Retry
              </Button>
            }
          />
        </motion.div>
      )}

      {/* Test Results */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card 
            title={
              <div className="flex items-center justify-between">
                <span className="text-white">Test Results</span>
                <div className="flex items-center space-x-2">
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Fresh Results
                  </Tag>
                  <Text className="text-gray-400 text-xs">
                    Generated at {new Date().toLocaleTimeString()}
                  </Text>
                </div>
              </div>
            }
            className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border-white/20 shadow-xl"
          >
            {/* Overall Statistics */}
            <div className="mb-6">
              <Title level={4} className="text-white mb-4">Performance Summary</Title>
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Total Samples"
                    value={report.summary.totalSamples}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Accuracy"
                    value={report.summary.accuracy.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="Precision"
                    value={report.summary.precision.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic
                    title="F1 Score"
                    value={report.summary.f1Score.toFixed(1)}
                    suffix="%"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Col>
              </Row>
            </div>

            <Divider className="border-white/20" />

            {/* Detailed Results */}
            <div className="mb-6">
              <Title level={4} className="text-white mb-4">Detailed Results</Title>
              <Table
                columns={columns}
                dataSource={report.detailedResults}
                pagination={false}
                size="small"
                className="bg-transparent"
                rowKey="sampleId"
              />
            </div>

            <Divider className="border-white/20" />

            {/* Improvement Recommendations */}
            <div className="mb-6">
              <Title level={4} className="text-white mb-4">Recommendations</Title>
              <div className="space-y-3">
                {report.recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    message={rec.title}
                    description={
                      <div className="space-y-2">
                        <Text className="text-gray-300">{rec.description}</Text>
                        <div>
                          <Text className="text-gray-400 text-sm">Suggested Actions:</Text>
                          <ul className="mt-1 ml-4 text-sm text-gray-300">
                            {rec.suggestedActions.map((action, i) => (
                              <li key={i}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    }
                    type={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'info'}
                    showIcon
                    className="bg-white/5 border-white/10"
                  />
                ))}
              </div>
            </div>

            
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      {!isRunning && !report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <div className="text-center space-y-4">
              <ExperimentOutlined className="text-6xl text-blue-400" />
              <div>
                <Title level={4} className="text-white mb-2">
                  Ready to Run Golden Set Test
                </Title>
                <Text className="text-gray-400">
                  This will test your template against a curated set of samples to evaluate accuracy, 
                  precision, and recall. Click "Run Golden Set Test" to begin.
                </Text>
              </div>
              <div className="text-sm text-gray-500">
                <InfoCircleOutlined className="mr-1" />
                Sample set contains {goldenSet.samples.length} carefully selected test cases
              </div>
            </div>
          </Card>
        </motion.div>
      )}


    </div>
  );
};

export default GoldenSetRunner;
