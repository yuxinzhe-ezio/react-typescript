import { ComponentType, lazy } from 'react';

// 自定义路由配置类型
export interface RouteConfig {
  path: string;
  element: ComponentType;
  index?: boolean;
}

// Dynamic import page components
const Home = lazy(() => import('../pages/home'));

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: Home,
    index: true,
  },
];

export default routes;
