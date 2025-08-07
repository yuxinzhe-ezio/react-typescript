import React from 'react';

import { Button, Card, Space, Typography } from 'antd';

import styles from './style.module.scss';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <Title level={1}>Welcome to React + Ant Design</Title>
      <Paragraph>This is a React 18 application with Ant Design 5.x integration.</Paragraph>

      <Space direction="vertical" size="large" className={styles.content}>
        <Card title="Getting Started" className={styles.card}>
          <Paragraph>You can now use all Ant Design components in your application.</Paragraph>
          <Space>
            <Button type="primary">Primary Button</Button>
            <Button>Default Button</Button>
            <Button type="dashed">Dashed Button</Button>
          </Space>
        </Card>

        <Card title="Features" className={styles.card}>
          <ul>
            <li>React 18.3.1</li>
            <li>Ant Design 5.x</li>
            <li>TypeScript Support</li>
            <li>ESLint + Prettier</li>
            <li>Rsbuild</li>
            <li>React Router 6.x</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
};

export default Home;
