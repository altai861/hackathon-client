import React, { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { io } from "socket.io-client";
import API_URL from "../../api";

const Main: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const userLocationRef = useRef<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE",
      version: "weekly",
      libraries: ["geometry", "places"],
    });

    loader.load().then(() => {
      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(
          document.getElementById("map") as HTMLElement,
          {
            center: { lat: 47.918873, lng: 106.917041 },
            zoom: 13,
          }
        );

        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: false,
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            userLocationRef.current = userLocation;

            new google.maps.Marker({
              position: userLocation,
              map: mapRef.current!,
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

            mapRef.current?.setCenter(userLocation);
          });
        }
      }
    });
  }, []);

  useEffect(() => {
    const socket = io(API_URL);

    const fetchLots = async () => {
      try {
        const response = await fetch(`${API_URL}/parkinglot`);
        const data = await response.json();
        setLots(data);
        updateMarkers(data);
      } catch (error) {
        console.error("Error fetching parking lots:", error);
      }
    };

    fetchLots();

    socket.on("parking-update", (data) => {
      setLots((prevLots) => {
        const updatedLots = prevLots.map((lot) =>
          lot.lotId === data.lotId
            ? {
                ...lot,
                current_occupancy: data.availableSpaces,
                imageUrl: data.imageUrl,
              }
            : lot
        );
        updateMarkers(updatedLots);
        return updatedLots;
      });
    });

    return () => {
      socket.off("parking-update");
      socket.disconnect();
    };
  }, []);

  const shortenName = (name: string) => {
    const words = name.split(" ");
    return words.slice(0, 2).join(" ");
  };

  const updateMarkers = (lots: any[]) => {
    lots.forEach((lot) => {
      const availableSpaces = lot.total_capacity - lot.current_occupancy;
      const occupancyRate = availableSpaces / lot.total_capacity;
      const hue = 120 * occupancyRate;
      const markerColor = `hsl(${hue}, 100%, 50%)`;

      const shortName = shortenName(lot.name);
      const labelText = `${shortName}\n${availableSpaces} Free`;

      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 0.7,
        scale: 8 + 8 * occupancyRate,
        strokeWeight: 2,
        strokeColor: "#ffffff",
      };

      if (!markersRef.current.has(lot.lotId)) {
        const marker = new google.maps.Marker({
          position: { lat: lot.latitude, lng: lot.longitude },
          map: mapRef.current!,
          title: lot.name,
          icon: markerIcon,
          label: {
            text: labelText,
            color: "#333",
            fontSize: "11px",
            fontWeight: "500",
          },
          opacity: 0.8,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="min-width: 200px;">
              <h3><strong>${lot.name}</strong></h3>
              <p>Багтаамж: ${lot.total_capacity}</p>
              <p>Үлдсэн: ${availableSpaces}</p>
              <p>Эзлэлт: ${Math.round(occupancyRate * 100)}%</p>
              ${
                lot.imageUrl
                  ? `<button id="show-image-${lot.lotId}" style="margin-top:8px; background-color:#2563eb; color:white; padding:6px 12px; border-radius:4px;">Зураг Харах</button>`
                  : ""
              }
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapRef.current!, marker);
          setTimeout(() => {
            const imageButton = document.getElementById(`show-image-${lot.lotId}`);
            if (imageButton && lot.imageUrl) {
              imageButton.addEventListener("click", () => {
                setSelectedImage(`${API_URL}${lot.imageUrl}`);
              });
            }
          }, 100);
        });

        marker.addListener("mouseover", () => {
          marker.setOpacity(1);
          marker.setIcon({ ...markerIcon, scale: markerIcon.scale * 1.2 });
        });

        marker.addListener("mouseout", () => {
          marker.setOpacity(0.8);
          marker.setIcon(markerIcon);
        });

        markersRef.current.set(lot.lotId, marker);
      } else {
        const marker = markersRef.current.get(lot.lotId);
        marker!.setIcon(markerIcon);
        marker!.setLabel({
          text: labelText,
          color: "#333",
          fontSize: "11px",
          fontWeight: "500",
        });
      }
    });
  };

  const handleFindBestParking = () => {
    if (!userLocationRef.current || !directionsServiceRef.current || !directionsRendererRef.current) return;

    const availableLots = lots.filter(lot => lot.current_occupancy < lot.total_capacity);
    if (availableLots.length === 0) {
      alert("Одоо сул зогсоол алга.");
      return;
    }

    const destinations = availableLots.map(lot => ({ lat: lot.latitude, lng: lot.longitude }));
    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [userLocationRef.current],
        destinations,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status !== "OK" || !response) return;

        const distances = response.rows[0].elements;
        let minIndex = 0;
        let minDistance = distances[0].distance?.value || Infinity;

        for (let i = 1; i < distances.length; i++) {
          const dist = distances[i].distance?.value || Infinity;
          if (dist < minDistance) {
            minDistance = dist;
            minIndex = i;
          }
        }

        const bestLot = availableLots[minIndex];
        directionsServiceRef.current!.route(
          {
            origin: userLocationRef.current,
            destination: { lat: bestLot.latitude, lng: bestLot.longitude },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === "OK" && result) {
              directionsRendererRef.current!.setDirections(result);
            } else {
              alert("Маршрут олдсонгүй.");
            }
          }
        );
      }
    );
  };

  return (
    <div className="h-screen w-full flex relative">
      {/* Button */}
      <button
        onClick={handleFindBestParking}
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
      >
        Шилдэг зогсоол хайх
      </button>

      {/* Map */}
      <div className="w-2/3 h-full">
        <div id="map" className="h-full w-full" />
      </div>

      {/* Sidebar */}
      <div className="w-1/3 h-full bg-gray-900 text-white p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Зогсоолын мэдээлэл</h2>
        <ul className="space-y-4">
          {lots.map((lot, index) => {
            const isFull = lot.current_occupancy === lot.total_capacity;
            const availableSpaces = lot.total_capacity - lot.current_occupancy;
            const hue = 120 * (availableSpaces / lot.total_capacity);
            const bgColor = `hsl(${hue}, 80%, 30%)`;
            const bgGradient = `linear-gradient(120deg, ${bgColor}, ${bgColor} 40%, #333 100%)`;

            return (
              <li
                key={index}
                className="p-4 rounded-lg shadow transition-all duration-300 hover:scale-105"
                style={{ backgroundImage: bgGradient, color: "#ffffff" }}
              >
                <h3 className="text-xl font-semibold">{lot.name}</h3>
                <p className="mt-1 text-sm">
                  {isFull
                    ? "Дүүрсэн"
                    : `${availableSpaces} / ${lot.total_capacity} Сул`}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Popup Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Lot"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg border-4 border-white"
          />
        </div>
      )}
    </div>
  );
};

export default Main;
