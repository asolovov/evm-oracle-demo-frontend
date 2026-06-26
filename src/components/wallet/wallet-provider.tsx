"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createWalletClient, custom } from "viem";
import { CHAIN } from "@/config/chain";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

export type SendTxInput = { to: string; data: string; value: string };

export type WalletState = {
  /** True once we've checked for an injected wallet on the client. */
  ready: boolean;
  /** An EIP-1193 wallet is present in the browser. */
  hasWallet: boolean;
  /** Checksummed connected account, or null. */
  address: string | null;
  /** Currently selected chain id, or null. */
  chainId: number | null;
  /** Account is connected and on the configured target chain. */
  onTargetChain: boolean;
  connecting: boolean;
  error: string | null;
  /** Connects and resolves to the connected address (or null on failure/decline). */
  connect: () => Promise<string | null>;
  /** Switches to the target chain and resolves to whether we ended up on it. */
  switchToTargetChain: () => Promise<boolean>;
  /** Sends a prebuilt transaction and resolves to the tx hash. */
  sendTransaction: (tx: SendTxInput) => Promise<string>;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provider = getInjectedProvider();
    // Detecting the injected wallet is a browser-only read done after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasWallet(provider !== null);
    setReady(true);
    if (!provider) return;

    const client = createWalletClient({ transport: custom(provider) });
    let cancelled = false;

    // Restore any already-authorized session without prompting.
    void (async () => {
      try {
        const [accounts, id] = await Promise.all([client.getAddresses(), client.getChainId()]);
        if (cancelled) return;
        setAddress(accounts[0] ?? null);
        setChainId(id);
      } catch {
        // Wallet present but unreadable — leave disconnected.
      }
    })();

    const onAccounts = (...args: unknown[]) => {
      const accounts = (args[0] as string[] | undefined) ?? [];
      setAddress(accounts[0] ?? null);
    };
    const onChain = (...args: unknown[]) => {
      const hex = args[0] as string | undefined;
      setChainId(hex ? Number.parseInt(hex, 16) : null);
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);

    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async (): Promise<string | null> => {
    const provider = getInjectedProvider();
    if (!provider) {
      setError("No EVM wallet detected. Install MetaMask or a compatible wallet.");
      return null;
    }
    setConnecting(true);
    setError(null);
    try {
      const client = createWalletClient({ transport: custom(provider) });
      const accounts = await client.requestAddresses();
      const id = await client.getChainId();
      const account = accounts[0] ?? null;
      setAddress(account);
      setChainId(id);
      return account;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
      return null;
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToTargetChain = useCallback(async (): Promise<boolean> => {
    const provider = getInjectedProvider();
    if (!provider) return false;
    setError(null);
    const client = createWalletClient({ transport: custom(provider) });
    try {
      await client.switchChain({ id: CHAIN.id });
    } catch {
      // Chain not added to the wallet yet — add it, then it becomes current.
      try {
        await client.addChain({ chain: viemChain });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not switch network.");
        return false;
      }
    }
    try {
      const id = await client.getChainId();
      setChainId(id);
      return id === CHAIN.id;
    } catch {
      return false;
    }
  }, []);

  const sendTransaction = useCallback(
    async (tx: SendTxInput) => {
      const provider = getInjectedProvider();
      if (!provider) throw new Error("No wallet available.");
      if (!address) throw new Error("Connect a wallet first.");
      const client = createWalletClient({
        account: address as `0x${string}`,
        transport: custom(provider),
      });
      return client.sendTransaction({
        account: address as `0x${string}`,
        chain: viemChain,
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: BigInt(tx.value || "0"),
      });
    },
    [address],
  );

  const value = useMemo<WalletState>(
    () => ({
      ready,
      hasWallet,
      address,
      chainId,
      onTargetChain: address !== null && chainId === CHAIN.id,
      connecting,
      error,
      connect,
      switchToTargetChain,
      sendTransaction,
    }),
    [
      ready,
      hasWallet,
      address,
      chainId,
      connecting,
      error,
      connect,
      switchToTargetChain,
      sendTransaction,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within <WalletProvider>");
  return ctx;
}
