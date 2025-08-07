import { ComponentType, lazy } from 'react';

// 自定义路由配置类型
export interface RouteConfig {
  path: string;
  element: ComponentType;
  index?: boolean;
}

// 动态导入页面组件
const Home = lazy(() => import('../pages/home'));

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: Home,
    index: true,
  },
  // 可以在这里添加更多路由
  // {
  //   path: '/about',
  //   element: lazy(() => import('../pages/about')),
  // },
];

export default routes;
