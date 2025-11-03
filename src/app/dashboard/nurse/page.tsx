"use client"; // <--- ADICIONE ISSO

import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Clock, Award, User } from "lucide-react";

const NursesMap = lazy(() => import("@/components/ui/NursesMap"));

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

const FUZZ_AMOUNT = 0.002;
const fuzzCoordinates = (lat: number, lng: number) => {
  const latOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2;
  const lngOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2;
  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  };
};

const Index = () => {
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

        // Mock data for demonstration
        const mockData: ApiResponse = {
          success: true,
          message: "Success",
          data: [
            {
              id: "1",
              name: "Ana Silva",
              specialization: "Enfermagem Domiciliar",
              years_experience: 8,
              price: 85,
              shift: "Diurno",
              image: "",
              available: true,
              location: "São Paulo, SP",
              neighborhood: "Jardins",
              latitude: -23.5505,
              longitude: -46.6333,
              patient_location: { latitude: -23.5505, longitude: -46.6333 },
            },
            {
              id: "2",
              name: "Carlos Mendes",
              specialization: "UTI",
              years_experience: 12,
              price: 120,
              shift: "Noturno",
              image: "",
              available: true,
              location: "São Paulo, SP",
              neighborhood: "Vila Mariana",
              latitude: -23.5889,
              longitude: -46.6389,
              patient_location: { latitude: -23.5505, longitude: -46.6333 },
            },
            {
              id: "3",
              name: "Beatriz Costa",
              specialization: "Pediatria",
              years_experience: 6,
              price: 95,
              shift: "Diurno",
              image: "",
              available: true,
              location: "São Paulo, SP",
              neighborhood: "Moema",
              latitude: -23.6021,
              longitude: -46.6722,
              patient_location: { latitude: -23.5505, longitude: -46.6333 },
            },
          ],
        };

        if (mockData.data.length > 0 && mockData.data[0].patient_location) {
          const patLoc = mockData.data[0].patient_location;
          setUserLocation({ lat: patLoc.latitude, lng: patLoc.longitude });
        }

        const availableNurses = mockData.data.filter((nurse) => nurse.available);
        const nursesWithFuzzedCoords = availableNurses.map((nurse) => {
          const { latitude, longitude } = fuzzCoordinates(nurse.latitude, nurse.longitude);
          return { ...nurse, latitude, longitude };
        });

        setNurses(nursesWithFuzzedCoords);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        console.error("Erro ao buscar enfermeiros:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNurses();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Carregando enfermeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-secondary/20">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
              Enfermeiros Disponíveis
            </h1>
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              {nurses.length} enfermeiros online próximos à sua localização
            </p>
          </div>
        </div>

        <div className="flex gap-6" style={{ height: "calc(100vh - 220px)" }}>
          {/* Mapa - Área principal */}
          <div className="flex-1 overflow-hidden rounded-2xl shadow-lg">
            <Suspense
              fallback={
                <div className="flex h-full w-full items-center justify-center bg-secondary/20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <NursesMap
                userLocation={userLocation}
                nurses={nurses}
                selectedNurse={selectedNurse}
                onSelectNurse={setSelectedNurse}
              />
            </Suspense>
          </div>

          {/* Sidebar de Cards - Colada na borda direita */}
          <div
            ref={rightPanelRef}
            className="w-[380px] space-y-3 overflow-y-auto pr-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(var(--primary)) hsl(var(--secondary))",
            }}
          >
            {nurses.map((nurse) => {
              const isSelected = selectedNurse?.id === nurse.id;

              return (
                <Card
                  key={nurse.id}
                  className={`group cursor-pointer transition-all duration-300 ${isSelected
                      ? "scale-[1.02] border-2 border-primary bg-gradient-to-br from-primary/5 to-accent/5 shadow-selected"
                      : "border border-border bg-card shadow-sm hover:scale-[1.01] hover:border-primary/40 hover:shadow-md"
                    }`}
                  onClick={() => setSelectedNurse(nurse)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent transition-all duration-300 ${isSelected ? "h-16 w-16 ring-4 ring-primary/30" : "h-14 w-14 ring-2 ring-border"
                            }`}
                        >
                          {nurse.image ? (
                            <img
                              src={nurse.image}
                              alt={nurse.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-white" />
                          )}
                        </div>
                        {nurse.available && (
                          <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card bg-accent shadow-md"></div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 font-bold text-foreground">{nurse.name}</div>
                        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-accent">
                          {nurse.specialization}
                        </div>

                        {isSelected && (
                          <Badge className="mb-3 bg-gradient-to-r from-primary to-accent text-xs">
                            Disponível Agora
                          </Badge>
                        )}

                        {isSelected ? (
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                                <div>
                                  <div className="text-xs text-muted-foreground">Experiência</div>
                                  <div className="text-sm font-semibold text-foreground">
                                    {nurse.years_experience} anos
                                  </div>
                                </div>
                              </div>

                              {nurse.shift && (
                                <div className="flex items-start gap-2">
                                  <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                  <div>
                                    <div className="text-xs text-muted-foreground">Turno</div>
                                    <div className="text-sm font-semibold text-foreground">{nurse.shift}</div>
                                  </div>
                                </div>
                              )}

                              <div className="flex items-start gap-2">
                                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                <div className="min-w-0">
                                  <div className="text-xs text-muted-foreground">Localização</div>
                                  <div className="truncate text-sm font-semibold leading-tight text-foreground">
                                    {nurse.location}
                                  </div>
                                  <div className="truncate text-xs text-muted-foreground">{nurse.neighborhood}</div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 p-3 shadow-sm">
                              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                Valor do Serviço
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-xl font-bold text-transparent">
                                  {nurse.price > 0 ? `R$ ${nurse.price.toFixed(2)}` : "A combinar"}
                                </span>
                                {nurse.price > 0 && (
                                  <span className="text-xs font-medium text-muted-foreground">/hora</span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                            >
                              Ver Perfil Completo
                            </Button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-base font-bold text-transparent">
                              {nurse.price > 0 ? `R$ ${nurse.price.toFixed(2)}/hora` : "A combinar"}
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
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

      <style>{`
        [style*="overflow-y-auto"]::-webkit-scrollbar {
          width: 6px;
        }
        [style*="overflow-y-auto"]::-webkit-scrollbar-track {
          background: hsl(var(--secondary));
          border-radius: 3px;
        }
        [style*="overflow-y-auto"]::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 3px;
        }
        [style*="overflow-y-auto"]::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--accent));
        }
      `}</style>
    </div>
  );
};

export default Index;
