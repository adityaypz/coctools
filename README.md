# Crypto Tools Directory

A curated directory of **136+ crypto and Web3 tools** with manual popularity ranking and themed collections. Built with Next.js 16, Prisma, and PostgreSQL.

## ✨ Features

- 🔗 **Link-First Workflow** — Add tools by URL, metadata auto-fetched
- ⭐ **Popularity Ranking** — Manual 0-100 scores to highlight top tools
- 📚 **8 Curated Collections** — DeFi Essentials, NFT Marketplaces, Trading Platforms, etc.
- 🔍 **Smart Categorization** — 20 crypto-specific categories (Exchanges, Wallets, DeFi, NFT, etc.)
- 🎨 **Modern UI** — Dark mode, glassmorphism, smooth animations
- 🔐 **Admin Panel** — Password-protected with search, filters, and pagination
- 🚀 **Auto-Deduplication** — Prevents duplicate tools by domain

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, React Server Components)
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Deployment:** Vercel-ready

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or hosted)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/coctools.git
   cd coctools
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `ADMIN_PASSWORD` — Choose a secure password for admin access

4. **Set up the database**
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🚀 Deployment to Vercel

### Option 1: Deploy with Vercel Postgres

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/coctools.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables:
     - `ADMIN_PASSWORD` — Your admin password
   - Vercel will auto-detect Next.js and deploy

3. **Add Vercel Postgres**
   - In your Vercel project, go to Storage → Create Database → Postgres
   - Vercel will automatically add `DATABASE_URL` to your environment variables

4. **Run migrations**
   ```bash
   # After deployment, run in Vercel CLI or dashboard
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

### Option 2: Deploy with External Database (Neon, Supabase, Railway)

1. Create a PostgreSQL database on your preferred provider
2. Get the connection string (should start with `postgresql://`)
3. Add to Vercel environment variables:
   - `DATABASE_URL` — Your PostgreSQL connection string
   - `ADMIN_PASSWORD` — Your admin password
4. Deploy and run migrations

## 🔑 Admin Access

- **URL:** `/admin`
- **Password:** Set in `.env` as `ADMIN_PASSWORD`

### Admin Features

- ✅ Add tools by URL (single or bulk import)
- ✅ Edit popularity scores (0-100)
- ✅ Manage categories and tags
- ✅ Approve/feature/draft tools
- ✅ Search and filter tools
- ✅ Pagination (10 tools per page)
- ✅ Refresh metadata
- ✅ Delete tools

## 📚 Collections

8 curated collections included:

1. **DeFi Essentials** — Aave, Compound, Curve, Lido, Uniswap, MakerDAO
2. **NFT Marketplaces** — OpenSea, Blur, Magic Eden, Rarible, Foundation, Zora
3. **Trading Platforms** — Binance, Coinbase, Uniswap, dYdX, Kraken, PancakeSwap
4. **Crypto Wallets** — MetaMask, Phantom, Ledger, Trezor, Trust Wallet, Rainbow
5. **Analytics & Data** — Dune, Nansen, DeFiLlama, Etherscan, CoinGecko, CoinMarketCap
6. **Developer Tools** — Hardhat, Foundry, Alchemy, Infura, The Graph, Chainlink
7. **Layer 2 Solutions** — Arbitrum, Optimism, Polygon, zkSync, Base, Starknet
8. **Cross-Chain Bridges** — Hop, Across, Stargate, Wormhole, LayerZero

## 🎯 Categories

20 crypto-specific categories:

- Exchanges, Wallets, DeFi, NFT, Trading
- Analytics, Developer Tools, DAOs, Bridges
- Layer 2, Staking, Lending, Derivatives
- Launchpads, Gaming, Metaverse, Infrastructure
- Security, Portfolio, News, Other

## 📝 License

MIT License - feel free to use this for your own projects!

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add more crypto tools
- Suggest new categories or collections
- Report bugs or request features
- Improve documentation

## 🙏 Acknowledgments

Built with ❤️ for the crypto community. Tool metadata fetched using open graph tags and favicons.

---

**Star ⭐ this repo if you find it useful!**
