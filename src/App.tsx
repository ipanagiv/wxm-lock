import React from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import TokenLocking from './components/TokenLocking';
import TransactionHistory from './components/TransactionHistory';
import TokenPrice from './components/TokenPrice';
import { LockClosedIcon, ArrowPathIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import './App.css';
import votingPowerImage from './images/voting-power.png';

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
              <h3 className="text-xl font-semibold text-gray-900">🔒 Lock WXM Tokens → Get Voting Power</h3>
            </div>
            <p className="text-gray-600">
              Members can lock WXM tokens to gain Voting Power, which directly affects the weight of their votes in <a href="https://snapshot.box/#/s:weatherxm.eth" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Snapshot proposals</a>.
              <br /><br />
              • 20 WXM = 1 Voting Power (VP)
              <br />
              • Tokens must be locked to gain VP. Locked tokens are non-transferable but grant enhanced voting rights.
              <br />
              • You can request an unlock after 24 hours of locking your tokens.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
              <ClockIcon className="h-8 w-8 text-yellow-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">📊 Token-Based Multiplier Tiers</h3>
            </div>
            <p className="text-gray-600">
              Voting Power increases with larger token lock amounts through a progressive multiplier system.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Locked</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base VP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective VP</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">0 – 20 WXM</td>
                    <td className="px-4 py-3 text-sm text-gray-600">0 VP</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.0x</td>
                    <td className="px-4 py-3 text-sm text-gray-600">0 VP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">21 – 999 WXM</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.05–49.95 VP</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.0x</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.05–49.95 VP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">1,000 – 4,999 WXM</td>
                    <td className="px-4 py-3 text-sm text-gray-600">50–249.95 VP</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.1x (+10% bonus)</td>
                    <td className="px-4 py-3 text-sm text-gray-600">55–274.95 VP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">5,000 – 9,999 WXM</td>
                    <td className="px-4 py-3 text-sm text-gray-600">250–499.95 VP</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.25x (+25% bonus)</td>
                    <td className="px-4 py-3 text-sm text-gray-600">312.5–624.94 VP</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-gray-900">10,000+ WXM</td>
                    <td className="px-4 py-3 text-sm text-gray-600">500+ VP</td>
                    <td className="px-4 py-3 text-sm text-gray-600">1.5x (+50% bonus)</td>
                    <td className="px-4 py-3 text-sm text-gray-600">750+ VP</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-gray-600">
              This system ensures that those who commit more WXM to the DAO gain proportionally more voting influence, making the protocol more robust and aligned with its most active supporters.
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
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">🔒 Lock WXM Tokens → Get Voting Power</h3>
                    <p className="text-gray-600">
                      Members can lock WXM tokens to gain Voting Power, which directly affects the weight of their votes in <a href="https://snapshot.box/#/s:weatherxm.eth" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Snapshot proposals</a>.
                      <br /><br />
                      • 20 WXM = 1 Voting Power (VP)
                      <br />
                      • Tokens must be locked to gain VP. Locked tokens are non-transferable but grant enhanced voting rights.
                      <br />
                      • You can request an unlock after 24 hours of locking your tokens.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">📊 Token-Based Multiplier Tiers</h3>
                    <p className="text-gray-600">
                      Voting Power increases with larger token lock amounts through a progressive multiplier system.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens Locked</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base VP</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Multiplier</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective VP</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">0 – 20 WXM</td>
                            <td className="px-4 py-3 text-sm text-gray-600">0 VP</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.0x</td>
                            <td className="px-4 py-3 text-sm text-gray-600">0 VP</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">21 – 999 WXM</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.05–49.95 VP</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.0x</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.05–49.95 VP</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">1,000 – 4,999 WXM</td>
                            <td className="px-4 py-3 text-sm text-gray-600">50–249.95 VP</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.1x (+10% bonus)</td>
                            <td className="px-4 py-3 text-sm text-gray-600">55–274.95 VP</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">5,000 – 9,999 WXM</td>
                            <td className="px-4 py-3 text-sm text-gray-600">250–499.95 VP</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.25x (+25% bonus)</td>
                            <td className="px-4 py-3 text-sm text-gray-600">312.5–624.94 VP</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 text-sm text-gray-900">10,000+ WXM</td>
                            <td className="px-4 py-3 text-sm text-gray-600">500+ VP</td>
                            <td className="px-4 py-3 text-sm text-gray-600">1.5x (+50% bonus)</td>
                            <td className="px-4 py-3 text-sm text-gray-600">750+ VP</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-gray-600">
                      This system ensures that those who commit more WXM to the DAO gain proportionally more voting influence, making the protocol more robust and aligned with its most active supporters.
                    </p>
                  </div>
                </div>
              </div>
              <TokenLocking />
              <div className="mt-4 mb-8 flex justify-center">
                <img 
                  src={votingPowerImage} 
                  alt="Governance Power" 
                  className="max-w-2xl w-full rounded-lg shadow-lg"
                />
              </div>
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
