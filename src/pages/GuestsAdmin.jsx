import React, { useState } from 'react';
import { adminService, guestService } from '../services/rsvpService';
import { supabase } from '../supabase';
import {
  UserIcon,
  UsersIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

const GuestsAdmin = ({
  groups,
  guestsByGroup,
  individualGuests = [],
  filter,
  setFilter,
  deleteGuest,
  createGroup,
  updateGroup,
  deleteGroup,
  createGuest,
  updateGuest,
  refresh,
}) => {
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAddGuestModal, setShowAddGuestModal] = useState(false);
  const [showAddIndividualModal, setShowAddIndividualModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showEditGuestModal, setShowEditGuestModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingGuest, setEditingGuest] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Companion editing state
  const [companionNames, setCompanionNames] = useState([]);
  const [companionLoading, setCompanionLoading] = useState(false);

  // Delete states
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState(false);
  const [showDeleteGuestConfirm, setShowDeleteGuestConfirm] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [guestToDelete, setGuestToDelete] = useState(null);
  const [showQuickStatusModal, setShowQuickStatusModal] = useState(false);
  const [guestForQuickEdit, setGuestForQuickEdit] = useState(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Form states
  const [groupForm, setGroupForm] = useState({
    group_name: '',
    group_count_max: '1',
    is_predetermined: false,
    role: 'friends_debutante',
  });

  const [guestForm, setGuestForm] = useState({
    name: '',
    email: '',
    is_coming: null,
    in_group: true,
  });

  const [individualForm, setIndividualForm] = useState({
    name: '',
    email: '',
    max_count: 0,
  });

  // Toast
  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // --- GROUP CRUD ---
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await adminService.createGroup(groupForm);
      showToast('Group created successfully');
      setShowAddGroupModal(false);
      setGroupForm({ group_name: '', group_count_max: '1', is_predetermined: false, role: 'friends_debutante' });
      if (refresh) refresh();
    } catch (err) {
      showToast('Error creating group', 'error');
      console.error(err);
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await adminService.updateGroup(editingGroup.id, groupForm);
      showToast('Group updated successfully');
      setShowEditGroupModal(false);
      setEditingGroup(null);
      if (refresh) refresh();
    } catch (err) {
      showToast('Error updating group', 'error');
      console.error(err);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;
    try {
      await adminService.deleteGroup(groupToDelete.id);
      showToast('Group deleted successfully');
      setShowDeleteGroupConfirm(false);
      setGroupToDelete(null);
      if (refresh) refresh();
    } catch (err) {
      showToast('Error deleting group', 'error');
      console.error(err);
    }
  };

  // --- GUEST CRUD ---
  const handleCreateGuest = async (e) => {
    e.preventDefault();
    if (!selectedGroupId) return;
    try {
      await adminService.createGuest({
        ...guestForm,
        group_id: selectedGroupId,
        in_group: true,
        role: groups.find((g) => g.id === selectedGroupId)?.role || 'friends_debutante',
      });
      showToast('Guest added successfully');
      setShowAddGuestModal(false);
      setGuestForm({ name: '', email: '', is_coming: null, in_group: true });
      if (refresh) refresh();
    } catch (err) {
      showToast('Error adding guest', 'error');
      console.error(err);
    }
  };

  const handleEditGuest = async (e) => {
    e.preventDefault();
    if (!editingGuest) return;
    try {
      await adminService.updateGuest(editingGuest.id, guestForm);

      // If individual with companion slots, replace companion records
      if (editingGuest.role === 'individual' && !editingGuest.companion_of && companionNames.length > 0) {
        // Delete existing companions
        await supabase.from('guests').delete().eq('companion_of', editingGuest.id);

        // Insert updated companions (skip blank names)
        const toInsert = companionNames
          .filter((n) => n && n.trim())
          .map((n) => ({
            name: n.trim(),
            is_coming: editingGuest.is_coming ?? null,
            rsvp_submitted: editingGuest.rsvp_submitted ?? false,
            in_group: false,
            email: '',
            role: 'individual',
            companion_of: editingGuest.id,
          }));

        if (toInsert.length > 0) {
          await supabase.from('guests').insert(toInsert);
        }
      }

      showToast('Guest updated successfully');
      setShowEditGuestModal(false);
      setEditingGuest(null);
      setCompanionNames([]);
      if (refresh) refresh();
    } catch (err) {
      showToast('Error updating guest', 'error');
      console.error(err);
    }
  };

  const handleDeleteGuest = async () => {
    if (!guestToDelete) return;
    try {
      await guestService.deleteGuest(guestToDelete.id);
      showToast('Guest deleted successfully');
      setShowDeleteGuestConfirm(false);
      setGuestToDelete(null);
      if (refresh) refresh();
    } catch (err) {
      showToast('Error deleting guest', 'error');
      console.error(err);
    }
  };

  // --- INDIVIDUAL CRUD ---
  const handleCreateIndividual = async (e) => {
    e.preventDefault();
    try {
      await guestService.createIndividualGuest(individualForm);
      showToast('Individual guest created successfully');
      setShowAddIndividualModal(false);
      setIndividualForm({ name: '', email: '', max_count: 0 });
      if (refresh) refresh();
    } catch (err) {
      showToast('Error creating individual guest', 'error');
      console.error(err);
    }
  };

  // Quick status edit
  const handleQuickStatus = async (status) => {
    if (!guestForQuickEdit) return;
    try {
      await adminService.updateGuestQuickStatus(guestForQuickEdit.id, status);
      showToast('Status updated');
      setShowQuickStatusModal(false);
      setGuestForQuickEdit(null);
      if (refresh) refresh();
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    if (filter && filter !== 'all' && group.role !== filter) return false;
    if (searchTerm) {
      const matchGroup = group.group_name.toLowerCase().includes(searchTerm.toLowerCase());
      const guests = guestsByGroup[group.id] || [];
      const matchGuest = guests.some((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchGroup || matchGuest;
    }
    return true;
  });

  const filteredIndividuals = individualGuests.filter((g) => {
    if (filter && filter !== 'all' && filter !== 'individual') return false;
    if (searchTerm) return g.name.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  const getStatusBadge = (guest) => {
    if (guest.is_coming === true) return <span className="rsvp-card-badge badge-going">Going</span>;
    if (guest.is_coming === false) return <span className="rsvp-card-badge badge-not-going">Not Going</span>;
    return <span className="rsvp-card-badge badge-pending">Pending</span>;
  };

  return (
    <div className="guests-admin">
      {/* Header */}
      <div className="guests-admin-header">
        <div className="rsvp-category-filter">
          {['all', 'friends_debutante', 'relatives_debutante', 'friends_parents', 'individual'].map((cat) => (
            <button
              key={cat}
              className={`category-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat === 'all' ? 'All'
                : cat === 'friends_debutante' ? 'Friends of Debutante'
                : cat === 'relatives_debutante' ? 'Relatives of Debutante'
                : cat === 'friends_parents' ? 'Friends of Parents'
                : 'Individual'}
            </button>
          ))}
        </div>
        <select
          className="rsvp-category-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="friends_debutante">Friends of Debutante</option>
          <option value="relatives_debutante">Relatives of Debutante</option>
          <option value="friends_parents">Friends of Parents</option>
          <option value="individual">Individual</option>
        </select>
        <div className="guests-admin-actions">
          <button onClick={() => setShowAddGroupModal(true)}>
            <PlusIcon /> Add Group
          </button>
          <button onClick={() => setShowAddIndividualModal(true)}>
            <UserIcon /> Add Individual
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="admin-search">
        <MagnifyingGlassIcon />
        <input
          type="text"
          placeholder="Search guests or groups..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Individual Guests Section */}
      {(filter === 'all' || filter === 'individual') && filteredIndividuals.length > 0 && (
        <>
          <div className="rsvp-section-header">Individual Guests</div>
          {filteredIndividuals.map((guest) => (
            <div key={guest.id} className="admin-individual-card">
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 4 }}>
                  {guest.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  {guest.email || 'No email'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {getStatusBadge(guest)}
                  {(guest.max_count || 0) > 0 && (
                    <span
                      className={`guest-capacity-badge ${
                        (guest.companion_count || 0) >= guest.max_count
                          ? 'capacity-full'
                          : 'capacity-partial'
                      }`}
                      title={(guest.companion_count || 0) >= guest.max_count ? 'Companion slots filled' : 'Companion slots available'}
                    >
                      {(guest.companion_count || 0) >= guest.max_count ? '✦' : '⚠'} {guest.companion_count || 0} / {guest.max_count} companions
                    </span>
                  )}
                </div>
              </div>
              <div className="admin-guest-actions">
                <button onClick={() => { setGuestForQuickEdit(guest); setShowQuickStatusModal(true); }} title="Quick Status">
                  <PencilIcon />
                </button>
                <button
                  onClick={async () => {
                    setEditingGuest(guest);
                    setGuestForm({ name: guest.name, email: guest.email || '', is_coming: guest.is_coming, max_count: guest.max_count || 0 });
                    setShowEditGuestModal(true);
                    // Load existing companion names
                    if ((guest.max_count || 0) > 0) {
                      setCompanionLoading(true);
                      try {
                        const { data: comps } = await supabase
                          .from('guests')
                          .select('name')
                          .eq('companion_of', guest.id)
                          .order('created_at', { ascending: true });
                        const names = Array.from({ length: guest.max_count }, (_, i) =>
                          comps?.[i]?.name && comps[i].name !== 'Not Attending' ? comps[i].name : ''
                        );
                        setCompanionNames(names);
                      } catch {}
                      setCompanionLoading(false);
                    } else {
                      setCompanionNames([]);
                    }
                  }}
                  title="Edit"
                >
                  <PencilIcon />
                </button>
                <button className="danger" onClick={() => { setGuestToDelete(guest); setShowDeleteGuestConfirm(true); }} title="Delete">
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Group Sections */}
      {filteredGroups.map((group) => {
        const guests = guestsByGroup[group.id] || [];
        return (
          <div key={group.id} className="admin-group-card">
            <div className="admin-group-header">
              <h3>
                <UsersIcon style={{ width: 18, height: 18 }} />
                {group.group_name}
              </h3>
              <div className="admin-group-header-actions">
                <button
                  onClick={() => { setSelectedGroupId(group.id); setShowAddGuestModal(true); }}
                  title="Add Guest"
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                </button>
                <button
                  onClick={() => {
                    setEditingGroup(group);
                    setGroupForm({
                      group_name: group.group_name,
                      group_count_max: String(group.group_count_max),
                      is_predetermined: group.is_predetermined,
                      role: group.role,
                    });
                    setShowEditGroupModal(true);
                  }}
                  title="Edit Group"
                >
                  <PencilIcon style={{ width: 16, height: 16 }} />
                </button>
                <button
                  className="danger"
                  onClick={() => { setGroupToDelete(group); setShowDeleteGroupConfirm(true); }}
                  title="Delete Group"
                >
                  <TrashIcon style={{ width: 16, height: 16 }} />
                </button>
              </div>
            </div>
            <div className="admin-group-body">
              <div className="admin-group-meta">
                <span>Role: {group.role}</span>
                <span>{group.is_predetermined ? 'Predetermined' : 'Open'}</span>
                <span
                  className={`guest-capacity-badge ${
                    guests.length >= group.group_count_max
                      ? 'capacity-full'
                      : 'capacity-partial'
                  }`}
                  title={guests.length >= group.group_count_max ? 'Fully maxed out' : 'Not yet at max capacity'}
                >
                  {guests.length >= group.group_count_max ? '✦' : '⚠'} {guests.length} / {group.group_count_max}
                </span>
              </div>
              {guests.length === 0 ? (
                <div className="empty-state">No guests in this group</div>
              ) : (
                guests.map((guest) => (
                  <div key={guest.id} className="admin-guest-row">
                    <div className="admin-guest-info">
                      <div>
                        <div className="name">{guest.name}</div>
                        <div className="email">{guest.email || 'No email'}</div>
                      </div>
                      {getStatusBadge(guest)}
                    </div>
                    <div className="admin-guest-actions">
                      <button onClick={() => { setGuestForQuickEdit(guest); setShowQuickStatusModal(true); }} title="Quick Status">
                        <PencilIcon />
                      </button>
                      <button className="danger" onClick={() => { setGuestToDelete(guest); setShowDeleteGuestConfirm(true); }} title="Delete">
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}

      {filteredGroups.length === 0 && filteredIndividuals.length === 0 && (
        <div className="empty-state">No guests or groups found.</div>
      )}

      {/* ======= MODALS ======= */}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="modal-overlay" onClick={() => setShowAddGroupModal(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Group</h2>
            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input type="text" value={groupForm.group_name} onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })} required placeholder="e.g., Santos Family" />
              </div>
              <div className="form-group">
                <label>Max Guests</label>
                <input type="number" value={groupForm.group_count_max} onChange={(e) => setGroupForm({ ...groupForm, group_count_max: e.target.value })} min="1" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={groupForm.role} onChange={(e) => setGroupForm({ ...groupForm, role: e.target.value })}>
                  <option value="friends_debutante">Friends of Debutante</option>
                  <option value="relatives_debutante">Relatives of Debutante</option>
                  <option value="friends_parents">Friends of the Parents</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={groupForm.is_predetermined} onChange={(e) => setGroupForm({ ...groupForm, is_predetermined: e.target.checked })} />
                  Predetermined (admin sets guest names)
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <div className="modal-overlay" onClick={() => setShowEditGroupModal(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Group</h2>
            <form onSubmit={handleEditGroup}>
              <div className="form-group">
                <label>Group Name</label>
                <input type="text" value={groupForm.group_name} onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Max Guests</label>
                <input type="number" value={groupForm.group_count_max} onChange={(e) => setGroupForm({ ...groupForm, group_count_max: e.target.value })} min="1" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={groupForm.role} onChange={(e) => setGroupForm({ ...groupForm, role: e.target.value })}>
                  <option value="friends_debutante">Friends of Debutante</option>
                  <option value="relatives_debutante">Relatives of Debutante</option>
                  <option value="friends_parents">Friends of the Parents</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={groupForm.is_predetermined} onChange={(e) => setGroupForm({ ...groupForm, is_predetermined: e.target.checked })} />
                  Predetermined
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEditGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Guest to Group Modal */}
      {showAddGuestModal && (
        <div className="modal-overlay" onClick={() => setShowAddGuestModal(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Guest to Group</h2>
            <form onSubmit={handleCreateGuest}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} required placeholder="Guest name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })} placeholder="Optional email" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddGuestModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Guest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Individual Modal */}
      {showAddIndividualModal && (
        <div className="modal-overlay" onClick={() => setShowAddIndividualModal(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Individual Guest</h2>
            <form onSubmit={handleCreateIndividual}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={individualForm.name} onChange={(e) => setIndividualForm({ ...individualForm, name: e.target.value })} required placeholder="Guest name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={individualForm.email} onChange={(e) => setIndividualForm({ ...individualForm, email: e.target.value })} placeholder="Optional email" />
              </div>
              <div className="form-group">
                <label>Companion Slots (0 = going solo)</label>
                <input type="number" value={individualForm.max_count} onChange={(e) => setIndividualForm({ ...individualForm, max_count: Number(e.target.value) })} min="0" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddIndividualModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Guest</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Guest Modal */}
      {showEditGuestModal && (
        <div className="modal-overlay" onClick={() => { setShowEditGuestModal(false); setCompanionNames([]); }}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Guest</h2>
            <form onSubmit={handleEditGuest}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={guestForm.name} onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={guestForm.email} onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })} />
              </div>

              {/* Companion slots — only for individuals with max_count > 0 */}
              {editingGuest?.role === 'individual' && !editingGuest?.companion_of && (guestForm.max_count || 0) > 0 && (
                <div className="companion-edit-section">
                  <div className="companion-edit-label">
                    <UsersIcon style={{ width: 15, height: 15 }} />
                    Companion Slots ({guestForm.max_count})
                  </div>
                  {companionLoading ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '8px 0' }}>Loading companions…</div>
                  ) : (
                    Array.from({ length: Number(guestForm.max_count) }, (_, i) => (
                      <div className="form-group companion-input-row" key={i}>
                        <label>Companion {i + 1} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(leave blank if unknown)</span></label>
                        <input
                          type="text"
                          placeholder={`Companion ${i + 1} name`}
                          value={companionNames[i] || ''}
                          onChange={(e) => {
                            const updated = [...companionNames];
                            updated[i] = e.target.value;
                            setCompanionNames(updated);
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowEditGuestModal(false); setCompanionNames([]); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Status Modal */}
      {showQuickStatusModal && guestForQuickEdit && (
        <div className="modal-overlay" onClick={() => setShowQuickStatusModal(false)}>
          <div className="modal-content admin-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Update Status: {guestForQuickEdit.name}</h2>
            <div className="quick-status-options">
              <button className="quick-status-btn" onClick={() => handleQuickStatus(true)}>
                ✅ Going
              </button>
              <button className="quick-status-btn" onClick={() => handleQuickStatus(false)}>
                ❌ Not Going
              </button>
              <button className="quick-status-btn" onClick={() => handleQuickStatus(null)}>
                ⏳ Reset to Pending
              </button>
            </div>
            <div className="modal-actions" style={{ marginTop: 'var(--space-md)' }}>
              <button className="btn-secondary" onClick={() => setShowQuickStatusModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm */}
      {showDeleteGroupConfirm && groupToDelete && (
        <div className="confirm-modal-overlay" onClick={() => setShowDeleteGroupConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Group</h3>
            <p>Are you sure you want to delete "{groupToDelete.group_name}" and all its guests? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteGroupConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDeleteGroup} style={{ background: 'var(--color-danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Guest Confirm */}
      {showDeleteGuestConfirm && guestToDelete && (
        <div className="confirm-modal-overlay" onClick={() => setShowDeleteGuestConfirm(false)}>
          <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Guest</h3>
            <p>Are you sure you want to delete "{guestToDelete.name}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteGuestConfirm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDeleteGuest} style={{ background: 'var(--color-danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className={`toast toast-${toastType}`}>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="toast-close">×</button>
        </div>
      )}
    </div>
  );
};

export default GuestsAdmin;
