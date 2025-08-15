import fs from 'node:fs';
import path from 'node:path';
import {
  CODE_FILE_EXTENSIONS,
  IGNORED_DIRECTORIES,
  VUE_IMPORT_STRING_REGEX,
} from './constants/name';

type Mode = 'check' | 'fix' | 'rename';
type Scope = 'dirs' | 'files' | 'both';

function isCodeFile(filePath: string): boolean {
  return CODE_FILE_EXTENSIONS.includes(path.extname(filePath));
}

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function toPascalCase(name: string): string {
  if (/[-_\s]/.test(name)) {
    return name
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
      .join('');
  }
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

function walk(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(ent.name)) continue;
      walk(full, files);
    } else if (ent.isFile()) {
      if (isCodeFile(full)) files.push(full);
    }
  }
  return files;
}

// ---------- check/fix import strings ----------

function isLowercaseVueImport(vueImportPath: string): boolean {
  const base = path.posix.basename(vueImportPath);
  if (base.toLowerCase() === 'index.vue') return false;
  const nameNoExt = base.replace(/\.vue$/i, '');
  return /^[a-z]/.test(nameNoExt);
}

function rewriteVueImportPascal(vueImportPath: string): string | null {
  const ext = path.posix.extname(vueImportPath);
  const base = path.posix.basename(vueImportPath, ext);
  if (base.toLowerCase() === 'index') return null;
  const dir = path.posix.dirname(vueImportPath);
  const nextBase = toPascalCase(base);
  const next = dir === '.' || dir === '/' ? `${nextBase}${ext}` : `${dir}/${nextBase}${ext}`;
  if (next !== vueImportPath) return next;
  return null;
}

function analyzeFileForVue(file: string) {
  const src = fs.readFileSync(file, 'utf8');
  const hits: { index: number; importPath: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = VUE_IMPORT_STRING_REGEX.exec(src))) {
    const importPath = m[2];
    if (isLowercaseVueImport(importPath)) {
      hits.push({ index: m.index, importPath });
    }
  }
  return { src, hits };
}

function runCheck(targetDir: string, ci = false): number {
  const files = walk(targetDir);
  const results: { file: string; line: number; col: number; importPath: string }[] = [];
  for (const f of files) {
    const { src, hits } = analyzeFileForVue(f);
    for (const h of hits) {
      const before = src.slice(0, h.index);
      const line = before.split('\n').length;
      const col = h.index - before.lastIndexOf('\n');
      results.push({ file: f, line, col, importPath: h.importPath });
    }
  }

  if (results.length === 0) {
    process.stdout.write('✅ 未发现 “小写字母开头且非 index.vue” 的 .vue 引用。\n');
    return 0;
  }

  process.stdout.write('⚠️ 发现以下 .vue 引用（小写开头且非 index.vue）：\n\n');
  for (const r of results) {
    const rel = path.relative(targetDir, r.file) || r.file;
    process.stdout.write(`${rel}:${r.line}:${r.col} -> ${r.importPath}\n`);
  }
  if (ci) return 1;
  return 0;
}

function runFix(targetDir: string): number {
  const files = walk(targetDir);
  let total = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    let modified = 0;
    const out = src.replace(VUE_IMPORT_STRING_REGEX, (full, quote: string, p2: string) => {
      const next = rewriteVueImportPascal(p2);
      if (!next) return full;
      modified += 1;
      return `${quote}${next}${quote}`;
    });
    if (modified > 0 && out !== src) {
      fs.writeFileSync(f, out, 'utf8');
    }
    total += modified;
  }
  process.stdout.write(`✅ 重写完成：更新了 ${total} 处 .vue 引用于 ${files.length} 个文件中\n`);
  return 0;
}

// ---------- rename (dirs/files) ----------

