import React from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Card, Space, Typography } from 'antd';
import { DeploymentUnitOutlined, RocketOutlined } from '@ant-design/icons';

import { ROUTES } from '../../router/constants';

import styles from './style.module.scss';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  // xxx

  const navigateToDeployPlatform = () => {
    navigate(ROUTES.REGION_GLOBAL);
  };

  return (
    <div className={styles.container}>
      <Title level={1}>
        <DeploymentUnitOutlined /> Welcome to Frontend Hub
      </Title>
      <Paragraph>
        Centralized frontend management platform for deployment, monitoring, and system operations.
      </Paragraph>

      <Space direction='vertical' size='large' className={styles.content}>
        <Card title='Quick Actions' className={styles.card}>
          <Space size='large'>
            <Button
              type='primary'
              icon={<RocketOutlined />}
              size='large'
              onClick={navigateToDeployPlatform}
            >
              Go to Global Deploy
            </Button>
            <Button size='large' onClick={() => navigate(ROUTES.REGION_CN)}>
              Go to CN Deploy
            </Button>
          </Space>
        </Card>

        <Card title='Platform Features' className={styles.card}>
          <ul>
            <li>Multi-system management dashboard</li>
            <li>Real-time monitoring and alerts</li>
            <li>Centralized configuration management</li>
            <li>System health and performance metrics</li>
            <li>User access control and permissions</li>
            <li>Automated workflow orchestration</li>
          </ul>
        </Card>

        <Card title='Recent Activity' className={styles.card}>
          <Paragraph>
            • 5 systems currently online and healthy
            <br />
            • 3 successful operations completed today
            <br />
            • 1 maintenance task in progress
            <br />• Overall system uptime: 99.2%
          </Paragraph>
        </Card>
      </Space>
    </div>
  );
};

export default Home;
