"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

export interface AddressMapProps {
    latitude: number
    longitude: number
    address?: string
}

export default function AddressMap({ latitude, longitude, address }: AddressMapProps) {
    const mapRef = useRef<L.Map | null>(null)
    const markerRef = useRef<L.Marker | null>(null)

    useEffect(() => {
        if (typeof window === "undefined") return

        // Inicializa o mapa apenas uma vez
        if (!mapRef.current) {
            mapRef.current = L.map("address-map").setView([latitude, longitude], 15)

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
    }, [])

    useEffect(() => {
        if (!mapRef.current) return

        // Ícone customizado para a localização
        const locationIcon = L.divIcon({
            className: "custom-marker",
            html: `
        <div style="
          position: relative;
          width: 40px;
          height: 48px;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg) translateX(-50%);
            transform-origin: 0 0;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(21, 128, 61, 0.4);
          "></div>
          <div style="
            position: absolute;
            top: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 16px;
            background: white;
            border-radius: 50%;
            z-index: 1;
          "></div>
        </div>
      `,
            iconSize: [40, 48],
            iconAnchor: [20, 48],
            popupAnchor: [0, -48],
        })

        // Remove marcador anterior se existir
        if (markerRef.current) {
            markerRef.current.remove()
        }

        // Adiciona novo marcador
        markerRef.current = L.marker([latitude, longitude], { icon: locationIcon })
            .addTo(mapRef.current)
            .bindPopup(
                `<div style="text-align: center; padding: 0.5rem;">
          <div style="font-weight: bold; color: #15803d; margin-bottom: 0.5rem;">
            📍 Localização da Visita
          </div>
          ${address ? `<div style="font-size: 0.875rem; color: #6b7280;">${address}</div>` : ""}
        </div>`,
            )

        // Centraliza o mapa na nova localização
        mapRef.current.setView([latitude, longitude], 15)
    }, [latitude, longitude, address])

    return (
        <div
            id="address-map"
            style={{
                width: "100%",
                height: "250px",
                borderRadius: "0.5rem",
                zIndex: 0,
            }}
        />
    )
}
