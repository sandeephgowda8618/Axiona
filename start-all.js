#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  rootDir: __dirname,
  serverDir: path.join(__dirname, 'server'),
  clientDir: path.join(__dirname, 'client'),
  pipelineDir: path.join(__dirname, 'Pipline'),
  processes: []
};

// Utility functions
function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logService(service, message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] [${service}] ${message}${colors.reset}`);
}

// Function to start a service
function startService(name, command, args, cwd, color = 'blue') {
  return new Promise((resolve, reject) => {
    logService(name, `Starting ${name}...`, 'yellow');
    logService(name, `Command: ${command} ${args.join(' ')}`, 'cyan');
    
    const childProcess = spawn(command, args, {
      cwd,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    // Store process reference for cleanup
    config.processes.push({ name, process: childProcess });

    let isStarted = false;
    let startupTimeout;

    // Handle stdout
    childProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        output.split('\n').forEach(line => {
          logService(name, line, color);
        });

        // Check for startup indicators
        if (!isStarted) {
          const successIndicators = [
            'Server is running on port',
            'Local:   http://localhost:',
            'ready in',
            'compiled successfully',
            'MongoDB Connected'
          ];

          if (successIndicators.some(indicator => output.includes(indicator))) {
            isStarted = true;
            clearTimeout(startupTimeout);
            logService(name, `✅ ${name} started successfully!`, 'green');
            resolve(childProcess);
          }
        }
      }
    });

    // Handle stderr
    childProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('ExperimentalWarning')) {
        output.split('\n').forEach(line => {
          logService(name, line, 'red');
        });
      }
    });

    // Handle process exit
    childProcess.on('close', (code) => {
      if (code !== 0) {
        logService(name, `❌ ${name} exited with code ${code}`, 'red');
        if (!isStarted) {
          reject(new Error(`${name} failed to start`));
        }
      } else {
        logService(name, `${name} stopped`, 'yellow');
      }
    });

    // Handle process errors
    childProcess.on('error', (error) => {
      logService(name, `❌ ${name} error: ${error.message}`, 'red');
      if (!isStarted) {
        reject(error);
      }
    });

    // Timeout for startup
    startupTimeout = setTimeout(() => {
      if (!isStarted) {
        logService(name, `⏰ ${name} startup timeout - assuming it's running`, 'yellow');
        isStarted = true;
        resolve(childProcess);
      }
    }, 30000); // 30 seconds timeout
  });
}

// Function to check if a directory exists
function directoryExists(dir) {
  const fs = require('fs');
  try {
    return fs.statSync(dir).isDirectory();
  } catch (err) {
    return false;
  }
}

// Function to check if package.json exists
function hasPackageJson(dir) {
  const fs = require('fs');
  try {
    return fs.existsSync(path.join(dir, 'package.json'));
  } catch (err) {
    return false;
  }
}

