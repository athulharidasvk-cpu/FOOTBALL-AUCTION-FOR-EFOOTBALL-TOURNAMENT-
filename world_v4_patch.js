const world = require('./world_engine');

// Safe economy calculation: new clubs can begin without a sponsor.
world.updateEconomy = function(w, clubName, data) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return {error:'Club not found.'};
  if (data.ticketPrice !== undefined) c.ticketPrice = Math.max(50, Math.round(Number(data.ticketPrice)||0));
  if (data.capacity !== undefined) {
    const cap = Math.round(Number(data.capacity)||c.stadium.capacity);
    if (cap < c.stadium.capacity) return {error:'Capacity cannot be reduced below current size.'};
    if (cap > c.stadium.capacity) {
      const diff = cap - c.stadium.capacity;
      // Fixed transparent charge: ₹1M per 1,000 seats expanded
      const cost = Math.max(1, Math.round(diff / 1000));
      if (c.cash < cost) return {error:`Need ₹${cost}M to expand stadium by ${diff.toLocaleString()} seats. Club only has ₹${Math.round(c.cash)}M.`};
      c.cash -= cost;
      c.stadium.capacity = cap;
      w.news.unshift({
        id: `fin_${Date.now()}`,
        season: w.season,
        type: 'finance',
        text: `${c.name} expanded stadium to ${cap.toLocaleString()} seats (+${diff.toLocaleString()}) for ₹${cost}M.`,
        at: new Date().toISOString()
      });
    }
  }
  if (data.jerseyQuality !== undefined) c.jersey.quality = Math.max(10,Math.min(100,Math.round(Number(data.jerseyQuality)||c.jersey.quality)));
  const ps=(c.players||[]).map(id=>w.market.find(p=>p.id===id)).filter(Boolean);
  const star=ps.reduce((m,p)=>Math.max(m,Number(p.rating)||0),0);
  c.merchandise=Math.round(Math.min(100,c.jersey.quality*.65+star*.35));
  c.lastProjectedAttendance=Math.round(Math.min(c.stadium.capacity,c.stadium.capacity*(.35+c.reputation/200+c.merchandise/500)*Math.max(.25,1-Math.max(0,c.ticketPrice-500)/5000)));
  world.persist();
  return c;
};

// Selling lists the player's asking price.
world.sellPlayer = function(w,clubName,playerId,asking){
  const c=w.clubs.find(x=>x.name===clubName),p=w.market.find(x=>x.id===playerId);
  if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};
  p.askingPrice=Math.max(1,Math.round(Number(asking)||p.askingPrice||5));
  p.status='listed';
  w.news.unshift({id:`sell_${Date.now()}`,season:w.season,type:'transfer',text:`${p.name} is listed by ${c.name} for ₹${p.askingPrice}M.`,at:new Date().toISOString()});
  world.persist();
  return p;
};

// -------------------------------------------------------------
// 1. SQUAD CHEMISTRY & DRESSING ROOM HARMONY ENGINE
// -------------------------------------------------------------
world.calculateClubChemistry = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { chemistryScore: 50, ratingBonus: 0, nationalSynergies: [], synergyTier: 'Standard', squadRoles: [] };

  const squad = (c.players || []).map(id => w.market.find(p => p.id === id)).filter(Boolean);
  if (!squad.length) return { chemistryScore: 50, ratingBonus: 0, nationalSynergies: [], synergyTier: 'Standard', squadRoles: [] };

  // Calculate National Synergy Links
  const nationCounts = {};
  squad.forEach(p => {
    const nat = p.nationality || c.country || 'International';
    nationCounts[nat] = (nationCounts[nat] || 0) + 1;
  });

  const nationalSynergies = Object.keys(nationCounts)
    .filter(k => nationCounts[k] >= 2)
    .map(k => ({ nation: k, count: nationCounts[k], bonus: nationCounts[k] * 3 }));

  const totalNationBonus = nationalSynergies.reduce((sum, item) => sum + item.bonus, 0);

  // Morale & Manager Tactical Alignment
  const moraleBonus = Math.round(((c.morale || 70) - 50) * 0.25);
  const tenureBonus = Math.min(15, Math.round((c.stats?.wins || 0) * 1.2));

  let rawChem = 55 + totalNationBonus + moraleBonus + tenureBonus;
  const chemistryScore = Math.max(45, Math.min(99, rawChem));

  let synergyTier = 'Standard';
  let ratingBonus = 0;
  if (chemistryScore >= 88) {
    synergyTier = 'Exceptional';
    ratingBonus = 4.5;
  } else if (chemistryScore >= 75) {
    synergyTier = 'Strong';
    ratingBonus = 2.5;
  } else if (chemistryScore >= 60) {
    synergyTier = 'Good';
    ratingBonus = 1.0;
  } else {
    synergyTier = 'Fragmented';
    ratingBonus = -1.5;
  }

  // Assign Squad Roles & Happiness Dynamics
  const sorted = [...squad].sort((a, b) => (b.rating || 70) - (a.rating || 70));
  const squadRoles = squad.map(p => {
    const rank = sorted.findIndex(x => x.id === p.id);
    let role = 'Rotation';
    if (rank < 3) role = 'Crucial';
    else if (rank < 8) role = 'Important';
    else if ((p.age || 24) <= 21) role = 'Prospect';

    let happyScore = Math.round((c.morale || 70) * 0.65 + ((p.rating || 70) / 100) * 35);
    if (role === 'Crucial') happyScore = Math.min(100, happyScore + 10);
    p.squadRole = role;
    p.happiness = Math.max(35, Math.min(100, happyScore));
    p.happinessStatus = p.happiness >= 85 ? 'Ecstatic' : p.happiness >= 70 ? 'Happy' : p.happiness >= 50 ? 'Content' : 'Disgruntled';
    return {
      id: p.id,
      name: p.name,
      position: p.position,
      rating: p.rating,
      role,
      happiness: p.happiness,
      happinessStatus: p.happinessStatus
    };
  });

  return {
    chemistryScore,
    ratingBonus,
    synergyTier,
    nationalSynergies,
    squadRoles
  };
};

