import { useMediaQuery } from "@mui/material";

function useIsMobile() {
    return useMediaQuery('(max-width: 768px)')
}

export default useIsMobile