import React from 'react';
import Link from "next/link";

function Appbar() {
    const connectWallet = async () => {

    }
    return (
        <div className="w-full flex justify-between items-center bg-gray-800 text-white p-4">
            <Link href="/" className="font-bold text-2xl text-center ">ClickBait</Link>
            <div className="flex gap-5 items-center">
                <Link href="/new" className="
            font-bold  text-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-900
            ">New Task
                </Link>
                <button onClick={connectWallet} className="
            font-bold  text-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-900
            ">Connect Wallet
                </button>
            </div>
        </div>
    );
}

export default Appbar;