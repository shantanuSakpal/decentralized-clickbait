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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTask = exports.getNextTask = void 0;
const client_1 = require("@prisma/client");
const prismaClient = new client_1.PrismaClient();
const getNextTask = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    //get the first task which this worker has not submitted
    const task = yield prismaClient.task.findFirst({
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
    });
    return task;
});
exports.getNextTask = getNextTask;
const getTask = (userId, taskId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(taskId);
    //get the first task which this worker has not submitted
    const task = yield prismaClient.task.findFirst({
        where: {
            id: Number(taskId)
        },
        select: {
            id: true,
            amount: true,
            title: true,
            options: true
        }
    });
    return task;
});
exports.getTask = getTask;
