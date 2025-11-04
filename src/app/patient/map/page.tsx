"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// --- O QUE EU MUDEI ---
// Adicionada a importação do 'Link'
import Link from "next/link";
// Adicionada a importação do 'dynamic'
import dynamic from "next/dynamic";
import { Loader2, MapPin, Clock, Award } from "lucide-react";
// --- FIM DA MUDANÇA ---
import { Footer } from "@/components/Footer"

interface PatientLocation {
  latitude: number;
  longitude: number;
}

interface Nurse {
  id: string;
  name: string;
  specialization: string;
  years_experience: number;
  price: number;
  shift: string;
  image: string;
  available: boolean;
  location: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  patient_location: PatientLocation;
}

interface ApiResponse {
  data: Nurse[];
  message: string;
  success: boolean;
}

// --- O QUE EU MUDEI ---
// Alterado de lazy/Suspense para 'dynamic' do Next.js
// para melhor integração com SSR: false e um loading personalizado
const NursesMapWithNoSSR = dynamic(() => import("@/components/ui/NursesMap"), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      <p className="ml-3 text-gray-600">Carregando mapa interativo...</p>
    </div>
  ),
  ssr: false,
});
// --- FIM DA MUDANÇA ---

// Você pode ajustar esse valor se quiser (ex: 0.01 para ~1.1km)
const FUZZ_AMOUNT = 0.002;
const fuzzCoordinates = (lat: number, lng: number) => {
  const latOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2;
  const lngOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2;
  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  };
};

