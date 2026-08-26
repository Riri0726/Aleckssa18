import { supabase } from '../supabase.js';

// ============================================================
// GUEST SERVICE — Primary service for guest/group CRUD operations
// Adapted from YannaWedding's guestService + adminService
// Key difference: No guest_type (bride/groom) — all guests unified
// ============================================================
export const guestService = {

  // ----------------------------------------------------------
  // GUEST OPERATIONS
  // ----------------------------------------------------------

  /**
   * Create a standalone individual guest (not in a group)
   */
  async createIndividualGuest(guestData) {
    const { data, error } = await supabase
      .from('guests')
      .insert({
        name: guestData.name || '',
        email: guestData.email || '',
        max_count: Number(guestData.max_count) || 1,
        role: 'individual',  // Standalone individuals keep 'individual' role
        in_group: false,
        group_id: null,
        is_coming: null,
        rsvp_submitted: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating individual guest:', error);
      throw error;
    }
    return { id: data.id };
  },

  /**
   * Get all guests with their group info
   */
  async getAllGuests() {
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: true });

    if (guestsError) {
      console.error('Error getting all guests:', guestsError);
      throw guestsError;
    }

    // Get group information for guests that belong to groups
    const groupIds = [...new Set(guests.filter(g => g.group_id).map(g => g.group_id))];

    let groups = {};
    if (groupIds.length > 0) {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error getting groups:', groupsError);
        throw groupsError;
      }

      groupsData.forEach(group => {
        groups[group.id] = group;
      });
    }

    // Combine guest data with group info
    return guests.map(guest => ({
      ...guest,
      group_info: guest.group_id ? groups[guest.group_id] : null,
    }));
  },

  /**
   * Get guests organized by role
   */
  async getGuestsByRole() {
    const guests = await this.getAllGuests();
    return {
      individual: guests.filter(g => g.role === 'individual'),
      friends_debutante: guests.filter(g => g.role === 'friends_debutante'),
      relatives_debutante: guests.filter(g => g.role === 'relatives_debutante'),
      friends_parents: guests.filter(g => g.role === 'friends_parents'),
    };
  },

  /**
   * Get guest counts for dashboard stats (by role instead of bride/groom)
   */
  async getGuestCounts() {
    const guests = await this.getAllGuests();

    const countByRole = (role) => ({
      total: guests.filter(g => g.role === role).length,
      confirmed: guests.filter(g => g.role === role && g.is_coming === true).length,
      declined: guests.filter(g => g.role === role && g.is_coming === false).length,
      pending: guests.filter(g => g.role === role && g.is_coming === null).length,
    });

    const counts = {
      individual: countByRole('individual'),
      friends_debutante: countByRole('friends_debutante'),
      relatives_debutante: countByRole('relatives_debutante'),
      friends_parents: countByRole('friends_parents'),
    };

    counts.overall = {
      total: counts.individual.total + counts.friends_debutante.total + counts.relatives_debutante.total + counts.friends_parents.total,
      confirmed: counts.individual.confirmed + counts.friends_debutante.confirmed + counts.relatives_debutante.confirmed + counts.friends_parents.confirmed,
      declined: counts.individual.declined + counts.friends_debutante.declined + counts.relatives_debutante.declined + counts.friends_parents.declined,
      pending: counts.individual.pending + counts.friends_debutante.pending + counts.relatives_debutante.pending + counts.friends_parents.pending,
    };

    return counts;
  },

  /**
   * Update guest RSVP response
   */
  async updateGuestRSVP(guestId, { email, is_coming }) {
    const { error } = await supabase
      .from('guests')
      .update({
        email: email || '',
        is_coming: typeof is_coming === 'boolean' ? is_coming : null,
        rsvp_submitted: true,
        rsvp_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (error) {
      console.error('Error updating guest RSVP:', error);
      throw error;
    }
    return true;
  },

  /**
   * Update guest details (admin operation)
   */
  async updateGuest(guestId, updates) {
    const { error } = await supabase
      .from('guests')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (error) {
      console.error('Error updating guest:', error);
      throw error;
    }
    return true;
  },

  /**
   * Delete a guest. If the guest is an individual main guest, also delete companions.
   */
  async deleteGuest(guestId) {
    // First, get the guest to check if it has companions
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    if (fetchError) {
      console.error('Error fetching guest for delete:', fetchError);
      throw fetchError;
    }

    if (guest && guest.role === 'individual' && !guest.companion_of) {
      // Delete all companions first
      const { error: companionError } = await supabase
        .from('guests')
        .delete()
        .eq('companion_of', guestId);

      if (companionError) {
        console.error('Error deleting companions:', companionError);
        throw companionError;
      }
    }

    // Delete the guest itself
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
    return true;
  },

  // ----------------------------------------------------------
  // GROUP OPERATIONS
  // ----------------------------------------------------------

  /**
   * Create a group with optional pre-set guest names
   */
  async createGroupWithGuests(groupData, guestNames = []) {
    // Create group first
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        group_name: groupData.group_name,
        group_count_max: Number(groupData.group_count_max) || 0,
        is_predetermined: Boolean(groupData.is_predetermined) || false,
        role: groupData.role || 'friends_debutante',
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      throw groupError;
    }

    // Create guests for the group
    if (guestNames && guestNames.length > 0) {
      const guestsToInsert = guestNames
        .filter(name => name && name.trim())
        .map(name => ({
          name: name.trim(),
          email: '',
          max_count: 1,
          role: groupData.role || 'friends_debutante',
          in_group: true,
          group_id: group.id,
          is_coming: null,
          rsvp_submitted: false,
        }));

      if (guestsToInsert.length > 0) {
        const { error: guestsError } = await supabase
          .from('guests')
          .insert(guestsToInsert);

        if (guestsError) {
          console.error('Error creating guests for group:', guestsError);
          throw guestsError;
        }
      }
    }

    return { groupId: group.id };
  },

  /**
   * Get all groups
   */
  async getAllGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting all groups:', error);
      throw error;
    }
    return data;
  },

  /**
   * Delete a group and all its guests (cascade via FK)
   */
  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
    return true;
  },
};

