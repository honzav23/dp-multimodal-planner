/**
 * @file AboutApp.tsx
 * @brief Component for showing basic information about the app and the tutorial for using it
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {DialogTitle, Divider, IconButton, Dialog, Tabs, Tab, DialogContent, Typography, Box} from "@mui/material";
import {type SyntheticEvent, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CarPubLogo from '../img/CarPub_logo.png'
import { useTranslation } from 'react-i18next'
import styles from '../css/styles.module.css'
import type { AboutAppTabValue } from "../types/AboutAppTabValue.ts"
import dataBrnoLogo from '../img/dataBrnoLogo.svg'
import lissyLogo from '../img/lissyLogo.svg'
import otpLogo from '../img/otpLogo.svg'
import wazeLogo from '../img/wazeLogo.svg'
import useIsMobile from "../hooks/useIsMobile.ts";


interface AboutAppProps {
    dialogOpen: boolean;
    closeDialog: () => void;
}

function AboutApp({ dialogOpen, closeDialog }: AboutAppProps) {
    const { t } = useTranslation();

    const [tabValue, setTabValue] = useState<AboutAppTabValue>('overview');
    const isMobile = useIsMobile()

    const handleTabChange = (e: SyntheticEvent, val: AboutAppTabValue) => {
        setTabValue(val);
    }

    return (
        <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth='lg'>
            <div style={{ display: "flex", justifyContent: 'center', alignItems: "center", backgroundColor: "#f3f3f3", flexWrap: "wrap" }}>
                <DialogTitle variant='h4'>
                    {t('about.title')}
                </DialogTitle>
                <img alt="CarPub logo" src={CarPubLogo} width='50px' height='50px' />
            </div>
        {/* https://mui.com/material-ui/react-dialog/#customization */}

        {/* Close dialog button */}
        <IconButton
            aria-label="close"
            onClick={closeDialog}
            sx={(theme) => ({
                position: 'absolute',
                right: 4,
                top: 4,
                color: theme.palette.grey[500],
            })}
        >
            <CloseIcon />
        </IconButton>
        <Divider/>
            <div>
                <Tabs variant='fullWidth' value={tabValue} centered onChange={handleTabChange} sx={{ backgroundColor: '#f3f3f3' }}>
                    <Tab className={styles.tab} value='overview' label={t('about.basicInfoTitle')} />
                    <Tab className={styles.tab} value='usage' label={t('about.usageTitle')} />
                    <Tab className={styles.tab} value='contact' label={t('about.contactTitle')} />
                </Tabs>
            </div>
        <Divider/>

        <DialogContent sx={{ backgroundColor: '#f3f3f3' }}>
            {tabValue === 'overview' &&
                <Typography variant='body1'>{t('about.basicInfo')}</Typography>
            }
            {tabValue === 'usage' &&
                <>
                    <h2>{t('about.usage.formHeader')}</h2>
                    <p>{t('about.usage.formText')}</p>
                    <ul>
                        <li><strong>{t('about.usage.form.startEnd')}</strong> - {t('about.usage.form.startEndText')}</li>
                        <br/>
                        <li><strong>{t('about.usage.form.dateTime')}</strong> - {t('about.usage.form.dateTimeText')}</li>
                    </ul>
                    <p>{t('about.usage.formText2')}</p>
                    <Divider/>
                    <h2>{t('about.usage.preferencesHeader')}</h2>
                    <p>{t('about.usage.preferencesText')}</p>
                    <ul>
                        <li><strong>{t('about.usage.preferences.transferPointSelection')}</strong> - {t('about.usage.preferences.transferPointSelectionText')}</li>
                        <br/>
                        <li><strong>{t('preferences.pickup')}</strong> - {t('about.usage.preferences.pickupText')}</li>
                        <br/>
                        <li><strong>{t('preferences.transport')}</strong> - {t('about.usage.preferences.meansOfTransportText')}</li>
                        <br/>
                        <li><strong>{t('preferences.onlyPublicTransport')}</strong> - {t('about.usage.preferences.onlyPublicTransportText')}</li>
                        <br/>
                        <li><strong>{t('preferences.findBestTrip')}</strong> - {t('about.usage.preferences.findBestText')}</li>
                        <br/>
                        <li><strong>{t('preferences.comingBack')}</strong> - {t('about.usage.preferences.comingBackText')}</li>
                    </ul>
                    <Divider/>
                    <h2>{t('about.usage.transferStopsHeader')}</h2>
                    <p>{t('about.usage.transferStopsText')}</p>
                    <Divider/>
                    <h2>{t('about.usage.tripShowHeader')}</h2>
                    <p>{t('about.usage.tripShowText')}</p>
                    <Divider/>
                    <h2>{t('about.usage.trafficDataHeader')}</h2>
                    <p>{t('about.usage.trafficDataText')}</p>

                </>
            }
            { tabValue === 'contact' &&
                <>
                    <h2>{t('about.contact.contactTitle')}</h2>
                    <p><strong>{t('about.contact.author')}:</strong> Jan Václavík (xvacla35@stud.fit.vutbr.cz)</p>
                </>
            }
        </DialogContent>
        <Divider/>
        <footer style={{  backgroundColor: '#f3f3f3' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'baseline', flexWrap: 'wrap', mt: 1 }}>
                <a href="https://data.brno.cz/"><img alt='Data.brno' style={{height: "10vh", width: '200px'}} src={dataBrnoLogo}/></a>
                <a href="https://dexter.fit.vutbr.cz/lissy/"><img alt='Lissy' style={{height: "10vh"}} src={lissyLogo}/></a>
                <a href="https://docs.opentripplanner.org/en/latest/"><img alt='OpenTripPlanner 2' style={{height: "10vh"}} src={otpLogo}/></a>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                    <a href={ isMobile ? 'https://m.waze.com' : 'https://waze.com' }><img alt='OpenTripPlanner 2' style={{height: "5vh"}} src={wazeLogo}/></a>
                    <p style={{ fontSize: '0.75rem' }} >Data provided by Waze App. Learn more at <a style={{ color: 'inherit' }} href={ isMobile ? 'https://m.waze.com' : 'https://waze.com' }>Waze.com</a></p>
                </Box>
            </Box>
        </footer>
        </Dialog>
    )
}

export default AboutApp