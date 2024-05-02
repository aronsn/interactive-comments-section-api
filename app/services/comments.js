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

export const createComment = async (document) => {
    let collection = await db.collection("comments");
    let result = await collection.insertOne(document);
    return result;
}

export const createReply = async (document) => {
    let collection = await db.collection("replies");
    let result = await collection.insertOne(document);

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