import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    //get token from user, in the authorization header
    const authHeader = req.headers["authorization"] ?? "";
    // console.log(authHeader)
    try {
        const decoded = jwt.verify(authHeader, JWT_SECRET);
        // // console.log(decoded);
        // @ts-ignore
        if (decoded.userId) {
            // @ts-ignore
            req.userId = decoded.userId;
            // @ts-ignore
            console.log("userId", req.userId)
            return next();
        } else {
            return res.status(403).json({
                message: "You are not logged in"
            })
        }
    } catch (e) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}

export function workerMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"] ?? "";

    // console.log(authHeader);
    try {
        const decoded = jwt.verify(authHeader, JWT_SECRET);
        // @ts-ignore
        if (decoded.userId) {
            // @ts-ignore
            req.userId = decoded.userId;
            return next();
        } else {
            return res.status(403).json({
                message: "You are not logged in"
            })
        }
    } catch (e) {
        return res.status(403).json({
            message: "You are not logged in"
        })
    }
}