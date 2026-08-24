#!/bin/zsh
set -euo pipefail

package_root="/Users/mashiro/Documents/Codex/2026-08-09/referenced-chatgpt-conversation-this-is-an/work/vibe-product-os"
dist_root="${package_root}/dist"
private_key="/Users/mashiro/.product-os-signing/product-os-authority.key"
manifest="${dist_root}/release-verification-manifest.json"

if [[ -n "$(git -C "${package_root}" status --porcelain)" ]]; then
  print -u2 "Refusing to sign: the package source worktree is not clean."
  exit 1
fi
if [[ ! -f "${private_key}" || "$(stat -f '%Lp' "${private_key}")" != "600" ]]; then
  print -u2 "The encrypted Authority key is missing or does not have mode 600."
  exit 1
fi

subjects=(
  "${dist_root}/vibe-product-os-skill-0.1.0-pilot.0.zip"
  "${dist_root}/vibe-product-os-codex-plugin-0.1.0-pilot.0.zip"
  "${dist_root}/vibe-product-os-0.1.0-pilot.0.tgz"
  "${dist_root}/vibe-product-os-0.1.0-pilot.0.spdx.json"
  "${dist_root}/release-build-report.json"
  "${dist_root}/SHA256SUMS"
)
for subject in "${subjects[@]}" "${manifest}"; do
  if [[ ! -f "${subject}" ]]; then
    print -u2 "Missing pilot release input: ${subject:t}"
    exit 1
  fi
done

for subject in "${subjects[@]}"; do
  if [[ -e "${subject}.minisig" ]]; then
    print -u2 "Refusing to overwrite existing signature: ${subject:t}.minisig"
    exit 1
  fi
done
if [[ -e "${manifest}.minisig" ]]; then
  print -u2 "Refusing to overwrite existing manifest signature."
  exit 1
fi

print "Signing six immutable pilot subjects with Authority key EAB95C319319813D."
minisign -S -s "${private_key}" \
  -t "Vibe Product OS 0.1.0-pilot.0; Authority M.M.Eyada; AUTH-DEC-002; npm pilot" \
  -m "${subjects[@]}"

node "${package_root}/scripts/configure-release-signatures.js"

print "Signing the configured release verification manifest."
minisign -Sm "${manifest}" -s "${private_key}" \
  -t "Vibe Product OS 0.1.0-pilot.0 release manifest; Authority M.M.Eyada"

node "${package_root}/bin/vibe-product-os.js" verify-release \
  --manifest "${manifest}" \
  --require-signatures \
  --json > "${dist_root}/signature-verification-record.json"

print "PILOT CANDIDATE SIGNATURE VERIFY PASS"
print "Publication remains a separate Authority action."
