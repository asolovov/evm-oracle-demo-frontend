/**
 * Read-only slice of the `PriceAggregator` ABI (Chainlink `AggregatorV3Interface`
 * + custom getters). Kept separate from `price-aggregator.ts` (which carries the
 * write path: `requestPrice`). All entries verified present in the deployed ABI
 * (`deployments/ethereum-sepolia/abis/PriceAggregator.json`).
 */
const roundDataOutputs = [
  { name: "roundId", type: "uint80" },
  { name: "answer", type: "int256" },
  { name: "startedAt", type: "uint256" },
  { name: "updatedAt", type: "uint256" },
  { name: "answeredInRound", type: "uint80" },
] as const;

export const priceAggregatorReadsAbi = [
  {
    type: "function",
    name: "latestRoundData",
    stateMutability: "view",
    inputs: [],
    outputs: roundDataOutputs,
  },
  {
    type: "function",
    name: "getRoundData",
    stateMutability: "view",
    inputs: [{ name: "_roundId", type: "uint80" }],
    outputs: roundDataOutputs,
  },
  {
    type: "function",
    name: "latestRoundId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint80" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }],
  },
  {
    type: "function",
    name: "description",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }],
  },
  {
    type: "function",
    name: "version",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "nextReqId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "requestFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "maxAge",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
