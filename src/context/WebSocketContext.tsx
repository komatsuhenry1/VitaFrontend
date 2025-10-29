// src/context/WebSocketContext.tsx
"use client"

import React, { createContext, useState, useContext, useRef, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

// Interface da notificação (mantida)
interface VisitNotification { /* ... */
    type: string;
    visit_id: string;
    patient_name: string;
    patient_id: string;
    reason: string;
    value: number;
    address: string;
}

// Tipagem do Contexto (mantida)
interface WebSocketContextType { /* ... */
    isOnline: boolean;
    isConnecting: boolean;
    currentNotification: VisitNotification | null;
    showNotification: boolean;
    connectWebSocket: () => void;
    disconnectWebSocket: () => void;
    setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8081";
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL; // Não necessário aqui por enquanto

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<VisitNotification | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    // NOVO: Ref para saber se a desconexão foi intencional
    const intentionalDisconnect = useRef(false);

    // Função de Conexão (ajustada)
    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.log("WebSocket: Token não encontrado, não conectando.");
            // Não mostra toast aqui, pois pode acontecer antes do usuário interagir
            return;
        }
        if (webSocketRef.current || isConnecting) { // Previne múltiplas conexões
            console.warn("WebSocket: Conexão já existe ou está em andamento.");
            return;
        }

        console.log("Tentando conectar WebSocket (Manual)...");
        setIsConnecting(true);
        intentionalDisconnect.current = false; // Resetar flag de intenção

        const wsUrl = `${WS_BASE_URL}/ws/chat?token=${token}`;
        console.log("URL final da conexão (Global):", wsUrl);

        try {
            const ws = new WebSocket(wsUrl);
            webSocketRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket conectado com sucesso (Global)!");
                setIsOnline(true);
                setIsConnecting(false);
                reconnectAttempts.current = 0; // Reseta tentativas SÓ SUCESSO
                toast.success("Você está online!"); // Mover toast para cá
            };

            ws.onmessage = (event) => {
                // ... (lógica onmessage mantida) ...
                console.log("Mensagem recebida (Global):", event.data);
                try {
                    const messageData = JSON.parse(event.data);
                    if (messageData.type === "IMMEDIATE_VISIT_REQUEST") {
                        setCurrentNotification(messageData as VisitNotification);
                        setShowNotification(true);
                    } else {
                        console.log("Mensagem de outro tipo recebida (Global):", messageData);
                    }
                } catch (e) {
                    console.error("Erro ao processar mensagem WebSocket (Global):", e);
                }
            };

            ws.onclose = (event) => {
                console.log("WebSocket desconectado (Global):", event.code, event.reason);
                // Só atualiza estados se não estiver já tentando conectar outra vez
                // (evita piscar o botão se a reconexão for rápida)
                if (!isConnecting) {
                    setIsOnline(false);
                }
                // setIsConnecting(false); // Será setado para false pela reconexão ou erro
                webSocketRef.current = null;

                // --- Lógica de Reconexão REFINADA ---
                // Só tenta reconectar se:
                // 1. NÃO foi uma desconexão intencional (código 1000 ou nossa flag)
                // 2. Ainda não atingiu o limite de tentativas
                if (event.code !== 1000 && !intentionalDisconnect.current && reconnectAttempts.current < 5) {
                    reconnectAttempts.current++;
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    console.log(`WebSocket: Conexão perdida (tentativa ${reconnectAttempts.current}). Tentando reconectar em ${delay / 1000}s...`);
                    // Não seta isConnecting aqui, a próxima chamada a connectWebSocket fará isso
                    setTimeout(connectWebSocket, delay); // Tenta reconectar
                } else if (reconnectAttempts.current >= 5) {
                    // Só mostra o erro se já tiver tentado 5 vezes
                    console.error("Máximo de tentativas de reconexão atingido.");
                    toast.error("Não foi possível reconectar ao servidor de notificações.");
                    setIsConnecting(false); // Garante que parou de tentar
                } else {
                    // Fechamento normal ou intencional
                    console.log("Fechamento normal ou intencional do WebSocket.");
                    reconnectAttempts.current = 0; // Reseta para futuras conexões manuais
                    setIsConnecting(false); // Garante que parou
                    if (event.reason !== "Logout pelo usuário" && event.code === 1000 && intentionalDisconnect.current) {
                        toast.info("Você ficou offline."); // Mostra toast só na desconexão manual
                    }
                }
                // Limpa a flag de intenção após o onclose ser processado
                // intentionalDisconnect.current = false; // Movido para connectWebSocket
            };

            ws.onerror = (errorEvent) => {
                console.error("Erro inicial na conexão WebSocket (Global):", errorEvent);
                // O onerror geralmente dispara o onclose em seguida.
                // Apenas garantimos que o estado de conexão pare.
                setIsConnecting(false);
                setIsOnline(false); // Garante que está offline
                if (!webSocketRef.current) { // Se o erro ocorreu antes do onopen
                    toast.error("Falha ao conectar o WebSocket.");
                    reconnectAttempts.current = 5; // Impede a reconexão pelo onclose que virá
                }
                // Não limpamos webSocketRef aqui, onclose fará isso.
            };
        } catch (error) {
            console.error("Falha ao criar instância do WebSocket (Global):", error);
            toast.error("Não foi possível iniciar a conexão WebSocket.");
            setIsConnecting(false);
            setIsOnline(false);
            reconnectAttempts.current = 5; // Impede reconexão
        }
    }, [isConnecting]); // Mantém isConnecting para evitar race condition

    // Função de Desconexão (ajustada)
    const disconnectWebSocket = useCallback(() => {
        if (webSocketRef.current) {
            console.log("Desconectando WebSocket intencionalmente (Global)...");
            intentionalDisconnect.current = true; // Seta a flag ANTES de fechar
            reconnectAttempts.current = 5; // Previne reconexão automática
            webSocketRef.current.close(1000, "Logout pelo usuário"); // Código 1000 para fechamento normal
            // O onclose vai setar isOnline e isConnecting para false
        } else {
            console.warn("Nenhuma conexão WebSocket para fechar (Global).");
            setIsOnline(false); // Garante o estado
            setIsConnecting(false);
        }
    }, []);

    // Efeito para Limpeza Geral do Provider (mantido)
    useEffect(() => {
        return () => {
            if (webSocketRef.current) {
                console.log("Limpando WebSocket Provider: Fechando conexão.");
                intentionalDisconnect.current = true; // Marca como intencional
                webSocketRef.current.close(1000, "Provider Unmounted");
            }
        };
    }, []);


    // O valor do contexto (mantido)
    const value: WebSocketContextType = {
        isOnline,
        isConnecting,
        currentNotification,
        showNotification,
        connectWebSocket,
        disconnectWebSocket,
        setShowNotification,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
            {/* O Dialog Global já está no layout.tsx */}
        </WebSocketContext.Provider>
    );
};

// Hook Customizado (mantido)
export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};