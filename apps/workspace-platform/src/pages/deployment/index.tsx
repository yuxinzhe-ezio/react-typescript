import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Input,
  Tree,
  Avatar,
  Tag,
  Badge,
  Divider,
  Row,
  Col,
  List,
  Tooltip,
} from 'antd';
import { 
  HomeOutlined,
  SearchOutlined,
  LinkOutlined,
  BulbOutlined,
  LockOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  BranchesOutlined,
  CiOutlined,
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import styles from './style.module.scss';

const { Title, Text } = Typography;

// 树节点数据接口
interface TreeNode {
  key: string;
  title: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
  isLeaf?: boolean;
}

// 版本列表数据接口
interface VersionItem {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  commitMessage: string;
  deployInfo: string;
  completedAt: string;
  pipeline: {
    ci: boolean;
    d: boolean;
    o2: boolean;
    p2: boolean;
  };
  identifiers: {
    pr: string;
    commit: string;
    mr: string;
  };
}

const Deployment: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');
  const [versionList, setVersionList] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredTreeData, setFilteredTreeData] = useState<TreeNode[]>([]);

  // 模拟树形数据 - 按region分组
  const treeData: TreeNode[] = [
    {
      key: 'global',
      title: 'global',
      icon: <Tag color="green">G</Tag>,
      children: [
        { key: 'content-admin', title: 'content-admin', isLeaf: true },
        { key: 'tags-webapp', title: 'tags-webapp', isLeaf: true },
      ],
    },
    {
      key: 'cn',
      title: 'cn',
      icon: <Tag color="green">G</Tag>,
      children: [
        { key: 'ad-account', title: 'ad-account', isLeaf: true },
        { key: 'ad-account-web', title: 'ad-account-web', isLeaf: true },
      ],
    },
  ];

  // 模拟版本列表数据
  const mockVersionList: VersionItem[] = [
    {
      id: '1',
      user: {
        name: 'liupengxue',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liupengxue',
      },
      timestamp: '2025-07-29 16:34:47',
      commitMessage: 'feat: agent visit download',
      deployInfo: 'liupengxue 2个月前 部署了 PEK02 在线环境',
      completedAt: '完成于 2025-07-29 17:12:02',
      pipeline: {
        ci: true,
        d: true,
        o2: true,
        p2: true,
      },
      identifiers: {
        pr: '# 1534522',
        commit: '8d1f5725',
        mr: 'MR 114',
      },
    },
  ];

  // 获取版本列表
  const fetchVersionList = async (appName: string) => {
    setLoading(true);
    try {
      // TODO: 调用真实接口
      await new Promise(resolve => setTimeout(resolve, 500));
      setVersionList(mockVersionList);
    } catch (error) {
      console.error('获取版本列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理树节点选择
  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      const selectedKey = selectedKeys[0] as string;
      setSelectedApp(selectedKey);
      fetchVersionList(selectedKey);
    }
  };

  // 处理树搜索
  const handleTreeSearch = (value: string) => {
    setSearchValue(value);
    
    if (!value.trim()) {
      setFilteredTreeData(treeData);
      return;
    }

    // 前台搜索功能
    const filterTreeData = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.reduce((acc: TreeNode[], node) => {
        const matchesSearch = node.title.toLowerCase().includes(value.toLowerCase());
        
        if (node.children) {
          const filteredChildren = filterTreeData(node.children);
          if (filteredChildren.length > 0 || matchesSearch) {
            acc.push({
              ...node,
              children: filteredChildren
            });
          }
        } else if (matchesSearch) {
          acc.push(node);
        }
        
        return acc;
      }, []);
    };

    const filtered = filterTreeData(treeData);
    setFilteredTreeData(filtered);
  };

  // 初始化时从URL参数获取应用
  useEffect(() => {
    const appId = searchParams.get('appId');
    if (appId) {
      setSelectedApp(appId);
      fetchVersionList(appId);
    }
  }, [searchParams]);

  // 初始化过滤后的树数据
  useEffect(() => {
    setFilteredTreeData(treeData);
  }, []);

  return (
    <div className={styles.deploymentPage}>
      <Row gutter={16} className={styles.pageLayout}>
        {/* 左侧树形结构 */}
        <Col span={6} className={styles.leftPanel}>
          <Card className={styles.treeCard}>
            <div className={styles.searchSection}>
              <Input
                placeholder="搜索节点进行切换"
                prefix={<SearchOutlined />}
                value={searchValue}
                onChange={(e) => handleTreeSearch(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.treeSection}>
              <Tree
                showIcon
                defaultExpandAll
                onSelect={handleTreeSelect}
                selectedKeys={selectedApp ? [selectedApp] : []}
                treeData={filteredTreeData}
                className={styles.tree}
              />
            </div>
          </Card>
        </Col>

        {/* 右侧内容区域 */}
        <Col span={18} className={styles.rightPanel}>
          {selectedApp ? (
            <div className={styles.contentArea}>
              {/* 面包屑导航 */}
              <div className={styles.breadcrumb}>
                <Space>
                  <HomeOutlined />
                  <Text>/ 部署 / 部署 - {selectedApp}</Text>
                  <Button type="link" icon={<LinkOutlined />} className={styles.visitLink}>
                    访问地址
                  </Button>
                </Space>
              </div>

              {/* 候选版本列表 */}
              <Card className={styles.versionCard}>
                <div className={styles.versionHeader}>
                  <Space>
                    <LockOutlined />
                    <Title level={4} className={styles.versionTitle}>候选版本列表</Title>
                  </Space>
                  <Space>
                    <Input
                      placeholder="标题、作..."
                      prefix={<SearchOutlined />}
                      className={styles.versionSearch}
                    />
                    <Button type="primary" icon={<CiOutlined />}>
                      触发构建
                    </Button>
                  </Space>
                </div>

                <div className={styles.versionList}>
                  <List
                    dataSource={versionList}
                    loading={loading}
                    renderItem={(item) => (
                      <List.Item className={styles.versionItem}>
                        <div className={styles.versionContent}>
                          <div className={styles.versionHeader}>
                            <Space>
                              <Avatar src={item.user.avatar} size="small" />
                              <Text strong>{item.user.name}</Text>
                              <Text type="secondary">{item.timestamp}</Text>
                            </Space>
                          </div>
                          
                          <div className={styles.commitMessage}>
                            <Text>{item.commitMessage}</Text>
                          </div>
                          
                          <div className={styles.deployInfo}>
                            <Text type="secondary">{item.deployInfo}</Text>
                          </div>
                          
                          <div className={styles.completedAt}>
                            <Text type="secondary">{item.completedAt}</Text>
                          </div>
                          
                          <div className={styles.pipeline}>
                            <Space>
                              <Badge dot color="red">
                                <Tag color="green" className={styles.pipelineTag}>CI</Tag>
                              </Badge>
                              <Badge dot color="red">
                                <Tag color="green" className={styles.pipelineTag}>D</Tag>
                              </Badge>
                              <Badge dot color="red">
                                <Tag color="green" className={styles.pipelineTag}>O2</Tag>
                              </Badge>
                              <Badge dot color="red">
                                <Tag color="green" className={styles.pipelineTag}>P2</Tag>
                              </Badge>
                            </Space>
                          </div>
                          
                          <div className={styles.identifiers}>
                            <Space>
                              <Text code>{item.identifiers.pr}</Text>
                              <Space>
                                <FireOutlined className={styles.fireIcon} />
                                <Text code className={styles.commitCode}>{item.identifiers.commit}</Text>
                              </Space>
                              <Text code className={styles.mrCode}>{item.identifiers.mr}</Text>
                            </Space>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <Text type="secondary">请从左侧选择一个应用查看部署信息</Text>
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Deployment;
