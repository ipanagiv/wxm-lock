import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { LockClosedIcon, LockOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface LockEntry {
  amount: ethers.BigNumber;
  lockTime: ethers.BigNumber;
  unlockRequestTime: ethers.BigNumber;
}

const TokenLocking: React.FC = () => {
  const { account, contract, isConnected } = useWeb3();
  const [amount, setAmount] = useState<string>('');
  const [locks, setLocks] = useState<LockEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [wxmToken, setWxmToken] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const getWxmToken = async () => {
      if (!contract) return;
      try {
        const tokenAddress = await contract.wxmToken();
        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)",
            "function symbol() view returns (string)",
            "function approve(address spender, uint256 amount) returns (bool)"
          ],
          contract.signer
        );
        setWxmToken(tokenContract);
      } catch (err) {
        console.error('Error getting WXM token:', err);
      }
    };

    getWxmToken();
  }, [contract]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!wxmToken || !account) return;
      try {
        const balance = await wxmToken.balanceOf(account);
        const decimals = await wxmToken.decimals();
        setBalance(ethers.utils.formatUnits(balance, decimals));
      } catch (err) {
        console.error('Error fetching balance:', err);
      }
    };

    fetchBalance();
  }, [wxmToken, account]);

  const fetchLocks = async () => {
    if (!contract || !account) return;
    try {
      const locksCount = await contract.getLocksCount(account);
      const locksArray: LockEntry[] = [];
      
      for (let i = 0; i < locksCount.toNumber(); i++) {
        const lock = await contract.getLock(account, i);
        locksArray.push(lock);
      }
      
      setLocks(locksArray);
    } catch (err) {
      console.error('Error fetching locks:', err);
      setError('Failed to fetch locks');
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchLocks();
    }
  }, [isConnected, account]);

  const handleLockTokens = async () => {
    if (!contract || !amount || !wxmToken) return;
    try {
      setLoading(true);
      setError(null);

      // First, approve the contract to spend tokens
      const amountToLock = ethers.utils.parseEther(amount);
      const approvalTx = await wxmToken.approve(contract.address, amountToLock);
      await approvalTx.wait();

      // Then lock the tokens
      const lockTx = await contract.lockTokens(amountToLock);
      await lockTx.wait();
      
      setAmount('');
      await fetchLocks();
      // Refresh balance after locking
      if (wxmToken && account) {
        const balance = await wxmToken.balanceOf(account);
        const decimals = await wxmToken.decimals();
        setBalance(ethers.utils.formatUnits(balance, decimals));
      }
    } catch (err: any) {
      console.error('Error locking tokens:', err);
      setError(err.message || 'Failed to lock tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUnlock = async (lockIndex: number) => {
    if (!contract) return;
    try {
      setLoading(true);
      setError(null);
      const tx = await contract.requestUnlock(lockIndex);
      await tx.wait();
      await fetchLocks();
    } catch (err) {
      console.error('Error requesting unlock:', err);
      setError('Failed to request unlock');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockTokens = async (lockIndex: number) => {
    if (!contract) return;
    try {
      setLoading(true);
      setError(null);
      const tx = await contract.unlockTokens(lockIndex);
      await tx.wait();
      await fetchLocks();
      // Refresh balance after unlocking
      if (wxmToken && account) {
        const balance = await wxmToken.balanceOf(account);
        const decimals = await wxmToken.decimals();
        setBalance(ethers.utils.formatUnits(balance, decimals));
      }
    } catch (err) {
      console.error('Error unlocking tokens:', err);
      setError('Failed to unlock tokens');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🌐 Governance Power Through Token Locking</h2>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">WeatherXM Association DAO Voting Framework</h3>
            
            <p className="text-gray-600 mb-6">
              The WeatherXM Association enables decentralized governance by granting Voting Power (VP) to members who lock WXM tokens. 
              The more tokens you commit, the more influence you gain.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">🔒 Lock WXM Tokens → Get Voting Power</h4>
              <ul className="list-disc list-inside text-blue-700 space-y-2">
                <li>20 WXM = 1 Voting Power (VP)</li>
                <li>Tokens must be locked to gain VP. Locked tokens are non-transferable but grant enhanced voting rights.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📊 Token-Based Multiplier Tiers</h4>
              <p className="text-gray-600 mb-4">
                To incentivize deeper commitment, Voting Power increases with larger token lock amounts through a progressive multiplier system:
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Tokens Locked</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Base VP</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Multiplier</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Effective VP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-600">100 – 999 WXM</td>
                      <td className="px-4 py-2 text-sm text-gray-600">5–49.95 VP</td>
                      <td className="px-4 py-2 text-sm text-gray-600">1.0x</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Same as base</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-600">1,000 – 4,999 WXM</td>
                      <td className="px-4 py-2 text-sm text-gray-600">50–249.95 VP</td>
                      <td className="px-4 py-2 text-sm text-gray-600">1.1x</td>
                      <td className="px-4 py-2 text-sm text-gray-600">+10% bonus</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-600">5,000 – 9,999 WXM</td>
                      <td className="px-4 py-2 text-sm text-gray-600">250–499.95 VP</td>
                      <td className="px-4 py-2 text-sm text-gray-600">1.25x</td>
                      <td className="px-4 py-2 text-sm text-gray-600">+25% bonus</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-600">10,000+ WXM</td>
                      <td className="px-4 py-2 text-sm text-gray-600">500+ VP</td>
                      <td className="px-4 py-2 text-sm text-gray-600">1.5x</td>
                      <td className="px-4 py-2 text-sm text-gray-600">+50% bonus</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">📈 Voting Power Infographic</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">100 WXM</span>
                      <span className="text-sm font-medium text-gray-600">10,000+ WXM</span>
                    </div>
                    <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                      <div className="absolute inset-0 flex">
                        <div className="w-1/4 bg-blue-200"></div>
                        <div className="w-1/4 bg-blue-300"></div>
                        <div className="w-1/4 bg-blue-400"></div>
                        <div className="w-1/4 bg-blue-500"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex space-x-4">
                          <span className="text-xs font-medium text-gray-700">1.0x</span>
                          <span className="text-xs font-medium text-gray-700">1.1x</span>
                          <span className="text-xs font-medium text-gray-700">1.25x</span>
                          <span className="text-xs font-medium text-gray-700">1.5x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Small Lock</h5>
                      <p className="text-sm text-blue-600">100-999 WXM</p>
                      <p className="text-sm text-blue-600">Base VP (1.0x)</p>
                    </div>
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Medium Lock</h5>
                      <p className="text-sm text-blue-600">1,000-4,999 WXM</p>
                      <p className="text-sm text-blue-600">+10% VP (1.1x)</p>
                    </div>
                    <div className="bg-blue-200 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Large Lock</h5>
                      <p className="text-sm text-blue-600">5,000-9,999 WXM</p>
                      <p className="text-sm text-blue-600">+25% VP (1.25x)</p>
                    </div>
                    <div className="bg-blue-300 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Mega Lock</h5>
                      <p className="text-sm text-blue-600">10,000+ WXM</p>
                      <p className="text-sm text-blue-600">+50% VP (1.5x)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-800 mb-2">📝 Examples</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-green-700 font-medium">Alice locks 1,000 WXM</p>
                  <ul className="list-disc list-inside text-green-600 ml-4">
                    <li>Base VP = 50</li>
                    <li>Multiplier = 1.1x</li>
                    <li>Effective VP = 55</li>
                  </ul>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Bob locks 10,000 WXM</p>
                  <ul className="list-disc list-inside text-green-600 ml-4">
                    <li>Base VP = 500</li>
                    <li>Multiplier = 1.5x</li>
                    <li>Effective VP = 750</li>
                  </ul>
                </div>
              </div>
              <p className="text-green-700 mt-4">
                This system ensures that those who commit more WXM to the DAO gain proportionally more voting influence, 
                making the protocol more robust and aligned with its most active supporters.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Please connect your wallet</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Lock WXM Tokens</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">Available Balance:</p>
            <p className="text-2xl font-bold text-gray-900">{balance} WXM</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to lock"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleLockTokens}
              disabled={loading || !amount}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <LockClosedIcon className="h-5 w-5 mr-2" />
              )}
              Lock Tokens
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Locks</h3>
            <div className="space-y-4">
              {locks.map((lock, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">
                        Amount: {ethers.utils.formatEther(lock.amount)} WXM
                      </p>
                      <p className="text-gray-600">
                        Locked: {new Date(lock.lockTime.toNumber() * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {lock.unlockRequestTime.isZero() ? (
                        <button
                          onClick={() => handleRequestUnlock(index)}
                          disabled={loading}
                          className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Request Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnlockTokens(index)}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <LockOpenIcon className="h-5 w-5 mr-2" />
                          Unlock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {locks.length === 0 && (
                <p className="text-gray-500 text-center py-4">No locks found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenLocking; 