// Cleanup function
function cleanup() {
  log('🧹 Cleaning up processes...', 'yellow');
  
  config.processes.forEach(({ name, process }) => {
    try {
      if (process && !process.killed) {
        logService(name, 'Stopping...', 'yellow');
        
        // Try graceful shutdown first
        if (os.platform() === 'win32') {
          spawn('taskkill', ['/pid', process.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
          process.kill('SIGTERM');
          
          // Force kill after 5 seconds if not stopped
          setTimeout(() => {
            if (!process.killed) {
              process.kill('SIGKILL');
            }
          }, 5000);
        }
      }
    } catch (error) {
      logService(name, `Error stopping: ${error.message}`, 'red');
    }
  });
  
  setTimeout(() => {
    log('✅ Cleanup completed', 'green');
    process.exit(0);
  }, 2000);
}

// Main function to start all services
async function startAll() {
  try {
    log('🚀 Starting Axiona Development Environment', 'bright');
    log('='.repeat(60), 'cyan');
    
    // Verify directories exist
    if (!directoryExists(config.serverDir)) {
      throw new Error(`Server directory not found: ${config.serverDir}`);
    }
    if (!directoryExists(config.clientDir)) {
      throw new Error(`Client directory not found: ${config.clientDir}`);
    }

    // Check for package.json files
    if (!hasPackageJson(config.serverDir)) {
      throw new Error(`No package.json found in server directory: ${config.serverDir}`);
    }
    if (!hasPackageJson(config.clientDir)) {
      throw new Error(`No package.json found in client directory: ${config.clientDir}`);
    }

    log('📁 Directory structure verified', 'green');
    log('', 'reset');

    // Start services sequentially
    const services = [];

    // 1. Start Backend Server
    log('1️⃣ Starting Backend Server...', 'bright');
    const serverProcess = await startService(
      'BACKEND',
      'npm',
      ['run', 'dev'],
      config.serverDir,
      'green'
    );
    services.push(serverProcess);
    
    // Wait a bit for backend to stabilize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Start Frontend Development Server
    log('2️⃣ Starting Frontend Development Server...', 'bright');
    const clientProcess = await startService(
      'FRONTEND',
      'npm',
      ['run', 'dev'],
      config.clientDir,
      'blue'
    );
    services.push(clientProcess);

    // 3. Start Pipeline Services (if directory exists)
    if (directoryExists(config.pipelineDir)) {
      log('3️⃣ Starting Pipeline Services...', 'bright');
      
      // Check if there's a requirements.txt for Python dependencies
      const requirementsPath = path.join(config.pipelineDir, 'requirements.txt');
      const fs = require('fs');
      
      if (fs.existsSync(requirementsPath)) {
        logService('PIPELINE', 'Found requirements.txt - Python pipeline detected', 'cyan');
        
        // Check if there's a main pipeline script
        const possibleScripts = [
          'complete_rag_system.py',
          'main.py',
          'pipeline.py',
          'run.py'
        ];
        
        const pipelineScript = possibleScripts.find(script => 
          fs.existsSync(path.join(config.pipelineDir, script))
        );
        
        if (pipelineScript) {
          // Try to start pipeline but don't fail if it doesn't work
          try {
            const pipelineProcess = await startService(
              'PIPELINE',
              'python3',
              [pipelineScript],
              config.pipelineDir,
              'magenta'
            );
            services.push(pipelineProcess);
          } catch (error) {
            logService('PIPELINE', `Pipeline startup failed: ${error.message}`, 'yellow');
            logService('PIPELINE', 'Continuing without pipeline services', 'yellow');
          }
        } else {
          logService('PIPELINE', 'No main pipeline script found, skipping pipeline startup', 'yellow');
        }
      } else {
        logService('PIPELINE', 'No requirements.txt found, skipping pipeline startup', 'yellow');
      }
    } else {
      log('3️⃣ Pipeline directory not found, skipping pipeline services', 'yellow');
    }

    // Success message
    log('', 'reset');
    log('🎉 Development services started!', 'green');
    log('='.repeat(60), 'cyan');
    log('', 'reset');
    log('📊 Service Status:', 'bright');
    log('  🔧 Backend Server: http://localhost:5050', 'green');
    log('  ⚛️  Frontend App: http://localhost:5173', 'blue');
    
    // Check if pipeline is actually running
    const pipelineRunning = services.some(service => service && !service.killed);
    if (pipelineRunning && directoryExists(config.pipelineDir)) {
      log('  🔄 Pipeline: Running', 'magenta');
    } else {
      log('  🔄 Pipeline: Not running (optional)', 'yellow');
    }
    
    log('', 'reset');
    log('💡 Tips:', 'bright');
    log('  • Press Ctrl+C to stop all services', 'cyan');
    log('  • Backend API: http://localhost:5050/api', 'cyan');
    log('  • Frontend: http://localhost:5173', 'cyan');
    log('  • MongoDB should be running on default port 27017', 'cyan');
    log('', 'reset');
    log('🎯 Ready for development!', 'green');
    log('', 'reset');

  } catch (error) {
    log(`❌ Error starting services: ${error.message}`, 'red');
    cleanup();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('', 'reset');
  log('🛑 Received interrupt signal (Ctrl+C)', 'yellow');
  cleanup();
});

process.on('SIGTERM', () => {
  log('🛑 Received termination signal', 'yellow');
  cleanup();
});

process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'red');
  cleanup();
});

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection at ${promise}: ${reason}`, 'red');
  cleanup();
});

// Display help if needed
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}Axiona Development Environment Starter${colors.reset}

Usage:
  node start-all.js [options]

Options:
  --help, -h     Show this help message

This script will start:
  1. Backend Server (Node.js/Express) on port 5050
  2. Frontend Development Server (Vite/React) on port 5173  
  3. Pipeline Services (if available) 

Prerequisites:
  • Node.js and npm installed
  • MongoDB running (default port 27017)
  • Dependencies installed in both server/ and client/ directories

To stop all services:
  Press Ctrl+C in the terminal where this script is running
`);
  process.exit(0);
}

// Start the development environment
startAll();
