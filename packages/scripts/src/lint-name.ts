// rename-files-step1.ts
import { readdirSync, renameSync, existsSync, lstatSync } from 'node:fs';
import { join, resolve, extname, basename } from 'node:path';

/**
 * Convert a string to kebab-case in lowercase.
 */
function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2') // 驼峰转中划线
    .replace(/\s+/g, '-') // 空格转中划线
    .toLowerCase();
}

/**
 * Convert a string to PascalCase.
 */
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

/**
 * Traverse a directory and rename items according to the given step.
 * @param rootDir Root directory path
 * @param step    Step: 1 = add leading underscore for single-capitalized words then kebab-case; 2 = remove leading underscore
 */
type TraverseOptions = {
  renameDirs: boolean;
  renameFiles: boolean;
};

function processTree(rootDir: string, step: 1 | 2, options: TraverseOptions): void {
  const items = readdirSync(rootDir, { withFileTypes: true });

  for (const item of items) {
    const oldPath = join(rootDir, item.name);

    if (item.isDirectory()) {
      let nextDirName = item.name;
      let dirRenamed = false;

      if (options.renameDirs) {
        if (step === 1) {
          if (/^[A-Z][a-z]*$/.test(nextDirName)) {
            nextDirName = '_' + nextDirName;
            dirRenamed = true;
          }
          const kebab = toKebabCase(nextDirName);
          if (kebab !== nextDirName) {
            nextDirName = kebab;
            dirRenamed = true;
          }
        } else if (step === 2) {
          if (nextDirName.startsWith('_')) {
            nextDirName = nextDirName.slice(1);
            dirRenamed = true;
          }
        }
      }

      const nextDirPath = join(rootDir, nextDirName);
      if (dirRenamed && oldPath !== nextDirPath) {
        renameSync(oldPath, nextDirPath);
        process.stdout.write(`Renamed: ${item.name} → ${nextDirName}\n`);
      }

      const recursePath = dirRenamed ? nextDirPath : oldPath;
      if (existsSync(recursePath) && lstatSync(recursePath).isDirectory()) {
        processTree(recursePath, step, options);
      }
      continue;
    }

    if (item.isFile() && options.renameFiles) {
      const extension = extname(item.name).toLowerCase();
      // Only process .vue files
      if (extension !== '.vue') {
        continue;
      }
      const base = basename(item.name, extension);
      let nextFileName = base + extension;
      let fileRenamed = false;

      // Vue files have special rules: they should start with an uppercase letter
      if (step === 1) {
        // Skip index.vue entirely (no rename)
        if (base.toLowerCase() === 'index') {
          // no-op
        } else if (/^[a-z]/.test(base)) {
          // If starts with lowercase, add leading underscore only
          nextFileName = `_${base}${extension}`;
          fileRenamed = true;
        }
      } else if (step === 2) {
        // Remove underscore then convert to PascalCase (no hyphens). index.vue stays lowercase
        const raw = base.startsWith('_') ? base.slice(1) : base;
        if (raw.length > 0) {
          if (raw.toLowerCase() === 'index') {
            nextFileName = `index${extension}`;
          } else {
            nextFileName = `${toPascalCase(raw)}${extension}`;
          }
          if (nextFileName !== `${base}${extension}`) {
            fileRenamed = true;
          }
        }
      }

      const nextFilePath = join(rootDir, nextFileName);
      if (fileRenamed && oldPath !== nextFilePath) {
        renameSync(oldPath, nextFilePath);
        process.stdout.write(`Renamed: ${item.name} → ${nextFileName}\n`);
      }
    }
  }
}

// === CLI 使用 ===
// 用法示例：
//   tsx src/lint-name.ts --dir ./target --step 1
//   tsx src/lint-name.ts ./target 2

type ParsedArgs = {
  directory: string;
  step: 1 | 2;
  scope: 'dirs' | 'files' | 'both';
};

function printHelpAndExit(code: number): never {
  process.stdout.write(
    [
      'Usage:',
      '  lint-name --dir <path> --step <1|2> [--scope dirs|files|both]',
      '  lint-name <path> <1|2> [dirs|files|both]',
      '',
      'Options:',
      '  -d, --dir   Target directory path',
      '  -s, --step  Step number (1=add underscore and kebab-case, 2=remove underscore)',
      '  --scope     Scope to rename: dirs (default) | files | both',
      '  -h, --help  Show this help',
      '',
    ].join('\n')
  );
  process.exit(code);
}

function parseArgs(argv: string[]): ParsedArgs {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelpAndExit(0);
  }

  let directory: string | undefined;
  let stepStr: string | undefined;
  let scope: 'dirs' | 'files' | 'both' | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--dir' || token === '-d') {
      directory = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--step' || token === '-s') {
      stepStr = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === '--scope') {
      const value = (argv[i + 1] ?? '').toLowerCase();
      if (value === 'dirs' || value === 'files' || value === 'both') {
        scope = value;
      }
      i += 1;
      continue;
    }
    if (!token.startsWith('-')) {
      // positional fallback
      if (!directory) directory = token;
      else if (!stepStr) stepStr = token;
      else if (!scope) {
        const value = token.toLowerCase();
        if (value === 'dirs' || value === 'files' || value === 'both') {
          scope = value;
        }
      }
    }
  }

  const resolvedDir = resolve(directory ?? process.cwd());
  const stepNum = Number(stepStr ?? '0');

  if (!existsSync(resolvedDir) || !lstatSync(resolvedDir).isDirectory()) {
    process.stderr.write(`❌ 目录不存在: ${resolvedDir}\n`);
    process.exit(1);
  }

  if (stepNum !== 1 && stepNum !== 2) {
    process.stderr.write('❌ 请传入步骤参数：1 或 2\n');
    process.exit(1);
  }

  return { directory: resolvedDir, step: stepNum as 1 | 2, scope: scope ?? 'dirs' };
}

function main(): void {
  const { directory, step, scope } = parseArgs(process.argv.slice(2));
  const options: TraverseOptions = {
    renameDirs: scope === 'dirs' || scope === 'both',
    renameFiles: scope === 'files' || scope === 'both',
  };
  processTree(directory, step, options);
  process.stdout.write(`\n✅ 第 ${step} 步处理完成 (scope: ${scope}): ${directory}\n`);
}

void (function run() {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(message + '\n');
    process.exit(1);
  }
})();
