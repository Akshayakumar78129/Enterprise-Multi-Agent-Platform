/**
 * Process Manager for Chatbot Server
 * Automatically starts and manages the chatbot server process
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const chatbotDir = join(__dirname, '..', 'chatbot');

class ChatbotProcessManager {
  constructor() {
    this.process = null;
    this.isRunning = false;
    this.port = 3001;
    this.maxRetries = 3;
    this.retryCount = 0;
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const netstat = spawn('netstat', ['-ano']);
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      netstat.on('close', () => {
        const isInUse = output.includes(`:${port}`);
        resolve(isInUse);
      });
      
      netstat.on('error', () => resolve(false));
    });
  }

  async killExistingProcess() {
    try {
      const { spawn } = require('child_process');
      const netstat = spawn('netstat', ['-ano']);
      let output = '';
      
      netstat.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      return new Promise((resolve) => {
        netstat.on('close', () => {
          const lines = output.split('\n');
          const portLine = lines.find(line => line.includes(`:${this.port}`) && line.includes('LISTENING'));
          
          if (portLine) {
            const parts = portLine.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            
            if (pid && pid !== '0') {
              console.log(`🔄 Killing existing process on port ${this.port} (PID: ${pid})`);
              const kill = spawn('taskkill', ['/PID', pid, '/F']);
              kill.on('close', () => {
                setTimeout(resolve, 1000); // Wait a bit for the port to be freed
              });
            } else {
              resolve();
            }
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.warn('Could not kill existing process:', error.message);
    }
  }

  async start() {
    try {
      console.log('🚀 Starting Chatbot Process Manager...');
      
      // Check if port is in use and kill existing process
      if (await this.isPortInUse(this.port)) {
        await this.killExistingProcess();
      }
      
      // Start the chatbot server
      console.log(`📡 Starting chatbot server on port ${this.port}...`);
      
      this.process = spawn('npm', ['run', 'server'], {
        cwd: chatbotDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Chatbot] ${output.trim()}`);
        
        if (output.includes('Chatbot API server running')) {
          this.isRunning = true;
          this.retryCount = 0;
          console.log('✅ Chatbot server started successfully!');
        }
      });

      this.process.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Chatbot Error] ${error.trim()}`);
        
        if (error.includes('EADDRINUSE')) {
          console.log('🔄 Port in use, retrying...');
          this.restart();
        }
      });

      this.process.on('close', (code) => {
        this.isRunning = false;
        console.log(`[Chatbot] Process exited with code ${code}`);
        
        if (code !== 0 && this.retryCount < this.maxRetries) {
          console.log(`🔄 Restarting chatbot server (attempt ${this.retryCount + 1}/${this.maxRetries})...`);
          this.retryCount++;
          setTimeout(() => this.start(), 2000);
        }
      });

      this.process.on('error', (error) => {
        console.error('❌ Failed to start chatbot process:', error);
        this.isRunning = false;
      });

    } catch (error) {
      console.error('❌ Error in process manager:', error);
    }
  }

  async restart() {
    console.log('🔄 Restarting chatbot server...');
    await this.stop();
    setTimeout(() => this.start(), 1000);
  }

  async stop() {
    if (this.process) {
      console.log('🛑 Stopping chatbot server...');
      this.process.kill('SIGTERM');
      this.process = null;
      this.isRunning = false;
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

// Create and export singleton instance
const processManager = new ChatbotProcessManager();

// Auto-start if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processManager.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down chatbot process manager...');
    await processManager.stop();
    process.exit(0);
  });
}

export default processManager;