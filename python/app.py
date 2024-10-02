from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from python_tsp.distances import euclidean_distance_matrix
from python_tsp.heuristics import solve_tsp_local_search
from random import sample
import pandas as pd
import geopandas as gpd

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point



app = Flask(__name__)
CORS(app) 

@app.route('/processar_pontos', methods=['POST'])



def processar_pontos():
    data = request.get_json()  # Receber os pontos enviados
    pontos = data.get('pontos', [])

    start_point = data['startPoint']  
    # Criação da geometria usando as coordenadas (lng, lat)
    geometry = [Point(d['lng'], d['lat']) for d in pontos]

    # Criação do GeoDataFrame
    gdf = gpd.GeoDataFrame(pontos, geometry=geometry, crs="EPSG:4326")

    # Criação da matriz de distância
    pares_coord = list(zip(gdf['lng'], gdf['lat']))  # Converte para formato (lng, lat)
    distance_matrix = euclidean_distance_matrix(pares_coord)

    if  start_point:
        init_pts_id = gdf[(gdf['lat'] == start_point['lat']) & (gdf['lng'] == start_point['lng'])].index[0]
    else:
        init_pts_id = gdf['lat'].idxmin()

  
    if data['reverseWalk']:

        distance_matrix = pd.DataFrame(distance_matrix)
        max = distance_matrix.to_numpy().max()*100000
        distance_matrix[init_pts_id] = max
        distance_matrix[init_pts_id][init_pts_id] = 0
        distance_matrix[init_pts_id][len(gdf)-1] = 0
        distance_matrix = distance_matrix.to_numpy(dtype='float')


    num_nodes = len(gdf)
    x0 = [init_pts_id] + sample([node for node in range(num_nodes) if node != init_pts_id], k=num_nodes - 1)
    permutation, distance = solve_tsp_local_search(distance_matrix, x0=x0, perturbation_scheme='ps5')
    if  not start_point:
        permutation, distance = solve_tsp_local_search(distance_matrix, x0=permutation)
    

    # Organiza os pontos na ordem do percurso
    df_ordered = gdf.iloc[permutation].reset_index(drop=True)
    df_ordered['index'] = range(1, len(permutation)+1)
    

    return jsonify({
        'caminho': df_ordered[['lat', 'lng']].values.tolist()  # Retorna os pontos ordenados
    })

app.run(host='0.0.0.0', port=5000)
# if __name__ == '__main__':
#     app.run(debug=True)
