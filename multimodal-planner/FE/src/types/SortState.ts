// Defines the sort state, either ascending or descending or none
export type SortState = 'asc' | 'desc' | 'none';

export type SortInfo = {
    sortState: SortState
    forcedState: 'none' | null
    selected: boolean
}