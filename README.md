# $æ Cockpit · Agentic Environments

**One cockpit. Many pilots. One human principal.**

Mobile-first WebGL shader cockpit with six ticker lanes: Human, Flag Staff, Drive, Harvest, Orchards, and System.

## Preview

Once GitHub Pages is enabled, the intended URL is https://myaelmendez.github.io/ae-cockpit/ . The GitHub Actions workflow is included, but deployment has not been independently verified.

## Run locally

```sh
python3 -m http.server 8000
```

Open http://localhost:8000/ . A local server is required for JSON and GLSL fetches.

## Status

**Visual prototype only (v0.2.0).** Ticker actions pause their lanes and display placeholder notices. No AI models, MCP tools, payments, or agents are connected. The shader falls back to a static background if WebGL is unavailable. Reduced-motion preferences disable animation.

## Widget fleet and invocations

Each 🛸 represents a composable widget, not a model or an autonomous authority. The cockpit includes Email, Search, GitHub, Drive, Orchard, and Witness widgets. Select a tile or enter `$@ae 📧$æ` / `$@ae github` in the invocation field. Widget selection is implemented; provider connections and execution are not. See `docs/invocations.md` and `protocols/widget.schema.json`.

## Repository map

- `index.html`: entry surface
- `cockpit/`: shader initialization, ticker UI, navigation, CSS
- `shaders/`: GLSL source
- `registry/`: environments, conceptual pilots, capability status
- `protocols/`: authority, MCP boundary, witness receipt schema
- `profiles/`: default user profile
- `examples/`: sample #startabusiness configuration
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow

## Principles

- Human principal authorizes consequential actions.
- Context may propagate; authority does not.
- GitHub is canonical source; ChatGPT UI is a separate presentation surface.
- Never commit credentials, access tokens, or private conversation data.

## Publish

In **Settings → Pages**, choose **GitHub Actions** as the deployment source. A push to `main` triggers the included workflow. GitHub Pages is separate from hosting a site inside OpenAI.

## License

MIT.
