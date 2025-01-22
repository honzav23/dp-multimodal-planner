import { TextField, InputAdornment, IconButton, Button, Tooltip, } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import CloseIcon from '@mui/icons-material/Close';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setFocus } from '../store/inputsFocusSlice';
import { setStartCoords, setEndCoords, setDepartureDate, setDepartureTime, getRoutes, initialCoords } from '../store/tripRequestSlice';
import { clearStartAddress, clearEndAddress, setStartAddress, setEndAddress } from '../store/addressSlice';
import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';

export function TripRequestForm() {

    const startInputFocused = useAppSelector((state) => state.focus.startInputFocused)
    const endInputFocused = useAppSelector((state) => state.focus.endInputFocused)

    const startAddress = useAppSelector((state) => state.address.startAddress)
    const endAddress = useAppSelector((state) => state.address.endAddress)

    const startCoords = useAppSelector((state) => state.tripRequest.origin)
    const endCoords = useAppSelector((state) => state.tripRequest.destination)

    const startInputValue = startAddress === null ? '' : (startAddress === '' ? `${startCoords[0].toFixed(3)} ${startCoords[1].toFixed(3)}` : startAddress)
    const endInputValue = endAddress === null ? '' : (endAddress === '' ? `${endCoords[0].toFixed(3)} ${endCoords[1].toFixed(3)}` : endAddress)

    const startInput = useRef<HTMLInputElement>(null)
    const endInput = useRef<HTMLInputElement>(null)

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
        dispatch(setStartCoords(initialCoords))
        dispatch(clearStartAddress())
        }
        else {
        dispatch(setEndCoords(initialCoords))
        dispatch(clearEndAddress())
        }
    }

    /**
     * Swaps the origin address and coordinates with the destination ones
     */
    const swapOriginAndDestination = () => {
      if (startAddress === null && endAddress !== null) {
        dispatch(setStartAddress(endAddress))
        dispatch(clearEndAddress())

        dispatch(setStartCoords(endCoords))
        dispatch(setEndCoords(initialCoords))
      }
      else if (startAddress !== null && endAddress === null) {
        dispatch(clearStartAddress())
        dispatch(setEndAddress(startAddress))

        dispatch(setEndCoords(startCoords))
        dispatch(setStartCoords(initialCoords))
      }
      else if (startAddress !== null && endAddress !== null) {
        dispatch(setStartAddress(endAddress))
        dispatch(setEndAddress(startAddress))

        dispatch(setStartCoords(endCoords))
        dispatch(setEndCoords(startCoords))
      }
    }

    return (
        <div
        style={{
          position: "absolute",
          padding: "20px",
          top: "5%",
          left: "5%",
          zIndex: 1000,
          width: "300px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
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
      <Tooltip title="Switch places">
        <IconButton size="large" sx={{ width: '50px', color: 'black', alignSelf: 'center' }} onClick={swapOriginAndDestination}>
          <SwapVertIcon fontSize='inherit'/>
        </IconButton>
      </Tooltip>

      {/* End point text field */}
      <TextField sx={{ backgroundColor: "white", mb: 2 }} slotProps={
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
      <div style={{ display: 'flex', gap: '10px'}}>
        <DatePicker label="Departure date" sx={{ backgroundColor: 'white', flex: "1" }} defaultValue={dayjs(Date.now())} onChange={(date) => dispatch(setDepartureDate({year: date.$y, month: date.$M, day: date.$D}))}/>
        <TimePicker label="Departure time" sx={{ backgroundColor: 'white', flex: "0 0 40%" }} defaultValue={dayjs(Date.now())} onChange={(time) => dispatch(setDepartureTime(time.$d.toLocaleTimeString()))}/>
      </div>
        {/* // <DatePicker label="Departure date" sx={{ backgroundColor: 'white', flex: "0 0 80%" }} defaultValue={dayjs(Date.now())} onChange={(date) => dispatch(setDepartureDate({year: date.$y, month: date.$M, day: date.$D}))}/>
        // <TimePicker label="Departure time" sx={{ backgroundColor: 'white', flex: "0 0 20%" }} defaultValue={dayjs(Date.now())} onChange={(time) => dispatch(setDepartureTime(time.$d.toLocaleTimeString()))}/> */}
      
  
      <Button variant='outlined' onClick={() => dispatch(getRoutes())}>Show routes</Button>
      </div>
    )
}

export default TripRequestForm