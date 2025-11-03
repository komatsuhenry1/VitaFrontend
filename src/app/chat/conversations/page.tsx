"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// --- MUDANÇA: Ícone de seta importado ---
import { ArrowLeft, Loader2, MessageSquareText, Search, Send } from "lucide-react"
import { Header } from "@/components/Header"

interface Message {
    id: string
    sender_id: string
    sender_name: string
    sender_role: "PATIENT" | "NURSE"
    message: string
    timestamp: string
    read: boolean
}

interface ChatPartner {
    id: string
    name: string
    specialization?: string
    image?: string
    available: boolean
}

interface User {
    _id: string
    name: string
    role: "PATIENT" | "NURSE"
}

interface Conversation {
    partner_id: string
    partner_name: string
    partner_image_id?: string
    last_message: string
    last_message_timestamp: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL

export default function ChatsPage() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null)
    const [sending, setSending] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [loadingChat, setLoadingChat] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socketRef = useRef<WebSocket | null>(null)
    const router = useRouter()

    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    useEffect(() => {
        // Só executa se 'user' já foi carregado
        if (!user) return

        const fetchConversations = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            // --- MUDANÇA AQUI ---
            // Define a URL correta baseado no 'role' do usuário
            let conversationsUrl = ""
            if (user.role === "NURSE") {
                conversationsUrl = `${API_BASE_URL}/chat/nurse/conversations`
            } else if (user.role === "PATIENT") {
                conversationsUrl = `${API_BASE_URL}/chat/patient/conversations`
            } else {
                setLoading(false)
                console.error("Role de usuário desconhecido:", user.role)
                return // Não faz nada se o role não for reconhecido
            }
            // --- FIM DA MUDANÇA ---

            try {
                const response = await fetch(conversationsUrl, { // Usa a URL dinâmica
                    headers: { Authorization: `Bearer ${token}` },
                    cache: "no-store",
                })

                if (response.ok) {
                    const result = await response.json()
                    if (result.success) {
                        setConversations(result.data)
                    }
                }
            } catch (error) {
                console.error("Erro na requisição:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchConversations()
    }, [user, router]) // <--- MUDANÇA: Depende do 'user' estar carregado
    
    useEffect(() => {
        if (!selectedChatId || !user) return

        const fetchChatData = async () => {
            setLoadingChat(true)
            try {
                const token = localStorage.getItem("token")
                if (!token) return

                const headers = { Authorization: `Bearer ${token}` }

                // Fetch partner profile
                let profileUrl = ""
                if (user.role === "PATIENT") {
                    profileUrl = `${API_BASE_URL}/user/nurse/${selectedChatId}`
                } else if (user.role === "NURSE") {
                    profileUrl = `${API_BASE_URL}/nurse/patient/${selectedChatId}`
                }

                if (profileUrl) {
                    const profileResponse = await fetch(profileUrl, { headers, cache: "no-store" })
                    if (profileResponse.ok) {
                        const profileResult = await profileResponse.json()
                        if (profileResult.success && profileResult.data) {
                            const partnerData = profileResult.data
                            setChatPartner({
                                id: partnerData.id || partnerData._id,
                                name: partnerData.name,
                                specialization: partnerData.specialization,
                                image: partnerData.image || partnerData.profile_image_id,
                                available: partnerData.available !== undefined ? partnerData.available : true,
                            })
                        }
                    }
                }

                // Fetch messages
                const messagesResponse = await fetch(`${API_BASE_URL}/chat/messages/${selectedChatId}`, {
                    headers,
                    cache: "no-store",
                })
                if (messagesResponse.ok) {
                    const messagesResult = await messagesResponse.json()
                    if (messagesResult.success && messagesResult.data) {
                        setMessages(messagesResult.data)
                    }
                }
            } catch (error) {
                console.error("Error fetching chat data:", error)
            } finally {
                setLoadingChat(false)
            }
        }

        fetchChatData()
    }, [selectedChatId, user])

    useEffect(() => {
        if (!user) return

        const token = localStorage.getItem("token")
        if (!token) return

        const socket = new WebSocket(`${WS_BASE_URL}/ws/chat?token=${token}`)
        socketRef.current = socket

        socket.onopen = () => console.log("WebSocket: Conexão estabelecida.")
        socket.onclose = () => console.log("WebSocket: Conexão encerrada.")
        socket.onerror = (error) => console.error("WebSocket: Erro detectado:", error)

        socket.onmessage = (event) => {
            const receivedMessage: Message = JSON.parse(event.data)
            if (receivedMessage.sender_id !== user._id) {
                setMessages((prevMessages) => [...prevMessages, receivedMessage])
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
        }
    }, [user])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !socketRef.current || !user || !selectedChatId) return

        const tempMessage: Message = {
            id: Date.now().toString(),
            sender_id: user._id,
            sender_name: user.name,
            sender_role: user.role,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
            read: false,
        }

        setMessages((prevMessages) => [...prevMessages, tempMessage])

        const messagePayload = {
            receiver_id: selectedChatId,
            message: newMessage.trim(),
        }

        socketRef.current.send(JSON.stringify(messagePayload))
        setNewMessage("")
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

        if (diffInHours < 24) {
            return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        } else {
            return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
        }
    }

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return "Hoje"
        } else if (date.toDateString() === yesterday.toDateString()) {
            return "Ontem"
        } else {
            return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
        }
    }

    const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
        const date = formatDate(message.timestamp)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

    const filteredConversations = conversations.filter((convo) =>
        convo.partner_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    const avatarUrl = chatPartner?.image ? `${API_BASE_URL}/user/file/${chatPartner.image}` : undefined
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid #e5e7eb",
                                borderTop: "4px solid #15803d",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 1rem",
                            }}
                        ></div>
                        <p style={{ color: "#6b7280" }}>Carregando configurações...</p>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="flex h-screen" style={{ backgroundColor: "#f0f2f5" }}>
            <div
                className="w-full md:w-[400px] flex flex-col border-r"
                style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
            >
                {/* --- MUDANÇA: Header da sidebar atualizado com botão --- */}
                <div
                    className="flex items-center gap-4 p-4 border-b"
                    style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
                >
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                        aria-label="Voltar"
                    >
                        <ArrowLeft className="h-6 w-6 text-white" />
                    </button>
                    <h1 className="text-xl font-semibold text-black">Conversas</h1>
                </div>

                <div className="p-3 border-b" style={{ borderColor: "#e5e7eb" }}>
                    {/* ... (barra de busca sem alterações) */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar conversa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            style={{ backgroundColor: "#f0f2f5" }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* ... (lista de conversas sem alterações) */}
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <MessageSquareText className="h-16 w-16 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium">
                                {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                {searchQuery ? "Tente buscar por outro nome" : "Suas conversas aparecerão aqui"}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {filteredConversations.map((convo) => (
                                <div
                                    key={convo.partner_id}
                                    onClick={() => setSelectedChatId(convo.partner_id)}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b transition-colors"
                                    style={{
                                        backgroundColor: selectedChatId === convo.partner_id ? "#f0f2f5" : "transparent",
                                        borderColor: "#e5e7eb",
                                    }}
                                >
                                    <Avatar className="h-12 w-12 flex-shrink-0">
                                        <AvatarImage
                                            src={
                                                convo.partner_image_id
                                                    ? `${API_BASE_URL}/user/file/${convo.partner_image_id}`
                                                    : "/placeholder.svg"
                                            }
                                            alt={convo.partner_name}
                                        />
                                        <AvatarFallback style={{ backgroundColor: "#15803d", color: "white" }}>
                                            {convo.partner_name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="font-semibold text-gray-900 truncate">{convo.partner_name}</p>
                                            <time className="text-xs flex-shrink-0 ml-2" style={{ color: "#15803d" }}>
                                                {formatTime(convo.last_message_timestamp)}
                                            </time>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{convo.last_message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MUDANÇA: Fundo bege removido --- */}
            <div className="hidden md:flex flex-1 flex-col">
                {!selectedChatId ? (
                    <div className="flex items-center justify-center h-full">
                        {/* ... (tela inicial sem alterações) */}
                        <div className="text-center p-8">
                            <MessageSquareText className="h-24 w-24 mx-auto mb-4" style={{ color: "#15803d", opacity: 0.3 }} />
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Vita Chat</h2>
                            <p className="text-gray-500">Selecione uma conversa para começar a conversar</p>
                        </div>
                    </div>
                ) : loadingChat ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#15803d" }} />
                    </div>
                ) : (
                    <>
                        {/* ... (Header, Mensagens e Input do Chat sem alterações de lógica) */}
                        <div className="bg-white border-b p-4 flex items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={chatPartner?.name} />
                                    <AvatarFallback>{chatPartner?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {chatPartner?.available && (
                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="font-semibold text-lg truncate">{chatPartner?.name}</h2>
                                {chatPartner?.specialization && (
                                    <p className="text-sm text-gray-500 truncate">{chatPartner.specialization}</p>

                                )}
                            </div>
                            {chatPartner?.available && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    Online
                                </Badge>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                                <div key={date} className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <Badge variant="secondary" className="text-xs">
                                            {date}
                                        </Badge>
                                    </div>

                                    {dateMessages.map((message) => {
                                        const isOwnMessage = message.sender_id === user?._id

                                        return (
                                            <div key={message.id} className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                                {!isOwnMessage && (
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={message.sender_name} />
                                                        <AvatarFallback>{message.sender_name?.charAt(0) || "?"}</AvatarFallback>
                                                    </Avatar>
                                                )}

                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwnMessage ? "bg-green-600 text-white" : "bg-white border"
                                                        }`}
                                                >
                                                    {!isOwnMessage && (
                                                        <p className="text-xs font-medium mb-1 text-gray-500">{message.sender_name}</p>
                                                    )}
                                                    <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                                    <p className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-gray-500"}`}>
                                                        {formatMessageTime(message.timestamp)}
                                                    </p>
                                                </div>

                                                {isOwnMessage && (
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback style={{ backgroundColor: "#15803d", color: "white" }}>
                                                            {user?.name?.charAt(0) || "V"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}

                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <Send className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: "#15803d" }} />
                                    <p className="text-lg font-medium text-gray-600">Nenhuma mensagem ainda</p>
                                    <p className="text-sm text-gray-500">Envie uma mensagem para iniciar a conversa</p>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-white border-t p-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Digite sua mensagem..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={sending}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sending}
                                    size="icon"
                                    style={{ backgroundColor: "#15803d" }}
                                    className="shrink-0"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}