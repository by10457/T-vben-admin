import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // Java 后端管理接口地址
            target: 'http://localhost:7840/api',
            ws: true,
          },
        },
      },
    },
  };
});
