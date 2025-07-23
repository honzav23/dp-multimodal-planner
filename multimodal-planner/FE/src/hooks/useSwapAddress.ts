import { useAppDispatch, useAppSelector } from '../store/hooks.ts';
import { initialCoords, setStartCoords, setEndCoords } from "../store/slices/tripSlice.ts";
import {
    setStartAddress,
    clearStartAddress,
    setEndAddress,
    clearEndAddress,
} from '../store/slices/addressSlice.ts';


export const useSwapAddresses = () => {
    const dispatch = useAppDispatch();

    const { startAddress, endAddress } = useAppSelector(state => state.address)
    const startCoords = useAppSelector((state) => state.trip.tripRequest.origin)
    const endCoords = useAppSelector((state) => state.trip.tripRequest.destination)

    const swapOriginAndDestination = () => {
        if (!startAddress && endAddress) {
            dispatch(setStartAddress(endAddress));
            dispatch(clearEndAddress());

            dispatch(setStartCoords(endCoords));
            dispatch(setEndCoords(initialCoords));
        }
        else if (startAddress && !endAddress) {
            dispatch(setEndAddress(startAddress));
            dispatch(clearStartAddress());

            dispatch(setEndCoords(startCoords));
            dispatch(setStartCoords(initialCoords));
        }
        else if (startAddress && endAddress) {
            dispatch(setStartAddress(endAddress));
            dispatch(setEndAddress(startAddress));

            dispatch(setStartCoords(endCoords));
            dispatch(setEndCoords(startCoords));
        }
    };

    return swapOriginAndDestination;
};