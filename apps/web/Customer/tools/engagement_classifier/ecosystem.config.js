/**
 * PM2 Configuration for Engagement Classifier Chatbot
 * Usage: pm2 start ecosystem.config.js
 */

module.exports = {
  apps: [{
    name: 'engagement-chatbot',
    script: './chatbot/api-server.js',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    // Health monitoring
    health_check_grace_period: 3000,
    health_check_fatal_exceptions: true
  }]
};