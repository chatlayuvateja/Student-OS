// ═══════════════════════════════════════════════════════════════════
// FILE: backend/routes/ai.routes.js
// PURPOSE: AI Study Assistant routes — powered by Google Gemini API
//
// HOW IT WORKS:
//   1. Reads the student's profile from profile.json to build context
//   2. Sends the conversation + context to Gemini API
//   3. Returns the reply to the frontend
//   4. Saves both user message and AI reply to ai_chat_history.json
//
// API KEY LOCATION:
//   → Open backend/.env
//   → Set: GEMINI_API_KEY=your_key_here
//   → Get a free key at: https://aistudio.google.com/app/apikey
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readData, insertOne } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, aiChatSchema } from '../middleware/validate.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// ─────────────────────────────────────────────
// Initialize Gemini client using the API key
// from environment variable GEMINI_API_KEY
//
// If the key is missing, the app still works
// but returns a simulated response instead.
// ─────────────────────────────────────────────
const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// ─────────────────────────────────────────────
// Model selection:
// "gemini-1.5-flash" — fast, free tier available
// "gemini-1.5-pro"   — more powerful, higher quota
// "gemini-2.0-flash" — latest, faster
//
// Change this string to switch models.
// ─────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-1.5-flash';

// ═══════════════════════════════════════════════════════════════════
// POST /ai/chat
// Body: { studentId, messages: [{ role: 'user'|'model', content: '...' }] }
// Returns: { success, data: { reply } }
// ═══════════════════════════════════════════════════════════════════
router.post('/chat', aiRateLimit, validate(aiChatSchema), asyncHandler(async (req, res) => {
  const { studentId, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      message: 'Messages array required',
      data: null,
    });
  }

  // ─────────────────────────────────────────────
  // Build a personalized system prompt using
  // the student's saved profile data.
  // This makes the AI aware of who it's helping.
  // ─────────────────────────────────────────────
  let systemPrompt = `You are a knowledgeable, friendly, and encouraging AI study assistant 
built into a personal Student OS dashboard. Your role is to help the student understand 
concepts, prepare for exams, create study plans, generate practice questions, and stay motivated.
Keep responses clear, structured, and student-friendly. Use examples when explaining concepts.`;

  try {
    // Read the student profile from profile.json
    const profile = await readData('profile.json');

    if (profile && profile.name) {
      systemPrompt += ` The student's name is ${profile.name}.`;
    }
    if (profile && profile.college) {
      systemPrompt += ` They study at ${profile.college}.`;
    }
    if (profile && profile.subjects && profile.subjects.length > 0) {
      // Include their subjects so the AI can give subject-specific help
      systemPrompt += ` Their current subjects are: ${profile.subjects.join(', ')}.`;
    }
    if (profile && profile.semester) {
      systemPrompt += ` They are in semester ${profile.semester}.`;
    }
  } catch (e) {
    // If profile can't be read, continue with generic prompt
    console.warn('Could not load profile for AI context:', e.message);
  }

  // ─────────────────────────────────────────────
  // If GEMINI_API_KEY is present in .env,
  // use the real Gemini API to generate a reply.
  // Otherwise, fall through to the simulated reply.
  // ─────────────────────────────────────────────
  if (genAI) {
    try {
      // Get the Gemini model instance
      const model = genAI.getGenerativeModel({
        model: GEMINI_MODEL,
        // systemInstruction passes the context to Gemini
        // This is equivalent to the "system" role in other APIs
        systemInstruction: systemPrompt,
      });

      // ─────────────────────────────────────────
      // Convert message history to Gemini format.
      //
      // Our app stores messages as:
      //   { role: 'user' | 'assistant', content: '...' }
      //
      // Gemini expects:
      //   { role: 'user' | 'model', parts: [{ text: '...' }] }
      //
      // So 'assistant' → 'model' is the key conversion.
      // ─────────────────────────────────────────
      const geminiHistory = messages
        .slice(0, -1) // All messages except the last (last = current user input)
        .map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || '' }],
        }));

      // The last message is what the student just typed
      const latestUserMessage = messages[messages.length - 1]?.content || '';

      // Start a chat session with the full conversation history
      const chat = model.startChat({
        history: geminiHistory,
        // generationConfig controls the output style
        generationConfig: {
          maxOutputTokens: 2000, // Maximum length of the reply
          temperature: 0.7,     // 0 = precise, 1 = creative. 0.7 is balanced.
        },
      });

      // Send the latest message and wait for Gemini's response
      const result = await chat.sendMessage(latestUserMessage);
      const reply = result.response.text();

      // ─────────────────────────────────────────
      // Save both the user message and AI reply
      // to ai_chat_history.json for history view
      // ─────────────────────────────────────────
      if (studentId) {
        await insertOne('ai_chat_history.json', {
          student_id: studentId,
          role: 'user',
          content: latestUserMessage,
          session_id: req.body.session_id || 'default',
        });
        await insertOne('ai_chat_history.json', {
          student_id: studentId,
          role: 'assistant',
          content: reply,
          session_id: req.body.session_id || 'default',
        });
      }

      return res.json({
        success: true,
        message: 'AI response generated',
        data: { reply },
      });

    } catch (err) {
      // Log the error for debugging
      console.error('Gemini API error:', err.message);

      // Return a clear error to the frontend instead of silently falling through
      const isQuota = err.message?.includes('429') || err.message?.includes('quota');
      const isAuth = err.message?.includes('403') || err.message?.includes('API_KEY');
      const isNotFound = err.message?.includes('404') || err.message?.includes('not found');

      let userMessage;
      if (isQuota) {
        userMessage = "⚠️ The AI assistant's daily free quota has been used up. "
          + "It will automatically reset tomorrow. "
          + "Try asking again later, or switch to a different model in ai.routes.js.";
      } else if (isAuth) {
        userMessage = "⚠️ The Gemini API key is invalid or not enabled. "
          + "Please check your key at https://aistudio.google.com/app/apikey";
      } else if (isNotFound) {
        userMessage = "⚠️ The AI model name is outdated or unavailable. "
          + "Please change GEMINI_MODEL in ai.routes.js to a valid model.";
      } else {
        userMessage = `⚠️ AI assistant error: ${err.message}`;
      }

      return res.json({
        success: true,
        message: 'AI response generated (with error notice)',
        data: { reply: userMessage },
      });
    }
  }

  // ─────────────────────────────────────────────
  // FALLBACK: Simulated response
  // Used when: no API key set, or Gemini call failed.
  // Remove this section once your API key is working.
  // ─────────────────────────────────────────────
  const lastMessage = messages[messages.length - 1]?.content || '';
  const reply = getSimulatedResponse(lastMessage);

  if (studentId) {
    await insertOne('ai_chat_history.json', {
      student_id: studentId,
      role: 'user',
      content: lastMessage,
      session_id: req.body.session_id || 'default',
    });
    await insertOne('ai_chat_history.json', {
      student_id: studentId,
      role: 'assistant',
      content: reply,
      session_id: req.body.session_id || 'default',
    });
  }

  res.json({
    success: true,
    message: 'AI response generated (simulated — add GEMINI_API_KEY to backend/.env to enable real AI)',
    data: { reply },
  });
}));

