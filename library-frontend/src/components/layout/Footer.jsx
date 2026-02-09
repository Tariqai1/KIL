import React from "react";
import { Link } from "react-router-dom";
import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/solid";

import {
  FaYoutube,
  FaFacebookF,
  FaXTwitter,
  FaInstagram,
} from "react-icons/fa";

const Footer = () => {
  // ✅ Social Links (Your Provided Links)
  const socialLinks = [
    {
      name: "YouTube",
      url: "https://youtube.com/@markaz-ahle-hadees-kokan?si=0P3jFBhjzKzsLCaf",
      icon: <FaYoutube className="w-5 h-5" />,
      color: "hover:bg-red-600 hover:border-red-400",
    },
    
    {
      name: "Facebook Post",
      url: "https://www.facebook.com/share/p/1KApR5ZNkf/",
      icon: <FaFacebookF className="w-5 h-5" />,
      color: "hover:bg-blue-700 hover:border-blue-500",
    },
    {
      name: "X (Twitter)",
      url: "https://x.com/AhleHadeesKokan",
      icon: <FaXTwitter className="w-5 h-5" />,
      color: "hover:bg-black hover:border-gray-500",
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/markazahlehadeeskokan?igsh=NnVobmRhMHdibDJv",
      icon: <FaInstagram className="w-5 h-5" />,
      color: "hover:bg-pink-600 hover:border-pink-400",
    },
  ];

  return (
    <footer className="bg-[#001D3D] text-white pt-16 pb-8 font-sans border-t border-[#F4A261]/20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* 1. Brand Section */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-[#F4A261]/50">
              <BuildingLibraryIcon className="w-6 h-6 text-[#F4A261]" />
            </div>
            <span className="text-xl font-serif font-bold text-white tracking-wide">
              Kokan Library
            </span>
          </div>

          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            The largest free center of Urdu, Arabic, and English Islamic books.
            Dedicated to preserving and sharing knowledge with the world.
          </p>

          {/* ✅ Social Icons (Best in Best) */}
          <div>
            <h4 className="text-[#F4A261] font-bold text-sm uppercase tracking-widest mb-4">
              Follow Us
            </h4>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.name}
                  className={`
                    group relative
                    w-11 h-11 rounded-full
                    flex items-center justify-center
                    bg-white/10 border border-white/20
                    transition-all duration-300
                    hover:scale-110 active:scale-95
                    ${item.color}
                    shadow-md hover:shadow-xl
                  `}
                >
                  {/* Glow Effect */}
                  <span
                    className="
                      absolute inset-0 rounded-full
                      opacity-0 group-hover:opacity-100
                      blur-md transition-all duration-300
                      bg-white/20
                    "
                  ></span>

                  {/* Icon */}
                  <span
                    className="
                      relative z-10 text-white
                      transition-transform duration-300
                      group-hover:-translate-y-0.5 group-hover:rotate-6
                    "
                  >
                    {item.icon}
                  </span>
                </a>
              ))}
            </div>

            <p className="text-gray-400 text-xs mt-4 leading-relaxed">
              Stay connected with Markaz Ahle Hadees Kokan on social media.
            </p>
          </div>
        </div>

        {/* 2. Quick Links */}
        <div>
          <h3 className="text-[#F4A261] font-bold text-sm uppercase tracking-widest mb-6">
            Quick Links
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <Link
                to="/"
                className="hover:text-white hover:translate-x-1 transition-all block"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/books"
                className="hover:text-white hover:translate-x-1 transition-all block"
              >
                Book Library
              </Link>
            </li>
            <li>
              <Link
                to="/authors"
                className="hover:text-white hover:translate-x-1 transition-all block"
              >
                Authors
              </Link>
            </li>
            <li>
              <Link
                to="/publishers"
                className="hover:text-white hover:translate-x-1 transition-all block"
              >
                Publishers
              </Link>
            </li>
          </ul>
        </div>

        {/* 3. Resources */}
        <div>
          <h3 className="text-[#F4A261] font-bold text-sm uppercase tracking-widest mb-6">
            Resources
          </h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Excel File Download
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                Our Other Projects
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                About Us
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-white transition-colors">
                Admin Login
              </Link>
            </li>
          </ul>
        </div>

        {/* 4. Contact Info */}
        <div>
          <h3 className="text-[#F4A261] font-bold text-sm uppercase tracking-widest mb-6">
            Contact Us
          </h3>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <MapPinIcon className="w-5 h-5 text-[#F4A261] mt-0.5 shrink-0" />
              <span>
                123 Islamic Center Road,
                <br />
                Kokan Region, India
              </span>
            </li>
            <li className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-[#F4A261] shrink-0" />
              <span>contact@kokanlibrary.com</span>
            </li>
            <li className="flex items-center gap-3">
              <PhoneIcon className="w-5 h-5 text-[#F4A261] shrink-0" />
              <span>+91 123 456 7890</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <p>
          &copy; {new Date().getFullYear()} Kokan Islamic Library. All rights
          reserved.
        </p>
        <p>Designed for Knowledge</p>
      </div>
    </footer>
  );
};

export default Footer;
