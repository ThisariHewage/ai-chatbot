const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const PRIMARY_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || 'llama-3.1-8b-instant';
const FALLBACK_CHAT_MODEL = process.env.GROQ_FALLBACK_CHAT_MODEL || 'llama-3.3-70b-versatile';
const MAX_CONTEXT_CHARS = Number(process.env.GROQ_MAX_CONTEXT_CHARS) || 9000;
const MAX_MESSAGE_CHARS = Number(process.env.GROQ_MAX_MESSAGE_CHARS) || 3500;

/**
 * Create a streaming chat completion from Groq
 */
const createChatStream = async (messages) => {
    try {
        return await groq.chat.completions.create({
            messages,
            model: PRIMARY_CHAT_MODEL,
            stream: true,
        });
    } catch (error) {
        if (error.status !== 429 || FALLBACK_CHAT_MODEL === PRIMARY_CHAT_MODEL) {
            throw error;
        }

        console.warn(
            `Primary Groq model rate-limited; retrying with ${FALLBACK_CHAT_MODEL}.`
        );

        return await groq.chat.completions.create({
            messages,
            model: FALLBACK_CHAT_MODEL,
            stream: true,
        });
    }
};

const truncateContent = (content, maxChars) => {
    if (content.length <= maxChars) return content;
    return `[Earlier content trimmed]\n${content.slice(-maxChars)}`;
};

/**
 * Formats database messages for Groq API, keeping the newest context under budget.
 */
const buildMessageHistory = (history) => {
    const formatted = history.map((msg) => ({
        role: msg.role,
        content: String(msg.content || ''),
    }));

    const selected = [];
    let remainingChars = MAX_CONTEXT_CHARS;

    for (let i = formatted.length - 1; i >= 0; i -= 1) {
        const message = formatted[i];
        let content = truncateContent(message.content, MAX_MESSAGE_CHARS);

        if (content.length > remainingChars) {
            if (selected.length === 0) {
                content = truncateContent(content, remainingChars);
            } else {
                break;
            }
        }

        selected.unshift({ role: message.role, content });
        remainingChars -= content.length;
    }

    return selected;
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
        return 'New IntelliChat';
    }
};

module.exports = {
    createChatStream,
    buildMessageHistory,
    generateChatTitle,
};
