const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Create a streaming chat completion from Groq
 */
const createChatStream = async (messages) => {
    return await groq.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        stream: true,
    });
};

/**
 * Formats database messages for Groq API
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
        const response = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'Generate a very short, concise title (max 5 words) for a chat that starts with this message. Return ONLY the title text.',
                },
                { role: 'user', content },
            ],
            model: 'llama-3.1-8b-instant',
            max_tokens: 20,
        });
        return response.choices[0].message.content.replace(/["']/g, '').trim();
    } catch (error) {
        console.error('Groq Title generation error:', error);
        return 'New Chat';
    }
};

module.exports = {
    createChatStream,
    buildMessageHistory,
    generateChatTitle,
};
