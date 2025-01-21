import './App.css';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import decodePolyline from './decodePolyline.ts'
import MarkerWrapper from './components/MarkerWrapper.tsx';
import TripRequestForm from './components/TripRequestForm.tsx';

function App() {
  const x = decodePolyline("srmkH}vedBTCl@Ab@CdAEVC`@EZGJEBAPIFCLGj@]LIDARMNIXQVOnCgBbDmBrAy@HGt@e@ZS`@WLG@ARMLGFEVOACEU[_BACKo@Km@Mi@m@}CEWaCwM?M?E?E@C@EBKBCDCDGHATMNGjCaB@AHEBKF}B?ME[ACCU}@eHCOsAyKEU?CLG~CaBHEVM|@c@@APIRKFEBApAo@pCwA~DsBb@WfAi@`EqB\\QDCHE@Al@YNIDAlAo@fAi@`Ag@PI?AC[}@qFCQESg@mDc@qCFCHA")



  const handleClick = (e: any) => {
    console.log("Clicked on polyline")
  }

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <TripRequestForm/>
      <MapContainer center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
      <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerWrapper/>
        <Polyline eventHandlers={{click: handleClick}} positions={x} pathOptions={{color: "orange", weight: 5}}/>

    </MapContainer>
    </div>
  

  );
}

export default App;
