import { useState } from 'react'
import type {ResultStatus} from "../../../types/ResultStatus.ts";
import {DateValidationError} from "@mui/x-date-pickers";
import {Dayjs} from "dayjs";
import type { DateTimeValidation } from "../types/DateTimeValidation";
import { useTranslation } from 'react-i18next'

function useDateError(): DateTimeValidation<DateValidationError> {
    const [dateError, setDateError] = useState<ResultStatus>({error: false, message: ''})
    const { t } = useTranslation()

    const handleDateError = (error: DateValidationError, date: Dayjs | null) => {
        if (error === null && date !== null) {
            setDateError({error: false, message: ''})
        }
        else {
            setDateError({error: true, message: t('form.validation.invalidDate')})
        }
    }

    return [dateError, setDateError, handleDateError]

}

export default useDateError