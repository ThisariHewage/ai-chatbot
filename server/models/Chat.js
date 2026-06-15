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
    },
    { timestamps: true }
);

// Index for faster queries
chatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);