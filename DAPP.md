# UniBank Web3 Dapp

Full-featured Web3 application for interacting with the UniBank smart contract.

## 🚀 Quick Start

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ✨ Features

### Core Functionality
- **MetaMask Integration**: Seamless wallet connection with automatic network detection
- **Multi-Role Support**: Distinct interfaces for Owner, Admin, and Authorized Users
- **Real-Time Updates**: Live balance tracking and deposit monitoring
- **Transaction Management**: Clear feedback for pending, success, and error states
- **Network Agnostic**: Works with any EVM-compatible network

### User Features
- View bank overview (status, interest rates, reserves)
- Make deposits with configurable amounts
- Track all personal deposits with status indicators
- Withdraw matured deposits (after 2-minute lock period)
- Real-time interest calculation display

### Admin Features (Owner/Admin)
- Toggle bank active/inactive status
- Set interest rates (in basis points)
- Authorize/remove users
- View system-wide statistics

### Owner-Only Features
- Add reserves to cover interest payments
- Grant/revoke admin privileges
- Full system control

## 🎨 UI/UX Highlights

- **Modern Design**: Glassmorphism effects with gradient backgrounds
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Toast Notifications**: Real-time feedback for all actions
- **Form Validation**: Inline validation with helpful error messages
- **Role-Based Views**: UI adapts based on user permissions
- **Status Indicators**: Clear visual feedback for deposit maturity
- **Transaction States**: Loading, pending, success, and error states

## 📋 Usage Guide

### 1. Connect Your Wallet
Click "Connect Wallet" in the top right corner to connect MetaMask.

### 2. Set Contract Address
1. Deploy UniBank contract or get address from admin
2. Paste address in the "Contract Address" field
3. Click "Set Contract"
4. Address is saved in browser localStorage

### 3. Interact Based on Role

#### **Unauthorized User (NONE)**
- Can view overview tab
- Must request admin to authorize address

#### **Authorized User (USER)**
- Make deposits (if bank is active)
- View deposit history
- Withdraw matured deposits
- Track interest accrual

#### **Administrator (ADMIN)**
- All user capabilities
- Toggle bank active/inactive
- Set interest rates
- Authorize new users

#### **Owner (OWNER)**
- All admin capabilities
- Add reserves for interest payments
- Grant/revoke admin privileges

## 🔧 Technical Details

### Contract Integration
The dapp uses Ethers.js v6 to interact with the UniBank smart contract:
- Read-only calls for viewing data
- Signed transactions for state changes
- Event listening for real-time updates

### State Management
- React hooks for local state
- localStorage for persistent preferences
- Automatic refresh on wallet/network changes

### Error Handling
Comprehensive error parsing for common scenarios:
- User rejection (ACTION_REJECTED)
- Insufficient funds
- Contract reverts with reasons
- Network errors

### Network Support
Built-in support for popular networks:
- Ethereum Mainnet & Sepolia
- Hardhat Local (chainId 31337)
- Polygon, Optimism, Arbitrum, Base

Block explorer links auto-generate when available.

## 🎯 Key Concepts

### Interest Rate System
- Rates specified in **basis points** (100 BP = 1%)
- Each deposit captures a snapshot of the current rate
- Changing the rate only affects NEW deposits
- Example: 100 BP = 1% per minute

### Deposit Lock Period
- All deposits have a **2-minute maturity period**
- Withdrawals are blocked until maturity
- Lock period set by contract constant (`DEPOSIT_LOCK_MINUTES`)

### Reserve Management
- Owner must add reserves to cover interest payments
- Reserves tracked separately from user deposits
- Withdrawals fail if reserves are insufficient

### Role Hierarchy
```
OWNER (Deployer)
  ├─ Full control
  └─ Can grant ADMIN
     ├─ ADMIN
     │  ├─ Manage users
     │  └─ Set rates
     └─ AUTHORIZED USER
        ├─ Deposit
        └─ Withdraw
```

## 🐛 Troubleshooting

### MetaMask Issues
- **"MetaMask not detected"**: Install the browser extension
- **"MetaMask locked"**: Unlock your wallet
- **Network mismatch**: Switch to correct network in MetaMask

### Transaction Failures
- **"User is not authorized"**: Ask admin to whitelist your address
- **"Bank is not active"**: Owner must activate the bank
- **"Not reached maturity"**: Wait full 2 minutes after deposit
- **"Insufficient reserves"**: Owner needs to add more reserves
- **"Insufficient funds"**: Not enough ETH in wallet

### Contract Address Issues
- Ensure address starts with `0x`
- Verify contract is deployed on current network
- Check for typos in address

## 📁 Project Structure

```
uni-bank/
├── contracts/           # Solidity contracts
│   └── UniBank.sol
├── test/                # Hardhat tests
├── artifacts/           # Compiled contracts (contains ABI)
├── frontend/            # React dapp
│   ├── src/
│   │   ├── abi/         # Contract ABI
│   │   ├── utils/       # Helper functions
│   │   ├── contexts/    # React contexts
│   │   └── App.tsx      # Main app component
│   ├── public/
│   └── package.json
├── hardhat.config.js
└── README.md
```

## 🔄 Development Workflow

### After Contract Changes
```bash
# Recompile contract
npx hardhat compile

# Copy new ABI to frontend
cp artifacts/contracts/UniBank.sol/UniBank.json frontend/src/abi/

# Rebuild frontend
cd frontend
npm run build
```

### Testing Locally
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Start frontend
cd frontend
npm run dev

# Connect MetaMask to localhost:8545
# Use contract address from deployment
```

## 🎨 Customization

### Styling
- Tailwind classes in `App.tsx` and `index.css`
- Color scheme defined in `tailwind.config.js`
- Gradient background via CSS custom properties

### Features
- Add new tabs by extending the `tab` state
- Add new admin functions by following existing patterns
- Extend error handling in `utils/errors.ts`

## 📦 Dependencies

### Core
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Ethers.js v6**: Blockchain interactions

### UI/UX
- **Tailwind CSS**: Utility-first styling
- **React Hot Toast**: Toast notifications
- **Headless UI**: Accessible components
- **Heroicons**: Icon library
- **date-fns**: Date formatting

## 📝 License

MIT

## 🤝 Contributing

This is an educational project. Feel free to fork and modify!

---

**Built with ❤️ for learning Web3 development**
