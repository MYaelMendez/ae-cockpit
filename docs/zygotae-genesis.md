# $æ 🦩Z — ZYGOTÆ Genesis Entry

**Status:** design contract / prototype. No GitHub account creation, agent execution, or deployment is implied.

## Invocation

`$æ 🦩Z` invokes the **ZYGOTÆ genetic onboarding interview** within the æ Cockpit / Cling Engine. The flamingo is a symbolic entry point, not a separate authority.

```text
HUMAN://ROOT
  -> $æ 🦩Z
  -> INTERVIEW
  -> CONTEXT://GENOME
  -> REVIEW + CONSENT
  -> GIT://FORK
  -> WHITE-LABEL://COCKPIT
  -> HUMAN-APPROVED://OPERATE
```

## Interview (one question at a time)

1. Purpose — what do you want to build?
2. Role — entrepreneur, educator, creator, organization, or other?
3. Brand — preferred name, colors, and optional domain?
4. Capabilities — which tools or agent abilities do you need?
5. Boundaries — which actions always require explicit approval?

Allow skip, revise, export, and deletion. The term *genetic* refers to an editable configuration blueprint, **not biological data, inherited traits, or psychological diagnosis**.

## Draft output

```json
{
  "schema": "zygotae.genesis.v1",
  "invocation": "$æ 🦩Z",
  "principal": "HUMAN://ROOT",
  "profile": {
    "purpose": "",
    "role": "",
    "brand": "",
    "capabilities": [],
    "approval_boundaries": []
  },
  "repository": {
    "template": "MYaelMendez/ae-cockpit",
    "white_label": true,
    "creation_status": "proposed"
  },
  "governance": {
    "consequential_actions": "human_approval_required",
    "context_may_propagate": true,
    "authority_may_propagate": false
  }
}
```

## Implementation boundary

The browser may collect answers and generate a local preview or exportable JSON. Creating a GitHub repository requires authenticated GitHub authorization, an explicit target owner/name, user confirmation of public/private visibility, and review of generated files before commit. Never put secrets, tokens, or private interview transcripts in public repositories. Never treat an interview answer as authorization to publish, spend, sign, or grant agent permissions.

## Integration points

- `profiles/`: reviewed genesis configuration
- `registry/`: capabilities selected during onboarding
- `protocols/`: principal, approval, and witness rules
- `cockpit/`: mobile-first onboarding interface and white-label livery
- `examples/`: sample `#startabusiness` genesis output

**One cockpit. Many pilots. One human principal.**
