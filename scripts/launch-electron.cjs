
const { spawn } = require('child_process');
const path = require('path');

console.log('Launching Electron...');

const env = { ...process.env };
// Crucial: remove the variable that blocks Electron APIs
delete env.ELECTRON_RUN_AS_NODE;

// Ensure start URL is set for dev
if (!env.ELECTRON_START_URL) {
    env.ELECTRON_START_URL = 'http://localhost:5173';
}

const electronPath = process.platform === 'win32'
    ? path.join(__dirname, '../node_modules/.bin/electron.cmd')
    : path.join(__dirname, '../node_modules/.bin/electron');

const child = spawn(electronPath, ['.'], {
    env,
    stdio: 'inherit',
    shell: true
});

child.on('exit', (code) => {
    process.exit(code);
});
