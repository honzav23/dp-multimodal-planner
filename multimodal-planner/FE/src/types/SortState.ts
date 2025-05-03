/**
 * @file SortState.ts
 * @brief Defines the sort state, either ascending or descending or none
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

export type SortState = 'asc' | 'desc' | 'none';

export type SortInfo = {
    sortState: SortState
    forcedState: 'none' | null
    selected: boolean
}