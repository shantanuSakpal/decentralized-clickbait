"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "secret";
function authMiddleware(req, res, next) {
    var _a;
    //get token from user, in the authorization header
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    console.log(authHeader);
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, JWT_SECRET);
        // // console.log(decoded);
        // @ts-ignore
        if (decoded.userId) {
            // @ts-ignore
            req.userId = decoded.userId;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You are not logged in"
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "You are not logged in"
        });
    }
}
exports.authMiddleware = authMiddleware;
function workerMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    // console.log(authHeader);
    try {
        const decoded = jsonwebtoken_1.default.verify(authHeader, JWT_SECRET);
        // @ts-ignore
        if (decoded.userId) {
            // @ts-ignore
            req.userId = decoded.userId;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You are not logged in"
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "You are not logged in"
        });
    }
}
exports.workerMiddleware = workerMiddleware;
