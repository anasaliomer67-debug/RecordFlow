const { spawn } = require('child_process');
const fs = require('fs');

function startServer() {
  const logFd = fs.openSync('/home/z/my-project/dev.log', 'a');
  const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', logFd, logFd],
    detached: true
  });
  
  const ts = () => new Date().toISOString();
  fs.writeFileSync('/home/z/my-project/server-pid.txt', String(child.pid));
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
  const pid = fs.readFileSync('/home/z/my-project/server-pid.txt', 'utf8').trim();
  try {
    process.kill(Number(pid), 0);
  } catch {
    console.log(`${new Date().toISOString()}: Server process dead. Restarting...`);
    startServer();
  }
}, 10000);
