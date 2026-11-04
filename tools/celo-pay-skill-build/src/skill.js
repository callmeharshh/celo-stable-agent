/*
 * Celo Stable Agent — celo-pay skill logic.
 *
 * Runs inside the AI Edge Gallery app's hidden webview (see
 * skills/built-in/celo-pay/scripts/index.html). Receives a structured
 * payment request from the on-device model, builds and signs a wFIAT ERC-20
 * transfer on Celo mainnet tagged with the project's ERC-8021 attribution
 * code, and returns the result.
 */
import {
  concat,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  isAddress,
  parseAbi,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { codeFromRepo, toDataSuffix } from "@celo/attribution-tags";

// Celo mainnet wFIAT token addresses (18 decimals). Same on every EVM chain
// Ripio deploys to; Celo is the one this track targets.
const TOKENS = {
  wars: "0x0dc4f92879b7670e5f4e4e6e3c801d229129d90d",
  wbrl: "0xd76f5faf6888e24d9f04bf92a0c8b921fe4390e0",
  wmxn: "0x337e7456b420bd3481e7fa61fa9850343d610d34",
  wcop: "0x8a1d45e102e886510e891d2ec656a708991e2d76",
  wpen: "0x4F34c8b3b5FB6D98Da888F0feA543d4d9C9F2eBE",
  wclp: "0x61D450a098b6a7f69fC4b98CE68198fe59768651",
};

const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
]);

// Derived once from this project's GitHub repo, per the official SDK helper
// (see https://github.com/celo-org/attribution-tags). Not hand-computed.
const ATTRIBUTION_CODE = codeFromRepo("callmeharshh/celo-stable-agent");

function resolveToken(currency) {
  const key = String(currency || "").trim().toLowerCase();
  const address = TOKENS[key];
  if (!address) {
    const supported = Object.keys(TOKENS).join(", ");
    throw new Error(`Unsupported currency "${currency}". Supported: ${supported}`);
  }
  return { key, address };
}

function normalizePrivateKey(secret) {
  if (!secret) {
    throw new Error("Missing wallet private key. Add it when prompted for the skill secret.");
  }
  const trimmed = secret.trim();
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

async function sendCeloPayment({ recipient, amount, currency }, secret) {
  if (!isAddress(recipient)) {
    throw new Error(`"${recipient}" is not a valid Celo address.`);
  }
  const amountNumber = Number(amount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    throw new Error(`"${amount}" is not a valid positive amount.`);
  }

  const { key: tokenKey, address: tokenAddress } = resolveToken(currency);
  const account = privateKeyToAccount(normalizePrivateKey(secret));

  const wallet = createWalletClient({ account, chain: celo, transport: http() });
  const publicClient = createPublicClient({ chain: celo, transport: http() });

  const callData = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [recipient, parseUnits(amountNumber.toString(), 18)],
  });
  const taggedData = concat([callData, toDataSuffix(ATTRIBUTION_CODE)]);

  const hash = await wallet.sendTransaction({ to: tokenAddress, data: taggedData });
  await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    explorerUrl: `https://celoscan.io/tx/${hash}`,
    from: account.address,
    to: recipient,
    amount: amountNumber,
    currency: tokenKey.toUpperCase(),
  };
}

window["ai_edge_gallery_get_result"] = async (data, secret) => {
  try {
    const parsed = JSON.parse(data);
    const payment = await sendCeloPayment(parsed, secret);
    return JSON.stringify({
      result:
        `Sent ${payment.amount} ${payment.currency} to ${payment.to}.\n` +
        `Transaction: ${payment.explorerUrl}`,
    });
  } catch (e) {
    console.error(e);
    return JSON.stringify({ error: `Payment failed: ${e.message || e}` });
  }
};
