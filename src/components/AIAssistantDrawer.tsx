'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, ArrowRight, Loader2 } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; actions?: string[] }>>([
    {
      sender: 'ai',
      text: 'Welcome! How can I help you today? Ask me to analyze pipeline revenue, find overdue tasks, suggest client actions, or search SOPs.',
      actions: ['Analyze sales pipeline', 'Find overdue tasks', 'Summarize MRR revenue', 'Search SOPs'],
    },
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || inputQuery;
    if (!queryText.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: queryText }]);
    if (!textToSend) setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
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
                <div className="whitespace-pre-wrap">{msg.text}</div>

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
