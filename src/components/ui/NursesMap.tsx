"use client"

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

// ... (Interfaces e definições de ícones permanecem os mesmos) ...
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

interface NursesMapProps {
  userLocation: { lat: number; lng: number }
  nurses: Nurse[]
  selectedNurse: Nurse | null
  onSelectNurse: (nurse: Nurse | null) => void
}

const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"

const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const nurseIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})


// Componente para centralizar o mapa E CORRIGIR O TAMANHO
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()

  // Efeito para centralizar o mapa quando o 'selectedNurse' muda
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])

  useEffect(() => {
    // 1. Define a nova visualização do mapa
    map.setView(center, zoom)

    // 2. Cria um pequeno timeout para executar o invalidateSize DEPOIS
    //    que o setView foi processado.
    //    Isso garante que o mapa recalcule o tamanho toda vez
    //    que o centro (usuário ou enfermeiro) mudar.
    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100) // 100ms é suficiente após um setView

    // Limpa o timer se o efeito rodar novamente
    return () => {
      clearTimeout(timer)
    }
    
    // ATENÇÃO: A dependência agora monitora [center, zoom, map]
  }, [center, zoom, map])

  // O useEffect que rodava apenas [map] foi removido por ser redundante.

  return null
}


const NursesMap = ({ userLocation, nurses, selectedNurse, onSelectNurse }: NursesMapProps) => {
  const mapCenter: [number, number] = selectedNurse
    ? [selectedNurse.latitude, selectedNurse.longitude]
    : [userLocation.lat, userLocation.lng]

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
      <ChangeView center={mapCenter} zoom={selectedNurse ? 15 : 13} />

      {/* ... (Resto do código: TileLayer e Markers) ... */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
        <Popup>Você está aqui</Popup>
      </Marker>
      {nurses.map((nurse) => (
        <Marker
          key={nurse.id}
          position={[nurse.latitude, nurse.longitude]}
          icon={nurseIcon}
          eventHandlers={{
            click: () => {
              onSelectNurse(nurse)
            },
          }}
        >
          <Popup>{nurse.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default NursesMap