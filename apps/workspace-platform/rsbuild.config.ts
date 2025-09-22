import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],
  html: {
    template: './config/index.html',
  },
  source: {
    define: {
      __VERSION__: JSON.stringify(process.env.VERSION),
    },
  },
});
