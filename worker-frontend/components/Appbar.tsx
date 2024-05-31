import React, {useEffect, useState} from 'react';
import axios from "axios";

function Appbar({balance}:{ balance: { pendingAmount: number, totalAmount: number }}) {
    const connectWallet = async () => {

    }


    return (
        <div className="w-full flex justify-between items-center bg-gray-800 text-white p-4">
            <div className="font-bold text-2xl text-center ">ClickBait</div>
            <div className="flex flex-row gap-5 items-center">
                <div className="font-bold text-center">Your Rewards: {balance.pendingAmount}</div>
                <button onClick={connectWallet} className="
            font-bold  text-center bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-900
            ">Connect Wallet
                </button>
            </div>
        </div>
    );
}

export default Appbar;