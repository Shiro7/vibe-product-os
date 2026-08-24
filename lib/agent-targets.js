'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const POPULAR_AGENT_IDS = Object.freeze([
  'codex',
  'claude',
  'gemini',
  'copilot',
  'cursor',
  'windsurf',
]);

const OTHER_AGENT_IDS = Object.freeze([
  'opencode',
  'cline',
  'zed',
]);

const AGENTS = Object.freeze({
  codex: {
    id: 'codex',
    label: 'OpenAI Codex',
    group: 'popular',
    aliases: ['openai', 'openai-codex'],
    commandNames: ['codex'],
    detectionMarkers: { project: ['.codex'], user: ['.codex'] },
    docs: 'https://developers.openai.com/codex/skills',
    documentedLinkSupport: true,
    native: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Start or resume Codex in the target project and ask it to use Vibe Product OS.',
  },
  claude: {
    id: 'claude',
    label: 'Claude Code',
    group: 'popular',
    aliases: ['claude-code', 'cloud', 'cloude'],
    commandNames: ['claude'],
    detectionMarkers: { project: ['.claude'], user: ['.claude'] },
    docs: 'https://code.claude.com/docs/en/agent-sdk/skills',
    native: { project: ['.claude', 'skills'], user: ['.claude', 'skills'] },
    verify: 'Start a new Claude Code session in the target project and invoke the Skill by name.',
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini CLI',
    group: 'popular',
    aliases: ['gemini-cli', 'google-gemini'],
    commandNames: ['gemini'],
    detectionMarkers: { project: ['.gemini'], user: ['.gemini'] },
    docs: 'https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/using-agent-skills.md',
    documentedLinkSupport: true,
    native: { project: ['.gemini', 'skills'], user: ['.gemini', 'skills'] },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Run `gemini skills list`; in an open session use `/skills reload` if needed.',
  },
  copilot: {
    id: 'copilot',
    label: 'GitHub Copilot',
    group: 'popular',
    aliases: ['github', 'github-copilot', 'copilot-cli'],
    commandNames: ['copilot'],
    detectionMarkers: { project: ['.github'], user: ['.copilot'] },
    docs: 'https://docs.github.com/en/copilot/concepts/agents/about-agent-skills',
    native: { project: ['.github', 'skills'], user: ['.copilot', 'skills'] },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Open Copilot in the target repository and ask it to use the Vibe Product OS Skill.',
  },
  cursor: {
    id: 'cursor',
    label: 'Cursor',
    group: 'popular',
    aliases: ['cursor-agent'],
    commandNames: ['cursor', 'cursor-agent'],
    detectionMarkers: { project: ['.cursor'], user: ['.cursor'] },
    docs: 'https://cursor.com/docs/context/skills',
    native: { project: ['.cursor', 'skills'], user: ['.cursor', 'skills'] },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Open a new Cursor Agent chat in the target project and invoke the Skill by name.',
  },
  windsurf: {
    id: 'windsurf',
    label: 'Windsurf',
    group: 'popular',
    aliases: ['cascade', 'codeium'],
    commandNames: ['windsurf'],
    detectionMarkers: { project: ['.windsurf'], user: ['.codeium', 'windsurf'] },
    docs: 'https://docs.windsurf.com/windsurf/cascade/skills',
    native: {
      project: ['.windsurf', 'skills'],
      user: ['.codeium', 'windsurf', 'skills'],
    },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Open Cascade in the target project and ask it to use the Vibe Product OS Skill.',
  },
  opencode: {
    id: 'opencode',
    label: 'OpenCode',
    group: 'other',
    aliases: ['open-code'],
    commandNames: ['opencode'],
    detectionMarkers: { project: ['.opencode'], user: ['.config', 'opencode'] },
    docs: 'https://opencode.ai/docs/skills/',
    native: {
      project: ['.opencode', 'skills'],
      user: ['.config', 'opencode', 'skills'],
    },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Start OpenCode in the target project and invoke the Skill by name.',
  },
  cline: {
    id: 'cline',
    label: 'Cline',
    group: 'other',
    aliases: ['cline-cli'],
    commandNames: ['cline'],
    detectionMarkers: { project: ['.cline'], user: ['.cline'] },
    docs: 'https://docs.cline.bot/customization/skills',
    native: { project: ['.cline', 'skills'], user: ['.cline', 'skills'] },
    verify: 'Open Cline’s Skills menu or invoke `/vibe-product-os`; discovered Skills are enabled by default.',
    notice: 'Cline gives a same-named global Skill precedence over a project Skill.',
  },
  zed: {
    id: 'zed',
    label: 'Zed',
    group: 'other',
    aliases: ['zed-editor'],
    commandNames: ['zed'],
    detectionMarkers: { project: ['.zed'], user: ['.config', 'zed'] },
    docs: 'https://zed.dev/docs/ai/skills',
    documentedLinkSupport: true,
    native: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    shared: { project: ['.agents', 'skills'], user: ['.agents', 'skills'] },
    verify: 'Trust the worktree, then invoke `/vibe-product-os` or mention the Skill in Agent Panel.',
    notice: 'Zed only discovers Skills that are direct children of a skills directory.',
  },
});

