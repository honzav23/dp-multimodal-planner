import requests
import subprocess
import sqlite3
import pandas as pd
import overpy
import zipfile

processed = 0

def get_GTFS_files():
    response = requests.get("https://www.arcgis.com/sharing/rest/content/items/379d2e9a7907460c8ca7fda1f3e84328/data")
    file_path = "../../../GTFS.zip"
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)

def fetch_possible_transfer_stops():
    extracted_gtfs_dir = "../../../GTFS"
    with zipfile.ZipFile("../../../GTFS.zip", 'r') as zip_ref:
        zip_ref.extractall(extracted_gtfs_dir)

    stops_df = pd.read_csv(f'{extracted_gtfs_dir}/stops.txt', sep=',', encoding='utf-8')
    stop_times_df = pd.read_csv(f'{extracted_gtfs_dir}/stop_times.txt', sep=',', encoding='utf-8')
    trips_df = pd.read_csv(f'{extracted_gtfs_dir}/trips.txt', sep=',')
    routes_df = pd.read_csv(f'{extracted_gtfs_dir}/routes.txt', sep=',')

    merged_df = stops_df.merge(stop_times_df, on='stop_id') \
        .merge(trips_df, on='trip_id') \
        .merge(routes_df, on='route_id')

    filtered_df = merged_df[
        (merged_df['route_type'] == 2) |
        (merged_df['stop_name'].str.contains('nádr\\.', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('nádraží', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('aut\\. st\\.', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('aut\\.st', case=False, na=False))
        ]

    # Step 3: Select required columns
    result_df = filtered_df[['stop_name', 'stop_lat', 'stop_lon', 'stop_id']]
    result_df = result_df.drop_duplicates(subset='stop_name').sort_values(by='stop_name')

    result_df.to_csv('../transferStops/transferPoints.csv', index=False, sep=';')

def findNearestParkingLot(row, length):
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
    global processed
    processed += 1
    print(f"{processed}/{length} complete")

    return "1" if len(result.ways) > 0 else "0"

def get_available_parking_lots():
    transferPoints = pd.read_csv('../transferStops/transferPoints.csv', delimiter=';', encoding='utf-8')
    transferPointsLen = len(transferPoints)
    transferPoints["has_parking"] = transferPoints.apply(lambda row: findNearestParkingLot(row, transferPointsLen), axis=1)
    transferPoints.to_csv('../transferStops//transferPointsWithParkingLots.csv', sep=';', encoding='utf-8', index=False)

if __name__ == "__main__":

    print("Getting GTFS...", end='')
    get_GTFS_files()
    print("Done")

    # print("Converting GTFS to DB...", end='')
    # subprocess.run(["../../../../gtfsdb/bin/gtfsdb-load", "--database_url", "sqlite:///../../../gtfsPID.db", "../../../PID_GTFS.zip"])
    # print("Done")
    print("Fetching possible transfer stops... ", end='')
    fetch_possible_transfer_stops()
    print("Done")

    print("Getting available parking lots for transfer stops... ")
    get_available_parking_lots()
    print("Done")



