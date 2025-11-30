import {clearAddressError, getCoordinatesFromAddress, setAddressError} from "../store/slices/addressSlice.ts";
import {useAppDispatch, useAppSelector} from "../store/hooks.ts";
import { useTranslation } from "react-i18next";
import {InputLocation} from "../types/FormTripRequest.ts";

export function useAddressCoords() {
    const dispatch = useAppDispatch();
    const boundingBox = useAppSelector(state => state.address.boundingBox);
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

    function coordsInBoundingBox(coords: number[]): boolean {
        if (!boundingBox) {
            return true
        }
        return coords[1] >= boundingBox.minX && coords[1] <= boundingBox.maxX && coords[0] >= boundingBox.minY
            && coords[0] <= boundingBox.maxY;
    }

    return { getAddressCoords, coordsInBoundingBox };
}
