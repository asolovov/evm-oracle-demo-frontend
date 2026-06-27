/**
 * Minimal read ABI for `ReporterSet.sol` — the live M-of-N reporter set.
 * Verified in `deployments/ethereum-sepolia/abis/ReporterSet.json`.
 */
export const reporterSetAbi = [
  {
    type: "function",
    name: "getReporters",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;
