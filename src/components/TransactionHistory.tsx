import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

interface Transaction {
  hash: string;
  type: 'lock' | 'unlock' | 'request';
  amount?: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
}

const TransactionHistory: React.FC = () => {
  const { provider, account } = useWeb3();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!provider || !account) return;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Listen for TokensLocked events
    contract.on("TokensLocked", (user, lockIndex, amount, lockTime, event) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        setTransactions(prev => [{
          hash: event.transactionHash,
          type: 'lock',
          amount: ethers.utils.formatEther(amount),
          timestamp: Date.now(),
          status: 'success'
        }, ...prev]);
      }
    });

    // Listen for TokensUnlocked events
    contract.on("TokensUnlocked", (user, lockIndexPreviouslyAt, amount, event) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        setTransactions(prev => [{
          hash: event.transactionHash,
          type: 'unlock',
          amount: ethers.utils.formatEther(amount),
          timestamp: Date.now(),
          status: 'success'
        }, ...prev]);
      }
    });

    // Listen for UnlockRequested events
    contract.on("UnlockRequested", (user, lockIndex, unlockRequestTime, event) => {
      if (user.toLowerCase() === account.toLowerCase()) {
        setTransactions(prev => [{
          hash: event.transactionHash,
          type: 'request',
          timestamp: Date.now(),
          status: 'success'
        }, ...prev]);
      }
    });

    return () => {
      contract.removeAllListeners();
    };
  }, [provider, account]);

  const getTransactionTypeText = (type: Transaction['type']) => {
    switch (type) {
      case 'lock':
        return 'Tokens Locked';
      case 'unlock':
        return 'Tokens Unlocked';
      case 'request':
        return 'Unlock Requested';
      default:
        return type;
    }
  };

  const getTransactionStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Transactions</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No transactions yet
            </li>
          ) : (
            transactions.map((tx, index) => (
              <li key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getTransactionTypeText(tx.type)}
                    </p>
                    {tx.amount && (
                      <p className="text-sm text-gray-500">
                        Amount: {tx.amount} WXM
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${getTransactionStatusColor(tx.status)}`}>
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </span>
                    <a
                      href={`https://etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default TransactionHistory; 