const Message = require('../models/Message');
const Chat = require('../models/Chat');
const {
    createChatStream,
    buildMessageHistory,
    generateChatTitle,
} = require('../services/groqService');

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

        // Auto-generate a smart title from the first message (via AI)
        if (chat.title === 'New IntelliChat') {
            const title = await generateChatTitle(content);
            await Chat.findByIdAndUpdate(chatId, { title });
        }

        // Fetch conversation history for context
        const history = await Message.find({ chatId }).sort({ createdAt: 1 }).limit(20);
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
        console.error('Message send error:', error.message);

        let errorMessage = 'AI service error. Please try again.';
        if (error.status === 429) {
            errorMessage = 'Your OpenAI API quota has been exceeded. Please check your billing details.';
        }

        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
            res.end();
        } else {
            res.status(error.status || 500).json({
                success: false,
                message: errorMessage,
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
        const history = await Message.find({ chatId: message.chatId }).sort({ createdAt: 1 }).limit(20);
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

        const assistantMessage = await Message.create({
            chatId: message.chatId,
            role: 'assistant',
            content: fullContent,
        });

        res.write(`data: ${JSON.stringify({ done: true, userMessage: message, assistantMessage })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Message edit error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Failed to edit message.' });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Failed to complete re-generation.' })}\n\n`);
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
