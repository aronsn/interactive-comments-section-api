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
    })
    .post(async (req, res) => {
        try {
            let newDocument = {
                _id: new ObjectId(),
                content: req.body.content,
                createdAt: req.body.createdAt,
                score: req.body.score,
                user: {
                    image: {
                        png: `../public/avatars/image-${req.body.user.username}.png`,
                        webp: `../public/avatars/image-${req.body.user.username}.webp`
                    },
                    username: req.body.user.username,
                },
                replies: [],
            };
            let collection = await db.collection("comments");
            let result = await collection.insertOne(newDocument);
            res.send(result).status(201);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error adding creating comment");
        }
    })
    .patch(async (req, res) => {
        try {
            let newArrayObject = {
                _id: new ObjectId(),
                content: req.body.content,
                createdAt: req.body.createdAt,
                score: req.body.score,
                replyingTo: req.body.replyingTo,
                user: {
                    image: {
                        png: `../public/avatars/image-${req.body.user.username}.png`,
                        webp: `../public/avatars/image-${req.body.user.username}.webp`
                    },
                    username: req.body.user.username,
                }
            };

            const query = { _id: new ObjectId(req.body.id) };
            const updates = {
                $set: {
                    replies: [newArrayObject],
                },
            };

            let collection = await db.collection("comments");
            let result = await collection.updateOne(query, updates);
            res.send(result).status(204);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error updating record");
        }
    })

// TODO - delete route, patch route

export default router;