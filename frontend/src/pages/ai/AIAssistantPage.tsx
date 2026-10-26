import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  Sparkles,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  FileText,
  RotateCcw,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: string[];
  isGrounded?: boolean;
  securityFlag?: string;
  engineMode?: string;
}

interface PromptCategory {
  category: string;
  prompts: string[];
}

export const AIAssistantPage: React.FC = () => {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.full_name || 'there'}! I am your Enterprise HR Assistant. You can ask me questions about corporate policies (leave carry-forward, shift grace periods, benefits, travel reimbursements) or query your own verified live records (leave balances, latest payslip breakdown, and daily attendance status).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: true,
      sources: ['Enterprise Knowledge Base & Core HRMS Database']
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<PromptCategory[]>([]);
  const [kbStatus, setKbStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestedPrompts();
    fetchKbStatus();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchSuggestedPrompts = async () => {
    try {
      const res = await fetch('/api/ai/suggested-prompts');
      if (res.ok) setSuggestedCategories(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchKbStatus = async () => {
    try {
      const res = await fetch('/api/ai/knowledge-base');
      if (res.ok) setKbStatus(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });

      if (!res.ok) {
        throw new Error('Assistant query failed');
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources,
        isGrounded: data.is_grounded,
        securityFlag: data.security_flag,
        engineMode: data.engine_mode
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered an internal error processing your request. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: false
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white">Enterprise AI HR Assistant</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                RAG Active
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Retrieval-grounded in approved corporate policy documents & live authenticated employee databases.
            </p>
          </div>
        </div>

        {kbStatus && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <BookOpen className="w-3.5 h-3.5 text-brand-500" />
            <span>
              <strong>{kbStatus.total_chunks}</strong> Chunks Indexed across <strong>{kbStatus.indexed_documents?.length}</strong> Handbooks
            </span>
          </div>
        )}
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        {/* Messages Scroll Area */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700/60'
                  }`}
                >
                  {/* Security Flag Warning */}
                  {msg.securityFlag === 'PROMPT_INJECTION_DETECTED' && (
                    <div className="p-2 rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-xs flex items-center gap-1.5 font-bold mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Security Guard Active: Override Rejected</span>
                    </div>
                  )}

                  {msg.securityFlag === 'CROSS_EMPLOYEE_DATA_BLOCKED' && (
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs flex items-center gap-1.5 font-bold mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Data Privacy Enforcement: Peer Records Protected</span>
                    </div>
                  )}

                  {/* Body text with whitespace preserve */}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-brand-500" /> Grounded Source References:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.map((src, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px]"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] opacity-70 text-right">{msg.timestamp}</div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-500 flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-brand-500" />
                  <span>Searching vector index & synthesizing grounded answer...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about leave rules, shift policies, or 'What is my leave balance?'..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Prompts & Knowledge Explorer */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col space-y-4 overflow-y-auto">
          <div className="space-y-1">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" /> Suggested Quick Inquiries
            </h3>
            <p className="text-xs text-slate-400">Click any prompt to instantly test grounded retrieval.</p>
          </div>

          <div className="space-y-4 flex-1">
            {suggestedCategories.map((cat, i) => (
              <div key={i} className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {cat.category}
                </div>
                <div className="space-y-1.5">
                  {cat.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(p)}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-brand-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-100 dark:border-slate-700/60 transition flex items-start gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Engine Guarantee Pill */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Enterprise Safety Guarantee
            </div>
            <p>
              Grounded exclusively on authorized policies. Private payroll & leave queries call live DB endpoints directly; unauthoritative hallucinations are explicitly rejected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
