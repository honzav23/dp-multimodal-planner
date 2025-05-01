/**
 * @file PositionSelection.tsx
 * @brief Component for handling map marker interactions, including setting start and end points on the map.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { Icon, LatLngTuple, LeafletMouseEvent } from 'leaflet';

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from '../img/marker-icon-green.png'
import markerIconEnd from '../img/marker-icon-red.png'
import markerIconPickup from '../img/marker-icon-blue.png'
import { Marker, useMapEvents } from 'react-leaflet'
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getAddress } from '../store/slices/addressSlice';
import { setFocus } from '../store/slices/inputsFocusSlice';
import { setStartCoords, setEndCoords, setPickupCoords } from '../store/slices/tripSlice';

function PositionSelection() {
  const dispatch = useAppDispatch()

  const { startInputFocused, endInputFocused, pickupInputFocused } = useAppSelector((state) => state.focus)

  const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
  const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
  const pickupCoords = useAppSelector((state) => state.trip.tripRequest.preferences.pickupCoords)

  
  useMapEvents({
    /**
     * Place a desired marker after clicking on the map
     */
    click(e: LeafletMouseEvent) {
      const coords: LatLngTuple = [e.latlng.lat, e.latlng.lng]
      if (startInputFocused) {
        dispatch(getAddress({coords, origin: "start"}))
        dispatch(setStartCoords(coords))
        dispatch(setFocus({origin: "start", focused: false}))
      }
      else if (pickupInputFocused) {
        dispatch(getAddress({coords, origin: "pickup"}))
        dispatch(setPickupCoords(coords))
        dispatch(setFocus({origin: "pickup", focused: false}))
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
      <Marker position={pickupCoords} icon={new Icon({iconUrl: markerIconPickup, iconAnchor: [12, 41]})}/>
    </div>
  )
}


export default PositionSelection
