import overpy
import csv

def main():
    api = overpy.Overpass()
    transferPoints = csv.reader(open("../transferPoints.csv", "r", encoding='utf-8'), delimiter=";")
    
    # Skip the header
    next(transferPoints)
    cnt = 1
    modifiedTransferPoints = [["stop_name", "stop_lat", "stop_lon", "stop_id", "has_parking"]]
    for transferPoint in transferPoints:
        print(cnt)
        modifiedTransferPoint = transferPoint
        lat = float(transferPoint[1].replace(",", "."))
        lon = float(transferPoint[2].replace(",", "."))

        modifiedTransferPoint[1] = lat
        modifiedTransferPoint[2] = lon
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
            modifiedTransferPoint.append("1")
        else:
            modifiedTransferPoint.append("0")
        modifiedTransferPoints.append(modifiedTransferPoint)
        cnt += 1

    with open("../transferPointsWithParkingLots.csv", "w", newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter=";")
        writer.writerows(modifiedTransferPoints)
            
    
   # print("Number of transfer points with parking lots: ", cnt)
    # print("Number of parking lots: ", len(result.nodes) + len(result.ways) + len(result.relations))


if __name__ == "__main__":
    main()