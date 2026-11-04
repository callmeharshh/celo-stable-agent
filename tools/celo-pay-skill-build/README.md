# celo-pay skill build

Build tooling for the `celo-pay` Agent Skill (`skills/built-in/celo-pay/`).

Source lives in `src/skill.js`. It's bundled with esbuild (viem +
`@celo/attribution-tags` inlined, since the webview that runs it has no
package manager) into `skills/built-in/celo-pay/scripts/bundle.js`.

```bash
npm install
npm run build
```

Re-run `npm run build` after any change to `src/skill.js`, then commit the
regenerated `bundle.js` alongside it — the skill ships the built bundle, not
the source.
