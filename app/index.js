import express from "express";
import cors from "cors";
import comments from "./comments/routes.js";

const app = express();

app.use(express.static('dist'));

app.use(cors());
app.use(express.json());
app.use("/api/comments", comments);

export default app;

