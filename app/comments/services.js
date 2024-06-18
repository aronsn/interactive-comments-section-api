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

export const createComment = async (data) => {

    const document = {
        _id: new ObjectId(),
        content: data.content,
        createdAt: data.createdAt,
        score: data.score,
        user: {
            image: {
                png: `../public/avatars/image-${data.username}.png`,
                webp: `../public/avatars/image-${data.username}.webp`
            },
            username: data.username,
        },
    };

    let collection = await db.collection("comments");
    let result = await collection.insertOne(document);

    return result;
}

export const createReply = async (data) => {

    let document = {
        _id: new ObjectId(),
        content: data.content,
        createdAt: data.createdAt,
        score: data.score,
        replyingTo: data.replyingTo,
        user: {
            image: {
                png: `../public/avatars/image-${data.username}.png`,
                webp: `../public/avatars/image-${data.username}.webp`
            },
            username: data.username,
        },
        commentId: new ObjectId(data.id)
    };

    let collection = await db.collection("replies");
    let result = await collection.insertOne(document);

    return result;
}

export const updateComment = async (data) => {
    const query = { _id: new ObjectId(data.id) };
    const update = {
        $set: {
            content: data.newContent
        },
    };

    let collection = await db.collection("comments");
    let result = await collection.findOneAndUpdate(query, update);

    if (result == null) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}

export const updateReply = async (data) => {
    const query = { _id: new ObjectId(data.id) };
    const update = {
        $set: {
            content: data.newContent
        },
    };

    let collection = await db.collection("replies");
    let result = await collection.findOneAndUpdate(query, update);

    if (result == null) {
        throw new Error(`There is no reply that corresponds to "${data.id}"`);
    }

    return result;
}

export const removeComment = async (data) => {
    let collection = await db.collection("comments");
    let result = await collection.findOneAndDelete({ _id: new ObjectId(data.id) });

    if (result == null) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}

export const removeReply = async (data) => {
    let collection = await db.collection("replies");
    let result = await collection.findOneAndDelete({ _id: new ObjectId(data.id) });

    if (result == null) {
        throw new Error(`There is no reply that corresponds to "${data.id}"`);
    }

    return result;
}