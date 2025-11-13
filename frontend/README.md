# UniBank Dapp Frontend

Modern Web3 banking dapp for interacting with the UniBank smart contract.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173, connect MetaMask, paste your contract address, and start banking!

## Features

✅ MetaMask wallet integration  
✅ Multi-role support (Owner/Admin/User)  
✅ Real-time deposit tracking  
✅ Transaction management with toasts  
✅ Network-agnostic (works with any EVM chain)  
✅ Modern, responsive UI  

## Usage

1. **Connect Wallet** - Click the connect button
2. **Set Contract** - Paste your deployed UniBank address
3. **Interact** - Use Overview, Deposits, or Admin tabs based on your role

## Key Concepts

- **Interest Rates**: Basis points (100 BP = 1%)
- **Lock Period**: 2 minutes before withdrawal
- **Reserves**: Owner must fund to pay interest

## Troubleshooting

- **"User is not authorized"** → Ask admin to whitelist you
- **"Bank is not active"** → Owner must activate
- **"Not reached maturity"** → Wait 2 minutes after deposit

## Tech Stack

React + TypeScript + Vite + Ethers.js v6 + Tailwind CSS
