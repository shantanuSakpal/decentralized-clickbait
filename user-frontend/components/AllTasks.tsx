import React, {useEffect, useState} from 'react';
import Link from "next/link";
import axios from "axios";
import {Task,Tasks} from "@/types";
import {useRouter} from "next/navigation";


function AllTasks() {
    const [tasks, setTasks] = useState<Array<Task>>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter()
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

    async function getAllTasks():Promise<Tasks> {
        const headers = {
            'Content-Type': 'application/json',
            'authorization': localStorage.getItem("token")
        }
        const response = await axios.get(`${BACKEND_URL}/v1/user/alltasks`, {
            headers: headers
        });
        setTasks(response.data.tasks);
        setLoading(false);
        return response.data.tasks;

    }

    useEffect(() => {
        getAllTasks();
    }, [])

    return (
        <div className="px-10">
            <p className=" font-bold">Your Tasks</p>
            <div className="flex gap-5 flex-wrap   w-full mt-5">
                {
                    loading ? <p>Loading...</p> : tasks.length > 0 ? tasks.map((task: Task, index: number) => {
                        return (
                            <div onClick={() => {
                                router.push(`/task/${task.id}`)
                            }} key={index}
                                 className="w-60 p-2 border-2 border-gray-200  hover:cursor-pointer hover:border-gray-400 rounded-lg ">
                                <p className="font-bold">{task.title}</p>
                                <p>{task.amount}</p>
                            </div>
                        )
                    }) : <p>No tasks available</p>

                }
            </div>
        </div>
    );
}

export default AllTasks;