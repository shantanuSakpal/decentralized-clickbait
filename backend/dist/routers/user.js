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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const middleware_1 = require("../middleware");
const types_1 = require("../types");
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const db_1 = require("../db");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const PARENT_WALLET_ADDRESS = process.env.PARENT_WALLET_ADDRESS;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
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
const s3Client = new client_s3_1.S3Client(s3config);
const connection = new web3_js_1.Connection(`https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
//routes
router.post("/generateUploadUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    // fileS3Key is the bucket path of file without the bucket name.
    //generate random alpha numreic 6 char string
    function generateRandomString(length) {
        let s = '';
        while (s.length < length) {
            s += Math.random().toString(36).slice(2);
        }
        return s.slice(0, length);
    }
    const randomString = generateRandomString(6);
    const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
        Key: `fiver/${userId}/${randomString}.jpg`, // the file path in the bucket, like `userId/image.jpg`
        Bucket: "shantanu-decentralized-fiver",
        Conditions: [
            ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Expires: 3600
    });
    res.json({
        preSignedUrl: url,
        fields
    });
}));
//to get status of task, how many submission, etc
router.post("/taskStatus", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const taskId = body.task_id;
    //get the option ids that belong to that task
    const options = yield prismaClient.option.findMany({
        where: {
            task_id: Number(taskId)
        },
    });
    // console.log(options)
    const stats = yield Promise.all(options.map((option) => __awaiter(void 0, void 0, void 0, function* () {
        const submissions = yield prismaClient.submission.findMany({
            where: {
                option_id: option.id
            },
        });
        // Find length of the submissions array
        let n = submissions.length;
        return {
            option_id: option.id,
            count: n
        };
    })));
    res.json(stats);
}));
//get a task
router.post("/getTask", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const taskId = body.task_id;
    const task = yield (0, db_1.getTask)(userId, taskId);
    res.json({
        task: task
    });
}));
//check transaction
router.post("/checkTx", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    //check if body is correct
    const signature = body.signature;
    const user = yield prismaClient.user.findFirst({
        where: {
            id: userId
        }
    });
    console.log("verigiying payment backend", signature);
    //verfiy payment
    const transaction = yield connection.getTransaction(signature.toString(), {
        maxSupportedTransactionVersion: 1
    });
    //
    console.log(transaction);
    //check if amount = 0.1 sol
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
    }
    //check if parent wallet address is same
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    //check this money paid by this user address or a different address?
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent from wrong address"
        });
    }
    res.status(200).json({
        message: "payment valid"
    });
}));
//this route will generate tasks, given options and title
router.post("/addTask", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    //@ts-ignore
    const userId = req.userId;
    //check if body is correct
    const parseData = types_1.createTaskInput.safeParse(body);
    if (!parseData.success) {
        return res.status(411).json({
            message: "wrong input, options array of imageurls and title(optional) expected",
            error: parseData.error
        });
    }
    //a transaction makes sure both the transactions are fully carried out, or none of them do, so we do not create a half transaction
    const response = yield prismaClient.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        var _g;
        let task = yield tx.task.create({
            data: {
                title: (_g = parseData.data.title) !== null && _g !== void 0 ? _g : DEFAULT_TITLE,
                signature: parseData.data.signature,
                amount: parseData.data.amount,
                user_id: userId,
            }
        });
        yield tx.option.createMany({
            data: parseData.data.options.map((x) => ({
                image_url: x.imageUrl,
                task_id: task.id
            }))
        });
        return task;
    }));
    res.json({
        task_id: response.id
    });
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
//this route will upload the image, using an upload link, you have to send the file with it in body., valid for 5 mins
//sign in with wallet
//signing a message
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
    //get the userId from db, upsert is like, if user exits, return it, else create it
    const user = yield prismaClient.user.upsert({
        where: {
            address: publicKey
        },
        update: {},
        create: {
            address: publicKey,
            name: "user"
        }
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
        //@ts-ignore
    }, JWT_SECRET);
    res.json({ token });
}));
//route to get all tasks
router.get("/alltasks", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.userId;
    const tasks = yield prismaClient.task.findMany({
        where: {
            user_id: userId
        }
    });
    if (tasks.length < 0)
        res.status(404).json({
            message: "no tasks found"
        });
    res.json({
        tasks: tasks
    });
}));
exports.default = router;
