import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import { motion } from 'framer-motion';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';

import UserManagement from './pages/UserManagement/UserManagement';
import Template from './pages/Template/Template';
import TemplateDetail from './pages/Template/TemplateDetail';
import StudyManagement from './pages/StudyManagement/StudyManagement';
import StudyAudit from './pages/StudyAudit/StudyAudit';
import Profile from './pages/Profile/Profile';
import './styles/global.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#8b5cf6', // Elegant purple
          colorBgContainer: '#fafafa', // Very light gray background
          colorBgElevated: '#ffffff', // Pure white card background
          borderRadius: 16,
          colorText: '#1e293b', // Dark text
          colorTextSecondary: '#475569', // Medium gray text
          colorBorder: '#e2e8f0', // Light gray border
          colorBgLayout: '#f8fafc', // Light gray layout background
        },
      }}
    >
      <AntdApp>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
          {/* Modern background decoration */}
          <div 
            className="fixed inset-0 opacity-15"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='a' gradientUnits='userSpaceOnUse' cx='50%25' cy='50%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%23ffffff' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23a)'/%3E%3C/svg%3E")`
            }}
          ></div>
          
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Dashboard />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/users" element={
                <ProtectedRoute adminOnly>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <UserManagement />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/templates" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Template />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/templates/:templateId" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <TemplateDetail />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/studies" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <StudyManagement />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/study/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <StudyAudit />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Profile />
                    </motion.div>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </div>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App; 