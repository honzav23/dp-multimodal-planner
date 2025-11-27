import { Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

function AppOverview() {
    const { t } = useTranslation();

    return (
        <>
            <Typography variant="body1">{t("about.basicInfo")}</Typography>
            <br />
            <br />
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {t("about.warning")}
            </Typography>
        </>
    );
}

export default AppOverview;
