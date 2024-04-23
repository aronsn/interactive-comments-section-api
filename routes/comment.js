import express from "express";
import db from "../db/connection.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.route("/")
    .get(async (req, res) => {
        try {
            let collection = await db.collection("comments");
            let results = await collection.find({}).toArray();
            res.send(results).status(200);
        } catch (error) {
            console.error(error);
            res.status(500).send("Error fetching comments");
        }
    }).post(async (req, res) => {

    }).patch(async (req, res) => {

    })

export default router;