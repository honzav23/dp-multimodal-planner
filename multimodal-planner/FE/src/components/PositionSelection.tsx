/**
 * @file PositionSelection.tsx
 * @brief Component for handling map marker interactions, including setting start and end points on the map.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Icon, LatLngTuple, LeafletMouseEvent } from 'leaflet';

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from '../img/marker-icon-green.png'
import markerIconEnd from '../img/marker-icon-red.png'
import { CircleMarker, Marker, useMapEvents, Popup } from 'react-leaflet'
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getAddress } from '../store/slices/addressSlice';
import { setFocus } from '../store/slices/inputsFocusSlice';
import { setStartCoords, setEndCoords } from '../store/slices/tripSlice';

function PositionSelection() {
  const dispatch = useAppDispatch()
  const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
  const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

  const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
  const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)

  
  useMapEvents({
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


export default PositionSelection
