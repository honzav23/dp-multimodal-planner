/**
 * @file SortIcon.tsx
 * @brief Component that can be used to make sorting button with arrow indicating whether the content
 * is sorted in ascending or descending order
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { type ReactNode, useState, useEffect } from "react";
import {Box, IconButton, Tooltip} from "@mui/material";
import {KeyboardArrowDown, KeyboardArrowUp} from "@mui/icons-material";
import type {SortInfo, SortState} from "../types/SortState";
import { useTranslation } from "react-i18next";

interface SortIconProps {
    mainIcon: ReactNode
    sortStateChanged: (sortState: SortState) => void;
    sortInfo: SortInfo
}

function SortIcon({ mainIcon, sortStateChanged, sortInfo }: SortIconProps) {

    const [sortState, setSortState] = useState<SortState>('none');

    const { t } = useTranslation();

    useEffect(() => {
        if (sortInfo.forcedState === 'none') {
            setSortState('none');
        }
    }, [sortInfo]);

    /**
     * Changes the sort state depending on the previous states,
     * the change goes as follows: none -> asc -> desc -> none
     */
    const changeSortState = () => {
        let currentSortState: SortState = 'none';
        if (sortState === 'none') {
            setSortState('asc');
            currentSortState = 'asc';
        }
        else if (sortState === "asc") {
            setSortState('desc');
            currentSortState = 'desc';
        }
        else {
            setSortState('none');
        }
        sortStateChanged(currentSortState);
    }

    /**
     * Gets the tooltip title based on the current sort state
     */
    const getTooltipTitle = (): string => {
        if (sortState === 'none') {
            return t('sort.asc')
        }
        else if (sortState === 'asc') {
            return t('sort.desc')
        }
        else if (sortState === 'desc') {
            return t('sort.default')
        }
        return ''
    }

    return (
        <Box position="relative" display="inline-block">

            {/* Main Icon Button */}
            <Tooltip title={getTooltipTitle()} placement='bottom' >
                <IconButton sx={{color: sortInfo.selected ? 'black' : 'primary', fontSize: "large" }} onClick={changeSortState}>
                    { mainIcon }
                </IconButton>
            </Tooltip>

            <Box
                position="absolute"
                bottom={0}
                right={0}
                borderRadius="50%"
                display="flex"
                alignItems='end'
                justifyContent="center"
            >
                { sortState == 'desc' &&  <KeyboardArrowDown sx={{width: '20px', height: '20px', color: sortInfo.selected ? 'black' : 'rgba(0, 0, 0, 0.54)'}}/>}
                { sortState == 'asc' &&  <KeyboardArrowUp sx={{ width: '20px', height: '20px', color: sortInfo.selected ? 'black' : 'rgba(0, 0, 0, 0.54)' }}/> }
            </Box>
        </Box>
    )
}

export default SortIcon;