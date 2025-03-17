import requests
import subprocess
import sqlite3
import pandas as pd
import overpy

processed = 0

def get_GTFS_files():
    response = requests.get("https://www.arcgis.com/sharing/rest/content/items/379d2e9a7907460c8ca7fda1f3e84328/data")
    file_path = "../../../GTFS.zip"
    if response.status_code == 200:
        with open(file_path, "wb") as f:
            f.write(response.content)

def fetch_possible_transfer_stops():
    con = sqlite3.connect('../../../gtfs.db')
    df = pd.read_sql_query("""
       SELECT s.stop_name, s.stop_lat, s.stop_lon, s.stop_id
       FROM stops s
       JOIN stop_times st ON s.stop_id = st.stop_id
       JOIN trips t ON st.trip_id = t.trip_id
       JOIN routes r ON t.route_id = r.route_id
       WHERE r.route_type = 2 OR s.stop_name LIKE '%nádr.%' OR s.stop_name LIKE '%nádraží%' OR s.stop_name LIKE '%aut. st.%' OR s.stop_name LIKE '%aut.st.%'
       GROUP BY s.stop_name ORDER BY s.stop_name ASC
   """, con)

    df.to_csv('../transferStops/transferPoints.csv', index=False, sep=';')

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

#     print("Getting GTFS...", end='')
#     get_GTFS_files()
#     print("Done")
#
#     print("Converting GTFS to DB...", end='')
#     subprocess.run(["../../../../gtfsdb/bin/gtfsdb-load", "--database_url", "sqlite:///../../../gtfs.db", "../../../GTFS.zip"])
#     print("Done")
    print("Fetching possible transfer stops... ", end='')
    fetch_possible_transfer_stops()
    print("Done")

    print("Getting available parking lots for transfer stops... ")
    get_available_parking_lots()
    print("Done")



