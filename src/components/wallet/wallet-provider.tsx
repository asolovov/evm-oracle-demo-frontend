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
import { createWalletClient, custom, isAddress, isHex } from "viem";
import { CHAIN } from "@/config/chain";
import { getInjectedProvider, viemChain } from "@/lib/wallet/injected";

export type SendTxInput = { to: string; data: string; value: string };

export type ConnectResult = { address: string | null; chainId: number | null };

/**
 * Remembers a manual disconnect so we don't silently auto-reconnect on reload
 * (EIP-1193 has no real "disconnect" — this is a UI-level session flag).
 */
const DISCONNECT_KEY = "lh-wallet-disconnected";

function isManuallyDisconnected(): boolean {
  return typeof window !== "undefined" && localStorage.getItem(DISCONNECT_KEY) === "1";
}

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
  /** Connects and resolves to the connected address + chain id (nulls on failure/decline). */
  connect: () => Promise<ConnectResult>;
  /** Switches to the target chain and resolves to whether we ended up on it. */
  switchToTargetChain: () => Promise<boolean>;
  /** Forgets the connected account (UI-level disconnect; sticky across reload). */
  disconnect: () => void;
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

    // Restore any already-authorized session without prompting — unless the user
    // manually disconnected (then wait for an explicit reconnect).
    void (async () => {
      if (isManuallyDisconnected()) return;
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
      const accounts: unknown[] = Array.isArray(args[0]) ? args[0] : [];
      const first = accounts[0];
      setAddress(typeof first === "string" ? first : null);
    };
    const onChain = (...args: unknown[]) => {
      const hex = args[0];
      setChainId(typeof hex === "string" ? Number.parseInt(hex, 16) : null);
    };
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);

    return () => {
      cancelled = true;
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    const provider = getInjectedProvider();
    if (!provider) {
      setError("No EVM wallet detected. Install MetaMask or a compatible wallet.");
      return { address: null, chainId: null };
    }
    setConnecting(true);
    setError(null);
    try {
      const client = createWalletClient({ transport: custom(provider) });
      const accounts = await client.requestAddresses();
      const id = await client.getChainId();
      const account = accounts[0] ?? null;
      if (typeof window !== "undefined") localStorage.removeItem(DISCONNECT_KEY);
      setAddress(account);
      setChainId(id);
      return { address: account, chainId: id };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed.");
      return { address: null, chainId: null };
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

  const disconnect = useCallback(() => {
    // EIP-1193 has no real disconnect; forget the account locally and remember
    // the choice so we don't auto-reconnect on the next load.
    if (typeof window !== "undefined") localStorage.setItem(DISCONNECT_KEY, "1");
    setAddress(null);
    setError(null);
  }, []);

  const sendTransaction = useCallback(
    async (tx: SendTxInput) => {
      const provider = getInjectedProvider();
      if (!provider) throw new Error("No wallet available.");
      if (!address || !isAddress(address)) throw new Error("Connect a wallet first.");
      if (!isAddress(tx.to)) throw new Error("Invalid transaction target address.");
      if (!isHex(tx.data)) throw new Error("Invalid transaction calldata.");
      const client = createWalletClient({ account: address, transport: custom(provider) });
      return client.sendTransaction({
        account: address,
        chain: viemChain,
        to: tx.to,
        data: tx.data,
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
      disconnect,
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
      disconnect,
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
