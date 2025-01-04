import overpy
import csv

def main():
    api = overpy.Overpass()
    transferPoints = csv.reader(open("../../transferPoints.csv", "r", encoding='utf-8'), delimiter=";")
    
    # Skip the header
    next(transferPoints)

    cnt = 0
    for transferPoint in transferPoints:
        lat = float(transferPoint[1].replace(",", "."))
        lon = float(transferPoint[2].replace(",", "."))
        result = api.query(f"""[out:json][timeout:25];
            node(around:500, {lat}, {lon});
            (
            node["amenity"="parking"]["access" = "yes"](around:500, {lat}, {lon});
            way["amenity"="parking"]["access" = "yes"](around:500, {lat}, {lon});
            );
            out body;
            >;
            out skel qt;
        """)
        if (len(result.ways) > 0):
            cnt += 1
            print(transferPoint, len(result.ways))
    
    print("Number of transfer points with parking lots: ", cnt)
    # print("Number of parking lots: ", len(result.nodes) + len(result.ways) + len(result.relations))


if __name__ == "__main__":
    main()