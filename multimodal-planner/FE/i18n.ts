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
import translationCS from './src/languages/cs.json'
import translationEN from './src/languages/en.json'

export const availableLanguages = ["cs", "en"]

i18n.use(initReactI18next).use(LanguageDetector).init({
    fallbackLng: 'en',
    resources: {
        cs: {
            translation: translationCS
        },
        en: {
            translation: translationEN
        }
    },
    detection: {
        order: ['navigator'],
    },
    supportedLngs: ["en", "cs"],
    nonExplicitSupportedLngs: true,
})