// src/context/WebSocketContext.tsx
"use client"

import React, { createContext, useState, useContext, useRef, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

// Interface da notificação (mantida)
interface VisitNotification {
    type: string;
    visit_id: string;
    patient_name: string;
    patient_id: string;
    reason: string;
    value: number;
    address: string;
}

// Tipagem do Contexto (mantida)
interface WebSocketContextType {
    isOnline: boolean;
    isConnecting: boolean;
    currentNotification: VisitNotification | null;
    showNotification: boolean;
    connectWebSocket: () => void; // Tipo já definido aqui
    disconnectWebSocket: () => void;
    setShowNotification: React.Dispatch<React.SetStateAction<boolean>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8081";

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<VisitNotification | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const intentionalDisconnect = useRef(false);

    // ===================================
    // CORREÇÃO: Declarar a função ANTES do useCallback para ajudar o TS
    // ===================================
    let connectWebSocketFn: () => void; // Declara a variável com o tipo

    // Função de Conexão
    // Atribui a função criada pelo useCallback à variável declarada
    connectWebSocketFn = useCallback(() => {
        // Copia a referência localmente para usar dentro dos callbacks
        const localConnectWebSocket = connectWebSocketFn;

        const token = localStorage.getItem("token");
        if (!token) {
            console.log("WebSocket: Token não encontrado, não conectando.");
            return;
        }
        if (webSocketRef.current || isConnecting) {
            console.warn("WebSocket: Conexão já existe ou está em andamento.");
            return;
        }

        console.log("Tentando conectar WebSocket (Manual)...");
        setIsConnecting(true);
        intentionalDisconnect.current = false;

        const wsUrl = `${WS_BASE_URL}/ws/chat?token=${token}`;
        console.log("URL final da conexão (Global):", wsUrl);

        try {
            const ws = new WebSocket(wsUrl);
            webSocketRef.current = ws;

            ws.onopen = () => {
                console.log("WebSocket conectado com sucesso (Global)!");
                setIsOnline(true);
                setIsConnecting(false);
                reconnectAttempts.current = 0;
                toast.success("Você está online!");
            };

            ws.onmessage = (event) => {
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
                webSocketRef.current = null;

                if (intentionalDisconnect.current || event.code === 1000) {
                    console.log("Fechamento intencional ou normal do WebSocket.");
                    setIsOnline(false);
                    setIsConnecting(false);
                    reconnectAttempts.current = 0;
                    if (intentionalDisconnect.current && event.reason !== "Provider Unmounted") {
                        toast.info("Você ficou offline.");
                    }
                } else if (reconnectAttempts.current < 5) {
                    reconnectAttempts.current++;
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    console.log(`WebSocket: Conexão perdida (tentativa ${reconnectAttempts.current}). Tentando reconectar em ${delay / 1000}s...`);
                    setIsConnecting(true);
                    setIsOnline(false);
                    // Usa a referência local aqui
                    setTimeout(localConnectWebSocket, delay); // Tenta reconectar
                } else {
                    console.error("Máximo de tentativas de reconexão atingido.");
                    toast.error("Não foi possível reconectar ao servidor de notificações.");
                    setIsOnline(false);
                    setIsConnecting(false);
                }
            };

            ws.onerror = (errorEvent) => {
                console.error("Erro na conexão WebSocket (Global):", errorEvent);
                setIsConnecting(false);
                setIsOnline(false);
                if (!isOnline) { // Usamos isOnline do estado aqui
                    reconnectAttempts.current = 5;
                    toast.error("Falha ao conectar o WebSocket.");
                }
            };

        } catch (error) {
            console.error("Falha ao criar instância do WebSocket (Global):", error);
            toast.error("Não foi possível iniciar a conexão WebSocket.");
            setIsConnecting(false);
            setIsOnline(false);
            reconnectAttempts.current = 5;
        }
        // Removido 'connectWebSocket' da lista de dependências para quebrar a referência circular
    }, [isConnecting]);

    // Reatribui a função final (garantido pelo useCallback) à variável exportada pelo contexto
    const connectWebSocket = connectWebSocketFn;

    // Função de Desconexão (mantida igual)
    const disconnectWebSocket = useCallback(() => {
        if (webSocketRef.current) {
            console.log("Desconectando WebSocket intencionalmente (Global)...");
            intentionalDisconnect.current = true;
            webSocketRef.current.close(1000, "Logout pelo usuário");
        } else {
            console.warn("Nenhuma conexão WebSocket para fechar (Global).");
            setIsOnline(false);
            setIsConnecting(false);
        }
    }, []);

    // Efeito para Limpeza Geral do Provider (mantido)
    useEffect(() => {
        return () => {
            if (webSocketRef.current) {
                console.log("Limpando WebSocket Provider: Fechando conexão.");
                intentionalDisconnect.current = true;
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
        connectWebSocket, // Passa a função finalizada
        disconnectWebSocket,
        setShowNotification,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
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