function processRename(rootDir: string, step: 1 | 2, scope: Scope): void {
  const items = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const item of items) {
    const oldPath = path.join(rootDir, item.name);
    if (item.isDirectory()) {
      if (scope === 'files') {
        // Only recurse
        if (fs.existsSync(oldPath) && fs.lstatSync(oldPath).isDirectory()) {
          processRename(oldPath, step, scope);
        }
        continue;
      }
      let nextName = item.name;
      let renamed = false;
      if (step === 1) {
        if (/^[A-Z][a-z]*$/.test(nextName)) {
          nextName = '_' + nextName;
          renamed = true;
        }
        const kebab = toKebabCase(nextName);
        if (kebab !== nextName) {
          nextName = kebab;
          renamed = true;
        }
      } else if (step === 2) {
        if (nextName.startsWith('_')) {
          nextName = nextName.slice(1);
          renamed = true;
        }
      }
      const nextPath = path.join(rootDir, nextName);
      if (renamed && oldPath !== nextPath) {
        fs.renameSync(oldPath, nextPath);
        process.stdout.write(`Renamed: ${item.name} → ${nextName}\n`);
      }
      const recurse = renamed ? nextPath : oldPath;
      if (fs.existsSync(recurse) && fs.lstatSync(recurse).isDirectory()) {
        processRename(recurse, step, scope);
      }
      continue;
    }

    if (item.isFile()) {
      if (scope === 'dirs') continue;
      const extension = path.extname(item.name).toLowerCase();
      if (extension !== '.vue') continue; // only .vue files
      const base = path.basename(item.name, extension);
      let nextFileName = base + extension;
      let renamed = false;
      if (step === 1) {
        if (base.toLowerCase() === 'index') {
          // no-op for index.vue
        } else if (/^[a-z]/.test(base)) {
          nextFileName = `_${base}${extension}`;
          renamed = true;
        }
      } else if (step === 2) {
        const raw = base.startsWith('_') ? base.slice(1) : base;
        if (raw.toLowerCase() === 'index') {
          nextFileName = `index${extension}`;
        } else {
          nextFileName = `${toPascalCase(raw)}${extension}`;
        }
        if (nextFileName !== `${base}${extension}`) renamed = true;
      }
      const nextPath = path.join(rootDir, nextFileName);
      if (renamed && oldPath !== nextPath) {
        fs.renameSync(oldPath, nextPath);
        process.stdout.write(`Renamed: ${item.name} → ${nextFileName}\n`);
      }
    }
  }
}

function runRename(targetDir: string, step: 1 | 2, scope: Scope): number {
  processRename(targetDir, step, scope);
  process.stdout.write(`\n✅ 第 ${step} 步处理完成 (scope: ${scope}): ${targetDir}\n`);
  return 0;
}

// ---------- CLI ----------

function main(): void {
  const args = process.argv.slice(2);
  let mode: Mode | undefined;
  let dir: string | undefined;
  let step: 1 | 2 | undefined;
  let scope: Scope = 'dirs';
  let ci = false;

  for (let i = 0; i < args.length; i += 1) {
    const t = args[i];
    if (t === '--mode') {
      mode = args[i + 1] as Mode;
      i += 1;
      continue;
    }
    if (t === '--dir') {
      dir = args[i + 1];
      i += 1;
      continue;
    }
    if (t === '--step') {
      step = Number(args[i + 1]) as 1 | 2;
      i += 1;
      continue;
    }
    if (t === '--scope') {
      const v = (args[i + 1] ?? '').toLowerCase();
      if (v === 'dirs' || v === 'files' || v === 'both') scope = v;
      i += 1;
      continue;
    }
    if (t === '--ci') {
      ci = true;
      continue;
    }
  }

  const targetDir = dir ? path.resolve(dir) : process.cwd();
  if (!fs.existsSync(targetDir) || !fs.lstatSync(targetDir).isDirectory()) {
    process.stderr.write(`❌ 目录不存在：${targetDir}\n`);
    process.exit(1);
  }

  if (!mode) {
    process.stdout.write(
      [
        'Usage:',
        '  name-case --mode check|fix|rename --dir <path> [--step 1|2] [--scope dirs|files|both] [--ci]',
        '',
        'Modes:',
        '  check   Scan for lowercase-starting non-index .vue imports',
        '  fix     Rewrite .vue import strings to PascalCase',
        '  rename  Rename filesystem entries (dirs/files). Files: only .vue, svg ignored; index.vue preserved',
        '',
        'Examples:',
        '  name-case --mode check --dir ./apps/web/src --ci',
        '  name-case --mode fix --dir ./path',
        '  name-case --mode rename --dir ./path --step 1 --scope files',
        '  name-case --mode rename --dir ./path --step 2 --scope files',
      ].join('\n') + '\n'
    );
    process.exit(0);
  }

  switch (mode) {
    case 'check': {
      const code = runCheck(targetDir, ci);
      process.exit(code);
    }
    case 'fix': {
      const code = runFix(targetDir);
      process.exit(code);
    }
    case 'rename': {
      if (!step) {
        process.stderr.write('❌ rename 模式需要 --step 1|2\n');
        process.exit(1);
      }
      const code = runRename(targetDir, step, scope);
      process.exit(code);
    }
    default: {
      process.stderr.write('❌ 未知 mode\n');
      process.exit(1);
    }
  }
}

main();
