import { useState } from 'react'
import type { ResultStatus } from "../../../types/ResultStatus.ts";
import { useTranslation } from 'react-i18next'
import { TimeValidationError } from "@mui/x-date-pickers";
import { Dayjs } from "dayjs";
import type { DateTimeValidation } from "../types/DateTimeValidation.ts";

function useTimeError(): DateTimeValidation<TimeValidationError>  {
    const [timeError, setTimeError] = useState<ResultStatus>({error: false, message: ''})
    const { t } = useTranslation()

    const handleTimeError = (error: TimeValidationError, time: Dayjs | null) => {
        if (error === null && time !== null) {
            setTimeError({error: false, message: ''})
        }
        else {
            setTimeError({error: true, message: t('form.validation.invalidTime')})
        }
    }

    return [timeError, setTimeError, handleTimeError]
}

export default useTimeError