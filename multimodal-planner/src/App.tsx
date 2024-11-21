import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet';
import markerIconPng from 'leaflet/dist/images/marker-icon.png'

function App() {
  return (
    <MapContainer center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
     <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
     <Marker position={[49.195061, 16.606836]} icon={new Icon({iconUrl: markerIconPng, iconAnchor: [12, 41]})}>
       <Popup>
         A pretty CSS3 popup. <br /> Easily customizable.
       </Popup>
     </Marker>
   </MapContainer>
  

  );
}

export default App;