// -------------------------------------------------------------
// 2. YOUTH ACADEMY & WONDERKID DEVELOPMENT ENGINE
// -------------------------------------------------------------
world.trainYouthAcademy = function(w, clubName, regime = 'balanced') {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found.' };

  const squad = (c.players || []).map(id => w.market.find(p => p.id === id)).filter(Boolean);
  let youthPlayers = squad.filter(p => (p.age || 25) <= 21 || p.isYouthAcademy);

  const wonderkidTraits = [
    'Generational Talent', 'Dead-Ball Specialist', 'Midfield Maestro',
    'Speed Demon', 'Iron Wall', 'Poacher Instinct', 'Acrobatic Playmaker'
  ];

  // Auto-intake 2 rising academy stars if none present
  if (youthPlayers.length < 2) {
    const positions = ['CF', 'CM', 'CB', 'LW', 'RW'];
    const names = [
      'Leo Sterling', 'Matteo Rossi', 'Kai Thorne', 'Julian Silva',
      'Arda Güler Jr', 'Lucas Vance', 'Kofi Mensah', 'Viktor Lind', 'Rayan Cherki'
    ];
    for (let i = youthPlayers.length; i < 2; i++) {
      const pName = names[Math.floor(Math.random() * names.length)] + ` (${c.name} U19)`;
      const newP = {
        id: `p_youth_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: pName,
        age: 17 + Math.floor(Math.random() * 3),
        position: positions[Math.floor(Math.random() * positions.length)],
        rating: 64 + Math.floor(Math.random() * 5),
        potential: 85 + Math.floor(Math.random() * 8),
        trait: wonderkidTraits[Math.floor(Math.random() * wonderkidTraits.length)],
        developmentXp: 20,
        trainingRegime: regime,
        ownerClub: c.name,
        nationality: c.country || 'International',
        price: 3.5,
        askingPrice: 5.0,
        status: 'contracted',
        isYouthAcademy: true
      };
      w.market.push(newP);
      c.players.push(newP.id);
      youthPlayers.push(newP);
    }
  }

  // Small coaching session facility charge
  const fee = 0.2;
  if (c.cash >= fee) {
    c.cash = Math.max(0, Math.round((c.cash - fee) * 10) / 10);
  }

  const upgraded = [];
  youthPlayers.forEach(p => {
    p.trainingRegime = regime;
    p.developmentXp = (p.developmentXp || 0) + 35;
    if (!p.potential) p.potential = Math.min(94, (p.rating || 68) + 16);
    if (!p.trait) p.trait = wonderkidTraits[Math.floor(Math.random() * wonderkidTraits.length)];

    if (p.developmentXp >= 100) {
      p.developmentXp -= 100;
      if (p.rating < p.potential) {
        p.rating += 1;
        p.form = Math.min(99, (p.form || 75) + 6);
        upgraded.push({ name: p.name, newRating: p.rating, trait: p.trait });
        w.news.unshift({
          id: `youth_${Date.now()}_${p.id}`,
          season: w.season,
          type: 'academy',
          text: `⭐ YOUTH BREAKTHROUGH: Academy talent ${p.name} progressed to ${p.rating} OVR (${p.trait})!`,
          at: new Date().toISOString()
        });
      }
    }
  });

  world.persist();
  return {
    success: true,
    regime,
    players: youthPlayers,
    upgraded,
    message: upgraded.length
      ? `Drills completed! Breakthroughs achieved: ${upgraded.map(u => `${u.name} reached ${u.newRating} OVR`).join(', ')}!`
      : `High-intensity ${regime.toUpperCase()} training complete. All academy talents gained +35% development XP.`
  };
};

// -------------------------------------------------------------
// 3. TRANSFER NEGOTIATIONS WITH CLAUSES & LOAN-TO-BUY
// -------------------------------------------------------------
const baseNegotiate = world.negotiateTransfer;
world.negotiateTransfer = function(w, buyerName, playerId, offer = {}) {
  const buyer = w.clubs.find(x => x.name === buyerName);
  const p = w.market.find(x => x.id === playerId);
  if (!buyer || !p) return { error: 'Club or player not found.' };

  const dealType = offer.dealType || 'buy';
  const releaseClause = Number(offer.releaseClause) || Math.round((offer.fee || p.askingPrice || 10) * 1.8);
  const goalBonus = Number(offer.goalBonus) || 0;
  const sellOnPct = Number(offer.sellOnPct) || 0;

  // Loan to Buy handling: 20% upfront loan fee, player joins squad immediately
  if (dealType === 'loan_to_buy') {
    const loanFee = Math.max(0.5, Math.round((Number(offer.fee) || p.askingPrice || 5) * 0.2 * 10) / 10);
    if (buyer.cash < loanFee) {
      return { error: `Insufficient funds for loan fee! Required: ₹${loanFee}M. Club has ₹${Math.round(buyer.cash)}M.` };
    }
    const seller = p.ownerClub ? w.clubs.find(x => x.name === p.ownerClub) : null;
    if (seller) {
      seller.players = seller.players.filter(x => x !== p.id);
      seller.cash = Math.round((seller.cash + loanFee) * 10) / 10;
    }
    buyer.players.push(p.id);
    buyer.cash = Math.max(0, Math.round((buyer.cash - loanFee) * 10) / 10);
    p.ownerClub = buyer.name;
    p.status = 'loaned';
    p.contract = {
      dealType: 'loan_to_buy',
      years: 1,
      salary: Number(offer.salary) || 1.5,
      loanFee,
      purchaseOption: Number(offer.fee) || p.askingPrice || 10,
      releaseClause,
      goalBonus,
      sellOnPct
    };
    w.news.unshift({
      id: `loan_${Date.now()}`,
      season: w.season,
      type: 'transfer',
      text: `🤝 LOAN-TO-BUY: ${p.name} joined ${buyer.name} on loan with a ₹${p.contract.purchaseOption}M permanent purchase option!`,
      at: new Date().toISOString()
    });
    world.persist();
    return {
      status: 'accepted',
      player: p,
      message: `Agreement reached! ${p.name} joins ${buyer.name} on loan with an option to buy for ₹${p.contract.purchaseOption}M!`
    };
  }

  // Pre-Contract Expiration Free Signing
  if (offer.isPreContract || p.contractExpiring) {
    const signingBonus = Number(offer.salary) || 1.0;
    if (buyer.cash < signingBonus) return { error: `Need ₹${signingBonus}M for free-agent signing bonus.` };
    const seller = p.ownerClub ? w.clubs.find(x => x.name === p.ownerClub) : null;
    if (seller) seller.players = seller.players.filter(x => x !== p.id);
    buyer.players.push(p.id);
    buyer.cash = Math.max(0, Math.round((buyer.cash - signingBonus) * 10) / 10);
    p.ownerClub = buyer.name;
    p.status = 'contracted';
    p.contract = {
      years: Number(offer.years) || 3,
      salary: Number(offer.salary) || 1.5,
      releaseClause,
      goalBonus,
      sellOnPct
    };
    w.news.unshift({
      id: `pre_${Date.now()}`,
      season: w.season,
      type: 'transfer',
      text: `🆓 FREE AGENT SIGNING: ${p.name} signed for ${buyer.name} on a Bosman free transfer!`,
      at: new Date().toISOString()
    });
    world.persist();
    return {
      status: 'accepted',
      player: p,
      message: `Bosman free transfer completed! ${p.name} signed with ${buyer.name} without paying any transfer fee!`
    };
  }

  // Default negotiation with clauses attached
  const res = baseNegotiate.call(world, w, buyerName, playerId, offer);
  if (res && res.status === 'accepted' && res.player) {
    res.player.contract = {
      ...(res.player.contract || {}),
      releaseClause,
      goalBonus,
      sellOnPct
    };
    world.persist();
  }
  return res;
};

// -------------------------------------------------------------
// 4. IN-MATCH TACTICAL DECISIONS, SUBS & HALFTIME DYNAMICS
// -------------------------------------------------------------
const baseSimulate = world.simulate;
world.simulate = function(w, options = {}) {
  const user = w.clubs.find(x => x.name === w.selectedClub);
  if (!user) return { error: 'Choose a club first.' };

  // Apply Team Chemistry boost
  const chem = world.calculateClubChemistry(w, user.name);
  const origRep = user.reputation || 60;
  user.reputation = Math.round(origRep + (chem.ratingBonus || 0));

  // Apply Tactical Mentality Modifiers
  const mentality = options.mentality || 'balanced';
  const halftimeTalk = options.halftimeTalk || null;

  if (mentality === 'attacking') {
    user.morale = Math.min(100, (user.morale || 70) + 4);
  } else if (mentality === 'park_bus') {
    user.morale = Math.max(40, (user.morale || 70) - 2);
  }

  if (halftimeTalk === 'inspire') {
    user.morale = Math.min(100, (user.morale || 70) + 6);
  }

  const result = baseSimulate.call(world, w);
  user.reputation = origRep; // Restore true reputation

  if (result && !result.error) {
    const isUserHome = result.home === user.name;
    const userGoals = isUserHome ? result.homeGoals : result.awayGoals;
    const oppGoals = isUserHome ? result.awayGoals : result.homeGoals;
    const userWon = userGoals > oppGoals;
    const userDrawn = userGoals === oppGoals;

    // Track Manager Career Resume
    w.managerCareer = w.managerCareer || {
      matchesManaged: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      reputation: 60,
      trophiesCount: 0
    };
    w.managerCareer.matchesManaged++;
    if (userWon) {
      w.managerCareer.wins++;
      w.managerCareer.reputation = Math.min(99, Math.round(w.managerCareer.reputation + 1.2));
    } else if (userDrawn) {
      w.managerCareer.draws++;
    } else {
      w.managerCareer.losses++;
      w.managerCareer.reputation = Math.max(30, Math.round(w.managerCareer.reputation - 0.8));
    }

    if (oppGoals === 0) {
      w.managerCareer.cleanSheets = (w.managerCareer.cleanSheets || 0) + 1;
    }

    // Trophy Milestone Tracking for Finals
    user.trophyCabinet = user.trophyCabinet || [];
    if (result.isCup && (result.cupStage === 'FA Cup Final' || result.cupStage?.includes('Final')) && userWon) {
      recordTrophyVictory(w, user, {
        id: `trop_fa_s${w.season}_${Date.now()}`,
        name: 'National Knockout FA Cup',
        icon: '🏆',
        type: 'cup',
        tier: 'Major Domestic Cup',
        summary: `Triumph in the National FA Cup Final! Overcame ${isUserHome ? result.away : result.home} in a thrilling showdown.`,
        finalMatch: {
          opponent: isUserHome ? result.away : result.home,
          score: `${userGoals} - ${oppGoals}`,
          date: `Season ${w.season} FA Cup Final`
        }
      });
    } else if (result.fixture?.compType === 'global_cup' && result.fixture?.compStage?.includes('Final') && userWon) {
      recordTrophyVictory(w, user, {
        id: `trop_gt_s${w.season}_${Date.now()}`,
        name: 'Global Club World Championship',
        icon: '🌍',
        type: 'global_cup',
        tier: 'World Champion',
        summary: `Conquered the world! Defeated continental champions ${isUserHome ? result.away : result.home} to lift the Global Club World Cup.`,
        finalMatch: {
          opponent: isUserHome ? result.away : result.home,
          score: `${userGoals} - ${oppGoals}`,
          date: `Season ${w.season} World Championship Final`
        }
      });
    }

    // Passive Youth Academy Progress
    (user.players || []).forEach(pid => {
      const p = w.market.find(x => x.id === pid);
      if (p && ((p.age || 25) <= 21 || p.isYouthAcademy)) {
        p.developmentXp = (p.developmentXp || 0) + 6;
      }
    });

    world.evaluateManagerMilestones(w);
    // Check & Refresh Managerial Job Offers
    world.generateManagerJobOffers(w);
  }

  world.persist();
  return result;
};

// -------------------------------------------------------------
// 5. TROPHY RECORDING & HISTORICAL SQUAD DOCUMENTATION
// -------------------------------------------------------------
function recordTrophyVictory(w, clubOrName, trophyDetails) {
  const clubObj = typeof clubOrName === 'string' ? w.clubs.find(c => c.name === clubOrName) : clubOrName;
  if (!clubObj) return null;
  clubObj.trophyCabinet = clubObj.trophyCabinet || [];
  w.managerCareer = w.managerCareer || {
    matchesManaged: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    reputation: 60,
    trophiesCount: 0,
    trophies: []
  };
  w.managerCareer.trophies = w.managerCareer.trophies || [];

  // Snapshot entire first-team winning squad
  const allSquadPlayers = (w.market || []).filter(p => p.ownerClub === clubObj.name);
  const winningSquad = allSquadPlayers.map(p => ({
    id: p.id,
    name: p.name,
    position: p.position || 'MID',
    rating: p.rating || 70,
    age: p.age || 25,
    nationality: p.country || p.nationality || clubObj.country || 'Global',
    goalsSeason: p.goals || p.goalsSeason || 0,
    appearances: p.appearances || 18,
    isYouthAcademy: !!p.isYouthAcademy,
    trait: p.trait || 'Squad Stalwart'
  })).sort((a, b) => b.rating - a.rating);

  // Determine campaign top scorer
  const sortedScorers = [...winningSquad].sort((a, b) => (b.goalsSeason || 0) - (a.goalsSeason || 0));
  const candidateScorer = sortedScorers.find(p => (p.goalsSeason || 0) > 0) || winningSquad.find(p => p.position === 'FWD') || winningSquad[0];
  const topScorerRecord = candidateScorer ? {
    id: candidateScorer.id,
    name: candidateScorer.name,
    goals: Math.max(candidateScorer.goalsSeason || 0, trophyDetails.type === 'league' ? Math.floor(16 + Math.random() * 8) : Math.floor(6 + Math.random() * 4)),
    position: candidateScorer.position,
    rating: candidateScorer.rating,
    nationality: candidateScorer.nationality
  } : { name: 'Campaign Top Gun', goals: 18, position: 'FWD', rating: 78, nationality: clubObj.country };

  // Determine captain
  const captain = winningSquad.find(p => p.position === 'MID' || p.position === 'DEF') || winningSquad[0] || { name: 'Club Captain', position: 'DEF', rating: 76 };

  const trophyEntry = {
    id: trophyDetails.id || `trop_${trophyDetails.type || 'cup'}_s${w.season}_${Date.now()}`,
    name: trophyDetails.name || trophyDetails.competitionName || 'Championship Trophy',
    competitionName: trophyDetails.competitionName || trophyDetails.name || 'Championship Trophy',
    icon: trophyDetails.icon || '🏆',
    type: trophyDetails.type || 'cup',
    season: w.season,
    year: 2026 + (w.season - 1),
    clubName: clubObj.name,
    division: clubObj.division || 1,
    tier: trophyDetails.tier || 'Major Honor',
    manager: w.managerCareer.managerName || 'Head Coach',
    summary: trophyDetails.summary || `Historic victory lifting the ${trophyDetails.name || trophyDetails.competitionName} in Season ${w.season}!`,
    finalMatch: trophyDetails.finalMatch || {
      opponent: trophyDetails.against || trophyDetails.runnerUp || 'Rival Competitor',
      score: trophyDetails.score || trophyDetails.finalScore || '2 - 1',
      date: `Season ${w.season} Finale`
    },
    topScorer: topScorerRecord,
    captain: {
      name: captain.name,
      position: captain.position,
      rating: captain.rating,
      nationality: captain.nationality
    },
    winningSquad: winningSquad,
    wonAt: new Date().toISOString()
  };

  clubObj.trophyCabinet.unshift(trophyEntry);
  w.managerCareer.trophies.unshift(trophyEntry);
  w.managerCareer.trophiesCount = (w.managerCareer.trophiesCount || 0) + 1;
  w.managerCareer.reputation = Math.min(99, Math.round((w.managerCareer.reputation || 60) + 4.5));

  w.news.unshift({
    id: `trophy_won_${Date.now()}`,
    season: w.season,
    type: 'competition',
    text: `🏆 SILVERWARE LIFTED: ${clubObj.name} have officially won the ${trophyDetails.name}! Top scorer ${topScorerRecord.name} finished with ${topScorerRecord.goals} goals.`,
    at: new Date().toISOString()
  });

  return trophyEntry;
}
world.recordTrophyVictory = recordTrophyVictory;

// -------------------------------------------------------------
// 6. MANAGER MILESTONES SYSTEM
// -------------------------------------------------------------
const MANAGER_MILESTONES = [
  {
    id: 'first_win',
    title: 'First Competitive Victory',
    desc: 'Secure your first competitive victory as manager',
    icon: '🎯',
    repReward: 2,
    check: (career, club, w) => (career.wins || 0) >= 1
  },
  {
    id: 'clean_sheet_master',
    title: 'Iron Curtain',
    desc: 'Keep 3 or more clean sheets across competitive fixtures',
    icon: '🛡️',
    repReward: 3,
    check: (career, club, w) => (career.cleanSheets || 0) >= 3
  },
  {
    id: 'first_silverware',
    title: 'First Silverware',
    desc: 'Lift your first league title or major cup trophy',
    icon: '👑',
    repReward: 6,
    check: (career, club, w) => (career.trophiesCount || (club?.trophyCabinet || []).length) >= 1
  },
  {
    id: 'promotion_maestro',
    title: 'Promotion Maestro',
    desc: 'Guide a club to promotion into a higher division',
    icon: '📈',
    repReward: 6,
    check: (career, club, w) => (career.promotionsEarned || 0) >= 1 || (club?.history?.promotions || 0) >= 1
  },
  {
    id: 'top_flight_champion',
    title: 'Top-Flight Champion',
    desc: 'Win the Division 1 League Championship',
    icon: '🏆',
    repReward: 10,
    check: (career, club, w) => (club?.trophyCabinet || []).some(t => t.type === 'league' && t.division === 1) || (club?.history?.titles || 0) >= 1
  },
  {
    id: 'world_conqueror',
    title: 'World Club Champion',
    desc: 'Lift the prestigious Global Club World Cup',
    icon: '🌍',
    repReward: 12,
    check: (career, club, w) => (club?.trophyCabinet || []).some(t => t.type === 'global_cup')
  },
  {
    id: 'centurion',
    title: 'Season Veteran',
    desc: 'Reach 15 or more competitive matches managed',
    icon: '🌟',
    repReward: 5,
    check: (career, club, w) => (career.matchesManaged || 0) >= 15
  },
  {
    id: 'financial_titan',
    title: 'Financial Titan',
    desc: 'Build a healthy club treasury balance above ₹40M',
    icon: '💰',
    repReward: 4,
    check: (career, club, w) => (club?.cash || 0) >= 40
  },
  {
    id: 'youth_whisperer',
    title: 'Youth Whisperer',
    desc: 'Train and develop an academy talent to 75+ OVR',
    icon: '🪄',
    repReward: 5,
    check: (career, club, w) => {
      const players = (w.market || []).filter(p => p.ownerClub === club?.name);
      return players.some(p => (p.isYouthAcademy || (p.age || 25) <= 21) && (p.rating || 65) >= 75);
    }
  },
  {
    id: 'dynasty_architect',
    title: 'Dynasty Architect',
    desc: 'Accumulate 3 or more trophies across your managerial career',
    icon: '💎',
    repReward: 10,
    check: (career, club, w) => (career.trophiesCount || (club?.trophyCabinet || []).length) >= 3
  },
  {
    id: 'international_calling',
    title: 'National Calling',
    desc: 'Receive or accept a prestigious National Team managerial post',
    icon: '🌐',
    repReward: 8,
    check: (career, club, w) => !!w.nationalTeamRole || (w.jobOffers || []).some(o => o.type === 'national')
  },
  {
    id: 'elite_virtuoso',
    title: 'Elite Tactician',
    desc: 'Achieve a Manager Reputation score of 80 or above',
    icon: '👔',
    repReward: 8,
    check: (career, club, w) => (career.reputation || 60) >= 80
  }
];

world.evaluateManagerMilestones = function(w) {
  const user = w.clubs.find(x => x.name === w.selectedClub);
  w.managerCareer = w.managerCareer || { matchesManaged: 0, wins: 0, draws: 0, losses: 0, reputation: 60, trophiesCount: 0, milestones: {} };
  w.managerCareer.milestones = w.managerCareer.milestones || {};

  const evaluated = MANAGER_MILESTONES.map(m => {
    const isUnlocked = !!w.managerCareer.milestones[m.id] || m.check(w.managerCareer, user, w);
    if (isUnlocked && !w.managerCareer.milestones[m.id]) {
      w.managerCareer.milestones[m.id] = {
        unlockedAt: new Date().toISOString(),
        repGranted: m.repReward
      };
      w.managerCareer.reputation = Math.min(99, (w.managerCareer.reputation || 60) + m.repReward);
      w.news.unshift({
        id: `milestone_${m.id}_${Date.now()}`,
        season: w.season,
        type: 'manager',
        text: `🎖️ CAREER MILESTONE UNLOCKED: "${m.title}" (${m.icon})! Manager reputation rose by +${m.repReward}.`,
        at: new Date().toISOString()
      });
    }
    return {
      id: m.id,
      title: m.title,
      desc: m.desc,
      icon: m.icon,
      repReward: m.repReward,
      unlocked: isUnlocked
    };
  });

  return evaluated;
};

// -------------------------------------------------------------
// 7. DYNAMIC JOB OFFERS: RIVAL CLUBS & NATIONAL TEAMS
// -------------------------------------------------------------
world.generateManagerJobOffers = function(w) {
  const user = w.clubs.find(x => x.name === w.selectedClub);
  const rep = w.managerCareer?.reputation || 60;
  if (!user) {
    w.jobOffers = [];
    return [];
  }

  const offers = [];

  // 1. National Team Project Offers (if manager reputation >= 66)
  if (rep >= 66) {
    const nationalPool = [
      {
        country: 'India',
        flag: '🇮🇳',
        teamName: 'India National Football Team (AIFF)',
        role: 'Head Coach & Technical Director',
        minRep: 66,
        salary: 2.2,
        targetTournament: 'AFC Asian Cup & World Cup Qualification',
        starPlayers: ['Sunil Chhetri', 'Lallianzuala Chhangte', 'Gurpreet Singh Sandhu'],
        expectations: 'Reach AFC Asian Cup Knockouts & elevate FIFA World Ranking into Top 80.',
        pitch: 'The All India Football Federation (AIFF) is impressed by your tactical identity. We offer you full technical control of the Blue Tigers.'
      },
      {
        country: 'Japan',
        flag: '🇯🇵',
        teamName: 'Japan National Team (Samurai Blue)',
        role: 'National Team Head Coach',
        minRep: 72,
        salary: 3.4,
        targetTournament: 'FIFA World Cup Quarter-Finals',
        starPlayers: ['Kaoru Mitoma', 'Takefusa Kubo', 'Wataru Endo'],
        expectations: 'Win AFC Asian Cup & break through to the FIFA World Cup Quarter-Finals.',
        pitch: 'The Japan Football Association (JFA) seeks a modern high-pressing tactician to lead Samurai Blue against global heavyweights.'
      },
      {
        country: 'England',
        flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
        teamName: 'England National Team (The FA)',
        role: 'Head Coach of the Three Lions',
        minRep: 80,
        salary: 5.5,
        targetTournament: 'UEFA European Championship & World Cup',
        starPlayers: ['Jude Bellingham', 'Harry Kane', 'Bukayo Saka'],
        expectations: 'Bring football home: Deliver the European Championship and contend for the World Cup.',
        pitch: 'The Football Association (FA) believes your silverware pedigree can finally convert world-class generational talent into international trophies.'
      },
      {
        country: 'Brazil',
        flag: '🇧🇷',
        teamName: 'Brazil National Team (Seleção Canarinho)',
        role: 'Seleção Head Coach',
        minRep: 84,
        salary: 6.8,
        targetTournament: 'Copa América & FIFA World Cup Trophy',
        starPlayers: ['Vinícius Jr', 'Rodrygo', 'Alisson Becker'],
        expectations: 'Lift the Copa América and secure the historic 6th World Cup Star.',
        pitch: 'The CBF demands Jogo Bonito paired with tactical supremacy. Lead the yellow and green back to the pinnacle of world football.'
      },
      {
        country: 'France',
        flag: '🇫🇷',
        teamName: 'France National Team (Les Bleus)',
        role: 'Sélectionneur de l\'Équipe de France',
        minRep: 82,
        salary: 6.2,
        targetTournament: 'FIFA World Cup Championship',
        starPlayers: ['Kylian Mbappé', 'Antoine Griezmann', 'William Saliba'],
        expectations: 'Dominate European and Global tournaments with tactical perfection.',
        pitch: 'The French Football Federation (FFF) requires an elite strategist to guide the deepest talent pool on the planet.'
      }
    ];

    const eligibleNations = nationalPool.filter(n => rep >= n.minRep);
    if (eligibleNations.length > 0) {
      const selectedNat = eligibleNations[Math.floor(Math.random() * eligibleNations.length)];
      offers.push({
        id: `job_nat_${selectedNat.country.toLowerCase()}_${Date.now()}`,
        type: 'national',
        clubName: selectedNat.teamName,
        teamName: selectedNat.teamName,
        country: selectedNat.country,
        flag: selectedNat.flag,
        role: selectedNat.role,
        division: 'International Elite',
        reputation: selectedNat.minRep + 6,
        cash: 0,
        salaryOffer: selectedNat.salary,
        targetTournament: selectedNat.targetTournament,
        starPlayers: selectedNat.starPlayers,
        expectations: selectedNat.expectations,
        pitch: selectedNat.pitch
      });
    }
  }

  // 2. Rival Clubs (Higher-tier or ambitious projects)
  const eligibleClubs = w.clubs.filter(c => c.name !== user.name);
  const sortedClubs = [...eligibleClubs].sort((a, b) => (b.reputation || 60) - (a.reputation || 60));

  const clubCandidates = sortedClubs.filter(c => {
    if (rep < 68) return c.division >= 2;
    if (rep < 80) return c.division <= 2;
    return c.division === 1;
  }).slice(0, 3);

  clubCandidates.forEach(c => {
    const starPlayers = (w.market || [])
      .filter(p => p.ownerClub === c.name)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map(p => `${p.name} (${p.position} ${p.rating} OVR)`);

    const warChest = Math.round((Math.max(20, c.cash * 0.75) + Math.random() * 15) * 10) / 10;
    const salary = Math.round(((c.reputation || 65) * 0.045) * 10) / 10;

    offers.push({
      id: `job_club_${c.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${w.season}`,
      type: 'club',
      clubName: c.name,
      country: c.country,
      flag: c.country === 'India' ? '🇮🇳' : c.country === 'England' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' : c.country === 'Spain' ? '🇪🇸' : c.country === 'Germany' ? '🇩🇪' : '🌍',
      division: c.division,
      reputation: c.reputation || 65,
      cash: warChest,
      salaryOffer: salary,
      starPlayers: starPlayers.length > 0 ? starPlayers : ['Experienced First-Team Roster'],
      expectations: c.division === 1 ? 'Contend for Title & Continental Silverware' : 'Secure Promotion to Division 1 with Dominant Record',
      pitch: `The board of directors of ${c.name} has tracked your impressive managerial metrics. We offer you full sporting authority and a ₹${warChest}M transfer budget.`
    });
  });

  w.jobOffers = offers;
  return offers;
};

world.acceptJobOffer = function(w, offerId) {
  const offer = (w.jobOffers || []).find(o => o.id === offerId);
  if (!offer) return { error: 'Job offer no longer available.' };

  const oldClub = w.selectedClub;
  w.managerCareer = w.managerCareer || { matchesManaged: 0, wins: 0, draws: 0, losses: 0, reputation: 60, trophiesCount: 0, clubsManaged: [] };
  w.managerCareer.clubsManaged = w.managerCareer.clubsManaged || [];

  if (offer.type === 'national') {
    w.nationalTeamRole = {
      nation: offer.country,
      teamName: offer.clubName,
      role: offer.role,
      flag: offer.flag,
      annualSalary: offer.salaryOffer,
      appointedSeason: w.season,
      expectations: offer.expectations
    };
    w.managerCareer.reputation = Math.min(99, (w.managerCareer.reputation || 65) + 6);
    w.news.unshift({
      id: `takeover_nat_${Date.now()}`,
      season: w.season,
      type: 'manager',
      text: `🌐 OFFICIAL APPOINTMENT: Manager appointed Head Coach of ${offer.clubName} (${offer.flag} ${offer.country}) in a landmark international project!`,
      at: new Date().toISOString()
    });
    w.jobOffers = (w.jobOffers || []).filter(o => o.id !== offerId);
    world.evaluateManagerMilestones(w);
    world.persist();
    return {
      success: true,
      type: 'national',
      teamName: offer.clubName,
      message: `You are officially appointed Head Coach of ${offer.clubName}!`
    };
  }

  // Club takeover
  w.managerCareer.clubsManaged.push({
    club: oldClub,
    seasons: `Season ${w.season}`,
    leftAt: new Date().toISOString()
  });

  w.selectedClub = offer.clubName;
  const newClub = w.clubs.find(c => c.name === offer.clubName);
  if (newClub) {
    newClub.cash = Math.max(newClub.cash, offer.cash || 30);
    newClub.morale = 85;
    newClub.fanSatisfaction = 90;
  }
  w.managerCareer.reputation = Math.min(99, Math.round((w.managerCareer.reputation || 60) + 4));
  w.jobOffers = [];

  w.news.unshift({
    id: `takeover_${Date.now()}`,
    season: w.season,
    type: 'manager',
    text: `👔 BLOCKBUSTER TAKEOVER: Manager left ${oldClub} to take charge of ${offer.clubName} on a ₹${offer.salaryOffer}M/yr contract with a ₹${offer.cash}M transfer war chest!`,
    at: new Date().toISOString()
  });

  world.evaluateManagerMilestones(w);
  world.persist();
  return {
    success: true,
    type: 'club',
    newClub: offer.clubName,
    message: `Welcome to ${offer.clubName}! You have taken full managerial control with a ₹${offer.cash}M war chest.`
  };
};

world.declineJobOffer = function(w, offerId) {
  const offer = (w.jobOffers || []).find(o => o.id === offerId);
  if (!offer) return { error: 'Offer not found.' };

  const user = w.clubs.find(c => c.name === w.selectedClub);
  if (user) {
    user.fanSatisfaction = Math.min(100, (user.fanSatisfaction || 75) + 15);
    user.morale = Math.min(100, (user.morale || 75) + 10);
  }

  w.news.unshift({
    id: `loyalty_${Date.now()}`,
    season: w.season,
    type: 'manager',
    text: `🤝 UNWAVERING LOYALTY: Manager formally rejected a lucrative proposal from ${offer.clubName} to reaffirm total commitment to ${w.selectedClub}!`,
    at: new Date().toISOString()
  });

  w.jobOffers = (w.jobOffers || []).filter(o => o.id !== offerId);
  world.persist();
  return {
    success: true,
    message: `Declined offer from ${offer.clubName}. Club morale and supporter loyalty surged!`
  };
};

world.negotiateJobOffer = function(w, offerId) {
  const offer = (w.jobOffers || []).find(o => o.id === offerId);
  if (!offer) return { error: 'Offer not found.' };

  const rep = w.managerCareer?.reputation || 60;
  if (rep >= (offer.reputation - 5)) {
    offer.cash = Math.round((offer.cash + 10.0) * 10) / 10;
    offer.salaryOffer = Math.round((offer.salaryOffer + 0.6) * 10) / 10;
    offer.negotiated = true;
    offer.pitch = `DEMANDS ACCEPTED: The board has agreed to your counter-terms! Transfer war chest increased to ₹${offer.cash}M and salary raised to ₹${offer.salaryOffer}M/yr.`;
    world.persist();
    return {
      success: true,
      offer,
      message: `Negotiation Succeeded! ${offer.clubName} increased war chest to ₹${offer.cash}M!`
    };
  } else {
    return {
      success: false,
      offer,
      message: `${offer.clubName} stood firm on original terms: ₹${offer.cash}M budget.`
    };
  }
};

world.getTrophyCabinetAndCareer = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName) || w.clubs[0];
  if (c && (!c.trophyCabinet || c.trophyCabinet.length === 0)) {
    // If the club already has historical titles in history, seed historical trophy documentation
    if ((c.history?.titles || 0) > 0 || (c.stats?.cups || 0) > 0) {
      c.trophyCabinet = c.trophyCabinet || [];
      const squad = (w.market || []).filter(p => p.ownerClub === c.name);
      const topMan = squad.sort((a,b)=>(b.rating||70)-(a.rating||70))[0] || { name: 'Iconic Legend', rating: 84, position: 'FWD' };
      c.trophyCabinet.push({
        id: `trop_hist_${c.name.toLowerCase()}_1`,
        name: `${c.division === 1 ? 'Division 1' : 'Division ' + c.division} Championship`,
        icon: '🏆',
        type: 'league',
        season: Math.max(1, w.season - 1),
        year: 2025,
        clubName: c.name,
        division: c.division,
        tier: 'Historic National Champion',
        manager: 'Club Legend',
        summary: `Historic championship title won in pre-modern era, enshrining ${c.name} into national folklore.`,
        finalMatch: { opponent: 'Title Contenders', score: '3 - 1', date: 'Historical Finale' },
        topScorer: { name: topMan.name, goals: 24, position: topMan.position || 'FWD', rating: topMan.rating || 82, nationality: c.country },
        captain: { name: 'Legendary Skipper', position: 'DEF', rating: 80, nationality: c.country },
        winningSquad: squad.slice(0, 14).map(p => ({
          id: p.id,
          name: p.name,
          position: p.position || 'MID',
          rating: p.rating || 70,
          age: p.age || 26,
          nationality: p.country || c.country,
          goalsSeason: p.goals || Math.floor(Math.random() * 8)
        }))
      });
    }
  }

  return {
    trophies: c?.trophyCabinet || [],
    career: w.managerCareer || { matchesManaged: 0, wins: 0, draws: 0, losses: 0, reputation: 60, trophiesCount: 0 },
    milestones: world.evaluateManagerMilestones(w),
    jobOffers: w.jobOffers || world.generateManagerJobOffers(w),
    nationalTeamRole: w.nationalTeamRole || null
  };
};

// -------------------------------------------------------------
// 8. WRAP ADVANCE SEASON TO ARCHIVE TITLES & SQUADS
// -------------------------------------------------------------
const origAdvanceSeason = world.advanceSeason;
world.advanceSeason = function(s) {
  const user = s.clubs.find(x => x.name === s.selectedClub);
  const oldDiv = user?.division;
  const oldTitles = user?.history?.titles || 0;

  const result = origAdvanceSeason.call(world, s);

  if (user) {
    const isChamp = (user.division === 1 && (user.history?.titles || 0) > oldTitles) || (s.lastSeasonVerdict?.userVerdict?.type === 'champion');
    if (isChamp) {
      recordTrophyVictory(s, user, {
        id: `trop_league_d1_s${s.season - 1}`,
        name: `Division 1 League Championship`,
        icon: '🏆',
        type: 'league',
        tier: 'Premier National Champion',
        division: 1,
        summary: `Undisputed Champions of the Nation! Conquered Division 1 in Season ${s.season - 1} with an unstoppable winning campaign.`
      });
    } else if (s.lastSeasonVerdict?.userVerdict?.type === 'promoted') {
      const fromDiv = s.lastSeasonVerdict.userVerdict.from;
      recordTrophyVictory(s, user, {
        id: `trop_league_d${fromDiv}_s${s.season - 1}`,
        name: `Division ${fromDiv} Championship Trophy`,
        icon: '🥇',
        type: 'league',
        tier: 'Promotion Silverware',
        division: fromDiv,
        summary: `Crowned Division ${fromDiv} Champions and earned historic promotion to Division ${s.lastSeasonVerdict.userVerdict.to}!`
      });
    }

    world.evaluateManagerMilestones(s);
    world.generateManagerJobOffers(s);
  }

  world.persist();
  return result;
};

// -------------------------------------------------------------
// 9. WRAP GLOBAL TOURNAMENT TO ARCHIVE WORLD TROPHIES
// -------------------------------------------------------------
const origSimulateGlobalTournamentRound = world.simulateGlobalTournamentRound;
world.simulateGlobalTournamentRound = function(s) {
  const result = origSimulateGlobalTournamentRound.call(world, s);
  const user = s.clubs.find(x => x.name === s.selectedClub);
  if (s.globalTournament?.status === 'completed' && s.globalTournament?.champion === user?.name) {
    const alreadyAwarded = (user.trophyCabinet || []).some(t => t.type === 'global_cup' && t.season === s.season);
    if (!alreadyAwarded) {
      recordTrophyVictory(s, user, {
        id: `trop_global_s${s.season}`,
        name: 'Global Club World Championship',
        icon: '🌍',
        type: 'global_cup',
        tier: 'World Champion',
        summary: `Immortalized as Club World Champions! Defeated the greatest continental clubs to hoist the Global Championship Trophy.`
      });
    }
  }
  world.persist();
  return result;
};

// -------------------------------------------------------------
// 10. ENRICH CLIENT GLOBAL STATE WITH NEW DATA MODULES
// -------------------------------------------------------------
const origGlobalState = world.globalState;
world.globalState = function(w) {
  const s = origGlobalState.call(world, w);
  if (s && s.selectedClub) {
    const c = (s.clubs || []).find(x => x.name === s.selectedClub);
    if (c && c.division === 3 && !c._balancedBaseSquad) {
      c._balancedBaseSquad = true;
      const myPlayers = (s.market || []).filter(p => p.ownerClub === c.name);
      myPlayers.forEach(p => {
        if (p.rating > 65) {
          p.rating = Math.floor(60 + Math.random() * 5); // 60-64 realistic baseline
        }
      });
    }
    s.chemistry = world.calculateClubChemistry(w, s.selectedClub);
    s.managerCareer = w.managerCareer || { matchesManaged: 0, wins: 0, draws: 0, losses: 0, reputation: 60, trophiesCount: 0 };
    s.trophies = c?.trophyCabinet || [];
    s.managerMilestones = world.evaluateManagerMilestones(w);
    s.jobOffers = w.jobOffers || [];
    s.nationalTeamRole = w.nationalTeamRole || null;

    // Feature Enriched State Modules
    s.youthAcademy = world.getYouthAcademyState(w, s.selectedClub);
    s.boardStatus = world.getBoardStatus(w, s.selectedClub);
    s.backroomStaff = world.getBackroomStaff(w, s.selectedClub);
    s.facilities = world.getFacilitiesState(w, s.selectedClub);
    s.sponsorshipDeals = world.getSponsorshipBids(w, s.selectedClub);
    s.ffpReport = world.getFFPReport(w, s.selectedClub);
    s.setPieces = world.getSetPieceTactics(w, s.selectedClub);
  }
  return s;
};

// -------------------------------------------------------------
// 11. YOUTH ACADEMY & ANNUAL YOUTH INTAKE SYSTEM
// -------------------------------------------------------------
const YOUTH_WONDERKID_TRAITS = [
  'Generational Finisher', 'Midfield Maestro', 'Aerial Dominator',
  'Trickster Winger', 'Wall Goalkeeper', 'High-Press Engine',
  'Ball-Playing Defender', 'Dead-Ball Specialist', 'Golden Boy Prospect'
];

const YOUTH_PERSONALITIES = [
  'Determined', 'Model Professional', 'Ambitious', 'Resilient', 'Leader', 'Perfectionist'
];

world.getYouthAcademyState = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  c.academyLevel = c.academyLevel || 1;
  c.youthIntakeClass = c.youthIntakeClass || [];
  c.mentorshipLinks = c.mentorshipLinks || [];

  const upgradeCosts = { 1: 4.0, 2: 8.0, 3: 14.0, 4: 22.0, 5: 0 };
  const nextCost = upgradeCosts[c.academyLevel] || 0;

  // Auto-generate initial intake if empty
  if (!c.youthIntakeClass.length) {
    world.generateYouthIntakeBatch(w, c);
  }

  const squad = (w.market || []).filter(p => p.ownerClub === c.name);
  const eligibleMentors = squad.filter(p => (p.age || 26) >= 26);
  const academyPlayersInSquad = squad.filter(p => p.isYouthAcademy || (p.age || 24) <= 21);

  return {
    level: c.academyLevel,
    maxLevel: 5,
    nextUpgradeCost: nextCost,
    facilityTierName: ['Grassroots Pitches', 'Regional Center', 'Elite Training Complex', 'State-of-the-Art Academy', 'World-Class Talent Factory'][c.academyLevel - 1],
    wonderkidChance: c.academyLevel * 18,
    prospects: c.youthIntakeClass,
    mentorshipLinks: c.mentorshipLinks,
    eligibleMentors,
    academyPlayersInSquad
  };
};

world.generateYouthIntakeBatch = function(w, clubObj) {
  const c = clubObj;
  const level = c.academyLevel || 1;
  const firstNames = ['Lucas', 'Mateo', 'Aiden', 'Leo', 'Noah', 'Gabriel', 'Kaito', 'Siddharth', 'Milan', 'Tariq', 'Rafael', 'Julian', 'Enzo', 'Benoit', 'Thiago'];
  const lastNames = ['Silva', 'Moreno', 'Rossi', 'Muller', 'Nakamura', 'Patel', 'Fernandez', 'Kovacs', 'Diallo', 'Alves', 'Santos', 'Becker', 'Costa', 'Dubois', 'Park'];
  const positions = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LWF', 'RWF', 'CF'];

  const count = 4 + (level >= 3 ? 1 : 0);
  const intake = [];

  for (let i = 0; i < count; i++) {
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const age = 16 + Math.floor(Math.random() * 3); // 16 - 18
    const baseRating = 60 + (level * 3) + Math.floor(Math.random() * 4); // level 1: 63-67, level 5: 75-79
    const potential = Math.min(96, baseRating + 14 + Math.floor(Math.random() * (level * 3)));
    const stars = potential >= 90 ? 5 : potential >= 85 ? 4.5 : potential >= 80 ? 4 : 3.5;

    intake.push({
      id: `intake_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      name: `${f} ${l}`,
      age,
      position: pos,
      rating: baseRating,
      potential,
      stars,
      trait: YOUTH_WONDERKID_TRAITS[Math.floor(Math.random() * YOUTH_WONDERKID_TRAITS.length)],
      personality: YOUTH_PERSONALITIES[Math.floor(Math.random() * YOUTH_PERSONALITIES.length)],
      determination: 65 + Math.floor(Math.random() * 30),
      nationality: c.country || 'International',
      origin: `${c.name} U18 Academy`,
      signingFee: 0.1,
      salary: 0.4
    });
  }

  c.youthIntakeClass = intake;
  return intake;
};

world.triggerYouthIntake = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const batch = world.generateYouthIntakeBatch(w, c);
  w.news.unshift({
    id: `youth_intake_${Date.now()}`,
    season: w.season,
    type: 'academy',
    text: `🌟 YOUTH INTAKE DAY: ${c.name} have unveiled ${batch.length} promising academy starlets! Highest potential: ${batch.reduce((max, p) => p.potential > max.potential ? p : max, batch[0]).name} (${batch[0].potential} POT).`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, prospects: batch };
};

world.upgradeYouthAcademy = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };
  c.academyLevel = c.academyLevel || 1;
  if (c.academyLevel >= 5) return { error: 'Youth Academy is already at maximum Level 5 (World-Class)!' };

  const upgradeCosts = { 1: 4.0, 2: 8.0, 3: 14.0, 4: 22.0 };
  const cost = upgradeCosts[c.academyLevel] || 10.0;
  if (c.cash < cost) {
    return { error: `Insufficient treasury funds! Upgrading to Level ${c.academyLevel + 1} requires ₹${cost}M. Club currently holds ₹${Math.round(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - cost) * 10) / 10);
  c.academyLevel++;

  w.news.unshift({
    id: `academy_upg_${Date.now()}`,
    season: w.season,
    type: 'facility',
    text: `🏗️ ACADEMY EXPANSION: ${c.name} invested ₹${cost}M to upgrade their Youth Academy to Level ${c.academyLevel}! Scouted wonderkid potential has increased substantially.`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, newLevel: c.academyLevel, remainingCash: c.cash };
};

world.promoteYouthProspect = function(w, clubName, prospectId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  c.youthIntakeClass = c.youthIntakeClass || [];
  const idx = c.youthIntakeClass.findIndex(p => p.id === prospectId);
  if (idx === -1) return { error: 'Youth prospect not found in intake class' };

  const p = c.youthIntakeClass.splice(idx, 1)[0];

  const seniorPlayer = {
    id: `prospect_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: p.name,
    age: p.age,
    position: p.position,
    rating: p.rating,
    potential: p.potential,
    trait: p.trait,
    personality: p.personality,
    ownerClub: c.name,
    nationality: p.nationality,
    form: 80,
    price: Math.max(2, Math.round(p.rating / 10)),
    askingPrice: Math.max(3, Math.round(p.rating / 8)),
    salary: p.salary || 0.5,
    contractYears: 3,
    status: 'contracted',
    isYouthAcademy: true,
    determination: p.determination || 75
  };

  w.market.push(seniorPlayer);
  c.players.push(seniorPlayer.id);

  // Morale & Board Boost
  c.morale = Math.min(99, (c.morale || 70) + 3);
  w.news.unshift({
    id: `youth_promo_${Date.now()}`,
    season: w.season,
    type: 'transfer',
    text: `⭐ SENIOR CONTRACT SIGNED: ${c.name} officially promoted 17yo wonderkid ${p.name} (${p.position} · ${p.rating} OVR · ${p.trait}) to the first-team squad!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, player: seniorPlayer };
};

world.mentorYouthProspect = function(w, clubName, youthId, mentorId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const youth = (w.market || []).find(p => p.id === youthId && p.ownerClub === c.name);
  const mentor = (w.market || []).find(p => p.id === mentorId && p.ownerClub === c.name);

  if (!youth || !mentor) return { error: 'Youth prospect or Senior mentor not found in squad' };

  c.mentorshipLinks = c.mentorshipLinks || [];
  c.mentorshipLinks = c.mentorshipLinks.filter(m => m.youthId !== youthId);

  // Stat progression & mentorship perks
  youth.rating = Math.min(youth.potential || 90, (youth.rating || 65) + 1);
  youth.determination = Math.min(99, (youth.determination || 70) + 5);
  youth.form = Math.min(99, (youth.form || 75) + 8);
  youth.mentoredBy = mentor.name;

  c.mentorshipLinks.push({
    youthId,
    youthName: youth.name,
    mentorId,
    mentorName: mentor.name,
    establishedSeason: w.season
  });

  w.news.unshift({
    id: `mentor_${Date.now()}`,
    season: w.season,
    type: 'training',
    text: `🤝 MENTORSHIP PACT: Veteran ${mentor.name} is now mentoring young talent ${youth.name}. Youth determination boosted!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, youth, mentor };
};

// -------------------------------------------------------------
// 12. PRESS CONFERENCES, MIND GAMES & BOARD CONFIDENCE
// -------------------------------------------------------------
world.getPressConference = function(w, clubName, stage = 'pre') {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const matchday = (w.matchday || 0) + 1;
  const oppClub = w.clubs.find(x => x.name !== c.name && x.division === c.division) || w.clubs[0];

  const questions = [
    {
      id: 'q1_tactics',
      outlet: 'Sky Sports Football',
      journalist: 'David Croft',
      question: `Manager, how are you approaching the upcoming clash against ${oppClub.name}? Pundits question whether your tactics are too open defensively.`,
      options: [
        {
          id: 'opt1_agg',
          style: 'Combative / Aggressive',
          quote: `"We don't fear anyone. We're going to play on the front foot and tear right through them!"`,
          effects: { morale: +5, pressure: +10, fanApproval: +6, rivalComposure: -8 }
        },
        {
          id: 'opt2_comp',
          style: 'Composed / Tactical',
          quote: `"We've analyzed their transitional patterns. Tactical discipline and compactness will win this fixture."`,
          effects: { morale: +3, focus: +10, boardConfidence: +5, rivalComposure: 0 }
        },
        {
          id: 'opt3_hum',
          style: 'Passionate / Fan-Focused',
          quote: `"This match is for the supporters filling the stands. Every player will leave everything on that grass today."`,
          effects: { morale: +10, fanApproval: +12, chemistry: +4 }
        }
      ]
    },
    {
      id: 'q2_squad',
      outlet: 'The Athletic Football Review',
      journalist: 'Amy Lawrence',
      question: `There are whispers in the dressing room about squad rotation and playing time. How do you keep star players content?`,
      options: [
        {
          id: 'opt2_merit',
          style: 'Meritocracy',
          quote: `"Reputation counts for zero. Whoever trains hardest and executes on matchday starts. Simple as that."`,
          effects: { morale: +4, determination: +6, focus: +5 }
        },
        {
          id: 'opt2_diplomatic',
          style: 'Diplomatic Shield',
          quote: `"We have a united dressing room with an incredible bond. We succeed as a brotherhood."`,
          effects: { morale: +8, chemistry: +6, boardConfidence: +3 }
        },
        {
          id: 'opt2_warning',
          style: 'Stern Warning',
          quote: `"Anyone who puts personal ego above the badge can find themselves sitting in the reserves."`,
          effects: { discipline: +10, morale: -2, rivalComposure: -4 }
        }
      ]
    },
    {
      id: 'q3_board',
      outlet: 'Gazetta Del Calcio',
      journalist: 'Matteo Bellini',
      question: `The board has made their seasonal ambitions clear. Do you feel the pressure on your shoulders?`,
      options: [
        {
          id: 'opt3_thrive',
          style: 'Thrive on Pressure',
          quote: `"Pressure is a privilege. I came here to conquer titles, not hide in mid-table obscurity."`,
          effects: { boardConfidence: +8, reputation: +3, morale: +5 }
        },
        {
          id: 'opt3_patient',
          style: 'Long-Term Process',
          quote: `"We are building a sustainable football identity block by block. Trust the process."`,
          effects: { boardConfidence: +4, fanApproval: +4, financialDiscipline: +5 }
        },
        {
          id: 'opt3_demand_funds',
          style: 'Demand Reinforcements',
          quote: `"If the board want trophies, they need to continue backing us in the transfer market."`,
          effects: { boardConfidence: -5, fanApproval: +8, transferUrgency: +10 }
        }
      ]
    }
  ];

  return { stage, questions, club: c.name, opponent: oppClub.name };
};

world.submitPressConference = function(w, clubName, answers = []) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  let totalMoraleChange = 0;
  let totalBoardChange = 0;
  let totalFanChange = 0;

  answers.forEach(ans => {
    if (ans.effects) {
      totalMoraleChange += ans.effects.morale || 0;
      totalBoardChange += ans.effects.boardConfidence || 0;
      totalFanChange += ans.effects.fanApproval || 0;
    }
  });

  c.morale = Math.max(30, Math.min(99, (c.morale || 70) + totalMoraleChange));
  c.fanSatisfaction = Math.max(30, Math.min(99, (c.fanSatisfaction || 70) + totalFanChange));
  c.boardConfidence = Math.max(25, Math.min(99, (c.boardConfidence || 75) + totalBoardChange));

  w.news.unshift({
    id: `press_${Date.now()}`,
    season: w.season,
    type: 'media',
    text: `🎙️ PRESS BRIEFING: ${c.name} manager held an electric media conference. Squad morale stands at ${c.morale}% and Board confidence at ${c.boardConfidence}%.`,
    at: new Date().toISOString()
  });

  world.persist();
  return {
    success: true,
    newMorale: c.morale,
    newBoardConfidence: c.boardConfidence,
    newFanApproval: c.fanSatisfaction
  };
};

