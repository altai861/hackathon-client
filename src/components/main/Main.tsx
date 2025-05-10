import React, { useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const parkingSpots = [
  {
    name: 'Цэцэг төв',
    capacity: 50,
    available: 12,
    position: { lat: 47.917531, lng: 106.918883 },
  },
  {
    name: 'Бөхийн өргөө',
    capacity: 30,
    available: 5,
    position: { lat: 47.915752, lng: 106.906907 },
  },
  {
    name: 'ШУТИС зогсоол',
    capacity: 40,
    available: 0,
    position: { lat: 47.921917, lng: 106.906565 },
  },
  {
    name: 'Зайсан толгой',
    capacity: 25,
    available: 10,
    position: { lat: 47.888178, lng: 106.905409 },
  },
];

const Main: React.FC = () => {
  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE',
      version: 'weekly',
      libraries: ['geometry'],
    });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 47.918873, lng: 106.917041 },
        zoom: 13,
      });

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
      });

      let userLocation: google.maps.LatLngLiteral | null = null;

      // ✅ Хэрэглэгчийн байршил
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          new google.maps.Marker({
            position: userLocation,
            map,
            title: 'Таны байршил',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
            },
          });

          map.setCenter(userLocation);
        });
      }

      // ✅ Custom Overlay
      class ParkingOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null;

        constructor(
          private spot: typeof parkingSpots[0],
          private mapInstance: google.maps.Map
        ) {
          super();
          this.setMap(mapInstance);
        }

        onAdd() {
          this.div = document.createElement('div');
          const isFull = this.spot.available === 0;

          this.div.className = `px-3 py-1 rounded-full font-semibold text-sm shadow bg-white border border-gray-300 cursor-pointer ${
            isFull ? 'text-red-600' : 'text-green-600'
          }`;

          this.div.innerText = `🅿 ${isFull ? 'Дүүрсэн' : `${this.spot.available} сул`}`;

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="min-width: 200px;">
                <h3 style="margin:0; font-size: 16px;"><strong>${this.spot.name}</strong></h3>
                <p style="margin:4px 0;">Багтаамж: ${this.spot.capacity}</p>
                <p style="margin:4px 0;">Үлдсэн: ${this.spot.available}</p>
                <button id="dir-${this.spot.name}" style="margin-top: 8px; background-color: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Get Direction</button>
              </div>
            `,
          });

          this.div.addEventListener('click', () => {
            infoWindow.setPosition(this.spot.position);
            infoWindow.open(this.mapInstance);

            // ❗ delay хэрэгтэй тул setTimeout
            setTimeout(() => {
              const btn = document.getElementById(`dir-${this.spot.name}`);
              if (btn && userLocation) {
                btn.addEventListener('click', () => {
                  directionsService.route(
                    {
                      origin: userLocation!,
                      destination: this.spot.position,
                      travelMode: google.maps.TravelMode.DRIVING,
                    },
                    (result, status) => {
                      if (status === 'OK' && result) {
                        directionsRenderer.setDirections(result);
                      } else {
                        alert('Маршрут олдсонгүй.');
                      }
                    }
                  );
                });
              }
            }, 100);
          });

          const panes = this.getPanes();
          panes?.overlayMouseTarget?.appendChild(this.div);
        }

        draw() {
          if (!this.div) return;
          const point = this.getProjection()?.fromLatLngToDivPixel(
            new google.maps.LatLng(this.spot.position)
          );
          if (point) {
            this.div.style.position = 'absolute';
            this.div.style.left = `${point.x - 30}px`;
            this.div.style.top = `${point.y - 40}px`;
          }
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode?.removeChild(this.div);
            this.div = null;
          }
        }
      }

      // 🅿️ Маркер бүр дээр Overlay үүсгэх
      parkingSpots.forEach((spot) => {
        new ParkingOverlay(spot, map);
      });
    });
  }, []);

  return (
    <div className="h-screen w-full flex">
      {/* Map */}
      <div className="w-2/3 h-full">
        <div id="map" className="h-full w-full" />
      </div>

      {/* Info */}
      <div className="w-1/3 h-full bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Зогсоолын мэдээлэл</h2>
        <ul className="space-y-4">
          {parkingSpots.map((spot, index) => {
            const isFull = spot.available === 0;
            const availability = isFull
              ? 'Дүүрсэн'
              : `${spot.available} / ${spot.capacity}`;
            return (
              <li key={index} className="bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold">{spot.name}</h3>
                <p
                  className={`mt-1 text-sm ${
                    isFull ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  {availability}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Main;
