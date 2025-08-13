#!/usr/bin/env node
import { spawn } from 'node:child_process';

// Simple passthrough: ts-script <file.ts> [args]
const [, , file, ...args] = process.argv;
if (!file) {
  console.error('Usage: ts-script <file.ts> [args]');
  process.exit(1);
}

const child = spawn('tsx', [file, ...args], { stdio: 'inherit', shell: process.platform === 'win32' });
child.on('close', code => {
  process.exit(code ?? 0);
});


