import geopandas as gpd
from shapely import to_geojson

# Chrlice, nádraží;Brno-Horní Heršpice;Brno-Starý Lískovec

train_stations = ["Židenice, nádraží", "Hlavní nádraží", "Lesná, nádraží", "Královo Pole, nádraží",
                      "Řečkovice, nádraží", "Slatina, nádraží", "Brno-Černovice"]

def get_transfer_evaluation(stop, parking_houses, parking_lots):
    '''
    :param stop:
    :param parking_houses: All parking houses
    :param parking_lots: All parking lots
    :param city_boundary: City boundary of Brno
    :return: Return parking places (houses, lots) that are the closest to the stop
    '''
    places_to_park = []
    threshold_distance = 500  # meters
    distance_from_border = 2000

    for _, house in parking_houses.iterrows():
        if house['geometry'].distance(stop["geometry"]) < threshold_distance:
            places_to_park.append({"type": "park_and_ride", "parking": house})

    # if city_boundary["geometry"].exterior.distance(stop["geometry"]) > distance_from_border and \
    #     stop["stop_name"] not in train_stations:
    #     return places_to_park

    for _, parking_lot in parking_lots.iterrows():
        if parking_lot["geometry"].distance(stop["geometry"]) < threshold_distance:
            places_to_park.append({"type": "parking_lot", "parking": parking_lot})

    return places_to_park


def main():
    stops = gpd.read_file("stops_filtered.geojson")
    parking_houses = gpd.read_file("parkovaciDomyObsazenost.geojson")
    parking_lots = gpd.read_file("parkingLotsPublic.geojson")


    stops_3857 = stops.to_crs(epsg=3857)
    parking_houses_3857 = parking_houses.to_crs(epsg=3857)
    parking_lots_3857 = parking_lots.to_crs(epsg=3857)

    stops['transfer_parking'] = stops_3857.apply(lambda row: get_transfer_evaluation(row, parking_houses_3857, parking_lots_3857), axis=1)
    stops["is_transfer"] = stops.apply(lambda row: len(row["transfer_parking"]) > 0, axis=1)

    export_gdf = stops[stops["is_transfer"]]
    export_gdf.to_file("transferStops.geojson", driver="GeoJSON")


if __name__ == "__main__":
    main()
