const Chat = require('../models/Chat');
const Message = require('../models/Message');

/**
 * @desc    Create a new IntelliChat
 * @route   POST /api/chat/create
 * @access  Private
 */
const createChat = async (req, res, next) => {
    try {
        const { title } = req.body;
        const chat = await Chat.create({
            userId: req.user._id,
            title: title || 'New IntelliChat',
        });
        res.status(201).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all chats for the logged-in user
 * @route   GET /api/chat/all
 * @access  Private
 */
const getAllChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ userId: req.user._id }).sort({
            createdAt: -1,
        });
        res.status(200).json({ success: true, chats });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a single chat by ID
 * @route   GET /api/chat/:id
 * @access  Private
 */
const getChatById = async (req, res, next) => {
    try {
        const chat = await Chat.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!chat) {
            return res
                .status(404)
                .json({ success: false, message: 'Chat not found.' });
        }
        res.status(200).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Rename / update a chat title
 * @route   PUT /api/chat/:id
 * @access  Private
 */
const updateChat = async (req, res, next) => {
    try {
        const { title, pinned, archived } = req.body;
        const update = {};
        if (title !== undefined) update.title = title;
        if (pinned !== undefined) update.pinned = pinned;
        if (archived !== undefined) update.archived = archived;

        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            update,
            { new: true, runValidators: true }
        );
        if (!chat) {
            return res
                .status(404)
                .json({ success: false, message: 'Chat not found.' });
        }
        res.status(200).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete a chat and all its messages
 * @route   DELETE /api/chat/:id
 * @access  Private
 */
const deleteChat = async (req, res, next) => {
    try {
        const chat = await Chat.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!chat) {
            return res
                .status(404)
                .json({ success: false, message: 'Chat not found.' });
        }
        // Delete all messages in this chat
        await Message.deleteMany({ chatId: req.params.id });
        res
            .status(200)
            .json({ success: true, message: 'Chat deleted successfully.' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete all chats for the user
 * @route   DELETE /api/chat/all
 * @access  Private
 */
const deleteAllChats = async (req, res, next) => {
    try {
        const chats = await Chat.find({ userId: req.user._id });
        const chatIds = chats.map((c) => c._id);
        await Message.deleteMany({ chatId: { $in: chatIds } });
        await Chat.deleteMany({ userId: req.user._id });
        res
            .status(200)
            .json({ success: true, message: 'All chats cleared.' });
    } catch (error) {
        next(error);
    }
};


/**
 * @desc    Generate or return share token for a chat
 * @route   POST /api/chat/:id/share
 * @access  Private
 */
const shareChat = async (req, res, next) => {
    try {
        let chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found.' });
        }
        // Generate token only once
        if (!chat.shareToken) {
            chat.shareToken = require('crypto').randomUUID();
            await chat.save();
        }
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const shareUrl = `${clientUrl.replace(/\/$/, '')}/share/${chat.shareToken}`;
        res.status(200).json({ success: true, shareUrl, shareToken: chat.shareToken });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get a shared chat by token
 * @route   GET /api/chat/share/:token
 * @access  Public
 */
const getSharedChat = async (req, res, next) => {
    try {
        const chat = await Chat.findOne({ shareToken: req.params.token }).select(
            'title createdAt updatedAt shareToken'
        );

        if (!chat) {
            return res.status(404).json({ success: false, message: 'Shared chat not found.' });
        }

        const messageCount = await Message.countDocuments({ chatId: chat._id });

        res.status(200).json({
            success: true,
            chat,
            messageCount,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Copy a shared chat into the current user's account
 * @route   POST /api/chat/share/:token/continue
 * @access  Private
 */
const continueSharedChat = async (req, res, next) => {
    try {
        const sourceChat = await Chat.findOne({ shareToken: req.params.token });

        if (!sourceChat) {
            return res.status(404).json({ success: false, message: 'Shared chat not found.' });
        }

        const chat = await Chat.create({
            userId: req.user._id,
            title: `Continued: ${sourceChat.title}`,
        });

        const sourceMessages = await Message.find({ chatId: sourceChat._id }).sort({ createdAt: 1 });
        if (sourceMessages.length > 0) {
            await Message.insertMany(
                sourceMessages.map((message) => ({
                    chatId: chat._id,
                    role: message.role,
                    content: message.content,
                    attachments: message.attachments,
                }))
            );
        }

        res.status(201).json({ success: true, chat });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createChat,
    getAllChats,
    getChatById,
    updateChat,
    deleteChat,
    deleteAllChats,
    shareChat,
    getSharedChat,
    continueSharedChat,
};
