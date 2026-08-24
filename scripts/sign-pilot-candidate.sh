#!/bin/zsh
set -euo pipefail

script_root="${0:A:h}"
package_root="${script_root:h}"
dist_root="${package_root}/dist"
private_key="/Users/mashiro/.product-os-signing/product-os-authority.key"
manifest="${dist_root}/release-verification-manifest.json"
package_version="$(node -p "require('${package_root}/package.json').version")"
authority_decision="$(node -p "require('${package_root}/package.json').vibeProductOS.releaseDecision")"
authority_status="$(node -p "require('${package_root}/package.json').vibeProductOS.releaseAuthorityStatus")"

if [[ "${authority_status}" != APPROVED* ]]; then
  print -u2 "Refusing to sign: ${authority_decision} is not explicitly approved for ${package_version}."
  exit 1
fi

if [[ -n "$(git -C "${package_root}" status --porcelain)" ]]; then
  print -u2 "Refusing to sign: the package source worktree is not clean."
  exit 1
fi
if [[ ! -f "${private_key}" || "$(stat -f '%Lp' "${private_key}")" != "600" ]]; then
  print -u2 "The encrypted Authority key is missing or does not have mode 600."
  exit 1
fi

subjects=(
  "${dist_root}/vibe-product-os-skill-${package_version}.zip"
  "${dist_root}/vibe-product-os-codex-plugin-${package_version}.zip"
  "${dist_root}/vibe-product-os-${package_version}.tgz"
  "${dist_root}/vibe-product-os-${package_version}.spdx.json"
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
  -t "Vibe Product OS ${package_version}; Authority M.M.Eyada; ${authority_decision}; npm pilot" \
  -m "${subjects[@]}"

node "${package_root}/scripts/configure-release-signatures.js"

print "Signing the configured release verification manifest."
minisign -Sm "${manifest}" -s "${private_key}" \
  -t "Vibe Product OS ${package_version} release manifest; Authority M.M.Eyada; ${authority_decision}"

node "${package_root}/bin/vibe-product-os.js" verify-release \
  --manifest "${manifest}" \
  --require-signatures \
  --json > "${dist_root}/signature-verification-record.json"

print "PILOT CANDIDATE SIGNATURE VERIFY PASS"
print "Publication remains a separate Authority action."
