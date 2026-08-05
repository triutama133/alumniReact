// components/chat/ChatWindow.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Send, MessageCircle, Users, ArrowLeft } from 'lucide-react';
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

interface ChatWindowProps {
    currentUserId: number;
    userEmail: string | null;
}

export function ChatWindow({ currentUserId, userEmail }: ChatWindowProps) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoadingConvs, setIsLoadingConvs] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement | null>(null);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Load daftar percakapan
    const loadConversations = useCallback(async () => {
        try {
            const res = await fetch('/api/conversations');
            if (res.ok) {
                setConversations(await res.json());
            }
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setIsLoadingConvs(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    // Load pesan saat conversation dipilih
    const loadMessages = useCallback(async (conversationId: number) => {
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`/api/conversations/${conversationId}/messages`);
            if (res.ok) {
                setMessages(await res.json());
                scrollToBottom();
            }
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [scrollToBottom]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        } else {
            setMessages([]);
        }
    }, [activeConversationId, loadMessages]);

    // Subscribe ke Supabase Realtime untuk pesan baru
    useEffect(() => {
        if (!activeConversationId) return;

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const channel = supabase
            .channel(`room:${activeConversationId}`)
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
                        // Hindari duplikasi
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

    // Kirim pesan
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

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'Gagal mengirim pesan.');
            }

            setInput('');
            // Pesan akan muncul via Realtime subscription
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const formatRelative = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const diffMs = Date.now() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'Baru saja';
        if (diffMin < 60) return `${diffMin} menit lalu`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour} jam lalu`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay < 7) return `${diffDay} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    const activeConversation = conversations.find((c) => c.id === activeConversationId);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 max-w-6xl mx-auto px-4 h-[calc(100vh-140px)] min-h-[500px]">
            {/* Sidebar Percakapan */}
            <div className={`md:col-span-4 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1b1f23] overflow-hidden ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Percakapan</h2>
                    <Badge className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[9px] font-bold">
                        {userEmail?.split('@')[0]}
                    </Badge>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoadingConvs ? (
                        <p className="text-center text-xs text-slate-400 py-8">Memuat percakapan...</p>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-10 px-6">
                            <MessageCircle className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada percakapan.</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Kunjungi halaman Cari Talenta dan klik "Kirim Pesan" untuk memulai.
                            </p>
                            <Button asChild size="sm" className="mt-4 bg-primary hover:bg-primary/95 text-white text-xs font-bold">
                                <Link href="/search">Cari Talenta</Link>
                            </Button>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                                className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${activeConversationId === conv.id ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                        {conv.name}
                                    </span>
                                    {conv.unread_count > 0 && (
                                        <span className="min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {conv.unread_count}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        {conv.last_message || 'Belum ada pesan'}
                                    </span>
                                    {conv.last_message_at && (
                                        <span className="text-[9px] text-slate-400 flex-shrink-0">
                                            {formatRelative(conv.last_message_at)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Area Chat */}
            <div className={`md:col-span-8 flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1b1f23] overflow-hidden ${activeConversationId ? 'flex' : 'hidden md:flex'}`}>
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <button
                                onClick={() => setActiveConversationId(null)}
                                className="md:hidden p-1 -ml-1 text-slate-500 dark:text-slate-400"
                                aria-label="Kembali"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {activeConversation.name?.[0]?.toUpperCase() || 'T'}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{activeConversation.name}</p>
                                <Link href={`/profile/${activeConversation.other_user_id}`} className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">
                                    Lihat Profil
                                </Link>
                            </div>
                        </div>

                        {/* Daftar Pesan */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                            {isLoadingMessages ? (
                                <p className="text-center text-xs text-slate-400 py-10">Memuat pesan...</p>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-xs text-slate-400 py-10">Belum ada pesan. Mulai percakapan!</p>
                            ) : (
                                messages.map((msg) => {
                                    const isMine = msg.sender_id === currentUserId;
                                    return (
                                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-3 py-2 rounded-2xl border ${isMine
                                                    ? 'bg-indigo-600 text-white border-indigo-700 rounded-br-sm'
                                                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 rounded-bl-sm'
                                                }`}>
                                                {!isMine && (
                                                    <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                                                        {msg.alumni_db?.nama_lengkap}
                                                    </p>
                                                )}
                                                <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-[9px] mt-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input Pesan */}
                        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder="Tulis pesan..."
                                className="h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 rounded-full px-4"
                            />
                            <Button
                                onClick={sendMessage}
                                disabled={!input.trim() || isSending}
                                className="h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full px-4 gap-1.5 flex-shrink-0"
                            >
                                <Send className="h-4 w-4" />
                                <span className="hidden sm:inline">Kirim</span>
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
                        <MessageCircle className="h-16 w-16 text-slate-200 dark:text-slate-800 mb-3" />
                        <h3 className="font-bold text-slate-900 dark:text-white">Pilih Percakapan</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                            Pilih percakapan di sidebar untuk melihat pesan, atau mulai percakapan baru dari halaman profil talenta.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}