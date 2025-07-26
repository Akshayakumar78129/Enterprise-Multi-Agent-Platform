/**
 * PM2 Ecosystem Configuration
 * Phase 6: Configuration & Deployment
 * 
 * This configuration manages API Gateway processes across different environments
 */

module.exports = {
  apps: [
    {
      // Main API Gateway Application
      name: 'api-gateway',
      script: 'server.js',
      cwd: '/Users/tanav/Projects/adk-frontend/api-gateway',
      
      // Process Management
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: process.env.PM2_EXEC_MODE || 'cluster',
      
      // Memory & CPU Management
      max_memory_restart: process.env.PM2_MAX_MEMORY_RESTART || '1G',
      node_args: ['--max-old-space-size=1024'],
      
      // Auto-restart Configuration
      autorestart: true,
      watch: false, // Disable in production, enable for development
      max_restarts: 10,
      min_uptime: '10s',
      
      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        LOG_LEVEL: 'info',
        DEBUG_ENABLED: 'false'
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        LOG_LEVEL: 'warn',
        DEBUG_ENABLED: 'false',
        COMPRESSION_ENABLED: 'true',
        CACHE_TTL: '7200',
        REDIS_TTL: '7200'
      },
      
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        LOG_LEVEL: 'info',
        DEBUG_ENABLED: 'true',
        MOCK_DATA_ENABLED: 'true'
      },
      
      // Logging Configuration
      log_file: './logs/pm2-combined.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced PM2 Features
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Health Monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Performance Monitoring
      pmx: true,
      
      // Graceful Shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Advanced Options for Production
      increment_var: 'PORT',
      combine_logs: true,
      
      // Custom Actions (can be triggered via PM2)
      actions: {
        'clear-cache': {
          method: function(reply) {
            // This would be implemented in the application
            console.log('Cache clearing action triggered');
            reply({ success: true, message: 'Cache cleared' });
          }
        },
        'health-check': {
          method: function(reply) {
            // This would be implemented in the application  
            console.log('Health check action triggered');
            reply({ success: true, status: 'healthy' });
          }
        }
      }
    },
    
    {
      // Worker Process for Background Tasks (Optional)
      name: 'api-gateway-worker',
      script: 'worker.js', // This would be created if needed
      cwd: '/Users/tanav/Projects/adk-frontend/api-gateway',
      
      // Single instance for background tasks
      instances: 1,
      exec_mode: 'fork',
      
      // Memory Management
      max_memory_restart: '512M',
      
      // Auto-restart Configuration
      autorestart: true,
      watch: false,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Environment Variables
      env: {
        WORKER_TYPE: 'cache-cleaner',
        NODE_ENV: 'development',
        LOG_LEVEL: 'info'
      },
      
      env_production: {
        WORKER_TYPE: 'cache-cleaner',
        NODE_ENV: 'production',
        LOG_LEVEL: 'warn'
      },
      
      // Logging Configuration
      log_file: './logs/worker-combined.log',
      out_file: './logs/worker-out.log',
      error_file: './logs/worker-error.log',
      
      // Cron-like Restart (restart every hour to prevent memory leaks)
      cron_restart: '0 * * * *',
      
      // Disable if worker is not needed
      disabled: true
    }
  ],
  
  // Deployment Configuration
  deploy: {
    production: {
      user: 'deploy',
      host: ['production-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/adk-frontend.git',
      path: '/var/www/api-gateway',
      
      // Pre-deployment commands
      'pre-deploy': 'git fetch --all',
      
      // Post-deployment commands
      'post-deploy': [
        'cd api-gateway',
        'npm install --production',
        'npm run build', // If build step is needed
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save'
      ].join(' && '),
      
      // Deployment settings
      'pre-setup': 'sudo apt-get install git nodejs npm -y',
      ssh_options: 'StrictHostKeyChecking=no',
      
      // Environment variables for deployment
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    
    staging: {
      user: 'deploy',
      host: ['staging-server.com'],
      ref: 'origin/develop',
      repo: 'git@github.com:your-org/adk-frontend.git',
      path: '/var/www/api-gateway-staging',
      
      'pre-deploy': 'git fetch --all',
      'post-deploy': [
        'cd api-gateway',
        'npm install',
        'pm2 reload ecosystem.config.js --env staging',
        'pm2 save'
      ].join(' && '),
      
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    }
  }
};

/**
 * PM2 Usage Commands:
 * 
 * Development:
 * pm2 start ecosystem.config.js
 * pm2 start ecosystem.config.js --env development
 * 
 * Production:
 * pm2 start ecosystem.config.js --env production
 * 
 * Staging:
 * pm2 start ecosystem.config.js --env staging
 * 
 * Management:
 * pm2 status
 * pm2 logs api-gateway
 * pm2 restart api-gateway
 * pm2 reload api-gateway  (zero-downtime restart)
 * pm2 stop api-gateway
 * pm2 delete api-gateway
 * 
 * Monitoring:
 * pm2 monit
 * pm2 show api-gateway
 * 
 * Actions:
 * pm2 trigger api-gateway clear-cache
 * pm2 trigger api-gateway health-check
 * 
 * Deployment:
 * pm2 deploy ecosystem.config.js production setup
 * pm2 deploy ecosystem.config.js production
 * pm2 deploy ecosystem.config.js production revert 1
 * 
 * Save/Restore:
 * pm2 save
 * pm2 resurrect
 * pm2 startup  (auto-start on system boot)
 */