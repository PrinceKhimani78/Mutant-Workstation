'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Send, X, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; actions?: string[] }>>([
    {
      sender: 'ai',
      text: '👋 **Welcome to Mutant AI Workstation Assistant!**\nHow can I help you today? You can ask me to analyze pipeline revenue, find overdue tasks, suggest client actions, or search SOPs.',
      actions: ['Analyze Sales Pipeline', 'Find Overdue Tasks', 'Summarize MRR Revenue', 'Search SOPs'],
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
        { sender: 'ai', text: 'Error connecting to Mutant AI engine.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0b0f17] border-l border-[#1e293b] shadow-2xl z-50 flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#1e293b] flex items-center justify-between bg-[#131b2e]/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#fc6203] text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Mutant AI Engine
              <Sparkles className="w-3.5 h-3.5 text-[#fc6203]" />
            </h3>
            <p className="text-[10px] text-[#94a3b8] font-mono">Autonomous Operations Assistant</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#64748b] hover:text-white hover:bg-[#1e293b]">
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
                  ? 'bg-[#fc6203] text-white rounded-br-none shadow-[0_4px_15px_rgba(252,98,3,0.3)]'
                  : 'bg-[#131b2e] border border-[#1e293b] text-[#cbd5e1] rounded-bl-none'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Action Buttons if available */}
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-2 border-t border-[#1e293b] space-y-1.5">
                  <p className="text-[10px] font-mono text-[#fc6203] font-bold">Suggested Actions:</p>
                  {msg.actions.map((act, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(act)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#0b0f17] hover:bg-[#fc6203]/20 border border-[#1e293b] hover:border-[#fc6203]/40 text-[#94a3b8] hover:text-white text-[11px] font-medium transition-all flex items-center justify-between"
                    >
                      <span>{act}</span>
                      <ArrowRight className="w-3 h-3 text-[#fc6203]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#fc6203] p-3 rounded-2xl bg-[#131b2e] w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing Workstation Database...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-4 border-t border-[#1e293b] bg-[#131b2e]/60">
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
            placeholder="Ask AI to find leads, tasks, revenue..."
            className="flex-1 px-3 py-2 rounded-xl bg-[#0b0f17] border border-[#1e293b] text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#fc6203]"
          />
          <button
            type="submit"
            disabled={loading}
            className="p-2 rounded-xl bg-[#fc6203] hover:bg-[#e05300] text-white disabled:opacity-50 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
