import React, { useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const parkingSpots = [
  {
    name: "Цэцэг төв",
    capacity: 50,
    available: 12,
    position: { lat: 47.917531, lng: 106.918883 },
  },
  {
    name: "Бөхийн өргөө",
    capacity: 30,
    available: 5,
    position: { lat: 47.915752, lng: 106.906907 },
  },
  {
    name: "ШУТИС зогсоол",
    capacity: 40,
    available: 0,
    position: { lat: 47.921917, lng: 106.906565 },
  },
  {
    name: "Зайсан толгой",
    capacity: 25,
    available: 10,
    position: { lat: 47.888178, lng: 106.905409 },
  },
];

const Main: React.FC = () => {
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE", // Replace with your API key
      version: "weekly",
    });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 47.918873, lng: 106.917041 },
        zoom: 13,
      });

      // Хэрэглэгчийн байршил
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          new google.maps.Marker({
            position: userLocation,
            map,
            title: "Таны байршил",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "white",
              },
          });

          map.setCenter(userLocation);
        });
      }

      // Custom HTML Marker Overlay
      class ParkingOverlay extends google.maps.OverlayView {
        private div: HTMLDivElement | null = null;

        constructor(
          private position: google.maps.LatLngLiteral,
          private label: string,
          private color: string
        ) {
          super();
          this.setMap(map);
        }

        onAdd() {
this.div = document.createElement("div");

const isFull = this.label.includes("Дүүрсэн");

this.div.className =
  `px-3 py-1 rounded-full font-semibold text-sm shadow bg-white border border-gray-300 ${
    isFull ? 'text-red-600' : 'text-green-600'
  }`;

this.div.innerText = this.label;


          const panes = this.getPanes();
          panes?.overlayMouseTarget?.appendChild(this.div);
        }

        draw() {
          if (!this.div) return;
          const point = this.getProjection()?.fromLatLngToDivPixel(
            new google.maps.LatLng(this.position)
          );
          if (point) {
            this.div.style.position = "absolute";
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

      // Маркерууд нэмэх
      parkingSpots.forEach((spot) => {
        const isFull = spot.available === 0;
        const labelText = isFull ? "Дүүрсэн" : `${spot.available} сул`;
        const color = isFull ? "gray" : spot.available < 10 ? "red" : "black";

        new ParkingOverlay(spot.position, `🅿 ${labelText}`, color);
      });
    });
  }, []);

  return (
    <div className="h-screen w-full flex">
      <div className="w-2/3 h-full">
        <div id="map" className="h-full w-full"></div>
      </div>

      <div className="w-1/3 h-full bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Зогсоолын мэдээлэл</h2>
        <ul className="space-y-4">
          {parkingSpots.map((spot, index) => {
            const isFull = spot.available === 0;
            const availability = isFull
              ? "Дүүрсэн"
              : `${spot.available} / ${spot.capacity}`;
            return (
              <li key={index} className="bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-xl font-semibold">{spot.name}</h3>
                <p
                  className={`mt-1 text-sm ${
                    isFull ? "text-red-400" : "text-green-400"
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
