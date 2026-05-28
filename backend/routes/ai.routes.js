import { Router } from 'express';
import { readData, insertOne } from '../utils/fileStore.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, aiChatSchema } from '../middleware/validate.js';
import { aiRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.post('/chat', aiRateLimit, validate(aiChatSchema), asyncHandler(async (req, res) => {
  const { studentId, messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Messages array required', data: null });
  }

  // Build context from student data
  let systemContext = 'You are a helpful AI study assistant for a college student.';
  try {
    const profile = await readData('profile.json');
    if (profile && profile.name) {
      systemContext += ` The student's name is ${profile.name}.`;
    }
    if (profile && profile.subjects && profile.subjects.length > 0) {
      systemContext += ` They are studying: ${profile.subjects.join(', ')}.`;
    }
  } catch (e) {
    // ignore
  }

  // If ANTHROPIC_API_KEY is set, use real API; otherwise return simulated response
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (apiKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          system: systemContext,
          messages: messages.slice(-10), // Last 10 messages for context
          max_tokens: 2000,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }
      
      const data = await response.json();
      const reply = data.content[0].text;
      
      // Save to chat history
      if (studentId) {
        await insertOne('ai_chat_history.json', {
          student_id: studentId,
          role: 'user',
          content: messages[messages.length - 1]?.content || '',
          session_id: req.body.session_id || 'default',
        });
        await insertOne('ai_chat_history.json', {
          student_id: studentId,
          role: 'assistant',
          content: reply,
          session_id: req.body.session_id || 'default',
        });
      }
      
      return res.json({ success: true, message: 'AI response generated', data: { reply } });
    } catch (err) {
      console.error('Claude API error:', err.message);
      // Fall through to simulated response
    }
  }
  
  // Simulated response when no API key
  const lastMessage = messages[messages.length - 1]?.content || '';
  const reply = getSimulatedResponse(lastMessage, systemContext);
  
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
  
  res.json({ success: true, message: 'AI response generated', data: { reply } });
}));

router.get('/history/:studentId', asyncHandler(async (req, res) => {
  const data = await readData('ai_chat_history.json');
  const history = Array.isArray(data) ? data.filter(h => h.student_id === req.params.studentId) : [];
  res.json({ success: true, message: 'Chat history fetched', data: history });
}));

function getSimulatedResponse(message, context) {
  const msg = message.toLowerCase();
  if (msg.includes('study plan') || msg.includes('schedule')) {
    return "Based on your current courses, I'd recommend allocating 2 hours daily for focused study. Block out morning hours (9-11 AM) for difficult subjects, and use afternoons for review. Would you like me to create a detailed weekly study plan?";
  }
  if (msg.includes('explain') || msg.includes('what is') || msg.includes('how does')) {
    return "Great question! Let me explain this concept clearly. The key idea here is to break it down into foundational principles. First, understand the core mechanism, then see how it applies to real-world scenarios. Would you like me to provide some practice questions to test your understanding?";
  }
  if (msg.includes('quiz') || msg.includes('practice question') || msg.includes('test me')) {
    return "Let me generate a practice question for you:\n\n**Question:** Explain the relationship between the key concepts you've been studying this semester and how they apply to practical problem-solving.\n\nTake your time to answer, and I'll provide feedback!";
  }
  if (msg.includes('motivate') || msg.includes('tired') || msg.includes('procrastinating')) {
    return "Remember: every minute you invest in your education compounds over a lifetime. You're not just studying for a grade — you're building the foundation for your future expertise. Take a deep breath, break your next task into 25-minute chunks, and start with the smallest possible step. You've got this! 💪";
  }
  return "That's a great question! As your AI study assistant, I'm here to help you understand concepts, prepare for exams, and stay organized. Could you tell me more about what you'd like help with today? I can help explain topics, create study plans, generate practice questions, or just chat through a problem you're working on.";
}

export default router;
