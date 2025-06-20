/**
 * @file ActionFeedback.tsx
 * @brief Component for showing that something went wrong during trip calculation
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { Snackbar, Alert } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { closeSnackbar } from "../store/slices/snackbarSlice.ts";

import { useTranslation } from "react-i18next";
import useIsMobile from "../hooks/useIsMobile";

function ActionFeedback() {
    const dispatch = useAppDispatch();
    const { snackbarOpen, message, type } = useAppSelector((state) => state.snackbar);

    const isMobile = useIsMobile()

    const { t } = useTranslation();

    return (
        // Adopted from https://mui.com/material-ui/react-snackbar/#use-with-alerts
        <Snackbar open={snackbarOpen} anchorOrigin={{horizontal: 'right', vertical: isMobile ? 'top' : 'bottom'}} autoHideDuration={6000}
                  onClose={() => dispatch(closeSnackbar())}>
            <Alert
                onClose={() => dispatch(closeSnackbar())}
                severity={type}
                variant="filled"
                sx={{width: '100%'}}
            >
                {t(`feedback.${message}`)}
            </Alert>
        </Snackbar>
    )
}

export default ActionFeedback;