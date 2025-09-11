import React, { Suspense } from 'react';
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router-dom';

import { Spin } from 'antd';

import routes, { RouteConfig } from './routes';

// Loading component
const PageLoading: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <Spin size='large' />
  </div>
);

// Transform route configs to React Router format
const transformRoutes = (routeConfigs: RouteConfig[]): RouteObject[] => {
  return routeConfigs.map(route => {
    const Component = route.element;
    return {
      path: route.path,
      index: route.index,
      element: (
        <Suspense fallback={<PageLoading />}>
          <Component />
        </Suspense>
      ),
      children: route.children ? transformRoutes(route.children) : undefined,
    };
  });
};

// Create router instance
const router = createBrowserRouter(transformRoutes(routes));

const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Router;
