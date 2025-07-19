/**
 * @file ParkingLotInfo.tsx
 * @brief Component that shows all the information about a certain parking lot
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */
import type {Fee, ParkingLot, MaxStay, OpeningHours, DayTimeRange} from "../../../types/ParkingLot.ts";
import {Box} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface ParkingLotInfoProps {
    parkingLot: ParkingLot
}

function ParkingLotInfo({ parkingLot }: ParkingLotInfoProps) {
    const { t } = useTranslation();
    const parkingLotTableKeys = Object.keys(parkingLot).filter(key => key !== 'polygon' && key !== 'name');
    const parkingLotTagsDefined = Object.keys(parkingLot).length > 1;

    // Format the validity interval string to unified format
    // for example Mo-Fr 10:00-18:00
    const formatValidityIntervalString = (condition: DayTimeRange): string => {
        const dayFrom = condition.dayFrom ? t(`parkingLots.days.${condition.dayFrom}`) : '';
        const dayTo = condition.dayTo ? '-' + t(`parkingLots.days.${condition.dayTo}`) : '';
        const time = condition.timeRange ?? ''
        return `${dayFrom}${dayTo} ${time}`;
    }

    const transformFeeConditional = (fee: Fee, condProp: 'conditions' | 'exceptions'): string[] => {
        return fee[condProp].map(cond => {
            if ("dayFrom" in cond) {
                return formatValidityIntervalString(cond);
            }
            else {
                const operator = t(`parkingLots.${cond.operator}`);
                return `${t('parkingLots.stay')} ${operator} ${cond.amountOfTime} ${t(`parkingLots.timeUnits.${cond.unit}`)}`;
            }
        })
    }

    /* Format the fee output based on the conditions
     * If the fee is not conditional, just return 'yes' or 'no'
     * If the fee is conditional, return a formatted string with conditions
    */
    const formatFeeOutput = (fee: Fee): string | ReactNode => {
        const conditionTranslation = transformFeeConditional(fee, 'conditions');
        const exceptionTranslation = transformFeeConditional(fee, 'exceptions');
    
        if (!fee.feeConditional) {
            if (fee.value === "yes" || fee.value === "no") {
                return t(`parkingLots.${fee.value}`)
            }    
            return fee.value
        }
        else {
            const strongText = fee.value === 'yes' ? t('parkingLots.yes') : fee.value === 'no' ? t('parkingLots.no') : '';
            const strongElement = <strong>{strongText}</strong>;
            const conditionsText = conditionTranslation.join(', ');
            const exceptionsText = exceptionTranslation.length > 0 ? `${t('parkingLots.except')}: ${exceptionTranslation.join(', ')}` : '';

            const textWithoutMultipleSpaces = `${conditionsText} ${exceptionsText}`.replace(/\s+/g, ' ');
            return <p>{strongElement} {textWithoutMultipleSpaces}</p>
        }
    }

    const formatMaxStayOutput = (maxStay: MaxStay): string => {
        if (!maxStay.maxStayConditional) {
            return `${maxStay.amountOfTime} ${t(`parkingLots.timeUnits.${maxStay.unit}`)}`;
        }
        const conditions = maxStay.conditions.map(cond => {
            const timeValue = cond.amountOfTime
            const unit = t(`parkingLots.timeUnits.${cond.unit}`);
            return `${timeValue} ${unit} ${formatValidityIntervalString(cond.validityRange)}`;
        });
        return `${conditions.join('; ')}`;
    }

    const formatOpeningHours = (openingHours: OpeningHours): string => {
        if (openingHours.isInterval) {
            const conditions = openingHours.openingHours.map(cond => {
                return formatValidityIntervalString(cond);
            });
            return `${conditions.join('; ')}`;
        }
        return openingHours.openingHours as string
    }

    const formatOutputBasedOnKey = (key: keyof ParkingLot, value: any): string | ReactNode => {

        switch (key) {
            case 'capacity':
            case 'charge':
                return value;
            case 'capacityDisabled':
                if (typeof value === 'boolean') {
                    return value ? t('parkingLots.yes') : t('parkingLots.no');
                }
                return value

            case 'maxStay':
                return formatMaxStayOutput(value as MaxStay);
            case 'fee':
                return formatFeeOutput(value as Fee);
            case 'parkRide':
                return value ? t('parkingLots.yes') : t('parkingLots.no');
            case 'openingHours':
                return formatOpeningHours(value);

            case 'website':
                return <a href={value}>{value}</a>
            default:
                return value;
        }
    }
    
    const getTitle = (): string => {
        if (parkingLotTagsDefined) {
            return parkingLot.name || ''
        }
        return t('parkingLots.noParkingLotInfo')
    }

    return (
        <Box sx={{ padding: '0 10px' }}>
            <h2 style={{ textAlign: 'center' }}>{getTitle()}</h2>

            { parkingLotTagsDefined &&
                <table
                    style={{
                        borderCollapse: "collapse",
                        borderTop: "1px solid #ddd",
                        margin: "20px auto",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                >
                    <tbody>
                        {parkingLotTableKeys.map((key, i) => {
                            const typedKey = key as keyof ParkingLot
                            return (
                                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff'}}>
                                    <th style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{t(`parkingLots.${key}`)}:</th>
                                    <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{ formatOutputBasedOnKey(typedKey, parkingLot[typedKey]) }</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            }
        </Box>
    )
}

export default ParkingLotInfo;