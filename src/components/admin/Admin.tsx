/// <reference types="google.maps" />

import React, { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';

import API_URL from '../../api';

interface ParkingLot {
  lotId: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: 'public' | 'paid';
}

interface ParkingForm {
  lotId?: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: 'public' | 'paid';
}

const Admin: React.FC = () => {
  const [parkings, setParkings] = useState<ParkingLot[]>([]);
  const [form, setForm] = useState<ParkingForm>({
    name: '',
    total_capacity: 0,
    latitude: '',
    longitude: '',
    type: 'public',
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  useEffect(() => {
    fetchParkings();
  }, []);

  useEffect(() => {
    const loader = new Loader({
      apiKey: 'AIzaSyDKMElZFbnEqcDzQwz9Gaz7u8-wcvp-1xE',
      version: 'weekly',
    });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 47.918873, lng: 106.917041 },
        zoom: 12,
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          setForm((prevForm) => ({
            ...prevForm,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));

          if (marker) {
            marker.setPosition({ lat, lng });
          } else {
            const newMarker = new google.maps.Marker({
              position: { lat, lng },
              map,
            });
            setMarker(newMarker);
          }
        }
      });

      setMapInstance(map);
    });
  }, []);

  useEffect(() => {
    if (mapInstance && parkings.length > 0) {
      parkings.forEach((parking) => {
        const position = {
          lat: parseFloat(parking.latitude),
          lng: parseFloat(parking.longitude),
        };

        new google.maps.Marker({
          position,
          map: mapInstance,
          title: parking.name,
        });
      });
    }
  }, [mapInstance, parkings]);

  const fetchParkings = async () => {
    const res = await axios.get<ParkingLot[]>(`${API_URL}/parkinglot`);
    setParkings(res.data);
  };

  const fetchParkingById = async (lotId: number) => {
    const res = await axios.get<ParkingLot>(`${API_URL}/parkinglot/${lotId}`);
    setForm(res.data);
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && form.lotId) {
      await axios.put(`${API_URL}/parkinglot/${form.lotId}`, form);
    } else {
      await axios.post(`${API_URL}/parkinglot`, form);
    }

    setForm({
      name: '',
      total_capacity: 0,
      latitude: '',
      longitude: '',
      type: 'public',
    });
    setIsEditing(false);
    fetchParkings();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total_capacity' ? Number(value) : value,
    }));
  };

  const handleDelete = async (lotId: number) => {
    await axios.delete(`${API_URL}/parkinglot/${lotId}`);
    fetchParkings();
  };

  return (
    <div className="flex h-screen w-full">
      {/* Map Section */}
      <div id="map" className="w-[70%] h-full"></div>

      {/* Admin Section */}
      <div className="w-[30%] p-4 overflow-y-auto bg-gray-100">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full border p-2"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            className="w-full border p-2"
            name="total_capacity"
            placeholder="Spots"
            type="number"
            value={form.total_capacity}
            onChange={handleChange}
          />
          <input
            className="w-full border p-2"
            name="latitude"
            placeholder="Latitude"
            value={form.latitude}
            onChange={handleChange}
          />
          <input
            className="w-full border p-2"
            name="longitude"
            placeholder="Longitude"
            value={form.longitude}
            onChange={handleChange}
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border p-2"
          >
            <option value="public">Public</option>
            <option value="paid">Paid</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            {isEditing ? 'Update Parking' : 'Add Parking'}
          </button>
        </form>

        <h3 className="mt-6 text-lg font-bold">All Parkings:</h3>
        <div className="grid grid-cols-1 gap-3 mt-3">
          {parkings.map((p) => (
            <div
              key={p.lotId}
              className="bg-white p-3 shadow rounded border border-gray-200"
            >
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm">
                {p.type} - {p.total_capacity} spots
              </p>
              <p className="text-xs text-gray-500">
                ({p.latitude}, {p.longitude})
              </p>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => fetchParkingById(p.lotId)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(p.lotId)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