world.getBoardStatus = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  c.boardConfidence = c.boardConfidence !== undefined ? c.boardConfidence : 78;
  const exp = c.expectation || (c.division === 1 ? 'top4' : 'promotion');

  const objectives = [
    {
      title: 'Division Performance',
      target: c.division === 1 ? 'Finish in Top 4' : `Secure Promotion from Div ${c.division}`,
      status: (c.division === 1 ? 'On Course' : 'Competitive'),
      weight: 45
    },
    {
      title: 'Financial Fair Play Compliance',
      target: 'Maintain positive wage-to-revenue ratio < 70%',
      status: (c.cash >= 15 ? 'Excellent' : 'Stable'),
      weight: 30
    },
    {
      title: 'Youth Development Pipeline',
      target: 'Field or promote at least 1 academy wonderkid',
      status: (c.players || []).some(id => (w.market || []).find(p => p.id === id)?.isYouthAcademy) ? 'Achieved' : 'Pending',
      weight: 25
    }
  ];

  let stance = 'Delighted';
  if (c.boardConfidence < 40) stance = 'Ultimatum / Under Pressure';
  else if (c.boardConfidence < 60) stance = 'Stern / Expecting Improvement';
  else if (c.boardConfidence < 80) stance = 'Supportive & Confident';

  return {
    confidence: c.boardConfidence,
    stance,
    objectives,
    expectation: exp,
    fanSatisfaction: c.fanSatisfaction || 75
  };
};

