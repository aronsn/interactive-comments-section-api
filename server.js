import express from "express";
import cors from "cors";
import record from "./routes/record.js";
import comments from "./routes/comment.js";
import db from "./db/connection.js";

const PORT = process.env.PORT || 5050;
const app = express();

app.use(cors());
app.use(express.json());
app.use("/comments", comments);

// start the Express server
app.listen(PORT, () => {
    let collection = db.collection("comments");

    console.log(`Server listening on port ${PORT}`);
    // console.log(collection);
});