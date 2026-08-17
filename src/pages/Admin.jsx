import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { adminService, guestService } from '../services/rsvpService';
import Dashboard from './Dashboard';
import GuestsAdmin from './GuestsAdmin';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [groups, setGroups] = useState([]);
  const [allGuests, setAllGuests] = useState([]);
  const [guestsByGroup, setGuestsByGroup] = useState({});
  const [individualGuests, setIndividualGuests] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const fetchedGroups = await adminService.listGroups();
      setGroups(fetchedGroups);

      const guests = await guestService.getAllGuests();
      setAllGuests(guests);

      // Organize guests by group
      const organized = {};
      for (const group of fetchedGroups) {
        organized[group.id] = guests.filter((g) => g.group_id === group.id);
      }
      setGuestsByGroup(organized);

      // Get standalone individuals
      const individuals = guests.filter(
        (g) => g.role === 'individual' && g.in_group === false && !g.group_id
      );
      setIndividualGuests(individuals);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading-spinner">Loading admin panel...</div>;
  }

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <h1>Aleckssa's 18th — Admin</h1>
        <nav className="admin-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={activeTab === 'guests' ? 'active' : ''}
            onClick={() => setActiveTab('guests')}
          >
            Guest Management
          </button>
        </nav>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </header>

      <main className="admin-body">
        {activeTab === 'dashboard' && (
          <Dashboard groups={groups} allGuests={allGuests} />
        )}

        {activeTab === 'guests' && (
          <GuestsAdmin
            groups={groups}
            guestsByGroup={guestsByGroup}
            individualGuests={individualGuests}
            filter={filter}
            setFilter={setFilter}
            deleteGuest={guestService.deleteGuest}
            createGroup={adminService.createGroup}
            updateGroup={adminService.updateGroup}
            deleteGroup={adminService.deleteGroup}
            createGuest={adminService.createGuest}
            updateGuest={adminService.updateGuest}
            refresh={loadData}
          />
        )}
      </main>
    </div>
  );
};

export default Admin;
