import db from "../../db/connection.js";
import { ObjectId } from "mongodb";


export const getComments = async () => {
    let collection = db.collection("comments");
    let results = await collection.find().toArray();
    return results;
}

export const createComment = async (data) => {

    const document = {
        _id: new ObjectId(),
        content: data.content,
        createdAt: new Date(),
        score: data.score,
        user: {
            image: {
                png: `../public/avatars/image-${data.username}.png`,
                webp: `../public/avatars/image-${data.username}.webp`
            },
            username: data.username,
        },
        replies: [],
    };

    let collection = db.collection("comments");
    let result = await collection.insertOne(document);

    return result;
}

export const findComment = async (id) => {
    let collection = db.collection("comments");
    let result = await collection.findOne({ _id: new ObjectId(id) });

    if (!result) {
        result = await collection.findOne({ "replies._id": new ObjectId(id) });
        return result.replies.find(reply => new ObjectId(id).toString() === reply._id.toString());
    }

    return result;
}

export const createReply = async (data) => {
    let document = {
        _id: new ObjectId(),
        content: data.content,
        createdAt: new Date(),
        score: data.score,
        replyingTo: data.replyingTo,
        user: {
            image: {
                png: `../public/avatars/image-${data.username}.png`,
                webp: `../public/avatars/image-${data.username}.webp`
            },
            username: data.username,
        },
    };
    let collection = db.collection("comments");

    let result = await collection.findOne({ _id: new ObjectId(data.id) });
    let query = { _id: new ObjectId(data.id) };
    if (!result) {
        query = { "replies._id": new ObjectId(data.id) };
    }

    const append = {
        $push: {
            replies: document
        },
    };


    try {

        let result = await collection.findOneAndUpdate(query, append, {
            returnDocument: 'after',
        });


        if (!result) {
            throw new Error(`Comment with ID ${data.id} not found.`);
        }

        return result;
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }

}

export const updateCommentScore = async (data) => {
    const query = { _id: new ObjectId(data.id) };
    const update = {
        $inc: {
            score: data.score
        }
    };

    let collection = db.collection("comments");
    let result = await collection.findOneAndUpdate(query, update, {
        returnDocument: 'after'
    });

    if (result == null) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}

export const updateReplyScore = async (data) => {
    const query = { "replies._id": new ObjectId(data.id) };
    const update = {
        $inc: {
            "replies.$.score": data.score
        }
    };

    let collection = db.collection("comments");
    let result = await collection.findOneAndUpdate(query, update, {
        returnDocument: 'after'
    });

    if (result == null) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}


export const updateComment = async (data) => {
    const query = { _id: new ObjectId(data.id) };
    let update = {
        $set: {
            content: data.newContent
        },
    };

    let collection = db.collection("comments");
    let result = await collection.findOneAndUpdate(query, update, {
        returnDocument: 'after'
    });

    if (result == null) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}

export const updateReply = async (data) => {
    const query = { "replies._id": new ObjectId(data.id) };
    const update = {
        $set: {
            "replies.$.content": data.newContent
        },
    };

    let collection = db.collection("comments");
    let result = await collection.findOneAndUpdate(query, update, {
        returnDocument: 'after'
    });

    if (!result) {
        throw new Error(`There is no reply that corresponds to "${data.id}"`);
    }

    return result;
};

export const removeComment = async (data) => {
    let collection = db.collection("comments");
    let result = await collection.findOneAndDelete({ _id: new ObjectId(data.id) }, {
        returnDocument: 'after'
    });

    if (!result) {
        throw new Error(`There is no comment that corresponds to "${data.id}"`);
    }

    return result;
}

export const removeReply = async (data) => {
    let collection = db.collection("comments");

    let result = await collection.findOneAndUpdate(
        { "replies._id": new ObjectId(data.id) },
        {
            $pull: {
                replies: { _id: new ObjectId(data.id) }
            }
        },
        {
            returnDocument: 'after'
        }
    );

    if (!result) {
        throw new Error(`There is no reply that corresponds to "${data.id}"`);
    }

    return result;
}