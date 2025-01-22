import { Icon, LatLngTuple, LeafletMouseEvent } from 'leaflet';

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from '../img/marker-icon-green.png'
import markerIconEnd from '../img/marker-icon-red.png'
import { Marker, useMapEvents } from 'react-leaflet'
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getAddress } from '../store/addressSlice';
import { setFocus } from '../store/inputsFocusSlice';
import { setStartCoords, setEndCoords } from '../store/tripRequestSlice';

function MarkerWrapper() {
  const dispatch = useAppDispatch()
  const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
  const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

  const startCoords = useAppSelector((state) => state.tripRequest.origin)
  const endCoords = useAppSelector((state) => state.tripRequest.destination)

  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      const coords: LatLngTuple = [e.latlng.lat, e.latlng.lng]
      if (startInputFocused) {
        dispatch(getAddress({coords, origin: "start"}))
        dispatch(setStartCoords(coords))
        dispatch(setFocus({origin: "start", focused: false}))
      }
      else if (endInputFocused) {
        dispatch(getAddress({coords, origin: "end"}))
        dispatch(setEndCoords(coords))
        dispatch(setFocus({origin: "end", focused: false}))
      }
    }
  })

  return (
    <div>
      <Marker position={startCoords} icon={new Icon({iconUrl: markerIconStart, iconAnchor: [12, 41]})}/>
      <Marker position={endCoords} icon={new Icon({iconUrl: markerIconEnd, iconAnchor: [12, 41]})}/>
    </div>
  )
}


export default MarkerWrapper
