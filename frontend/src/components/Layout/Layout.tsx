import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd';
import { 
  DashboardOutlined, 
  SafetyCertificateOutlined, 
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, logout, isAdmin } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/studies',
      icon: <ProjectOutlined />,
      label: 'Study Management',
    },

    {
      key: '/templates',
      icon: <SettingOutlined />,
      label: 'Templates',
    },
    // Only administrators can see user management
    ...(isAdmin() ? [{
      key: '/users',
      icon: <UserOutlined />,
      label: 'User Management',
    }] : []),
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'settings') {
      // TODO: Implement settings page
    } else {
      navigate(key);
    }
  };

  return (
    <AntLayout className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="bg-white/95 backdrop-blur-xl border-r border-purple-200 shadow-xl"
        width={220}
        collapsedWidth={80}
        theme="light"
      >
        {/* Sidebar header - only contains collapse button */}
        <div className="h-16 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-purple-30 flex items-center justify-end px-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed(!collapsed)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 p-2 rounded-lg transition-all duration-200 border border-purple-300 hover:border-purple-400"
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </motion.button>
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="bg-transparent border-none mt-2"
          style={{ backgroundColor: 'transparent' }}
        />
      </Sider>

      <AntLayout>
        <Header className="bg-white/95 backdrop-blur-xl border-b border-purple-200 px-8 flex items-center justify-between shadow-xl">
          <div className="flex items-center">
            {/* Brand identity - always visible */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-indigo-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                <SafetyCertificateOutlined className="text-white text-lg" />
              </div>
              <span className="text-slate-800 font-bold text-xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                AI Content Guardian
              </span>
            </motion.div>
          </div>

          <div className="flex items-center space-x-6">

            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleMenuClick
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <motion.div
                className="flex items-center space-x-3 cursor-pointer hover:bg-purple-50 p-3 rounded-xl transition-all duration-200"
                whileHover={{ scale: 1.02 }}
              >
                <Avatar
                  icon={<UserOutlined />}
                  size="default"
                  className="border-2 border-purple-500/50 bg-gradient-to-r from-purple-500 to-indigo-600"
                />
                <div className="flex flex-col items-start">
                  <span className="text-slate-800 font-medium text-sm">
                    {userInfo?.username || 'User'}
                  </span>
                  {isAdmin() && (
                    <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                      Admin
                    </span>
                  )}
                </div>
              </motion.div>
            </Dropdown>
          </div>
        </Header>
        <Content className="p-6 overflow-auto bg-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {children}
          </motion.div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 