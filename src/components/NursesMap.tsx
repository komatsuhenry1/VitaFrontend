"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

interface PatientLocation {
    latitude: number
    longitude: number
}
interface PatientLocation {
    latitude: number
    longitude: number
}

interface Nurse {
    id: string
    name: string
    specialization: string
    years_experience: number
    price: number
    shift: string
    image: string
    available: boolean
    location: string
    neighborhood: string
    latitude: number
    longitude: number
    patient_location: PatientLocation
}

export interface NursesMapProps {
    address?: string
    userLocation?: { lat: number; lng: number } // <-- Recomendo tipar melhor que 'any'
    nurses?: Nurse[] // <-- Recomendo tipar melhor que 'any'
    selectedNurse?: Nurse
    onSelectNurse?: (nurse: Nurse) => void
}

export default function NursesMap({
    userLocation,
    nurses = [], // [MUDANÇA 1] - Definimos um valor padrão
    selectedNurse,
    onSelectNurse,
}: NursesMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const markersRef = useRef<L.Marker[]>([])
    const patientMarkerRef = useRef<L.Marker | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return
        
        // [MUDANÇA 2] - Adicionamos uma "Guard Clause"
        if (!userLocation) return // Se não tiver localização, não inicialize o mapa

        if (!mapRef.current) {
            mapRef.current = L.map("map").setView([userLocation.lat, userLocation.lng], 13)

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(mapRef.current)
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
            }
        }
    }, [userLocation]) // <-- Adicionado userLocation como dependência

    useEffect(() => {
        // [MUDANÇA 2] - Adicionamos "Guard Clauses"
        if (!mapRef.current || !userLocation) return

        const patientIcon = L.divIcon({
            // ... (seu código de ícone) ...
            className: "custom-marker",
            html: `...`,
            iconSize: [40, 48],
            iconAnchor: [20, 48],
        })

        if (patientMarkerRef.current) {
            patientMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng])
        } else {
            patientMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: patientIcon })
                .addTo(mapRef.current)
                .bindPopup(
                    `<div style="text-align: center; font-weight: bold; color: #2563eb;">
            📍 Sua Localização
          </div>`,
                )
        }

        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        const createNurseIcon = (isSelected: boolean) =>
            L.divIcon({
                // ... (seu código de ícone) ...
                className: "custom-marker",
                html: `...`,
                iconSize: [isSelected ? 44 : 36, isSelected ? 52 : 44],
                iconAnchor: [isSelected ? 22 : 18, isSelected ? 52 : 44],
            })

        // 'nurses' agora é seguro, pois garantimos que é pelo menos []
        nurses.forEach((nurse) => {
            const isSelected = selectedNurse?.id === nurse.id
            const marker = L.marker([nurse.latitude, nurse.longitude], {
                icon: createNurseIcon(isSelected),
            })
                .addTo(mapRef.current!)
                .bindPopup(
                   // ... (seu código de popup) ...
                   `<div>...</div>`
                )
                .on("click", () => {
                    // [MUDANÇA 3] - Usamos "Optional Chaining"
                    onSelectNurse?.(nurse)
                })

            markersRef.current.push(marker)
        })

        if (nurses.length > 0) {
            const bounds = L.latLngBounds([
                [userLocation.lat, userLocation.lng],
                ...nurses.map((n) => [n.latitude, n.longitude] as [number, number]),
            ])
            mapRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [nurses, selectedNurse, userLocation, onSelectNurse])

    return <div id="map" style={{ width: "100%", height: "100%", borderRadius: "8px" }} />
}