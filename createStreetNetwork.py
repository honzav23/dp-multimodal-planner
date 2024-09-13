import osmnx as ox
from shapely.geometry import Point
from shapely import get_coordinates
import geopandas as gpd

if __name__ == "__main__":
    city = "Brno"

    city_boundary = ox.geocode_to_gdf(city)
    geom_centre = city_boundary["geometry"].centroid.loc[0]
    city_polygon = city_boundary["geometry"].loc[0]

    city_boundary.to_file(filename="cityBoundary.geojson", driver="GeoJSON")

    geom_centre = gpd.GeoDataFrame([{'geometry': geom_centre}], crs='EPSG:4326')

    city_polygon_coords = list(city_polygon.exterior.coords)

    # Create points from the coordinates
    city_polygon_points = [Point(*c) for c in city_polygon_coords]
    city_polygon_points_df = gpd.GeoDataFrame([{'geometry': p} for p in city_polygon_points], crs='EPSG:4326')

    coords = city_polygon_points_df.to_crs(epsg=3857)
    geomCentreForDist = geom_centre.to_crs(epsg=3857)

    distances = coords.distance(geomCentreForDist.loc[0].geometry)
    max_distance = max(distances)

    centre_coords = (get_coordinates(geom_centre)[0].tolist())
    centre_coords_tuple = (centre_coords[1], centre_coords[0])

    print(f'Max distance: {max_distance}, coordinates: {city_polygon_points[distances.idxmax()]}')
    custom_filter_rail = '["railway"~"rail|tram"]'
    custom_filter_public_transport = '["highway"~"busway|primary"]'
    '["railway"~"tram"]'

    # Create the street network graph from a point and given radius around it
    street_network = ox.graph_from_point(centre_coords_tuple, dist=int(max_distance + 100), custom_filter=custom_filter_public_transport,
                                         retain_all=True)

    # Convert graph to GeoDataFrame - can include nodes, edges or both
    street_network_gdf = ox.graph_to_gdfs(street_network, nodes=True, edges=True)

    # Better to save it in graphml (basically XML) because it is one file
    # ox.save_graphml(street_network, "./streetNetworkBike.graphml", encoding="utf-8")

    # Store it in GeoJSON - good for visualizations
    # street_network_gdf[0].to_file(filename="./streetNetworkRailNodes.geojson", driver="GeoJSON")
    street_network_gdf[1].to_file(filename="./streetNetworkPublicTransportEdges.geojson", driver="GeoJSON")
