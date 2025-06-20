import pandas as pd
import sklearn.cluster, sklearn.metrics
import kmedoids
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(script_dir, "..", "transferStops")
file_path = os.path.normpath(file_path)

def get_clusters():
    candidates = pd.read_csv(f'{file_path}/candidates.csv', sep=';', encoding='utf-8')

    coords = np.dstack([candidates["stopLat"], candidates["stopLon"]]).reshape(-1,2)

    base_num_clusters = 15
    num_clusters = [base_num_clusters]
    alternative_num_clusters = int(np.sqrt(len(candidates))) + base_num_clusters
    if alternative_num_clusters <= len(candidates):
        num_clusters.append(alternative_num_clusters)

    # Create the clusters using KMedoids method
    diss = sklearn.metrics.pairwise.euclidean_distances(coords)
    dbs = [kmedoids.fasterpam(diss, medoids=n) for n in num_clusters]

    # Count Davies-Bouldin index for each result
    davis_indices = [sklearn.metrics.davies_bouldin_score(coords, db.labels) for db in dbs]

    # Find the best results
    best_index = np.argmin(davis_indices)

    nearest_points = list(dbs[best_index].medoids)

    center_transfer_points = candidates.iloc[nearest_points]
    center_transfer_points.to_csv(f'{file_path}/candidatesClusters.csv', sep=';', encoding='utf-8', index=False)


if __name__ == "__main__":
    get_clusters()
