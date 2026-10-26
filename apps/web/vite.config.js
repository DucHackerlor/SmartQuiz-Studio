import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tất cả request /api đi qua Vite => browser cùng origin, không bị CORS.
// Backend Express vẫn chạy độc lập ở 127.0.0.1:3000.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        // Khi Express bị tắt, trả lỗi JSON để UI hiện thông báo hữu ích.
        configure(proxy) {
          proxy.on('error', (err, req, res) => {
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ error: 'Backend Express chưa hoạt động trên cổng 3000. Kiểm tra terminal API.' }));
            }
          });
        }
      }
    }
  },
  build: { sourcemap: false }
});
