import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Layout as AntLayout } from 'antd';

import { LAYOUT_DIMENSIONS } from '../constants';
import Header from '../header';
import Sidebar from '../sidebar';

import styles from './style.module.scss';

const { Content } = AntLayout;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <AntLayout className={styles.layout}>
      <Header collapsed={collapsed} onToggle={toggleCollapsed} />
      <AntLayout className={styles.mainLayout}>
        <Sidebar collapsed={collapsed} />
        <Content
          className={styles.content}
          style={{
            marginTop: LAYOUT_DIMENSIONS.HEADER_HEIGHT,
            marginLeft: collapsed
              ? LAYOUT_DIMENSIONS.SIDEBAR_COLLAPSED_WIDTH
              : LAYOUT_DIMENSIONS.SIDEBAR_WIDTH,
          }}
        >
          <div className={styles.contentInner}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
