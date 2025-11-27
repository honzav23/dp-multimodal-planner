/**
 * @file TripRequestForm.tsx
 * @brief Component for planning a trip, including input fields for start and end points, date and time pickers.
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {
    Button,
    IconButton,
    InputAdornment,
    TextField,
    Tooltip,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import {
    Close,
    Minimize,
    SwapVert,
    Tune,
    ZoomOutMap,
} from "@mui/icons-material";

import { useAppDispatch, useAppSelector } from "../../store/hooks.ts";
import { setFocus } from "../../store/slices/inputsFocusSlice.ts";
import {
    clearTrips,
    getTrips,
    initialCoords,
    setDepartureDate,
    setDepartureTime,
    setEndCoords,
    setSelectedTrip,
    setShowTripsSummary,
    setStartCoords,
} from "../../store/slices/tripSlice.ts";
import {
    clearAddressError,
    clearEndAddress,
    clearStartAddress,
    setEndAddress,
    setStartAddress,
} from "../../store/slices/addressSlice.ts";
import { pickerBackround, textFieldBackround } from "../../css/inputStyles.ts";
import { type KeyboardEvent, useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import AdditionalPreferences from "./AdditionalPreferences.tsx";

import { useTranslation } from "react-i18next";
import useIsMobile from "../../hooks/useIsMobile.ts";
import { useSwapAddresses } from "../../hooks/useSwapAddress.ts";
import useDateError from "../../hooks/useDateError.ts";
import useTimeError from "../../hooks/useTimeError.ts";
import { useDebouncedCallback } from "use-debounce";
import { InputLocation } from "../../types/FormTripRequest.ts";
import { useAddressCoords } from "../../hooks/useAddressCoords.ts";

interface TripRequestFormProps {
    minimize?: () => void;
    maximize?: () => void;
}

export function TripRequestForm({ minimize, maximize }: TripRequestFormProps) {
    const { startInputFocused, endInputFocused, pickupInputFocused } =
        useAppSelector((state) => state.focus);

    const {
        startAddress,
        endAddress,
        startAddressError,
        endAddressError,
        pickupAddressError,
    } = useAppSelector((state) => state.address);

    const outboundTrips = useAppSelector(
        (state) => state.trip.tripResults.outboundTrips
    );
    const isLoading = useAppSelector((state) => state.trip.isLoading);
    const { departureDate, departureTime } = useAppSelector(
        (state) => state.trip.tripRequest
    );

    const isMobile = useIsMobile();
    const swapOriginAndDestination = useSwapAddresses();
    const getAddressCoords = useAddressCoords();
    const [minimized, setMinimized] = useState(false);

    const [dialogOpen, setDialogOpen] = useState(false);
    const { t } = useTranslation();

    const [dateError, setDateError, handleDateError] = useDateError();
    const [timeError, setTimeError, handleTimeError] = useTimeError();
    const [comingBackDateValid, setComingBackDateValid] = useState(true);
    const [comingBackTimeValid, setComingBackTimeValid] = useState(true);

    const formValid =
        startAddress !== "" &&
        endAddress !== "" &&
        !startAddressError.error &&
        !endAddressError.error &&
        !pickupAddressError.error &&
        !dateError.error &&
        !timeError.error &&
        comingBackDateValid &&
        comingBackTimeValid;

    const dispatch = useAppDispatch();

    useEffect(() => {
        changeCursorStyle();
    }, [startInputFocused, endInputFocused, pickupInputFocused]);

    // Used to be able to submit the form by Enter key
    useEffect(() => {
        window.addEventListener("keyup", (e: globalThis.KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        });

        return () => {
            window.removeEventListener("keyup", handleSubmit);
        };
    }, [formValid, isLoading]);

    const handleDateChange = (date: Dayjs | null) => {
        if (date === null) {
            setDateError({
                error: true,
                message: t("form.validation.invalidDate"),
            });
        } else {
            setDateError({ error: false, message: "" });
            dispatch(
                setDepartureDate({
                    year: date.year(),
                    month: date.month(),
                    day: date.date(),
                })
            );
        }
    };

    const handleTimeChange = (time: Dayjs | null) => {
        if (time === null) {
            setTimeError({
                error: true,
                message: t("form.validation.invalidTime"),
            });
        } else {
            setTimeError({ error: false, message: "" });
            dispatch(setDepartureTime(time.toDate().toLocaleTimeString()));
        }
    };

    const debouncedNominatimSearch = useDebouncedCallback(
        async (value: string, origin: InputLocation) => {
            const coordinates = await getAddressCoords(value, origin);
            if (coordinates.length === 0) {
                return;
            }
            if (origin === InputLocation.START) {
                dispatch(setStartCoords([coordinates[0], coordinates[1]]));
            } else {
                dispatch(setEndCoords([coordinates[0], coordinates[1]]));
            }
        },
        1000
    );

    const handleInputChange = (value: string, origin: InputLocation) => {
        if (origin === InputLocation.START) {
            dispatch(setStartAddress(value));
        } else {
            dispatch(setEndAddress(value));
        }
        if (value === "") {
            dispatch(clearAddressError(origin));
            return;
        }
        debouncedNominatimSearch(value, origin);
    };

    /**
     * Changes the cursor style based on the input focus
     */
    const changeCursorStyle = () => {
        const elements = document.getElementsByClassName("leaflet-grab");
        let cursorStyle = "grab";

        if (startInputFocused || endInputFocused || pickupInputFocused) {
            cursorStyle = "crosshair";
        }

        for (let element of elements) {
            (element as HTMLElement).style.cursor = cursorStyle;
            cursorStyle = "crosshair";
        }
    };

    /**
     * Clears the input field and the address
     * @param origin - The origin of the input field
     */
    const clearInput = (origin: InputLocation) => {
        dispatch(setShowTripsSummary(false));
        dispatch(clearAddressError(origin));
        if (origin === InputLocation.START) {
            dispatch(setStartCoords(initialCoords));
            dispatch(clearStartAddress());
        } else {
            dispatch(setEndCoords(initialCoords));
            dispatch(clearEndAddress());
        }

        // Remove the route if present
        dispatch(setSelectedTrip(null));
    };

    const handleDialogClosed = (
        comingBackDateValid: boolean,
        comingBackTimeValid: boolean
    ) => {
        setDialogOpen(false);
        setComingBackDateValid(comingBackDateValid);
        setComingBackTimeValid(comingBackTimeValid);
    };

    /**
     * Minimize only if the function is defined
     */
    const conditionalMinimize = () => {
        if (minimize) {
            setMinimized(true);
            minimize();
        }
    };

    /**
     * Maximize only if the function is defined
     */
    const conditionalMaximize = () => {
        if (maximize) {
            setMinimized(false);
            maximize();
        }
    };

    const handleSubmit = () => {
        if (formValid && !isLoading) {
            dispatch(getTrips());
            dispatch(clearTrips());
        }
    };

    // Disable opening the settings when submitting the form by Enter key
    const disableOpeningSettingsWhenSubmittingForm = (
        e: KeyboardEvent<HTMLButtonElement>
    ) => {
        if (e.key === "Enter") {
            e.preventDefault();
        }
    };

    return (
        <>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Tooltip
                    arrow
                    placement="right"
                    title={t("form.showPreferences")}
                >
                    <IconButton
                        size="large"
                        edge="start"
                        sx={{ color: "black" }}
                        onClick={() => setDialogOpen(true)}
                        onKeyDown={disableOpeningSettingsWhenSubmittingForm}
                    >
                        <Tune />
                    </IconButton>
                </Tooltip>
                <h2
                    style={{
                        flexGrow: 1,
                        textAlign: "center",
                        margin: 0,
                        transform: `translateX(${isMobile ? "0" : "-5%"})`,
                    }}
                >
                    {t("form.plan")}
                </h2>
                {isMobile && (
                    <div style={{ display: "flex" }}>
                        <IconButton
                            sx={{
                                visibility: !(
                                    startInputFocused || endInputFocused
                                )
                                    ? "visible"
                                    : "hidden",
                            }}
                            onClick={
                                minimized
                                    ? conditionalMaximize
                                    : conditionalMinimize
                            }
                            color="primary"
                            edge="start"
                        >
                            {minimized ? <ZoomOutMap /> : <Minimize />}
                        </IconButton>
                        {outboundTrips.length > 0 && (
                            <IconButton
                                onClick={() =>
                                    dispatch(setShowTripsSummary(true))
                                }
                            >
                                <ArrowForwardIcon color="primary" />
                            </IconButton>
                        )}
                    </div>
                )}
            </div>

            {/* Start point text field */}
            <TextField
                sx={textFieldBackround}
                slotProps={{
                    input: {
                        endAdornment: (
                            <div style={{ display: "flex" }}>
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            clearInput(InputLocation.START)
                                        }
                                    >
                                        <Close />
                                    </IconButton>
                                </InputAdornment>

                                <InputAdornment position="end">
                                    <Tooltip
                                        placement="right"
                                        title={t("form.startFromMap")}
                                    >
                                        <IconButton
                                            onClick={() =>
                                                dispatch(
                                                    setFocus({
                                                        origin: InputLocation.START,
                                                        focused: true,
                                                    })
                                                )
                                            }
                                            edge="end"
                                        >
                                            <LocationOnIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            </div>
                        ),
                    },
                }}
                size="small"
                error={startAddressError.error}
                helperText={startAddressError.message}
                onChange={(e) => {
                    handleInputChange(e.target.value, InputLocation.START);
                }}
                value={startAddress}
                placeholder={t("form.start")}
                type="text"
            />
            <Tooltip placement="right" title={t("form.switch")}>
                <IconButton
                    size="medium"
                    sx={{ color: "black", alignSelf: "center" }}
                    onClick={swapOriginAndDestination}
                >
                    <SwapVert fontSize="inherit" />
                </IconButton>
            </Tooltip>

            {/* End point text field */}
            <TextField
                sx={{ mb: 2, ...textFieldBackround }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <div style={{ display: "flex" }}>
                                <InputAdornment position="end">
                                    <IconButton
                                        edge="end"
                                        onClick={() =>
                                            clearInput(InputLocation.END)
                                        }
                                    >
                                        <Close />
                                    </IconButton>
                                </InputAdornment>
                                <InputAdornment position="end">
                                    <Tooltip
                                        placement="right"
                                        title={t("form.endFromMap")}
                                    >
                                        <IconButton
                                            edge="end"
                                            onClick={() =>
                                                dispatch(
                                                    setFocus({
                                                        origin: InputLocation.END,
                                                        focused: true,
                                                    })
                                                )
                                            }
                                        >
                                            <LocationOnIcon />
                                        </IconButton>
                                    </Tooltip>
                                </InputAdornment>
                            </div>
                        ),
                    },
                }}
                size="small"
                error={endAddressError.error}
                helperText={endAddressError.message}
                onChange={(e) => {
                    handleInputChange(e.target.value, InputLocation.END);
                }}
                value={endAddress}
                placeholder={t("form.end")}
                type="text"
            />

            <div style={{ display: "flex", gap: "10px" }}>
                {/* Select date */}
                <DatePicker
                    label={t("form.departureDate")}
                    sx={{
                        flex: "1",
                        ...pickerBackround,
                    }}
                    defaultValue={dayjs(Date.now())}
                    onError={(err, val) => handleDateError(err, val)}
                    slotProps={{
                        textField: {
                            error: dateError.error,
                            helperText: dateError.message,
                        },
                    }}
                    onChange={(date) => handleDateChange(date)}
                />

                {/* Select time */}
                <TimePicker
                    label={t("form.departureTime")}
                    sx={{
                        flex: "0 0 40%",
                        ...pickerBackround,
                    }}
                    defaultValue={dayjs(Date.now())}
                    onError={(err, val) => handleTimeError(err, val)}
                    slotProps={{
                        textField: {
                            error: timeError.error,
                            helperText: timeError.message,
                        },
                    }}
                    onChange={(time) => handleTimeChange(time)}
                />
            </div>
            <AdditionalPreferences
                dialogOpen={dialogOpen}
                closeDialog={(dateValid, timeValid) =>
                    handleDialogClosed(dateValid, timeValid)
                }
            />

            {/* Get routes button */}
            <Button
                disabled={!formValid || isLoading}
                sx={{
                    width: "60%",
                    alignSelf: "center",
                    textTransform: "none",
                    fontSize: "1rem",
                }}
                variant="contained"
                size="large"
                loading={isLoading}
                loadingPosition="end"
                onClick={handleSubmit}
            >
                {t("form.show")}
            </Button>
        </>
    );
}

export default TripRequestForm;
