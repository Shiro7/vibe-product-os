#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const siteRoot = path.join(root, 'website');
const packageJson = require(path.join(root, 'package.json'));
const identity = require(path.join(root, 'lib', 'identity'));
const findings = [];

function fail(rule, message) {
  findings.push({ rule, message });
}

function read(relative) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    fail('SITE-REQUIRED-FILE', `Missing ${relative}.`);
    return '';
  }
  return fs.readFileSync(file, 'utf8');
}

const html = read('website/index.html');
const css = read('website/styles.css');
const javascript = read('website/main.js');
const requiredAssets = [
  'website/assets/vpos-control-plane.jpg',
  'website/assets/vpos-agent-network.jpg',
  'website/assets/vpos-lifecycle.jpg',
];

for (const relative of requiredAssets) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    fail('SITE-ASSET', `Missing ${relative}.`);
    continue;
  }
  const size = fs.statSync(file).size;
  if (size < 50_000 || size > 650_000) fail('SITE-ASSET-SIZE', `${relative} has an unexpected size of ${size} bytes.`);
}

if (packageJson.vibeProductOS?.shortName !== 'VPOS') fail('VPOS-PACKAGE-IDENTITY', 'package.json does not pin VPOS as the short name.');
if (identity.short_name !== 'VPOS') fail('VPOS-RUNTIME-IDENTITY', 'Runtime identity does not expose VPOS.');
if (packageJson.bin?.vpo !== 'bin/vibe-product-os.js' || packageJson.bin?.['vibe-product-os'] !== 'bin/vibe-product-os.js') {
  fail('VPOS-CLI-COMPATIBILITY', 'The published CLI names are not preserved.');
}

if (!html.includes('<html lang="en">')) fail('SITE-LANGUAGE', 'The document language is missing.');
if (!html.includes('class="skip-link"')) fail('SITE-SKIP-LINK', 'The skip link is missing.');
if (!html.includes('npx vibe-product-os@pilot install')) fail('SITE-INSTALL-COMMAND', 'The approved pilot installation command is missing.');
if (!html.includes('not yet production-proven')) fail('SITE-CLAIM-BOUNDARY', 'The public pilot claim boundary is missing.');
if (!css.includes('prefers-reduced-motion')) fail('SITE-REDUCED-MOTION', 'Reduced motion handling is missing.');
if (!css.includes('prefers-color-scheme')) fail('SITE-COLOR-SCHEME', 'System light and dark mode handling is missing.');
if (javascript.includes("addEventListener('scroll'") || javascript.includes('addEventListener("scroll"')) {
  fail('SITE-SCROLL-HANDLER', 'Direct window scroll handlers are not allowed.');
}

for (const [file, content] of [['index.html', html], ['main.js', javascript]]) {
  if (/[–—]/u.test(content)) fail('SITE-DASH-TYPOGRAPHY', `${file} contains a prohibited en dash or em dash.`);
}

const sectionCount = (html.match(/<section\b/gu) || []).length;
const eyebrowCount = (html.match(/class="eyebrow"/gu) || []).length;
if (eyebrowCount > Math.ceil(sectionCount / 3)) {
  fail('SITE-EYEBROW-DENSITY', `Found ${eyebrowCount} eyebrows across ${sectionCount} sections.`);
}

for (const match of html.matchAll(/<img\s+([^>]+)>/gu)) {
  const attributes = match[1];
  if (!/\balt="[^"]+"/u.test(attributes)) fail('SITE-IMAGE-ALT', `Image is missing useful alt text: ${match[0]}`);
  if (!/\bwidth="\d+"/u.test(attributes) || !/\bheight="\d+"/u.test(attributes)) {
    fail('SITE-IMAGE-DIMENSIONS', `Image is missing intrinsic dimensions: ${match[0]}`);
  }
}

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]));
for (const match of html.matchAll(/\bhref="#([^"]+)"/gu)) {
  if (!ids.has(match[1])) fail('SITE-ANCHOR', `Anchor #${match[1]} has no target.`);
}

for (const match of html.matchAll(/\b(?:href|src)="([^"#][^"]*)"/gu)) {
  const value = match[1];
  if (/^(?:https?:|mailto:|data:)/u.test(value)) continue;
  const clean = value.split('?')[0];
  const target = path.resolve(siteRoot, clean);
  if (!target.startsWith(`${siteRoot}${path.sep}`) || !fs.existsSync(target)) {
    fail('SITE-LOCAL-REFERENCE', `Local reference does not resolve: ${value}`);
  }
}

const report = {
  check: 'vpos-website',
  result: findings.length ? 'FAIL' : 'PASS',
  sections: sectionCount,
  eyebrows: eyebrowCount,
  generated_assets: requiredAssets.length,
  findings,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (findings.length) process.exitCode = 1;
