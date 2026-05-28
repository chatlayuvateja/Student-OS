import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAIChat, useSendMessage } from '../../hooks/api';

gsap.registerPlugin(ScrollTrigger);

function AIChatSection() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const chatRef = useRef(null);
  const brainRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [localMessages, setLocalMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useSendMessage();
  const { data: history = [] } = useAIChat();

  useEffect(() => {
    if (history.length > 0 && localMessages.length === 0) {
      setLocalMessages(history.map(h => ({ role: h.role, content: h.content })));
    }
  }, [history]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (titleRef.current) {
        gsap.fromTo(titleRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: titleRef.current, start: 'top 85%' } });
      }
      if (chatRef.current) {
        gsap.fromTo(chatRef.current, { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: chatRef.current, start: 'top 80%' } });
      }
      if (brainRef.current) {
        const paths = brainRef.current.querySelectorAll('path, circle');
        gsap.fromTo(paths, { strokeDashoffset: 500, strokeDasharray: 500 }, {
          strokeDashoffset: 0, duration: 2, stagger: 0.05, ease: 'power2.inOut',
          scrollTrigger: { trigger: brainRef.current, start: 'top 80%' },
        });
      }
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isTyping]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', content: input };
    setLocalMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await sendMessage.mutateAsync({
        messages: [...localMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
        sessionId: 'default',
      });
      setLocalMessages(prev => [...prev, { role: 'assistant', content: result.reply }]);
    } catch (err) {
      setLocalMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error. Please try again." }]);
    }
    setIsTyping(false);
  };

  return (
    <section ref={sectionRef} className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <div ref={titleRef} className="mb-10">
          <p className="section-eyebrow">AI Assistant</p>
          <h2 className="section-heading">Your personal *intelligence*</h2>
          <p className="section-subtext">Powered by Gemini AI. Personalized to you.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Brain illustration */}
          <div ref={brainRef} className="hidden lg:flex lg:w-[400px] flex-shrink-0 items-center justify-center py-8">
            <svg viewBox="0 0 200 200" className="w-64 h-64" fill="none" stroke="rgba(137, 170, 204, 0.15)" strokeWidth="1.5">
              <circle cx="100" cy="100" r="60" stroke="rgba(137, 170, 204, 0.2)" strokeWidth="2" />
              <circle cx="100" cy="100" r="40" stroke="rgba(78, 133, 191, 0.15)" strokeWidth="1" />
              <circle cx="100" cy="100" r="80" stroke="rgba(137, 170, 204, 0.08)" strokeWidth="1" />
              <path d="M100 40Q130 50 140 80Q150 110 130 130Q110 150 100 160" />
              <path d="M100 40Q70 50 60 80Q50 110 70 130Q90 150 100 160" />
              <path d="M60 80Q40 70 30 80Q20 90 40 100" stroke="rgba(78, 133, 191, 0.2)" />
              <path d="M140 80Q160 70 170 80Q180 90 160 100" stroke="rgba(78, 133, 191, 0.2)" />
              <path d="M75 55L85 65M115 55L125 65" stroke="rgba(0, 194, 168, 0.2)" strokeWidth="1.5" />
              <circle cx="100" cy="75" r="3" fill="rgba(137, 170, 204, 0.3)" stroke="none" />
              <circle cx="100" cy="125" r="3" fill="rgba(137, 170, 204, 0.3)" stroke="none" />
              <circle cx="75" cy="100" r="3" fill="rgba(137, 170, 204, 0.3)" stroke="none" />
              <circle cx="125" cy="100" r="3" fill="rgba(137, 170, 204, 0.3)" stroke="none" />
            </svg>
          </div>

          {/* Chat panel */}
          <div ref={chatRef} className="flex-1 w-full">
            <div className="glass-card overflow-hidden" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: '480px' }}>
                {localMessages.length === 0 && !isTyping && (
                  <div className="text-center py-12">
                    <p className="text-muted text-sm">Start a conversation with your AI study assistant.</p>
                    <p className="text-muted/50 text-xs mt-1">Ask to explain concepts, create study plans, or quiz you.</p>
                  </div>
                )}
                {localMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] lg:max-w-[70%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'text-bg'
                        : 'bg-surface border border-stroke'
                    }`}
                      style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #89AACC, #4E85BF)' } : {}}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-stroke p-4 rounded-2xl flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-text-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-stroke">
                <div className="flex gap-3">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask anything about your studies..."
                    className="flex-1 px-5 py-3.5 rounded-2xl bg-surface/50 border border-stroke text-text-primary placeholder-muted focus:outline-none focus:border-text-primary/30 transition-all text-sm"
                    disabled={isTyping}
                  />
                  <button type="submit" disabled={isTyping || !input.trim()}
                    className="px-6 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 hover:shadow-lg disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #89AACC, #4E85BF)', color: '#000' }}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AIChatSection;
