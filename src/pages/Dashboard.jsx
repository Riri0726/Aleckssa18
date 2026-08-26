import React from 'react';

const Dashboard = ({ groups, allGuests }) => {
  // Calculate expected guests based on max_count (total capacity)
  const calculateExpectedGuests = () => {
    let total = 0;

    // Count capacity from groups
    total += groups.reduce((groupTotal, group) => {
      if (group.group_count_max) {
        return groupTotal + group.group_count_max;
      } else {
        const groupGuests = allGuests.filter((guest) => guest.group_id === group.id);
        const maxCount = groupGuests.reduce((sum, guest) => sum + (guest.max_count || 1), 0);
        return groupTotal + maxCount;
      }
    }, 0);

    // Add standalone individual guests (not in any group)
    const standaloneGuests = allGuests.filter(
      (guest) =>
        guest.role === 'individual' &&
        guest.in_group === false &&
        !guest.group_id
    );
    total += standaloneGuests.reduce((sum, guest) => sum + (guest.max_count || 1), 0);

    return total;
  };

  const totalExpectedGuests = calculateExpectedGuests();

  // Count actual guests who have responded
  const respondedGuests = allGuests.filter(
    (g) =>
      g.rsvp_submitted === true &&
      g.is_coming !== null
  ).length;

  const pendingGuests = totalExpectedGuests - respondedGuests;

  // Count guests by attendance status
  const goingGuests = allGuests.filter(
    (g) =>
      g.is_coming === true &&
      g.rsvp_submitted === true
  ).length;

  const notGoingGuests = allGuests.filter(
    (g) => g.is_coming === false && g.rsvp_submitted === true
  ).length;

  // Calculate by category (uses new role names)
  const calculateByCategory = (role) => {
    const roleGroups = groups.filter((g) => g.role === role);
    let expectedCount = roleGroups.reduce((total, group) => {
      if (group.group_count_max) {
        return total + group.group_count_max;
      } else {
        const groupGuests = allGuests.filter((guest) => guest.group_id === group.id);
        return total + groupGuests.reduce((sum, guest) => sum + (guest.max_count || 1), 0);
      }
    }, 0);

    // Add standalone individual guests of this role
    const standaloneGuests = allGuests.filter(
      (guest) =>
        guest.role === role &&
        guest.in_group === false &&
        !guest.group_id
    );
    expectedCount += standaloneGuests.reduce((sum, guest) => sum + (guest.max_count || 1), 0);

    const actualGuests = allGuests.filter((g) => {
      const group = groups.find((grp) => grp.id === g.group_id);
      return group && group.role === role;
    });

    const allActualGuests = [...actualGuests, ...standaloneGuests];

    return {
      expected: expectedCount,
      responded: allActualGuests.filter((g) => g.rsvp_submitted).length,
      going: allActualGuests.filter((g) => g.is_coming === true).length,
      notGoing: allActualGuests.filter((g) => g.is_coming === false).length,
      pending: expectedCount - allActualGuests.filter((g) => g.rsvp_submitted).length,
      groups: roleGroups.length,
      individuals: standaloneGuests.length,
    };
  };

  const friendsDebutanteStats = calculateByCategory('friends_debutante');
  const relativesDebutanteStats = calculateByCategory('relatives_debutante');
  const friendsParentsStats = calculateByCategory('friends_parents');
  const individualStats = calculateByCategory('individual');

  // Count total groups and individuals
  const totalGroups = groups.length;
  const relativesGroups = groups.filter((g) => g.role === 'relatives_debutante').length;
  const friendsDebutanteGroups = groups.filter((g) => g.role === 'friends_debutante').length;
  const friendsParentsGroups = groups.filter((g) => g.role === 'friends_parents').length;
  const standaloneIndividuals = allGuests.filter(
    (guest) =>
      guest.role === 'individual' &&
      guest.in_group === false &&
      !guest.group_id
  ).length;

  return (
    <div className="dashboard-stats">
      <h2>Debut Dashboard</h2>

      {/* Main Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card highlight">
          <h3>Total Expected Guests</h3>
          <p className="stat-number large">{totalExpectedGuests}</p>
          <small>Based on max capacity</small>
        </div>
        <div className="stat-card">
          <h3>Responded</h3>
          <p className="stat-number going">{respondedGuests}</p>
          <small>
            {totalExpectedGuests > 0
              ? Math.round((respondedGuests / totalExpectedGuests) * 100)
              : 0}
            % response rate
          </small>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p className="stat-number pending">{pendingGuests}</p>
          <small>Awaiting response</small>
        </div>
      </div>

      {/* Attendance Response Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Going</h3>
          <p className="stat-number going">{goingGuests}</p>
          <small>Confirmed attendance</small>
        </div>
        <div className="stat-card">
          <h3>Not Going</h3>
          <p className="stat-number not-going">{notGoingGuests}</p>
          <small>Declined attendance</small>
        </div>
        <div className="stat-card">
          <h3>Still Deciding</h3>
          <p className="stat-number pending">{pendingGuests}</p>
          <small>Haven't responded yet</small>
        </div>
      </div>

      {/* Group Distribution */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Groups</h3>
          <p className="stat-number">{totalGroups}</p>
          <small>All group invitations</small>
        </div>
        <div className="stat-card">
          <h3>Friends of Debutante</h3>
          <p className="stat-number">{friendsDebutanteGroups}</p>
          <small>Debutante's friends groups</small>
        </div>
        <div className="stat-card">
          <h3>Relatives Groups</h3>
          <p className="stat-number">{relativesGroups}</p>
          <small>Relatives invites</small>
        </div>
        <div className="stat-card">
          <h3>Friends of Parents</h3>
          <p className="stat-number">{friendsParentsGroups}</p>
          <small>Parents' friends groups</small>
        </div>
        <div className="stat-card">
          <h3>Individual Guests</h3>
          <p className="stat-number">{standaloneIndividuals}</p>
          <small>Single person invites</small>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="breakdown-section">
        <h3>Breakdown by Category</h3>
        <div className="breakdown-grid">
          <div className="breakdown-card">
            <h4>Friends of Debutante</h4>
            <ul>
              <li><strong>Expected:</strong> <span>{friendsDebutanteStats.expected}</span></li>
              <li><strong>Responded:</strong> <span>{friendsDebutanteStats.responded}</span></li>
              <li><strong>Going:</strong> <span>{friendsDebutanteStats.going}</span></li>
              <li><strong>Not Going:</strong> <span>{friendsDebutanteStats.notGoing}</span></li>
              <li><strong>Pending:</strong> <span>{friendsDebutanteStats.pending}</span></li>
              <li><strong>Groups:</strong> <span>{friendsDebutanteStats.groups}</span></li>
            </ul>
          </div>

          <div className="breakdown-card">
            <h4>Relatives of Debutante</h4>
            <ul>
              <li><strong>Expected:</strong> <span>{relativesDebutanteStats.expected}</span></li>
              <li><strong>Responded:</strong> <span>{relativesDebutanteStats.responded}</span></li>
              <li><strong>Going:</strong> <span>{relativesDebutanteStats.going}</span></li>
              <li><strong>Not Going:</strong> <span>{relativesDebutanteStats.notGoing}</span></li>
              <li><strong>Pending:</strong> <span>{relativesDebutanteStats.pending}</span></li>
              <li><strong>Groups:</strong> <span>{relativesDebutanteStats.groups}</span></li>
            </ul>
          </div>

          <div className="breakdown-card">
            <h4>Friends of the Parents</h4>
            <ul>
              <li><strong>Expected:</strong> <span>{friendsParentsStats.expected}</span></li>
              <li><strong>Responded:</strong> <span>{friendsParentsStats.responded}</span></li>
              <li><strong>Going:</strong> <span>{friendsParentsStats.going}</span></li>
              <li><strong>Not Going:</strong> <span>{friendsParentsStats.notGoing}</span></li>
              <li><strong>Pending:</strong> <span>{friendsParentsStats.pending}</span></li>
              <li><strong>Groups:</strong> <span>{friendsParentsStats.groups}</span></li>
            </ul>
          </div>

          <div className="breakdown-card">
            <h4>Individual</h4>
            <ul>
              <li><strong>Expected:</strong> <span>{individualStats.expected}</span></li>
              <li><strong>Responded:</strong> <span>{individualStats.responded}</span></li>
              <li><strong>Going:</strong> <span>{individualStats.going}</span></li>
              <li><strong>Not Going:</strong> <span>{individualStats.notGoing}</span></li>
              <li><strong>Pending:</strong> <span>{individualStats.pending}</span></li>
              <li><strong>Total:</strong> <span>{standaloneIndividuals}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
