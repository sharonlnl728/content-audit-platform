import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Button } from 'antd';
import { 
  SafetyCertificateOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  ExperimentOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

// Real-time metrics cards
const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; suffix?: string }> = ({ 
  title, value, icon, color, suffix 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Card className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl">
      <Statistic
        title={<span className="text-slate-700 font-medium">{title}</span>}
        value={value}
        valueStyle={{ color: color, fontSize: '24px', fontWeight: 'bold' }}
        prefix={icon}
        suffix={suffix}
      />
    </Card>
  </motion.div>
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [studyLoading, setStudyLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalAudits: 0,
    passRate: 0,
    rejected: 0,
    pendingReview: 0,
  });

  // Study overview states
  const [studyStats, setStudyStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    draft: 0
  });

  // Quality analysis status
  const [qualityStats, setQualityStats] = useState({
    passCount: 0,
    rejectCount: 0,
    reviewCount: 0,
    passRate: 0,
    rejectRate: 0,
    reviewRate: 0
  });

  // Work efficiency status
  const [productivityStats, setProductivityStats] = useState<{
    thisWeek: number;
    thisMonth: number;
  }>({
    thisWeek: 0,
    thisMonth: 0
  });

  // Template usage status - temporarily removed in MVP phase
  // const [templateStats, setTemplateStats] = useState({
  //   mostUsedTemplate: '',
  //   templatePerformance: [],
  //   recentChanges: []
  // });

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get quality analysis data
  const fetchQualityAnalysis = async (studies: any[]) => {
    let passCount = 0;
    let rejectCount = 0;
    let reviewCount = 0;

    for (const study of studies) {
      if (study.total_records > 0) {
        try {
          const recordsResponse = await api.getStudyRecords(study.id, { page: 0, size: 1000 });
          if (recordsResponse.data.code === 200) {
            const records = recordsResponse.data.data || [];
            records.forEach((record: any) => {
              switch (record.status) {
                case 'PASS': 
                  passCount++; 
                  break;
                case 'REJECT': 
                  rejectCount++; 
                  break;
                case 'REVIEW': 
                  reviewCount++; 
                  break;
              }
            });
          }
        } catch (error) {
          console.error(`Failed to fetch quality records for study ${study.id}:`, error);
        }
      }
    }

    const totalProcessed = passCount + rejectCount + reviewCount;

    return {
      passCount,
      rejectCount,
      reviewCount,
      passRate: totalProcessed > 0 ? (passCount / totalProcessed * 100) : 0,
      rejectRate: totalProcessed > 0 ? (rejectCount / totalProcessed * 100) : 0,
      reviewRate: totalProcessed > 0 ? (reviewCount / totalProcessed * 100) : 0
    };
  };

  // Get work efficiency data
  const fetchProductivityStats = async (studies: any[]) => {
    const now = new Date();
    
    // Fix week start time calculation: get this Monday (or Sunday, depending on your needs)
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // If today is Sunday, go back 6 days to Monday
    weekStart.setHours(0, 0, 0, 0);
    
    // Fix month start time calculation: get the first day of this month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    let thisWeekCount = 0;
    let thisMonthCount = 0;



    for (const study of studies) {
      if (study.total_records > 0) {
        try {
          const recordsResponse = await api.getStudyRecords(study.id, { page: 0, size: 1000 });
          if (recordsResponse.data.code === 200) {
            const records = recordsResponse.data.data || [];
            records.forEach((record: any) => {
              if (record.status !== 'PENDING') {
                if (record.updated_at) {
                  const recordDate = new Date(record.updated_at);
                  
                  if (recordDate >= weekStart) {
                    thisWeekCount++;
                  }
                  if (recordDate >= monthStart) {
                    thisMonthCount++;
                  }
                }
              }
            });
          } else {
            // Failed to get records for study
          }
        } catch (error) {
          console.error(`Failed to fetch records for study ${study.id}:`, error);
        }
      } else {
        // Study has no records, skipping
      }
    }
    


    return {
      thisWeek: thisWeekCount,
      thisMonth: thisMonthCount
    };
  };

  // Get template usage - temporarily removed in MVP phase
  // const fetchTemplateStats = async (studies: any[]) => {
  //   // MVP phase temporarily removed template statistics, focusing on core functionality
  //   return {
  //     mostUsedTemplate: '',
  //     templatePerformance: [],
  //     recentChanges: []
  //   };
  // };

  const fetchDashboardData = async () => {
    try {
      setStudyLoading(true);
      try {
        const studiesResponse = await api.getStudies();
        if (studiesResponse.data.code === 200) {
          const studies = studiesResponse.data.data || [];
          
          const totalStudies = studies.length;
          const totalRecords = studies.reduce((sum: number, study: any) => sum + (study.total_records || 0), 0);
          const processedRecords = studies.reduce((sum: number, study: any) => sum + (study.reviewed_records || 0), 0);
          const pendingRecords = studies.reduce((sum: number, study: any) => sum + (study.pending_records || 0), 0);
          
          const passRate = processedRecords > 0 ? ((processedRecords - pendingRecords) / processedRecords * 100).toFixed(1) : '0';
          
          setStatistics({
            totalAudits: totalRecords,
            passRate: parseFloat(passRate),
            rejected: 0,
            pendingReview: pendingRecords,
          });
          
          const draft = studies.filter((study: any) => study.total_records === 0).length;
          const active = studies.filter((study: any) => 
            study.reviewed_records > 0 && study.reviewed_records < study.total_records
          ).length;
          const completed = studies.filter((study: any) => 
            study.reviewed_records === study.total_records && study.total_records > 0
          ).length;
          
          setStudyStats({
            total: totalStudies,
            active,
            completed,
            draft
          });

          // Get quality analysis, work efficiency, and template usage
          try {
            const qualityData = await fetchQualityAnalysis(studies);
            setQualityStats(qualityData);
          } catch (error) {
            console.error('Failed to fetch quality analysis:', error);
          }

          try {
            const productivityData = await fetchProductivityStats(studies);
            setProductivityStats(productivityData);
          } catch (error) {
            console.error('Failed to fetch productivity stats:', error);
          }

          // Get template usage - temporarily removed in MVP phase
          // try {
          //   const templateData = await fetchTemplateStats(studies);
          //   setTemplateStats(templateData);
          // } catch (error) {
          //   console.error('Failed to fetch template stats:', error);
          // }
        }
      } catch (studyError) {
        console.error('Failed to fetch study statistics:', studyError);
        setStatistics({ totalAudits: 0, passRate: 0, rejected: 0, pendingReview: 0 });
        setStudyStats({ total: 0, active: 0, completed: 0, draft: 0 });
      } finally {
        setStudyLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStatistics({ totalAudits: 0, passRate: 0, rejected: 0, pendingReview: 0 });
      setStudyStats({ total: 0, active: 0, completed: 0, draft: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
            <p className="text-slate-600">Content audit overview and key metrics</p>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Stat Cards - keep 4 columns, but adjust height */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Total Records"
                value={statistics.totalAudits}
                icon={<SafetyCertificateOutlined />}
                color="#3b82f6"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Success Rate"
                value={qualityStats.passRate ? parseFloat(qualityStats.passRate.toFixed(1)) : 0}
                icon={<CheckCircleOutlined />}
                color="#52c41a"
                suffix="%"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                title="Pending Records"
                value={statistics.pendingReview}
                icon={<ClockCircleOutlined />}
                color="#faad14"
              />
            </Col>
            <Col xs={12} lg={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <StatCard
                  title="Weekly Progress"
                  value={productivityStats.thisWeek}
                  color="#1890ff"
                  icon={<BarChartOutlined />}
                />
              </motion.div>
            </Col>
          </Row>

          {/* Second row: Study Overview + Quality Analysis - side by side display, save space */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card 
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-slate-800 font-semibold">Study Overview</span>
                      <div className="flex items-center space-x-2">
                        <Button 
                          type="default" 
                          size="small" 
                          icon={<ExperimentOutlined />}
                          onClick={fetchDashboardData}
                          loading={studyLoading}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                        >
                          Refresh
                        </Button>

                      </div>
                    </div>
                  }
                  className="bg-white/95 backdrop-blur-xl border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-full"
                >
                  <div className="space-y-4">
                    {/* Simplified statistics grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        {studyLoading ? (
                          <div className="text-2xl font-bold text-blue-700 animate-pulse">...</div>
                        ) : (
                          <div className="text-2xl font-bold text-blue-700">{studyStats.total}</div>
                        )}
                        <div className="text-slate-700 text-sm font-medium">Total Studies</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        {studyLoading ? (
                          <div className="text-2xl font-bold text-green-700 animate-pulse">...</div>
                        ) : (
                          <div className="text-2xl font-bold text-green-700">{studyStats.active}</div>
                        )}
                        <div className="text-slate-700 text-sm font-medium">Active</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        {studyLoading ? (
                          <div className="text-2xl font-bold text-orange-700 animate-pulse">...</div>
                        ) : (
                          <div className="text-2xl font-bold text-orange-700">{studyStats.completed}</div>
                        )}
                        <div className="text-slate-700 text-sm font-medium">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                        {studyLoading ? (
                          <div className="text-2xl font-bold text-purple-700 animate-pulse">...</div>
                        ) : (
                          <div className="text-2xl font-bold text-purple-700">{studyStats.draft}</div>
                        )}
                        <div className="text-slate-700 text-sm font-medium">Pending</div>
                      </div>
                    </div>
                    
                    {/* Simplified operation area - remove duplicate buttons, only keep statistics */}
                    <div className="text-center pt-2">
                      <div className="text-xs text-slate-500">
                        Click "Create New Study" in Quick Actions to get started
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
            
            {/* Quick Actions - replace quality analysis, avoid duplication */}
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card 
                  title={<span className="text-slate-800 font-semibold">Quick Actions</span>}
                  className="bg-white/95 backdrop-blur-xl border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-full"
                >
                  <div className="space-y-4">
                    <div className="text-center text-slate-600">
                      <div className="text-4xl mb-3">🚀</div>
                      <div className="text-sm font-medium mb-4">Quick access to common tasks</div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        type="primary" 
                        block
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/studies')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        Create New Study
                      </Button>
                      
                      <Button 
                        type="default" 
                        block
                        icon={<ExperimentOutlined />}
                        onClick={() => navigate('/templates')}
                        className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                      >
                        Manage Templates
                      </Button>
                      
                      <Button 
                        type="default" 
                        block
                        icon={<BarChartOutlined />}
                        onClick={() => navigate('/studies')}
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                      >
                        View All Studies
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Third row: Work Efficiency + Business Insights - merge into one card */}
          <Col xs={24}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card 
                title={<span className="text-slate-800 font-semibold">Work Performance & Insights</span>}
                className="bg-white/95 backdrop-blur-xl border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl h-full"
              >
                <div className="space-y-6">
                  {/* Work efficiency statistics */}
                  <div className="space-y-3">
                    <div className="text-sm text-slate-700 font-medium">Performance Metrics</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg border border-blue-200">
                        <div className="text-2xl font-bold text-blue-700">{productivityStats.thisWeek}</div>
                        <div className="text-slate-600 text-sm">This Week</div>
                      </div>
                      <div className="text-center p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg border border-orange-200">
                        <div className="text-2xl font-bold text-orange-700">{productivityStats.thisMonth}</div>
                        <div className="text-slate-600 text-sm">This Month</div>
                      </div>
                    </div>
                  </div>

                  {/* Quality status */}
                  <div className="space-y-3">
                    <div className="text-sm text-slate-700 font-medium">Quality Status</div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Pass Rate:</span>
                          <span className="text-green-600 font-medium">{qualityStats.passRate?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Reject Rate:</span>
                          <span className="text-red-600 font-medium">{qualityStats.rejectRate?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">Review Rate:</span>
                          <span className="text-orange-600 font-medium">{qualityStats.reviewRate?.toFixed(1) || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business insights */}
                  <div className="space-y-3">
                    <div className="text-sm text-slate-700 font-medium">Key Insights</div>
                    <div className="space-y-2">
                      <div className={`flex items-center ${(qualityStats.passRate || 0) >= 80 ? 'text-green-600' : (qualityStats.passRate || 0) >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        <span className="mr-2">{(qualityStats.passRate || 0) >= 80 ? '✓' : (qualityStats.passRate || 0) >= 60 ? '⚠' : '✗'}</span>
                        <span className="text-sm">
                          {(qualityStats.passRate || 0) >= 80 ? 'Quality performance is excellent' : 
                           (qualityStats.passRate || 0) >= 60 ? 'Quality performance is good' : 
                           'Quality performance needs improvement'}
                        </span>
                      </div>
                      <div className={`flex items-center ${(productivityStats.thisWeek || 0) > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                        <span className="mr-2">{(productivityStats.thisWeek || 0) > 0 ? 'ℹ' : '○'}</span>
                        <span className="text-sm">
                          {(productivityStats.thisWeek || 0) > 0 ? 'Active processing this week' : 'No processing activity this week'}
                        </span>
                      </div>
                      <div className={`flex items-center ${studyStats.active > 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                        <span className="mr-2">{studyStats.active > 0 ? 'ℹ' : '○'}</span>
                        <span className="text-sm">
                          {studyStats.active > 0 ? `${studyStats.active} studies in progress` : 'No active studies'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Fourth row: remove Trend Analysis, avoid data duplication */}
          {/* The original Trend Analysis card has been removed, as the data is duplicated with Work Performance & Insights */}
        </>
      )}
    </div>
  );
};

export default Dashboard;
