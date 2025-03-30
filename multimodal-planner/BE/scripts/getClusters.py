import pandas as pd
import sklearn.cluster, sklearn.metrics
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(script_dir, "..", "transferStops")
file_path = os.path.normpath(file_path)

# Finds a transfer stop that is nearest to the center for each center
def find_nearest_point(centroids, coords):
    indices = []
    for c in centroids:
        distances = np.linalg.norm(coords - c, axis=1)
        indices.append(np.argmin(distances))

    return indices

def getClusters():
    transferPoints = pd.read_csv(f'{file_path}/candidates.csv', sep=';', encoding='utf-8')

    coords = np.dstack([transferPoints["stopLat"], transferPoints["stopLon"]]).reshape(-1,2)

    base_num_clusters = 15
    num_clusters = [base_num_clusters]
    alternative_clusters = int(np.sqrt(len(transferPoints))) + base_num_clusters
    if (alternative_clusters <= len(transferPoints)):
        num_clusters.append(alternative_clusters)

    dbs = [sklearn.cluster.KMeans(n_clusters=n).fit(coords) for n in num_clusters]
    # Count Davies-Bouldin index for each result
    davis_indices = [sklearn.metrics.davies_bouldin_score(coords, db.labels_) for db in dbs]

    # Find the best results
    best_index = np.argmin(davis_indices)

    transferPoints["cluster"] = dbs[best_index].labels_

    nearest_points = find_nearest_point(dbs[best_index].cluster_centers_, coords)

    transferPoints["nearest"] = transferPoints.apply(lambda row: nearest_points[row["cluster"]], axis=1).astype(int)

    transferPoints.to_csv(f'{file_path}/candidatesClusters.csv', sep=';', encoding='utf-8', index=False)


if __name__ == "__main__":
    getClusters()
