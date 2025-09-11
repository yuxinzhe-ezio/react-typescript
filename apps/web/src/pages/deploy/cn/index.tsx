import React from 'react';

import { Button, Card, Progress, Space, Table, Tag, Typography } from 'antd';
import { DeploymentUnitOutlined, HistoryOutlined, RocketOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const { Title, Paragraph } = Typography;

interface DeploymentRecord {
  id: string;
  project: string;
  version: string;
  status: 'success' | 'failed' | 'pending' | 'deploying';
  region: string;
  deployTime: string;
  duration: string;
}

const CNDeploy: React.FC = () => {
  const deploymentData: DeploymentRecord[] = [
    {
      id: '1',
      project: 'web-frontend',
      version: 'v1.2.3',
      status: 'success',
      region: 'cn-beijing',
      deployTime: '2024-01-15 14:30:00',
      duration: '4m 12s',
    },
    {
      id: '2',
      project: 'api-service',
      version: 'v2.1.0',
      status: 'success',
      region: 'cn-shanghai',
      deployTime: '2024-01-15 14:25:00',
      duration: '3m 58s',
    },
    {
      id: '3',
      project: 'worker-service',
      version: 'v1.0.8',
      status: 'deploying',
      region: 'cn-guangzhou',
      deployTime: '2024-01-15 14:40:00',
      duration: '2m 35s',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'pending':
        return 'default';
      case 'deploying':
        return 'processing';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color='blue'>{version}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Region',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: 'Deploy Time',
      dataIndex: 'deployTime',
      key: 'deployTime',
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button size='small' type='link'>
            View Logs
          </Button>
          <Button size='small' type='link'>
            Rollback
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title level={2}>
          <DeploymentUnitOutlined /> China Region Deployment
        </Title>
        <Paragraph>
          Manage and monitor deployments for China regions including Beijing, Shanghai, and
          Guangzhou.
        </Paragraph>
      </div>

      <div className={styles.actions}>
        <Space size='large'>
          <Button type='primary' icon={<RocketOutlined />} size='large'>
            New Deployment
          </Button>
          <Button icon={<HistoryOutlined />} size='large'>
            Deployment History
          </Button>
        </Space>
      </div>

      <div className={styles.stats}>
        <div className={styles.statsRow}>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>8</div>
              <div className={styles.statLabel}>Active Deployments</div>
            </div>
          </Card>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>96.8%</div>
              <div className={styles.statLabel}>Success Rate</div>
            </div>
          </Card>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>4.1m</div>
              <div className={styles.statLabel}>Avg Deploy Time</div>
            </div>
          </Card>
          <Card className={styles.statCard}>
            <div className={styles.statContent}>
              <div className={styles.statNumber}>89</div>
              <div className={styles.statLabel}>Total Deployments</div>
            </div>
          </Card>
        </div>
      </div>

      <Card title='Recent Deployments' className={styles.tableCard}>
        <Table
          columns={columns}
          dataSource={deploymentData}
          rowKey='id'
          pagination={{ pageSize: 10 }}
          className={styles.table}
        />
      </Card>

      <Card title='Deployment Progress' className={styles.progressCard}>
        <div className={styles.progressSection}>
          <div className={styles.progressItem}>
            <div className={styles.progressLabel}>
              <span>worker-service v1.0.9</span>
              <span>Deploying to cn-guangzhou</span>
            </div>
            <Progress percent={60} status='active' />
          </div>
          <div className={styles.progressItem}>
            <div className={styles.progressLabel}>
              <span>mobile-app v3.0.1</span>
              <span>Deploying to cn-beijing</span>
            </div>
            <Progress percent={25} status='active' />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CNDeploy;
