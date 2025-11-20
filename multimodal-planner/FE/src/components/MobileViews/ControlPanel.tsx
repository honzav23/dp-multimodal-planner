import { ArrowBack, ZoomOutMap, Minimize } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";

interface ControlPanelProps {
    drawerMaxHeight: string;
    minimizeHeight: string;
    minimizeButtonClicked: () => void;
    maximizeButtonClicked: () => void;
    backButtonClicked: () => void;
}

function ControlPanel({
    drawerMaxHeight,
    minimizeHeight,
    minimizeButtonClicked,
    maximizeButtonClicked,
    backButtonClicked,
}: ControlPanelProps) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
            }}
        >
            <IconButton color="primary" edge="end" onClick={backButtonClicked}>
                <ArrowBack />
            </IconButton>
            {drawerMaxHeight === minimizeHeight ? (
                <IconButton
                    onClick={maximizeButtonClicked}
                    color="primary"
                    edge="start"
                >
                    <ZoomOutMap />
                </IconButton>
            ) : (
                <IconButton
                    onClick={minimizeButtonClicked}
                    color="primary"
                    edge="start"
                >
                    <Minimize />
                </IconButton>
            )}
        </Box>
    );
}

export default ControlPanel;