// ═══════════════════════════════════════════════════════════════════
// GET /ai/history/:studentId
// Returns saved chat history for a student
// ═══════════════════════════════════════════════════════════════════
router.get('/history/:studentId', asyncHandler(async (req, res) => {
  const data = await readData('ai_chat_history.json');
  const history = Array.isArray(data)
    ? data.filter(h => h.student_id === req.params.studentId)
    : [];
  res.json({ success: true, message: 'Chat history fetched', data: history });
}));

// ═══════════════════════════════════════════════════════════════════
// SIMULATED RESPONSES (fallback when no API key is configured)
// These are used so the app is functional even without a key.
// Once you add your GEMINI_API_KEY, these are never called.
// ═══════════════════════════════════════════════════════════════════
function getSimulatedResponse(message) {
  const msg = message.toLowerCase();

  if (msg.includes('study plan') || msg.includes('schedule')) {
    return "Based on your courses, I'd recommend 2 focused hours daily. Use mornings (9–11 AM) for difficult subjects and afternoons for review. Want me to create a detailed weekly plan? *(Add your Gemini API key to get a real personalized plan)*";
  }
  if (msg.includes('explain') || msg.includes('what is') || msg.includes('how does')) {
    return "Great question! Break this concept into its core principles first, then connect it to real-world examples. Want me to walk through it step by step? *(Add your Gemini API key for a full explanation)*";
  }
  if (msg.includes('quiz') || msg.includes('practice') || msg.includes('test me')) {
    return "Here is a practice question: Explain the most important concept from your current subject and how it applies in practice. *(Add your Gemini API key for subject-specific questions)*";
  }
  if (msg.includes('motivat') || msg.includes('tired') || msg.includes('procrastinat')) {
    return "Every minute you invest in learning now compounds over a lifetime. Break your next task into 25-minute chunks and start with the smallest step. You've got this! 💪";
  }
  return "I'm your AI study assistant. I can help explain topics, build study plans, quiz you, or just think through problems. *(Note: Add GEMINI_API_KEY to backend/.env to enable real AI responses)*";
}

export default router;
