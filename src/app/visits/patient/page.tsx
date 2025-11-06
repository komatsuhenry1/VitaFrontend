"use client"; // Correto para Next.js

import { useState, useEffect } from "react";
// 👇 ALTERAÇÃO: Trocado 'useNavigate' do 'react-router-dom' pelo 'useRouter' do 'next/navigation'
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Clock,
    CheckCircle,
    Info,
    MessageCircle,
    CheckCheck,
    Calendar,
    Star,
    User,
    MapPin,
    FileText,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { VariantProps } from "class-variance-authority";

// 👇 ALTERAÇÃO: Corrigido para o padrão do Next.js (você já tinha feito isso)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1";

// --- Interfaces ---

interface Visit {
    id: string;
    description: string;
    reason: string;
    visit_type: string;
    date: string;
    status: string;
    nurse: {
        id: string;
        name: string;
        specialization: string;
        image: string;
    };
    created_at: string;
    rating: number;
}

interface VisitsResponse {
    data: {
        all_visits: Visit[];
        visits_today: Visit[];
    };
    message: string;
    success: boolean;
}

// --- Funções Utilitárias (HELPER FUNCTIONS) ---

const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        console.error("Erro ao formatar data:", dateString, error);
        return "Data inválida";
    }
};

const getStatusVariant = (
    status: string,
): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "PENDING":
            return "secondary";
        case "CONFIRMED":
            return "default";
        case "COMPLETED":
            return "outline";
        default:
            return "secondary";
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case "PENDING":
            return "Pendente";
        case "CONFIRMED":
            return "Confirmada";
        case "COMPLETED":
            return "Concluída";
        default:
            return status;
    }
};

const getVisitTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
        case "domiciliar":
            return "Domiciliar";
        case "hospitalar":
            return "Hospitalar";
        case "clinica":
            return "Clínica";
        default:
            return type || "N/A";
    }
};

// --- Componente Principal ---

