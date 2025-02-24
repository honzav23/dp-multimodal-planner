/**
 * @file i18n.ts
 * @brief File for language configuration and all translations in all languages that this app supports
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from "react-i18next";

i18n.use(LanguageDetector).use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
        cs: {
            translation: {
                form: {
                    plan: "Plánování trasy",
                    start: "Počátek",
                    end: "Cíl",
                    departureDate: "Datum odjezdu",
                    departureTime: "Čas odjezdu",
                    show: "Ukázat trasy",
                    switch: "Prohodit počátek a cíl",
                },
                feedback: {
                    error: "Nepodařilo se načíst trasy"
                },
                preferences: {
                    headline: "Rozšířená nastavení",
                    transferPoints: "Přestupní body",
                    noParkingLots: "Žádná parkoviště v blízkosti",
                    transport: "Preferované dopravní prostředky"
                },
                transfer: {
                    select: "Zvolit jako přestupní bod",
                    deselect: "Zrušit výběr přestupního bodu",
                    transferPlural: "přestupů",
                    transferSingular: "přestup",
                    transfer234: "přestupy"
                },
                language: {
                    select: "Jazyk"
                },
                transport: {
                    bus: "Autobus",
                    rail: "Vlak",
                    tram: "Tramvaj",
                    trolleybus: "Trolejbus"
                }
            }
        },
        en: {
            translation: {
                form: {
                    plan: "Plan a trip",
                    start: "Start",
                    end: 'End',
                    departureDate: "Departure date",
                    departureTime: "Departure time",
                    show: "Show routes",
                    switch: "Switch start and end"
                },
                feedback: {
                    error: "Unable to fetch trips"
                },
                preferences: {
                    headline: "Additional preferences",
                    transferPoints: "Transfer points",
                    noParkingLots: "No parking lots nearby",
                    transport: "Preferred means of transport"
                },
                transfer: {
                    select: "Select as a transfer point",
                    deselect: "Deselect the transfer point",
                    transferPlural: "transfers",
                    transferSingular: "transfer",
                    transfer234: "transfers"
                },
                language: {
                    select: "Language"
                },
                transport: {
                    bus: "Bus",
                    rail: "Train",
                    tram: "Tram",
                    trolleybus: "Trolleybus"
                }
            }
        }
    }
})