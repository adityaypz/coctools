import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Crypto Tools Directory | 136+ Curated Web3 Tools",
  description: "Discover the best crypto and Web3 tools. Curated directory of 136+ exchanges, wallets, DeFi protocols, NFT marketplaces, analytics platforms, and developer tools.",
  keywords: ["crypto tools", "web3", "defi", "nft", "blockchain", "cryptocurrency", "ethereum", "bitcoin", "crypto directory"],
  authors: [{ name: "Crypto Tools Directory" }],
  openGraph: {
    title: "Crypto Tools Directory | 136+ Curated Web3 Tools",
    description: "Discover the best crypto and Web3 tools. Curated directory of exchanges, wallets, DeFi, NFT, and more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Tools Directory | 136+ Curated Web3 Tools",
    description: "Discover the best crypto and Web3 tools. Curated directory of exchanges, wallets, DeFi, NFT, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="border-t border-white/10 py-8 mt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center text-sm text-gray-500">
                <p>© {new Date().getFullYear()} Crypto Tools Directory. All rights reserved.</p>
                <p className="mt-2">
                  Built with ❤️ for the crypto community
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
