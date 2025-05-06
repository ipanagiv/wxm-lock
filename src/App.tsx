import React from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import TokenLocking from './components/TokenLocking';
import TransactionHistory from './components/TransactionHistory';
import './App.css';

const WalletButton: React.FC = () => {
  const { account, connectWallet, disconnectWallet, isConnected } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={isConnected ? disconnectWallet : connectWallet}
      className={`px-4 py-2 rounded-md text-white font-medium ${
        isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
    >
      {isConnected ? `Disconnect ${formatAddress(account!)}` : 'Connect Wallet'}
    </button>
  );
};

function App() {
  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">WXM Token Locker</h1>
            <WalletButton />
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <TokenLocking />
            <TransactionHistory />
          </div>
        </main>
      </div>
    </Web3Provider>
  );
}

export default App;
