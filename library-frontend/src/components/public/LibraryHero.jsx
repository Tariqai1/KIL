import React, { useEffect, useState } from "react";
import {
  BuildingLibraryIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/solid";
import { motion, useScroll, useTransform } from "framer-motion";

const STAR_COLORS = [
  "rgba(255,255,255,.9)",
  "rgba(173,216,230,.9)",
  "rgba(244,162,97,.9)",
  "rgba(180,130,255,.9)",
];

const LibraryHero = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [night, setNight] = useState(true);
  const [shoot, setShoot] = useState(false);

  /* ================= Mouse Parallax ================= */
  useEffect(() => {
    const move = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth - 0.5) * 18,
        y: (e.clientY / window.innerHeight - 0.5) * 18,
      });
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  /* ================= Shooting Star ================= */
  useEffect(() => {
    if (!night) return;
    const t = setInterval(() => {
      setShoot(true);
      setTimeout(() => setShoot(false), 1200);
    }, Math.random() * 6000 + 5000);
    return () => clearInterval(t);
  }, [night]);

  /* ================= Scroll Zoom ================= */
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 300], [1, 0.93]);

  return (
    <motion.div
      style={{ scale }}
      className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden bg-[#000814]"
    >
      {/* ================= BACKGROUND ================= */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${mouse.x}px, ${mouse.y}px)`,
          transition: "transform .2s ease-out",
        }}
      >
        {/* Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,#000814,#001D3D,#003566)",
            backgroundSize: "300% 300%",
            animation: "gradientMove 30s ease infinite",
            opacity: night ? 1 : 0.6,
          }}
        />

        {/* ===== AI SCANNING LINES ===== */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-full h-[2px] bg-cyan-400/30 animate-scanY" />
          <div className="absolute h-full w-[2px] bg-blue-400/20 animate-scanX" />
        </div>

        {/* ===== BINARY CODE RAIN ===== */}
        {night &&
          [...Array(30)].map((_, i) => (
            <span
              key={i}
              className="absolute text-green-400/20 text-xs font-mono animate-binary"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            >
              0101 101
            </span>
          ))}

        {/* ===== NETWORK NODES ===== */}
        {night &&
          [...Array(20)].map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full bg-cyan-300/70 animate-node"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}

        {/* ===== STARS ===== */}
        {night &&
          [...Array(70)].map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full animate-star"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: STAR_COLORS[i % STAR_COLORS.length],
                boxShadow: `0 0 6px ${
                  STAR_COLORS[i % STAR_COLORS.length]
                }`,
                animationDuration: `${Math.random() * 20 + 15}s`,
              }}
            />
          ))}

        {/* ===== SHOOTING STAR ===== */}
        {night && shoot && (
          <span
            className="absolute w-40 h-[2px]"
            style={{
              top: "20%",
              left: "65%",
              background:
                "linear-gradient(90deg,white,transparent)",
              animation: "shoot 1.2s ease-out",
            }}
          />
        )}

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle,transparent 60%,rgba(0,0,0,.7))",
          }}
        />
      </div>

      {/* ================= DAY / NIGHT TOGGLE ================= */}
      <button
        onClick={() => setNight(!night)}
        className="absolute top-5 right-5 z-20 bg-white/10 backdrop-blur-md
        p-2 rounded-full border border-white/20"
      >
        {night ? (
          <SunIcon className="w-5 h-5 text-yellow-300" />
        ) : (
          <MoonIcon className="w-5 h-5 text-indigo-300" />
        )}
      </button>

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">

          {/* Left */}
          <motion.img
            src="https://cdn-icons-png.flaticon.com/512/3330/3330314.png"
            className="w-56 drop-shadow-[0_30px_60px_rgba(0,0,0,.9)]"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* Center */}
          <div className="text-center md:w-2/4 relative">
            {night && (
              <div
                className="absolute left-1/2 -translate-x-1/2 -top-10
                w-64 h-64 rounded-full blur-3xl opacity-40 animate-pulse"
                style={{
                  background:
                    "radial-gradient(circle,#f5d9a6,transparent 70%)",
                }}
              />
            )}

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="relative text-xl md:text-3xl text-[#F4A261] font-serif"
            >
              يَا أَيُّهَا الَّذِينَ آمَنُوا أَطِيعُوا اللَّهَ وَأَطِيعُوا الرَّسُولَ
            </motion.h2>

            {/* AI Cursor Line */}
            <div className="mx-auto mt-2 w-32 h-[2px] bg-cyan-400 animate-cursor" />

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="mt-4 text-4xl md:text-6xl font-serif font-bold text-white"
            >
              Kokan Islamic Library
            </motion.h1>
          </div>

          {/* Right */}
          <motion.div
            animate={{ rotate: [0, 4, 0] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="w-32 h-32 rounded-full bg-white/5 backdrop-blur-md
            border border-[#F4A261]/40 flex items-center justify-center
            shadow-[0_0_60px_rgba(244,162,97,.45)]"
          >
            <BuildingLibraryIcon className="w-16 h-16 text-[#F4A261]" />
          </motion.div>
        </div>
      </div>

      {/* ================= CSS ================= */}
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scanY {
          from { top: -10%; }
          to { top: 110%; }
        }
        .animate-scanY { animation: scanY 8s linear infinite; }

        @keyframes scanX {
          from { left: -10%; }
          to { left: 110%; }
        }
        .animate-scanX { animation: scanX 12s linear infinite; }

        @keyframes star {
          from { transform: translateY(0); opacity: .4; }
          to { transform: translateY(-120vh); opacity: 0; }
        }
        .animate-star { animation: star linear infinite; }

        @keyframes shoot {
          from { transform: translate(0,0); opacity: 1; }
          to { transform: translate(-600px,300px); opacity: 0; }
        }

        @keyframes binary {
          from { top: -10%; opacity: .1; }
          to { top: 110%; opacity: .4; }
        }
        .animate-binary { animation: binary 10s linear infinite; }

        @keyframes node {
          0%,100% { opacity: .3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        .animate-node { animation: node 4s ease-in-out infinite; }

        @keyframes cursor {
          0%,100% { opacity: .3; }
          50% { opacity: 1; }
        }
        .animate-cursor { animation: cursor 1.5s infinite; }
      `}</style>
    </motion.div>
  );
};

export default LibraryHero;
