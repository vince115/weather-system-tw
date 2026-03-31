const { spawn } = require('child_process');
const path = require('path');
const target = '/Users/vincelo/Dev/weather-system-tw';
console.log('Chdir to:', target);
try {
  process.chdir(target);
  console.log('Current CWD:', process.cwd());
  const proc = spawn('pnpm', ['dev'], { 
    stdio: 'inherit',
    env: { ...process.env, MallocStackLogging: '0' }
  });
  proc.on('error', (err) => {
    console.error('Failed to start pnpm:', err);
  });
} catch (err) {
  console.error('Failed to chdir:', err);
}
