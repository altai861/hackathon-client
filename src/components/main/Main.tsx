import React, { useEffect, useState, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { io } from "socket.io-client";
import API_URL from "../../api";

const Main: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null
  );
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(
    null
  );
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
            mapId: "SISU",
          }
        );

        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: mapRef.current,
          suppressMarkers: false,
        });

        // Set user location if available
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

        // Allow setting custom points
        let customMarker: google.maps.Marker | null = null;
        mapRef.current.addListener("click", (event: { latLng: any; }) => {
          const latLng = event.latLng!.toJSON();

          // Remove existing custom point
          if (customMarker) {
            customMarker.setMap(null);
          }

          // Add the new custom point
          customMarker = new google.maps.Marker({
            position: latLng,
            map: mapRef.current!,
            title: "Custom Point",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#FF6347",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "white",
            },
          });

          // Remove the marker on click
          customMarker.addListener("click", () => {
            customMarker!.setMap(null);
            customMarker = null;
            navigator.geolocation.getCurrentPosition((position) => {
                const userLocation = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
    
                userLocationRef.current = userLocation;
            })
          });

          // Update the custom location
          userLocationRef.current = latLng;
        });
      }
    });
  }, []);

  const findBestPathFromCustomPoint = () => {
    if (!userLocationRef.current || !directionsServiceRef.current || !directionsRendererRef.current) return;

    const availableLots = lots.filter((lot) => lot.current_occupancy < lot.total_capacity);
    if (availableLots.length === 0) {
      alert("Одоо сул зогсоол алга.");
      return;
    }

    const destinations = availableLots.map((lot) => ({
      lat: lot.latitude,
      lng: lot.longitude,
    }));

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

  const clearPath = () => {
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setDirections({
        routes: [],
        request: {
          origin: "",
          destination: "",
          travelMode: google.maps.TravelMode.DRIVING,
        },
      } as google.maps.DirectionsResult);
    }
  };

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
                current_occupancy: data.detectedCars,
                imageUrl: data.imageUrl,
                base64Image: data.base64Image,
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

  const updateMarkers = async (lots: any[]) => {
    const { AdvancedMarkerElement } = (await google.maps.importLibrary(
      "marker"
    )) as google.maps.MarkerLibrary;

    lots.forEach((lot) => {
      const availableSpaces = lot.total_capacity - lot.current_occupancy;
      const occupancyRate = availableSpaces / lot.total_capacity;
      const hue = 120 * occupancyRate;
      const markerColor = `hsl(${hue}, 100%, 50%)`;

      const shortName = shortenName(lot.name);
      const labelText = `${shortName}\n${availableSpaces} Free`;

      // Create marker content
      const markerContent = document.createElement("div");
      markerContent.className = "custom-marker";
      markerContent.style.backgroundColor = markerColor;
      markerContent.style.color = "#fff";
      markerContent.style.padding = "4px 8px";
      markerContent.style.borderRadius = "4px";
      markerContent.style.cursor = "pointer";
      markerContent.style.textAlign = "center";
      markerContent.style.fontWeight = "bold";
      markerContent.style.boxShadow = "0px 2px 2px rgba(0,0,0,0.15)";
      markerContent.innerHTML = `${shortName}<br>${availableSpaces} Free`;

      // Create or update the marker
      const marker = new AdvancedMarkerElement({
        map: mapRef.current!,
        position: { lat: lot.latitude, lng: lot.longitude },
        title: lot.name,
        content: markerContent,
        zIndex: 1,
      });

      // Add click listener for image popup
      marker.addListener("click", () => {
        const updatedAvailable = lot.total_capacity - lot.current_occupancy;
        const updatedOccupancy = Math.round(
          (updatedAvailable / lot.total_capacity) * 100
        );

        const html = `
                <div style="min-width: 200px;">
                    <h3><strong>${lot.name}</strong></h3>
                    <p>Багтаамж: ${lot.total_capacity}</p>
                    <p>Үлдсэн: ${updatedAvailable}</p>
                    <p>Эзлэлт: ${updatedOccupancy}%</p>
                    ${
                      lot.imageUrl || lot.base64Image
                        ? `<button id="show-image-${lot.lotId}" style="margin-top:8px; background-color:#2563eb; color:white; padding:6px 12px; border-radius:4px; cursor:pointer;">Зураг Харах</button>`
                        : ""
                    }
                </div>
            `;

        const infoWindow = new google.maps.InfoWindow({
          content: html,
        });

        infoWindow.open({
          map: mapRef.current!,
          anchor: marker,
        });

        // Handle button click for image popup
        setTimeout(() => {
          const btn = document.getElementById(`show-image-${lot.lotId}`);
          if (btn) {
            const imageUrl = lot.base64Image
              ? `data:image/jpeg;base64,${lot.base64Image}`
              : `${API_URL}${lot.imageUrl}`;
            console.log(imageUrl);
            btn.onclick = () => setSelectedImage(imageUrl);
          }
        }, 100);
      });

      // Add hover effects
      markerContent.addEventListener("mouseover", () => {
        markerContent.style.transform = "scale(1.2)";
        markerContent.style.boxShadow = "0px 6px 20px rgba(0,0,0,0.25)";
        marker.zIndex = 2;
      });

      markerContent.addEventListener("mouseout", () => {
        markerContent.style.transform = "scale(1)";
        markerContent.style.boxShadow = "0px 4px 12px rgba(0,0,0,0.15)";
        marker.zIndex = 1;
      });
    });
  };

  const handleFindBestParking = () => {
    if (
      !userLocationRef.current ||
      !directionsServiceRef.current ||
      !directionsRendererRef.current
    )
      return;

    const availableLots = lots.filter(
      (lot) => lot.current_occupancy < lot.total_capacity
    );
    if (availableLots.length === 0) {
      alert("Одоо сул зогсоол алга.");
      return;
    }

    const destinations = availableLots.map((lot) => ({
      lat: lot.latitude,
      lng: lot.longitude,
    }));
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
        className="absolute top-4 left-4 z-10 px-4 py-2 bg-blue-600 text-sm text-white rounded shadow hover:bg-blue-700"
      >
        Ойр зогсоол хайх
      </button>
      <button
        onClick={clearPath}
        className="absolute top-16 left-4 z-10 px-4 py-2 bg-red-500 text-sm text-white rounded shadow hover:bg-red-700"
      >
        Зам арилгах
      </button>
      <button
        onClick={findBestPathFromCustomPoint}
        className="absolute top-28 left-4 z-10 px-4 py-2 bg-green-600 text-sm text-white rounded shadow hover:bg-green-700"
      >
        Ойр зогсоол хайх (Custom)
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
            const isFull = lot.total_capacity <= lot.current_occupancy;
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
            src={`${selectedImage}`}
            alt="Lot"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg border-4 border-white"
          />
        </div>
      )}
    </div>
  );
};

export default Main;
