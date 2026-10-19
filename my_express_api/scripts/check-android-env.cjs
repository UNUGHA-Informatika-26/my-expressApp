'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function tryRun(label, cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 45000 });
    console.log('--- ' + label + ' ---');
    console.log(out.trim() || '(kosong)');
    return out;
  } catch (error) {
    console.log('--- ' + label + ' ---');
    console.log('GAGAL: ' + String(error.message).split('\n').slice(0, 4).join(' | '));
    return null;
  }
}

console.log('=== CEK LINGKUNGAN BUILD ANDROID ===\n');

console.log('ANDROID_HOME   = ' + (process.env.ANDROID_HOME || '(tidak di-set)'));
console.log('ANDROID_SDK_ROOT = ' + (process.env.ANDROID_SDK_ROOT || '(tidak di-set)'));
console.log('JAVA_HOME      = ' + (process.env.JAVA_HOME || '(tidak di-set)'));
console.log('');

tryRun('adb version', 'adb version');
tryRun('java -version', 'java -version');
tryRun('emulator/SDK terpasang', 'dir /b "%LOCALAPPDATA%\\Android\\Sdk"');

const sdkDir = process.env.ANDROID_HOME || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
console.log('\n--- Pemeriksaan direktori SDK di ' + sdkDir + ' ---');
try {
  const entries = fs.readdirSync(sdkDir);
  console.log('ADA. Isi: ' + entries.join(', '));
  for (const sub of ['platform-tools', 'build-tools', 'platforms']) {
    const p = path.join(sdkDir, sub);
    try {
      console.log('  ' + sub + ': ' + fs.readdirSync(p).join(', '));
    } catch {
      console.log('  ' + sub + ': TIDAK ADA');
    }
  }
} catch {
  console.log('TIDAK ADA direktori SDK Android di lokasi itu.');
}

console.log('\n=== SELESAI ===');
