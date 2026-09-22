export interface Zone {
  id: string;
  title: string;
  status: 'active' | 'outage';
  details: string;
  latitude: number  | 'Latitud no disponible';
  longitude: number | 'Longitud no disponible';
}

export function mapHtmlTemplate(zones: Zone[]) {
    const mapHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { -webkit-tap-highlight-color: transparent; user-select: none; }
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #0F172A; }
        #map { height: 100%; width: 100%; background-color: #0F172A; }
        
        /* Estilos CSS idénticos a los marcadores de React Native */
        .marker-pin {
          width: 28px;
          height: 28px;
          border-radius: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .bg-success { background-color: #10B981; }
        .bg-danger { background-color: #EF4444; }
        .marker-dot { width: 10px; height: 10px; border-radius: 5px; background-color: #FFFFFF; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map', { zoomControl: false }).setView([10.20, -67.99], 13);
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: ''
        }).addTo(map);

        const zones = ${JSON.stringify(zones)};

        zones.forEach(zone => {
          const bgClass = zone.status === 'active' ? 'bg-success' : 'bg-danger';
          const customIcon = L.divIcon({
            className: '',
            html: \`<div class="marker-pin \${bgClass}"><div class="marker-dot"></div></div>\`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          const marker = L.marker([zone.latitude, zone.longitude], { icon: customIcon }).addTo(map);

          marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_ZONE', zone }));
          });
        });

        map.on('click', () => {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT_ZONE' }));
        });
      </script>
    </body>
  </html>
`
    return mapHtml;
}