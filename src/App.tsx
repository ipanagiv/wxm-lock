import React from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import TokenLocking from './components/TokenLocking';
import TransactionHistory from './components/TransactionHistory';
import TokenPrice from './components/TokenPrice';
import { LockClosedIcon, ArrowPathIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import './App.css';

const WelcomeSection: React.FC = () => {
  const { connectWallet } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🌐 Governance Power Through Token Locking</h1>
          <p className="text-xl text-gray-600">Lock your WXM tokens securely on Arbitrum</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <LockClosedIcon className="h-8 w-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">🔒 Lock Tokens, Gain Voting Power</h3>
            </div>
            <p className="text-gray-600">
              Members can lock WXM tokens to gain Voting Power, which directly affects the weight of their votes in Snapshot proposals.
              <br /><br />
              • 20 WXM tokens = 1 Voting Power (VP)
              <br />
              • Locked tokens are non-transferable for the duration of the lock period, reinforcing long-term alignment with the protocol's success.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">📈 Optional Multiplier Mechanism</h3>
            </div>
            <p className="text-gray-600">
              To reward deeper commitment, the DAO can optionally apply time-based multipliers to voting power:
              <br /><br />
              • 1 month: 1x
              <br />
              • 3 months: 1.25x
              <br />
              • 6 months: 1.5x
              <br />
              • 12 months: 2x
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <ShieldCheckIcon className="h-8 w-8 text-green-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Decentralized Governance</h3>
            </div>
            <p className="text-gray-600">
              To empower a more decentralized and merit-based governance model, the <a href="https://weatherxm.network/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">WeatherXM Association</a> introduces Voting Power (VP) — a mechanism that aligns governance influence with long-term commitment to the network.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <ArrowPathIcon className="h-8 w-8 text-purple-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Enhanced Governance Incentive</h3>
            </div>
            <p className="text-gray-600">
              The multiplier mechanism encourages long-term token holding and active participation in governance decisions, creating a more sustainable and aligned community.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">Connect your wallet to get started</p>
          <div className="flex justify-center">
            <button
              onClick={connectWallet}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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

const AppContent: React.FC = () => {
  const { isConnected } = useWeb3();

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">🌐 Governance Power Through Token Locking</h1>
          <WalletButton />
        </div>
      </header>

      <main>
        {!isConnected ? (
          <WelcomeSection />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to WXM Token Locking</h2>
                <p className="text-gray-600 mb-4">
                  To empower a more decentralized and merit-based governance model, the <a href="https://weatherxm.network/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">WeatherXM Association</a> introduces Voting Power (VP) — a mechanism that aligns governance influence with long-term commitment to the network.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">🔒 Lock Tokens, Gain Voting Power</h3>
                    <p className="text-gray-600">
                      Members can lock WXM tokens to gain Voting Power, which directly affects the weight of their votes in Snapshot proposals.
                      <br /><br />
                      • 20 WXM tokens = 1 Voting Power (VP)
                      <br />
                      • Locked tokens are non-transferable for the duration of the lock period, reinforcing long-term alignment with the protocol's success.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">📈 Optional Multiplier Mechanism</h3>
                    <p className="text-gray-600">
                      To reward deeper commitment, the DAO can optionally apply time-based multipliers to voting power:
                      <br /><br />
                      • 1 month: 1x
                      <br />
                      • 3 months: 1.25x
                      <br />
                      • 6 months: 1.5x
                      <br />
                      • 12 months: 2x
                    </p>
                  </div>
                </div>
              </div>
              <TokenLocking />
              <TransactionHistory />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
};

export default App;
