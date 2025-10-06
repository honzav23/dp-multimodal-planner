import { configure, getConsoleSink, getLogger, getTextFormatter } from "@logtape/logtape";

await configure({
    sinks: {
        console: getConsoleSink({
            formatter: getTextFormatter({
                level: "FULL",
                timestamp: (ts) => {
                    const date = new Date(ts);
                    const year = date.getFullYear();
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const day = date.getDate().toString().padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;

                    const timeString = date.toLocaleTimeString();
                    return `${formattedDate} ${timeString}`;
                }
            })
        }),
    },
    loggers: [
        {
            category: ["CarPub"],
            lowestLevel: "info",
            sinks: ["console"]
        },
        {
            category: ["CarPub", "KordisWebsocket"],
            lowestLevel: "info",
            sinks: ["console"]
        },
        {
            category: ["CarPub", "WazeManager"],
            lowestLevel: "info",
            sinks: ["console"]
        },
        {
            category: ["logtape", "meta"],
            lowestLevel: "warning",
            sinks: ["console"]
        }
    ],
});

export const appLogger = getLogger(["CarPub"]);
export const wazeLogger = getLogger(["CarPub", "WazeManager"]);
export const kordisLogger = getLogger(["CarPub", "KordisWebsocket"]);