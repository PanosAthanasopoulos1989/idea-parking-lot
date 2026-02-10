
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Electron components...');

try {
  execSync('npx tsc -p tsconfig.electron.json', { stdio: 'inherit' });

  const distDir = path.join(__dirname, '../dist-electron');
  ['main', 'preload'].forEach(file => {
    const oldPath = path.join(distDir, `${file}.js`);
    const newPath = path.join(distDir, `${file}.cjs`);
    if (fs.existsSync(oldPath)) {
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      fs.renameSync(oldPath, newPath);
    }
  });

  console.log('Build successful.');
} catch (e) {
  console.error('Build failed:', e.message);
  process.exit(1);
}
