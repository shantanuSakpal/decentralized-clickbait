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
const router = (0, express_1.Router)();
const prismaClient = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
//sign in with wallet
//signing a message
router.post("/auth/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // todo: sign in with wallet
    const walletAddress = "0x5637a0B1b170546cC8Aba039c863b49B1EbF6d46";
    const useremail = "shantnu@gmail.com";
    const username = "shntanu";
    //get the userId from db, upsert is like, if user exits, return it, else create it
    const user = yield prismaClient.user.upsert({
        where: {
            address: walletAddress
        },
        update: {},
        create: {
            address: walletAddress,
            email: useremail,
            name: username
        }
    });
    const token = jsonwebtoken_1.default.sign({
        userId: user.id
        //@ts-ignore
    }, JWT_SECRET);
    res.json({ token });
}));
exports.default = router;
