import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import logo2 from "../assets/logo2.png";

function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1400);

    const finishTimer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between py-12 px-6 select-none transition-opacity duration-400 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full h-8" />

      <div className="flex flex-col items-center justify-center gap-4 animate-splash-logo">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-36 h-36 bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Logo image */}
          <img
            src={logo}
            alt="Vistagram"
            className="w-48 sm:w-56 h-auto object-contain relative z-10 scale-125 hover:scale-130 transition duration-300"
            style={{ mixBlendMode: "screen" }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 opacity-90 transition duration-700">
        <span className="text-[11px] font-medium tracking-widest text-gray-400 uppercase">
          from
        </span>
        <span className="text-sm font-extrabold tracking-wider bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent">
          VISTAGRAM
        </span>
      </div>
    </div>
  );
}

export default SplashScreen;
