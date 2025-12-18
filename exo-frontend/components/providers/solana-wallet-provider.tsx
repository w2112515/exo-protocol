"use client";

import { FC, ReactNode, useMemo } from "react";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Default styles for wallet adapter modal
import "@solana/wallet-adapter-react-ui/styles.css";

interface Props {
    children: ReactNode;
}

export const SolanaWalletProvider: FC<Props> = ({ children }) => {
    // Use Devnet by default, can be configured via env
    const endpoint = useMemo(
        () =>
            process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
            clusterApiUrl("devnet"),
        []
    );

    // Configure supported wallets
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
