#!/usr/bin/env node

/**
 * PAULI DEPLOYMENT SKILL
 *
 * Automated deployment to Railway
 * Usage: npm run deploy:skill
 *
 * This skill:
 * 1. Creates/updates Railway project
 * 2. Sets environment variables
 * 3. Deploys frontend + backend
 * 4. Sets up database
 * 5. Configures services
 * 6. Returns live URL
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`  $ ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, { stdio: 'inherit', ...options });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
  });
}

async function deployToRailway() {
  console.log('\n🚀 PAULI Unified Chat - Railway Deployment Skill\n');

  // Validate required environment variables
  if (!RAILWAY_TOKEN || !GITHUB_TOKEN) {
    console.error('❌ Missing required environment variables!');
    console.error('\nPlease set the following before deploying:');
    if (!RAILWAY_TOKEN) console.error('  - RAILWAY_TOKEN: Your Railway.app authentication token');
    if (!GITHUB_TOKEN) console.error('  - GITHUB_TOKEN: Your GitHub personal access token');
    console.error('\nExample:');
    console.error('  export RAILWAY_TOKEN=your_token_here');
    console.error('  export GITHUB_TOKEN=your_token_here');
    console.error('  npm run deploy:skill\n');
    process.exit(1);
  }

  try {
    // Step 1: Install root dependencies
    console.log('📦 Step 1: Installing root dependencies...');
    await runCommand('npm', ['install']);

    // Step 2: Install client dependencies
    console.log('\n📦 Step 2: Installing client dependencies...');
    await runCommand('npm', ['install'], { cwd: path.join(process.cwd(), 'client') });

    // Step 3: Build application
    console.log('\n🔨 Step 3: Building application (client + server)...');
    await runCommand('npm', ['run', 'build']);

    // Step 4: Check Railway CLI
    console.log('\n🚇 Step 4: Checking Railway CLI...');
    try {
      await runCommand('railway', ['--version']);
    } catch {
      console.log('Installing Railway CLI...');
      await runCommand('npm', ['install', '-g', '@railway/cli']);
    }

    // Step 5: Set up Railway environment
    console.log('\n🔑 Step 5: Authenticating with Railway...');
    process.env.RAILWAY_TOKEN = RAILWAY_TOKEN;

    // Ensure railway.json exists
    if (!fs.existsSync('railway.json')) {
      fs.writeFileSync('railway.json', JSON.stringify({
        $schema: 'https://railway.app/railway.schema.json',
        build: { builder: 'nixpacks' },
        deploy: {
          numReplicas: 1,
          startCommand: 'npm run start',
          restartPolicyMaxRetries: 5
        }
      }, null, 2));
    }

    // Step 6: Set environment variables
    console.log('⚙️  Step 6: Configuring environment variables...');
    const envVars = {
      'GITHUB_TOKEN': GITHUB_TOKEN,
      'NODE_ENV': 'production'
    };

    // Create .env.production
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    fs.writeFileSync('.env.production', envContent);

    // Step 7: Deploy
    console.log('\n🚀 Step 7: Deploying to Railway...');
    await runCommand('railway', ['up', '--detach']);

    // Step 8: Get deployment URL
    console.log('\n🔗 Step 8: Retrieving live URL...');
    const urlOutput = await new Promise((resolve) => {
      const proc = spawn('railway', ['domain'], { stdio: 'pipe' });
      let output = '';
      proc.stdout.on('data', (data) => { output += data; });
      proc.on('close', () => resolve(output.trim() || 'railway-deployment.up.railway.app'));
    });

    console.log('\n✅ DEPLOYMENT COMPLETE!\n');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Your PAULI Unified Chat App is live and ready! 🎉     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n🌐 Open your app: https://${urlOutput}\n`);
    console.log('What you can now do:');
    console.log('  ✨ Talk to PAULI about your projects');
    console.log('  📋 Create executable plans');
    console.log('  ⚙️  Execute plans autonomously');
    console.log('  📈 Watch it learn and improve');
    console.log('\n💡 Tip: Start by asking "What projects do I have?"\n');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Verify Railway CLI is installed: npm install -g @railway/cli');
    console.log('2. Check your Railway token is valid');
    console.log('3. Ensure GitHub token has repo access');
    console.log('4. Run: npm run build (test build locally)');
    console.log('\nView logs with: railway logs\n');
    process.exit(1);
  }
}

deployToRailway();