// -------------------------------------------------------------
// 13. BACKROOM STAFF & WORLDWIDE SCOUTING EXPEDITIONS
// -------------------------------------------------------------
const STAFF_CANDIDATES = {
  assistantManager: [
    { id: 'st_am_1', name: 'Zeljko Buvac', role: 'Assistant Manager', rating: 88, specialty: 'Tactical Preparation & Auto-Subs', cost: 1.2, perk: '+4% Match Win Rate' },
    { id: 'st_am_2', name: 'Mikel Arteta Jr.', role: 'Assistant Manager', rating: 84, specialty: 'Set-Piece Structure & Drills', cost: 0.9, perk: '+20% Free Kick Precision' },
    { id: 'st_am_3', name: 'Carlos Queiroz', role: 'Assistant Manager', rating: 91, specialty: 'Defensive Organization', cost: 1.5, perk: '-35% Conceded Chances' }
  ],
  headScout: [
    { id: 'st_sc_1', name: 'Piet de Visser', role: 'Head Scout', rating: 93, specialty: 'Wonderkid Potential Radar', cost: 1.4, perk: 'Unlocks Exact Potential (POT)' },
    { id: 'st_sc_2', name: 'Damien Comolli', role: 'Head Scout', rating: 85, specialty: 'Bargain Hunting', cost: 0.8, perk: '-15% Transfer Asking Prices' },
    { id: 'st_sc_3', name: 'Monchi', role: 'Head Scout', rating: 92, specialty: 'Global Scouting Network', cost: 1.6, perk: '+2 Discovered Talents per Mission' }
  ],
  headPhysio: [
    { id: 'st_ph_1', name: 'Dr. Paco Biosca', role: 'Head Physio', rating: 90, specialty: 'Fatigue Regeneration', cost: 1.1, perk: '+25% Stamina Recovery' },
    { id: 'st_ph_2', name: 'Lieven Maesschalck', role: 'Head Physio', rating: 87, specialty: 'Injury Prevention', cost: 0.8, perk: '-50% Muscle Injuries' }
  ],
  setPieceCoach: [
    { id: 'st_sp_1', name: 'Gianni Vio', role: 'Set-Piece Specialist', rating: 92, specialty: 'Routine Choreography', cost: 1.0, perk: '+30% Corner Conversion' },
    { id: 'st_sp_2', name: 'Nicolas Jover', role: 'Set-Piece Specialist', rating: 89, specialty: 'Near-Post Overload', cost: 0.8, perk: '+25% Set-Piece Goals' }
  ]
};

