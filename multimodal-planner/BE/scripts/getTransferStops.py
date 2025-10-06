import requests
import pandas as pd
import overpy
import zipfile
import os
import logging
import sys
from datetime import datetime

script_dir = os.path.dirname(os.path.abspath(__file__))
processed = 0


def get_logger_setup():
    logger = logging.getLogger("getTransferStops.py")
    logger.setLevel(logging.INFO)

    handler = logging.StreamHandler(sys.stdout)

    LOG_FORMAT = '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    TIME_FORMAT = '%Y-%m-%d %H:%M:%S'

    formatter = logging.Formatter(fmt=LOG_FORMAT, datefmt=TIME_FORMAT)
    handler.setFormatter(formatter)

    logger.propagate = False
    logger.addHandler(handler)

    return logger


def get_GTFS_files():
    '''
    Download the GTFS files and store them on disk
    '''
    response = requests.get("https://kordis-jmk.cz/gtfs/gtfs.zip")
    if response.status_code == 200:
        with open(f'{script_dir}/GTFS.zip', "wb") as f:
            f.write(response.content)

def fetch_possible_transfer_stops():
    '''
    Extract the transfer stops from GTFS files
    :return: DataFrame containing all possible transfer stops
    '''
    gtfs_dir = f'{script_dir}/GTFS'

    with zipfile.ZipFile(f'{script_dir}/GTFS.zip', 'r') as zip_ref:
        zip_ref.extractall(gtfs_dir)
    stops_df = pd.read_csv(f'{gtfs_dir}/stops.txt', sep=',', encoding='utf-8')
    stop_times_df = pd.read_csv(f'{gtfs_dir}/stop_times.txt', sep=',', encoding='utf-8')
    trips_df = pd.read_csv(f'{gtfs_dir}/trips.txt', sep=',')
    routes_df = pd.read_csv(f'{gtfs_dir}/routes.txt', sep=',')

    merged_df = stops_df.merge(stop_times_df, on='stop_id') \
        .merge(trips_df, on='trip_id') \
        .merge(routes_df, on='route_id')

    filtered_df = merged_df[
        (merged_df['route_type'].isin([2, 100, 101, 102, 103, 105, 106, 107, 109, 400, 401])) |
        (merged_df['stop_name'].str.contains('nádr\\.', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('nádraží', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('aut\\. st\\.', case=False, na=False)) |
        (merged_df['stop_name'].str.contains('aut\\.st', case=False, na=False))
        ]

    # Step 3: Select required columns
    result_df = filtered_df[['stop_name', 'stop_lat', 'stop_lon', 'stop_id']]
    result_df = result_df.drop_duplicates(subset='stop_name').sort_values(by='stop_name')

    return result_df

def find_nearest_parking_lot(row, length, logger):
    '''
    Find the nearest parking lot for given transfer stop
    :param row: Transfer stop
    :param length: Total number of transfer stops (for printing progress)
    :return: 1 if parking lot is near the transfer stop, 0 if not
    '''
    api = overpy.Overpass(url="https://overpass-api.de/api/interpreter")
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
    logger.info(f"{processed}/{length} complete")

    return "1" if len(result.ways) > 0 else "0"

def get_available_parking_lots(transfer_stops_df, logger):
    '''
    Enrich the transfer stops with information about parking lots nearby
    and store this DataFrame to disk
    :param transfer_stops_df: Transfer stops DataFrame
    '''
    transfer_stops_len = len(transfer_stops_df)
    transfer_stops_df["has_parking"] = "0"
    try:
        for i, row in transfer_stops_df.iterrows():
            transfer_stops_df.at[i, 'has_parking'] = find_nearest_parking_lot(row, transfer_stops_len, logger)
    except:
        logger.warning("Error occurred while fetching parking lots, saving the results so far...")
    finally:
        transfer_stops_dir = os.path.join(script_dir, "..", "transferStops")
        transfer_stops_dir = os.path.normpath(transfer_stops_dir)
        if not os.path.exists(transfer_stops_dir):
            os.makedirs(transfer_stops_dir)
        transfer_stops_df.to_csv(f'{transfer_stops_dir}/transferStopsWithParkingLots.csv', sep=';', encoding='utf-8', index=False)

        # Clean the GTFS files
        os.system(f'rm {script_dir}/GTFS.zip')


def main():
    logger = get_logger_setup()
    logger.info("Getting GTFS...")
    get_GTFS_files()
    logger.info("GTFS downloaded")

    logger.info("Fetching possible transfer stops... ")
    transfer_stops_df = fetch_possible_transfer_stops()
    logger.info(f"Found {len(transfer_stops_df)} possible transfer stops")

    logger.info("Getting available parking lots for transfer stops... ")
    get_available_parking_lots(transfer_stops_df, logger)
    logger.info("Available parking lots fetched")

if __name__ == "__main__":
    main()



