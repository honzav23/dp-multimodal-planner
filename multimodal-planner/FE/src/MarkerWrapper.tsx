import { Icon, LatLngTuple, LeafletMouseEvent } from 'leaflet';

// Marker images adopted from https://github.com/pointhi/leaflet-color-markers/blob/master/
import markerIconStart from './img/marker-icon-green.png'
import markerIconEnd from './img/marker-icon-red.png'
import { Marker, useMapEvents } from 'react-leaflet'
import { InputProps } from './types/InputProps';
import { useState } from 'react';

interface MarkerWrapperProps {
  startInputProps: InputProps,
  endInputProps: InputProps,
  changePosition: (origin: string, position: LatLngTuple) => void
}

function MarkerWrapper({startInputProps, endInputProps, changePosition }: MarkerWrapperProps) {
  const [startPosition, setStartPosition] = useState<LatLngTuple>([-1, -1])
  const [endPosition, setEndPosition] = useState<LatLngTuple>([-1, -1])
  const map = useMapEvents({
    click(e: LeafletMouseEvent) {
      const coords: LatLngTuple = [e.latlng.lat, e.latlng.lng]
      if (startInputProps.isFocused) {
        setStartPosition(coords)
        changePosition("start", coords)
      }
      else if (endInputProps.isFocused) {
        setEndPosition(coords)
        changePosition("end", coords)
      }
    }
  })

  return (
    <div>
      <Marker position={startPosition} icon={new Icon({iconUrl: markerIconStart, iconAnchor: [12, 41]})}/>
      <Marker position={endPosition} icon={new Icon({iconUrl: markerIconEnd, iconAnchor: [12, 41]})}/>
    </div>
  )
}


export default MarkerWrapper