world.getBackroomStaff = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  c.backroomStaff = c.backroomStaff || {
    assistantManager: STAFF_CANDIDATES.assistantManager[0],
    headScout: STAFF_CANDIDATES.headScout[0],
    headPhysio: STAFF_CANDIDATES.headPhysio[0],
    setPieceCoach: STAFF_CANDIDATES.setPieceCoach[0]
  };

  return {
    hired: c.backroomStaff,
    availableCandidates: STAFF_CANDIDATES
  };
};

world.hireBackroomStaff = function(w, clubName, role, staffId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const pool = STAFF_CANDIDATES[role] || [];
  const staff = pool.find(s => s.id === staffId);
  if (!staff) return { error: 'Staff member not found' };

  if (c.cash < staff.cost) {
    return { error: `Insufficient funds! Signing ${staff.name} costs ₹${staff.cost}M. Club has ₹${Math.round(c.cash)}M.` };
  }

  c.cash = Math.max(0, Math.round((c.cash - staff.cost) * 10) / 10);
  c.backroomStaff = c.backroomStaff || {};
  c.backroomStaff[role] = staff;

  w.news.unshift({
    id: `staff_hired_${Date.now()}`,
    season: w.season,
    type: 'staff',
    text: `👔 STAFF APPOINTMENT: ${c.name} hired elite ${staff.role} ${staff.name} (${staff.specialty})!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, hired: staff, remainingCash: c.cash };
};

world.dispatchWorldScouting = function(w, clubName, region = 'South America') {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const fee = 0.5;
  if (c.cash < fee) return { error: `Scouting expedition requires ₹${fee}M travel & operational budget.` };
  c.cash = Math.max(0, Math.round((c.cash - fee) * 10) / 10);

  const regionNations = {
    'South America': ['Brazil', 'Argentina', 'Uruguay', 'Colombia'],
    'Continental Europe': ['France', 'Spain', 'Germany', 'Portugal', 'Netherlands'],
    'Africa': ['Nigeria', 'Senegal', 'Ghana', 'Ivory Coast', 'Morocco'],
    'Asia & Middle East': ['Japan', 'South Korea', 'Saudi Arabia', 'Australia']
  };

  const poolNations = regionNations[region] || ['International'];
  const results = [];
  const positions = ['CF', 'LWF', 'RWF', 'AMF', 'CMF', 'CB', 'GK'];

  for (let i = 0; i < 3; i++) {
    const nation = poolNations[Math.floor(Math.random() * poolNations.length)];
    const ovr = 74 + Math.floor(Math.random() * 10);
    const pot = Math.min(94, ovr + 8 + Math.floor(Math.random() * 8));
    const val = Math.max(4, Math.round(ovr * 0.3));

    const scoutedPlayer = {
      id: `scout_find_${Date.now()}_${i}`,
      name: `${region.slice(0, 3)} Prospect ${Math.floor(Math.random() * 900 + 100)}`,
      nationality: nation,
      position: positions[Math.floor(Math.random() * positions.length)],
      rating: ovr,
      potential: pot,
      askingPrice: val,
      salary: Math.max(0.8, Math.round(val * 0.12 * 10) / 10),
      region,
      scoutVerdict: pot >= 88 ? '⭐ Generational Talent - Sign Urgently' : '✔️ High-Quality Starter'
    };
    results.push(scoutedPlayer);
  }

  c.lastScoutingExpedition = {
    region,
    timestamp: new Date().toISOString(),
    results
  };

  world.persist();
  return { success: true, region, results };
};

// -------------------------------------------------------------
// 14. STADIUM EXPANSION, SPONSORSHIPS & FINANCIAL FAIR PLAY (FFP)
// -------------------------------------------------------------
world.getFacilitiesState = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  c.facilities = c.facilities || {
    vipSuites: 12,
    hybridPitch: false,
    trainingGroundLevel: 2,
    stadiumCapacity: c.stadiumCapacity || 25000
  };

  return c.facilities;
};

world.upgradeFacility = function(w, clubName, facilityType) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  c.facilities = c.facilities || { vipSuites: 12, hybridPitch: false, trainingGroundLevel: 2, stadiumCapacity: c.stadiumCapacity || 25000 };

  if (facilityType === 'vip_suites') {
    const cost = 6.0;
    if (c.cash < cost) return { error: `VIP Luxury Hospitality upgrade costs ₹${cost}M.` };
    c.cash = Math.max(0, Math.round((c.cash - cost) * 10) / 10);
    c.facilities.vipSuites += 10;
    w.news.unshift({
      id: `fac_vip_${Date.now()}`,
      season: w.season,
      type: 'facility',
      text: `🍾 CORPORATE EXPANSION: ${c.name} added 10 VIP Hospitality Suites (+₹0.4M/matchday).`,
      at: new Date().toISOString()
    });
  } else if (facilityType === 'hybrid_pitch') {
    const cost = 4.0;
    if (c.cash < cost) return { error: `Hybrid Grass Turf installation costs ₹${cost}M.` };
    c.cash = Math.max(0, Math.round((c.cash - cost) * 10) / 10);
    c.facilities.hybridPitch = true;
    w.news.unshift({
      id: `fac_pitch_${Date.now()}`,
      season: w.season,
      type: 'facility',
      text: `🌱 PITCH PERFECTION: ${c.name} installed a Premier Hybrid Turf, cutting injury risks and boosting home dominance.`,
      at: new Date().toISOString()
    });
  } else if (facilityType === 'training_ground') {
    const cost = 8.0;
    if (c.cash < cost) return { error: `Training Ground modernization costs ₹${cost}M.` };
    c.cash = Math.max(0, Math.round((c.cash - cost) * 10) / 10);
    c.facilities.trainingGroundLevel = Math.min(5, (c.facilities.trainingGroundLevel || 2) + 1);
    w.news.unshift({
      id: `fac_train_${Date.now()}`,
      season: w.season,
      type: 'facility',
      text: `🏋️ TRAINING COMPLEX: ${c.name} upgraded High-Performance Training Ground to Level ${c.facilities.trainingGroundLevel}!`,
      at: new Date().toISOString()
    });
  } else {
    return { error: 'Unknown facility upgrade type' };
  }

  world.persist();
  return { success: true, facilities: c.facilities, remainingCash: c.cash };
};

world.getSponsorshipBids = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return [];

  const rep = c.reputation || 70;
  const baseVal = Math.max(3, Math.round(rep * 0.1));

  return [
    {
      id: 'sp_bid_1',
      brand: 'Apex Energy Drink',
      type: 'Guaranteed High Base',
      baseAnnual: baseVal + 3.0,
      bonusChampions: 2.0,
      bonusPromotion: 2.5,
      contractYears: 2,
      tag: '🛡️ MAXIMUM SECURITY'
    },
    {
      id: 'sp_bid_2',
      brand: 'Quantum Fintech Global',
      type: 'Performance Heavy',
      baseAnnual: baseVal + 1.0,
      bonusChampions: 7.5,
      bonusPromotion: 5.0,
      contractYears: 3,
      tag: '🚀 HIGH REWARD'
    },
    {
      id: 'sp_bid_3',
      brand: 'Skyline Airways',
      type: 'Prestige Partner',
      baseAnnual: baseVal + 2.0,
      bonusChampions: 4.0,
      bonusPromotion: 3.5,
      contractYears: 2,
      tag: '⭐ BALANCED LUXURY'
    }
  ];
};

world.acceptSponsorshipProposal = function(w, clubName, bidId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const bids = world.getSponsorshipBids(w, clubName);
  const chosen = bids.find(b => b.id === bidId) || bids[0];

  c.sponsor = {
    name: chosen.brand,
    value: chosen.baseAnnual,
    years: chosen.contractYears,
    bonusChampions: chosen.bonusChampions,
    bonusPromotion: chosen.bonusPromotion,
    objective: 'Finish above previous league position'
  };

  // Immediate signing upfront bonus
  const upfrontBonus = 2.0;
  c.cash = Math.round((c.cash + upfrontBonus) * 10) / 10;

  w.news.unshift({
    id: `sponsor_sign_${Date.now()}`,
    season: w.season,
    type: 'finance',
    text: `💼 COMMERCIAL RECORD: ${c.name} signed a ₹${chosen.baseAnnual}M/yr agreement with ${chosen.brand}! Upfront payment of ₹${upfrontBonus}M wired to club treasury.`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, sponsor: c.sponsor, remainingCash: c.cash };
};

world.getFFPReport = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  const squad = (w.market || []).filter(p => p.ownerClub === c.name);
  const totalWagesAnnual = squad.reduce((sum, p) => sum + (Number(p.salary) || 1.2), 0);
  const revenueEst = Math.max(12, Math.round(((c.stadiumCapacity || 20000) * 0.0006 * 20) + (c.sponsor?.value || 5) * 1.5));
  const wageRatio = Math.round((totalWagesAnnual / revenueEst) * 100);

  let status = 'HEALTHY & COMPLIANT';
  let badgeColor = '#22c55e';
  let penaltyWarning = 'All UEFA and League Financial Fair Play regulations are fully met.';

  if (wageRatio > 85) {
    status = 'TRANSFER EMBARGO WARNING';
    badgeColor = '#ef4444';
    penaltyWarning = 'Critical Wage Ratio! Excessive wage expenditure threatens upcoming transfer window sanctions.';
  } else if (wageRatio > 70) {
    status = 'FFP WATCHLIST';
    badgeColor = '#f59e0b';
    penaltyWarning = 'Wage bill exceeds 70% threshold. Board requests prudent fiscal restraint.';
  }

  return {
    status,
    badgeColor,
    totalWagesAnnual: Math.round(totalWagesAnnual * 10) / 10,
    projectedRevenueAnnual: revenueEst,
    wageToTurnoverRatio: wageRatio,
    maxPermittedRatio: 70,
    penaltyWarning,
    threeSeasonNetBalance: Math.round((c.cash - (totalWagesAnnual * 0.5)) * 10) / 10
  };
};

// -------------------------------------------------------------
// 15. TACTICAL SET-PIECES & INTERACTIVE PENALTY SHOOTOUT
// -------------------------------------------------------------
world.getSetPieceTactics = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return null;

  c.setPieceTactics = c.setPieceTactics || {
    cornerRoutine: 'near_post',
    freekickRoutine: 'direct_curler',
    penaltyTaker: null,
    cornerTaker: null,
    freekickTaker: null
  };

  const squad = (w.market || []).filter(p => p.ownerClub === c.name);

  return {
    tactics: c.setPieceTactics,
    squadList: squad.map(p => ({ id: p.id, name: p.name, rating: p.rating, position: p.position }))
  };
};

world.saveSetPieceTactics = function(w, clubName, newTactics = {}) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  c.setPieceTactics = {
    cornerRoutine: newTactics.cornerRoutine || 'near_post',
    freekickRoutine: newTactics.freekickRoutine || 'direct_curler',
    penaltyTaker: newTactics.penaltyTaker || null,
    cornerTaker: newTactics.cornerTaker || null,
    freekickTaker: newTactics.freekickTaker || null
  };

  world.persist();
  return { success: true, tactics: c.setPieceTactics };
};

world.simulatePenaltyShootout = function(w, clubName, opponentName, userShot = 'top_left', userDive = 'left') {
  const user = w.clubs.find(x => x.name === clubName);
  const opp = w.clubs.find(x => x.name === opponentName) || w.clubs[0];

  const directions = ['left', 'center', 'right'];
  const oppDive = directions[Math.floor(Math.random() * directions.length)];
  const oppShotDir = directions[Math.floor(Math.random() * directions.length)];

  // User Shot evaluation
  let userScored = true;
  if (userShot.includes(oppDive)) {
    userScored = Math.random() > 0.65; // Keeper dived right way, still 35% chance to sneak in
  } else if (userShot === 'panenka') {
    userScored = oppDive !== 'center';
  }

  // Opponent Shot evaluation
  let oppScored = true;
  if (userDive === oppShotDir) {
    oppScored = Math.random() > 0.70; // User dived the right way!
  }

  return {
    round: 1,
    userScored,
    oppScored,
    userShotChoice: userShot,
    oppDiveChoice: oppDive,
    oppShotChoice: oppShotDir,
    userDiveChoice: userDive,
    commentaryUser: userScored
      ? `⚽ GOAL! You drilled it into the corner beyond the keeper's reach!`
      : `❌ SAVED! The opposition keeper anticipates the trajectory and parries it away!`,
    commentaryOpp: !oppScored
      ? `🧤 MAGNIFICENT SAVE! You read the shooter's eyes and kept it out!`
      : `⚽ GOAL. Opponent strikes with venom into the side netting.`
  };
};

module.exports = world;



