import {clearAddressError, getCoordinatesFromAddress, setAddressError} from "../store/slices/addressSlice.ts";
import { useAppDispatch } from "../store/hooks.ts";
import { useTranslation } from "react-i18next";
import {InputLocation} from "../types/FormTripRequest.ts";

export function useAddressCoords() {
    const dispatch = useAppDispatch();
    const { t } = useTranslation();

    async function getAddressCoords(address: string, origin: InputLocation): Promise<number[]> {
        const trimmedValue = address.trim();
        if (trimmedValue.length === 0) {
            return [];
        }
        const coordinates = await dispatch(
            getCoordinatesFromAddress({ address })
        ).unwrap();
        if (coordinates.length === 0) {
            dispatch(setAddressError({ origin, message: t('feedback.addressNotFound') }))
            return []
        }
        dispatch(clearAddressError(origin))
        return coordinates;
    }

    return getAddressCoords
}
