import React, { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { io } from "socket.io-client";
import API_URL from "../../api";

const Main: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<number, google.maps.Marker>>(new Map());

  // Initialize the map only once
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE",
      version: "weekly",
      libraries: ["geometry"],
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

        // Set user location if available
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            new google.maps.Marker({
              position: userLocation,
              map: mapRef.current,
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

  // Handle WebSocket and Data Updates
  useEffect(() => {
    const socket = io(API_URL);

    // Fetch initial lot data
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

    // Handle real-time updates
    socket.on("parking-update", (data) => {
      console.log("Parking update received:", data);
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

        // Update markers without recreating the map
        updateMarkers(updatedLots);

        return updatedLots;
      });
    });

    return () => {
      socket.off("parking-update");
      socket.disconnect();
    };
  }, []);

  // Helper function to shorten names
  const shortenName = (name: string) => {
    const words = name.split(" ");
    if (words.length > 2) {
      return words.slice(0, 2).join(" ");
    }
    return name.length > 12 ? name.slice(0, 10) + "..." : name;
  };

  // Function to update markers without reloading the map
  const updateMarkers = (lots: any[]) => {
    lots.forEach((lot) => {
      const isFull = lot.current_occupancy === lot.total_capacity;
      const availableSpaces = lot.total_capacity - lot.current_occupancy;
      const occupancyRate = availableSpaces / lot.total_capacity;

      // Calculate the color based on availability
      const hue = 120 * occupancyRate; // 120 (Green) to 0 (Red)
      const markerColor = `hsl(${hue}, 100%, 50%)`;

      // Shortened lot name for cleaner markers
      const shortName = shortenName(lot.name);
      const labelText = `${shortName}\n${availableSpaces} Free`;

      // Create a custom SVG icon with a subtle outline
      const markerIcon = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 0.7,
        scale: 8 + 8 * occupancyRate, // Size based on availability
        strokeWeight: 2,
        strokeColor: "#ffffff",
      };

      if (!markersRef.current.has(lot.lotId)) {
        // Create a new marker if it doesn't exist
        const marker = new google.maps.Marker({
          position: { lat: lot.latitude, lng: lot.longitude },
          map: mapRef.current!,
          title: lot.name,
          icon: markerIcon,
          label: {
            text: labelText,
            color: "#333",
            fontSize: "1.5rem",
            fontWeight: "500",
          },
          opacity: 0.8,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
                    <div style="min-width: 200px;">
                        <h3 style="margin:0; font-size: 16px;"><strong>${
                          lot.name
                        }</strong></h3>
                        <p style="margin:4px 0;">Багтаамж: ${
                          lot.total_capacity
                        }</p>
                        <p style="margin:4px 0;">Үлдсэн: ${availableSpaces}</p>
                        <p style="margin:4px 0;">Эзлэлт: ${Math.round(
                          occupancyRate * 100
                        )}%</p>
                    </div>
                `,
        });

        // Add hover effects
        marker.addListener("mouseover", () => {
          marker.setOpacity(1);
          marker.setIcon({
            ...markerIcon,
            scale: markerIcon.scale * 1.3,
            fillOpacity: 0.9,
          });
        });

        marker.addListener("mouseout", () => {
          marker.setOpacity(0.8);
          marker.setIcon(markerIcon);
        });

        marker.addListener("click", () => {
          infoWindow.open(mapRef.current!, marker);
        });

        markersRef.current.set(lot.lotId, marker);
      } else {
        // Update the existing marker's icon, label, and position
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
          {lots.map((lot, index) => {
            const isFull = lot.current_occupancy === lot.total_capacity;
            const availableSpaces = lot.total_capacity - lot.current_occupancy;
            const occupancyRate = availableSpaces / lot.total_capacity;

            // Calculate color based on availability
            const hue = 120 * occupancyRate; // 120 (Green) to 0 (Red)
            const bgColor = `hsl(${hue}, 80%, 30%)`;
            const bgGradient = `linear-gradient(120deg, ${bgColor}, ${bgColor} 40%, #333 100%)`;

            return (
              <li
                key={index}
                className="p-4 rounded-lg shadow transition-all duration-300 hover:scale-105"
                style={{
                  backgroundImage: bgGradient,
                  color: "#ffffff",
                }}
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
    </div>
  );
};

export default Main;
