"use client"
import React, {useEffect, useState} from 'react';
import Appbar from "@/components/Appbar";
import axios from "axios";
import {Task} from "@/types";
import Image from "next/image";
import Link from "next/link";

function Page(props:any) {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

    const [loading, setLoading] = useState(false);
    const [task, setTask] = useState<Task>({})
const [stats,setStats] = useState()
    async function getTask(taskId: number) {
        setLoading(true)
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {
            task_id: taskId
        }
        const response = await axios.post(`${BACKEND_URL}/v1/user/getTask`, data, {
            headers: headers
        });
        setTask(response.data.task)
        setLoading(false)
        console.log(response.data.task)
    }

    async function getStats(taskId: number) {
        setLoading(true)
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const data = {
            task_id: taskId
        }
        const response = await axios.post(`${BACKEND_URL}/v1/user/taskStatus`, data, {
            headers: headers
        });
        setStats(response.data)
        setLoading(false)
        console.log(response.data)
    }


    useEffect(() => {
        const currentPath = window.location.pathname;
        const pathParts = currentPath.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        getTask(Number(lastPart))
        getStats(Number(lastPart))
    }, []);

    return (
        <div>
            <Appbar/>
            {
                loading ? (
                    <p>loading task</p>

                ) : (
                    task.id ? (
                        <div className="p-5 w-full">
                            <Link href="/" className="flex gap-2 items-center justify-center px-2 py-1 text-sm  bg-gray-200 rounded-lg w-fit hover:bg-gray-300"><span>&larr;</span><p>Back to dashboard</p></Link>
                            <h2 className="text-xl font-bold mt-5">{task.title}</h2>
                            <p>Reward: {Number(task.amount) / 1000} eth</p>
                            <div className="flex gap-3 flex-wrap p-5 justify-center">
                                {task.options?.map((option: { id: number; image_url: string; }) => (
                                    <div
                                        key={option.id}
                                    >
                                        <Image width="500" height="500" className="w-96 aspect-video bg-cover"
                                               src={option.image_url} alt={`Option ${option.id}`}/>
                                        {
                                            stats && <p className="p-2 text-sm text-center">
                                                Votes: {stats.find(stat => stat.option_id === option.id)?.count || 0}
                                            </p>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (<p>No such task</p>)
                )

            }


        </div>
    );
}

export default Page;