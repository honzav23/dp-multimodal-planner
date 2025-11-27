/**
 * @file AboutApp.tsx
 * @brief Component for showing basic information about the app and the tutorial for using it
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import {
    DialogTitle,
    Divider,
    IconButton,
    Dialog,
    Tabs,
    Tab,
    DialogContent,
} from "@mui/material";
import { type SyntheticEvent, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CarPubLogo from "../../img/CarPub_logo.png";
import { useTranslation } from "react-i18next";
import styles from "../../css/styles.module.css";
import type { AboutAppTabValue } from "../../types/AboutAppTabValue.ts";
import useIsMobile from "../../hooks/useIsMobile.ts";
import AppOverview from "./AppOverview.tsx";
import AppUsage from "./AppUsage.tsx";
import Contact from "./Contact.tsx";
import Footer from "./Footer.tsx";

interface AboutAppProps {
    dialogOpen: boolean;
    closeDialog: () => void;
}

function AboutApp({ dialogOpen, closeDialog }: AboutAppProps) {
    const { t } = useTranslation();

    const [tabValue, setTabValue] = useState<AboutAppTabValue>("overview");
    const isMobile = useIsMobile();

    const handleTabChange = (e: SyntheticEvent, val: AboutAppTabValue) => {
        setTabValue(val);
    };

    return (
        <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="lg">
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f3f3f3",
                    flexWrap: "wrap",
                }}
            >
                <DialogTitle
                    sx={{
                        wordBreak: "break-word",
                        maxWidth: "100%",
                        textAlign: "center",
                    }}
                    variant="h4"
                >
                    {t("about.title")}
                </DialogTitle>
                <img
                    alt="CarPub logo"
                    src={CarPubLogo}
                    width="50px"
                    height="50px"
                    style={{ marginBottom: isMobile ? "8px" : "0" }}
                />
            </div>
            {/* https://mui.com/material-ui/react-dialog/#customization */}

            {/* Close dialog button */}
            <IconButton
                aria-label="close"
                onClick={closeDialog}
                sx={(theme) => ({
                    position: "absolute",
                    right: 4,
                    top: 4,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>
            <Divider />
            <div>
                <Tabs
                    variant="fullWidth"
                    value={tabValue}
                    centered
                    onChange={handleTabChange}
                    sx={{ backgroundColor: "#f3f3f3" }}
                >
                    <Tab
                        className={styles.tab}
                        value="overview"
                        label={t("about.basicInfoTitle")}
                    />
                    <Tab
                        className={styles.tab}
                        value="usage"
                        label={t("about.usageTitle")}
                    />
                    <Tab
                        className={styles.tab}
                        value="contact"
                        label={t("about.contactTitle")}
                    />
                </Tabs>
            </div>
            <Divider />

            <DialogContent sx={{ backgroundColor: "#f3f3f3" }}>
                {tabValue === "overview" && <AppOverview />}
                {tabValue === "usage" && <AppUsage />}
                {tabValue === "contact" && <Contact />}
            </DialogContent>
            <Divider />
            <Footer />
        </Dialog>
    );
}

export default AboutApp;
