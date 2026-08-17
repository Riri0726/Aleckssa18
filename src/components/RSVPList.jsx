import React, { useState } from 'react';
import { useRSVP } from '../context/RSVPContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const RSVPList = () => {
  const {
    organizedData,
    setSelectedGroup,
    setSelectedGuest,
    setIsModalOpen,
    loading,
    error,
    guestsByGroup,
  } = useRSVP();

  const [searchTerm, setSearchTerm] = useState('');

  // Determine if a group is locked (all responded)
  const isGroupLocked = (group) => {
    const guests = guestsByGroup[group.id] || [];
    if (guests.length === 0) return false;

    if (group.is_predetermined) {
      return guests.every((g) => g.is_coming !== null);
    } else {
      return guests.some((g) => g.is_coming !== null);
    }
  };

  // Handle group click
  const handleGroupClick = (group) => {
    if (isGroupLocked(group)) return;
    setSelectedGuest(null);
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  // Handle individual guest click
  const handleIndividualClick = (guest) => {
    if (guest.is_coming !== null) return;
    const tempGroup = {
      id: guest.id,
      group_name: guest.name,
      group_count_max: guest.max_count || 1,
      is_predetermined: true,
      role: 'individual',
    };
    setSelectedGroup(tempGroup);
    setSelectedGuest(guest);
    setIsModalOpen(true);
  };

  // Filter items by search term
  const filterBySearch = (name) => {
    if (!searchTerm) return true;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Get filtered data for each section
  const filteredFriendsDebutante = (organizedData.friends_debutante || []).filter((g) =>
    filterBySearch(g.group_name)
  );
  const filteredRelativesDebutante = (organizedData.relatives_debutante || []).filter((g) =>
    filterBySearch(g.group_name)
  );
  const filteredFriendsParents = (organizedData.friends_parents || []).filter((g) =>
    filterBySearch(g.group_name)
  );

  // Individual guests don't have a specific category role yet,
  // so they show in their own mini-section within the list
  const filteredIndividuals = (organizedData.individual || []).filter((g) =>
    filterBySearch(g.name)
  );

  const totalResults =
    filteredFriendsDebutante.length +
    filteredRelativesDebutante.length +
    filteredFriendsParents.length +
    filteredIndividuals.length;

  if (loading) {
    return <div className="loading-spinner">Loading guest list...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Render a section of grid cards
  const renderGroupSection = (title, groups) => {
    if (groups.length === 0) return null;
    return (
      <div className="guest-section">
        <h3 className="section-title">{title}</h3>
        <div className="uniform-guest-grid">
          {groups.map((group) => {
            const locked = isGroupLocked(group);
            return (
              <div
                key={group.id}
                className={`uniform-guest-card ${locked ? 'locked' : ''}`}
                onClick={() => !locked && handleGroupClick(group)}
              >
                <h4>{group.group_name}</h4>
                {locked ? (
                  <div className="lock-indicator">
                    {group.is_predetermined ? '🔒 All Responded' : '🔒 Submitted'}
                  </div>
                ) : (
                  <button
                    className="respond-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupClick(group);
                    }}
                  >
                    Respond
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderIndividualSection = (title, guests) => {
    if (guests.length === 0) return null;
    return (
      <div className="guest-section">
        <h3 className="section-title">{title}</h3>
        <div className="uniform-guest-grid">
          {guests.map((guest) => {
            const locked = guest.is_coming !== null;
            return (
              <div
                key={`individual_${guest.id}`}
                className={`uniform-guest-card ${locked ? 'locked' : ''}`}
                onClick={() => !locked && handleIndividualClick(guest)}
              >
                <h4>{guest.name}</h4>
                {locked ? (
                  <div className="lock-indicator">🔒 Response Submitted</div>
                ) : (
                  <button
                    className="respond-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIndividualClick(guest);
                    }}
                  >
                    Respond
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rsvp-list-container">
      {/* Search */}
      <div className="rsvp-search-container">
        <MagnifyingGlassIcon className="rsvp-search-icon" />
        <input
          type="text"
          className="rsvp-search-input"
          placeholder="Search your name or family name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* No results */}
      {totalResults === 0 && (
        <div className="rsvp-no-results">
          No guests found matching your search.
        </div>
      )}

      {/* Sections — stacked in order */}
      <div className="guest-sections">
        {renderGroupSection('Friends of Debutante', filteredFriendsDebutante)}
        {renderGroupSection('Relatives of Debutante', filteredRelativesDebutante)}
        {renderGroupSection('Friends of the Parents', filteredFriendsParents)}
        {renderIndividualSection('Individual Guests', filteredIndividuals)}
      </div>
    </div>
  );
};

export default RSVPList;
