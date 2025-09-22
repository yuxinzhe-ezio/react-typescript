import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Button, Space, Breadcrumb, Typography, Dropdown } from 'antd';
import {
  HomeOutlined,
  AppstoreOutlined,
  RocketOutlined,
  SearchOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  CloudOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DownOutlined,
  ApiOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import CreateApplicationDrawer from '../CreateApplicationDrawer';
import styles from './style.module.scss';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [createAppDrawerVisible, setCreateAppDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 菜单项配置
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '主页',
    },
    {
      key: '/application',
      icon: <AppstoreOutlined />,
      label: '应用',
    },
    {
      key: '/deployment',
      icon: <RocketOutlined />,
      label: '部署',
    },
    {
      key: 'joint-debug',
      icon: <UserOutlined />,
      label: '联调',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  // 新建应用下拉菜单
  const createAppMenuItems = [
    {
      key: 'create-app',
      label: '新建应用',
      icon: <AppstoreOutlined />,
      onClick: () => setCreateAppDrawerVisible(true),
    },
    {
      key: 'create-service',
      label: '新建服务',
      icon: <ApiOutlined />,
      disabled: true,
    },
    {
      key: 'create-debug',
      label: '新建联调',
      icon: <LinkOutlined />,
    },
  ];

  const handleCreateAppSuccess = () => {
    setCreateAppDrawerVisible(false);
    // 可以在这里添加成功后的逻辑，比如刷新应用列表
  };

  return (
    <AntLayout className={styles.layout}>
      {/* 左侧菜单 */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className={styles.sider}
        width={240}
      >
        <div className={styles.siderHeader}>
          <Space>
            <CloudOutlined style={{ fontSize: '20px', color: '#1890ff' }} />
            <Text strong>导航</Text>
          </Space>
        </div>

        <Menu
          mode='inline'
          selectedKeys={[location.pathname]}
          className={styles.menu}
          items={menuItems}
          onClick={handleMenuClick}
        />
        
        {/* 菜单折叠按钮 */}
        <div className={styles.menuToggleContainer}>
          <Button
            type='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.menuToggle}
            block
          />
        </div>
      </Sider>

      <AntLayout>
        {/* 顶部导航栏 */}
        <Header className={styles.header}>
          <div className={styles.headerRight}>
            <Space size='middle'>
              <Dropdown
                menu={{ items: createAppMenuItems }}
                placement="bottomLeft"
              >
                <Button type='primary' icon={<PlusOutlined />} size='small'>
                  新建
                </Button>
              </Dropdown>
              <Button icon={<UserOutlined />} size='small'>
                权限
              </Button>
            </Space>
          </div>
        </Header>
        {/* 主内容区域 */}
        <Content className={styles.content}>
          {children}
        </Content>
      </AntLayout>

      {/* 新建应用抽屉 */}
      <CreateApplicationDrawer
        visible={createAppDrawerVisible}
        onClose={() => setCreateAppDrawerVisible(false)}
        onSuccess={handleCreateAppSuccess}
      />
    </AntLayout>
  );
};

export default Layout;
