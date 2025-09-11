import { ComponentType, lazy } from 'react';

// Custom route config type
export interface RouteConfig {
  path: string;
  element: ComponentType;
  index?: boolean;
  children?: RouteConfig[];
}

// Dynamic import page components
const Home = lazy(() => import('../pages/home'));
const Layout = lazy(() => import('../components/layout'));
const GlobalDeploy = lazy(() => import('../pages/deploy/global'));
const CNDeploy = lazy(() => import('../pages/deploy/cn'));

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: Layout,
    children: [
      {
        path: '/',
        element: Home,
        index: true,
      },
      {
        path: '/deploy-platform/global',
        element: GlobalDeploy,
      },
      {
        path: '/deploy-platform/cn',
        element: CNDeploy,
      },
    ],
  },
];

export default routes;
