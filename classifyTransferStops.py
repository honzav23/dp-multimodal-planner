import geopandas as gpd
from shapely import to_geojson


train_stations = ["Židenice, nádraží", "Hlavní nádraží", "Chrlice, nádraží", "Lesná, nádraží", "Královo Pole, nádraží",
                      "Řečkovice, nádraží", "Slatina, nádraží", "Brno-Černovice", "Brno-Horní Heršpice", "Brno-Starý Lískovec"]

def get_transfer_evaluation(row, parking_houses, parking_lots, city_boundary):
    '''
    :param row:
    :param parking_houses:
    :param parking_lots:
    :param city_boundary:
    :return:
    '''
    places_to_park = []
    threshold_distance = 500  # meters
    distance_from_border = 2000

    for _, house in parking_houses.iterrows():
        if house['geometry'].distance(row["geometry"]) < threshold_distance:
            places_to_park.append(house)

    if city_boundary["geometry"].exterior.distance(row["geometry"]) > distance_from_border and \
        row["stop_name"] not in train_stations:
        return places_to_park

    for _, parking_lot in parking_lots.iterrows():
        if parking_lot["geometry"].distance(row["geometry"]) < threshold_distance:
            places_to_park.append(parking_lot)

    return places_to_park


def main():
    stops = gpd.read_file("stops_filtered.geojson")
    parking_houses = gpd.read_file("parkovaciDomyObsazenost.geojson")
    parking_lots = gpd.read_file("parkingLotsPublic.geojson")
    city_boundary = gpd.read_file("cityBoundary.geojson")


    stops_3857 = stops.to_crs(epsg=3857)
    parking_houses_3857 = parking_houses.to_crs(epsg=3857)
    parking_lots_3857 = parking_lots.to_crs(epsg=3857)
    city_boundary_3857 = city_boundary.to_crs(epsg=3857)

    stops['transfer_parking'] = stops_3857.apply(lambda row: get_transfer_evaluation(row, parking_houses_3857, parking_lots_3857, city_boundary_3857.iloc[0]), axis=1)
    stops["is_transfer"] = stops.apply(lambda row: len(row["transfer_parking"]) > 0, axis=1)

    export_gdf = stops[stops["is_transfer"]]
    export_gdf.to_file("transferStops.geojson", driver="GeoJSON")


if __name__ == "__main__":
    main()
