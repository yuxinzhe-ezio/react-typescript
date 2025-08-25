export type BuildEnv = Record<string, string>;

export type ProjectBuildConfig = {
  /** Project directory at repo root, e.g. "web3" */
  projectPath: string;
  /** Cloudflare Pages project name, e.g. "plaud-web3" */
  cloudflareProject: string;
  /** Build output directory relative to projectPath, e.g. "dist" */
  buildDir: string;
  /** Optional public base path, e.g. "./" */
  publicPath?: string;
  /** Env applied for all environments */
  envCommon?: BuildEnv;
  /** Env overrides per environment */
  envPerEnv?: Partial<Record<string, BuildEnv>>;
};

export const PROJECT_BUILD_CONFIGS: Record<string, ProjectBuildConfig> = {
  web: {
    projectPath: './apps/web',
    cloudflareProject: 'react-typescripts',
    buildDir: 'dist',
    publicPath: './',
    envCommon: {
      OUT_DIR: 'dist',
      PUBLIC_PATH: './',
    },
    envPerEnv: {
      prod: {},
      test: {},
      dev: {},
    },
  },
};

export function resolveBuildEnv(cfg: ProjectBuildConfig, envName: string): BuildEnv {
  return { ...(cfg.envCommon || {}), ...((cfg.envPerEnv && cfg.envPerEnv[envName]) || {}) };
}
