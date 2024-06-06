"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubmissionInput = exports.userDetails = exports.createTaskInput = void 0;
const zod_1 = __importDefault(require("zod"));
exports.createTaskInput = zod_1.default.object({
    options: zod_1.default.array(zod_1.default.object({
        imageUrl: zod_1.default.string()
    })),
    title: zod_1.default.string().optional(),
    signature: zod_1.default.string(),
    amount: zod_1.default.string()
});
exports.userDetails = zod_1.default.object({
    signature: zod_1.default.string(),
    publicKey: zod_1.default.string(),
    address: zod_1.default.string(),
    username: zod_1.default.string().optional(),
    email: zod_1.default.string().optional()
});
exports.createSubmissionInput = zod_1.default.object({
    taskId: zod_1.default.string(),
    selection: zod_1.default.string(),
});
