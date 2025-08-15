/**
 * @file PositionSelection.tsx
 * @brief Component for handling map marker interactions, including setting start and end points on the map.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 *
 * Marker dragging functionality was done with the help of ChatGPT
 */

import { Icon, LatLngTuple, LeafletMouseEvent, Marker as LeafletMarker } from 'leaflet';

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from '../img/marker-icon-green.png'
import markerIconEnd from '../img/marker-icon-red.png'
import markerIconPickup from '../img/marker-icon-blue.png'
import { Marker, useMapEvents } from 'react-leaflet'
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getAddress } from '../store/slices/addressSlice';
import { setFocus } from '../store/slices/inputsFocusSlice';
import { setStartCoords, setEndCoords, setPickupCoords, clearTrips } from '../store/slices/tripSlice';
import { useRef } from 'react'

function PositionSelection() {
  const dispatch = useAppDispatch()

  const { startInputFocused, endInputFocused, pickupInputFocused } = useAppSelector((state) => state.focus)

  const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
  const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
  const pickupCoords = useAppSelector((state) => state.trip.tripRequest.preferences.pickupCoords)

  const startMarkerRef = useRef<LeafletMarker>(null);
  const endMarkerRef = useRef<LeafletMarker>(null);
  const pickupMarkerRef = useRef<LeafletMarker>(null);
  
  useMapEvents({
    /**
     * Place a desired marker after clicking on the map
     */
    click(e: LeafletMouseEvent) {
      const coords: LatLngTuple = [e.latlng.lat, e.latlng.lng]

      // Clear trips only when one of the inputs is focused
      // (ignore meaningless map clicks)
      if (startInputFocused || endInputFocused ||pickupInputFocused) {
        dispatch(clearTrips())
      }

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

  /**
   * Handles marker dragging and updating the address for the new marker position
   * @param origin Indication of which marker was dragged
   */
  const handleMarkerDrag = (origin: string) => {
    dispatch(clearTrips())
    if (origin === 'start' && startMarkerRef.current !== null) {
      const coords = startMarkerRef.current.getLatLng()
      const coordsTuple: LatLngTuple = [coords.lat, coords.lng]
      dispatch(getAddress({coords: coordsTuple, origin}))
      dispatch(setStartCoords(coordsTuple))
    }
    else if (origin === 'end' && endMarkerRef.current !== null) {
      const coords = endMarkerRef.current.getLatLng()
      const coordsTuple: LatLngTuple = [coords.lat, coords.lng]
      dispatch(getAddress({coords: coordsTuple, origin}))
      dispatch(setEndCoords(coordsTuple))
    }
    else if (origin === 'pickup' && pickupMarkerRef.current !== null) {
      const coords = pickupMarkerRef.current.getLatLng()
      const coordsTuple: LatLngTuple = [coords.lat, coords.lng]
      dispatch(getAddress({coords: coordsTuple, origin}))
      dispatch(setPickupCoords(coordsTuple))
    }
  }

  return (
    <div>
      <Marker ref={startMarkerRef} draggable eventHandlers={{ dragend: () => handleMarkerDrag('start') }} position={startCoords} icon={new Icon({iconUrl: markerIconStart, iconAnchor: [12, 41]})}/>
      <Marker ref={endMarkerRef} draggable position={endCoords} eventHandlers={{ dragend: () => handleMarkerDrag('end') }} icon={new Icon({iconUrl: markerIconEnd, iconAnchor: [12, 41]})}/>
      <Marker ref={pickupMarkerRef} draggable position={pickupCoords} eventHandlers={{ dragend: () => handleMarkerDrag('pickup') }} icon={new Icon({iconUrl: markerIconPickup, iconAnchor: [12, 41]})}/>
    </div>
  )
}


export default PositionSelection
