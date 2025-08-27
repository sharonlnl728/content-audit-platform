import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider, App } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const onFinish = async (values: RegisterForm) => {
    if (values.password !== values.confirmPassword) {
      message.error('The two passwords you entered do not match!');
      return;
    }

    setLoading(true);
    try {
      const response = await api.register({
        username: values.username,
        password: values.password,
        email: values.email
      });
      
      if (response.data.code === 200) {
        message.success('Registration successful! Please login');
        navigate('/login');
      } else {
        message.error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Registration failed, please check your network connection');
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
              Create New Account
            </Title>
            <Text className="text-slate-600">
              Join AI Content Moderation Platform
            </Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please enter username!' },
                { min: 3, message: 'Username must be at least 3 characters!' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-slate-500" />}
                placeholder="Username"
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please enter email!' },
                { type: 'email', message: 'Please enter a valid email address!' }
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-slate-500" />}
                placeholder="Email Address"
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please enter password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-500" />}
                placeholder="Password"
                className="bg-white border-slate-300 text-slate-800 placeholder-slate-500 hover:border-blue-400 focus:border-blue-500"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: 'Please confirm password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-slate-500" />}
                placeholder="Confirm Password"
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
                Register
              </Button>
            </Form.Item>
          </Form>

          <Divider className="border-slate-300">
            <Text className="text-slate-500">or</Text>
          </Divider>

          <div className="text-center">
            <Text className="text-slate-600">
              Already have an account?{' '}
              <Button 
                type="link" 
                className="text-blue-600 hover:text-blue-500 p-0"
                onClick={() => navigate('/login')}
              >
                Login Now
              </Button>
            </Text>
          </div>

          <div className="mt-4 text-center">
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />}
              className="text-slate-500 hover:text-slate-400"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Register; 