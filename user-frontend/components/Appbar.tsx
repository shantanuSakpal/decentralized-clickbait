import React, { useEffect} from 'react';
import Link from "next/link";
import {WalletDisconnectButton, WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {useWallet} from "@solana/wallet-adapter-react";
import {ed25519} from '@noble/curves/ed25519';
import axios from "axios";
import {decodeUTF8} from "tweetnacl-util";
import dynamic from "next/dynamic";


function Appbar() {
    const {publicKey, signMessage} = useWallet();
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL
// add this to sovle hydration error in next js
    const WalletMultiButtonDynamic = dynamic(
        async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
        { ssr: false }
    );
    const SignAndSend = async () => {
        try {
            if (!publicKey) throw new Error('Wallet not connected!');
            if (!signMessage) throw new Error('Wallet does not support message signing!');
            const date = new Date().getHours()
            console.log(date)
            const message = `Sign in with your Solana account on ${date}`;
            const messageBytes = decodeUTF8(message);
            const signature = await signMessage?.(messageBytes);

            if (!ed25519.verify(signature, messageBytes, publicKey.toBytes())) throw new Error('Message signature invalid!');
            console.log('success', `Sign Message succeeded`);

            const data = {
                signature,
                publicKey: publicKey?.toString(),
                address:publicKey.toBase58()
            }
            const response = await axios.post(`${BACKEND_URL}/v1/user/auth/signin`, data, {
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            console.log('response', response.data.token);
            localStorage.setItem("token", response.data.token);

        } catch
            (error: any) {
            console.log('error', `Sign Message failed: ${error?.message}`);
        }
    }
    const handleWalletDisconnect = () => {
        localStorage.removeItem("token");
    };
    useEffect(() => {
        if (localStorage.getItem("token")== null || localStorage.getItem("token")== undefined) {
            SignAndSend();
        }
    }, [publicKey]);

    return (
        <div className="w-full flex justify-between items-center bg-gray-800 text-white p-4">
            <Link href="/" className="font-bold text-2xl text-center ">ClickBait</Link>
            <div className="flex gap-5 items-center">
                <Link href="/new" className="
            font-bold  text-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-900
            ">New Task
                </Link>
                   {
                       publicKey ? <WalletDisconnectButton onClick={handleWalletDisconnect} /> : <WalletMultiButtonDynamic/>
                   }

            </div>
        </div>
    );
}

export default Appbar;