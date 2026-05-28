import rateLimit from 'express-rate-limit';

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please wait before sending another message.',
    error: 'Rate limit exceeded',
    data: null,
  },
});

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
