// tsup.config.ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['server/**/*'], // 明确入口文件
  format: 'cjs',           // Node.js 使用 CommonJS
  outDir: 'dist-server',
  splitting: false,        // 单文件输出（避免分散）
  // noExternal: ['express'], // 强制打包 express
  // sourcemap: true,         // 方便调试
  clean: true,
});