/**
 * @file AboutApp.tsx
 * @brief Component for showing basic information about the app and the tutorial for using it
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import {DialogTitle, Divider, IconButton, Dialog, Tabs, Tab, DialogContent, Typography} from "@mui/material";
import {type SyntheticEvent, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CarPubLogo from '../img/CarPub_logo.png'
import { useTranslation } from 'react-i18next'
import '../css/tabStyle.css'
import type { AboutAppTabValue } from "../types/AboutAppTabValue.ts";


interface AboutAppProps {
    dialogOpen: boolean;
    closeDialog: () => void;
}

function AboutApp({ dialogOpen, closeDialog }: AboutAppProps) {
    const { t } = useTranslation();

    const [tabValue, setTabValue] = useState<AboutAppTabValue>('overview');

    const handleTabChange = (e: SyntheticEvent, val: AboutAppTabValue) => {
        setTabValue(val);
    }

    return (
        <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth='lg'>
            <div style={{ display: "flex", justifyContent: 'center', alignItems: "center", backgroundColor: "#f3f3f3" }}>
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
                right: 8,
                top: 8,
                color: theme.palette.grey[500],
            })}
        >
            <CloseIcon />
        </IconButton>
        <Divider/>
        <Tabs variant='fullWidth' value={tabValue} centered onChange={handleTabChange} sx={{ backgroundColor: '#f3f3f3' }}>
            <Tab className='tab' value='overview' label={t('about.basicInfoTitle')} />
            <Tab className='tab' value='usage' label={t('about.usageTitle')} />
            <Tab className='tab' value='contact' label={t('about.contactTitle')} />
        </Tabs>
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
                        <li><strong>{t('about.usage.preferences.pickup')}</strong> - {t('about.usage.preferences.pickupText')}</li>
                        <br/>
                        <li><strong>{t('about.usage.preferences.meansOfTransport')}</strong> - {t('about.usage.preferences.meansOfTransportText')}</li>
                        <br/>
                        <li><strong>{t('about.usage.preferences.findBest')}</strong> - {t('about.usage.preferences.findBestText')}</li>
                        <br/>
                        <li><strong>{t('about.usage.preferences.comingBack')}</strong> - {t('about.usage.preferences.comingBackText')}</li>
                    </ul>
                    <Divider/>
                    <h2>{t('about.usage.transferStopsHeader')}</h2>
                    <p>{t('about.usage.transferStopsText')}</p>
                    <Divider/>
                    <h2>{t('about.usage.tripShowHeader')}</h2>
                    <p>{t('about.usage.tripShowText')}</p>

                </>
            }
            { tabValue === 'contact' &&
                <>
                    <h2>{t('about.contact.contactTitle')}</h2>
                    <p><strong>{t('about.contact.author')}</strong> Jan Václavík (xvacla35@stud.fit.vutbr.cz)</p>
                </>
            }
        </DialogContent>

        </Dialog>
    )
}

export default AboutApp