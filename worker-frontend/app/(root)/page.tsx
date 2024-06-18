"use client";
import Appbar from "@/components/Appbar";
import {Hero} from "@/components/Hero";
import {useEffect, useState} from "react";
import axios from "axios";
import CurrentTask from "@/components/CurrentTask";
import {Task} from "@/types";

export default function Home() {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

    const [currentTask, setCurrentTask] = useState<Task>({} as Task);
    const [loading, setLoading] = useState<boolean>(false);
    const [balance, setBalance] = useState<{ pendingAmount: number, totalAmount: number }>({
        pendingAmount: 0,
        totalAmount: 0
    });
    const [submitting, setSubmitting] = useState<boolean>(false)

    async function getNextTask(): Promise<Task> {
        setLoading(true);
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {}
        try {
            const response = await axios.get(`${BACKEND_URL}/v1/worker/nextTask`, {
                headers: headers
            });

            setLoading(false);
            return response.data.task;
        } catch (error: any) {
            // Handle other errors here
            console.error('Error:', error.response.data.message);
            setLoading(false);
            return {} as Task;
        }
    }

    const handleOptionClick = async (taskId: number, optionId: number): Promise<Task> => {
        setSubmitting(true);
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {
            "taskId": taskId.toString(),
            "selection": optionId.toString(),
        }
        const response = await axios.post(`${BACKEND_URL}/v1/worker/submission`, data, {
            headers: headers
        });
        console.log("submitted")
        setCurrentTask(response.data.task)
        getBalance()
        setSubmitting(false);
        return response.data.task
    };

    async function getBalance(): Promise<void>{
        setLoading(true);
        console.log("getting balance")
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {}
        const response = await axios.get(`${BACKEND_URL}/v1/worker/balance`, {
            headers: headers
        });
        setBalance(response.data)
        setLoading(false);

    }

    useEffect(() => {
        getNextTask().then((task) => {
            console.log(task)
            getBalance()
            setCurrentTask(task)
        }).catch((e) => {
                console.log(e)
            }
        )

    }, [])
    const user = localStorage.getItem("token")
    return (
        <main>
            <Appbar balance={balance} getBalance={getBalance} />
            <Hero/>
            {
                user ? (

                    loading ? (
                        <p className="p-5 font-bold w-full text-center">Loading task...</p>
                    ) : (
                        <CurrentTask handleOptionClick={handleOptionClick} task={currentTask}/>
                    )


                ) : (
                    <p className="p-10 text-2xl">Not logged in</p>
                )
            }
        </main>
    );
}