import { ComponentType, lazy } from 'react';
import Layout from '../components/Layout';

// Custom route config type
export interface RouteConfig {
  path: string;
  element: ComponentType;
  index?: boolean;
}

// Dynamic import page components
const Home = lazy(() => import('../pages/home'));
const Application = lazy(() => import('../pages/application'));
const Deployment = lazy(() => import('../pages/deployment'));

// 创建包装了 Layout 的组件
const HomeWithLayout = () => (
  <Layout>
    <Home />
  </Layout>
);

const ApplicationWithLayout = () => (
  <Layout>
    <Application />
  </Layout>
);

const DeploymentWithLayout = () => (
  <Layout>
    <Deployment />
  </Layout>
);

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: HomeWithLayout,
    index: true,
  },
  {
    path: '/application',
    element: ApplicationWithLayout,
  },
  {
    path: '/deployment',
    element: DeploymentWithLayout,
  },
];

export default routes;
