const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Create a streaming chat completion from OpenAI
 */
const createChatStream = async (messages) => {
    return await openai.chat.completions.create({
        model: 'gpt-4o-mini', // or 'gpt-3.5-turbo'
        messages,
        stream: true,
    });
};

/**
 * Formats database messages for OpenAI API
 */
const buildMessageHistory = (history) => {
    return history.map((msg) => ({
        role: msg.role,
        content: msg.content,
    }));
};

/**
 * Generates a concise title from the first message
 */
const generateChatTitle = async (content) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Generate a very short, concise title (max 5 words) for a chat that starts with this message. Return ONLY the title text.',
                },
                { role: 'user', content },
            ],
            max_tokens: 20,
        });
        return response.choices[0].message.content.replace(/["']/g, '').trim();
    } catch (error) {
        console.error('Title generation error:', error);
        return 'New Chat';
    }
};

module.exports = {
    createChatStream,
    buildMessageHistory,
    generateChatTitle,
};
