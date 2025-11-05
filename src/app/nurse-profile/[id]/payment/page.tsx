"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Lock } from "lucide-react"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

// 1. IMPORTAR AS BIBLIOTECAS DO STRIPE
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// 2. SUA CHAVE PUBLICÁVEL (PUBLISHABLE KEY)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SQAOzEYds56Ja3VWP3pa9wykrXuHW0CVYhFEBoLLwQvXJwCSEeK6O3dcubKnuvdlSoe7YxzBdaf7PCA9t0SMkgg00458FviHW');

// --- MUDANÇA: Interface para tipar os dados do agendamento ---
interface BookingData {
    nurseId: string;
    nurseName: string;
    selectedDate: string; // Ex: "2025-10-31"
    selectedTime: string; // Ex: "14:30"
    reason: string;
    message?: string;
    visitType: "clinica" | "domiciliar" | string; // Use tipos mais específicos se possível
    value: number;
}
// --- Fim da Mudança ---


// -----------------------------------------------------------------
// 3. COMPONENTE INTERNO PARA O FORMULÁRIO
// -----------------------------------------------------------------

// --- MUDANÇA: Corrigido o 'any' da prop (Erro da linha 27) ---
function CheckoutForm({ bookingData }: { bookingData: BookingData }) {
    // --- Fim da Mudança ---
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handlePayment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements || !bookingData) {
            return;
        }

        setLoading(true);
        setMessage(null);

        // ---------------------------------------------------------------
        // ETAPA A: CONFIRMAR O PAGAMENTO COM O STRIPE
        // ---------------------------------------------------------------
        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required", // Não redireciona automaticamente
        });

        if (stripeError) {
            setMessage(stripeError.message || "Ocorreu um erro no pagamento.");
            setLoading(false);
            return;
        }

        // ---------------------------------------------------------------
        // ETAPA B: PAGAMENTO BEM-SUCEDIDO! AGORA, CRIAR A VISITA NO NOSSO BANCO
        // ---------------------------------------------------------------
        if (paymentIntent && paymentIntent.status === "succeeded") {
            try {
                // Ajuste para garantir que a data/hora esteja correta
                // Usar 'Z' assume que a hora selecionada é UTC. 
                // Se a hora for local, talvez precise de uma lib (ex: date-fns-tz)
                const dateTimeString = `${bookingData.selectedDate}T${bookingData.selectedTime}:00`;

                const requestBody = {
                    description: bookingData.message || "Consulta de enfermagem",
                    reason: bookingData.reason,
                    visit_type: bookingData.visitType,
                    nurse_id: bookingData.nurseId,
                    date: dateTimeString, // Enviando a data/hora local
                    value: bookingData.value,
                    payment_intent_id: paymentIntent.id
                };

                const token = localStorage.getItem("token");
                const response = await fetch(`${API_BASE_URL}/user/visit`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    toast.success("Pagamento realizado e visita agendada com sucesso!");
                    sessionStorage.removeItem("bookingData");
                    router.push("/patient-visits");
                } else {
                    throw new Error(result.message || "Erro ao agendar visita após o pagamento.");
                }

            } catch (err) {
                setMessage(err instanceof Error ? err.message : "Pagamento recebido, mas falha ao salvar o agendamento. Contate o suporte.");
                toast.error("Pagamento recebido, mas falha ao salvar o agendamento. Contate o suporte.");
            }

        } else {
            setMessage("Ocorreu um erro inesperado no pagamento.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handlePayment}>
            <CardContent>
                {/* 4. FORMULÁRIO SEGURO DO STRIPE */}
                <PaymentElement />
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
                <Button
                    disabled={loading || !stripe || !elements}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
                >
                    {loading ? "Processando..." : `Pagar e Agendar (R$ ${bookingData.value.toFixed(2)})`}
                </Button>

                {message && <div className="text-red-600 text-center">{message}</div>}

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <Lock className="h-4 w-4" />
                    <span>Pagamento seguro processado via Stripe</span>
                </div>
            </CardFooter>
        </form>
    )
}

// -----------------------------------------------------------------
// COMPONENTE PRINCIPAL (PaymentPage)
// -----------------------------------------------------------------
export default function PaymentPage() {
    const params = useParams();
    const router = useRouter();
    const nurseId = params.id as string;

    // --- MUDANÇA: Corrigido o 'any' do useState (Erro da linha 143) ---
    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    // --- Fim da Mudança ---

    // 5. ESTADO PARA GUARDAR O CLIENT SECRET
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    // Efeito para carregar dados do agendamento
    useEffect(() => {
        const data = sessionStorage.getItem("bookingData");
        if (!data) {
            toast.error("Dados do agendamento não encontrados");
            router.push(`/nurse-profile/${nurseId}`);
            return;
        }
        // Ao fazer o parse, o TypeScript confiará que os dados
        // batem com a interface BookingData (definida no useState)
        setBookingData(JSON.parse(data));
    }, [nurseId, router]);

    // 6. EFEITO NOVO: BUSCAR O CLIENT SECRET QUANDO OS DADOS CARREGAREM
    useEffect(() => {
        if (bookingData && bookingData.value > 0) {

            const fetchClientSecret = async () => {
                const token = localStorage.getItem("token");

                try {
                    const response = await fetch(`${API_BASE_URL}/payment/create-intent`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ value: bookingData.value }),
                    });

                    const result = await response.json();

                    if (response.ok && result.client_secret) {
                        setClientSecret(result.client_secret);
                    } else {
                        throw new Error(result.message || "Falha ao iniciar o pagamento");
                    }

                } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Erro de rede ao iniciar pagamento");
                }
            };

            fetchClientSecret();
        }
    }, [bookingData]); // Roda quando 'bookingData' for preenchido

    // Opções para o Stripe Elements (para passar o clientSecret)
    const options = clientSecret
        ? {
            clientSecret,
            appearance: {
                theme: "stripe" as const,
                variables: {
                    colorPrimary: "#15803d",
                },
            },
        }
        : undefined;

    // Renderização principal
    if (!bookingData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-2xl mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <div className="space-y-6">
                    {/* Resumo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-green-700">Resumo do Agendamento</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Enfermeiro(a):</span>
                                <span className="font-semibold">{bookingData.nurseName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Data:</span>
                                {/* Corrigido timeZone para UTC para evitar problemas de fuso no display simples */}
                                <span className="font-semibold">{new Date(`${bookingData.selectedDate}T00:00:00`).toLocaleDateString("pt-BR", { timeZone: 'UTC' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Horário:</span>
                                <span className="font-semibold">{bookingData.selectedTime}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo:</span>
                                <span className="font-semibold capitalize">{bookingData.visitType}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-900 font-semibold">Total:</span>
                                <span className="text-green-700 font-bold text-xl">R$ {bookingData.value.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 7. O FORMULÁRIO DE PAGAMENTO AGORA É O STRIPE ELEMENTS */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagamento da Visita</CardTitle>
                            <CardDescription>Insira os dados do seu cartão para agendar.</CardDescription>
                        </CardHeader>

                        {/* Mostra o formulário do Stripe SÓ QUANDO o clientSecret carregar */}
                        {clientSecret && stripePromise ? (
                            <Elements stripe={stripePromise} options={options}>
                                <CheckoutForm bookingData={bookingData} />
                            </Elements>
                        ) : (
                            <CardContent>
                                <div className="flex justify-center items-center h-24">
                                    <div className="w-6 h-6 border-2 border-gray-200 border-t-green-700 rounded-full animate-spin"></div>
                                    <p className="ml-3 text-gray-600">Carregando formulário de pagamento...</p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>

            <Footer />
        </div>
    )
}