"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

// Define a interface para as props do componente
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
  latitude?: number
  longitude?: number
}

interface NursesMapProps {
  userLocation: { lat: number; lng: number }
  nurses: Nurse[]
  selectedNurse: Nurse | null
  onSelectNurse: (nurse: Nurse | null) => void
}

// Corrige o problema do ícone padrão do Leaflet no Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Componente para centralizar o mapa quando um enfermeiro for selecionado na lista
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

const NursesMap = ({ userLocation, nurses, selectedNurse, onSelectNurse }: NursesMapProps) => {
  // Define a posição central do mapa
  const mapCenter: [number, number] = selectedNurse
    ? [selectedNurse.latitude || userLocation.lat, selectedNurse.longitude || userLocation.lng]
    : [userLocation.lat, userLocation.lng]

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <ChangeView center={mapCenter} zoom={selectedNurse ? 15 : 13} />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Marcador para a localização do usuário */}
      <Marker position={[userLocation.lat, userLocation.lng]} icon={defaultIcon}>
        <Popup>Você está aqui</Popup>
      </Marker>

      {/* Marcadores para cada enfermeiro */}
      {nurses.map((nurse) => {
        if (!nurse.latitude || !nurse.longitude) return null
        return (
          <Marker
            key={nurse.id}
            position={[nurse.latitude, nurse.longitude]}
            icon={defaultIcon}
            eventHandlers={{
              click: () => {
                onSelectNurse(nurse)
              },
            }}
          >
            <Popup>{nurse.name}</Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default NursesMap
