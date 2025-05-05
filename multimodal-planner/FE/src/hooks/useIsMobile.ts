/**
 * @file useIsMobile.ts
 * @brief Helper hook the view turned into mobile or not
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { useMediaQuery } from "@mui/material";

export function useIsMobile() {
    return useMediaQuery('(max-width: 768px)')
}

export default useIsMobile