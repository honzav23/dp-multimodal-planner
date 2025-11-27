import { Box } from "@mui/material";
import useIsMobile from "../../hooks/useIsMobile.ts";
import dataBrnoLogo from "../../img/dataBrnoLogo.svg";
import lissyLogo from "../../img/lissyLogo.svg";
import otpLogo from "../../img/otpLogo.svg";
import wazeLogo from "../../img/wazeLogo.svg";

function Footer() {
    const isMobile = useIsMobile();

    return (
        <footer
            style={{
                backgroundColor: "#f3f3f3",
                overflow: "scroll",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    alignItems: "baseline",
                    flexWrap: "wrap",
                    mt: 1,
                    height: "100%",
                }}
            >
                <a href="https://data.brno.cz/">
                    <img
                        alt="Data.brno"
                        style={{
                            height: "10vh",
                            width: "100%",
                            maxWidth: "200px",
                        }}
                        src={dataBrnoLogo}
                    />
                </a>
                <a href="https://dexter.fit.vutbr.cz/lissy/">
                    <img
                        alt="Lissy"
                        style={{
                            height: "10vh",
                            width: "100%",
                            maxWidth: "200px",
                        }}
                        src={lissyLogo}
                    />
                </a>
                <a href="https://docs.opentripplanner.org/en/latest/">
                    <img
                        alt="OpenTripPlanner 2"
                        style={{
                            maxHeight: "75px",
                            width: "100%",
                            height: "100%",
                            maxWidth: "75px",
                        }}
                        src={otpLogo}
                    />
                </a>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "space-between",
                        alignSelf: "center",
                    }}
                >
                    <a
                        href={
                            isMobile ? "https://m.waze.com" : "https://waze.com"
                        }
                    >
                        <img
                            alt="Waze"
                            style={{ height: "5vh" }}
                            src={wazeLogo}
                        />
                    </a>
                    <p style={{ fontSize: "0.75rem", textAlign: "center" }}>
                        Data provided by Waze App. Learn more at{" "}
                        <a
                            style={{ color: "inherit" }}
                            href={
                                isMobile
                                    ? "https://m.waze.com"
                                    : "https://waze.com"
                            }
                        >
                            Waze.com
                        </a>
                    </p>
                </Box>
            </Box>
        </footer>
    );
}

export default Footer;
