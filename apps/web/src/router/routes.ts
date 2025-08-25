import { ComponentType, lazy } from 'react';

// Custom route config type
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
