import React, { useState, useEffect } from 'react';
import { useRSVP } from '../context/RSVPContext';
import { adminService } from '../services/rsvpService';
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';

const RSVPModal = () => {
  const {
    selectedGroup,
    selectedGuest,
    setSelectedGuest,
    groupGuests,
    guestsByGroup,
    isModalOpen,
    setIsModalOpen,
    loading,
    error,
    refresh,
  } = useRSVP();

  const [email, setEmail] = useState('');
  const [guestNames, setGuestNames] = useState(['']);
  const [isComing, setIsComing] = useState(true);

  // Calculate remaining slots and companion limits
  const remainingSlots =
    selectedGroup?.group_count_max && Array.isArray(groupGuests)
      ? Math.max(0, selectedGroup.group_count_max - groupGuests.length)
      : undefined;

  // Check if this is an individual guest
  const isIndividualGuest =
    selectedGroup?.role === 'individual' ||
    (selectedGroup?.is_predetermined && selectedGuest?.role === 'individual');

  // For individual guests, use the guest's max_count or group's count_max
  const individualMaxCount = isIndividualGuest
    ? (selectedGuest?.max_count ??
        selectedGroup?.group_count_max ??
        selectedGroup?.max_count ??
        1)
    : 0;

  // Determine max slots based on context
  let maxSlots;
  if (isIndividualGuest) {
    maxSlots = individualMaxCount;
  } else {
    maxSlots = typeof remainingSlots === 'number' ? remainingSlots : Infinity;
  }

  // Can add more guests
  const canAddMoreGuests = isIndividualGuest
    ? individualMaxCount > 1 && guestNames.length < individualMaxCount
    : guestNames.length < maxSlots;

  // Reset form when modal closes or group changes
  useEffect(() => {
    if (!isModalOpen) {
      setEmail('');
      setGuestNames(['']);
      setIsComing(true);
    } else {
      if (isIndividualGuest && selectedGuest?.name) {
        setGuestNames([selectedGuest.name]);
      } else if (isIndividualGuest && selectedGroup?.group_name) {
        setGuestNames([selectedGroup.group_name]);
      } else {
        setGuestNames(['']);
      }

      if (selectedGuest?.email) {
        setEmail(selectedGuest.email);
      }

      if (selectedGuest?.is_coming !== undefined && selectedGuest?.is_coming !== null) {
        setIsComing(selectedGuest.is_coming);
      }
    }
  }, [isModalOpen, isIndividualGuest, selectedGuest, selectedGroup]);

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedGuest(null);
    setEmail('');
    setGuestNames(['']);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGroup) return;

    try {
      if (selectedGroup.is_predetermined && selectedGuest) {
        // For predetermined guests (including individual guests)
        const updateData = { email, is_coming: isComing };

        if (isIndividualGuest && isComing) {
          const guestName =
            selectedGuest.name ||
            (guestNames[0]?.trim() || selectedGroup.group_name);
          updateData.name = guestName;

          // Prevent duplicate companion creation
          const existingCompanions = (
            guestsByGroup[selectedGuest.id] || []
          ).filter((g) => g.companion_of === selectedGuest.id);
          const companionNames = guestNames.slice(1).filter((name) => name.trim());

          if (existingCompanions.length === 0) {
            // Add provided companions as 'Going'
            for (const name of companionNames) {
              await adminService.createGuest({
                name: name.trim(),
                is_coming: true,
                rsvp_submitted: true,
                in_group: false,
                email: email,
                role: 'individual',
                companion_of: selectedGuest.id,
              });
            }
            // Add missing companions as 'Not Going'
            const missingCount = individualMaxCount - guestNames.length;
            for (let i = 0; i < missingCount; i++) {
              await adminService.createGuest({
                name: 'Not Attending',
                is_coming: false,
                rsvp_submitted: true,
                in_group: false,
                email: '',
                role: 'individual',
                companion_of: selectedGuest.id,
              });
            }
          }
        }

        await adminService.updateGuestRSVP(selectedGuest.id, updateData);
      } else if (!selectedGroup.is_predetermined) {
        // For unknown groups
        const names = isComing ? guestNames.filter((n) => n.trim()) : [];
        await adminService.addUnknownGroupGuests(
          selectedGroup.id,
          email,
          names,
          isComing
        );

        // Add missing companions as 'Not Going'
        if (
          isComing &&
          typeof remainingSlots === 'number' &&
          guestNames.length < remainingSlots
        ) {
          const missingCount = remainingSlots - guestNames.length;
          for (let i = 0; i < missingCount; i++) {
            await adminService.createGuest({
              group_id: selectedGroup.id,
              name: 'Not Attending',
              is_coming: false,
              rsvp_submitted: true,
              in_group: true,
              email: '',
              role: selectedGroup.role || 'family',
            });
          }
        }
      }

      const message = isComing
        ? 'RSVP submitted successfully! We look forward to seeing you!'
        : 'RSVP submitted successfully! Thank you for letting us know.';

      handleClose();

      if (window.showToast) {
        window.showToast(message, 'success');
      }

      if (refresh) {
        refresh();
      }
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      if (window.showToast) {
        window.showToast('Failed to submit RSVP. Please try again.', 'error');
      }
    }
  };

  const addGuestInput = () => {
    if (canAddMoreGuests) {
      setGuestNames([...guestNames, '']);
    }
  };

  const removeGuestInput = (index) => {
    const newGuestNames = guestNames.filter((_, i) => i !== index);
    setGuestNames(newGuestNames);
  };

  const handleGuestNameChange = (index, value) => {
    const newGuestNames = [...guestNames];
    newGuestNames[index] = value;
    setGuestNames(newGuestNames);
  };

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              if (selectedGroup?.is_predetermined && selectedGuest) {
                setSelectedGuest(null);
              } else {
                handleClose();
              }
            }}
            aria-label="Back"
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--color-silver-muted)' }}
          >
            <ArrowLeftIcon width={22} height={22} />
          </button>
          <button className="modal-close" onClick={handleClose} aria-label="Close" style={{ position: 'static' }}>
            <XMarkIcon width={18} height={18} />
          </button>
        </div>

        <h2>RSVP for {selectedGroup?.group_name}</h2>

        {/* Warning if group already has responses */}
        {selectedGroup &&
          (() => {
            const currentGroupGuests = guestsByGroup[selectedGroup.id] || [];
            let shouldShowWarning = false;
            let warningMessage = '';

            if (selectedGroup.is_predetermined) {
              if (currentGroupGuests.length > 0) {
                const allHaveFinalStatus = currentGroupGuests.every(
                  (guest) => guest.is_coming !== null
                );
                if (allHaveFinalStatus) {
                  shouldShowWarning = true;
                  warningMessage =
                    '⚠️ All guests in this group have already responded. You cannot submit additional RSVPs.';
                }
              }
            } else {
              const hasFinalStatus = currentGroupGuests.some(
                (guest) => guest.is_coming !== null
              );
              if (hasFinalStatus) {
                shouldShowWarning = true;
                warningMessage =
                  '⚠️ This group has already responded. You cannot submit additional RSVPs.';
              }
            }

            if (shouldShowWarning) {
              return <div className="warning-message">{warningMessage}</div>;
            }
            return null;
          })()}

        {/* Predetermined group: select guest */}
        {selectedGroup?.is_predetermined && !selectedGuest && (
          <div className="form-group">
            <label>Select your name</label>
            <div className="guest-card-grid">
              {groupGuests.length === 0 ? (
                <div className="no-guests-message">
                  <p>No guests found for this group. Please contact the organizer.</p>
                </div>
              ) : (
                groupGuests.map((g) => {
                  const isLocked = g.is_coming !== null;
                  const canSelect = !isLocked;

                  return (
                    <div
                      key={g.id}
                      className={`guest-card-mini ${isLocked ? 'locked' : ''}`}
                      onClick={() => canSelect && setSelectedGuest(g)}
                      style={{
                        cursor: canSelect ? 'pointer' : 'not-allowed',
                        opacity: isLocked ? 0.6 : 1,
                      }}
                    >
                      <div className="guest-name">{g.name}</div>
                      {isLocked ? (
                        <div className="guest-locked">🔒 RSVP Submitted</div>
                      ) : (
                        <div className="guest-respond">Respond</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {selectedGroup?.is_predetermined && selectedGuest && (
          <p className="guest-limit-info">Guest: {selectedGuest?.name}</p>
        )}

        {!selectedGroup?.is_predetermined && (
          <p className="guest-limit-info">Enter guest names for this group</p>
        )}

        {selectedGroup?.is_predetermined && selectedGuest && isIndividualGuest && (
          <p className="guest-limit-info">Please confirm your attendance</p>
        )}

        {/* RSVP Form */}
        <form onSubmit={handleSubmit} className="rsvp-form">
          {(!selectedGroup?.is_predetermined ||
            (selectedGroup?.is_predetermined && selectedGuest)) && (
            <div className="form-group">
              <label htmlFor="email">Contact Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>
          )}

          {selectedGroup?.is_predetermined ? (
            !selectedGuest ? null : (
              <div className="form-group">
                <label>Are you coming?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" checked={isComing === true} onChange={() => setIsComing(true)} /> Yes
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" checked={isComing === false} onChange={() => setIsComing(false)} /> No
                  </label>
                </div>
                {!isComing && (
                  <div className="info-message">
                    <p>💡 Selecting "No" will record that you cannot attend.</p>
                  </div>
                )}
                {isComing && isIndividualGuest && (
                  <div className="info-message success">
                    <p>
                      ✨ You can bring up to {Math.max(0, individualMaxCount - 1)}{' '}
                      {individualMaxCount - 1 === 1 ? 'companion' : 'companions'} with you.
                    </p>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--color-text-muted)' }}>
                      Maximum expected guests: {individualMaxCount}
                    </p>
                  </div>
                )}
                {isComing && isIndividualGuest && individualMaxCount > 1 && (
                  <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
                    <label>Your Companions:</label>
                    <div className="guest-inputs">
                      {guestNames.slice(1).map((name, index) => (
                        <div key={index + 1} className="guest-input-row">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => handleGuestNameChange(index + 1, e.target.value)}
                            placeholder="Companion name"
                            className="guest-name-input"
                          />
                          <button
                            type="button"
                            className="remove-guest-btn"
                            onClick={() => removeGuestInput(index + 1)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {canAddMoreGuests && (
                        <button type="button" className="add-guest-btn" onClick={addGuestInput}>
                          + Add Companion
                        </button>
                      )}
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        You can bring {Math.max(0, individualMaxCount - guestNames.length)} more{' '}
                        {individualMaxCount - guestNames.length === 1 ? 'companion' : 'companions'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          ) : (
            <>
              <div className="form-group">
                <label>Are you coming?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" checked={isComing === true} onChange={() => setIsComing(true)} /> Yes
                  </label>
                  <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" checked={isComing === false} onChange={() => setIsComing(false)} /> No
                  </label>
                </div>
                {!isComing && (
                  <div className="info-message">
                    <p>💡 Selecting "No" will record that your group cannot attend.</p>
                  </div>
                )}
              </div>

              {isComing && (
                <>
                  {(!isIndividualGuest || individualMaxCount > 1) && (
                    <div className="form-group">
                      <label>
                        {isIndividualGuest ? 'Your Name and Companions:' : 'Names of Attending Guests:'}
                      </label>
                      <div className="guest-inputs">
                        {guestNames.map((name, index) => (
                          <div key={index} className="guest-input-row">
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => handleGuestNameChange(index, e.target.value)}
                              placeholder={index === 0 ? 'Your name' : 'Companion name'}
                              className="guest-name-input"
                              required
                            />
                            {index > 0 && (
                              <button
                                type="button"
                                className="remove-guest-btn"
                                onClick={() => removeGuestInput(index)}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {canAddMoreGuests && (
                          <button type="button" className="add-guest-btn" onClick={addGuestInput}>
                            {isIndividualGuest ? '+ Add Companion' : '+ Add Another Guest'}
                          </button>
                        )}
                        {!isIndividualGuest && maxSlots !== Infinity && (
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            Remaining slots: {Math.max(0, maxSlots - guestNames.length)}
                          </span>
                        )}
                        {!isIndividualGuest && maxSlots === Infinity && (
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                            No limit on guests
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {isIndividualGuest && individualMaxCount <= 1 && (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--color-surface-raised)',
                        borderRadius: '8px',
                        textAlign: 'center',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        ✅ You're confirming attendance for: <strong>{selectedGroup?.group_name}</strong>
                      </span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={
              loading ||
              (selectedGroup?.is_predetermined && !selectedGuest) ||
              (!selectedGroup?.is_predetermined &&
                typeof remainingSlots === 'number' &&
                guestNames.length > remainingSlots) ||
              (!selectedGroup?.is_predetermined &&
                isComing === true &&
                guestNames.filter((n) => n.trim()).length === 0) ||
              (isIndividualGuest && isComing && !email.trim())
            }
          >
            {loading ? 'Submitting...' : 'Submit RSVP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RSVPModal;
