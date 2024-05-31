import { PrismaClient } from "@prisma/client";

const prismaClient = new PrismaClient();

export const getNextTask = async (userId: number) => {

    //get the first task which this worker has not submitted
    const task = await prismaClient.task.findFirst({
        where: {
            done: false,
            submissions: {
                none: {
                    worker_id: userId
                }
            }
        },
        select: {
            id: true,
            amount: true,
            title: true,
            options: true
        }
    })

    return task
}

export const getTask = async (userId: number, taskId:number) => {
console.log(taskId)
    //get the first task which this worker has not submitted
    const task = await prismaClient.task.findFirst({
        where: {
            id:Number(taskId)
        },
        select: {
            id: true,
            amount: true,
            title: true,
            options: true
        }
    })

    return task
}