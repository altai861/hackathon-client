import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";

const features = [
  {
    icon: "🚗",
    title: "Зогсоол Илрүүлэх",
    description: "Хотын хаа сайгүй яг одоо сул байгаа зогсоолыг олоорой.",
  },
  {
    icon: "🗺️",
    title: "Интерактив Газрын Зураг",
    description:
      "Сул болон дүүрсэн зогсоолыг газрын зураг дээр харах боломжтой.",
  },
  {
    icon: "📍",
    title: "Байршил Хуваалцах",
    description: "Өөрийн одоогийн зогсоолын байршлыг хадгалах, хуваалцах.",
  },
  {
    icon: "📊",
    title: "Зогсоолын Статистик",
    description: "Хэрэглэгчийн зогсоолын ашиглалт, статистик мэдээллийг харах.",
  },
];

const demoImages = [
  { src: "/1.jpg", alt: "Төвийн Зогсоол" },
  { src: "/2.jpg", alt: "Их Хотын Зогсоол" },
  { src: "/3.jpg", alt: "Олон Нийтийн Зогсоол" },
];

export const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  const toggleMode = () => setDarkMode(!darkMode);
  const themeClasses = darkMode
    ? "bg-gray-900 text-gray-100"
    : "bg-gray-50 text-gray-900";

  const carControls = useAnimation();

  // Trigger the car animation at intervals
  // Trigger the car animation at intervals
  // Trigger the car animation at intervals
  useEffect(() => {
    const startAnimation = async () => {
      await carControls.start({
        x: 1220,
        rotate: 0,
        transition: { duration: 3, ease: "easeInOut" },
      });
      // Pause at the parking spot
      await carControls.start({
        x: 1220,
        y: 0,
        rotate: 0,
        transition: { duration: 0 },
      });

      // Add a small pause at the parking spot
      await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 second stop

      // Reset to the start position
      await carControls.start({
        x: -200,
        y: 0,
        rotate: 0,
        transition: { duration: 4 },
      });
    };

    startAnimation(); // Run immediately

    const interval = setInterval(() => {
      startAnimation();
    }, 10000); // Repeat every 8 seconds

    return () => clearInterval(interval);
  }, [carControls]);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeClasses}`}
    >
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
        <h1 className="text-2xl font-bold">Зогсоолын туслах</h1>
        <button
          onClick={toggleMode}
          className="px-4 py-2 border rounded-lg font-bold transition-colors duration-300 bg-gray-400 text-white hover:bg-gray-300"
        >
          {darkMode ? "☀" : "🌙"}
        </button>
      </header>

      {/* Hero Section */}
      <section
        className={`text-center py-16 transition-colors duration-300 ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="container mx-auto px-6"
        >
          <h2 className="text-4xl font-bold mb-4">Сул зогсоол олъё</h2>
          <p className="text-lg max-w-2xl mx-auto mb-8">
            Хотод зогсоол олоход хэцүү байна уу? Бид танд
            зогсоол олоход тусална - цаг хэмнэнэ, стресс бууруулна, мөн зам дээр
            зогсоолын драмаас зайлсхийх боломжийг олгоно. 😉
          </p>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/map")}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            Одоо Хайх
          </motion.button>
        </motion.div>
        {/* Road */}
        <div
          className={`absolute top-1/2 left-0 w-full h-16 rounded-sm transition-colors duration-300 ${
            darkMode ? "bg-gray-600" : "bg-gray-300"
          }`}
        ></div>

        {/* Parking Spot */}
        <div
          className={`absolute right-10 top-1/2 -translate-y-1/3 w-28 h-60 border-4 rounded-md flex flex-col items-center justify-center transition-colors duration-300 ${
            darkMode
              ? "bg-gray-700 border-gray-500 text-gray-200"
              : "bg-gray-200 border-gray-500 text-gray-700"
          }`}
        >
          <span className="text-3xl">🅿️</span>
          <span className="text-sm">Зогсоол</span>
        </div>

        {/* Repeating Car Animation */}
        <motion.div
          animate={carControls}
          className={`absolute left-0 top-1/2 -translate-y-1/9 flex items-center justify-center text-white font-bold text-6xl transition-colors duration-300`}
        >
          🚗
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        className={`container mx-auto py-16 px-6 transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-white"
        }`}
      >
        <h2 className="text-4xl font-bold text-center mb-12">
          Системийн Онцлох Шинж Чанарууд
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -10, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-8 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 transform cursor-pointer 
                ${darkMode ? "bg-gray-800" : "bg-white"}`}
              onClick={() => navigate("/map")}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 6 }}
                className="text-6xl mb-4"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-2xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-base mb-4">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Images */}
      <section
        className={`container mx-auto py-16 px-6 transition-colors duration-300 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Зогсоолын Жишээ
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demoImages.map((image, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-center"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 rounded-lg object-cover shadow-lg mb-4"
              />
              <p className="text-lg font-semibold">{image.alt}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`text-center py-8 transition-colors duration-300 ${
          darkMode
            ? "bg-gray-800 text-gray-100 border-gray-700"
            : "bg-gray-100 text-gray-900 border-gray-300"
        } border-t`}
      >
        <p>
          © 2025 Ухаалаг Зогсоолын Систем | 📧{" "}
          <a href="mailto:info@smartparking.mn" className="underline">
            info@smartparking.mn
          </a>
        </p>
      </footer>
    </div>
  );
};
