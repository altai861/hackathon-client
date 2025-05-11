import React, { useEffect, useState, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import axios from 'axios';
import { Pencil, Trash2 } from 'lucide-react';

import API_URL from '../../api';
import MAP_API from '../../map_api';

interface ParkingLot {
  lotId: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  address: string;
  current_occupancy: number;
  paid: boolean;
  active: boolean;
}

interface ParkingForm {
  lotId?: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  address: string;
  current_occupancy: number;
  type: string;
  camera_active: string;
}

const Admin: React.FC = () => {
  const [parkings, setParkings] = useState<ParkingLot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState<ParkingForm>({
    name: '',
    total_capacity: 0,
    latitude: '',
    longitude: '',
    address: '',
    current_occupancy: 0,
    type: 'public',
    camera_active: 'inactive',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const markerMap = useRef<Map<number, google.maps.Marker>>(new Map());

  useEffect(() => {
    fetchParkings();
  }, []);

  useEffect(() => {
    const loader = new Loader({
      apiKey: MAP_API,
      version: 'weekly',
    });

    loader.load().then(() => {
      const map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
        center: { lat: 47.918873, lng: 106.917041 },
        zoom: 12,
      });

      mapRef.current = map;

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          setForm((prevForm) => ({
            ...prevForm,
            latitude: lat.toString(),
            longitude: lng.toString(),
          }));

          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          } else {
            const newMarker = new google.maps.Marker({
              position: { lat, lng },
              map,
              draggable: true,
            });

            newMarker.addListener('dragend', (e) => {
              const newLat = e.latLng?.lat();
              const newLng = e.latLng?.lng();
              if (newLat && newLng) {
                setForm((prevForm) => ({
                  ...prevForm,
                  latitude: newLat.toString(),
                  longitude: newLng.toString(),
                }));
              }
            });

            markerRef.current = newMarker;
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    // Clear all existing markers
    markerMap.current.forEach((marker) => marker.setMap(null));
    markerMap.current.clear();

    // Add markers for current parkings
    if (mapRef.current && parkings.length > 0) {
      parkings.forEach((parking) => {
        const position = {
          lat: parseFloat(parking.latitude.toString()),
          lng: parseFloat(parking.longitude.toString()),
        };

        const marker = new google.maps.Marker({
          position,
          map: mapRef.current!,
          title: parking.name,
        });

        markerMap.current.set(parking.lotId, marker);
      });
    }
  }, [parkings]);

  const fetchParkings = async () => {
    try {
      const res = await axios.get<ParkingLot[]>(`${API_URL}/parkinglot`);
      setParkings(res.data);
    } catch (error) {
      console.error("Error fetching parkings:", error);
    }
  };

  const fetchParkingById = async (lotId: number) => {
    const res = await axios.get<ParkingLot>(`${API_URL}/parkinglot/${lotId}`);
    const data = res.data;
    setForm({
      ...data,
      type: data.paid ? 'paid' : 'public',
      camera_active: data.active ? 'active' : 'inactive',
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      address: form.address,
      total_capacity: form.total_capacity,
      latitude: form.latitude,
      longitude: form.longitude,
      current_occupancy: form.current_occupancy,
      paid: form.type === 'paid',
      active: form.camera_active === 'active',
    };

    try {
      if (isEditing && form.lotId) {
        const res = await axios.put(`${API_URL}/parkinglot/${form.lotId}`, payload);
        if (res.status === 200) {
          fetchParkings();
        }
      } else {
        const res = await axios.post(`${API_URL}/parkinglot`, payload);
        if (res.status === 201) {
          const newParking: ParkingLot = res.data;
          setParkings((prev) => [newParking, ...prev]);
          setLastAddedId(newParking.lotId);
        }
      }

      setForm({
        name: '',
        total_capacity: 0,
        latitude: '',
        longitude: '',
        address: '',
        current_occupancy: 0,
        type: 'public',
        camera_active: 'inactive',
      });
      setIsEditing(false);

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (lotId: number) => {
    try {
      await axios.delete(`${API_URL}/parkinglot/${lotId}`);
      setParkings((prev) => prev.filter((p) => p.lotId !== lotId));

      // Remove marker from map and memory
      const marker = markerMap.current.get(lotId);
      if (marker) {
        marker.setMap(null);
        markerMap.current.delete(lotId);
      }
    } catch (error) {
      console.error("Error deleting parking:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'total_capacity' || name === 'current_occupancy' ? Number(value) : value,
    }));
  };

  const filteredParkings = parkings.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full">
      <div id="map" className="w-[60%] h-full"></div>

      <div className="w-[40%] p-6 bg-white overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Parking' : 'Админ Веб'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md mx-auto">
          <input className="w-full border rounded p-1.5" name="name" placeholder="Нэр" value={form.name} onChange={handleChange} />
          <input className="w-full border rounded p-1.5" name="address" placeholder="Хаяг" value={form.address} onChange={handleChange} />
          <input className="w-full border rounded p-1.5" name="total_capacity" type="number" placeholder="Багтаамж" value={form.total_capacity} onChange={handleChange} />
          <input className="w-full border rounded p-1.5" name="current_occupancy" type="number" placeholder="Одоогийн дүүргэлт" value={form.current_occupancy} onChange={handleChange} />
          <input className="w-full border rounded p-1.5" name="latitude" placeholder="Өргөрөг" value={form.latitude} onChange={handleChange} />
          <input className="w-full border rounded p-1.5" name="longitude" placeholder="Уртраг" value={form.longitude} onChange={handleChange} />
          <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded p-1.5">
            <option value="public">Нийтийн</option>
            <option value="paid">Төлбөртэй</option>
          </select>
          <select name="camera_active" value={form.camera_active} onChange={handleChange} className="w-full border rounded p-1.5">
            <option value="active">Камер идэвхтэй</option>
            <option value="inactive">Камер идэвхгүй</option>
          </select>

          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded py-2 px-4 w-full transition">
            {isEditing ? 'Update Parking' : 'Зогсоол нэмэх'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold mb-3">Зогсоолууд</h3>
          <input
            type="text"
            placeholder="Зогсоолын нэрээр хайх"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded p-2 mb-4"
          />

          <div className="space-y-4">
            {filteredParkings.map((p) => (
              <div key={p.lotId} className={`border rounded-lg shadow-sm p-4 ${p.lotId === lastAddedId ? 'bg-green-100' : 'bg-gray-50'} text-left`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-lg">{p.name}</h4>
                  <div className="flex space-x-2">
                    <button onClick={() => fetchParkingById(p.lotId)} className="text-blue-600 hover:text-blue-800">
                      <Pencil size={40} />
                    </button>
                    <button onClick={() => handleDelete(p.lotId)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={40} />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  📍 {p.address} <br />
                  🧾 {p.current_occupancy} / {p.total_capacity} occupied <br />
                  🌐 Lat: {p.latitude} | Lng: {p.longitude} <br />
                  🔒 {p.paid ? 'Төлбөртэй' : 'Нийтийн'} | 🎥 {p.active ? 'Идэвхтэй' : 'Идэвхгүй'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
