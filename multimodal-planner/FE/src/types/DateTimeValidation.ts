import {DateValidationError, TimeValidationError} from "@mui/x-date-pickers";
import {ResultStatus} from "../../../types/ResultStatus.ts";
import {Dispatch, SetStateAction} from "react";
import {Dayjs} from "dayjs";

export type DateTimeValidation<TError extends TimeValidationError | DateValidationError> = [
    ResultStatus,
    Dispatch<SetStateAction<ResultStatus>>,
    (error: TError, date: Dayjs | null) => void
]