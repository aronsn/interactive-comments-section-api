import db from "../../db/connection.js";
import { ObjectId } from "mongodb";


export const allComments = async () => {
    let collection = await db.collection("comments");
    let results = await collection.aggregate([
        {
            $lookup: {
                from: "replies",
                localField: "_id",
                foreignField: "commentId",
                as: "replies"
            }
        }
    ]).toArray();
    return results;
}

export const createComment = async (content, createdAt, score, username) => {

    const document = {
        _id: new ObjectId(),
        content: content,
        createdAt: createdAt,
        score: score,
        user: {
            image: {
                png: `../public/avatars/image-${username}.png`,
                webp: `../public/avatars/image-${username}.webp`
            },
            username: username,
        },
        replies: [],
    };

    let collection = await db.collection("comments");

    let result = await collection.insertOne(document);

    return result;
}

export const createReply = async (document) => {
    let collection = await db.collection("replies");
    let result = await collection.insertOne(document);

    return result;

}

export const updateComment = async (targetId, newContent) => {
    const query = { _id: new ObjectId(targetId) };
    const updates = {
        $set: {
            content: newContent
        },
    };

    let collection = await db.collection("comments");
    let result = await collection.updateOne(query, updates);
    return result;
}

export const updateReply = async (targetId, newContent) => {
    const query = { _id: new ObjectId(targetId) };
    const updates = {
        $set: {
            content: newContent
        },
    };

    let collection = await db.collection("replies");
    let result = await collection.updateOne(query, updates);
    return result;
}

export const removeComment = async (targetId) => {
    let collection = await db.collection("comments");
    let result = collection.deleteOne({ _id: new ObjectId(targetId) });
    return result;
}

export const removeReply = async (targetId) => {
    let collection = await db.collection("replies");
    let result = collection.deleteOne({ _id: new ObjectId(targetId) });
    return result;
}