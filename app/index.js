import express from "express";
import cors from "cors";
import comments from "./routes/comments.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/comments", comments);

export default app;

