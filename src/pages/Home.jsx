import React, { useEffect, useState } from 'react';
import RSVPList from '../components/RSVPList';
import RSVPModal from '../components/RSVPModal';
import { OrnateFrameCorners } from '../components/CornerFlourish';
import GothicRain from '../components/GothicRain';
import GothicSpiders from '../components/GothicSpiders';
import bannerImage from '../assets/9e5956e7-f710-4541-8e98-597a4ed868f0.jpeg';

// Toast notification component
const Toast = ({ message, type, onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} className="toast-close">×</button>
  </div>
);

const Home = () => {
  const [toast, setToast] = useState(null);

  // Setup toast handler
  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 5000);
    };
    return () => {
      window.showToast = null;
    };
  }, []);

  return (
    <div className="home-page">
      {/* Background Rain Fall Animation */}
      <GothicRain />

      {/* Animated Spiders dangling on silk */}
      <GothicSpiders />

      {/* Content */}
      <div className="home-content">
        {/* Header Banner with maroon roses */}
        <header className="header-banner">
          <img src={bannerImage} alt="" className="header-banner-img" />
          <div className="header-banner-overlay">
            <OrnateFrameCorners color="rgba(220, 220, 220, 0.75)" size={72} />
            <h1 className="home-title">Aleckssa's Coming of Age</h1>
            <div className="header-event-details">
              <p className="event-date">September 27, 2026</p>
              <p className="event-time">5:00 — 9:00 P.M.</p>
              <a
                href="https://maps.app.goo.gl/tFoWKMfhf6Yd9KjC9"
                target="_blank"
                rel="noopener noreferrer"
                className="event-venue-link"
              >
                @ Stella Suites
              </a>
            </div>
          </div>
        </header>

        {/* RSVP Container */}
        <div className="rsvp-container">
          <OrnateFrameCorners color="rgba(192, 192, 192, 0.35)" size={56} />
          <RSVPList />
          <RSVPModal />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Home;
