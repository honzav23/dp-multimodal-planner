/**
 * @file PositionSelection.tsx
 * @brief Component for handling map marker interactions, including setting start and end points on the map.
 * 
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 *
 * Marker dragging functionality was done with the help of ChatGPT
 */

import {Icon, LeafletMouseEvent, Marker as LeafletMarker} from 'leaflet';
import type {LatLngTuple} from '../../../types/TripRequest.ts'

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from '../img/marker-icon-green.png'
import markerIconEnd from '../img/marker-icon-red.png'
import markerIconPickup from '../img/marker-icon-blue.png'
import {Marker, useMapEvents} from 'react-leaflet'
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {clearAddressError, getAddress, setAddressError} from '../store/slices/addressSlice';
import {setFocus} from '../store/slices/inputsFocusSlice';
import {
  clearTrips,
  setEndCoords,
  setPickupCoords,
  setShowTripsSummary,
  setStartCoords
} from '../store/slices/tripSlice';
import {InputLocation} from '../types/FormTripRequest.ts'
import {useRef} from 'react'
import {useAddressCoords} from "../hooks/useAddressCoords.ts";
import {useTranslation} from "react-i18next";
import {UnknownAction} from "@reduxjs/toolkit";

function PositionSelection() {
  const dispatch = useAppDispatch()
  const { coordsInBoundingBox } = useAddressCoords()
  const { t } = useTranslation()

  const { startInputFocused, endInputFocused, pickupInputFocused } = useAppSelector((state) => state.focus)

  const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
  const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)
  const pickupCoords = useAppSelector((state) => state.trip.tripRequest.preferences.pickupCoords)

  const startMarkerRef = useRef<LeafletMarker>(null);
  const endMarkerRef = useRef<LeafletMarker>(null);
  const pickupMarkerRef = useRef<LeafletMarker>(null);

  const handleFocusedInput = (
      origin: InputLocation,
      coords: [number, number],
      setCoords: (coords: [number, number]) => UnknownAction ,
  ) => {
    const inBoundingBox = coordsInBoundingBox(coords)
    if (!inBoundingBox) {
      dispatch(
          setAddressError({
            message: t('feedback.notInBoundingBox'),
            origin,
          }),
      )
      return
    }
    dispatch(getAddress({ coords, origin }))
    dispatch(setCoords(coords))
    dispatch(setFocus({ origin, focused: false }))
    dispatch(clearAddressError(origin))
  }
  
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
        handleFocusedInput(InputLocation.START, coords, setStartCoords)
      }
      else if (pickupInputFocused) {
        handleFocusedInput(InputLocation.PICKUP, coords, setPickupCoords)
      }
      else if (endInputFocused) {
        handleFocusedInput(InputLocation.END, coords, setEndCoords)
      }
    }
  })

  /**
   * Handles marker dragging and updating the address for the new marker position
   * @param origin Indication of which marker was dragged
   */
  const handleMarkerDrag = (origin: InputLocation) => {
    dispatch(clearTrips())
    dispatch(setShowTripsSummary(false))
    if (origin === InputLocation.START && startMarkerRef.current !== null) {
      const coords = startMarkerRef.current.getLatLng()
      handleFocusedInput(origin, [coords.lat, coords.lng], setStartCoords)
    }
    else if (origin === InputLocation.PICKUP && pickupMarkerRef.current !== null) {
      const coords = pickupMarkerRef.current.getLatLng()
      handleFocusedInput(origin, [coords.lat, coords.lng], setPickupCoords)
    }
    else if (origin === InputLocation.END && endMarkerRef.current !== null) {
      const coords = endMarkerRef.current.getLatLng()
      handleFocusedInput(origin, [coords.lat, coords.lng], setEndCoords)
    }
  }

  return (
    <div>
      <Marker ref={startMarkerRef} draggable eventHandlers={{ dragend: () => handleMarkerDrag(InputLocation.START) }} position={startCoords} icon={new Icon({iconUrl: markerIconStart, iconAnchor: [12, 41]})}/>
      <Marker ref={pickupMarkerRef} draggable position={pickupCoords} eventHandlers={{ dragend: () => handleMarkerDrag(InputLocation.PICKUP) }} icon={new Icon({iconUrl: markerIconPickup, iconAnchor: [12, 41]})}/>
      <Marker ref={endMarkerRef} draggable position={endCoords} eventHandlers={{ dragend: () => handleMarkerDrag(InputLocation.END) }} icon={new Icon({iconUrl: markerIconEnd, iconAnchor: [12, 41]})}/>
    </div>
  )
}


export default PositionSelection
