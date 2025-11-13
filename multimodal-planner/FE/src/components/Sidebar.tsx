import { Box, IconButton, MenuItem, Select, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { SelectChangeEvent } from "@mui/material/Select/Select";
import AboutApp from "../components/AboutApp";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { availableLanguages } from "../../i18n";
import useIsMobile from "../hooks/useIsMobile";

function Sidebar() {
    const isMobile = useIsMobile();
    const { t, i18n } = useTranslation();
    const [aboutAppDialogOpen, setAboutAppDialogOpen] = useState(false);

    /**
     * Returns correct language value for language selector
     * @param langValue Language value from i18next
     * @returns Correct language value
     */
    const getLanguageValue = (langValue: string) => {
        if (langValue === "cs" || langValue === "cs-CZ") {
            return "cs";
        }
        return "en";
    };

    /**
     * Change the language of the application based on lang parameter
     * @param e Event containing the selected language value
     */
    const changeLanguage = async (e: SelectChangeEvent) => {
        await i18n.changeLanguage(e.target.value);
    };

    return (
        <>
            <Box
                sx={{
                    position: "absolute",
                    right: "1%",
                    mt: 2,
                    display: "flex",
                    height: isMobile ? "auto" : "95%",
                    gap: isMobile ? "10px" : 0,
                    flexDirection: isMobile ? "row" : "column",
                    justifyContent: "space-between",
                    zIndex: 1000,
                }}
            >
                <Select
                    size="small"
                    sx={{
                        border: "1px solid black",
                        fontSize: "1.5rem",
                        backgroundColor: "#f3f3f3",
                    }}
                    value={getLanguageValue(i18n.language)}
                    onChange={changeLanguage}
                >
                    {availableLanguages.map((lang) => (
                        <MenuItem key={lang} value={lang}>
                            {t(`language.${lang}`)}
                        </MenuItem>
                    ))}
                </Select>
                <Box
                    sx={{
                        backgroundColor: "white",
                        borderRadius: "10px 10px 10px 10px",
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Tooltip title={t("about.title")}>
                        <IconButton
                            size="large"
                            color="primary"
                            onClick={() => setAboutAppDialogOpen(true)}
                        >
                            <InfoOutlinedIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <AboutApp
                dialogOpen={aboutAppDialogOpen}
                closeDialog={() => setAboutAppDialogOpen(false)}
            />
        </>
    );
}

export default Sidebar;
