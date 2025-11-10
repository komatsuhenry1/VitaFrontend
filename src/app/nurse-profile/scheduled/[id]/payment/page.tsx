"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Lock } from "lucide-react"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SQAOzEYds56Ja3VWP3pa9wykrXuHW0CVYhFEBoLLwQvXJwCSEeK6O3dcubKnuvdlSoe7YxzBdaf7PCA9t0SMkgg00458FviHW');

interface BookingData {
    nurseId: string;
    nurseName: string;
    selectedDate: string;
    selectedTime: string;
    reason: string;
    message?: string;
    visitType: string;
    value: number;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
}

// -----------------------------------------------------------------
// COMPONENTE INTERNO PARA O FORMULÁRIO
// -----------------------------------------------------------------

function CheckoutForm({ bookingData }: { bookingData: BookingData }) {
    const stripe = useStripe();
    const elements = useElements();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // --- MUDANÇA: Função handlePayment RESTAURADA ---
    const handlePayment = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements || !bookingData) {
            return;
        }

        setLoading(true);
        setMessage(null);

        // ETAPA A: CONFIRMAR O PAGAMENTO COM O STRIPE
        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
        });

        if (stripeError) {
            setMessage(stripeError.message || "Ocorreu um erro no pagamento.");
            setLoading(false);
            return;
        }

        // ETAPA B: PAGAMENTO BEM-SUCEDIDO! CRIAR A VISITA NO NOSSO BANCO
        // (Esta é a lógica que tínhamos antes, agora correta)
        if (paymentIntent && paymentIntent.status === "succeeded") {
            try {
                const dateTimeString = `${bookingData.selectedDate}T${bookingData.selectedTime}:00Z`;

                // Monta o corpo da requisição exatamente como o backend espera
                const requestBody = {
                    description: bookingData.message || "Consulta de enfermagem",
                    reason: bookingData.reason,
                    cep: bookingData.cep,
                    street: bookingData.street,
                    number: bookingData.number,
                    complement: bookingData.complement,
                    neighborhood: bookingData.neighborhood,
                    nurse_id: bookingData.nurseId,
                    value: bookingData.value,
                    visit_type: bookingData.visitType,
                    date: dateTimeString,

                    // AQUI ESTÁ A CHAVE: Envie o ID do pagamento
                    payment_intent_id: paymentIntent.id
                };

                const token = localStorage.getItem("token");

                // Chama o endpoint de criação da visita
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
                    toast.success("Pagamento realizado e visita solicitada com sucesso!");
                    sessionStorage.removeItem("bookingData");
                    router.push("/visits/patient");
                } else {
                    // Se o backend falhar (ex: validação), mostra o erro
                    throw new Error(result.error || "Erro ao agendar visita após o pagamento.");
                }

            } catch (err) {
                // Se a criação da visita falhar, mostramos um erro.
                // O pagamento foi feito, mas o agendamento falhou.
                setMessage(err instanceof Error ? err.message : "Pagamento recebido, mas falha ao salvar o agendamento. Contate o suporte.");
                toast.error(err instanceof Error ? err.message : "Pagamento recebido, mas falha ao salvar o agendamento.");
            }

        } else {
            setMessage("Ocorreu um erro inesperado no pagamento.");
        }
        // --- FIM DA MUDANÇA ---

        setLoading(false);
    };

    return (
        <form onSubmit={handlePayment}>
            <CardContent>
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
    // --- MUDANÇA: Revertido de 'visitId' para 'nurseId' ---
    // A URL desta página contém o ID do enfermeiro, não da visita
    const nurseId = params.id as string;
    // --- FIM DA MUDANÇA ---

    const [bookingData, setBookingData] = useState<BookingData | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    // Efeito para carregar dados do agendamento (do sessionStorage)
    useEffect(() => {
        const data = sessionStorage.getItem("bookingData");
        if (!data) {
            toast.error("Dados do agendamento não encontrados");
            // --- MUDANÇA: Voltar para a página do enfermeiro ---
            router.push(`/nurse-profile/${nurseId}`);
            // --- FIM DA MUDANÇA ---
            return;
        }
        setBookingData(JSON.parse(data));
    }, [nurseId, router]); // <-- nurseId de volta ao array de dependência

    // Efeito para buscar o CLIENT SECRET
    useEffect(() => {
        // --- MUDANÇA: Removido 'visitId' da condição ---
        if (bookingData && bookingData.value > 0) {
            const fetchClientSecret = async () => {
                const token = localStorage.getItem("token");
                try {
                    // --- MUDANÇA: URL revertida para /payment/create-intent (sem ID) ---
                    const response = await fetch(`${API_BASE_URL}/payment/create-intent`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ value: bookingData.value }),
                    });
                    // --- FIM DA MUDANÇA ---

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
    }, [bookingData]); // <-- Array de dependência revertido
    // --- FIM DA MUDANÇA ---

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
                                <span className="text-gray-600">Local:</span>
                                <span className="font-semibold text-right">{`${bookingData.street}, ${bookingData.number} - ${bookingData.neighborhood}`}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="text-gray-900 font-semibold">Total:</span>
                                <span className="text-green-700 font-bold text-xl">R$ {bookingData.value.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Formulário de Pagamento */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pagamento da Visita</CardTitle>
                            <CardDescription>Insira os dados do seu cartão para agendar.</CardDescription>
                        </CardHeader>

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