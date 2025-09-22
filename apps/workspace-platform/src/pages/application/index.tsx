import React, { useState, useEffect } from 'react';
import { Input, Card, Avatar, Space, Typography, Tag, Tooltip, Row, Col } from 'antd';
import { 
  SearchOutlined,
  GithubOutlined,
  RocketOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.scss';

const { Title, Text } = Typography;

interface ApplicationCard {
  id: string;
  name: string;
  description: string;
  department: string;
  appOwner: string;
  qaOwner: string;
  repository: string;
}

const Application: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  // 模拟数据
  const mockApplications: ApplicationCard[] = [
    {
      id: '1',
      name: 'change-analysis-fe',
      description: '异动分析项目,嵌入到资产平台项目',
      department: '商业研发部-商业平台研发部',
      appOwner: '孔盈盈',
      qaOwner: '张咪',
      repository: 'efe/change-analysis-fe',
    },
    {
      id: '2',
      name: 'toppa',
      description: '知乎效果广告投放系统前端',
      department: '商业研发部-商业平台研发部',
      appOwner: '孙威',
      qaOwner: '张萌哲',
      repository: 'efe/toppa',
    },
  ];

  // 模拟接口调用
  const fetchApplications = async (search?: string) => {
    setLoading(true);
    try {
      // TODO: 调用真实接口
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredApps = mockApplications;
      if (search) {
        filteredApps = mockApplications.filter(app => 
          app.name.toLowerCase().includes(search.toLowerCase()) ||
          app.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setApplications(filteredApps);
    } catch (error) {
      console.error('获取应用列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    fetchApplications(value);
  };


  const handleRepositoryClick = (repository: string) => {
    // TODO: 跳转到代码仓库链接
    console.log('跳转到代码仓库:', repository);
    window.open(`https://github.com/${repository}`, '_blank');
  };

  const handleDeploymentClick = (appId: string) => {
    // 跳转到部署页面
    navigate(`/deployment?appId=${appId}`);
  };

  return (
    <div className={styles.applicationPage}>
      {/* 搜索栏 */}
      <div className={styles.searchSection}>
        <Input
          placeholder="搜索应用"
          prefix={<SearchOutlined />}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className={styles.searchInput}
          size="large"
        />
      </div>

      {/* 应用卡片网格 */}
      <div className={styles.appGrid}>
        <Row gutter={[16, 16]}>
          {applications.map((app) => (
            <Col xs={24} sm={12} lg={8} key={app.id}>
              <Card 
                className={styles.appCard}
                loading={loading}
                hoverable
              >
                <div className={styles.cardHeader}>
                  <div className={styles.appInfo}>
                    <Title level={4} className={styles.appName}>{app.name}</Title>
                    <Text className={styles.appDescription}>{app.description}</Text>
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.department}>
                    <Space>
                      <UserOutlined className={styles.userIcon} />
                      <Text className={styles.departmentText}>{app.department}·{app.appOwner}</Text>
                    </Space>
                  </div>
                  
                  <div className={styles.qa}>
                    <Text className={styles.qaText}>QA: {app.qaOwner}</Text>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.footerLeft}>
                    <Tooltip title="代码仓库">
                      <div 
                        className={styles.footerIcon}
                        onClick={() => handleRepositoryClick(app.repository)}
                      >
                        <GithubOutlined />
                      </div>
                    </Tooltip>
                  </div>
                  
                  <div className={styles.footerDivider}></div>
                  
                  <div className={styles.footerRight}>
                    <Tooltip title="部署">
                      <div 
                        className={styles.footerIcon}
                        onClick={() => handleDeploymentClick(app.id)}
                      >
                        <RocketOutlined />
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Application;
