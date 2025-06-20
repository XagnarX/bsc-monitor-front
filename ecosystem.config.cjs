module.exports = {
  apps: [
    {
      name: 'bsc-monitor-front',
      script: 'npm',
      args: 'run start:pm2',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}; 