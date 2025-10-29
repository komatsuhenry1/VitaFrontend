// src/components/GlobalNotificationDialog.tsx
"use client" // Essencial para componentes que usam hooks como useState, useEffect, useRouter, useContext

import { useRouter } from "next/navigation";
import { User, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWebSocket } from "@/context/WebSocketContext"; // Importa o hook do contexto
import { toast } from "sonner";

// Componente para o Dialog Global
export const GlobalNotificationDialog = () => {
    const { showNotification, setShowNotification, currentNotification } = useWebSocket();
    const router = useRouter(); // Para navegação

    // Funções de ação (placeholders, como antes)
    const handleAcceptVisit = (visitId: string | undefined) => {
        if (!visitId) return;
        console.log("(Global) Aceitando visita:", visitId);
        toast.info(`(Global) Aceitando visita ${visitId}... (Lógica a implementar)`);
        setShowNotification(false); // Fecha o dialog
    }

    const handleRejectVisit = (visitId: string | undefined) => {
        if (!visitId) return;
        console.log("(Global) Rejeitando visita:", visitId);
        toast.warning(`(Global) Rejeitando visita ${visitId}... (Lógica a implementar)`);
        setShowNotification(false); // Fecha o dialog
    }

    const handleViewPatientProfile = (patientId: string | undefined) => {
        if (!patientId) {
            toast.error("ID do paciente não encontrado.");
            return;
        }
        setShowNotification(false); // Fecha o dialog
        // Ajuste o caminho se a rota do perfil do paciente for diferente
        router.push(`/patient-profile/${patientId}`);
    }

    // Não renderiza nada se não houver notificação para mostrar
    if (!showNotification || !currentNotification) {
        return null;
    }

    return (
        <Dialog open={showNotification} onOpenChange={setShowNotification}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BellRing className="text-yellow-500" />
                        Nova Solicitação de Visita Imediata!
                    </DialogTitle>
                    <DialogDescription>
                        Você recebeu um novo pedido de atendimento. Revise e responda.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    <p><span className="font-semibold">Paciente:</span> {currentNotification.patient_name}</p>
                    <p><span className="font-semibold">Motivo:</span> {currentNotification.reason}</p>
                    <p><span className="font-semibold">Endereço:</span> {currentNotification.address}</p>
                    <p><span className="font-semibold">Valor:</span> R$ {currentNotification.value.toFixed(2)}</p>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="secondary"
                        onClick={() => handleViewPatientProfile(currentNotification?.patient_id)}
                        disabled={!currentNotification?.patient_id}
                        className="flex items-center gap-2"
                    >
                        <User size={16} /> Ver Perfil
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleRejectVisit(currentNotification?.visit_id)}>
                            Rejeitar
                        </Button>
                        <Button
                            className="bg-green-700 hover:bg-green-800"
                            onClick={() => handleAcceptVisit(currentNotification?.visit_id)}
                        >
                            Aceitar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}