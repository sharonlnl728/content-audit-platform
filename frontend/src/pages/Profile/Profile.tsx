import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Space, Tag, Divider, message, Modal, Form, Input, Switch } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, CloseOutlined, KeyOutlined, MailOutlined, CalendarOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  last_login?: string;
}

interface UserStatistics {
  studiesCreated: number;
  recordsReviewed: number;
  templatesUsed: number;
}

const Profile: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchStatistics();
    }
  }, [isAuthenticated]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.getProfile();
      if (response.data.code === 200) {
        setProfile(response.data.data);
        setEditForm(response.data.data);
      } else {
        message.error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      message.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.getUserStatistics();
      if (response.data.code === 200) {
        setStatistics(response.data.data);
      } else {
        console.error('Failed to fetch statistics:', response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setEditForm(profile || {});
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm(profile || {});
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const response = await api.updateProfile(editForm);
      if (response.data.code === 200) {
        message.success('Profile updated successfully');
        setProfile(response.data.data);
        setEditing(false);
        // Update user info in localStorage
        localStorage.setItem('userInfo', JSON.stringify(response.data.data));
      } else {
        message.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleChangePassword = async (values: any) => {
    try {
      const response = await api.changePassword(values);
      if (response.data.code === 200) {
        message.success('Password changed successfully');
        setChangePasswordModal(false);
        // Clear form
        form.resetFields();
      } else {
        message.error('Failed to change password');
      }
    } catch (error: any) {
      console.error('Failed to change password:', error);
      message.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleTwoFactor = async (values: any) => {
    try {
      const action = twoFactorEnabled ? 'disable' : 'enable';
      const response = await api.manageTwoFactor({ action, code: values.code });
      if (response.data.code === 200) {
        message.success(response.data.data);
        setTwoFactorEnabled(!twoFactorEnabled);
        setTwoFactorModal(false);
        // Clear form
        form.resetFields();
      } else {
        message.error('Failed to manage two-factor authentication');
      }
    } catch (error: any) {
      console.error('Failed to manage two-factor authentication:', error);
      message.error(error.response?.data?.message || 'Failed to manage two-factor authentication');
    }
  };

  const [form] = Form.useForm();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Please login to view your profile</h1>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-700">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Page title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-slate-800 mb-2">User Profile</h1>
        <p className="text-slate-600">Manage your account information and preferences</p>
      </motion.div>

      {/* Main info card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl rounded-2xl">
          <div className="flex items-start space-x-6">
            {/* Avatar area */}
            <div className="text-center">
              <Avatar
                size={120}
                icon={<UserOutlined />}
                className="border-4 border-blue-500/50 shadow-lg"
                style={{ backgroundColor: '#1890ff' }}
              />
              <div className="mt-4">
                <Tag color={profile.role === 'ADMIN' ? 'red' : 'blue'} className="text-sm">
                  {profile.role}
                </Tag>
              </div>
            </div>

            {/* User info area */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-800">{profile.username}</h2>
                <Space>
                  {editing ? (
                    <>
                      <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSave}
                        loading={loading}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 border-0"
                      >
                        Save
                      </Button>
                      <Button
                        icon={<CloseOutlined />}
                        onClick={handleCancel}
                        className="bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      icon={<EditOutlined />}
                      onClick={handleEdit}
                      className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                    >
                      Edit Profile
                    </Button>
                  )}
                </Space>
              </div>

              <Divider className="border-slate-200" />

              {/* User details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                      <UserOutlined className="mr-2" />
                      Username
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter username"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium">{profile.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                      <MailOutlined className="mr-2" />
                      Email
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter email"
                      />
                    ) : (
                      <p className="text-slate-800 font-medium">{profile.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                      <KeyOutlined className="mr-2" />
                      Role
                    </label>
                    <Tag color={profile.role === 'ADMIN' ? 'red' : 'blue'} className="text-sm">
                      {profile.role}
                    </Tag>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                      <CalendarOutlined className="mr-2" />
                      Account Created
                    </label>
                    <p className="text-slate-800 font-medium">
                      {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 text-sm font-medium mb-2">
                      <CalendarOutlined className="mr-2" />
                      Last Updated
                    </label>
                    <p className="text-slate-800 font-medium">
                      {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>

                  {profile.last_login && (
                    <div>
                      <label className="block text-slate-700 text-sm font-medium mb-2">
                        <CalendarOutlined className="mr-2" />
                        Last Login
                      </label>
                      <p className="text-slate-800 font-medium">
                        {new Date(profile.last_login).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

              {/* Account statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl rounded-2xl">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Account Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 mb-2">{statistics?.studiesCreated || 0}</div>
              <div className="text-slate-700 text-sm">Studies Created</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600 mb-2">{statistics?.recordsReviewed || 0}</div>
              <div className="text-slate-700 text-sm">Records Reviewed</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600 mb-2">{statistics?.templatesUsed || 0}</div>
              <div className="text-slate-700 text-sm">Templates Used</div>
            </div>
          </div>
        </Card>
      </motion.div>

              {/* Security settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-white/95 backdrop-blur-xl border-slate-200 shadow-xl rounded-2xl">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-slate-800 font-medium">Change Password</h4>
                <p className="text-slate-600 text-sm">Update your account password</p>
              </div>
              <Button 
                className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                onClick={() => setChangePasswordModal(true)}
                icon={<LockOutlined />}
              >
                Change
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <h4 className="text-slate-800 font-medium">Two-Factor Authentication</h4>
                <p className="text-slate-600 text-sm">Add an extra layer of security</p>
              </div>
              <div className="flex items-center space-x-3">
                <Switch 
                  checked={twoFactorEnabled}
                  onChange={(checked) => {
                    setTwoFactorEnabled(checked);
                    if (checked) {
                      setTwoFactorModal(true);
                    } else {
                      // Direct disable
                      handleTwoFactor({ action: 'disable' });
                    }
                  }}
                  className="bg-white/20"
                />
                <Button 
                  className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  onClick={() => setTwoFactorModal(true)}
                  icon={<SafetyCertificateOutlined />}
                >
                  {twoFactorEnabled ? 'Manage' : 'Enable'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

              {/* Change password modal */}
      <Modal
        title="Change Password"
        open={changePasswordModal}
        onCancel={() => setChangePasswordModal(false)}
        footer={null}
        className="bg-white/10 backdrop-blur-xl"
      >
        <Form
          form={form}
          onFinish={handleChangePassword}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password 
              placeholder="Enter current password"
              className="bg-white/10 border-white/20 text-white"
            />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter new password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password 
              placeholder="Enter new password"
              className="bg-white/10 border-white/20 text-white"
            />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            rules={[
              { required: true, message: 'Please confirm new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password 
              placeholder="Confirm new password"
              className="bg-white/10 border-white/20 text-white"
            />
          </Form.Item>
          
          <Form.Item className="mb-0">
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setChangePasswordModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" className="bg-blue-500">
                Change Password
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

              {/* Two-factor authentication modal */}
      <Modal
        title="Two-Factor Authentication"
        open={twoFactorModal}
        onCancel={() => setTwoFactorModal(false)}
        footer={null}
        className="bg-white/10 backdrop-blur-xl"
      >
        <div className="mt-4">
          <p className="text-slate-600 mb-4">
            {twoFactorEnabled 
              ? 'Manage your two-factor authentication settings'
              : 'Enable two-factor authentication for enhanced security'
            }
          </p>
          
          {!twoFactorEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• A 6-digit secret code will be generated</li>
                <li>• Keep this code safe - you'll need it for future logins</li>
                <li>• You can disable it anytime from your profile</li>
              </ul>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button onClick={() => setTwoFactorModal(false)}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={() => handleTwoFactor({ action: twoFactorEnabled ? 'disable' : 'enable' })}
              className="bg-blue-500"
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;



