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
    const providerStatus = error?.status || error?.response?.status;
    const providerMessage = error?.message || 'Unknown AI provider error';

    console.error('Error in AI chat:', {
      status: providerStatus,
      message: providerMessage,
    });

    if (providerStatus === 403) {
      return res.status(502).json({
        error:
          'AI provider rejected the API key (invalid, restricted, or reported leaked). Please rotate GEMINI_API_KEY.',
      });
    }

    if (providerStatus === 429) {
      return res.status(429).json({
        error: 'AI provider rate limit/quota exceeded. Please try again later.',
      });
    }

    if (!env.geminiApiKey) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured on the backend.',
      });
    }

    return res.status(500).json({ error: 'Failed to get AI response' });
  }
};

export { chatWithAI };