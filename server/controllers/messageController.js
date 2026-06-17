const Message = require('../models/Message');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const {
    createChatStream,
    buildMessageHistory,
} = require('../services/groqService');

const createLocalChatTitle = (content) => {
    const normalized = content
        .replace(/\s+/g, ' ')
        .replace(/[`*_#>[\]()]/g, '')
        .trim();

    if (!normalized) return 'New IntelliChat';
    return normalized.length > 50 ? `${normalized.slice(0, 47)}...` : normalized;
};

const getGroqErrorMessage = (error) => {
    const upstreamMessage = error.error?.message || error.message || '';

    if (error.status === 413 && upstreamMessage.includes('tokens per minute')) {
        return 'This conversation is too large for the current Groq rate limit. I trimmed context for future requests; please try again in a moment.';
    }

    if (error.status === 429) {
        return 'Groq is rate-limiting requests right now. Please wait a moment and try again.';
    }

    if (error.status === 401 || error.status === 403) {
        return 'Groq API authentication failed. Please check your API key.';
    }

    if (error.status === 400 && error.error?.message) {
        return error.error.message;
    }

    return 'AI service error. Please try again.';
};

/**
 * @desc    Send a message and stream back the AI response (SSE)
 * @route   POST /api/message/send
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
    try {
        const { chatId, content } = req.body;

        if (!chatId || !content) {
            return res.status(400).json({
                success: false,
                message: 'chatId and content are required.',
            });
        }

        if (!mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat ID.',
            });
        }

        // Verify chat belongs to user
        const chat = await Chat.findOne({ _id: chatId, userId: req.user._id });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found.' });
        }

        // Process uploaded files
        const attachments = (req.files || []).map((file) => ({
            url: `/uploads/${file.filename}`,
            filename: file.originalname,
            fileType: file.mimetype.startsWith('image/')
                ? 'image'
                : file.mimetype.startsWith('audio/')
                    ? 'audio'
                    : 'file',
            size: file.size,
        }));

        // Save user message to DB
        const userMessage = await Message.create({ chatId, role: 'user', content, attachments });

        // Title locally to avoid spending an extra model request before the reply.
        if (chat.title === 'New IntelliChat') {
            const title = createLocalChatTitle(content);
            await Chat.findByIdAndUpdate(chatId, { title });
        }

        // Fetch the latest conversation window, then restore chronological order.
        const history = (await Message.find({ chatId }).sort({ createdAt: -1 }).limit(12)).reverse();
        const messageHistory = buildMessageHistory(history);

        // Set SSE headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');

        // Stream tokens from Groq service
        console.log('Starting Groq stream with history:', messageHistory);
        const stream = await createChatStream(messageHistory);
        console.log('Stream created successfully');
        let fullContent = '';

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
                fullContent += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            }
        }
        console.log('Stream finished, full content length:', fullContent.length);

        if (!fullContent.trim()) {
            throw new Error('AI service returned an empty response.');
        }

        // Save complete AI response to DB
        const assistantMessage = await Message.create({
            chatId,
            role: 'assistant',
            content: fullContent,
        });

        // Signal end of stream with both saved messages
        res.write(
            `data: ${JSON.stringify({ done: true, userMessage, assistantMessage })}\n\n`
        );
        res.end();
    } catch (error) {
        console.error('Message send error:', error);

        const errorMessage = getGroqErrorMessage(error);

        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
        } else {
            res.status(error.status || 500).json({
                success: false,
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' && {
                    detail: error.error?.message || error.message,
                }),
            });
        }
    }
};

/**
 * @desc    Edit a user message and re-generate AI response
 * @route   PUT /api/message/:id
 * @access  Private
 */
const editMessage = async (req, res, next) => {
    try {
        const { content } = req.body;
        const messageId = req.params.id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ success: false, message: 'Invalid message ID.' });
        }

        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found.' });
        }

        // Verify ownership via chat
        const chat = await Chat.findOne({ _id: message.chatId, userId: req.user._id });
        if (!chat) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }

        // Update the message content
        message.content = content;
        await message.save();

        // Delete all messages created AFTER this one in the same chat
        await Message.deleteMany({
            chatId: message.chatId,
            createdAt: { $gt: message.createdAt },
        });

        // Set up streaming for the new response
        const history = (await Message.find({ chatId: message.chatId }).sort({ createdAt: -1 }).limit(12)).reverse();
        const messageHistory = buildMessageHistory(history);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');

        const stream = await createChatStream(messageHistory);
        let fullContent = '';

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || '';
            if (delta) {
                fullContent += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
            }
        }

        if (!fullContent.trim()) {
            throw new Error('AI service returned an empty response.');
        }

        const assistantMessage = await Message.create({
            chatId: message.chatId,
            role: 'assistant',
            content: fullContent,
        });

        res.write(`data: ${JSON.stringify({ done: true, userMessage: message, assistantMessage })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Message edit error:', error);
        const errorMessage = getGroqErrorMessage(error);

        if (!res.headersSent) {
            res.status(error.status || 500).json({
                success: false,
                message: errorMessage,
                ...(process.env.NODE_ENV === 'development' && {
                    detail: error.error?.message || error.message,
                }),
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
        }
    }
};

/**
 * @desc    Get all messages for a chat
 * @route   GET /api/message/:chatId
 * @access  Private
 */
const getMessages = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.chatId)) {
            return res.status(400).json({ success: false, message: 'Invalid chat ID.' });
        }

        const chat = await Chat.findOne({
            _id: req.params.chatId,
            userId: req.user._id,
        });
        if (!chat) {
            return res.status(404).json({ success: false, message: 'Chat not found.' });
        }

        const messages = await Message.find({ chatId: req.params.chatId }).sort({
            createdAt: 1,
        });

        res.status(200).json({ success: true, messages });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendMessage, getMessages, editMessage };
