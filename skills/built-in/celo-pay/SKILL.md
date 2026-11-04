---
name: celo-pay
description: Send a payment in a LatAm local-currency stablecoin (wARS, wBRL, wMXN, wCOP, wPEN, wCLP) on Celo mainnet.
metadata:
  require-secret: true
  require-secret-description: Enter your Celo wallet's private key (0x...). It never leaves this device or touches any server.
  homepage: https://github.com/callmeharshh/celo-stable-agent
---

# Celo Pay

Send a real on-chain payment in one of Ripio's local-currency stablecoins on Celo
mainnet: Argentine pesos (wARS), Brazilian reais (wBRL), Mexican pesos (wMXN),
Colombian pesos (wCOP), Peruvian soles (wPEN), or Chilean pesos (wCLP).

## Examples

* "Send 20000 to 0xabc... for rent in reais"
* "Pay 0x123... 500 Argentine pesos"
* "Transfer 1500 soles to 0xdef..."
* "Send 300 wCOP to 0x456..."

## Currency terms to recognize

Map the user's words to the exact currency code before calling the tool:

| User says (es/pt/en) | currency code |
|---|---|
| pesos argentinos, pesos, ARS, Argentine pesos | `wars` |
| reais, real, BRL, Brazilian reais | `wbrl` |
| pesos mexicanos, MXN, Mexican pesos | `wmxn` |
| pesos colombianos, COP, Colombian pesos | `wcop` |
| soles, PEN, Peruvian soles | `wpen` |
| pesos chilenos, CLP, Chilean pesos | `wclp` |

If the user doesn't specify a currency and it can't be inferred from context, ask
them which one before calling the tool. Never guess the recipient address — it
must be an explicit `0x...` address from the user's message.

## Instructions

Call the `run_js` tool with the following exact parameters:

- script name: `index.html`
- data: A JSON string with the following fields:
  - recipient: The recipient's Celo wallet address. String, must start with `0x`.
  - amount: The amount to send, in the stablecoin's own units (not wei). Number or numeric string.
  - currency: One of `wars`, `wbrl`, `wmxn`, `wcop`, `wpen`, `wclp` (see table above).

The tool signs and broadcasts the transaction on Celo mainnet and returns a
transaction hash and explorer link, or an error if the payment failed (for
example insufficient balance). Relay that result back to the user clearly,
including the explorer link on success.
