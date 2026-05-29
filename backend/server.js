import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5500;

// Groq setup
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

if (!process.env.GROQ_API_KEY) {
  console.error('ERROR: GROQ_API_KEY.env me nahi mili. https://console.groq.com/keys se le.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // HTML serve karne ke liye

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { message: userMessage } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'Message field is required' });
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Fast aur free model
      messages: [
        {
          role: 'system',
          content: 'You are OceanFocus AI, a helpful and friendly assistant for hackathon projects.'
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const botReply = completion.choices[0].message.content;
    res.json({ reply: botReply });

  } catch (error) {
    console.error('Groq API Error:', error);

    if (error.status === 401) {
      res.status(500).json({ error: 'Invalid Groq API key. Check.env file' });
    } else if (error.status === 429) {
      res.status(500).json({ error: 'Rate limit exceeded. Try again later' });
    } else {
      res.status(500).json({ error: 'Groq API request failed' });
    }
  }
});

// Default route - chat.html serve karo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'chat.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using Groq - Free & Fast 🚀');
});