const ALIASES = Object.freeze(Object.values(AGENTS).reduce((result, agent) => {
  result[agent.id] = agent.id;
  for (const alias of agent.aliases) result[alias] = agent.id;
  return result;
}, {}));

function normalizeScope(value = 'project') {
  const normalized = String(value).trim().toLowerCase();
  if (['project', 'repo', 'repository', 'local', 'workspace'].includes(normalized)) return 'project';
  if (['user', 'global', 'personal'].includes(normalized)) return 'user';
  throw new Error('Install scope must be project/repository or user/global.');
}

function normalizeStrategy(value = 'shared') {
  const normalized = String(value).trim().toLowerCase();
  if (['shared', 'portable', 'shared-first'].includes(normalized)) return 'shared';
  if (['native', 'agent-native'].includes(normalized)) return 'native';
  throw new Error('Install strategy must be shared/portable or native.');
}

function normalizeMethod(value = 'copy') {
  const normalized = String(value).trim().toLowerCase();
  if (['copy', 'copied'].includes(normalized)) return 'copy';
  if (['link', 'symlink', 'linked'].includes(normalized)) return 'link';
  throw new Error('Install method must be copy or link.');
}

function normalizeAgentIds(value = ['codex']) {
  const raw = Array.isArray(value) ? value : String(value).split(',');
  const expanded = [];
  for (const item of raw.flatMap((entry) => String(entry).split(','))) {
    const normalized = item.trim().toLowerCase();
    if (!normalized) continue;
    if (normalized === 'all') expanded.push(...POPULAR_AGENT_IDS, ...OTHER_AGENT_IDS);
    else if (['popular', 'famous', 'recommended'].includes(normalized)) expanded.push(...POPULAR_AGENT_IDS);
    else if (['other', 'others', 'additional'].includes(normalized)) expanded.push(...OTHER_AGENT_IDS);
    else if (ALIASES[normalized]) expanded.push(ALIASES[normalized]);
    else throw new Error(`Unsupported agent "${item}". Run \`vibe-product-os targets\` to list supported agents.`);
  }
  return [...new Set(expanded)];
}

function resolveAgentSkillsRoot(agentId, options = {}) {
  const agent = AGENTS[agentId];
  if (!agent) throw new Error(`Unsupported agent "${agentId}".`);
  const scope = normalizeScope(options.scope);
  const strategy = normalizeStrategy(options.strategy);
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  const relative = strategy === 'shared' && agent.shared
    ? agent.shared[scope]
    : agent.native[scope];
  const base = scope === 'project' ? cwd : home;
  const usesShared = strategy === 'shared' && Boolean(agent.shared);
  return {
    skillsRoot: path.join(base, ...relative),
    layout: usesShared ? 'shared' : 'native',
  };
}

function resolveManagedStore(options = {}) {
  const scope = normalizeScope(options.scope);
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  const base = scope === 'project' ? cwd : home;
  return path.join(base, '.vibe-product-os', 'skill-store', 'vibe-product-os');
}

function pathExists(target) {
  try {
    fs.lstatSync(target);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

function findExecutable(names, envPath = process.env.PATH || '') {
  const extensions = process.platform === 'win32'
    ? String(process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
    : [''];
  for (const directory of envPath.split(path.delimiter).filter(Boolean)) {
    for (const name of names) {
      for (const extension of extensions) {
        const candidate = path.join(directory, `${name}${extension}`);
        try {
          fs.accessSync(candidate, fs.constants.X_OK);
          return candidate;
        } catch {
          // Continue detection without treating a missing binary as an error.
        }
      }
    }
  }
  return null;
}

function detectAgents(options = {}) {
  const cwd = path.resolve(options.cwd || process.cwd());
  const home = path.resolve(options.home || os.homedir());
  return Object.values(AGENTS).map((agent) => {
    const markers = [
      path.join(cwd, ...agent.detectionMarkers.project),
      path.join(home, ...agent.detectionMarkers.user),
    ];
    const marker = markers.find((candidate) => pathExists(candidate)) || null;
    const executable = findExecutable(agent.commandNames, options.envPath);
    return {
      id: agent.id,
      label: agent.label,
      detected: Boolean(marker || executable),
      evidence: executable ? `command:${executable}` : marker ? `directory:${marker}` : null,
    };
  });
}

function agentCatalog() {
  return Object.values(AGENTS).map((agent) => ({
    id: agent.id,
    label: agent.label,
    group: agent.group,
    aliases: agent.aliases,
    official_docs: agent.docs,
    supports_shared_agents_directory: Boolean(agent.shared),
    documented_link_support: Boolean(agent.documentedLinkSupport),
    project_native_root: agent.native.project.join('/'),
    user_native_root: `~/${agent.native.user.join('/')}`,
    notice: agent.notice || null,
  }));
}

module.exports = {
  AGENTS,
  POPULAR_AGENT_IDS,
  OTHER_AGENT_IDS,
  agentCatalog,
  detectAgents,
  normalizeAgentIds,
  normalizeMethod,
  normalizeScope,
  normalizeStrategy,
  pathExists,
  resolveAgentSkillsRoot,
  resolveManagedStore,
};