export default function NursesMapPage() {
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState({ lat: -23.5505, lng: -46.6333 });

  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Usuário não autenticado");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/online_nurses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Falha ao carregar enfermeiros");
        }

        const data: ApiResponse = await response.json();

        if (data.success) {
          if (data.data.length > 0 && data.data[0].patient_location) {
            const patLoc = data.data[0].patient_location;
            setUserLocation({ lat: patLoc.latitude, lng: patLoc.longitude });
          }

          const availableNurses = data.data.filter((nurse) => nurse.available);

          const nursesWithFuzzedCoords = availableNurses.map((nurse) => {
            const { latitude, longitude } = fuzzCoordinates(nurse.latitude, nurse.longitude);

            return {
              ...nurse,
              latitude: latitude,
              longitude: longitude,
            };
          });

          setNurses(nursesWithFuzzedCoords);
        } else {
          throw new Error(data.message || "Erro ao carregar dados");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        console.error("Erro ao buscar enfermeiros:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNurses();
  }, []);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1";

  // --- O QUE EU MUDEI ---
  // Ajustado o gradiente de fundo para os tons de verde/esmeralda
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />

      {/* Ajustado o max-w para 1400px e py-8 */}
      <div className="mx-auto max-w-[1400px] px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            {/* Ajuste de cores para tons de verde */}
            <h1 className="mb-2 text-3xl font-bold text-green-700">Mapa de Enfermeiros Disponíveis</h1>
            <p className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4 text-green-600" />
              {nurses.length} enfermeiros online próximos à sua localização
            </p>
          </div>
        </div>

        {/* Ajustado o grid, gap e altura (calc) */}
        <div className="grid grid-cols-1 gap-1 lg:grid-cols-[1fr_420px]" style={{ height: "calc(100vh - 250px)" }}>
          {/* Card do mapa agora com 'h-full' e 'p-0' para o mapa preencher 100% */}
          <Card className="overflow-hidden shadow-lg h-full p-0">
            <NursesMapWithNoSSR
              userLocation={userLocation}
              nurses={nurses}
              selectedNurse={selectedNurse}
              onSelectNurse={setSelectedNurse}
            />
          </Card>

          {/* Ajuste no padding e cor da scrollbar */}
          <div
            ref={rightPanelRef}
            className="overflow-y-auto pr-2 pt-2"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#15803d #f1f5f9",
            }}
          >
            <div className="flex flex-col gap-3 px-1">
              {nurses.map((nurse) => {
                const isSelected = selectedNurse?.id === nurse.id;

                return (
                  <Card
                    key={nurse.id}
                    // Ajuste completo de estilos para os cards (selecionado e não selecionado)
                    className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${isSelected
                        ? "border-2 border-green-600 shadow-lg scale-[1.02] bg-green-50/50"
                        : "border border-gray-200 hover:border-green-300 hover:scale-[1.01]"
                      }`}
                    onClick={() => setSelectedNurse(nurse)}
                  >
                    {/* Ajustado padding do CardContent para p-2 */}
                    <CardContent className="p-2">
                      {/* Ajustado o gap e items-start */}
                      <div className="flex gap-2.5 items-start">
                        <div className="relative flex-shrink-0">
                          <img
                            src={nurse.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"}
                            alt={nurse.name}
                            // Tamanhos do avatar alterados (w/h-16 selecionado, w/h-14 normal)
                            className={`rounded-full object-cover transition-all duration-300 ${isSelected
                                ? "w-16 h-16 ring-3 ring-green-500 ring-offset-1"
                                : "w-14 h-14 ring-2 ring-gray-200"
                              }`}
                          />
                          {nurse.available && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-base mb-0.5">{nurse.name}</div>
                          <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1.5">
                            {nurse.specialization}
                          </div>

                          {isSelected && (
                            <Badge className="bg-green-600 hover:bg-green-700 text-xs py-0.5 px-2 mb-2">
                              Disponível Agora
                            </Badge>
                          )}

                          {isSelected ? (
                            // Bloco de info totalmente reestruturado
                            <div className="mt-2 space-y-2.5">
                              {/* --- GRUPO DE INFORMAÇÕES --- */}
                              <div className="space-y-1.5">
                                {/* Experiência */}
                                <div className="flex items-start gap-1.5">
                                  <Award className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <div className="text-xs text-gray-600">Experiência</div>
                                    <div className="font-semibold text-sm text-gray-900">
                                      {nurse.years_experience} anos
                                    </div>
                                  </div>
                                </div>

                                {/* Localização */}
                                <div className="flex items-start gap-1.5">
                                  <MapPin className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <div className="text-xs text-gray-600">Localização</div>
                                    <div className="text-xs text-gray-500 truncate">{nurse.neighborhood}</div>
                                  </div>
                                </div>
                              </div>

                              {/* --- GRUPO DE PREÇO --- */}
                              <div className="p-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-md border-2 border-green-200 shadow-sm">
                                <div className="text-[10px] uppercase tracking-wider text-green-700 font-semibold mb-0.5">
                                  Valor do Serviço
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-bold text-green-700">
                                    {nurse.price > 0 ? `R$ ${nurse.price.toFixed(2)}` : "A combinar"}
                                  </span>
                                  {nurse.price > 0 && (
                                    <span className="text-xs text-gray-600 font-medium">/hora</span>
                                  )}
                                </div>
                              </div>

                              {/* --- GRUPO DE AÇÃO (com Link) --- */}
                              <Link
                                href={`/nurse-profile/online/${nurse.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="block"
                              >
                                <Button
                                  size="sm"
                                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                                >
                                  Ver Perfil Completo
                                </Button>
                              </Link>
                            </div>
                          ) : (
                            // Card não selecionado (estilos atualizados)
                            <div className="mt-1.5">
                              <div className="font-bold text-green-700 text-base">
                                {nurse.price > 0 ? `R$ ${nurse.price.toFixed(2)}/hora` : "A combinar"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {nurse.neighborhood}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Adicionado o <style jsx global> para a scrollbar customizada */}
      <style jsx global>{`
        div[class*="overflow-y-auto"]::-webkit-scrollbar {
          width: 8px;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb {
          background: #15803d;
          border-radius: 4px;
        }
        div[class*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
          background: #166534;
        }
      `}</style>
    </div>
  );
}
// --- FIM DA MUDANÇA ---