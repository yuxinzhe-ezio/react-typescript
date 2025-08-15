#!/usr/bin/env node
import { spawn } from 'node:child_process';

// Simple passthrough: ts-script <file.ts> [args]
const [, , file, ...args] = process.argv;
if (!file) {
  process.stderr.write('Usage: ts-script <file.ts> [args]\n');
  process.exit(1);
}

const child = spawn('tsx', [file, ...args], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.on('close', code => {
  process.exit(code ?? 0);
});
