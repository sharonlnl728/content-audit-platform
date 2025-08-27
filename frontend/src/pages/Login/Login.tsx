import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const { Title, Text } = Typography;

interface LoginForm {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { login } = useAuth();

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      const response = await api.login(values);
      if (response.data.code === 200) {
        await login(response.data.data);
        message.success('Login successful!');
        navigate('/dashboard');
      } else {
        message.error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
              message.error(error.response?.data?.message || 'Login failed, please check your network connection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Background decoration */}
      <div 
        className="fixed inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card 
          className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-2xl"
          bodyStyle={{ padding: '2rem' }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <SafetyCertificateOutlined className="text-white text-2xl" />
            </motion.div>
            <Title level={2} className="text-slate-800 mb-2">
              AI Content Guardian
            </Title>
            <Text className="text-slate-600">
              Please sign in to your account
            </Text>
          </div>

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please enter username!' }]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-500" />}
                placeholder="Username"
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-500" />}
                placeholder="Password"
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider className="border-slate-300">
            <Text className="text-slate-500">or</Text>
          </Divider>

          <div className="text-center">
            <Text className="text-slate-600">
              Don't have an account?{' '}
              <Button 
                type="link" 
                className="text-blue-600 hover:text-blue-500 p-0"
                onClick={() => navigate('/register')}
              >
                Sign up now
              </Button>
            </Text>
          </div>

          <div className="mt-6 text-center">
            <Text className="text-slate-500 text-sm">
              Test Account: admin / admin1234
            </Text>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login; 