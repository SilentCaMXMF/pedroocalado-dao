# DeFi Dashboard - Specification

## Project Overview
- **Name**: pedroocalado.dao DeFi Dashboard
- **Type**: Web3 Portfolio Dashboard
- **Core Functionality**: Track wallet tokens, view DeFi positions, monitor gas prices
- **Target Users**: DeFi users, crypto traders

## UI/UX Specification

### Layout Structure
- **Header**: Logo (pedroocalado.dao), wallet connect button
- **Hero**: Portfolio summary card with total value
- **Main Grid**: 2-column on desktop, 1-column on mobile
  - Token Holdings
  - Gas Tracker
- **Footer**: Network status indicator

### Responsive Breakpoints
- Mobile: < 768px (single column)
- Desktop: >= 768px (2 columns)

### Visual Design
- **Color Palette**:
  - Background: #0a0a0f (deep black)
  - Card Background: #12121a
  - Primary: #00d4aa (cyan-green)
  - Secondary: #6366f1 (indigo)
  - Accent: #f59e0b (amber for gas)
  - Text Primary: #ffffff
  - Text Secondary: #9ca3af
  - Border: #1f1f2e
  
- **Typography**:
  - Font: 'JetBrains Mono', monospace (techy DeFi feel)
  - Headings: 24px (h1), 18px (h2)
  - Body: 14px
  - Small: 12px
  
- **Effects**:
  - Cards: subtle glow on hover (box-shadow with primary color)
  - Buttons: scale(1.02) on hover
  - Numbers: animate on value change

### Components
1. **WalletConnect Button**: Connect wallet, show address when connected
2. **Portfolio Card**: Total value, 24h change
3. **Token List**: Token icon, name, balance, value, 24h change
4. **Gas Tracker**: Current gas in Gwei for slow/standard/fast
5. **Network Status**: Connected network indicator

## Functionality Specification

### Core Features
1. **Wallet Connection**: MetaMask integration via window.ethereum
2. **Token Balance Fetch**: Query native ETH + ERC20 tokens
3. **Price Data**: Fetch from public API (CoinGecko free tier)
4. **Gas Tracker**: Fetch current gas from eth_gasPrice RPC
5. **Portfolio Value**: Calculate total in EUR/USD

### User Interactions
- Click "Connect Wallet" → MetaMask prompt
- View token balances automatically after connect
- Manual refresh button for gas/prices
- Disconnect wallet option

### Data Handling
- Use public RPC (Cloudflare or public endpoints)
- CoinGecko API for prices (free, no key)
- Local storage for last connected wallet

## Acceptance Criteria
- [ ] Wallet connects via MetaMask
- [ ] ETH balance displays correctly
- [ ] Gas prices update and show slow/standard/fast
- [ ] Responsive layout works on mobile
- [ ] Clean, modern DeFi aesthetic
- [ ] Loads without console errors

## Deployment
- Deploy to IPFS via Unstoppable Domain
- Or static hosting (Vercel/Netlify/GitHub Pages)
