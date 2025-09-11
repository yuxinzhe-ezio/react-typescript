import React from 'react';

import { Button, Layout, Typography } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

import { LAYOUT_DIMENSIONS } from '../constants';

import styles from './style.module.scss';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ collapsed, onToggle }) => {
  return (
    <AntHeader className={styles.header} style={{ height: LAYOUT_DIMENSIONS.HEADER_HEIGHT }}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Button
            type='text'
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onToggle}
            className={styles.collapseBtn}
          />
          <Title level={4} className={styles.title}>
            Frontend Hub
          </Title>
        </div>
        <div className={styles.rightSection}>
          {/* User info or other header actions can be added here */}
        </div>
      </div>
    </AntHeader>
  );
};

export default Header;
