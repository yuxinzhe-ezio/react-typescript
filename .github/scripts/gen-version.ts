import { appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  ENV_FILE_GITHUB_ENV,
  ENV_FILE_GITHUB_OUTPUT,
  ENV_GITHUB_HEAD_REF,
  ENV_GITHUB_REF,
  ENV_GITHUB_REF_NAME,
  ENV_GITHUB_RUN_NUMBER,
} from "./constants";

type SemverTuple = [number, number, number];

const safeExec = (command: string): string | null => {
  try {
    const output = execSync(command, { stdio: ["ignore", "pipe", "ignore"] });
    return output.toString().trim();
  } catch {
    return null;
  }
};

const fetchLatestTag = (): string => {
  safeExec("git fetch --tags");
  const tag = safeExec("git describe --tags --abbrev=0");
  return tag ?? "v0.0.0";
};

const parseVersion = (tag: string): SemverTuple => {
  const version = tag.startsWith("v") ? tag.slice(1) : tag;
  const [majorStr, minorStr, patchStr] = version.split(".");
  const major = Number(majorStr) || 0;
  const minor = Number(minorStr) || 0;
  const patch = Number(patchStr) || 0;
  return [major, minor, patch];
};

const resolveBranchName = (env: NodeJS.ProcessEnv): string => {
  const headRef = env[ENV_GITHUB_HEAD_REF];
  if (headRef && headRef.length > 0) return headRef;

  const refName = env[ENV_GITHUB_REF_NAME];
  if (refName && refName.length > 0) return refName;

  const ref = env[ENV_GITHUB_REF] || "";
  if (ref.startsWith("refs/heads/")) return ref.replace("refs/heads/", "");
  return ref || "";
};

const bumpVersion = (
  [majorIn, minorIn, patchIn]: SemverTuple,
  branch: string,
  runNumberRaw: string | undefined
): { version: string; suffix: string } => {
  let major = majorIn;
  let minor = minorIn;
  let patch = patchIn;
  const runNumber = (runNumberRaw && Number(runNumberRaw)) || 0;
  let suffix = "";

  if (branch.startsWith("feature/")) {
    minor += 1;
    patch = 0;
    suffix = `-alpha.${runNumber}`;
  } else if (branch.startsWith("hotfix/")) {
    patch += 1;
    suffix = `-hotfix.${runNumber}`;
  } else if (branch.startsWith("release/")) {
    minor += 1;
    patch = 0;
  } else if (branch === "master" || branch === "main") {
    patch += 1;
  }

  const version = `v${major}.${minor}.${patch}${suffix}`;
  return { version, suffix };
};

const writeGithubOutputs = (envPath: string | undefined, outputPath: string | undefined, version: string): void => {
  if (envPath && envPath.length > 0) {
    appendFileSync(envPath, `\nVERSION=${version}\n`);
  }
  if (outputPath && outputPath.length > 0) {
    appendFileSync(outputPath, `\nversion=${version}\n`);
  }
};

const main = (): void => {
  const latestTag = fetchLatestTag();
  const baseVersion = parseVersion(latestTag);
  const branch = resolveBranchName(process.env);
  const runNumber = process.env[ENV_GITHUB_RUN_NUMBER];

  const { version } = bumpVersion(baseVersion, branch, runNumber);
  const githubEnvPath = process.env[ENV_FILE_GITHUB_ENV];
  const githubOutputPath = process.env[ENV_FILE_GITHUB_OUTPUT];
  writeGithubOutputs(githubEnvPath, githubOutputPath, version);
};

main();


