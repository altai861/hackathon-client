import React, { useEffect, useState} from "react";
import type { ChangeEvent } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import API_URL from "../../api";

// Type for a single parking lot entry
interface ParkingLot {
  lotId: number;
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: "public" | "paid";
}

// Type for the form state (excluding lotId)
interface ParkingForm {
  name: string;
  total_capacity: number;
  latitude: string;
  longitude: string;
  type: "public" | "paid";
}

const Admin: React.FC = () => {
  const [parkings, setParkings] = useState<ParkingLot[]>([]);
  const [form, setForm] = useState<ParkingForm>({
    name: "",
    total_capacity: 0,
    latitude: "",
    longitude: "",
    type: "public"
  });

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    const res = await axios.get<ParkingLot[]>(`${API_URL}/parkinglot`);
    setParkings(res.data);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("Sending:", form);
    await axios.post(`${API_URL}/parkinglot`, form);
    setForm({ name: "", total_capacity: 0, latitude: "", longitude: "", type: "public" });
    fetchParkings();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === "total_capacity" ? Number(value) : value
    }));
  };

  const handleDelete = async (lotId: number) => {
    await axios.delete(`${API_URL}/parkinglot/${lotId}`);
    fetchParkings();
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <input name="total_capacity" placeholder="Spots" type="number" value={form.total_capacity} onChange={handleChange} />
        <input name="latitude" placeholder="Latitude" value={form.latitude} onChange={handleChange} />
        <input name="longitude" placeholder="Longitude" value={form.longitude} onChange={handleChange} />
        <select name="type" value={form.type} onChange={handleChange}>
          <option value="public">Public</option>
          <option value="paid">Paid</option>
        </select>
        <button type="submit">Add Parking</button>
      </form>

      <h3>All Parkings:</h3>
      {parkings.map(p => (
        <div key={p.lotId}>
          <p>{p.name} - {p.type}</p>
          <button onClick={() => handleDelete(p.lotId)}>Delete</button>
        </div>
      ))}
    </div>
  );
};

export default Admin;
