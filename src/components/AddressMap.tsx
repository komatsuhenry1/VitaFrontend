"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useState, useEffect } from "react"

// Interface para as props do componente AddressMap
interface AddressMapProps {
    address: string
}

// Ícone padrão do Leaflet
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

const AddressMap = ({ address }: AddressMapProps) => {
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const geocodeAddress = async () => {
            try {
                setLoading(true)
                setError(null)
                
                // Usando Nominatim (OpenStreetMap) para geocodificação
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
                )
                
                if (!response.ok) {
                    throw new Error('Erro ao buscar coordenadas do endereço')
                }
                
                const data = await response.json()
                
                if (data && data.length > 0) {
                    setCoordinates({
                        lat: parseFloat(data[0].lat),
                        lng: parseFloat(data[0].lon)
                    })
                } else {
                    throw new Error('Endereço não encontrado')
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erro desconhecido')
                console.error('Erro ao geocodificar endereço:', err)
            } finally {
                setLoading(false)
            }
        }

        if (address) {
            geocodeAddress()
        }
    }, [address])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[250px] bg-gray-100 rounded-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Carregando mapa...</p>
                </div>
            </div>
        )
    }

    if (error || !coordinates) {
        return (
            <div className="flex items-center justify-center h-[250px] bg-gray-100 rounded-lg">
                <div className="text-center text-gray-600">
                    <p>Não foi possível carregar o mapa</p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[250px] rounded-lg overflow-hidden border">
            <MapContainer 
                center={[coordinates.lat, coordinates.lng]} 
                zoom={15} 
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[coordinates.lat, coordinates.lng]} icon={defaultIcon}>
                    <Popup>{address}</Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}

export default AddressMap