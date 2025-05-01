/**
 * @file theme.ts
 * @brief Custom theme for React MUI with the definition of font and colors
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

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