import React, { useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const Main: React.FC = () => {
  useEffect(() => {
    const loader = new Loader({
      apiKey: "AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE",
      version: "weekly",
    });

    loader.load().then(() => {
      new google.maps.Map(document.getElementById("map") as HTMLElement, {
        center: { lat: 47.918873, lng: 106.917041 },
        zoom: 12,
      });
    });
  }, []);

  return (
    <div className="h-screen w-full">
      <div id="map" className="h-full w-full"></div>
    </div>
  );
};

export default Main;