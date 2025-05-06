import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { ClockIcon, ArrowTrendingUpIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';

interface Transaction {
  hash: string;
  type: 'lock' | 'unlock' | 'request';
  amount: ethers.BigNumber;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  duration?: number;
  lockTime?: number;
  unlockRequestTime?: number;
}

const TransactionHistory: React.FC = () => {
  const { account, contract } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tvl, setTvl] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTvl = async () => {
      if (!contract) return;
      try {
        const totalLocked = await contract.totalLocked();
        setTvl(ethers.utils.formatEther(totalLocked));
      } catch (err) {
        console.error('Error fetching TVL:', err);
      }
    };

    fetchTvl();
  }, [contract]);

  useEffect(() => {
    if (!contract || !account) return;

    const fetchHistoricalTransactions = async () => {
      try {
        // Get the last 1000 blocks (about 2 hours on Arbitrum)
        const currentBlock = await contract.provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 1000);

        // Fetch all events
        const [lockEvents, unlockEvents, requestEvents] = await Promise.all([
          contract.queryFilter(contract.filters.TokensLocked(account), fromBlock, currentBlock),
          contract.queryFilter(contract.filters.TokensUnlocked(account), fromBlock, currentBlock),
          contract.queryFilter(contract.filters.UnlockRequested(account), fromBlock, currentBlock)
        ]);

        // Process lock events
        const lockTransactions = await Promise.all(lockEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            hash: event.transactionHash,
            type: 'lock' as const,
            amount: event.args?.amount,
            timestamp: block.timestamp,
            status: 'completed' as const,
            duration: 30,
            lockTime: block.timestamp
          };
        }));

        // Process unlock events
        const unlockTransactions = await Promise.all(unlockEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            hash: event.transactionHash,
            type: 'unlock' as const,
            amount: event.args?.amount,
            timestamp: block.timestamp,
            status: 'completed' as const
          };
        }));

        // Process request events
        const requestTransactions = await Promise.all(requestEvents.map(async (event) => {
          const block = await event.getBlock();
          const lock = await contract.getLock(account, event.args?.lockIndex);
          return {
            hash: event.transactionHash,
            type: 'request' as const,
            amount: lock.amount,
            timestamp: block.timestamp,
            status: 'completed' as const,
            unlockRequestTime: block.timestamp
          };
        }));

        // Combine and sort all transactions by timestamp
        const allTransactions = [...lockTransactions, ...unlockTransactions, ...requestTransactions]
          .sort((a, b) => b.timestamp - a.timestamp);

        setTransactions(allTransactions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching historical transactions:', err);
        setLoading(false);
      }
    };

    fetchHistoricalTransactions();

    const handleTokensLocked = async (user: string, amount: ethers.BigNumber, event: any) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        const block = await event.getBlock();
        const newTransaction: Transaction = {
          hash: event.transactionHash,
          type: 'lock',
          amount,
          timestamp: block.timestamp,
          status: 'completed',
          duration: 30,
          lockTime: block.timestamp
        };
        setTransactions(prev => [newTransaction, ...prev]);
        const totalLocked = await contract.totalLocked();
        setTvl(ethers.utils.formatEther(totalLocked));
      }
    };

    const handleTokensUnlocked = async (user: string, amount: ethers.BigNumber, event: any) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        const block = await event.getBlock();
        const newTransaction: Transaction = {
          hash: event.transactionHash,
          type: 'unlock',
          amount,
          timestamp: block.timestamp,
          status: 'completed'
        };
        setTransactions(prev => [newTransaction, ...prev]);
        const totalLocked = await contract.totalLocked();
        setTvl(ethers.utils.formatEther(totalLocked));
      }
    };

    const handleUnlockRequested = async (user: string, lockIndex: ethers.BigNumber, event: any) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        const block = await event.getBlock();
        const lock = await contract.getLock(user, lockIndex);
        const newTransaction: Transaction = {
          hash: event.transactionHash,
          type: 'request',
          amount: lock.amount,
          timestamp: block.timestamp,
          status: 'completed',
          unlockRequestTime: block.timestamp
        };
        setTransactions(prev => [newTransaction, ...prev]);
      }
    };

    contract.on('TokensLocked', handleTokensLocked);
    contract.on('TokensUnlocked', handleTokensUnlocked);
    contract.on('UnlockRequested', handleUnlockRequested);

    return () => {
      contract.off('TokensLocked', handleTokensLocked);
      contract.off('TokensUnlocked', handleTokensUnlocked);
      contract.off('UnlockRequested', handleUnlockRequested);
    };
  }, [contract, account]);

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'lock':
        return 'Lock Tokens';
      case 'unlock':
        return 'Unlock Tokens';
      case 'request':
        return 'Unlock Request';
      default:
        return type;
    }
  };

  const formatAmount = (amount: ethers.BigNumber) => {
    return parseFloat(ethers.utils.formatEther(amount)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDuration = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years}y ${remainingDays}d`;
    }
    return `${days}d`;
  };

  const getRemainingTime = (lockTime: number, duration: number) => {
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = lockTime + (duration * 24 * 60 * 60);
    const remainingSeconds = unlockTime - now;
    
    if (remainingSeconds <= 0) return 'Unlocked';
    
    const days = Math.floor(remainingSeconds / (24 * 60 * 60));
    const hours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
    
    return `${days}d ${hours}h`;
  };

  const getLockStatus = (tx: Transaction) => {
    if (tx.type !== 'lock') return null;
    if (!tx.lockTime || !tx.duration) return null;
    
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = tx.lockTime + (tx.duration * 24 * 60 * 60);
    
    if (now >= unlockTime) return 'Unlocked';
    if (tx.unlockRequestTime) return 'Unlock Requested';
    return 'Locked';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">Transaction History</h3>
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
          <span className="text-sm text-gray-600">TVL:</span>
          <span className="font-semibold">{tvl} WXM</span>
        </div>
      </div>

      <div className="space-y-4">
        {transactions.map((tx, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {tx.type === 'lock' ? (
                    <LockClosedIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <LockOpenIcon className="h-5 w-5 text-green-500" />
                  )}
                  <p className="text-gray-600">
                    Type: <span className="font-medium">{formatTransactionType(tx.type)}</span>
                  </p>
                </div>
                <p className="text-gray-600">
                  Amount: <span className="font-medium">{formatAmount(tx.amount)} WXM</span>
                </p>
                {tx.duration && tx.lockTime && (
                  <>
                    <p className="text-gray-600">
                      Duration: <span className="font-medium">{formatDuration(tx.duration)}</span>
                    </p>
                    <p className="text-gray-600">
                      Remaining: <span className="font-medium">{getRemainingTime(tx.lockTime, tx.duration)}</span>
                    </p>
                  </>
                )}
                {getLockStatus(tx) && (
                  <p className="text-gray-600">
                    Status: <span className={`font-medium ${
                      getLockStatus(tx) === 'Unlocked' ? 'text-green-500' :
                      getLockStatus(tx) === 'Unlock Requested' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`}>
                      {getLockStatus(tx)}
                    </span>
                  </p>
                )}
                <p className="text-gray-600">
                  Time: <span className="font-medium">{new Date(tx.timestamp * 1000).toLocaleString()}</span>
                </p>
              </div>
              <a
                href={`https://arbiscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                View on Arbiscan
              </a>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-gray-500 text-center py-4">No transactions yet</p>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory; 