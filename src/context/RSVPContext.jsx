import React, { createContext, useState, useContext, useEffect } from 'react';
import { adminService, guestService } from '../services/rsvpService';

const RSVPContext = createContext();

export const RSVPProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [individualGuests, setIndividualGuests] = useState([]);
  const [organizedData, setOrganizedData] = useState({
    individual: [],
    friends_debutante: [],
    relatives_debutante: [],
    friends_parents: [],
  });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupGuests, setGroupGuests] = useState([]);
  const [guestsByGroup, setGuestsByGroup] = useState({});
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load groups and guests
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load groups
      const fetchedGroups = await adminService.listGroups();
      setGroups(fetchedGroups);

      // Load ALL guests
      const allGuests = await guestService.getAllGuests();

      // Separate individual guests (standalone, not in groups)
      const individualGuestsList = allGuests.filter(
        (guest) =>
          guest.role === 'individual' &&
          guest.in_group === false &&
          !guest.group_id
      );
      setIndividualGuests(individualGuestsList);

      // Load guests for groups
      const guestsData = {};
      for (const group of fetchedGroups) {
        guestsData[group.id] = allGuests.filter(
          (guest) => guest.group_id === group.id
        );
      }
      setGuestsByGroup(guestsData);

      // Organize data for display — groups by role
      // Individual guests are kept separately; RSVPList will mix them into sections
      const organized = {
        individual: individualGuestsList,
        friends_debutante: fetchedGroups.filter((group) => group.role === 'friends_debutante'),
        relatives_debutante: fetchedGroups.filter((group) => group.role === 'relatives_debutante'),
        friends_parents: fetchedGroups.filter((group) => group.role === 'friends_parents'),
      };
      setOrganizedData(organized);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };


  const openGroup = async (group) => {
    setSelectedGroup(group);
    setSelectedGuest(null);
    setIsModalOpen(false);
    if (group) {
      const guests = await adminService.listGuestsByGroup(group.id);
      setGroupGuests(guests);
    } else {
      setGroupGuests([]);
    }
  };

  const refresh = async () => {
    await loadData();
    // If a group was selected, refresh its guests too
    if (selectedGroup) {
      const guests = await adminService.listGuestsByGroup(selectedGroup.id);
      setGroupGuests(guests);
    }
  };

  const value = {
    groups,
    individualGuests,
    organizedData,
    selectedGroup,
    setSelectedGroup: openGroup,
    groupGuests,
    guestsByGroup,
    selectedGuest,
    setSelectedGuest,
    isModalOpen,
    setIsModalOpen,
    loading,
    error,
    refresh,
  };

  return (
    <RSVPContext.Provider value={value}>
      {children}
    </RSVPContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useRSVP = () => {
  const context = useContext(RSVPContext);
  if (!context) {
    throw new Error('useRSVP must be used within an RSVPProvider');
  }
  return context;
};
