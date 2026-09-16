import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  entry: [
    'src/main.tsx',
    'vite.config.ts',
    'eslint.config.mjs',
    'eslint.local.config.mjs',
    '.prettierrc.js',
    'prettier.local.config.js',
  ],
});
