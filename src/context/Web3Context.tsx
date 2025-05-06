import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/ethereum-provider';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

interface Web3ContextType {
  account: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  contract: ethers.Contract | null;
  provider: ethers.providers.Web3Provider | null;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  contract: null,
  provider: null,
  isConnected: false,
});

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize WalletConnect provider
  const walletConnectProvider = WalletConnectProvider.init({
    projectId: "a830791decc3dc5a13ee339cccfb30ab",
    chains: [42161],
    showQrModal: true
  });

  const web3Modal = new Web3Modal({
    network: "arbitrum",
    cacheProvider: false,
    disableInjectedProvider: false,
    providerOptions: {
      walletconnect: {
        package: walletConnectProvider,
        options: {
          projectId: "a830791decc3dc5a13ee339cccfb30ab",
          chains: [42161],
          showQrModal: true,
          rpc: {
            42161: "https://arb1.arbitrum.io/rpc"
          },
          qrModalOptions: {
            themeMode: "dark"
          }
        }
      }
    },
    theme: "dark"
  });

  const connectWallet = async () => {
    try {
      // Clear any existing connection
      await web3Modal.clearCachedProvider();
      
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      // Check if we're on Arbitrum
      const network = await provider.getNetwork();
      if (network.chainId !== 42161) {
        try {
          await provider.send("wallet_switchEthereumChain", [{ chainId: "0xa4b1" }]); // 42161 in hex
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await provider.send("wallet_addEthereumChain", [{
                chainId: "0xa4b1",
                chainName: "Arbitrum One",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18
                },
                rpcUrls: ["https://arb1.arbitrum.io/rpc"],
                blockExplorerUrls: ["https://arbiscan.io"]
              }]);
            } catch (addError) {
              throw new Error("Failed to add Arbitrum network");
            }
          } else {
            throw new Error("Please switch to Arbitrum network");
          }
        }
      }
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setProvider(provider);
      setContract(contract);
      setAccount(address);
      setIsConnected(true);

      // Listen for account changes
      instance.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      // Listen for chain changes
      instance.on("chainChanged", (chainId: string) => {
        if (parseInt(chainId, 16) !== 42161) {
          alert("Please switch to Arbitrum network");
        }
        window.location.reload();
      });

      // Listen for disconnect
      instance.on("disconnect", () => {
        disconnectWallet();
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error instanceof Error) {
        alert(error.message);
      }
      // Reset state on error
      disconnectWallet();
    }
  };

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider();
    setAccount(null);
    setContract(null);
    setProvider(null);
    setIsConnected(false);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        connectWallet,
        disconnectWallet,
        contract,
        provider,
        isConnected,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context); 