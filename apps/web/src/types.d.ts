// SVG 文件类型声明
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

  const src: string;
  export default src;
}

// 图片文件类型声明
declare module '*.png' {
  const src: string;
  export default src;
}

// CSS Modules 类型声明
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// 全局类型
declare global {
  interface Window {
    Garfish?: unknown;
  }
}
