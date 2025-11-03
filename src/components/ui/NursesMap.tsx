"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

interface NursesMapProps {
  userLocation: { lat: number; lng: number };
  nurses: Nurse[];
  selectedNurse: Nurse | null;
  onSelectNurse: (nurse: Nurse | null) => void;
}

const shadowUrl = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png";

const userIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone verde que você definiu
const nurseIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [center, zoom, map]);

  return null;
}

const NursesMap = ({ userLocation, nurses, selectedNurse, onSelectNurse }: NursesMapProps) => {
  const mapCenter: [number, number] = selectedNurse
    ? [selectedNurse.latitude, selectedNurse.longitude]
    : [userLocation.lat, userLocation.lng];

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={mapCenter as L.LatLngExpression}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <ChangeView center={mapCenter} zoom={selectedNurse ? 15 : 13} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker
          position={[userLocation.lat, userLocation.lng] as L.LatLngExpression}
          icon={userIcon}
        >
          <Popup>Você está aqui</Popup>
        </Marker>
        {nurses.map((nurse) => (
          <Marker
            key={nurse.id}
            position={[nurse.latitude, nurse.longitude] as L.LatLngExpression}
            icon={nurseIcon}
            eventHandlers={{
              click: () => {
                onSelectNurse(nurse);
              },
            }}
          >
            <Popup>{nurse.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default NursesMap;