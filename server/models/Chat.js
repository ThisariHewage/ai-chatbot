const mongoose = require('mongoose');


const chatSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            default: 'New IntelliChat',
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        pinned: {
            type: Boolean,
            default: false,
        },
        archived: {
            type: Boolean,
            default: false,
        },
        shareToken: {
            type: String,
        },
        continuedFromShareToken: {
            type: String,
        },
    },
    { timestamps: true }
);

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });
chatSchema.index(
    { userId: 1, continuedFromShareToken: 1 },
    { unique: true, partialFilterExpression: { continuedFromShareToken: { $exists: true } } }
);

module.exports = mongoose.model('Chat', chatSchema);
