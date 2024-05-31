"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/auth/signin", (req, res) => {
    res.send("Worker Sign In");
});
exports.default = router;
