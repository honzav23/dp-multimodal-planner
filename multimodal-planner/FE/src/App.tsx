import './App.css';
import { useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import { LatLngTuple } from 'leaflet';
import decodePolyline from './decodePolyline.ts'
import MarkerWrapper from './MarkerWrapper.tsx';
import { InputProps } from './types/InputProps.ts';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


function App() {
  const x = decodePolyline("srmkH}vedBTCl@Ab@CdAEVC`@EZGJEBAPIFCLGj@]LIDARMNIXQVOnCgBbDmBrAy@HGt@e@ZS`@WLG@ARMLGFEVOACEU[_BACKo@Km@Mi@m@}CEWaCwM?M?E?E@C@EBKBCDCDGHATMNGjCaB@AHEBKF}B?ME[ACCU}@eHCOsAyKEU?CLG~CaBHEVM|@c@@APIRKFEBApAo@pCwA~DsBb@WfAi@`EqB\\QDCHE@Al@YNIDAlAo@fAi@`Ag@PI?AC[}@qFCQESg@mDc@qCFCHA")
  
  const startInput = useRef<HTMLInputElement>(null)
  const endInput = useRef<HTMLInputElement>(null)

  const [startInputProps, setStartInputProps] = useState<InputProps>({value: "", isFocused: false})
  const [endInputProps, setEndInputProps] = useState<InputProps>({value: "", isFocused: false})


  const changeCursor = (props: {origin: string, focused: boolean}): void => {
    const elements = document.getElementsByClassName("leaflet-grab")
    let cursorStyle = "grab"
    const value = startInput.current?.value
    if (props.origin === "start" && props.focused) {
      cursorStyle = "crosshair"
    }
    else if (props.origin === "end" && props.focused) {
      cursorStyle = "crosshair"
    }

    for (let element of elements) {
      element.style.cursor = cursorStyle
    }
  }

  const handleChangePosition = (origin: string, coords: LatLngTuple) => {
      if (origin === "start") {
        setStartInputProps({isFocused: false, value: `${coords[0].toFixed(3)} ${coords[1].toFixed(3)}`})
        endInput.current?.focus()
      }
      else if (origin === "end") {
        setEndInputProps({isFocused: false, value: `${coords[0].toFixed(3)} ${coords[1].toFixed(3)}`})
      }
  }

  const handleClick = (e: any) => {
    console.log("Clicked on polyline")
  }

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "5%",
          zIndex: 1000,
          backgroundColor: "transparent",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
      {/* Start point text field */}
      <TextField style={{ backgroundColor: "white" }} slotProps={
        {
          input: {
            endAdornment: 
            <InputAdornment position='end'>
              <IconButton edge='end'>
                <CloseIcon/>
              </IconButton>
            </InputAdornment>}}}
        size="small" value={startInputProps.value ?? ""} onChange={(e: any) => setStartInputProps({...startInputProps, value: e.value})}
        ref={startInput} placeholder='Start' type='text' onBlur={() => {startInput.current?.focus();changeCursor({origin: "start", focused: true})}}
        onFocus={() => {setStartInputProps({...startInputProps, isFocused: true});changeCursor({origin: "start", focused: true})}}
      />

      {/* End point text field */}
      <TextField style={{ backgroundColor: "white" }} slotProps={
        {
          input: {
            endAdornment: 
            <InputAdornment position='end'>
              <IconButton edge='end'>
                <CloseIcon/>
              </IconButton>
            </InputAdornment>}}}
        size="small" value={endInputProps.value ?? ""} onChange={(e: any) => setEndInputProps({...endInputProps, value: e.value})}
        ref={endInput} placeholder='End' type='text' onBlur={() => {endInput.current?.focus();changeCursor({origin: "end", focused: true})}}
        onFocus={() => {setEndInputProps({...endInputProps, isFocused: true});changeCursor({origin: "end", focused: true})}}
      />
      </div>
      <MapContainer center={[49.195061, 16.606836]} zoom={12} scrollWheelZoom={true} style={{height: '100vh'}}>
      <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerWrapper startInputProps={startInputProps} endInputProps={endInputProps} changePosition={handleChangePosition}/>
        <Polyline eventHandlers={{click: handleClick}} positions={x} pathOptions={{color: "orange", weight: 5}}/>
    </MapContainer>
    </div>
  

  );
}

export default App;
