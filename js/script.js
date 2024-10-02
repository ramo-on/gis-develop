var map = L.map('map').setView([-23.5505, -46.6333], 13); 
        
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '© OpenStreetMap contributors'
// }).addTo(map);

L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&hl=pt',{
    maxZoom: 21,
    subdomains:['mt0','mt1','mt2','mt3']
}).addTo(map);

// Camada de labels
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 21,
    opacity: 1 // Ajuste a opacidade conforme necessário
}).addTo(map);

let startPoint = null; // Ponto inicial selecionado

let genPoint = [];
let pathLayer; // Layer para a linha que conecta os pontos
let marker;


function randomPoint(qty) { 
    if (marker) {

        if (pathLayer) {
            pathLayer.remove(); // Remove a linha antiga se existir
        }
        map.eachLayer((layer) => {

            if (layer._point) {
                layer.remove();
            }
          
          }); // Remove a linha antiga se existir
    }
    genPoint = []; 
    for (let i = 0; i < qty; i++) {
        let lat = -23.5505 + (Math.random() - 0.5) * 0.1;
        let lng = -46.6333 + (Math.random() - 0.5) * 0.1;

        marker = L.circle([lat, lng], {
            radius: 300,
            fillColor: 'red',
            color: 'white',
            stroke: true,
            fillOpacity:1,
        }).addTo(map);

        // Adiciona evento de clique para selecionar ponto inicial
        marker.on('click', function() {
            startPoint = { lat: lat, lng: lng };
            alert('Ponto inicial selecionado: ' + lat + ', ' + lng);
            map.eachLayer((layer) => {

                if (layer._point && layer._latng == { lat: lat, lng: lng }) {
                    layer.remove()
                }
              
              }); 

              marker = L.circle([lat, lng], {
                radius: 300,
                fillColor: 'blue',
                color: 'white',
                stroke: true,
                fillOpacity: 1,
            }).addTo(map);
        });

        genPoint.push({ lat: lat, lng: lng });
    }
}

function sendToProcess(reverseWalk) {
    let loadingElement = document.getElementById('loading'); // Obtenha o elemento de loading

    loadingElement.style.display = 'block';
    let url = "http://0.0.0.0:5000/processar_pontos" 
    fetch(url, {
        method: "POST",
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pontos: genPoint, startPoint: startPoint, reverseWalk: reverseWalk }) 
    })
    .then(async response => {

        let data = await response.json();
        drawPath(data.caminho);

    })
   
    .catch(error => {
        console.error('Erro ao enviar os pontos:', error);
    })
    .finally(() => {
        loadingElement.style.display = 'none'; // Esconde o loading após a resposta
    });
}


function drawPath(orderedPoints) {
    if (pathLayer) {
        pathLayer.remove(); // Remove a linha antiga se existir
    }

    pathLayer = L.polyline(orderedPoints, { color: 'blue' }).addTo(map);

    // Ajusta a visão do mapa para que todos os pontos estejam visíveis
    map.fitBounds(pathLayer.getBounds());
}



document.getElementById('generate-points').addEventListener('click', () => {
    const qty = parseInt(document.getElementById('point-qty').value, 10);
    if (!isNaN(qty) && qty > 0) {
        randomPoint(qty);
    }
});

document.getElementById('send-python').addEventListener('click', () => {
    var reverseWalk = document.getElementById('reverse-walk').checked;
    sendToProcess(reverseWalk)
});
