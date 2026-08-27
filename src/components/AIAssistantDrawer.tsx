'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, Send, X, ArrowRight, Loader2 } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = { sender: 'user' | 'ai'; text: string; actions?: string[] };

const WELCOME_MESSAGE: ChatMessage = {
  sender: 'ai',
  text: 'Welcome! How can I help you today? Ask me to analyze pipeline revenue, find overdue tasks, suggest client actions, or search SOPs.',
  actions: ['Analyze sales pipeline', 'Find overdue tasks', 'Summarize MRR revenue', 'Search SOPs'],
};

const CHAT_STORAGE_KEY = 'mutant-ai-chat';
const CHAT_TTL_MS = 60 * 60 * 1000; // 1 hour

function loadSavedChat(): ChatMessage[] | null {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.messages?.length || typeof parsed.savedAt !== 'number') return null;
    if (Date.now() - parsed.savedAt > CHAT_TTL_MS) return null;
    return parsed.messages;
  } catch {
    return null;
  }
}

function saveChat(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, savedAt: Date.now() }));
  } catch {
    // storage unavailable (private mode, quota, etc.) — chat just won't persist
  }
}

function renderFormattedText(text: string, isUser: boolean) {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, idx) => {
    const isHeader = /^#{1,6}\s+/.test(line.trim());
    const cleanHeader = line.replace(/^#{1,6}\s*/, '');
    const isBullet = /^\s*[\-\*•]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[\-\*•]\s+/, '') : cleanHeader;

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const formattedContent = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const innerText = part.slice(2, -2);
        return (
          <strong
            key={pIdx}
            className={isUser ? 'font-bold text-white' : 'font-semibold text-[var(--foreground)]'}
          >
            {innerText}
          </strong>
        );
      }
      return part.replace(/\*/g, '');
    });

    if (isHeader) {
      return (
        <div
          key={idx}
          className={`font-bold text-xs mt-2 mb-1 ${
            isUser ? 'text-white border-b border-white/20 pb-0.5' : 'text-[var(--primary)] border-b border-[var(--border)] pb-0.5'
          }`}
        >
          {formattedContent}
        </div>
      );
    }

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
          <span className={isUser ? 'text-white font-bold' : 'text-[var(--primary)] font-bold'}>•</span>
          <span className="flex-1">{formattedContent}</span>
        </div>
      );
    }

    return (
      <div key={idx} className={line.trim() === '' ? 'h-1.5' : 'my-0.5'}>
        {formattedContent}
      </div>
    );
  });
}

export function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore any conversation from the last hour once, on first mount.
  useEffect(() => {
    const saved = loadSavedChat();
    if (saved) setMessages(saved);
    setHydrated(true);
  }, []);

  // Every new message resets the 1-hour clock — an active chat never expires
  // mid-conversation, only after an hour of not being touched.
  useEffect(() => {
    if (!hydrated) return; // don't overwrite storage with the initial welcome-only state before restore runs
    saveChat(messages);
  }, [messages, hydrated]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || inputQuery;
    if (!queryText.trim() || loading) return;

    // Snapshot before appending the new user message — this is the actual
    // back-and-forth the model needs to make sense of a reply like "I am the
    // owner" that only means something in light of what was just asked.
    const historyForRequest = messages;

    setMessages((prev) => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText, history: historyForRequest }),
      });
      const data = await res.json();

      if (data.answer) {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: data.answer, actions: data.actions || [] },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'ai', text: 'Sorry, I could not process your request at this moment.' },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Error connecting to the AI engine.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 max-w-full bg-white border-l border-[var(--border)] shadow-xl z-50 flex flex-col">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[var(--primary)] text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                AI engine
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
              </h3>
              <p className="text-[11px] text-[var(--muted-foreground)]">Operations assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--surface-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[var(--primary)] text-white rounded-br-sm'
                    : 'bg-[var(--surface-muted)] text-[var(--foreground)] rounded-bl-sm'
                }`}
              >
                <div>{renderFormattedText(msg.text, msg.sender === 'user')}</div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-black/10 space-y-1.5">
                    <p className="text-[10px] font-semibold opacity-80">Suggested actions</p>
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(act)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-black/5 text-[11px] font-medium transition-colors flex items-center justify-between"
                      >
                        <span>{act}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] p-3 rounded-2xl bg-[var(--surface-muted)] w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              <span>Thinking…</span>
            </div>
          )}
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-[var(--border)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AI to find leads, tasks, revenue…"
              className="input-minimal flex-1 px-3 py-2 rounded-lg text-xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary p-2 rounded-lg disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
