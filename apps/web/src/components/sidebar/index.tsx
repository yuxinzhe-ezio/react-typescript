import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Layout, Menu } from 'antd';
import { DeploymentUnitOutlined } from '@ant-design/icons';

import menuData from '../../data/menu.json';
import { MENU_KEYS, ROUTES } from '../../router/constants';
import { LAYOUT_DIMENSIONS } from '../constants';

import styles from './style.module.scss';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPathByKey = (key: string): string | undefined => {
    switch (key) {
      case MENU_KEYS.REGION_GLOBAL:
        return ROUTES.REGION_GLOBAL;
      case MENU_KEYS.REGION_CN:
        return ROUTES.REGION_CN;
      default:
        return undefined;
    }
  };

  const handleMenuClick = (key: string) => {
    const path = getPathByKey(key);
    if (path) {
      navigate(path);
    }
  };

  const getSelectedKeys = () => {
    const currentPath = location.pathname;
    if (currentPath.includes('/global')) {
      return [MENU_KEYS.REGION_GLOBAL];
    }
    if (currentPath.includes('/cn')) {
      return [MENU_KEYS.REGION_CN];
    }
    return [];
  };

  const getOpenKeys = () => {
    const currentPath = location.pathname;
    if (currentPath.includes('/deploy-platform')) {
      return [MENU_KEYS.DEPLOY_PLATFORM];
    }
    return [];
  };

  const menuItems = menuData.menuItems.map(item => ({
    key: item.key,
    icon: <DeploymentUnitOutlined />,
    label: item.label,
    children: item.children?.map(child => ({
      key: child.key,
      label: child.label,
      onClick: () => handleMenuClick(child.key),
    })),
  }));

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}
      collapsedWidth={LAYOUT_DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH}
      className={styles.sidebar}
    >
      <Menu
        theme='light'
        mode='inline'
        selectedKeys={getSelectedKeys()}
        defaultOpenKeys={getOpenKeys()}
        items={menuItems}
        className={styles.menu}
      />
    </Sider>
  );
};

export default Sidebar;
