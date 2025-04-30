const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HiringRequestSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'ClientUser',
        required: true
    },
    translator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectDetails: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String
    }
});

const HiringRequest = mongoose.model("HiringRequest", HiringRequestSchema);

module.exports = HiringRequest; 