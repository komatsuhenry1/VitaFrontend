// src/components/GlobalNotificationDialog.tsx (ou onde estiver)
"use client"

import { useState } from "react"; // Adicionado useState
import { useRouter } from "next/navigation";
// Ícone 'User' removido, 'ClipboardList' adicionado
import { BellRing, Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWebSocket } from "@/context/WebSocketContext";
import { toast } from "sonner";

// Assume que API_BASE_URL está acessível (se não, importe/defina)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export const GlobalNotificationDialog = () => {
    const { showNotification, setShowNotification, currentNotification } = useWebSocket();
    const router = useRouter();

    // Estados de loading para os botões
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // --- Função para ACEITAR visita (Mantida) ---
    const handleAcceptVisit = async (visitId: string | undefined) => {
        if (!visitId) return;
        setIsAccepting(true); // Inicia loading

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Erro de autenticação.");
            setIsAccepting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${visitId}`, { // Endpoint correto
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json", // Mesmo sem body, é boa prática
                },
            });

            if (response.ok) {
                const result = await response.json().catch(() => ({})); // Tenta pegar a resposta, mas ignora se não tiver
                toast.success("Visita aceita com sucesso!");
                setShowNotification(false); // Fecha o dialog
            } else {
                const errorResult = await response.json().catch(() => ({ message: "Erro desconhecido ao aceitar visita" }));
                throw new Error(errorResult.message || `Erro ${response.status} ao aceitar visita.`);
            }
        } catch (error) {
            console.error("Erro ao aceitar visita:", error);
            toast.error(error instanceof Error ? error.message : "Não foi possível aceitar a visita.");
        } finally {
            setIsAccepting(false); // Finaliza loading
        }
    }

    // --- Função para REJEITAR visita (Mantida) ---
    const handleRejectVisit = async (visitId: string | undefined) => {
        if (!visitId) return;
        setIsRejecting(true); // Inicia loading

        const token = localStorage.getItem("token");
        if (!token) {
            toast.error("Erro de autenticação.");
            setIsRejecting(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/nurse/reject-visit/${visitId}`, { // Endpoint correto
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const result = await response.json().catch(() => ({}));
                toast.success("Visita rejeitada com sucesso.");
                setShowNotification(false); // Fecha o dialog
            } else {
                const errorResult = await response.json().catch(() => ({ message: "Erro desconhecido ao rejeitar visita" }));
                throw new Error(errorResult.message || `Erro ${response.status} ao rejeitar visita.`);
            }
        } catch (error) {
            console.error("Erro ao rejeitar visita:", error);
            toast.error(error instanceof Error ? error.message : "Não foi possível rejeitar a visita.");
        } finally {
            setIsRejecting(false); // Finaliza loading
        }
    }

    // --- Função para VER DETALHES (Atualizada) ---
    const handleViewDetails = (visitId: string | undefined) => {
        if (!visitId) {
            toast.error("ID da visita não encontrado.");
            return;
        }
        setShowNotification(false);
        // Usa o visitId dinâmico para navegar para a página de detalhes
        router.push(`/visit-details/nurse/${visitId}`);
    }


    if (!showNotification || !currentNotification) {
        return null;
    }

    // Define estado geral de loading para desabilitar outros botões
    const isLoading = isAccepting || isRejecting;

    return (
        <Dialog open={showNotification} onOpenChange={(open) => !isLoading && setShowNotification(open)}> {/* Previne fechar enquanto carrega */}
            <DialogContent>
                <DialogHeader>
                    {/* ... Título e Descrição ... */}
                    <DialogTitle className="flex items-center gap-2">
                        <BellRing className="text-yellow-500" />
                        Nova Solicitação de Visita Imediata!
                    </DialogTitle>
                    <DialogDescription>
                        Você recebeu um novo pedido de atendimento. Revise e responda.
                    </DialogDescription>
                </DialogHeader>
                {/* Detalhes da notificação (mantido) */}
                <div className="space-y-3 py-4">
                    <p><span className="font-semibold">Paciente:</span> {currentNotification.patient_name}</p>
                    <p><span className="font-semibold">Motivo:</span> {currentNotification.reason}</p>
                    <p><span className="font-semibold">Endereço:</span> {currentNotification.address}</p>
                    <p><span className="font-semibold">Valor:</span> R$ {currentNotification.value.toFixed(2)}</p>
                </div>
                {/* Footer com botões atualizados */}
                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="secondary"
                        // Chama a nova função com o visit_id
                        onClick={() => handleViewDetails(currentNotification?.visit_id)}
                        // Desabilita se estiver carregando ou se não houver visit_id
                        disabled={isLoading || !currentNotification?.visit_id}
                        className="flex items-center gap-2"
                    >
                        <ClipboardList size={16} /> {/* Ícone atualizado */}
                        Ver Detalhes {/* Texto atualizado */}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => handleRejectVisit(currentNotification?.visit_id)}
                            disabled={isLoading} // Desabilita durante loading
                        >
                            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Rejeitar
                        </Button>
                        <Button
                            className="bg-green-700 hover:bg-green-800"
                            onClick={() => handleAcceptVisit(currentNotification?.visit_id)}
                            disabled={isLoading} // Desabilita during loading
                        >
                            {isAccepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Aceitar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
