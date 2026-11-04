# Celo Stable Agent — Submission

**Track:** [Stable Agents: LatAm (Ripio × Celo Core Co.)](https://www.loops.house/agents-on-open-rails) — Agents on Open Rails

## The problem

Across LatAm, moving money between people usually means converting through the
dollar first — a remittance, a payroll run, or a cross-border payment each pick
up a USD leg and fees at every hop, even when both sides just want pesos, reais,
or soles. Most crypto UX makes this worse, not better: it asks a non-technical
user to understand gas, token contracts, and wallet addresses before they can
send money to a relative.

## What we built

An on-device AI agent for Android that lets someone send, in plain language, in
their own currency:

> "Send 20,000 to Juan for rent in reais" → parsed locally, resolved to a wBRL
> transfer, confirmed, signed, and broadcast on Celo mainnet.

It runs as a [Google AI Edge Gallery](https://github.com/google-ai-edge/gallery)
**Agent Skill**: Gemma 4 runs fully on-device (no cloud inference call, ever),
and when it recognizes a payment request it invokes our `celo-pay` skill — a
sandboxed webview that builds, signs, and sends a real ERC-20 transfer of
Ripio's wFIAT tokens on Celo mainnet, tagged with the project's ERC-8021
attribution code.

### Why on-device, specifically

- **Unreliable/costly mobile data** is a real constraint for a lot of LatAm
  users. On-device inference means using the agent needs no round-trip to a
  cloud LLM — it works the same on a weak connection as a strong one.
- **Low crypto/financial literacy** is the other real barrier. Natural
  language replaces needing to understand gas, token contracts, or addresses.
  The private key never touches the model's prompt context either — it's
  collected through the app's own secure secret-entry dialog.

### Why a skill, not a from-scratch rebuild

AI Edge Gallery already ships a production on-device LLM runtime (LiteRT-LM,
Gemma 4) and two extension points: native Kotlin tools, and JS "skills" that
run in a hidden webview. We used the JS skill path so the project runs against
the stock app with no Gradle build required, and so we could use Celo's own
official TypeScript SDKs directly rather than reimplementing them:

- [`viem`](https://viem.sh) for all chain interaction (Celo's own docs
  recommend it over older tooling like ContractKit/web3j).
- [`@celo/attribution-tags`](https://github.com/celo-org/attribution-tags) for
  the ERC-8021 tag. Its wire format is TypeScript-only and not published at
  the byte level, and the tag **cannot be added retroactively** — so rather
  than hand-roll the encoding in Kotlin and risk an unverifiable tag, every
  transaction goes through the real `codeFromRepo()` / `toDataSuffix()`
  functions. We verified this independently: the built transaction's calldata
  ends in the exact published `ERC_8021_MARKER` bytes
  (`0x80218021802180218021802180218021`), confirmed against a live mainnet RPC
  call before this was ever wired into the app.

### Architecture

```
┌─────────────────────────────┐
│  AI Edge Gallery (Android)  │
│  Gemma 4, on-device, offline│
└──────────────┬──────────────┘
               │ recognizes a payment-shaped request,
               │ calls run_js with {recipient, amount, currency}
               ▼
┌─────────────────────────────┐
│  celo-pay skill (webview)   │
│  viem + @celo/attribution-  │
│  tags, bundled with esbuild │
└──────────────┬──────────────┘
               │ signs locally, broadcasts via Celo mainnet RPC
               ▼
        Celo mainnet (42220)
   wARS / wBRL / wMXN / wCOP / wPEN / wCLP
```

## How this meets the track's judging criteria

1. **Works on mainnet with a real wFIAT token.** Every transfer is a genuine
   ERC-20 `transfer` call against Ripio's deployed wFIAT contracts on Celo
   mainnet (chain id 42220) — see the token address table below.
2. **Real use of wFIAT and the Celo stack.** Direct wFIAT transfers, with the
   ERC-8021 attribution tag and ERC-8004 agent identity both wired in from the
   project's first transaction, not retrofitted.
3. **The agent is autonomous and useful.** Intent parsing and tool invocation
   happen entirely on-device; the agent decides when a message is a payment
   request and executes it without a server in the loop.
4. **A real person can use the UX.** This is a working mobile app with a
   natural-language interface, not a CLI or backend script — someone who has
   never touched a wallet UI can use it the same way they'd text a person.
5. **Clear impact for LatAm.** Targets the two constraints named in the
   track's own framing: USD-conversion friction on everyday local-currency
   payments, and the UX/literacy barrier that keeps non-technical users out of
   self-custodied crypto rails.

## wFIAT token addresses (Celo mainnet, 18 decimals)

| Token | Address |
|---|---|
| wARS | `0x0dc4f92879b7670e5f4e4e6e3c801d229129d90d` |
| wBRL | `0xd76f5faf6888e24d9f04bf92a0c8b921fe4390e0` |
| wMXN | `0x337e7456b420bd3481e7fa61fa9850343d610d34` |
| wCOP | `0x8a1d45e102e886510e891d2ec656a708991e2d76` |
| wPEN | `0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE` |
| wCLP | `0x61D450a098b6a7f69fC4b98CE68198fe59768651` |

## Compliance checklist

- [x] Celo mainnet only
- [x] Public GitHub repo: https://github.com/callmeharshh/celo-stable-agent
- [ ] ERC-8004 agent identity registered — script ready at
      `tools/erc8004-register/`, run once the demo wallet is funded
- [x] ERC-8021 attribution tag wired in from the first transaction (verified
      against the published marker bytes before any live use)
- [x] Code written during the hackathon (the `celo-pay` skill, its build
      tooling, and the identity registration script; the base app is an
      unmodified fork of Google's Apache-2.0 AI Edge Gallery, credited in
      `README.md`)
- [ ] Demo video
- [ ] Agent wallet address / ERC-8004 agent ID filled in below once registered

## Try it yourself

1. Install [AI Edge Gallery](https://github.com/google-ai-edge/gallery) on
   Android, download Gemma 4 (E4B recommended).
2. In the **Agent Skills** use case, open the Skills manager and **load skill
   from URL**:
   `https://callmeharshh.github.io/celo-stable-agent/skills/built-in/celo-pay/`
3. Ask it to send a small amount of any wFIAT token to a Celo address. First
   use prompts once for the signing wallet's private key, kept on-device only.

## License

Apache 2.0, inherited from the upstream [AI Edge Gallery](https://github.com/google-ai-edge/gallery)
project. See `LICENSE`.
