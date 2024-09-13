import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString, Polygon

if __name__ == "__main__":
    stops = pd.read_csv("./GTFS/stops.txt", sep=",")
    cityBoundary = gpd.read_file("./cityBoundary.geojson")
    cityPolygon = cityBoundary.loc[0]["geometry"]

    stops["geometry"] = stops.apply(lambda row: Point(row["stop_lon"], row["stop_lat"]), axis=1)

    stops_gdf = gpd.GeoDataFrame(stops, geometry="geometry", crs="epsg:4326")
    stops_gdf["inPolygon"] = stops_gdf.apply(lambda row: cityBoundary.contains(row["geometry"]), axis=1)
    stops_gdf_filter = stops_gdf[stops_gdf["inPolygon"]]
    stops_gdf_filter = stops_gdf_filter.drop(columns=['inPolygon'])

    stops_gdf_filter.to_file("./stops_filtered.geojson", driver="GeoJSON")
