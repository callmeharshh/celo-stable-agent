// One-time ERC-8004 identity registration for the Celo Stable Agent wallet.
//
// Usage:
//   PRIVATE_KEY=0x... AGENT_URI=https://callmeharshh.github.io/celo-stable-agent/public/agent.json npm run register
//
// Mints the agent's identity NFT on Celo mainnet's Identity Registry, pointing
// at the hosted agent.json metadata file. Run this once, before the
// submission deadline, with the same wallet the celo-pay skill signs with.
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432";

const abi = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [{ name: "agentURI", type: "string" }],
    outputs: [{ name: "agentId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Registered",
    inputs: [
      { name: "agentId", type: "uint256", indexed: true },
      { name: "agentURI", type: "string" },
      { name: "owner", type: "address", indexed: true },
    ],
  },
];

async function main() {
  const privateKey = process.env.PRIVATE_KEY;
  const agentURI =
    process.env.AGENT_URI ||
    "https://callmeharshh.github.io/celo-stable-agent/public/agent.json";

  if (!privateKey) {
    throw new Error("Set PRIVATE_KEY (0x...) in the environment before running this.");
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({ chain: celo, transport: http() });
  const walletClient = createWalletClient({ account, chain: celo, transport: http() });

  console.log(`Registering agent for ${account.address}`);
  console.log(`Agent URI: ${agentURI}`);

  const balance = await publicClient.getBalance({ address: account.address });
  if (balance === 0n) {
    throw new Error(
      `Wallet ${account.address} has 0 CELO. Fund it with a small amount of native CELO for gas first.`
    );
  }

  const { request } = await publicClient.simulateContract({
    account,
    address: REGISTRY,
    abi,
    functionName: "register",
    args: [agentURI],
  });

  const hash = await walletClient.writeContract(request);
  console.log(`Submitted: https://celoscan.io/tx/${hash}`);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const [event] = parseEventLogs({ abi, eventName: "Registered", logs: receipt.logs });

  console.log(`Registered! agentId = ${event.args.agentId.toString()}`);
  console.log(
    `Next: add a "registrations" block to public/agent.json with this agentId and ` +
      `"agentRegistry": "eip155:42220:${REGISTRY}", then commit + push.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
