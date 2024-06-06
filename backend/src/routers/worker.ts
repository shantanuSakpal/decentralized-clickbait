import e, {Router} from "express";
import {PrismaClient} from "@prisma/client";
import jwt from "jsonwebtoken"
import {encode, decode} from "bs58"
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
import nacl from "tweetnacl";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const connection = new Connection(`https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
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
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY
const s3Client = new S3Client(s3config);
const TOTAL_SUBMISSIONS = 100;
const TOTAL_DECIMALS = 1000_000;



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


    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey("FrzdaX3Mwa8FRfeuXo9vTd7XVQvu6mauPMkCKkp4mP72"),
            toPubkey: new PublicKey(worker.address),
            lamports:  worker.pending_amount,
        })
    );


    console.log("payment inittaiated to ",worker.address);
//convert string to uintarray
// @ts-ignore
    const secretKey = decode(PRIVATE_KEY);
    const keypair = Keypair.fromSecretKey(secretKey);

    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?
    let signature = "";
    try {
        signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair],
        );

    } catch(e) {
        return res.json({
            message: "Transaction failed"
        })
    }

    console.log(signature)

    //update the worker's pending and locked amount
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
                signature: signature
            }
        })
    })

    //send transaction to solana blockchain
    //actual payout logic
    res.json({
        message:"transaction initieated"
    })
})





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
    const {publicKey, signature} = req.body;
    const date = new Date().getHours()
    const message = new TextEncoder().encode(`Sign in with your Solana account on ${date}`);

    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
    );

    console.log("signin", result)
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        })
    }

    const user = await prismaClient.worker.upsert({
        where: {
            address: publicKey
        },
        update: {},
        create: {
            address: publicKey,
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


export default router;