const Visits = () => {
    // 👇 ALTERAÇÃO: Usando o hook do Next.js
    const router = useRouter();
    const [visits, setVisits] = useState<Visit[]>([]);
    const [visitsToday, setVisitsToday] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [reviewVisit, setReviewVisit] = useState<Visit | null>(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        fetchVisits();
    }, []);

    const fetchVisits = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            if (!token) {
                // 👇 ALTERAÇÃO: navigate(...) -> router.push(...)
                router.push("/login");
                return;
            }

            const response = await fetch(`${API_BASE_URL}/user/visits`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Erro ao carregar visitas");
            }

            const result: VisitsResponse = await response.json();

            if (result.success && result.data) {
                setVisits(result.data.all_visits || []);
                setVisitsToday(result.data.visits_today || []);
            } else {
                throw new Error(result.message || "Erro ao carregar visitas");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (!reviewVisit || rating === 0) {
            toast.error("Por favor, selecione uma avaliação");
            return;
        }

        try {
            setSubmittingReview(true);
            const token = localStorage.getItem("token");

            const response = await fetch(`${API_BASE_URL}/user/review/${reviewVisit.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error("Erro ao enviar avaliação");
            }

            await fetchVisits();
            toast.success("Avaliação enviada com sucesso!");
            setShowReviewDialog(false);
            setReviewVisit(null);
            setRating(0);
            setComment("");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação");
        } finally {
            setSubmittingReview(false);
        }
    };

    const pendingVisits = visits.filter((visit) => visit.status === "PENDING");
    const confirmedVisits = visits.filter((visit) => visit.status === "CONFIRMED");
    const completedVisits = visits.filter((visit) => visit.status === "COMPLETED");

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">Carregando visitas...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center space-y-4">
                        <div className="text-destructive text-4xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-foreground">{error}</h2>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Tentar Novamente
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Header/>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Visitas</h1>
                    <p className="text-muted-foreground">
                        Acompanhe e gerencie suas consultas agendadas
                    </p>
                </div>

                {/* Today's Visits Section */}
                {visitsToday.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Visitas de Hoje</h2>
                                <Badge variant="default" className="mt-1">
                                    {visitsToday.length} {visitsToday.length === 1 ? "visita" : "visitas"}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {visitsToday.map((visit) => (
                                <Card
                                    key={visit.id}
                                    className="border-2 border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <img
                                                src={
                                                    visit.nurse?.image
                                                        ? `${API_BASE_URL}/user/file/${visit.nurse.image}`
                                                        : "/placeholder.svg"
                                                }
                                                alt={visit.nurse?.name || "Enfermeiro"}
                                                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                                                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate">
                                                    {visit.nurse?.name || "Enfermeiro não especificado"}
                                                </h3>
                                                <p className="text-sm text-primary font-medium">
                                                    {visit.nurse?.specialization || "Enfermagem"}
                                                </p>
                                                <Badge variant={getStatusVariant(visit.status)} className="mt-2">
                                                    {getStatusLabel(visit.status)}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{formatDate(visit.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{getVisitTypeLabel(visit.visit_type)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                <span className="truncate">{visit.reason}</span>
                                            </div>
                                        </div>

                                        <Button
                                            // 👇 ALTERAÇÃO: navigate(...) -> router.push(...)
                                            onClick={() => router.push(`/visit-details/patient/${visit.id}`)}
                                            className="w-full"
                                            size="sm"
                                        >
                                            <Info className="h-4 w-4 mr-2" />
                                            Ver Detalhes
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Visits Section */}
                {visits.length === 0 && visitsToday.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Calendar className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                Nenhuma visita agendada
                            </h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                Você ainda não tem visitas agendadas. Encontre um enfermeiro e agende sua
                                primeira consulta!
                            </p>
                            {/* 👇 ALTERAÇÃO: navigate(...) -> router.push(...) */}
                            <Button onClick={() => router.push("/")} size="lg">
                                Buscar Enfermeiros
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs
                        defaultValue={
                            confirmedVisits.length > 0
                                ? "confirmed"
                                : pendingVisits.length > 0
                                    ? "pending"
                                    : "completed"
                        }
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-6 h-auto">
                            <TabsTrigger value="pending" className="flex items-center gap-2 py-3">
                                <Clock className="h-4 w-4" />
                                <span className="hidden sm:inline">Pendentes</span>
                                <Badge variant="outline" className="ml-1">
                                    {pendingVisits.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2 py-3">
                                <CheckCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Confirmadas</span>
                                <Badge variant="outline" className="ml-1">
                                    {confirmedVisits.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2 py-3">
                                <CheckCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">Concluídas</span>
                                <Badge variant="outline" className="ml-1">
                                    {completedVisits.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-4">
                            {pendingVisits.length === 0 ? (
                                <EmptyState
                                    icon={<Clock className="h-12 w-12 text-muted-foreground" />}
                                    title="Nenhuma visita pendente"
                                    description="Você não tem visitas aguardando confirmação."
                                />
                            ) : (
                                pendingVisits.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        // 👇 ALTERAÇÃO: navigate(...) -> router.push(...)
                                        onViewDetails={() => router.push(`/visit-details/patient/${visit.id}`)}
                                    />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="confirmed" className="space-y-4">
                            {confirmedVisits.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCircle className="h-12 w-12 text-primary" />}
                                    title="Nenhuma visita confirmada"
                                    description="Você não tem visitas confirmadas no momento."
                                />
                            ) : (
                                confirmedVisits.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        // 👇 ALTERAÇÃO: navigate(...) -> router.push(...)
                                        onViewDetails={() => router.push(`/visit-details/patient/${visit.id}`)}
                                        onViewProfile={() => router.push(`/nurse-profile/${visit.nurse?.id}`)}
                                        onChat={() => router.push(`/chat/${visit.nurse?.id}`)}
                                    />
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="completed" className="space-y-4">
                            {completedVisits.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCheck className="h-12 w-12 text-blue-500" />}
                                    title="Nenhuma visita concluída"
                                    description="Você ainda não tem visitas concluídas."
                                />
                            ) : (
                                completedVisits.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        // 👇 ALTERAÇÃO: navigate(...) -> router.push(...)
                                        onViewDetails={() => router.push(`/visit-details/patient/${visit.id}`)}
                                        onReview={
                                            visit.rating === 0
                                                ? () => {
                                                    setReviewVisit(visit);
                                                    setRating(0);
                                                    setComment("");
                                                    setShowReviewDialog(true);
                                                }
                                                : undefined
                                        }
                                        rating={visit.rating}
                                    />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* Review Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Avaliar Atendimento</DialogTitle>
                        <DialogDescription>
                            Como foi sua experiência com {reviewVisit?.nurse?.name}?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div>
                            <label className="text-sm font-semibold mb-3 block">Avaliação *</label>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
                                    >
                                        <Star
                                            className="h-10 w-10"
                                            fill={star <= rating ? "hsl(var(--warning))" : "transparent"}
                                            stroke={star <= rating ? "hsl(var(--warning))B)" : "hsl(var(--border))"}
                                            strokeWidth={2}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
                                {rating === 0 && "Selecione uma avaliação"}
                                {rating === 1 && "Muito Ruim"}
                                {rating === 2 && "Ruim"}
                                {rating === 3 && "Regular"}
                                {rating === 4 && "Bom"}
                                {rating === 5 && "Excelente"}
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-semibold mb-2 block">
                                Comentário (opcional)
                            </label>
                            <Select value={comment} onValueChange={setComment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um comentário..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {reviewCommentOptions.map((option, index) => (
                                        <SelectItem key={index} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowReviewDialog(false);
                                setReviewVisit(null);
                                setRating(0);
                                setComment("");
                            }}
                            disabled={submittingReview}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || rating === 0}
                        >
                            {submittingReview ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Avaliação"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

// --- Componente VisitCard ---
// (Nenhuma alteração necessária aqui, pois ele recebe as funções `on...` já prontas)
interface VisitCardProps {
    visit: Visit;
    onViewDetails: () => void;
    onViewProfile?: () => void;
    onChat?: () => void;
    onReview?: () => void;
    rating?: number;
}

const VisitCard = ({
    visit,
    onViewDetails,
    onViewProfile,
    onChat,
    onReview,
    rating,
}: VisitCardProps) => {
    // O `VisitCard` não precisa saber sobre 'router' ou 'navigate'
    // Ele apenas chama as funções que recebeu via props.
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Nurse Info */}
                    <div className="flex items-start gap-4 flex-1">
                        <img
                            src={
                                visit.nurse?.image
                                    ? `${API_BASE_URL}/user/file/${visit.nurse.image}`
                                    : "/placeholder.svg"
                            }
                            alt={visit.nurse?.name || "Enfermeiro"}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-border"
                            onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-foreground">
                                    {visit.nurse?.name || "Enfermeiro não especificado"}
                                </h3>
                                <Badge variant={getStatusVariant(visit.status)}>
                                    {getStatusLabel(visit.status)}
                                </Badge>
                            </div>
                            <p className="text-sm text-primary font-medium mb-4">
                                {visit.nurse?.specialization || "Enfermagem"}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{formatDate(visit.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span>{getVisitTypeLabel(visit.visit_type)}</span>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                <div>
                                    <span className="text-sm font-semibold text-muted-foreground">
                                        Motivo:{" "}
                                    </span>
                                    <span className="text-sm">{visit.reason}</span>
                                </div>
                                {visit.description && (
                                    <div>
                                        <span className="text-sm font-semibold text-muted-foreground">
                                            Descrição:{" "}
                                        </span>
                                        <span className="text-sm">{visit.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:w-48">
                        {visit.status === "CONFIRMED" && (
                            <>
                                {onViewProfile && (
                                    <Button onClick={onViewProfile} variant="default" size="sm">
                                        <User className="h-4 w-4 mr-2" />
                                        Ver Perfil
                                    </Button>
                                )}
                                {onChat && (
                                    <Button onClick={onChat} variant="outline" size="sm">
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Chat
                                    </Button>
                                )}
                            </>
                        )}

                        <Button onClick={onViewDetails} variant="outline" size="sm">
                            <Info className="h-4 w-4 mr-2" />
                            Ver Detalhes
                        </Button>

                        {visit.status === "COMPLETED" && (
                            <>
                                {rating && rating > 0 ? (
                                    <div className="flex flex-col items-center gap-2 p-3 border rounded-md bg-muted/30">
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Sua Avaliação
                                        </span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className="h-4 w-4"
                                                    fill={star <= rating ? "hsl(var(--warning))" : "transparent"}
                                                    stroke={
                                                        star <= rating ? "hsl(var(--warning))" : "hsl(var(--border))"
                                                    }
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    onReview && (
                                        <Button onClick={onReview} variant="default" size="sm">
                                            <Star className="h-4 w-4 mr-2" />
                                            Avaliar
                                        </Button>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// --- Componente EmptyState ---
interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
}

const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
    <Card>
        <CardContent className="p-12 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        </CardContent>
    </Card>
);

// --- Opções de Comentário ---
const reviewCommentOptions = [
    "Excelente atendimento, muito atenciosa!",
    "Profissional muito competente e cuidadoso",
    "Atendimento pontual e eficiente",
    "Muito educado e prestativo",
    "Recomendo o serviço",
    "Atendimento dentro do esperado",
    "Profissional dedicado e atencioso",
    "Ótima experiência, voltarei a solicitar",
    "Serviço de qualidade, muito satisfeito",
    "Cuidado excepcional com o paciente",
    "O atendimento foi bom, mas poderia ter sido mais ágil",
    "Cumpriu o básico, nada de especial",
    "Profissional simpático, mas parecia um pouco apressado",
    "O serviço foi ok, mas faltou um pouco mais de atenção",
    "Boa comunicação, mas atrasou um pouco para chegar",
    "Atendimento razoável, esperava um pouco mais de cuidado",
    "Profissional competente, mas o serviço poderia ser mais detalhado",
    "O atendimento deixou a desejar, pouco atencioso",
    "Houve atraso e falta de comunicação",
    "Não seguiu todas as orientações solicitadas",
    "Parecia com pressa e não explicou o procedimento direito",
    "Experiência abaixo do esperado",
    "Não fiquei satisfeito com o atendimento recebido",
    "Faltou empatia durante o atendimento",
    "Profissional pouco preparado para a situação",
    "Serviço demorado e pouco eficiente",
    "Atendimento ruim, não recomendo",
];

export default Visits;