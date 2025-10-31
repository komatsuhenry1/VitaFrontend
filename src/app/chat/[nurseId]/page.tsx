"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { Header } from "@/components/Header"

// Definimos as URLs base para a API HTTP e para o WebSocket
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL

// Interface para a estrutura de uma mensagem
interface Message {
    id: string
    sender_id: string
    sender_name: string
    sender_role: "PATIENT" | "NURSE"
    message: string
    timestamp: string
    read: boolean
}

// ALTERAÇÃO 1: Interface genérica para representar a pessoa com quem você está conversando
interface ChatPartner {
    id: string
    name: string
    specialization?: string // Opcional, pois um paciente não tem especialização
    image?: string
    available: boolean
}

// Interface para a estrutura do Usuário logado, agora com o campo 'role'
interface User {
    _id: string
    name: string
    role: "PATIENT" | "NURSE"
}

export default function ChatPage() {
    const params = useParams()
    const router = useRouter()
    // O ID na URL agora é tratado de forma genérica, pode ser um nurseId ou patientId
    const otherUserId = params.nurseId as string

    // --- Estados do Componente ---
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    // ALTERAÇÃO 2: O estado 'nurse' foi renomeado para 'chatPartner' para ser mais genérico
    const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [user, setUser] = useState<User | null>(null)

    // --- Referências ---
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const socketRef = useRef<WebSocket | null>(null)

    // Função para rolar para a última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    // Efeito para rolar para o final sempre que a lista de mensagens mudar
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Efeito para carregar os dados do usuário do localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [])

    // ALTERAÇÃO 3: Lógica de busca de dados foi reestruturada para ser condicional
    useEffect(() => {
        const fetchInitialData = async () => {
            // A função agora espera o 'user' ser carregado para saber o 'role'
            if (!user) return;

            setLoading(true)
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const headers = { Authorization: `Bearer ${token}` }
                
                let profileUrl = "";
                // Lógica condicional: decide qual endpoint chamar
                if (user.role === "PATIENT") {
                    profileUrl = `${API_BASE_URL}/user/nurse/${otherUserId}`;
                } else if (user.role === "NURSE") {
                    profileUrl = `${API_BASE_URL}/nurse/patient/${otherUserId}`;
                }

                // Busca o perfil do parceiro de chat (seja enfermeiro ou paciente)
                if (profileUrl) {
                    const profileResponse = await fetch(profileUrl, { headers, cache: "no-store" });
                    if (profileResponse.ok) {
                        const profileResult = await profileResponse.json();
                        if (profileResult.success && profileResult.data) {
                            const partnerData = profileResult.data;
                            // Mapeia os dados para uma estrutura consistente
                            setChatPartner({
                                id: partnerData.id || partnerData._id,
                                name: partnerData.name,
                                specialization: partnerData.specialization, // Será undefined para pacientes
                                image: partnerData.image || partnerData.profile_image_id,
                                available: partnerData.available !== undefined ? partnerData.available : true,
                            });
                        }
                    }
                }

                // Busca o histórico de mensagens
                const messagesResponse = await fetch(`${API_BASE_URL}/chat/messages/${otherUserId}`, { headers, cache: "no-store" })
                if (messagesResponse.ok) {
                    const messagesResult = await messagesResponse.json()
                    if (messagesResult.success && messagesResult.data) {
                        setMessages(messagesResult.data)
                    }
                }
            } catch (error) {
                console.error("Error fetching initial chat data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()
    }, [otherUserId, router, user]) // Adicionamos 'user' como dependência

    // ALTERAÇÃO 4: Lógica do WebSocket para ignorar as próprias mensagens
    useEffect(() => {
        // Só executa se já soubermos quem é o usuário logado
        if (!user) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = new WebSocket(`${WS_BASE_URL}/ws/chat?token=${token}`);
        socketRef.current = socket

        socket.onopen = () => console.log("WebSocket: Conexão estabelecida.")
        socket.onclose = () => console.log("WebSocket: Conexão encerrada.")
        socket.onerror = (error) => console.error("WebSocket: Erro detectado:", error)

        socket.onmessage = (event) => {
            const receivedMessage: Message = JSON.parse(event.data);
            
            // Ignora a mensagem se o remetente for o próprio usuário,
            // pois ela já foi adicionada pela atualização otimista.
            if (receivedMessage.sender_id !== user._id) {
                setMessages((prevMessages) => [...prevMessages, receivedMessage]);
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
        }
    }, [user]) // Adicionamos 'user' como dependência

    // ALTERAÇÃO 5: Lógica de "Atualização Otimista" ao enviar mensagem
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !socketRef.current || !socketRef.current.readyState || !user) {
            return
        }
        
        // Cria uma mensagem temporária para exibição imediata
        const tempMessage: Message = {
            id: Date.now().toString(), // Um ID único temporário
            sender_id: user._id,
            sender_name: user.name,
            sender_role: user.role,
            message: newMessage.trim(),
            timestamp: new Date().toISOString(),
            read: false,
        };

        // Adiciona a mensagem à tela instantaneamente
        setMessages((prevMessages) => [...prevMessages, tempMessage]);
        
        const messagePayload = {
            receiver_id: otherUserId,
            message: newMessage.trim(),
        };

        // Envia a mensagem real para o servidor em segundo plano
        socketRef.current.send(JSON.stringify(messagePayload));
        
        setNewMessage("");
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // Funções de formatação de data e hora
    const formatTime = (timestamp: string) => {
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

    // Agrupamento de mensagens por data
    const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
        const date = formatDate(message.timestamp)
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(message)
        return groups
    }, {})

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
                        <p style={{ color: "#6b7280" }}>Carregando chat...</p>
                    </div>
                </div>
            </div>
        )
    }

    const avatarUrl = chatPartner?.image ? `${API_BASE_URL}/user/file/${chatPartner.image}` : undefined

    return (
        <div className="flex flex-col h-screen bg-muted/30">
            {/* Header */}
            <Card className="rounded-none border-x-0 border-t-0">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={chatPartner?.name} />
                                <AvatarFallback>{chatPartner?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {chatPartner?.available && (
                                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="font-semibold text-lg truncate">{chatPartner?.name}</h2>
                            <p className="text-sm text-muted-foreground truncate">{chatPartner?.specialization}</p>
                        </div>

                        {chatPartner?.available && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Online
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date} className="space-y-4">
                        <div className="flex items-center justify-center">
                            <Badge variant="secondary" className="text-xs">
                                {date}
                            </Badge>
                        </div>

                        {dateMessages.map((message) => {
                            const isOwnMessage = message.sender_id === user?._id;

                            return (
                                <div key={message.id} className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                                    {!isOwnMessage && (
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={message.sender_name} />
                                            <AvatarFallback>{message.sender_name?.charAt(0) || '?'}</AvatarFallback>
                                        </Avatar>
                                    )}

                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwnMessage ? "bg-primary text-primary-foreground" : "bg-card border"
                                            }`}
                                    >
                                        {!isOwnMessage && (
                                            <p className="text-xs font-medium mb-1 text-muted-foreground">{message.sender_name}</p>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                                        <p
                                            className={`text-xs mt-1 ${isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                                                }`}
                                        >
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>

                                    {isOwnMessage && (
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarFallback>{user?.name?.charAt(0) || 'V'}</AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                ))}

                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="text-muted-foreground mb-2">
                            <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhuma mensagem ainda</p>
                            <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <Card className="rounded-none border-x-0 border-b-0">
                <CardContent className="p-4">
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
                            className="shrink-0"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}