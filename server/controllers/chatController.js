const Chat = require('../models/Chat');
const Message = require('../models/Message');

/**
 * @desc    Create a new chat
 * @route   POST /api/chat/create
 * @access  Private
 */
const createChat = async (req, res, next) => {
    try {
        const { title } = req.body;
        const chat = await Chat.create({
            userId: req.user._id,
            title: title || 'New Chat',
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
        const { title } = req.body;
        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { title },
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

module.exports = {
    createChat,
    getAllChats,
    getChatById,
    updateChat,
    deleteChat,
    deleteAllChats,
};