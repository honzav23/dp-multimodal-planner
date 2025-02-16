import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        primary: {
            main: "#2d2d2d",
            contrastText: "#ffffff"
        },
        secondary: {
            main: "#CB8427",
        }
    },
    typography: {
        fontFamily: "Inter"
    }
})