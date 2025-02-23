import overpy
import pandas as pd
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(script_dir, "..", "transferStops")
file_path = os.path.normpath(file_path)


def findNearestParkingLot(row):
    api = overpy.Overpass()
    result = api.query(f"""[out:json][timeout:25];
            node(around:500, {row['stop_lat']}, {row['stop_lon']});
            (
            node["amenity"="parking"]["access" = "yes"](around:500, {row['stop_lat']}, {row['stop_lon']});
            way["amenity"="parking"]["access" = "yes"](around:500, {row['stop_lat']}, {row['stop_lon']});
            );
            out body;
            >;
            out skel qt;
        """)
    print("zde")
    if (len(result.ways) > 0):
        return 1
    return 0

def main():

    transferPoints = pd.read_csv(f'{file_path}/transferPoints.csv', delimiter=';', encoding='utf-8')
    transferPoints['stop_lat'] = transferPoints['stop_lat'].str.replace(',', '.').astype(float)
    transferPoints['stop_lon'] = transferPoints['stop_lon'].str.replace(',', '.').astype(float)
    transferPoints["has_parking"] = transferPoints.apply(findNearestParkingLot, axis=1)
    transferPoints.to_csv(f'{file_path}/transferPointsWithParkingLots.csv', sep=';', encoding='utf-8', index=False)



if __name__ == "__main__":
    main()
