/// <reference types="google.maps" />

import React, { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';

import API_URL from '../../api';
import MAP_API from '../../map_api';

interface ParkingLot {
  lotId: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: boolean;
  address: string;
  current_occupancy: number;
  camera_active: boolean;
}

interface ParkingForm {
  lotId?: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: 'public' | 'paid';
  address: string;
  current_occupancy: number;
  camera_active: 'active' | 'inactive';
}

const Admin: React.FC = () => {
  const [parkings, setParkings] = useState<ParkingLot[]>([]);
  const [form, setForm] = useState<ParkingForm>({
    name: '',
    total_capacity: 0,
    latitude: '',
    longitude: '',
    type: 'public',
    address: '',
    current_occupancy: 0,
    camera_active: 'inactive',
  });
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLatFocused, setIsLatFocused] = useState(false);
  const [isLngFocused, setIsLngFocused] = useState(false);

  useEffect(() => {
    fetchParkings();
  }, []);

  useEffect(() => {
    const loader = new Loader({
      apiKey: MAP_API,
      version: 'weekly',
    });

    loader
      .load()
      .then(() => {
        const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
          center: { lat: 47.918873, lng: 106.917041 },
          zoom: 12,
        });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng && (isLatFocused || isLngFocused)) {
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
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error);
      });
  }, [isLatFocused, isLngFocused, marker]);

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
    try {
      const res = await axios.get<ParkingLot[]>(`${API_URL}/parkinglot`);
      setParkings(res.data);
    } catch (error) {
      console.error("Error fetching parking lots:", error);
    }
  };

  const fetchParkingById = async (lotId: number) => {
    try {
      const res = await axios.get<ParkingLot>(`${API_URL}/parkinglot/${lotId}`);
      const data = res.data;

      setForm({
        ...data,
        type: data.type ? 'public' : 'paid',
        camera_active: data.camera_active ? 'active' : 'inactive',
      });

      setIsEditing(true);
    } catch (error) {
      console.error("Error fetching parking by ID:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...form,
      type: form.type === 'public',
      camera_active: form.camera_active === 'active',
    };

    try {
      if (isEditing && form.lotId) {
        await axios.put(`${API_URL}/parkinglot/${form.lotId}`, payload);
      } else {
        await axios.post(`${API_URL}/parkinglot`, payload);
      }

      setForm({
        name: '',
        total_capacity: 0,
        latitude: '',
        longitude: '',
        type: 'public',
        address: '',
        current_occupancy: 0,
        camera_active: 'inactive',
      });
      setIsEditing(false);
      fetchParkings();
      setMarker(null);
    } catch (error) {
      console.error("Error submitting parking lot:", error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total_capacity' || name === 'current_occupancy' ? Number(value) : value,
    }));
  };

  const handleDelete = async (lotId: number) => {
    try {
      await axios.delete(`${API_URL}/parkinglot/${lotId}`);
      fetchParkings();
    } catch (error) {
      console.error("Error deleting parking lot:", error);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <div id="map" className="w-[70%] h-full"></div>

      <div className="w-[30%] p-4 overflow-y-auto bg-gray-100">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full border p-2" name="name" placeholder="Нэр" value={form.name} onChange={handleChange} />
          <input className="w-full border p-2" name="address" placeholder="Хаяг" value={form.address} onChange={handleChange} />
          <input className="w-full border p-2" name="total_capacity" type="number" placeholder="Багтаамж" value={form.total_capacity} onChange={handleChange} />
          <input className="w-full border p-2" name="current_occupancy" type="number" placeholder="Одоогийн Дүүргэлт" value={form.current_occupancy} onChange={handleChange} />
          <input className="w-full border p-2" name="latitude" placeholder="Өргөрөг" value={form.latitude} onChange={handleChange} onFocus={() => setIsLatFocused(true)} onBlur={() => setIsLatFocused(false)} />
          <input className="w-full border p-2" name="longitude" placeholder="Уртраг" value={form.longitude} onChange={handleChange} onFocus={() => setIsLngFocused(true)} onBlur={() => setIsLngFocused(false)} />

          <select name="type" value={form.type} onChange={handleChange} className="w-full border p-2">
            <option value="public">Нийтийн</option>
            <option value="paid">Төлбөртэй</option>
          </select>

          <select name="camera_active" value={form.camera_active} onChange={handleChange} className="w-full border p-2">
            <option value="active">Камер идэвхтэй</option>
            <option value="inactive">Камер идэвхгүй</option>
          </select>

          <button type="submit" className="bg-blue-500 text-white py-2 px-4 w-full">
            {isEditing ? 'Update Parking' : 'Add Parking'}
          </button>
        </form>

        <div className="mt-4">
          <h3>Авто зогсоолууд</h3>
          <ul className="space-y-2">
            {parkings.map((parking) => (
              <li key={parking.lotId} className="flex justify-between">
                <div>{parking.name}</div>
                <div>
                  <button className="text-red-500" onClick={() => handleDelete(parking.lotId)}>Delete</button>
                  <button className="text-blue-500 ml-2" onClick={() => fetchParkingById(parking.lotId)}>Edit</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Admin;
