import express from "express";
import workerRouter from "./routers/worker"
import userRouter from "./routers/user"
const cors = require('cors');

const app = express();
app.use(express.json())
app.use(cors({
    origin: '*', // Update with your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
}));
app.use("/v1/user", userRouter)
app.use("/v1/worker", workerRouter)

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})