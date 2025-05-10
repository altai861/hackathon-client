import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
export default function SignUp() {
  const [fadeIn, setFadeIn] = useState(false);
  const [cars, setCars] = useState([
    { id: 1, color: 'bg-red-400', delay: 0 },
    { id: 2, color: 'bg-green-400', delay: 1000 },
    { id: 3, color: 'bg-blue-400', delay: 2000 },
  ]);

  useEffect(() => {
    setFadeIn(true);
  }, []);
  
  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 overflow-hidden">
      
      {/* Logo on top-left corner */}
      <div className="absolute top-18 left-4 z-50 flex items-center -translate-y-1/2">

        <img src="/logo.png" alt="Logo" className="h-50 w-auto" />
      </div>

      {/* Road white lines */}
      <div className="absolute bottom-16 w-full flex justify-between px-10 z-20">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div key={idx} className="w-4 h-1 bg-white mx-1 rounded"></div>
        ))}
      </div>

      {/* Neon road */}
      <div className="absolute bottom-0 w-full h-32 bg-gray-700 z-10">
        <div className="absolute top-0 w-full h-1 bg-pink-400 blur-sm animate-pulse"></div>
      </div>

      {/* Parking lines */}
      <div className="absolute bottom-32 w-full flex justify-around z-10">
        <div className="w-1 h-32 bg-pink-300 rounded shadow-lg"></div>
        <div className="w-1 h-32 bg-pink-300 rounded shadow-lg"></div>
        <div className="w-1 h-32 bg-pink-300 rounded shadow-lg"></div>
      </div>

      {/* Cars */}
      {cars.map((car) => (
        <div
          key={car.id}
          className={`absolute bottom-28 left-[-20%] inline-block z-30`}
          style={{
            animation: `carDrive ${5 + car.id}s linear ${car.delay}ms infinite`,
          }}
        >
          <div className={`relative w-28 h-12 ${car.color} rounded-lg shadow-lg`}>
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-4 w-10 h-8 bg-white rounded-md flex justify-center gap-1 px-1">
              <div className="w-3 h-5 bg-blue-200 rounded-sm"></div>
              <div className="w-3 h-5 bg-blue-200 rounded-sm"></div>
            </div>
            <div className="absolute bottom-0 left-3 w-5 h-5 bg-black rounded-full shadow-sm"></div>
            <div className="absolute bottom-0 right-3 w-5 h-5 bg-black rounded-full shadow-sm"></div>
            <div className="absolute right-0 top-3 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}

      {/* Login box */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-gray-800 p-8 rounded-xl shadow-xl w-80 transition-opacity duration-1000 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign Up to Smart Parking</h2>
        <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        {/* Username */}
        <input
            type="text"
            placeholder="Username"
            className="w-full mb-4 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        {/* Password */}
        <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-4 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button className="w-full bg-pink-400 hover:bg-pink-500 text-white py-2 rounded transition">
          Sign In
        </button>
        <div className="mt-4 text-sm text-gray-400 text-center">
          <Link to="/" className="hover:underline">Back to Login</Link>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes carDrive {
          0% { transform: translateX(0); }
          100% { transform: translateX(120vw); }
        }
      `}</style>
    </div>
  );
}
