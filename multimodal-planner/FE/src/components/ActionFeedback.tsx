/**
 * @file ActionFeedback.tsx
 * @brief Component for showing that something went wrong during trip calculation
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 * @date
 */

import { Snackbar, Alert } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { closeSnackbar } from "../store/slices/tripSlice";
import { isMobile } from "react-device-detect";

import { useTranslation } from "react-i18next";

function ActionFeedback() {
    const dispatch = useAppDispatch();
    const snackbarOpen = useAppSelector((state) => state.trip.openSnackbar);
    const message = useAppSelector((state) => state.trip.snackbarMessage);

    const { t } = useTranslation();

    return (
        // Adopted from https://mui.com/material-ui/react-snackbar/#use-with-alerts
        <Snackbar open={snackbarOpen} anchorOrigin={{horizontal: 'right', vertical: isMobile ? 'top' : 'bottom'}} autoHideDuration={6000}
                  onClose={() => dispatch(closeSnackbar())}>
            <Alert
                onClose={() => dispatch(closeSnackbar())}
                severity="error"
                variant="filled"
                sx={{width: '100%'}}
            >
                {t(`feedback.${message}`)}
            </Alert>
        </Snackbar>
    )
}

export default ActionFeedback;