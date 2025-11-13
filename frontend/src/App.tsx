import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Toaster, toast } from 'react-hot-toast';
import { formatAddress, formatEther, formatTimestamp, bpToPercent, parseEtherSafe } from './utils/format';
import { parseEthersError } from './utils/errors';
import UniBankABI from './abi/UniBank.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider>();
  const [signer, setSigner] = useState<ethers.Signer>();
  const [address, setAddress] = useState<string>();
  const [balance, setBalance] = useState<bigint>();
  const [contractAddr, setContractAddr] = useState<string>(() => localStorage.getItem('unibank:contractAddress') || '');
  const [contract, setContract] = useState<any>();
  const [bankActive, setBankActive] = useState(false);
  const [interestRate, setInterestRate] = useState<bigint>(0n);
  const [reserves, setReserves] = useState<bigint>(0n);
  const [role, setRole] = useState<'OWNER' | 'ADMIN' | 'USER' | 'NONE'>('NONE');
  const [tab, setTab] = useState<'overview' | 'deposit' | 'admin'>('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const isMetaMask = typeof window !== 'undefined' && !!window.ethereum;

  const connectWallet = async () => {
    if (!isMetaMask) {
      toast.error('MetaMask not detected');
      return;
    }
    setLoading(true);
    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      const accounts = await prov.send('eth_requestAccounts', []);
      const addr = ethers.getAddress(accounts[0]);
      const sig = await prov.getSigner();
      const bal = await prov.getBalance(addr);
      
      setProvider(prov);
      setSigner(sig);
      setAddress(addr);
      setBalance(bal);
      toast.success('Wallet connected');
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const saveContractAddress = () => {
    if (!ethers.isAddress(contractAddr)) {
      toast.error('Invalid address');
      return;
    }
    localStorage.setItem('unibank:contractAddress', contractAddr);
    if (provider) {
      const c = new ethers.Contract(contractAddr, (UniBankABI as any).abi, provider);
      setContract(c);
      toast.success('Contract address set');
      loadBankData(c);
    }
  };

  const loadBankData = async (c?: ethers.Contract) => {
    const ct = c || contract;
    if (!ct || !address) return;
    
    try {
      const [active, rate, res, own] = await Promise.all([
        ct.active().catch(() => false),
        ct.interestRatePerMinuteBP().catch(() => 0n),
        ct.totalReserves().catch(() => 0n),
        ct.owner().catch(() => ''),
      ]);
      
      setBankActive(active);
      setInterestRate(rate);
      setReserves(res);

      if (address.toLowerCase() === own.toLowerCase()) {
        setRole('OWNER');
      } else {
        const isAdmin = await ct.admins(address).catch(() => false);
        if (isAdmin) {
          setRole('ADMIN');
        } else {
          const isAuth = await ct.authorizedUsers(address).catch(() => false);
          setRole(isAuth ? 'USER' : 'NONE');
        }
      }

      loadDeposits(ct);
    } catch (error) {
      console.error('Load bank data error:', error);
    }
  };

  const loadDeposits = async (c?: ethers.Contract) => {
    const ct = c || contract;
    if (!ct || !address) return;
    
    try {
      const count = await ct.getUserDepositsCount(address);
      const deps = [];
      for (let i = 0; i < Number(count); i++) {
        const [amount, timestamp, rateBP, , withdrawn] = await ct.getDeposit(address, i);
        deps.push({ index: i, amount, timestamp, rateBP, withdrawn });
      }
      setDeposits(deps);
    } catch (error) {
      console.error('Load deposits error:', error);
    }
  };

  const handleDeposit = async () => {
    if (!contract || !signer || !depositAmount) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const value = parseEtherSafe(depositAmount);
      const tx = await contractWithSigner.deposit({ value });
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('Deposit successful!');
      setDepositAmount('');
      loadBankData();
      loadDeposits();
      if (provider && address) {
        const bal = await provider.getBalance(address);
        setBalance(bal);
      }
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (depositIndex: number) => {
    if (!contract || !signer) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.withdrawDeposit(depositIndex);
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('Withdrawal successful!');
      loadBankData();
      loadDeposits();
      if (provider && address) {
        const bal = await provider.getBalance(address);
        setBalance(bal);
      }
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleBank = async () => {
    if (!contract || !signer) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.setBankStatus(!bankActive);
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('Bank status updated!');
      loadBankData();
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const addReserves = async (amount: string) => {
    if (!contract || !signer || !amount) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const value = parseEtherSafe(amount);
      const tx = await contractWithSigner.addReserves({ value });
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('Reserves added!');
      loadBankData();
      if (provider && address) {
        const bal = await provider.getBalance(address);
        setBalance(bal);
      }
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const setRate = async (bp: string) => {
    if (!contract || !signer || !bp) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.setInterestRatePerMinuteBP(bp);
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('Interest rate updated!');
      loadBankData();
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userAddr: string) => {
    if (!contract || !signer || !userAddr || !ethers.isAddress(userAddr)) return;
    
    setLoading(true);
    try {
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.addAuthorizedUser(userAddr);
      toast.loading('Transaction submitted');
      await tx.wait();
      toast.success('User authorized!');
    } catch (error) {
      toast.error(parseEthersError(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMetaMask && provider && contract) {
      loadBankData();
    }
  }, [provider, contract, address]);

  useEffect(() => {
    if (!isMetaMask) return;
    
    const handleAccountsChanged = () => window.location.reload();
    const handleChainChanged = () => window.location.reload();
    
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMask]);

  if (!isMetaMask) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-white text-center">
          <h1 className="text-2xl font-bold mb-4">MetaMask Required</h1>
          <p className="mb-4">Please install MetaMask to use this dapp</p>
          <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" 
             className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-lg inline-block">
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-4">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">UniBank</h1>
            <p className="text-sm text-gray-300">Web3 Banking Dapp</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {address && (
              <>
                <div className="text-right">
                  <div className="text-sm text-gray-300">Balance</div>
                  <div className="font-mono">{formatEther(balance || 0n)} ETH</div>
                </div>
                <div className="bg-blue-500/20 px-4 py-2 rounded-lg">
                  <div className="text-xs text-gray-300">Role</div>
                  <div className="font-semibold">{role}</div>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-lg font-mono text-sm">
                  {formatAddress(address)}
                </div>
              </>
            )}
            {!address ? (
              <button onClick={connectWallet} disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                Connect Wallet
              </button>
            ) : (
              <button onClick={() => window.location.reload()}
                      className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg text-sm transition-colors">
                Disconnect
              </button>
            )}
          </div>
        </div>
      </div>

      {address && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            <h2 className="font-semibold mb-3">Contract Address</h2>
            <div className="flex gap-3 flex-wrap">
              <input 
                type="text"
                value={contractAddr}
                onChange={(e) => setContractAddr(e.target.value)}
                placeholder="0x..."
                className="flex-1 min-w-[300px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button onClick={saveContractAddress}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition-colors">
                Set Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {address && contract && (
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 mb-6 flex-wrap">
            <button onClick={() => setTab('overview')}
                    className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${tab === 'overview' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/7'}`}>
              Overview
            </button>
            <button onClick={() => setTab('deposit')}
                    className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${tab === 'deposit' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/7'}`}>
              Deposits
            </button>
            {(role === 'OWNER' || role === 'ADMIN') && (
              <button onClick={() => setTab('admin')}
                      className={`px-6 py-3 rounded-t-lg font-semibold transition-colors ${tab === 'admin' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/7'}`}>
                Admin
              </button>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
            {tab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="text-sm text-gray-300 mb-2">Bank Status</div>
                  <div className={`text-2xl font-bold ${bankActive ? 'text-green-400' : 'text-red-400'}`}>
                    {bankActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="text-sm text-gray-300 mb-2">Interest Rate</div>
                  <div className="text-2xl font-bold">{bpToPercent(interestRate)}</div>
                  <div className="text-xs text-gray-400">per minute</div>
                </div>
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="text-sm text-gray-300 mb-2">Reserves</div>
                  <div className="text-2xl font-bold">{formatEther(reserves)} ETH</div>
                </div>
              </div>
            )}

            {tab === 'deposit' && (
              <div className="space-y-6">
                {(role === 'USER' || role === 'ADMIN' || role === 'OWNER') && bankActive && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Make Deposit</h3>
                    <div className="flex gap-3 flex-wrap">
                      <input 
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Amount in ETH"
                        step="0.01"
                        className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button onClick={handleDeposit} disabled={loading || !depositAmount}
                              className="bg-green-600 hover:bg-green-700 px-8 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                        Deposit
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Current rate: {bpToPercent(interestRate)} per minute • 2-minute lock period
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-4">Your Deposits</h3>
                  {deposits.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      No deposits yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deposits.map((dep) => {
                        const now = Math.floor(Date.now() / 1000);
                        const matured = now >= Number(dep.timestamp) + 120;
                        return (
                          <div key={dep.index} className="bg-white/5 rounded-lg p-4 flex flex-wrap justify-between items-center gap-4">
                            <div className="flex-1">
                              <div className="font-mono text-lg">{formatEther(dep.amount)} ETH</div>
                              <div className="text-sm text-gray-400">
                                Rate: {bpToPercent(dep.rateBP)} • {formatTimestamp(dep.timestamp)}
                              </div>
                              <div className={`text-xs ${dep.withdrawn ? 'text-gray-500' : matured ? 'text-green-400' : 'text-yellow-400'}`}>
                                {dep.withdrawn ? 'Withdrawn' : matured ? 'Matured - Ready to withdraw' : 'Locked'}
                              </div>
                            </div>
                            {!dep.withdrawn && matured && (
                              <button onClick={() => handleWithdraw(dep.index)} disabled={loading}
                                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                                Withdraw
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'admin' && (role === 'OWNER' || role === 'ADMIN') && (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Bank Controls</h3>
                  <button onClick={toggleBank} disabled={loading}
                          className={`${bankActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors`}>
                    {bankActive ? 'Deactivate Bank' : 'Activate Bank'}
                  </button>
                </div>

                {role === 'OWNER' && (
                  <div className="bg-white/5 rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Add Reserves</h3>
                    <div className="flex gap-3 flex-wrap">
                      <input 
                        type="number"
                        id="reserves"
                        placeholder="Amount in ETH"
                        step="0.01"
                        className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button onClick={() => {
                        const val = (document.getElementById('reserves') as HTMLInputElement).value;
                        addReserves(val);
                      }} disabled={loading}
                              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Set Interest Rate</h3>
                  <div className="flex gap-3 flex-wrap">
                    <input 
                      type="number"
                      id="rate"
                      placeholder="Basis points (100 = 1%)"
                      className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button onClick={() => {
                      const val = (document.getElementById('rate') as HTMLInputElement).value;
                      setRate(val);
                    }} disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      Set Rate
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Enter basis points (100 BP = 1%, 200 BP = 2%)</p>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Authorize User</h3>
                  <div className="flex gap-3 flex-wrap">
                    <input 
                      type="text"
                      id="useraddr"
                      placeholder="User address (0x...)"
                      className="flex-1 min-w-[300px] bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button onClick={() => {
                      const val = (document.getElementById('useraddr') as HTMLInputElement).value;
                      addUser(val);
                    }} disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold disabled:opacity-50 transition-colors">
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
