import { Divider } from "@mui/material";
import { useTranslation } from "react-i18next";

function AppUsage() {
    const { t } = useTranslation();

    return (
        <>
            <h2>{t("about.usage.formHeader")}</h2>
            <p>{t("about.usage.formText")}</p>
            <ul>
                <li>
                    <strong>{t("about.usage.form.startEnd")}</strong> -{" "}
                    {t("about.usage.form.startEndText")}
                </li>
                <br />
                <li>
                    <strong>{t("about.usage.form.dateTime")}</strong> -{" "}
                    {t("about.usage.form.dateTimeText")}
                </li>
            </ul>
            <p>{t("about.usage.formText2")}</p>
            <Divider />
            <h2>{t("about.usage.preferencesHeader")}</h2>
            <p>{t("about.usage.preferencesText")}</p>
            <ul>
                <li>
                    <strong>
                        {t("about.usage.preferences.transferPointSelection")}
                    </strong>{" "}
                    - {t("about.usage.preferences.transferPointSelectionText")}
                </li>
                <br />
                <li>
                    <strong>{t("preferences.pickup")}</strong> -{" "}
                    {t("about.usage.preferences.pickupText")}
                </li>
                <br />
                <li>
                    <strong>{t("preferences.transport")}</strong> -{" "}
                    {t("about.usage.preferences.meansOfTransportText")}
                </li>
                <br />
                <li>
                    <strong>{t("preferences.onlyPublicTransport")}</strong> -{" "}
                    {t("about.usage.preferences.onlyPublicTransportText")}
                </li>
                <br />
                <li>
                    <strong>{t("preferences.findBestTrip")}</strong> -{" "}
                    {t("about.usage.preferences.findBestText")}
                </li>
                <br />
                <li>
                    <strong>{t("preferences.comingBack")}</strong> -{" "}
                    {t("about.usage.preferences.comingBackText")}
                </li>
            </ul>
            <Divider />
            <h2>{t("about.usage.transferStopsHeader")}</h2>
            <p>{t("about.usage.transferStopsText")}</p>
            <Divider />
            <h2>{t("about.usage.tripShowHeader")}</h2>
            <p>{t("about.usage.tripShowText")}</p>
            <Divider />
            <h2>{t("about.usage.trafficDataHeader")}</h2>
            <p>{t("about.usage.trafficDataText")}</p>
        </>
    );
}

export default AppUsage;
