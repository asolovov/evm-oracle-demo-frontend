/**
 * Multicall3 read used to batch native ETH balance lookups (reporter funding)
 * into a single call. `getEthBalance` is a Multicall3 helper, not an aggregate.
 */
export const multicall3Abi = [
  {
    type: "function",
    name: "getEthBalance",
    stateMutability: "view",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;
