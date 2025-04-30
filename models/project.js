const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectSchema = new Schema({
    client: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    translator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    sourceLanguage: {
        type: String,
        required: true
    },
    targetLanguage: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['document', 'website', 'video', 'audio', 'other']
    },
    files: [{
        url: String,
        filename: String,
        originalName: String,
        size: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    budget: {
        type: Number,
        required: true
    },
    deadline: {
        type: Date,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    messages: [{
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        text: String,
        date: {
            type: Date,
            default: Date.now
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
projectSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Project', projectSchema); 