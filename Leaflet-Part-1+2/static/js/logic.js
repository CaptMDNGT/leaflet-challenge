// Initialize the map and set its view to the chosen geographical coordinates and zoom level
var map = L.map('map').setView([20.0, 0.0], 2);

// Define base layers
var streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
});

// Layer groups for earthquakes and tectonic plates
var earthquakeLayer = L.layerGroup();
var tectonicPlatesLayer = L.layerGroup();

// Function to determine marker size based on magnitude
function markerSize(magnitude) {
  return magnitude * 4;
}

// Function to determine marker color based on depth
function markerColor(depth) {
  return depth > 90 ? '#ED0808' :
         depth > 70 ? '#F80071' :
         depth > 50 ? '#9E08B3' :
         depth > 30 ? '#721571' :
         depth > 10 ? '#54339F' :
                      '#1900FF';
}

// Fetch the earthquake data
fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson')
  .then(response => response.json())
  .then(data => {
    console.log('Fetched Data:', data); // Log the fetched data
    data.features.forEach(feature => {
      console.log('Processing feature:', feature); // Log each feature
      var coordinates = feature.geometry.coordinates;
      var magnitude = feature.properties.mag;
      var depth = coordinates[2];
      var place = feature.properties.place;
      var time = new Date(feature.properties.time).toLocaleString();

      L.circleMarker([coordinates[1], coordinates[0]], {
        radius: markerSize(magnitude),
        fillColor: markerColor(depth),
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).bindPopup(`<h3>${place}</h3><hr><p>Magnitude: ${magnitude}</p><p>Depth: ${depth} km</p><p>Time: ${time}</p>`)
        .addTo(earthquakeLayer);
    });
  })
  .catch(error => console.error('Error fetching data:', error));


// Fetch the tectonic plates data
fetch('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: 'yellow',
        weight: 2
      }
    }).addTo(tectonicPlatesLayer);
  })
  .catch(error => console.error('Error fetching data:', error));

// Add layer controls
var baseMaps = {
  "Street Map": streetMap,
  "Topographic Map": topoMap
};

var overlayMaps = {
  "Earthquakes": earthquakeLayer,
  "Tectonic Plates": tectonicPlatesLayer
};

L.control.layers(baseMaps, overlayMaps).addTo(map);

// Add legend to the map
var legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend'),
    depths = [0, 10, 30, 50, 70, 90],
    labels = [];

  div.innerHTML += '<h4>Depth (km)</h4>';
  
  // Loop through depth intervals and generate a label with a colored square for each interval
  for (var i = 0; i < depths.length; i++) {
    div.innerHTML += '<div>' +
      '<i style="background:' + markerColor(depths[i] + 1) + '"></i> ' +
      depths[i] + (depths[i + 1] ? '&ndash;' + depths[i + 1] + '<br>' : '+') +
      '</div>';
  }

  return div;
};

legend.addTo(map);