"use client";
import React, {useState} from 'react';
import {UploadImage} from "@/components/UploadImage";
import {PublicKey, SystemProgram, Transaction} from '@solana/web3.js';
import axios from "axios";
import {useRouter} from "next/navigation";
import {useWallet, useConnection} from '@solana/wallet-adapter-react';

const PARENT_WALLET_ADDRESS = "FrzdaX3Mwa8FRfeuXo9vTd7XVQvu6mauPMkCKkp4mP72"
import {toast} from 'react-toastify';
import {WalletSendTransactionError} from "@solana/wallet-adapter-base";

function Upload() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

    const [images, setImages] = useState<Array<{ imageUrl: string }>>([]);
    const [title, setTitle] = useState("");
    const [txSignature, setTxSignature] = useState<string>();
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState("");
    const router = useRouter();
    const {publicKey, sendTransaction} = useWallet();
    const {connection} = useConnection();


    async function checkTransaction(signature: string) {
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        console.log("frontend verifgyo...", signature)
        const data = {

            "signature": signature,

        }
        const response = await axios.post(`${BACKEND_URL}/v1/user/checkTx`, data, {
            headers: headers
        });
        console.log(response.data)
        return response.data
    }

    async function makePayment() {

        try {
            if (!publicKey) {
                toast.error('Please connect your wallet to continue.');
                return;
            }

            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: new PublicKey(PARENT_WALLET_ADDRESS),
                    lamports: 100000000,
                })
            );

            const {
                context: {slot: minContextSlot},
                value: {blockhash, lastValidBlockHeight}
            } = await connection.getLatestBlockhashAndContext();

            const signature = await sendTransaction(transaction, connection, {minContextSlot});

            await connection.confirmTransaction({blockhash, lastValidBlockHeight, signature});
            setTxSignature(signature);
            toast.success('Payment successful!');
            console.log('signature', signature);

        } catch (error) {
            if (error instanceof WalletSendTransactionError) {
                toast.error('User rejected the transaction.');
            } else {
                toast.error('An error occurred while making the payment.');
                console.error('Error in makePayment:', error);
            }
        }
    }


    async function onSubmit() {

        setLoading(true);

        //check vaule of title
        if (title.length < 3) {
            alert("Title should be atleast 3 characters long");
            setLoading(false);
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {
            "options": images,
            "title": title,
            "signature": txSignature,
            "amount": amount.toString()
        }
        const response = await axios.post(`${BACKEND_URL}/v1/user/addTask`, data, {
            headers: headers
        });
        // console.log(response.data.message)
        //if resopnse status is 411

        setLoading(false);
        console.log("task added successfully with id- ", response.data.task_id)
        toast.success('Task added successfully!');
        router.push("/")
        return response.data.task_id

    }

    return (
        <div className="flex justify-center">

            <div className="max-w-screen-lg w-full">
                <div className="text-xl font-bold text-left pt-2 w-full pl-4">
                    Create new task
                </div>

                <label className="pl-4 block mt-2 text-md font-medium text-gray-900 ">Task details</label>

                <input onChange={(e) => {
                    setTitle(e.target.value);
                }} type="text" id="first_name"
                       className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                       placeholder="Tell us about your thumbnail..." required/>

                <label className="pl-4 block mt-2 text-md font-medium text-gray-900 ">Reward for this task</label>

                <input onChange={(e) => {
                    setAmount(e.target.value);
                }} type="text" id="amount"
                       className="ml-4 mt-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                       placeholder="Amount" required/>

                <label className="pl-4 block mt-8 text-md font-medium text-gray-900 ">Add Thumbnails</label>
                <div className="flex justify-center pt-4 max-w-screen-lg">
                    {images.map((image, index) => <UploadImage key={index} image={image?.imageUrl}
                                                               onImageAdded={(imageUrl) => {
                                                                   setImages(i => [...i, {imageUrl}]);
                                                               }}/>)}
                </div>

                <div className=" pt-2 flex justify-center">
                    <UploadImage onImageAdded={(imageUrl) => {
                        setImages(i => [...i, {imageUrl}]);
                    }}/>
                </div>

                <div className="flex justify-center">
                    {
                        loading ? (
                            <p>Creating task...</p>

                        ) : (
                            <button onClick={() => {
                                //1,000,000,000 lamports = 1 sol
                                txSignature ? onSubmit() : makePayment()
                            }} type="button"
                                    className="mt-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
                                {txSignature ? "Submit Task" : "Pay 0.1 SOL"}
                            </button>
                        )
                    }

                </div>

            </div>
        </div>
    );
}

export default Upload;