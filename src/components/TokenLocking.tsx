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
            "function symbol() view returns (string)"
          ],
          contract.provider
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
    if (!contract || !amount) return;
    try {
      setLoading(true);
      setError(null);
      const tx = await contract.lockTokens(ethers.utils.parseEther(amount));
      await tx.wait();
      setAmount('');
      await fetchLocks();
      // Refresh balance after locking
      if (wxmToken && account) {
        const balance = await wxmToken.balanceOf(account);
        const decimals = await wxmToken.decimals();
        setBalance(ethers.utils.formatUnits(balance, decimals));
      }
    } catch (err) {
      console.error('Error locking tokens:', err);
      setError('Failed to lock tokens');
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please connect your wallet</h2>
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