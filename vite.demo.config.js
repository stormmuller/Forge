import { defineConfig } from 'vite';
import path from 'path';
import baseConfig from './vite.config';

export default defineConfig({
  ...baseConfig,
  root: path.resolve(__dirname, 'demo'),
});
