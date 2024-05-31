import e, {Router} from "express";
import {PrismaClient} from "@prisma/client";
import jwt from "jsonwebtoken"
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommandInput,
    PutObjectCommand,
    S3ClientConfig,
    GetObjectCommandInput
} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {authMiddleware, workerMiddleware} from "../middleware";
import {createSubmissionInput, createTaskInput, Option, Submission, Worker, Task, userDetails} from "../types";
import {getNextTask} from "../db";
import user from "./user";

const router = Router();
const prismaClient = new PrismaClient()
const DEFAULT_TITLE = "Click the most appealing thumbnail"
const JWT_SECRET = process.env.JWT_SECRET
// @ts-ignore
const AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID
// @ts-ignore
const AWS_SECRET_ACCESS_KEY: string = process.env.AWS_SECRET_ACCESS_KEY
const AWS_REGION = process.env.AWS_REGION
const s3config: S3ClientConfig = {
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
}

const s3Client = new S3Client(s3config);
const TOTAL_SUBMISSIONS = 100;
//routes

//to get balance
router.get("/balance", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const worker = await prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    })

    res.json({
        pendingAmount: worker?.pending_amount,
        lockedAmount: worker?.locked_amount,
    })
})



//to make a submission
router.post("/submission", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = createSubmissionInput.safeParse(body);

    if (parsedBody.success) {
        const task = await getNextTask(Number(userId));
        console.log(task)
        if (!task || task?.id !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            })
        }

        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();

        const submission = await prismaClient.$transaction(async tx => {
            const submission = await tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            })

            await tx.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            })

            return submission;
        })

        const nextTask = await getNextTask(Number(userId));
        let next = nextTask != null ? nextTask : "no more tasks"
        res.json({
            task:next,
            amount
        })


    } else {
        res.status(411).json({
            message: "Incorrect inputs"
        })

    }

})


//next task
router.get("/nextTask", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;

    const task = await getNextTask(Number(userId));

    if (!task) {
        res.status(411).json({
            message: "No more tasks left for you to review"
        })
    } else {
        res.json({
            task
        })
    }
})


//this route will give the download link of the image, valid for 5 mins
router.get("/generateDownloadUrl", authMiddleware, async (req: any, res: any) => {
    const userId = req.userId;
    // fileS3Key is the bucket path of file without the bucket name.
    const params: GetObjectCommandInput = {
        Key: `/fiver/${userId}/image.jpg`, // the file path in the bucket, like `userId/image.jpg`
        Bucket: "shantanu-decentralized-fiver",
    };

    const command = new GetObjectCommand(params);
    //gives the url to download the file, valid for 5 mins
    const url = await getSignedUrl(s3Client, command, {
        expiresIn: 5 * 60,
    });
    res.json({url})
})

//sign in with wallet
//signing a message
router.post("/auth/signin", async (req: any, res: any) => {
    // todo: sign in with wallet
    const body = req.body;
//check if body is correct
    const parseData = userDetails.safeParse(body)

    if (!parseData.success) {
        return res.status(411).json({
            message: "please pass address",
            error: parseData.error
        })
    }
    const walletAddress = parseData.data.address
    const email = parseData.data.email
    const username = parseData.data.username
    //get the userId from db, upsert is like, if user exits, return it, else create it
    const user = await prismaClient.worker.upsert({
        where: {
            address: walletAddress
        },
        update: {},
        create: {
            address: walletAddress,
            pending_amount: 0,
            locked_amount: 0
        }
    });

    const token = jwt.sign({
        userId: user.id
        //@ts-ignore
    }, JWT_SECRET)

    res.json({token})

});

//payout
router.post("/payout", workerMiddleware, async (req, res) => {
    // @ts-ignore
    const userId: string = req.userId;
    console.log("userId", userId)
    const worker = await prismaClient.worker.findFirst({
        where: {id: Number(userId)}

    })

    if (!worker) {
        return res.status(403).json({
            message: "Worker not found"
        })
    }

    const address = worker.address
    const txnId = "0xasdfadsffadsf"

    await prismaClient.$transaction(async tx => {
        await tx.worker.update({
            where: {
                id: Number(userId)
            },
            data: {
                pending_amount: {
                    decrement: worker.pending_amount
                },
                locked_amount: {
                    increment: worker.pending_amount
                }
            }
        })

        await tx.payouts.create({
            data: {
                worker_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: txnId
            }
        })
    })

    //send transaction to solana blockchain
    //actual payout logic
    res.json({
        message:"transaction initieated"
    })
})

export default router;