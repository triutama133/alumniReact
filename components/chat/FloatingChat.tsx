// components/chat/FloatingChat.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Send, MessageSquare, ChevronUp, ChevronDown, User, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Conversation {
    id: number;
    type: string;
    name: string;
    other_user_id: number | null;
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
}

interface Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    content_type: string;
    created_at: string;
    alumni_db: {
        id: number;
        nama_lengkap: string | null;
        nama_panggilan: string | null;
    } | null;
}

interface FloatingChatProps {
    currentUserId: number;
    userEmail: string | null;
}

export function FloatingChat({ currentUserId, userEmail }: FloatingChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoadingConvs, setIsLoadingConvs] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);

    const bottomRef = useRef<HTMLDivElement | null>(null);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Load conversations
    const loadConversations = useCallback(async () => {
        if (!isOpen) return;
        setIsLoadingConvs(true);
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                setTotalUnread(data.reduce((acc: number, c: Conversation) => acc + c.unread_count, 0));
            }
        } catch (err) {
            console.error('Error loading conversations in floating chat:', err);
        } finally {
            setIsLoadingConvs(false);
        }
    }, [isOpen]);

    // Poll conversations periodically for unread badges when closed
    useEffect(() => {
        const checkUnread = async () => {
            try {
                const res = await fetch('/api/conversations');
                if (res.ok) {
                    const data = await res.json();
                    setTotalUnread(data.reduce((acc: number, c: Conversation) => acc + c.unread_count, 0));
                }
            } catch {}
        };
        checkUnread();
        const interval = setInterval(checkUnread, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadConversations();
        }
    }, [isOpen, loadConversations]);

    // Load messages for selected conversation
    const loadMessages = useCallback(async (conversationId: number) => {
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`);
            if (res.ok) {
                setMessages(await res.json());
                scrollToBottom();
                
                // Clear unread count locally
                setConversations(prev => 
                    prev.map(c => c.id === conversationId ? { ...c, unread_count: 0 } : c)
                );
                // Trigger refresh of total unread
                setTotalUnread(prev => Math.max(0, prev - (conversations.find(c => c.id === conversationId)?.unread_count || 0)));
            }
        } catch (err) {
            console.error('Error loading messages in floating chat:', err);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [conversations, scrollToBottom]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        } else {
            setMessages([]);
        }
    }, [activeConversationId, loadMessages]);

    // Subscribe to realtime messages
    useEffect(() => {
        if (!activeConversationId) return;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const channel = supabase
            .channel(`floating-room:${activeConversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversationId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                    scrollToBottom();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [activeConversationId, supabaseUrl, supabaseAnonKey, scrollToBottom]);

    // Send message
    const sendMessage = async () => {
        const content = input.trim();
        if (!content || !activeConversationId || isSending) return;

        setIsSending(true);
        try {
            const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (res.ok) {
                setInput('');
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    return (
        <div className="fixed bottom-0 right-8 z-40 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl shadow-2xl transition-all duration-300">
            {/* Header / Toggle Bar */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white rounded-t-xl flex items-center justify-between cursor-pointer select-none hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-bold tracking-wide">Pesan Anda</span>
                    {totalUnread > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center">
                            {totalUnread}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
            </div>

            {/* Expanded Content Drawer */}
            {isOpen && (
                <div className="h-96 flex flex-col overflow-hidden">
                    {!activeConversationId ? (
                        /* List View */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                                {isLoadingConvs ? (
                                    <p className="text-center text-xs text-slate-400 py-12">Memuat percakapan...</p>
                                ) : conversations.length === 0 ? (
                                    <div className="text-center py-16 px-4">
                                        <MessageCircle className="h-8 w-8 mx-auto text-slate-350 dark:text-slate-650 mb-2" />
                                        <p className="text-xs font-medium text-slate-500">Belum ada percakapan.</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Kirim pesan ke talenta lain untuk memulai.</p>
                                    </div>
                                ) : (
                                    conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConversationId(conv.id)}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                                        {conv.name}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {conv.last_message || 'Belum ada pesan'}
                                                </p>
                                            </div>
                                            {conv.unread_count > 0 && (
                                                <span className="h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold min-w-[16px] text-center flex items-center justify-center">
                                                    {conv.unread_count}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Chat View */
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
                            {/* Chat Sub-Header */}
                            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
                                <button 
                                    onClick={() => setActiveConversationId(null)}
                                    className="p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                                <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                                    {activeConversation?.name}
                                </span>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {isLoadingMessages ? (
                                    <p className="text-center text-xs text-slate-400 py-6">Memuat pesan...</p>
                                ) : (
                                    messages.map((msg) => {
                                        const isMine = msg.sender_id === currentUserId;
                                        return (
                                            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] px-3 py-1.5 rounded-xl border text-[11px] ${isMine
                                                    ? 'bg-blue-600 text-white border-blue-700 rounded-br-none'
                                                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-150 dark:border-slate-800 rounded-bl-none'
                                                }`}>
                                                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input Form */}
                            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder="Tulis pesan..."
                                    className="h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-full px-3"
                                />
                                <Button 
                                    onClick={sendMessage}
                                    disabled={!input.trim() || isSending}
                                    size="sm"
                                    className="h-8 w-8 rounded-full p-0 bg-blue-600 hover:bg-blue-500 flex-shrink-0 text-white"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
