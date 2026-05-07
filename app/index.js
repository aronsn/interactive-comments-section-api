import express from "express";
import cors from "cors";
import comments from "./comments/routes.js";

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/comments", comments);

export default app;