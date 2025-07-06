/**
 * @file ParkingLotInfo.tsx
 * @brief Component that shows all the information about a certain parking lot
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */
import {Fee, ParkingLot, ParkingLotKeys, MaxStay} from "../../../types/ParkingLot.ts";
import {Box} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";

interface ParkingLotInfoProps {
    parkingLot: ParkingLot
}

function ParkingLotInfo({ parkingLot }: ParkingLotInfoProps) {
    const { t } = useTranslation();
    const parkingLotTableKeys = Object.keys(parkingLot).filter(key => key !== 'polygon' && key !== 'name');

    const transformFeeConditional = (fee: Fee, condProp: 'conditions' | 'exceptions'): string[] => {
        return fee[condProp].map(cond => {
            if ("dayFrom" in cond) {
                const dayFrom = cond.dayFrom ? t(`parkingLots.days.${cond.dayFrom}`) : '';
                const dayTo = cond.dayTo ? '-' + t(`parkingLots.days.${cond.dayTo}`) : '';
                const timeFrom = cond.timeFrom ? cond.timeFrom : '';
                const timeTo = cond.timeTo ? cond.timeTo : '';
                return `${dayFrom}${dayTo} ${timeFrom}-${timeTo}`;
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
            const dayFrom = t(`parkingLots.days.${cond.validityRange.dayFrom}`);
            const dayTo = cond.validityRange.dayTo ? '-' + t(`parkingLots.days.${cond.validityRange.dayTo}`) : '';
            const timeFrom = cond.validityRange.timeFrom ? cond.validityRange.timeFrom : '';
            const timeTo = cond.validityRange.timeTo ? cond.validityRange.timeTo : '';
            return `${timeValue} ${unit} ${dayFrom}${dayTo} ${timeFrom}-${timeTo}`;
        });
        return `${conditions.join(', ')}`;
    }

    const formatOutputBasedOnKey = (key: ParkingLotKeys, value: any): string | ReactNode => {

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
                if (typeof value === 'string') {
                    return value; // Assuming it's a string representation of opening hours
                }
                else {
                    // TODO
                }
            default:
                return value;
        }
    }
    return (
        <Box sx={{ padding: '0 10px' }}>
            <h2 style={{ textAlign: 'center' }}>{parkingLot.name || '' }</h2>
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
                        return (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#f9f9f9' : '#ffffff'}}>
                                <th style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{t(`parkingLots.${key}`)}:</th>
                                <td style={{ padding: "12px 15px", border: "1px solid #ddd" }}>{ formatOutputBasedOnKey(key as ParkingLotKeys, parkingLot[key as ParkingLotKeys]) }</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Box>
    )
}

export default ParkingLotInfo;