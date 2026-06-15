const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Create a streaming chat completion from Gemini
 */
const createChatStream = async (history) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Separate the last message as the new prompt
    const userPrompt = history[history.length - 1].content;
    const chatHistory = history.slice(0, -1).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
        history: chatHistory,
    });

    const result = await chat.sendMessageStream(userPrompt);
    return result.stream;
};

/**
 * Formats database messages for Gemini API
 */
const buildMessageHistory = (history) => {
    return history.map((msg) => ({
        role: msg.role, // 'user' or 'assistant' -> Gemini uses 'user' and 'model' (handled in createChatStream)
        content: msg.content,
    }));
};

/**
 * Generates a concise title from the first message
 */
const generateChatTitle = async (content) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `Generate a very short, concise title (max 5 words) for a chat that starts with this message: "${content}". Return ONLY the title text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().replace(/["']/g, '').trim();
    } catch (error) {
        console.error('Gemini Title generation error:', error);
        return 'New Chat';
    }
};

module.exports = {
    createChatStream,
    buildMessageHistory,
    generateChatTitle,
};
