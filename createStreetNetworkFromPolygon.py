import osmnx as ox
from shapely.geometry import Point
from shapely import get_coordinates
import geopandas as gpd

if __name__ == "__main__":
    city = "Brno"

    city_boundary = ox.geocode_to_gdf(city)
    city_polygon = city_boundary["geometry"].loc[0]

    city_boundary.to_file(filename="cityBoundary.geojson", driver="GeoJSON")

    bounds = tuple(city_boundary.total_bounds)


    custom_filter_rail = '["railway"~"rail|tram"]'
    custom_filter_public_transport = '["highway"~"busway|primary"]'
    '["railway"~"tram"]'

    # Create the street network graph from a point and given radius around it
    street_network = ox.graph_from_polygon(polygon=city_polygon, network_type='drive',
                                         retain_all=True)

    # Convert graph to GeoDataFrame - can include nodes, edges or both
    street_network_gdf = ox.graph_to_gdfs(street_network, nodes=True, edges=True)

    # Better to save it in graphml (basically XML) because it is one file
    # ox.save_graphml(street_network, "./streetNetworkBike.graphml", encoding="utf-8")

    # Store it in GeoJSON - good for visualizations
    street_network_gdf[0].to_file(filename="./streetNetworkNodes.geojson", driver="GeoJSON")
    street_network_gdf[1].to_file(filename="./streetNetworkEdges.geojson", driver="GeoJSON")
