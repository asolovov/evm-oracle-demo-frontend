/**
 * Minimal ABI for `PriceAggregator`, covering only what the dashboard needs to
 * build and trace a price request. Derived from the deployed ABI in the
 * contracts repo (`deployments/ethereum-sepolia/abis/PriceAggregator.json`).
 *
 * - `requestPrice()` — payable, no args; the consumer-facing trigger.
 * - `requestFee()`   — view; the wei amount `requestPrice` requires as msg.value.
 * - `PriceRequested` — emitted with the indexed reqId we read from the receipt.
 */
export const priceAggregatorAbi = [
  {
    type: "function",
    name: "requestPrice",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "reqId", type: "uint256" }],
  },
  {
    type: "function",
    name: "requestFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "PriceRequested",
    inputs: [
      { name: "reqId", type: "uint256", indexed: true },
      { name: "requester", type: "address", indexed: true },
    ],
  },
] as const;
