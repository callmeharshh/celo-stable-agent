# Celo Stable Agent

Built for [Agents on Open Rails](https://www.loops.house/agents-on-open-rails) — **Stable Agents: LatAm (Ripio × Celo Core Co.)** track.

An on-device AI agent for Android that lets anyone send, save, and settle in Ripio's local-currency
stablecoins on Celo — wARS, wBRL, wMXN, wCOP, wPEN, wCLP — using natural language, fully offline,
with no cloud inference call ever touching the user's financial data.

> "Send 20,000 to Juan for rent in reais" → the on-device model parses the request, resolves it to a
> wBRL transfer, shows a confirmation, and signs/broadcasts it on Celo mainnet.

See [`SUBMISSION.md`](SUBMISSION.md) for the full writeup: how this maps to the track's judging
criteria, architecture, and how to try it yourself.

## Why on-device

Two real constraints for LatAm users this directly addresses:

- **Unreliable/costly mobile data** — inference runs locally via Gemma 4 (E2B), so using the agent
  needs no round-trip to a cloud LLM.
- **Low crypto/financial literacy** — natural language instead of needing to understand gas, token
  contracts, or wallet addresses.

## How it's built

This project is forked from Google's open-source **[AI Edge Gallery](https://github.com/google-ai-edge/gallery)**
(Apache 2.0 — see `LICENSE`; original docs preserved in `UPSTREAM_README.md`), which already ships a
production on-device LLM runtime (LiteRT-LM, Gemma 4) and a native tool/function-calling framework.
We add a new tool on top of it:

- **`sendCeloPayment(recipient, amount, currency)`** — a new entry in the app's existing Mobile
  Actions framework (see `Function_Calling_Guide.md` for how that framework works), following the
  same pattern as its built-in `sendEmail`/`createContact` actions.
- A small embedded WebView running a bundled JS module (`viem` + the official
  [`@celo/attribution-tags`](https://github.com/celo-org/attribution-tags) SDK) handles all Celo
  mainnet chain interaction: reading wFIAT balances, building/signing/sending ERC-20 transfers, and
  tagging every transaction per **ERC-8021**. This SDK is TypeScript-only with no published
  byte-level spec, so chain calls go through the official package rather than a hand-rolled Kotlin
  implementation — the attribution tag cannot be added retroactively, so it has to be correct from
  the first transaction.
- Kotlin calls into the WebView bridge and awaits the result via a coroutine, surfacing the tx hash
  back to the user.

Identity registration (**ERC-8004**, `register(string)` on the Celo mainnet Identity Registry at
`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`) is handled by a one-time script, run once before
submission — not part of the shipped app.

## wFIAT token addresses (Celo mainnet, 18 decimals)

| Token | Address |
|---|---|
| wARS | `0x0dc4f92879b7670e5f4e4e6e3c801d229129d90d` |
| wBRL | `0xd76f5faf6888e24d9f04bf92a0c8b921fe4390e0` |
| wMXN | `0x337e7456b420bd3481e7fa61fa9850343d610d34` |
| wCOP | `0x8a1d45e102e886510e891d2ec656a708991e2d76` |
| wPEN | `0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE` |
| wCLP | `0x61D450a098b6a7f69fC4b98CE68198fe59768651` |

## Status

🚧 Prototype in progress for the Nov 9, 2026 09:00 GMT submission deadline.

## License

Apache 2.0, inherited from the upstream AI Edge Gallery project. See `LICENSE`.
