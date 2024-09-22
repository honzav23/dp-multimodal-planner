import osmnx as ox
from shapely.geometry import Point
from shapely import get_coordinates
import geopandas as gpd

if __name__ == "__main__":
    region = "South Moravian Region, Czech Republic"

    region_boundary = ox.geocode_to_gdf(region)
    region_polygon = region_boundary["geometry"].loc[0]

    region_boundary.to_file(filename="regionBoundary.geojson", driver="GeoJSON")


    custom_filter_rail = '["railway"~"rail|tram"]'
    custom_filter_public_transport = '["highway"~"busway|primary"]'
    '["railway"~"tram"]'

    # Create the street network graph from a point and given radius around it
    road_network = ox.graph_from_polygon(polygon=region_polygon, network_type='drive',
                                         retain_all=True)

    # Convert graph to GeoDataFrame - can include nodes, edges or both
    street_network_gdf = ox.graph_to_gdfs(road_network, nodes=True, edges=True)

    # Better to save it in graphml (basically XML) because it is one file
    ox.save_graphml(road_network, "./roadNetwork.graphml", encoding="utf-8")

    # Store it in GeoJSON - good for visualizations
    # street_network_gdf[0].to_file(filename="./roadNetworkNodes.geojson", driver="GeoJSON")
    # street_network_gdf[1].to_file(filename="./roadNetworkEdges.geojson", driver="GeoJSON")
