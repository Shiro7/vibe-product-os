# Spec Kit, Figma, and GitHub Mapping

Use the bundled canonical source `outputs/Spec_Kit_Figma_GitHub_Mapping/Spec_Kit_Figma_GitHub_Mapping_Index.md` for mapping rules.

- Preserve one canonical owner for each fact, requirement, decision, design definition, code change, test result, and release record.
- Register native Figma nodes, GitHub issues/PRs/commits/checks, CI runs, and Spec Kit objects by exact provider, repository/file, object ID, revision, URL when available, and observed state.
- Store Product OS trace edges and synchronization status; do not create an authoritative Markdown clone of a native object.
- Resolve direction of truth before synchronization. Record conflicts instead of silently overwriting either side.
- A handoff must identify source object, target object, required transformation, owner, acceptance evidence, and stale/reopen behavior.
- Tool availability does not expand agent authority. External writes still require the task’s authorization and applicable Product OS controls.
