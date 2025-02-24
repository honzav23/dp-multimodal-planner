import { Snackbar, Alert } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { closeSnackbar } from "../store/slices/tripSlice";

import { useTranslation } from "react-i18next";

function ActionFeedback() {
    const dispatch = useAppDispatch();
    const snackbarOpen = useAppSelector((state) => state.trip.openSnackbar);

    const { t } = useTranslation();

    return (
        // Adopted from https://mui.com/material-ui/react-snackbar/#use-with-alerts
        <Snackbar open={snackbarOpen} anchorOrigin={{horizontal: 'right', vertical: 'bottom'}} autoHideDuration={6000}
                  onClose={() => dispatch(closeSnackbar())}>
            <Alert
                onClose={() => dispatch(closeSnackbar())}
                severity="error"
                variant="filled"
                sx={{width: '100%'}}
            >
                {t('feedback.error')}
            </Alert>
        </Snackbar>
    )
}

export default ActionFeedback;