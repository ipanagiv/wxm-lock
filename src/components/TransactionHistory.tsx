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

const ARBISCAN_API_KEY = 'ECH5FWXFAABMP5VJUHB3KK1EIB5D4P5DVW';
const CONTRACT_ADDRESS = '0x92917c188B20EA26408E8F249D46BEe490f01d83';
const RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second)
const COINGECKO_API_KEY = process.env.REACT_APP_COINGECKO_API_KEY;

// Contract ABI for transaction decoding
const CONTRACT_ABI = [
  "function lock(uint256 amount)",
  "function unlock(uint256 amount)",
  "function requestUnlock(uint256 lockIndex)",
  "function getLock(address user, uint256 index) view returns (tuple(uint256 amount, uint256 lockTime, uint256 duration, uint256 unlockRequestTime))",
  "function getTotalLocked() view returns (uint256)"
];

const TransactionHistory: React.FC = () => {
  const { account, contract } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tvl, setTvl] = useState<string>('0');
  const [tvlUsd, setTvlUsd] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  const fetchTvl = async () => {
    if (!contract) return;
    try {
      // Get total locked tokens
      const totalLocked = await contract.getTotalLocked();
      const totalLockedFormatted = ethers.utils.formatEther(totalLocked);
      setTvl(totalLockedFormatted);

      // Get WXM price from CoinGecko
      const priceResponse = await fetch(
        `https://pro-api.coingecko.com/api/v3/simple/price?ids=weatherxm&vs_currencies=usd&x_cg_pro_api_key=${COINGECKO_API_KEY}`
      );
      const priceData = await priceResponse.json();
      const wxmPrice = priceData.weatherxm.usd;

      // Calculate TVL in USD
      const tvlUsdValue = (parseFloat(totalLockedFormatted) * wxmPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      setTvlUsd(tvlUsdValue);
    } catch (err) {
      console.error('Error fetching TVL:', err);
    }
  };

  useEffect(() => {
    if (!contract) return;
    fetchTvl();
  }, [contract]);

  useEffect(() => {
    if (!contract) return;

    const fetchTransactions = async () => {
      try {
        // Add delay between API calls
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Fetch all transactions for the contract
        const txResponse = await fetch(
          `https://api.arbiscan.io/api?module=account&action=txlist&address=${CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`
        );
        await delay(RATE_LIMIT_DELAY);
        const txData = await txResponse.json();
        console.log('Contract transactions:', txData);

        // Process transactions in batches to respect rate limit
        const allTransactions = txData.result;

        console.log('Filtered transactions:', allTransactions);

        const processedTransactions: Transaction[] = [];
        for (let i = 0; i < allTransactions.length; i++) {
          const tx = allTransactions[i];
          
          let type: 'lock' | 'unlock' | 'request' = 'lock';
          let amount = ethers.BigNumber.from(tx.value);

          // Try to decode the transaction data to determine the type
          try {
            const iface = new ethers.utils.Interface(CONTRACT_ABI);
            const decoded = iface.parseTransaction({ data: tx.input });
            console.log('Decoded transaction:', decoded);
            
            if (decoded.name === 'unlock') {
              type = 'unlock';
            } else if (decoded.name === 'requestUnlock') {
              type = 'request';
              // For unlock requests, we need to get the lock amount
              const lockIndex = decoded.args[0];
              const lock = await contract.getLock(tx.from, lockIndex);
              await delay(RATE_LIMIT_DELAY);
              amount = lock.amount;
            }
          } catch (err) {
            console.error('Error decoding transaction:', err);
          }

          processedTransactions.push({
            hash: tx.hash,
            type,
            amount,
            timestamp: parseInt(tx.timeStamp),
            status: 'completed' as const,
            duration: type === 'lock' ? 30 : undefined,
            lockTime: type === 'lock' ? parseInt(tx.timeStamp) : undefined,
            unlockRequestTime: type === 'request' ? parseInt(tx.timeStamp) : undefined
          });
        }

        console.log('Processed transactions:', processedTransactions);
        setTransactions(processedTransactions.sort((a, b) => b.timestamp - a.timestamp));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      }
    };

    fetchTransactions();

    // Event listeners for real-time updates
    const handleTokensLocked = async (user: string, amount: ethers.BigNumber, event: any) => {
      const newTransaction: Transaction = {
        hash: event.transactionHash,
        type: 'lock',
        amount,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'completed' as const,
        duration: 30,
        lockTime: Math.floor(Date.now() / 1000)
      };
      setTransactions(prev => [newTransaction, ...prev]);
      await fetchTvl();
    };

    const handleTokensUnlocked = async (user: string, amount: ethers.BigNumber, event: any) => {
      const newTransaction: Transaction = {
        hash: event.transactionHash,
        type: 'unlock',
        amount,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'completed' as const
      };
      setTransactions(prev => [newTransaction, ...prev]);
      await fetchTvl();
    };

    const handleUnlockRequested = async (user: string, lockIndex: ethers.BigNumber, event: any) => {
      const lock = await contract.getLock(user, lockIndex);
      const newTransaction: Transaction = {
        hash: event.transactionHash,
        type: 'request',
        amount: lock.amount,
        timestamp: Math.floor(Date.now() / 1000),
        status: 'completed' as const,
        unlockRequestTime: Math.floor(Date.now() / 1000)
      };
      setTransactions(prev => [newTransaction, ...prev]);
    };

    contract.on('TokensLocked', handleTokensLocked);
    contract.on('TokensUnlocked', handleTokensUnlocked);
    contract.on('UnlockRequested', handleUnlockRequested);

    return () => {
      contract.off('TokensLocked', handleTokensLocked);
      contract.off('TokensUnlocked', handleTokensUnlocked);
      contract.off('UnlockRequested', handleUnlockRequested);
    };
  }, [contract]);

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
          <span className="text-sm text-gray-500">(${tvlUsd})</span>
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