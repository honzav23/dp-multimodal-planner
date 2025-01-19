import './App.css';
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'
import decodePolyline from './decodePolyline.ts'
import MarkerWrapper from './components/MarkerWrapper.tsx';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import CloseIcon from '@mui/icons-material/Close';
import { useAppSelector } from './store/hooks.ts';
import { useAppDispatch } from './store/hooks.ts';
import { setFocus } from './store/inputsFocusSlice.ts';
import { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime } from './store/tripRequestSlice.ts';
import { clearStartAddress, clearEndAddress } from './store/addressSlice.ts';
import dayjs from 'dayjs';

function App() {
  const x = decodePolyline("srmkH}vedBTCl@Ab@CdAEVC`@EZGJEBAPIFCLGj@]LIDARMNIXQVOnCgBbDmBrAy@HGt@e@ZS`@WLG@ARMLGFEVOACEU[_BACKo@Km@Mi@m@}CEWaCwM?M?E?E@C@EBKBCDCDGHATMNGjCaB@AHEBKF}B?ME[ACCU}@eHCOsAyKEU?CLG~CaBHEVM|@c@@APIRKFEBApAo@pCwA~DsBb@WfAi@`EqB\\QDCHE@Al@YNIDAlAo@fAi@`Ag@PI?AC[}@qFCQESg@mDc@qCFCHA")
  
  const startInput = useRef<HTMLInputElement>(null)
  const endInput = useRef<HTMLInputElement>(null)

  const startAddress = useAppSelector((state) => state.address.startAddress)
  const endAddress = useAppSelector((state) => state.address.endAddress)

  const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
  const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

  const startCoords = useAppSelector((state) => state.tripRequest.startCoords)
  const endCoords = useAppSelector((state) => state.tripRequest.endCoords)

  const startInputValue = startAddress === null ? '' : (startAddress === '' ? `${startCoords[0].toFixed(3)} ${startCoords[1].toFixed(3)}` : startAddress)
  const endInputValue = endAddress === null ? '' : (endAddress === '' ? `${endCoords[0].toFixed(3)} ${endCoords[1].toFixed(3)}` : endAddress)


  const dispatch = useAppDispatch()

  useEffect(() => {
    changeCursor()
  }, [startInputFocused, endInputFocused])

  /**
   * Changes the cursor style based on the input focus
   */
  const changeCursor = () => {
    const elements = document.getElementsByClassName("leaflet-grab")
    let cursorStyle = "grab"
    
    if (startInputFocused || endInputFocused) {
      cursorStyle = "crosshair"
    }

    for (let element of elements) {
      element.style.cursor = cursorStyle
      cursorStyle = "crosshair"
    }
  }

  /**
   * Clears the input field and the address
   * @param origin - The origin of the input field
   */
  const clearInput = (origin: string) => {
    if (origin === 'start') {
      dispatch(setStartCoords([1000, 1000]))
      dispatch(clearStartAddress())
    }
    else {
      dispatch(setEndCoords([1000, 1000]))
      dispatch(clearEndAddress())
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
          padding: "20px",
          top: "5%",
          left: "5%",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
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
              <IconButton edge='end' onClick={() => clearInput('start')}>
                <CloseIcon/>
              </IconButton>
            </InputAdornment>}}}
        size="small" value={startInputValue}
        ref={startInput} placeholder='Start' type='text'
        onFocus={() => dispatch(setFocus({origin: "start", focused: true}))}
      />

      {/* End point text field */}
      <TextField style={{ backgroundColor: "white" }} slotProps={
        {
          input: {
            endAdornment: 
            <InputAdornment position='end'>
              <IconButton edge='end' onClick={() => clearInput('end')}>
                <CloseIcon/>
              </IconButton>
            </InputAdornment>}}}
        size="small" value={endInputValue}
        ref={endInput} placeholder='End' type='text'
        onFocus={() => dispatch(setFocus({origin: "end", focused: true}))}
      />
  
      <DatePicker label="Departure date" sx={{ backgroundColor: 'white' }} defaultValue={dayjs(Date.now())} onChange={(date) => dispatch(setDepartureDate({year: date.$y, month: date.$M, day: date.$D}))}/>
      <TimePicker label="Departure time" sx={{ backgroundColor: 'white' }} defaultValue={dayjs(Date.now())} onChange={(time) => dispatch(setDepartureTime(date.$d.toLocaleTimeString()))}/>
      </div>
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
