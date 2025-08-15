/**
 * @file App.tsx
 * @brief Main component of the application, contains all of the subcomponents either
 * in desktop or mobile view
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { Box, IconButton, Tooltip, Select, MenuItem, SelectChangeEvent } from "@mui/material";
import TripRequestForm from './components/Form/TripRequestForm.tsx';
import TripsSummary from './components/TripsSummary';
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import '../i18n.ts'
import useIsMobile from './hooks/useIsMobile';
import {useState, useEffect} from "react";
import { useTranslation } from 'react-i18next';
import AboutApp from "./components/AboutApp";
import MobileTripRequestForm from "./components/MobileViews/MobileTripRequestForm.tsx";
import MobileTripsSummary from "./components/MobileViews/MobileTripSummary";
import {availableLanguages} from "../i18n.ts";
import MapWrapper from "./components/MapWrapper.tsx";

function App() {
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)

    const { startInputFocused, endInputFocused } = useAppSelector((state) => state.focus)

    const showCollapse = selectedTrip !== null

    const { t, i18n } = useTranslation()

    const [aboutAppDialogOpen, setAboutAppDialogOpen] = useState(false);

    const isMobile = useIsMobile()

    useEffect(() => {
        // Minimize the request form in mobile view when selecting a point
        if (isMobile) {
            if (startInputFocused || endInputFocused) {
                minimize("form")

            }
            else {
                if (document.getElementById("form")) {
                    maximize("form")
                }
            }
        }
    }, [startInputFocused, endInputFocused, isMobile]);

    /**
     * Minimize the content
     * @param origin Element id to minimize
     */
    const minimize = (origin: string) => {
        document.getElementById(origin)!.style.maxHeight = '5vh'
    }

    /**
     * Maximize the content
     * @param origin Element id to maximize
     */
    const maximize = (origin: string) => {
        document.getElementById(origin)!.style.maxHeight = '60vh'
    }

    /**
     * Returns correct language value for language selector
     * @param langValue Language value from i18next
     * @returns Correct language value
     */
    const getLanguageValue = (langValue: string) => {
        if (langValue === 'cs' || langValue === 'cs-CZ') {
            return 'cs'
        }
        return 'en'
    }

    /**
     * Change the language of the application based on lang parameter
     * @param e Event containing the selected language value
     */
    const changeLanguage = async (e: SelectChangeEvent) => {
        await i18n.changeLanguage(e.target.value)
    }

    return (
        <div style={{position: "relative", width: "100%"}}>
            <div style={{
                height: '90vh',
                minWidth: isMobile ? 'auto' : '700px', // 700 px is approximately 36 % of full hd width
                width: '36%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'absolute',
                top: "5%",
                left: "5%",
                pointerEvents: 'none',
                zIndex: 1000
            }}>
                {/* Mobile view for the request form */}
                { isMobile ? <MobileTripRequestForm/> :
                    <div
                        style={{
                            padding: "10px 10px",
                            pointerEvents: 'auto',
                            width: '50%',
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px",
                        }}>
                        <TripRequestForm/>
                    </div>                
                }

                 {/* Mobile view for the trips summary */}
                { isMobile ? <MobileTripsSummary/> :
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.8)",
                            fontSize: '1em',
                            maxHeight: '40vh',
                            pointerEvents: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            width: showCollapse ? '100%' : '50%',
                            padding: '0',
                        }}>
                        <div style={{ display: 'flex', flexDirection: 'row', pointerEvents: 'auto', overflow: 'auto' }}>
                            <TripsSummary/>
                        </div>
                    </div>
                }

            </div>
            <Box sx={{
                position: 'absolute',
                right: "1%",
                mt: 2,
                display: 'flex',
                height:  isMobile ? 'auto' : '95%',
                gap: isMobile ? '10px': 0,
                flexDirection: isMobile ? 'row' : 'column',
                justifyContent: 'space-between',
                zIndex: 1000
            }}>
                <Select size='small' sx={{ border: '1px solid black', fontSize: '1.5rem',
                    backgroundColor: '#f3f3f3' }} value={getLanguageValue(i18n.language)} onChange={changeLanguage}>
                    { availableLanguages.map(lang => (
                        <MenuItem key={lang} value={lang}>{t(`language.${lang}`)}</MenuItem>
                    )) }
                </Select>
                <Box sx={{ backgroundColor: 'white', borderRadius: '10px 10px 10px 10px', display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title={t('about.title')}>
                        <IconButton size='large' color='primary' onClick={() => setAboutAppDialogOpen(true)}>
                            <InfoOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <AboutApp dialogOpen={aboutAppDialogOpen} closeDialog={() => setAboutAppDialogOpen(false)}/>
            <MapWrapper/>
            <ActionFeedback/>
        </div>
    );
}

export default App;
