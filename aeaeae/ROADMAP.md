# Roadmap

The local reference slice now implements bounded task trees, explicit context selection, local confirmations, two fixed text tools, cancellation, rejoining and an exportable hash-linked ledger. See `PRIMITIVES.md`. Browser task execution is verified; independent LLM conversations and provider access are not implemented.

1. **Inspect the tree:** local viewer, context source display and states are implemented. Improve mobile/accessibility coverage and add revision editing in the UI.
2. **Validate bounds:** fixed parent links, input validation, depth/open-task/deadline limits and negative-path tests are implemented locally. Add a portable import schema before supporting saved-state restoration.
3. **Bind one host:** discover actual tools, authenticate a human, and verify separately issued grants. Do not invent a universal account connection.
4. **Execute one reversible task:** bounded attempt, cancellation, retry ceiling, recorded output, evidence and return to parent.
5. **Rejoin:** preserve source references, uncertainty, reported versus reproduced evidence and human decisions.
6. **Verify release:** browser/mobile/accessibility checks, independent CI receipts and documented limits before runtime-readiness claims.

The WebGL story remains a design artifact. Passing local tests does not complete the production host and release work in steps 3–6.
