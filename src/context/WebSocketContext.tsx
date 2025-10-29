// src/context/WebSocketContext.tsx
"use client"

import React, { createContext, useState, useContext, useRef, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

// Interface da notificação
interface VisitNotification {
    type: string;
    visit_id: string;
    patient_name: string;
    patient_id: string;
    reason: string;
    value: number;
    address: string;
}

// Tipagem do Contexto
interface WebSocketContextType {
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

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOnline, setIsOnline] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<VisitNotification | null>(null);
    const [showNotification, setShowNotification] = useState(false);
    const webSocketRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const intentionalDisconnect = useRef(false);

    // ===================================
    // CORREÇÃO: Usar useRef para a chamada recursiva no setTimeout
    // ===================================
    const connectFnRef = useRef<(() => void) | undefined>(undefined); // Ref para guardar a função connectWebSocket

    // Define a função connectWebSocket usando useCallback
    const connectWebSocket = useCallback(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.log("WebSocket: Token não encontrado, não conectando.");
            return;
        }
        // Previne múltiplas tentativas se já estiver conectando ou conectado
        if (webSocketRef.current || isConnecting) {
            console.warn(`WebSocket: Tentativa de conexão ignorada. Status atual: ${webSocketRef.current ? 'Conectado' : 'Conectando'}`);
            return;
        }

        console.log("Tentando conectar WebSocket (Manual)...");
        setIsConnecting(true);
        intentionalDisconnect.current = false; // Resetar flag sempre que tentar conectar

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
                webSocketRef.current = null; // Sempre limpa a ref

                // Causa 1: Desconexão intencional
                if (intentionalDisconnect.current || event.code === 1000) {
                    console.log("Fechamento intencional ou normal do WebSocket.");
                    setIsOnline(false);
                    setIsConnecting(false);
                    reconnectAttempts.current = 0;
                    if (intentionalDisconnect.current && event.reason !== "Provider Unmounted") {
                        toast.info("Você ficou offline.");
                    }
                }
                // Causa 2: Desconexão inesperada
                else if (reconnectAttempts.current < 5) {
                    reconnectAttempts.current++;
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    console.log(`WebSocket: Conexão perdida (tentativa ${reconnectAttempts.current}). Tentando reconectar em ${delay / 1000}s...`);
                    setIsConnecting(true); // Indica tentativa de reconexão
                    setIsOnline(false);

                    // ===================================
                    // CORREÇÃO: Chama a função via ref.current
                    // ===================================
                    setTimeout(() => connectFnRef.current?.(), delay); // Tenta reconectar usando a ref

                }
                // Causa 3: Atingiu o limite
                else {
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
                // Se o erro foi antes de abrir, impede reconexão pelo onclose
                if (!isOnline && webSocketRef.current?.readyState !== WebSocket.OPEN) {
                   reconnectAttempts.current = 5;
                   // Considerar não mostrar toast aqui se onclose já mostrar um
                   // toast.error("Falha ao conectar o WebSocket.");
                }
                 // Deixa o onclose lidar com a limpeza da ref e toast final, se necessário
            };

        } catch (error) {
            console.error("Falha ao criar instância do WebSocket (Global):", error);
            toast.error("Não foi possível iniciar a conexão WebSocket.");
            setIsConnecting(false);
            setIsOnline(false);
            reconnectAttempts.current = 5; // Impede reconexão
        }
    // A dependência 'isConnecting' ajuda a prevenir chamadas múltiplas enquanto conecta
    }, [isConnecting]);

    // ===================================
    // CORREÇÃO: Efeito para atualizar a ref da função
    // ===================================
    useEffect(() => {
        // Atualiza a ref com a versão mais recente (memoizada) da função
        // sempre que ela (ou suas dependências) mudarem.
        connectFnRef.current = connectWebSocket;
    }, [connectWebSocket]);


    // Função de Desconexão (mantida igual à última versão)
    const disconnectWebSocket = useCallback(() => {
        if (webSocketRef.current) {
            console.log("Desconectando WebSocket intencionalmente (Global)...");
            intentionalDisconnect.current = true; // Seta a flag ANTES de fechar
            webSocketRef.current.close(1000, "Logout pelo usuário"); // Código 1000 para fechamento normal
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
                intentionalDisconnect.current = true; // Marca como intencional
                webSocketRef.current.close(1000, "Provider Unmounted");
            }
        };
    }, []);


    // O valor do contexto
    const value: WebSocketContextType = {
        isOnline,
        isConnecting,
        currentNotification,
        showNotification,
        connectWebSocket, // Passa a função memoizada
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