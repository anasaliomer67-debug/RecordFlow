const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const logPath = path.join(root, 'dev.log');
const pidPath = path.join(root, 'server-pid.txt');
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');

function startServer() {
  const logFd = fs.openSync(logPath, 'a');
  const child = spawn(process.execPath, [nextBin, 'dev', '-p', '3000'], {
    cwd: root,
    stdio: ['ignore', logFd, logFd],
    detached: true,
    windowsHide: true,
  });
  
  const ts = () => new Date().toISOString();
  fs.writeFileSync(pidPath, String(child.pid));
  console.log(`${ts()}: Started server PID ${child.pid}`);
  
  child.on('exit', (code, signal) => {
    console.log(`${ts()}: Server exited (code=${code}, signal=${signal}). Restarting in 3s...`);
    setTimeout(startServer, 3000);
  });
  
  child.unref();
}

startServer();

// Keep this process alive
setInterval(() => {
  const pid = fs.readFileSync(pidPath, 'utf8').trim();
  try {
    process.kill(Number(pid), 0);
  } catch {
    console.log(`${new Date().toISOString()}: Server process dead. Restarting...`);
    startServer();
  }
}, 10000);
