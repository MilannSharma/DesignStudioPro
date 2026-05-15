import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, CheckCircle2, XCircle, Sparkles, Image as ImageIcon, Zap, MessageCircle } from 'lucide-react';
import { sendToGemini, executeAction, AIAction, AIResponse } from '../../utils/aiEngine';
import { QUICK_TASKS, TASK_CATEGORIES, QuickTask } from '../../utils/quickTasks';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: AIAction[];
  actionsApplied?: boolean;
  imageBase64?: string;
}

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');
  const [activeCategory, setActiveCategory] = useState<string>('canvas');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '👋 Hi! I\'m your AI Design Assistant powered by Gemini. I can help you:\n\n• Create layouts & templates\n• Add text, shapes, placeholders\n• Analyze uploaded images\n• Modify colors, fonts, positions\n• Build ID cards, certificates, etc.\n\nWhat would you like to create?',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (taskFeedback) {
      const t = setTimeout(() => setTaskFeedback(null), 2000);
      return () => clearTimeout(t);
    }
  }, [taskFeedback]);

  const handleQuickTask = async (task: QuickTask) => {
    setTaskFeedback(`⚡ ${task.label}...`);
    for (const action of task.actions) {
      await executeAction(action);
    }
    setTaskFeedback(`✅ ${task.label} done!`);
  };

  const handleSend = async () => {
    if (!input.trim() && !pendingImage) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || '(uploaded image)',
      imageBase64: pendingImage || undefined,
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const imgToSend = pendingImage;
    setPendingImage(null);
    setLoading(true);

    try {
      const response: AIResponse = await sendToGemini(userMsg.content, imgToSend || undefined);
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        actions: response.actions.length > 0 ? response.actions : undefined,
        actionsApplied: false,
      };
      
      // Auto-apply info actions (no canvas changes)
      if (response.actions.length > 0 && response.actions.every(a => a.type === 'info')) {
        assistantMsg.actionsApplied = true;
      }
      
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyActions = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.actions) return;

    for (const action of msg.actions) {
      if (action.type !== 'info') {
        await executeAction(action);
      }
    }

    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, actionsApplied: true } : m
    ));
  };

  const handleRejectActions = (msgId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, actionsApplied: true, content: m.content + '\n\n_(Changes rejected by user)_' } : m
    ));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const filteredTasks = QUICK_TASKS.filter(t => t.category === activeCategory);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-2xl z-[100] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="h-12 bg-gradient-to-r from-violet-600 to-blue-600 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm">AI Assistant</div>
            <div className="text-white/60 text-[9px] font-medium">Powered by Gemini</div>
          </div>
        </div>
        <button onClick={onClose} title="Close AI Assistant" aria-label="Close AI Assistant" className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
          <X size={18} />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-100 shrink-0">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'tasks'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Zap size={14} /> Quick Tasks ({QUICK_TASKS.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'chat'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MessageCircle size={14} /> AI Chat
        </button>
      </div>

      {/* ═══════════ QUICK TASKS TAB ═══════════ */}
      {activeTab === 'tasks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Task Feedback Toast */}
          {taskFeedback && (
            <div className="mx-3 mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl text-[11px] font-bold text-green-700 text-center animate-in fade-in duration-200">
              {taskFeedback}
            </div>
          )}

          {/* Category Pills */}
          <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto shrink-0 border-b border-gray-50">
            {TASK_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Task Grid */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <div className="grid grid-cols-2 gap-2">
              {filteredTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleQuickTask(task)}
                  className="flex items-start gap-2.5 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm transition-all text-left group active:scale-95"
                  title={task.description}
                >
                  <span className="text-lg shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{task.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-gray-800 truncate">{task.label}</div>
                    <div className="text-[9px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{task.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Tasks Footer */}
          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 shrink-0">
            <div className="text-[9px] text-gray-400 text-center font-medium">
              ⚡ Instant execution • No API needed • Click any task above
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ AI CHAT TAB ═══════════ */}
      {activeTab === 'chat' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-violet-500 to-blue-500'
                }`}>
                  {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                </div>
                <div className={`max-w-[280px] ${msg.role === 'user' ? 'items-end' : ''}`}>
                  {/* Image preview */}
                  {msg.imageBase64 && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                      <img src={msg.imageBase64} alt="Uploaded" className="max-h-32 w-auto object-contain" />
                    </div>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-700 rounded-bl-md border border-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  
                  {/* Action buttons — only show for assistant msgs with pending actions */}
                  {msg.actions && msg.actions.length > 0 && !msg.actionsApplied && (
                    <div className="mt-2 space-y-2">
                      {/* Action preview */}
                      <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-sm">
                        <div className="text-[9px] text-gray-400 uppercase font-black tracking-wider mb-1.5">Proposed Changes</div>
                        {msg.actions.filter(a => a.type !== 'info').map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600 py-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {a.description}
                          </div>
                        ))}
                      </div>
                      {/* Apply / Reject */}
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleApplyActions(msg.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-xl transition-all shadow-sm uppercase tracking-wider"
                        >
                          <CheckCircle2 size={13} /> Apply
                        </button>
                        <button 
                          onClick={() => handleRejectActions(msg.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 text-[10px] font-bold rounded-xl transition-all uppercase tracking-wider"
                        >
                          <XCircle size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Applied indicator */}
                  {msg.actions && msg.actionsApplied && msg.actions.some(a => a.type !== 'info') && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-green-600 font-bold">
                      <CheckCircle2 size={12} /> Changes applied
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <Loader2 size={14} className="animate-spin text-blue-500" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
              <img src={pendingImage} alt="Pending" className="h-10 w-10 object-cover rounded-lg border border-blue-200" />
              <span className="text-[10px] text-blue-600 font-bold flex-1">Image attached</span>
              <button onClick={() => setPendingImage(null)} title="Remove attached image" aria-label="Remove attached image" className="text-blue-400 hover:text-blue-600 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"
                title="Upload image for AI analysis"
              >
                <ImageIcon size={18} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} title="Upload image" aria-label="Upload image" />
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about your design..."
                  title="AI chat input"
                  aria-label="AI chat message input"
                  className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-gray-50 max-h-20"
                  rows={1}
                />
              </div>
              <button 
                onClick={handleSend}
                disabled={loading || (!input.trim() && !pendingImage)}
                title="Send message"
                aria-label="Send message to AI"
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl transition-all shrink-0 shadow-sm disabled:shadow-none"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-[9px] text-gray-400 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line · AI will ask before applying changes
            </div>
          </div>
        </>
      )}
    </div>
  );
};
