import './App.css';
import {Drawer, Box, IconButton, Tooltip, Select, MenuItem, SelectChangeEvent} from "@mui/material";
import TripRequestForm from './components/TripRequestForm';
import TripsSummary from './components/TripsSummary';
import { useAppSelector } from "./store/hooks";
import ActionFeedback from "./components/ActionFeedback";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import '../i18n.ts'
import useIsMobile from './hooks/useIsMobile';
import {useState} from "react";
import { useTranslation } from 'react-i18next';
import AboutApp from "./components/AboutApp";
import {availableLanguages} from "../i18n.ts";
import MapWrapper from "./MapWrapper.tsx";

function App() {
    const { outboundTrips } = useAppSelector((state) => state.trip.tripResults)
    const selectedTrip = useAppSelector((state) => state.trip.selectedTrip)
    const showCollapse = selectedTrip !== -1

    const { t, i18n } = useTranslation()

    const [tabValue, setTabValue] = useState('outbound');
    const [aboutAppDialogOpen, setAboutAppDialogOpen] = useState(false);

    const isMobile = useIsMobile()

    /**
     * Change the drawer height based on if it is minimized or not
     * @param minimize If the drawer is minimized
     */
    const changeHeight = (minimize: boolean) => {
        if (minimize) {
            document.getElementById('summary').style.maxHeight = '5vh'
        }
        else {
            document.getElementById('summary').style.maxHeight = '60vh'
        }
    }

    const handleSwitchRoutes = (tabValue: string) => {
        setTabValue(tabValue)
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
                { isMobile ? (outboundTrips.length === 0 &&
                        <Drawer sx={{ pointerEvents: 'none' }} open={true} anchor='bottom' PaperProps={{sx: { boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} hideBackdrop>
                            <Box sx={{
                                pointerEvents: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                m: 1
                            }}>
                                <TripRequestForm/>
                            </Box>
                        </Drawer>
                )
                    :
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
                { isMobile ? (outboundTrips.length > 0 &&
                    <Drawer sx={{ pointerEvents: 'none' }} PaperProps={{sx: { boxShadow: '0px -20px 10px rgba(0, 0, 0, 0.2)' }}} open={true} anchor='bottom' hideBackdrop>
                        <Box id="summary" sx={{
                            fontSize: '1em',
                            maxHeight: '50vh',
                            pointerEvents: 'auto',
                            display:'flex',
                            flexDirection: 'column',
                        }}>
                            <TripsSummary switchRoutes={handleSwitchRoutes} changeHeight={changeHeight}/>
                        </Box>
                    </Drawer>)
                    :
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
                            <TripsSummary switchRoutes={handleSwitchRoutes}/>
                        </div>
                    </div>
                }

            </div>
            <div style={{
                position: 'absolute',
                bottom: "5%",
                right: "1%",
                backgroundColor: 'rgba(255, 255, 255, 1.0)',
                borderRadius: '10px 10px 10px 10px',
                zIndex: 1000
            }}>
                <Tooltip title={t('about.title')}>
                    <IconButton size='large' color='primary' onClick={() => setAboutAppDialogOpen(true)}>
                        <InfoOutlinedIcon sx={{ width: '2rem', height: 'auto' }}/>
                    </IconButton>
                </Tooltip>
            </div>

            <div style={{
                position: 'absolute',
                top: "5%",
                right: "1%",
                backgroundColor: 'rgba(255, 255, 255, 1.0)',
                borderRadius: '10px 10px 10px 10px',
                zIndex: 1000
            }}>
                <Select size='small' sx={{ border: '1px solid black', fontSize: '1.5rem', backgroundColor: '#f3f3f3' }} value={i18n.language} onChange={changeLanguage}>
                    { availableLanguages.map(lang => (
                        <MenuItem value={lang}>{t(`language.${lang}`)}</MenuItem>
                    )) }
                </Select>
            </div>

            <AboutApp dialogOpen={aboutAppDialogOpen} closeDialog={() => setAboutAppDialogOpen(false)}/>
            <MapWrapper tabValue={tabValue}/>
            <ActionFeedback/>
        </div>
    );
}

export default App;
