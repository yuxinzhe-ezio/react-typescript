import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import { Spin } from 'antd';

import routes, { RouteConfig } from './routes';

// Loading component
const PageLoading: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <Spin size='large' />
  </div>
);

// Transform route configs to React Router format
const transformRoutes = (routeConfigs: RouteConfig[]) => {
  return routeConfigs.map(route => ({
    path: route.path,
    index: route.index,
    element: (
      <Suspense fallback={<PageLoading />}>
        <route.element />
      </Suspense>
    ),
  }));
};

// 创建路由器实例
const router = createBrowserRouter(transformRoutes(routes));

const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Router;
