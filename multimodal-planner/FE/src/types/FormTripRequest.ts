/**
 * @file FormTripRequest.ts
 * @brief Defines the type for trip request that goes to the server
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import type { TripRequest, TripPreferences } from "../../../types/TripRequest";

export type FormTripRequest = Omit<TripRequest, "departureDateTime" | "preferences"> & { departureDate: string, departureTime: string, preferences: FormTripPreferences };

type FormTripPreferences = Omit<TripPreferences, "comingBack"> & { comingBack: { returnDate: string, returnTime: string } | null }