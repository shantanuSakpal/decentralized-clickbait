import React, {useState} from 'react';
import {CurrentTaskProps, Task} from "@/types";
import Image from "next/image";
import axios from "axios";

type CurrentTaskWithHandlerProps = CurrentTaskProps & {
    handleOptionClick: (taskId: number, optionId: number) => Promise<Task>;
};


const CurrentTask = ({
                         task,
                         handleOptionClick,
                     }: CurrentTaskWithHandlerProps) => {


    return (

        task.title ? (
            <div className="p-5 w-full">
                <h2 className="text-xl font-bold ">{task.title}</h2>
                <p>Reward: {Number(task.amount) / 1000} eth</p>
                <div className="flex gap-3 flex-wrap p-5 justify-center">
                    {task.options?.map((option: { id: number; image_url: string; }) => (
                        <div
                            className="cursor-pointer border-4 hover:border-blue-500 rounded-lg"
                            key={option.id}

                            onClick={() => handleOptionClick(task.id, option.id)}
                        >
                            <Image width="500" height="500" className="w-96 aspect-video bg-cover"
                                   src={option.image_url} alt={`Option ${option.id}`}/>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <p className="p-5 font-bold w-full text-center">No more tasks</p>
        ))

};

export default CurrentTask;