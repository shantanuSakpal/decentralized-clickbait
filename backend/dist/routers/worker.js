"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bs58_1 = require("bs58");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const db_1 = require("../db");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
const connection = new web3_js_1.Connection(`https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const DEFAULT_TITLE = "Click the most appealing thumbnail";
const JWT_SECRET = process.env.JWT_SECRET;
// @ts-ignore
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
// @ts-ignore
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const AWS_REGION = process.env.AWS_REGION;
const s3config = {
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
};
const PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;
const s3Client = new client_s3_1.S3Client(s3config);
const TOTAL_SUBMISSIONS = 100;
const TOTAL_DECIMALS = 1000000;
//payout
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    console.log("userId", userId);
    const worker = yield prismaClient.worker.findFirst({
        where: { id: Number(userId) }
    });
    if (!worker) {
        return res.status(403).json({
            message: "Worker not found"
        });
    }
    // Ensure worker has enough pending amount to payout
    if (worker.pending_amount <= 0) {
        return res.status(400).json({
            message: "No pending amount to payout"
        });
    }
    const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
        fromPubkey: new web3_js_1.PublicKey("FrzdaX3Mwa8FRfeuXo9vTd7XVQvu6mauPMkCKkp4mP72"),
        toPubkey: new web3_js_1.PublicKey(worker.address),
        lamports: worker.pending_amount,
    }));
    console.log("payment inittaiated to ", worker.address);
    //convert string to uintarray
    // @ts-ignore
    const secretKey = (0, bs58_1.decode)(PRIVATE_KEY);
    const keypair = web3_js_1.Keypair.fromSecretKey(secretKey);
    // TODO: There's a double spending problem here
    // The user can request the withdrawal multiple times
    // Can u figure out a way to fix it?
    let signature = "";
    try {
        signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
    }
    catch (e) {
        return res.json({
            message: "Transaction failed"
        });
    }
    console.log(signature);
    //update the worker's pending and locked amount
    yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
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
        });
        yield tx.payouts.create({
            data: {
                worker_id: Number(userId),
                amount: worker.pending_amount,
                status: "Processing",
                signature: signature
            }
        });
    }));
    //send transaction to solana blockchain
    //actual payout logic
    res.json({
        message: "transaction success"
    });
}));
//to get balance
router.get("/balance", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const worker = yield prismaClient.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_amount,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount,
    });
}));
//to make a submission
router.post("/submission", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedBody = types_1.createSubmissionInput.safeParse(body);
    if (parsedBody.success) {
        const task = yield (0, db_1.getNextTask)(Number(userId));
        console.log(task);
        if (!task || (task === null || task === void 0 ? void 0 : task.id) !== Number(parsedBody.data.taskId)) {
            return res.status(411).json({
                message: "Incorrect task id"
            });
        }
        //0.1 sol is default for every task
        //task.amount is the total number of votes (vote limit) creator has set for the task
        const amount = (0.1 * 1000000000 / Number(task.amount)).toString(); //units lamports
        console.log("reward recieved: ", amount, " lamports");
        const submission = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parsedBody.data.selection),
                    worker_id: userId,
                    task_id: Number(parsedBody.data.taskId),
                    amount: Number(amount)
                }
            });
            yield tx.worker.update({
                where: {
                    id: userId,
                },
                data: {
                    pending_amount: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNextTask)(Number(userId));
        let next = nextTask != null ? nextTask : "no more tasks";
        res.json({
            task: next,
            amount
        });
    }
    else {
        res.status(411).json({
            message: "Incorrect inputs"
        });
    }
}));
//next task
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    const userId = req.userId;
    const task = yield (0, db_1.getNextTask)(Number(userId));
    if (!task) {
        res.status(411).json({
            message: "No more tasks left for you to review"
        });
    }
    else {
        res.json({
            task
        });
    }
}));
//this route will give the download link of the image, valid for 5 mins
router.get("/generateDownloadUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    // fileS3Key is the bucket path of file without the bucket name.
    const params = {
        Key: `/fiver/${userId}/image.jpg`, // the file path in the bucket, like `userId/image.jpg`
        Bucket: "shantanu-decentralized-fiver",
    };
    const command = new client_s3_1.GetObjectCommand(params);
    //gives the url to download the file, valid for 5 mins
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
        expiresIn: 5 * 60,
    });
    res.json({ url });
}));
//sign in with wallet
router.post("/auth/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { publicKey, signature } = req.body;
    const date = new Date().getHours();
    const message = new TextEncoder().encode(`Sign in with your Solana account on ${date}`);
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    console.log("signin", result);
    if (!result) {
        return res.status(411).json({
            message: "Incorrect signature"
        });
    }
    const user = yield prismaClient.worker.upsert({
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
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
        //@ts-ignore
    }, JWT_SECRET);
    res.json({ token });
}));
exports.default = router;
