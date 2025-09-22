import React, { useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Radio,
  Space,
  Avatar,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  UserOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import styles from './style.module.scss';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface CreateApplicationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateApplicationDrawer: React.FC<CreateApplicationDrawerProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [repositoryType, setRepositoryType] = useState('new');
  const [gitlabGroup, setGitlabGroup] = useState('');
  const [repoType, setRepoType] = useState('');

  // 区域选择数据源
  const regionOptions = [
    { value: 'global', label: 'Global' },
    { value: 'cn', label: 'China' },
  ];

  // GitLab 组数据源
  const gitlabGroupOptions = [
    { value: 'group1', label: 'Frontend Team' },
    { value: 'group2', label: 'Backend Team' },
    { value: 'group3', label: 'DevOps Team' },
    { value: 'group4', label: 'QA Team' },
  ];

  // 模拟仓库搜索
  const searchRepositories = (value: string) => {
    // TODO: 实现远程搜索接口调用
    console.log('搜索仓库:', value);
    return Promise.resolve([
      { value: 'repo1', label: 'user/repo1' },
      { value: 'repo2', label: 'user/repo2' },
      { value: 'repo3', label: 'user/repo3' },
    ]);
  };

  // 模拟用户搜索
  const searchUsers = (value: string) => {
    // TODO: 实现远程搜索接口调用
    console.log('搜索用户:', value);
    return Promise.resolve([
      { value: 'user1', label: '张三 (zhangsan)', avatar: 'Z' },
      { value: 'user2', label: '李四 (lisi)', avatar: 'L' },
      { value: 'user3', label: '王五 (wangwu)', avatar: 'W' },
    ]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // TODO: 调用申请创建应用接口
      try {
        // 模拟接口调用
        await new Promise(resolve => setTimeout(resolve, 2000));
        setLoading(false);
        message.success('应用创建成功！');
        onSuccess();
        handleReset();
      } catch (error) {
        setLoading(false);
        message.error('创建应用失败，请重试');
        console.error('创建应用失败:', error);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setLoading(false);
    setRepositoryType('new');
    setGitlabGroup('');
    setRepoType('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderForm = () => {
    return (
      <Form form={form} layout="vertical" autoComplete="off" className={styles.form}>
        <Form.Item
          label="App 名称"
          name="appName"
          rules={[
            { required: true, message: '请输入App名称' },
            { min: 2, message: 'App名称至少2个字符' },
          ]}
          className={styles.formItem}
        >
          <Input
            placeholder="APP 名称必须全局唯一,且创建后不可修改"
            size="large"
          />
        </Form.Item>

        <Form.Item label="应用类型" name="appType" className={styles.formItem}>
          <Input
            value="前后端应用"
            disabled
            size="large"
            className={styles.disabledField}
            suffix={
              <Text type="secondary" className={styles.hintText}>
                只支持前后端应用创建,移动端 App 去 mpaas 创建
              </Text>
            }
          />
        </Form.Item>

        <Form.Item
          label="应用描述"
          name="description"
          rules={[{ required: true, message: '请输入应用描述' }]}
          className={styles.formItem}
        >
          <TextArea
            rows={4}
            placeholder="请输入应用描述,对该服务的用途等信息进行说明"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label="区域"
          name="region"
          rules={[{ required: true, message: '请选择区域' }]}
          className={styles.formItem}
        >
          <Select placeholder="请选择区域" size="large">
            {regionOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="APP 负责人"
          name="appOwner"
          rules={[{ required: true, message: '请选择APP负责人' }]}
          className={styles.formItem}
        >
          <Select
            placeholder="请输入人员名称进行搜索"
            size="large"
            showSearch
            filterOption={false}
            onSearch={searchUsers}
            notFoundContent={null}
            suffixIcon={<SearchOutlined />}
            className={styles.userSelect}
          >
            {/* 选项将通过远程搜索动态加载 */}
          </Select>
        </Form.Item>

        <Form.Item
          label="QA 负责人"
          name="qaOwner"
          className={styles.formItem}
        >
          <Select
            placeholder="请输入人员名称进行搜索"
            size="large"
            showSearch
            filterOption={false}
            onSearch={searchUsers}
            notFoundContent={null}
            suffixIcon={<SearchOutlined />}
            className={styles.userSelect}
          >
            {/* 选项将通过远程搜索动态加载 */}
          </Select>
        </Form.Item>

        <Form.Item
          label="应用语言"
          name="language"
          rules={[{ required: true, message: '请选择应用语言' }]}
          className={styles.formItem}
        >
          <Select placeholder="请选择" size="large">
            <Option value="javascript">JavaScript</Option>
            <Option value="typescript">TypeScript</Option>
            <Option value="java">Java</Option>
            <Option value="python">Python</Option>
            <Option value="go">Go</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="代码仓库"
          name="repositoryType"
          rules={[{ required: true, message: '请选择代码仓库类型' }]}
          className={styles.formItem}
        >
          <Radio.Group 
            value={repositoryType} 
            onChange={(e) => setRepositoryType(e.target.value)}
            className={styles.radioGroupHorizontal}
          >
            <Radio value="new">新建代码仓库</Radio>
            <Radio value="existing">关联已有代码仓库</Radio>
          </Radio.Group>
        </Form.Item>

        {repositoryType === 'new' && (
          <>
            <Form.Item
              label="GitLab 组"
              name="gitlabGroup"
              rules={[{ required: true, message: '请选择GitLab组' }]}
              className={styles.formItem}
            >
              <Select
                placeholder="请选择"
                size="large"
                value={gitlabGroup}
                onChange={setGitlabGroup}
              >
                {gitlabGroupOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="仓库类型"
              name="repoType"
              rules={[{ required: true, message: '请选择仓库类型' }]}
              className={styles.formItem}
            >
              <Radio.Group 
                value={repoType} 
                onChange={(e) => setRepoType(e.target.value)}
                className={styles.radioGroupHorizontal}
              >
                <Radio value="public">公有仓库</Radio>
                <Radio value="private">私密仓库</Radio>
              </Radio.Group>
            </Form.Item>
          </>
        )}

        {repositoryType === 'existing' && (
          <Form.Item
            label="仓库"
            name="repository"
            rules={[{ required: true, message: '请选择仓库' }]}
            className={styles.formItem}
          >
            <Select
              placeholder="请选择"
              size="large"
              showSearch
              filterOption={false}
              onSearch={searchRepositories}
              notFoundContent={null}
              suffixIcon={<SearchOutlined />}
            >
              {/* 选项将通过远程搜索动态加载 */}
            </Select>
          </Form.Item>
        )}
      </Form>
    );
  };

  return (
    <Drawer
      title={
        <Space className={styles.drawerTitle}>
          <AppstoreOutlined />
          新建应用
        </Space>
      }
      open={visible}
      onClose={handleClose}
      width={600}
      className={styles.drawer}
      footer={
        <div className={styles.footer}>
          <Button onClick={handleClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
          >
            申请创建应用
          </Button>
        </div>
      }
    >
      {renderForm()}
    </Drawer>
  );
};

export default CreateApplicationDrawer;
