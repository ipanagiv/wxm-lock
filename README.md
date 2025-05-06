# WXM Token Locker dApp

A modern and elegant decentralized application for locking WXM tokens on Arbitrum network.

## Features

- 🔐 Lock WXM tokens
- 🔓 Request and execute token unlocks
- 📊 View token balance
- 📜 Transaction history
- 🌐 WalletConnect integration
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- ethers.js
- Web3Modal
- WalletConnect

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ui-wxm.git
cd ui-wxm
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Smart Contract

The dApp interacts with the WXM Token Locker contract deployed on Arbitrum:
- Contract Address: `0x92917c188B20EA26408E8F249D46BEe490f01d83`

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```
REACT_APP_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

## License

MIT
