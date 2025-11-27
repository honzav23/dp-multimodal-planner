import { useTranslation } from "react-i18next";

function Contact() {
    const { t } = useTranslation();
    return (
        <>
            <h2>{t("about.contact.contactTitle")}</h2>
            <p>
                <strong>{t("about.contact.author")}:</strong> Jan Václavík (
                <a
                    style={{ textDecoration: "none", wordWrap: "break-word" }}
                    href="mailto:xvacla35@vutbr.cz"
                >
                    xvacla35@vutbr.cz
                </a>
                ,
                <a
                    style={{ textDecoration: "none", wordWrap: "break-word" }}
                    href="mailto:janvaclavik@valachnet.cz"
                >
                    janvaclavik@valachnet.cz
                </a>
                )
            </p>
        </>
    );
}

export default Contact;
