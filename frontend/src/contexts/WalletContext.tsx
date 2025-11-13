import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { getNetworkName } from '../utils/network';

interface WalletState {
  provider?: ethers.BrowserProvider;
  signer?: ethers.Signer;
  address?: string;
  chainId?: number;
  networkName?: string;
  balanceWei?: bigint;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  isMetaMaskAvailable: boolean;
  loading: boolean;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const [address, setAddress] = useState<string>();
  const [chainId, setChainId] = useState<number>();
  const [networkName, setNetworkName] = useState<string>();
  const [balanceWei, setBalanceWei] = useState<bigint>();
  const [loading, setLoading] = useState(false);

  const isMetaMaskAvailable = typeof window !== 'undefined' && !!(window as any).ethereum;

  const refreshBalance = useCallback(async () => {
    if (!provider || !address) return;
    try {
      const bal = await provider.getBalance(address);
      setBalanceWei(bal);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [provider, address]);

  const hydrate = useCallback(async (prov: ethers.BrowserProvider) => {
    try {
      const network = await prov.getNetwork();
      const cid = Number(network.chainId);
      setChainId(cid);
      setNetworkName(getNetworkName(cid));
      
      const accs = await prov.send('eth_accounts', []);
      if (accs?.[0]) {
        const addr = ethers.getAddress(accs[0]);
        setAddress(addr);
        const s = await prov.getSigner();
        setSigner(s);
        const bal = await prov.getBalance(addr);
        setBalanceWei(bal);
      } else {
        setAddress(undefined);
        setSigner(undefined);
      }
    } catch (error) {
      console.error('Hydration error:', error);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!isMetaMaskAvailable) return;
    setLoading(true);
    try {
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(prov);
      const accounts = await prov.send('eth_requestAccounts', []);
      const addr = ethers.getAddress(accounts[0]);
      setAddress(addr);
      const s = await prov.getSigner();
      setSigner(s);
      const net = await prov.getNetwork();
      const cid = Number(net.chainId);
      setChainId(cid);
      setNetworkName(getNetworkName(cid));
      const bal = await prov.getBalance(addr);
      setBalanceWei(bal);
    } catch (error) {
      console.error('Connect error:', error);
    } finally {
      setLoading(false);
    }
  }, [isMetaMaskAvailable]);

  const disconnect = useCallback(() => {
    setSigner(undefined);
    setAddress(undefined);
    setBalanceWei(undefined);
  }, []);

  useEffect(() => {
    if (!isMetaMaskAvailable) return;
    
    const prov = new ethers.BrowserProvider((window as any).ethereum);
    setProvider(prov);
    hydrate(prov);
    
    const eth = (window as any).ethereum;
    const onAccounts = (accs: string[]) => {
      if (accs?.[0]) {
        setAddress(ethers.getAddress(accs[0]));
        hydrate(prov);
      } else {
        disconnect();
      }
    };
    const onChain = () => {
      window.location.reload();
    };
    
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);
    
    return () => {
      eth.removeListener('accountsChanged', onAccounts);
      eth.removeListener('chainChanged', onChain);
    };
  }, [isMetaMaskAvailable, hydrate, disconnect]);

  const value = useMemo(() => ({
    provider, signer, address, chainId, networkName, balanceWei, 
    connect, disconnect, refreshBalance, isMetaMaskAvailable, loading
  }), [provider, signer, address, chainId, networkName, balanceWei, connect, disconnect, refreshBalance, isMetaMaskAvailable, loading]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
