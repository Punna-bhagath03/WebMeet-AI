import { GoogleGenerativeAI } from '@google/generative-ai';
import env from '../config/env.js';

let genAIClient;

const getAIClient = () => {
  if (!env.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return genAIClient;
};

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const model = getAIClient().getGenerativeModel({ model: 'gemini-2.5-flash' });

    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return res.json({ response: text });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};

export { chatWithAI };