// ============================================================
// ADMIN SERVICE — Legacy-compatible admin operations
// Mirrors YannaWedding's adminService interface for easy porting
// ============================================================
export const adminService = {
  async createGroup(group) {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        group_name: group.group_name,
        group_count_max: Number(group.group_count_max) || 0,
        is_predetermined: Boolean(group.is_predetermined) || false,
        role: group.role || 'friends_debutante',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      throw error;
    }
    return { id: data.id };
  },

  async listGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateGroup(groupId, updates) {
    const { error } = await supabase
      .from('groups')
      .update({
        ...updates,
        group_count_max: Number(updates.group_count_max) || 0,
        is_predetermined: Boolean(updates.is_predetermined) || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', groupId);

    if (error) throw error;
    return true;
  },

  async deleteGroup(groupId) {
    // Guests are cascade-deleted via FK constraint
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return true;
  },

  async createGuest(guest) {
    const { data, error } = await supabase
      .from('guests')
      .insert({
        group_id: guest.group_id || null,
        name: guest.name || '',
        is_coming: guest.is_coming ?? null,
        rsvp_submitted: guest.rsvp_submitted ?? false,
        in_group: guest.in_group ?? false,
        email: guest.email || '',
        role: guest.role || 'individual',
        companion_of: guest.companion_of || null,
        max_count: guest.max_count || 1,
      })
      .select()
      .single();

    if (error) throw error;
    return { id: data.id };
  },

  async listGuestsByGroup(groupId) {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async listAllGuests() {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  async updateGuestRSVP(guestId, { email, is_coming }) {
    const { error } = await supabase
      .from('guests')
      .update({
        email: email || '',
        is_coming: typeof is_coming === 'boolean' ? is_coming : null,
        rsvp_submitted: true,
        rsvp_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', guestId);

    if (error) throw error;
    return true;
  },

  async addUnknownGroupGuests(groupId, email, names, isComing) {
    if (isComing && names && names.length > 0) {
      const guestsToInsert = names
        .filter(n => n && n.trim())
        .map(n => ({
          group_id: groupId,
          name: n.trim(),
          is_coming: true,
          in_group: true,
          email: email || '',
          rsvp_submitted: true,
          rsvp_date: new Date().toISOString(),
        }));

      if (guestsToInsert.length > 0) {
        const { error } = await supabase.from('guests').insert(guestsToInsert);
        if (error) throw error;
      }
    } else if (!isComing) {
      // Create a placeholder guest record for "not coming"
      const { error } = await supabase.from('guests').insert({
        group_id: groupId,
        name: 'Family Cannot Attend',
        is_coming: false,
        in_group: true,
        email: 'N/A',
        rsvp_submitted: true,
        rsvp_date: new Date().toISOString(),
      });
      if (error) throw error;
    }
    return true;
  },

  async updateGuest(guestId, updates) {
    const { error } = await supabase
      .from('guests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', guestId);

    if (error) throw error;
    return true;
  },

  async updateGuestQuickStatus(guestId, status) {
    // 1. Fetch current guest details to check role and companions
    const { data: guest, error: fetchError } = await supabase
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();

    if (fetchError) throw fetchError;

    // 2. Update main guest status
    const { error: updateError } = await supabase
      .from('guests')
      .update({
        is_coming: status,
        rsvp_submitted: status !== null,
        updated_at: new Date().toISOString()
      })
      .eq('id', guestId);

    if (updateError) throw updateError;

    // 3. Handle companion records if it's a main individual guest
    if (guest.role === 'individual' && !guest.companion_of) {
      const companionSlots = guest.max_count || 0;
      if (companionSlots > 0) {
        // Remove any old companions first to prevent duplicates
        const { error: deleteError } = await supabase
          .from('guests')
          .delete()
          .eq('companion_of', guestId);

        if (deleteError) throw deleteError;

        // If status is Going or Not Going, populate companion slots as Not Attending
        if (status !== null) {
          const companionsToInsert = [];
          for (let i = 0; i < companionSlots; i++) {
            companionsToInsert.push({
              name: 'Not Attending',
              is_coming: false,
              rsvp_submitted: true,
              in_group: false,
              email: '',
              role: 'individual',
              companion_of: guestId,
            });
          }
          const { error: insertError } = await supabase
            .from('guests')
            .insert(companionsToInsert);

          if (insertError) throw insertError;
        }
      }
    }
    return true;
  },

  async deleteGuest(guestId) {
    const { error } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId);

    if (error) throw error;
    return true;
  },
};
