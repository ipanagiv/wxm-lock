import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { ArrowTopRightOnSquareIcon, ClockIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Transaction {
  hash: string;
  type: 'lock' | 'unlock' | 'request';
  amount: ethers.BigNumber;
  timestamp: number;
  status: 'completed';
  duration?: number;
  lockTime?: number;
  unlockRequestTime?: number;
  from: string;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  confirmations: number;
}

const CONTRACT_ADDRESS = '0x92917c188B20EA26408E8F249D46BEe490f01d83';
const RATE_LIMIT_DELAY = 200; // 200ms between requests (5 requests per second)
const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Get API keys from environment variables
const ARBISCAN_API_KEY = process.env.REACT_APP_ARBISCAN_API_KEY;

// Validate API keys
if (!ARBISCAN_API_KEY) {
  console.error('Arbiscan API key is missing. Please add REACT_APP_ARBISCAN_API_KEY to your .env file');
}

// Contract ABI for transaction decoding
const CONTRACT_ABI = [
  "function lockTokens(uint256 amount)",
  "function unlockTokens(uint256 lockIndex)",
  "function requestUnlock(uint256 lockIndex)",
  "function getLock(address user, uint256 index) view returns (tuple(uint256 amount, uint256 lockTime, uint256 unlockRequestTime))",
  "function getTotalLocked() view returns (uint256)"
];

const TransactionHistory: React.FC = () => {
  const { contract } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tvl, setTvl] = useState<string>('0');
  const [tvlUsd, setTvlUsd] = useState<string>('0');
  const [wxmPrice, setWxmPrice] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [lastBlock, setLastBlock] = useState<number>(0);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<Date>(new Date());
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    // Check for missing API keys on component mount
    if (!ARBISCAN_API_KEY) {
      setApiError('API keys are missing. Please check your .env file configuration.');
    }
  }, []);

  const formatUSD = (amount: number | string) => {
    try {
      const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(numericAmount) || numericAmount < 0) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      }).format(numericAmount);
    } catch (err) {
      console.error('Error formatting USD amount:', err);
      return '$0.00';
    }
  };

  const formatWXM = (amount: string) => {
    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 0) return '0.00';
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4
      }).format(numericAmount);
    } catch (err) {
      console.error('Error formatting WXM amount:', err);
      return '0.00';
    }
  };

  const fetchWxmPrice = async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      
      // Try CoinGecko first with the correct token ID
      try {
        const coingeckoResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=weatherxm-network&vs_currencies=usd'
        );
        
        if (coingeckoResponse.ok) {
          const coingeckoData = await coingeckoResponse.json();
          if (coingeckoData['weatherxm-network']?.usd) {
            const price = coingeckoData['weatherxm-network'].usd;
            setWxmPrice(price.toString());
            setLastPriceUpdate(new Date());
            return;
          }
        }
      } catch (coingeckoError) {
        console.log('CoinGecko price fetch failed, trying Arbiscan...');
      }

      // Fallback to Arbiscan if CoinGecko fails
      if (!ARBISCAN_API_KEY) {
        throw new Error('Arbiscan API key is missing');
      }

      const arbiscanResponse = await fetch(
        `https://api.arbiscan.io/api?module=stats&action=tokenprice&contractaddress=0x0edf9bc41bbc1354c70e2107f80c42cae7fbbca8&apikey=${ARBISCAN_API_KEY}`
      );
      
      if (!arbiscanResponse.ok) {
        const errorText = await arbiscanResponse.text();
        throw new Error(`Arbiscan API error: ${arbiscanResponse.status} - ${errorText}`);
      }

      const arbiscanData = await arbiscanResponse.json();
      
      if (arbiscanData.status !== '1' || !arbiscanData.result?.ethusd) {
        throw new Error('Price data not available from either API');
      }

      const price = arbiscanData.result.ethusd;
      setWxmPrice(price);
      setLastPriceUpdate(new Date());
    } catch (err) {
      console.error('Error fetching WXM price:', err);
      setPriceError(err instanceof Error ? err.message : 'Failed to fetch price');
      // Keep the last known price if available
      if (!wxmPrice) {
        setWxmPrice('0');
      }
    } finally {
      setPriceLoading(false);
    }
  };

  const calculateTVL = (txs: Transaction[]) => {
    try {
      let totalLocked = ethers.BigNumber.from(0);
      const processedLocks = new Map<string, boolean>(); // Track processed locks

      // Process transactions in chronological order
      const sortedTxs = [...txs].sort((a, b) => a.timestamp - b.timestamp);

      for (const tx of sortedTxs) {
        if (!tx.amount) continue; // Skip if amount is undefined or null
        
        if (tx.type === 'lock') {
          // Add locked amount
          totalLocked = totalLocked.add(tx.amount);
          // Mark this lock as processed
          processedLocks.set(tx.hash, true);
        } else if (tx.type === 'unlock') {
          // Find the corresponding lock transaction
          const lockTx = sortedTxs.find(t => 
            t.type === 'lock' && 
            t.from === tx.from && 
            !processedLocks.get(t.hash) &&
            t.amount // Ensure lock transaction has an amount
          );
          
          if (lockTx && lockTx.amount) {
            // Subtract unlocked amount
            totalLocked = totalLocked.sub(lockTx.amount);
            // Mark the lock as processed
            processedLocks.set(lockTx.hash, true);
          }
        }
      }

      return totalLocked;
    } catch (err) {
      console.error('Error calculating TVL:', err);
      return ethers.BigNumber.from(0);
    }
  };

  const fetchTvl = async (txs: Transaction[]) => {
    try {
      // Calculate total WXM locked
      const totalLocked = calculateTVL(txs);
      const totalLockedFormatted = ethers.utils.formatEther(totalLocked);
      setTvl(totalLockedFormatted);

      // Get WXM price
      await fetchWxmPrice();
      const wxmPriceNum = parseFloat(wxmPrice || '0');

      // Calculate TVL in USD (WXM amount * WXM price)
      const tvlUsdValue = parseFloat(totalLockedFormatted) * wxmPriceNum;
      setTvlUsd(formatUSD(tvlUsdValue));
    } catch (err) {
      console.error('Error fetching TVL:', err);
      setTvl('0');
      setTvlUsd('0');
    }
  };

  // Fetch WXM price every 5 minutes
  useEffect(() => {
    fetchWxmPrice();
    const interval = setInterval(fetchWxmPrice, PRICE_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        // Add delay between API calls
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        if (!ARBISCAN_API_KEY) {
          throw new Error('Arbiscan API key is missing');
        }

        // Get latest block number
        const blockResponse = await fetch(
          `https://api.arbiscan.io/api?module=proxy&action=eth_blockNumber&apikey=${ARBISCAN_API_KEY}`
        );
        const blockData = await blockResponse.json();
        const latestBlock = parseInt(blockData.result, 16);
        setLastBlock(latestBlock);

        // Fetch all transactions for the contract
        const txResponse = await fetch(
          `https://api.arbiscan.io/api?module=account&action=txlist&address=${CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=desc&apikey=${ARBISCAN_API_KEY}`
        );
        await delay(RATE_LIMIT_DELAY);
        const txData = await txResponse.json();

        if (!txData.result || !Array.isArray(txData.result)) {
          console.error('Invalid transaction data:', txData);
          setLoading(false);
          return;
        }

        const processedTransactions: Transaction[] = [];
        for (const tx of txData.result) {
          try {
            const iface = new ethers.utils.Interface(CONTRACT_ABI);
            const decoded = iface.parseTransaction({ data: tx.input });
            
            let type: 'lock' | 'unlock' | 'request' = 'lock';
            let amount = ethers.BigNumber.from(0);

            if (decoded.name === 'unlockTokens') {
              type = 'unlock';
            } else if (decoded.name === 'requestUnlock') {
              type = 'request';
              // For unlock requests, we need to get the lock amount
              if (contract) {
                const lockIndex = decoded.args[0];
                const lock = await contract.getLock(tx.from, lockIndex);
                await delay(RATE_LIMIT_DELAY);
                amount = lock.amount;
              }
            } else if (decoded.name === 'lockTokens') {
              // For lock transactions, get the amount from the decoded input
              amount = decoded.args[0];
            }

            const blockNumber = parseInt(tx.blockNumber);
            processedTransactions.push({
              hash: tx.hash,
              type,
              amount,
              timestamp: parseInt(tx.timeStamp),
              status: 'completed',
              duration: type === 'lock' ? 30 : undefined,
              lockTime: type === 'lock' ? parseInt(tx.timeStamp) : undefined,
              unlockRequestTime: type === 'request' ? parseInt(tx.timeStamp) : undefined,
              from: tx.from,
              blockNumber,
              gasUsed: tx.gasUsed,
              gasPrice: tx.gasPrice,
              confirmations: latestBlock - blockNumber
            });
          } catch (err) {
            console.error('Error processing transaction:', tx.hash, err);
          }
        }

        // Sort by timestamp (newest first)
        const sortedTransactions = processedTransactions.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(sortedTransactions);
        
        // Calculate TVL after processing all transactions
        await fetchTvl(sortedTransactions);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [contract]);

  const formatGasPrice = (gasPrice: string) => {
    return ethers.utils.formatUnits(gasPrice, 'gwei') + ' Gwei';
  };

  const formatGasUsed = (gasUsed: string) => {
    return parseInt(gasUsed).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'lock':
        return 'bg-green-100 text-green-800';
      case 'unlock':
        return 'bg-red-100 text-red-800';
      case 'request':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (apiError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{apiError}</p>
              <p className="mt-1">Please check your .env file and ensure all required API keys are set.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-2">Total Value Locked</h2>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(parseFloat(tvl))} WXM
            </div>
            <div className="text-gray-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              }).format(parseFloat(tvlUsd))}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-6 w-6 text-green-500" />
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(parseFloat(wxmPrice))}
                </span>
                <button 
                  onClick={fetchWxmPrice}
                  disabled={priceLoading}
                  className={`p-1 rounded-full hover:bg-gray-100 ${priceLoading ? 'animate-spin' : ''}`}
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            {priceError ? (
              <div className="text-sm text-red-500">{priceError}</div>
            ) : (
              <div className="text-sm text-gray-500">
                Last updated: {lastPriceUpdate.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Transaction History</h2>
          <div className="text-sm text-gray-500">
            Latest Block: {lastBlock.toLocaleString()}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Block</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmations</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Used</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Links</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.hash} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeColor(tx.type)}`}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatWXM(ethers.utils.formatEther(tx.amount))} WXM
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatUSD(parseFloat(ethers.utils.formatEther(tx.amount)) * parseFloat(wxmPrice))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`https://arbiscan.io/address/${tx.from}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {`${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(tx.timestamp * 1000).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{formatTimeAgo(tx.timestamp)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`https://arbiscan.io/block/${tx.blockNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {tx.blockNumber.toLocaleString()}
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tx.confirmations > 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.confirmations.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatGasUsed(tx.gasUsed)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatGasPrice(tx.gasPrice)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a 
                      href={`https://arbiscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      View
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistory; 