'use strict';

const path = require('node:path');
const readline = require('node:readline/promises');
const {
  AGENTS,
  POPULAR_AGENT_IDS,
  OTHER_AGENT_IDS,
  detectAgents,
  normalizeAgentIds,
  normalizeMethod,
  normalizeScope,
  normalizeStrategy,
} = require('./agent-targets');
const { planInstallations } = require('./installer');

function answerOrDefault(value, fallback) {
  const trimmed = String(value || '').trim();
  return trimmed || fallback;
}

function parseScopeChoice(value) {
  const normalized = answerOrDefault(value, 'project').toLowerCase();
  if (normalized === '1') return 'project';
  if (normalized === '2') return 'user';
  return normalizeScope(normalized);
}

function parseStrategyChoice(value) {
  const normalized = answerOrDefault(value, 'shared').toLowerCase();
  if (normalized === '1') return 'shared';
  if (normalized === '2') return 'native';
  return normalizeStrategy(normalized);
}

function parseMethodChoice(value) {
  const normalized = answerOrDefault(value, 'copy').toLowerCase();
  if (normalized === '1') return 'copy';
  if (normalized === '2') return 'link';
  return normalizeMethod(normalized);
}

function parseAgentSelection(value, defaultIds = POPULAR_AGENT_IDS) {
  const raw = answerOrDefault(value, defaultIds.join(','));
  const tokens = raw.split(',').map((item) => item.trim()).filter(Boolean);
  let wantsCustom = false;
  const selected = [];
  for (const token of tokens) {
    const numeric = Number.parseInt(token, 10);
    if (String(numeric) === token && numeric >= 1 && numeric <= POPULAR_AGENT_IDS.length + OTHER_AGENT_IDS.length + 1) {
      if (numeric === POPULAR_AGENT_IDS.length + OTHER_AGENT_IDS.length + 1) wantsCustom = true;
      else selected.push([...POPULAR_AGENT_IDS, ...OTHER_AGENT_IDS][numeric - 1]);
    } else if (token.toLowerCase() === 'custom') {
      wantsCustom = true;
    } else {
      selected.push(...normalizeAgentIds(token));
    }
  }
  return { agents: [...new Set(selected)], wantsCustom };
}

function parseYes(value, fallback = false) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  return ['y', 'yes'].includes(normalized);
}

function renderAgentMenu(detectedIds = []) {
  const lines = ['Select every agent that should receive or share the Skill:'];
  const ordered = [...POPULAR_AGENT_IDS, ...OTHER_AGENT_IDS];
  ordered.forEach((id, index) => {
    const agent = AGENTS[id];
    const group = agent.group === 'popular' ? 'popular' : 'additional';
    const detected = detectedIds.includes(id) ? ', detected' : '';
    lines.push(`  ${index + 1}) ${agent.label} (${id}; ${group}${detected})`);
  });
  lines.push(`  ${ordered.length + 1}) Custom skills directory`);
  lines.push('Use comma-separated numbers or IDs; `popular`, `other`, and `all` are accepted.');
  return lines.join('\n');
}

function formatInstallationPlan(plan) {
  const lines = [
    '',
    'Installation preview',
    `  Scope: ${plan.scope}`,
    `  Layout: ${plan.strategy}`,
    `  Method: ${plan.method}`,
    `  Selected agents: ${plan.requested_agents.join(', ') || 'custom only'}`,
  ];
  if (plan.managed_store) {
    lines.push(`  Managed store: ${plan.managed_store.destination} [${plan.managed_store.action}]`);
  }
  lines.push('  Destinations:');
  plan.targets.forEach((target) => {
    const owners = target.agent_labels.length ? target.agent_labels.join(', ') : 'Custom target';
    lines.push(`    - ${target.destination}`);
    if (target.through_filesystem_link) lines.push(`      Physical: ${target.physical_destination}`);
    lines.push(`      ${owners} [${target.action}]`);
  });
  if (plan.deduplicated_agent_target_count > 0) {
    lines.push(`  Shared-path deduplication: ${plan.deduplicated_agent_target_count} duplicate target(s) avoided.`);
  }
  const notices = [...new Set(plan.targets.flatMap((target) => target.notices))];
  if (notices.length) {
    lines.push('  Agent notices:');
    for (const notice of notices) lines.push(`    - ${notice}`);
  }
  return `${lines.join('\n')}\n`;
}

async function runInstallWizard(initial = {}, io = {}) {
  const input = io.input || process.stdin;
  const output = io.output || process.stdout;
  const rl = readline.createInterface({ input, output });
  const cwd = path.resolve(initial.directory || '.');
  try {
    output.write('\nVibe Product OS multi-agent setup\n');
    output.write(`Project: ${cwd}\n\n`);

    const scope = initial.scope || parseScopeChoice(await rl.question(
      'Installation scope — 1) this project  2) this user [1]: ',
    ));
    const detections = detectAgents({ cwd, home: initial.home });
    const detectedIds = detections.filter((item) => item.detected).map((item) => item.id);
    const defaults = detectedIds.length ? detectedIds : POPULAR_AGENT_IDS;

    let customRoots = [...(initial.customRoots || [])];
    let agents = initial.agents || (customRoots.length ? [] : null);
    if (agents === null) {
      output.write(`${renderAgentMenu(detectedIds)}\n`);
      const selection = parseAgentSelection(await rl.question(
        `Agents [${defaults.join(',')}]: `,
      ), defaults);
      agents = selection.agents;
      if (selection.wantsCustom) {
        const custom = await rl.question('Absolute or project-relative custom skills directory: ');
        if (!String(custom).trim()) throw new Error('A custom skills directory cannot be empty.');
        customRoots.push(custom.trim());
      }
    }

    const strategy = initial.strategy || parseStrategyChoice(await rl.question(
      'Layout — 1) shared .agents path where officially supported  2) each agent native path [1]: ',
    ));
    const method = initial.method || parseMethodChoice(await rl.question(
      'Method — 1) independent copies  2) links to one managed local store [1]: ',
    ));

    const options = {
      cwd,
      home: initial.home,
      scope,
      agents,
      customRoots,
      strategy,
      method,
      force: Boolean(initial.force),
      dryRun: Boolean(initial.dryRun),
    };
    let plan = planInstallations(options);
    output.write(formatInstallationPlan(plan));

    const existingConflicts = plan.targets.filter((target) => target.action === 'SKIPPED');
    if (existingConflicts.length && !options.force && !options.dryRun) {
      const replace = parseYes(await rl.question(
        `${existingConflicts.length} existing destination(s) will be preserved. Replace them? [y/N]: `,
      ));
      if (replace) {
        options.force = true;
        plan = planInstallations(options);
        output.write(formatInstallationPlan(plan));
      }
    }

    if (options.dryRun) return { options, plan, confirmed: false, dryRun: true };
    const confirmed = parseYes(await rl.question('Apply this exact installation plan? [y/N]: '));
    return { options, plan, confirmed, cancelled: !confirmed };
  } finally {
    rl.close();
  }
}

module.exports = {
  formatInstallationPlan,
  parseAgentSelection,
  parseMethodChoice,
  parseScopeChoice,
  parseStrategyChoice,
  parseYes,
  renderAgentMenu,
  runInstallWizard,
};
