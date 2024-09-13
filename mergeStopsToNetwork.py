import math

import osmnx as ox
import geopandas as gpd
import json
import shapely
from shapely.ops import transform
from pyproj import Transformer
from shapely.geometry import Point, shape, LineString

def get_nodes_dict(nodes):
    nodes_dict = {node_tuple[0]: node_tuple[1] for node_tuple in nodes}
    return nodes_dict


# Define the transformers for EPSG:4326 to EPSG:3857
transformer = Transformer.from_crs("epsg:4326", "epsg:3857", always_xy=True)

# Finds the num_of_closest_nodes closest nodes from a given stop (default 20)
def find_closest_node(stop, nodes, num_of_closest_nodes = 20):

    closest_nodes_with_distances = []
    for n, i in nodes:
        node_location = Point(i['x'], i['y'])
        node_location3857 = transform(transformer.transform, node_location)
        current_distance = node_location3857.distance(stop.geometry)
        if len(closest_nodes_with_distances) < num_of_closest_nodes:
            closest_nodes_with_distances.append((n, current_distance))
        else:
            max_distance_tuple = max(closest_nodes_with_distances, key=lambda x: x[1])
            if current_distance < max_distance_tuple[1]:
                index = closest_nodes_with_distances.index(max_distance_tuple)
                del closest_nodes_with_distances[index]
                closest_nodes_with_distances.append((n, current_distance))

    closest_nodes_with_distances = sorted(closest_nodes_with_distances, key=lambda x: x[1])

    # Just return the node IDs
    return [x[0] for x in closest_nodes_with_distances]

def find_closest_line(edge_coords, stop):
    edge_sublinestrings = []

    # Create sublinestrings
    for i in range(len(edge_coords) - 1):
        edge_sublinestrings.append(LineString([(edge_coords[i][0], edge_coords[i][1]), (edge_coords[i + 1][0], edge_coords[i+1][1])]))


    edge_sublines_gdf = gpd.GeoDataFrame(geometry=edge_sublinestrings, crs='epsg:4326').to_crs(epsg=3857)
    edge_sublines_gdf["distance"] = edge_sublines_gdf.apply(lambda row: row.geometry.distance(stop.geometry), axis=1)

    minimal_idx = edge_sublines_gdf[["distance"]].idxmin()
    return minimal_idx

def main():
    street_network = ox.load_graphml("streetNetwork.graphml")
    street_network_copy = street_network.copy()
    street_network_copy = ox.project_graph(street_network_copy, to_crs="epsg:3857")
    stops = gpd.read_file("./stops_filtered.geojson")

    graph_nodes = street_network_copy.nodes(data=True)
    stops = stops.to_crs(epsg=3857)
    nodes_dict = get_nodes_dict(graph_nodes)

    for cnt, stop in enumerate(stops.itertuples()):
        # print(stop.geometry.coords[0])
        dist = ox.nearest_edges(street_network_copy, stop.geometry.coords[0][0], stop.geometry.coords[0][1], return_dist=True)
        if (dist[1] > 100):
            print(f"{stop}\n{dist}\n")
    #     street_network.add_node(stop.stop_id, y=stop.stop_lat, x=stop.stop_lon, stop_name=stop.stop_name)
    #     closest_nodes = find_closest_node(stop, graph_nodes)
    #
    #     for cnt2, closest_node in enumerate(closest_nodes):
    #         edge_info = []
    #         for e in street_network.out_edges(closest_node, data=True):
    #             # Just extract the start node, end node and the geometry properties from the edge
    #             if "geometry" in e[2].keys():
    #                 edge_info.append({"from": e[0], "to": e[1], "geometry": json.loads(shapely.to_geojson(e[2]["geometry"]))})
    #
    #         for e in street_network.in_edges(closest_node, data=True):
    #             # Just extract the geometry property from the edge
    #             if "geometry" in e[2].keys():
    #                 edge_info.append({"from": e[0], "to": e[1], "geometry": json.loads(shapely.to_geojson(e[2]["geometry"]))})
    #
    #         if len(edge_info) > 0:
    #             # Convert to appropriate shape - usually LINESTRING
    #             shapely_geometries = [shape(g["geometry"]) for g in edge_info]
    #             edge_gdf = gpd.GeoDataFrame(edge_info, geometry=shapely_geometries, crs="epsg:4326").to_crs(epsg=3857)
    #             edge_gdf["distance"] = edge_gdf.apply(lambda row: row["geometry"].distance(stop.geometry), axis=1)
    #             min_edge_distance = edge_gdf["distance"].min()
    #             if min_edge_distance < 50:
    #                 edge_gdf = edge_gdf.to_crs(epsg=4326)
    #
    #                 edge_nodes = edge_gdf[edge_gdf["distance"] == min_edge_distance]
    #                 street_network.add_node(stop.stop_id, y=stop.stop_lat, x=stop.stop_lon)
    #                 first_edge_geometry = street_network[edge_nodes.iloc[0]["from"]][edge_nodes.iloc[0]["to"]][0]["geometry"]
    #                 first_edge_coords = list(first_edge_geometry.coords)
    #                 minimal_idx = find_closest_line(first_edge_coords, stop).iloc[0]
    #                 linestring_before_stop = first_edge_coords[:minimal_idx + 1]
    #                 #street_network.add_
    #                 #print(linestring_before_stop)
    #                 break
    #
    #             # if cnt2 == 19:
    #             #     with open("stopsNotFound.txt", "a") as f:
    #             #         f.write(f"Closest edge not found at stop {stop.stop_name}\n")
    #
    #
    # # print(street_network.in_edges(closest_node, data=True), street_network.out_edges(closest_node, data=True))
    # # street_network_gdf = ox.graph_to_gdfs(street_network, nodes=True)
    # # street_network_gdf[0].to_file(filename="./streetNetworkNodesWithStops.geojson", driver="GeoJSON")

if __name__ == '__main__':
    main()