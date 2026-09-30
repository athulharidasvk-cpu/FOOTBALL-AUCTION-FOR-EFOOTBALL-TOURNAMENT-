const world = require('./world_engine');

let GoogleGenAIClass = null;
try {
  const genaiPkg = require('@google/genai');
  GoogleGenAIClass = genaiPkg.GoogleGenAI;
} catch (e) {}

function getGeminiClient() {
  if (!GoogleGenAIClass || !process.env.GEMINI_API_KEY) return null;
  try {
    return new GoogleGenAIClass({ apiKey: process.env.GEMINI_API_KEY });
  } catch (e) {
    return null;
  }
}

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
// 3. TRANSFER NEGOTIATIONS WITH CLAUSES, SELL-ON CUTS & LOAN-TO-BUY
// -------------------------------------------------------------
const baseNegotiate = world.negotiateTransfer;
world.negotiateTransfer = function(w, buyerName, playerId, offer = {}) {
  const buyer = w.clubs.find(x => x.name === buyerName);
  const p = w.market.find(x => x.id === playerId);
  if (!buyer || !p) return { error: 'Club or player not found.' };

  const dealType = offer.dealType || 'buy';
  const releaseClause = Number(offer.releaseClause) || Math.round((offer.fee || p.askingPrice || 10) * 2.0);
  const goalBonus = Number(offer.goalBonus ?? offer.bonusAddons) || 0;
  const cleanSheetBonus = Number(offer.cleanSheetBonus ?? offer.bonusAddons) || 0;
  const sellOnPct = Math.min(50, Math.max(0, Number(offer.sellOnPct ?? offer.sellOnClause) || 0));
  const seller = p.ownerClub ? w.clubs.find(x => x.name === p.ownerClub) : null;

  // Helper to remit sell-on fee to original seller club if one exists
  const processSellOnFee = (transferredFee) => {
    if (p.contract && p.contract.sellOnPct > 0 && p.contract.originalSellerClub && seller) {
      const sellOnCut = Math.round(transferredFee * (p.contract.sellOnPct / 100) * 10) / 10;
      const origClub = w.clubs.find(c => c.name === p.contract.originalSellerClub);
      if (origClub && sellOnCut > 0) {
        origClub.cash = Math.round((origClub.cash + sellOnCut) * 10) / 10;
        seller.cash = Math.max(0, Math.round((seller.cash - sellOnCut) * 10) / 10);
        w.news.unshift({
          id: `sellon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          season: w.season,
          type: 'finance',
          text: `💸 SELL-ON CUT: ${origClub.name} received a ₹${sellOnCut}M windfall (${p.contract.sellOnPct}%) from ${p.name}'s transfer to ${buyer.name}!`,
          at: new Date().toISOString()
        });
      }
    }
  };

  // Loan to Buy handling: 20% upfront loan fee, player joins squad immediately with option to buy
  if (dealType === 'loan_to_buy') {
    const purchaseOption = Number(offer.fee) || p.askingPrice || 10;
    const loanFee = Math.max(0.5, Math.round(purchaseOption * 0.2 * 10) / 10);
    if (buyer.cash < loanFee) {
      return { error: `Insufficient funds for loan fee! Required: ₹${loanFee}M upfront. Club has ₹${Math.round(buyer.cash)}M.` };
    }
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
      purchaseOption,
      releaseClause,
      goalBonus,
      cleanSheetBonus,
      sellOnPct,
      originalSellerClub: seller?.name || null,
      loanParentClub: seller?.name || null
    };
    w.news.unshift({
      id: `loan_${Date.now()}`,
      season: w.season,
      type: 'transfer',
      text: `🤝 LOAN-TO-BUY: ${p.name} joined ${buyer.name} on loan (₹${loanFee}M loan fee) with an agreed ₹${purchaseOption}M permanent purchase option!`,
      at: new Date().toISOString()
    });
    world.persist();
    return {
      status: 'accepted',
      player: p,
      message: `Agreement reached! ${p.name} joins ${buyer.name} on loan with a ₹${purchaseOption}M buyout clause exercisable at any time!`
    };
  }

  // Pre-Contract Expiration Free Signing (Bosman Ruling in January / 6 months left)
  const isExpiring = offer.isPreContract || p.contractExpiring || (p.contract && p.contract.years <= 1) || p.ownerClub === 'Free Agent';
  if (isExpiring && (dealType === 'pre_contract' || offer.fee === 0 || offer.isPreContract)) {
    const signingBonus = Number(offer.salary) || 1.0;
    if (buyer.cash < signingBonus) return { error: `Need ₹${signingBonus}M for free-agent signing bonus.` };
    if (seller) seller.players = seller.players.filter(x => x !== p.id);
    buyer.players.push(p.id);
    buyer.cash = Math.max(0, Math.round((buyer.cash - signingBonus) * 10) / 10);
    p.ownerClub = buyer.name;
    p.status = 'contracted';
    p.contract = {
      dealType: 'permanent',
      years: Number(offer.years) || 3,
      salary: Number(offer.salary) || 1.5,
      releaseClause,
      goalBonus,
      cleanSheetBonus,
      sellOnPct,
      originalSellerClub: seller?.name || null
    };
    w.news.unshift({
      id: `pre_${Date.now()}`,
      season: w.season,
      type: 'transfer',
      text: `🆓 BOSMAN FREE TRANSFER: ${p.name} signed for ${buyer.name} with 6 months left on contract without paying a transfer fee!`,
      at: new Date().toISOString()
    });
    world.persist();
    return {
      status: 'accepted',
      player: p,
      message: `Bosman free transfer completed! ${p.name} signed with ${buyer.name} with 6 months remaining, avoiding any transfer fee!`
    };
  }

  // Check if Release Clause is triggered (if fee meets release clause, transfer is guaranteed)
  const isReleaseClauseTriggered = p.contract?.releaseClause && (offer.fee >= p.contract.releaseClause);
  if (isReleaseClauseTriggered) {
    if (buyer.cash < offer.fee) {
      return { error: `Cannot trigger release clause! Requires ₹${p.contract.releaseClause}M. Club has ₹${Math.round(buyer.cash)}M.` };
    }
    const feePaid = offer.fee;
    if (seller) {
      seller.players = seller.players.filter(x => x !== p.id);
      seller.cash = Math.round((seller.cash + feePaid) * 10) / 10;
    }
    buyer.players.push(p.id);
    buyer.cash = Math.max(0, Math.round((buyer.cash - feePaid) * 10) / 10);
    processSellOnFee(feePaid);

    p.ownerClub = buyer.name;
    p.status = 'contracted';
    p.contract = {
      dealType: 'permanent',
      years: Number(offer.years) || 3,
      salary: Number(offer.salary) || 2.5,
      releaseClause,
      goalBonus,
      cleanSheetBonus,
      sellOnPct,
      originalSellerClub: seller?.name || null
    };
    w.news.unshift({
      id: `release_${Date.now()}`,
      season: w.season,
      type: 'transfer',
      text: `🔓 RELEASE CLAUSE TRIGGERED: ${buyer.name} activated ${p.name}'s ₹${p.contract.releaseClause}M buyout clause!`,
      at: new Date().toISOString()
    });
    world.persist();
    return {
      status: 'accepted',
      player: p,
      message: `Release clause of ₹${feePaid}M activated! Selling club was legally bound to accept terms.`
    };
  }

  // Default negotiation with clauses attached
  const res = baseNegotiate.call(world, w, buyerName, playerId, offer);
  if (res && res.status === 'accepted' && res.player) {
    processSellOnFee(offer.fee || p.askingPrice || 10);
    res.player.contract = {
      ...(res.player.contract || {}),
      dealType: 'permanent',
      releaseClause,
      goalBonus,
      cleanSheetBonus,
      sellOnPct,
      originalSellerClub: seller?.name || null
    };
    world.persist();
  }
  return res;
};

// Exercise Loan-to-Buy Option
world.exerciseLoanBuyout = function(w, buyerName, playerId) {
  const buyer = w.clubs.find(x => x.name === buyerName);
  const p = w.market.find(x => x.id === playerId);
  if (!buyer || !p) return { error: 'Club or player not found.' };
  if (p.ownerClub !== buyer.name) return { error: 'Player is not registered to your squad.' };
  if (p.contract?.dealType !== 'loan_to_buy') return { error: 'Player does not have an active loan buyout clause.' };

  const buyoutPrice = Number(p.contract.purchaseOption) || Math.round(p.askingPrice || 10);
  if (buyer.cash < buyoutPrice) {
    return { error: `Insufficient funds to exercise buyout option! Required: ₹${buyoutPrice}M. Club has ₹${Math.round(buyer.cash)}M.` };
  }

  buyer.cash = Math.max(0, Math.round((buyer.cash - buyoutPrice) * 10) / 10);
  const parentClub = p.contract.loanParentClub ? w.clubs.find(x => x.name === p.contract.loanParentClub) : null;
  if (parentClub) {
    parentClub.cash = Math.round((parentClub.cash + buyoutPrice) * 10) / 10;
  }

  p.status = 'contracted';
  p.contract.dealType = 'permanent';
  p.contract.years = 3;
  p.contract.purchaseOption = null;

  w.news.unshift({
    id: `buyout_${Date.now()}`,
    season: w.season,
    type: 'transfer',
    text: `⭐ PERMANENT SIGNING: ${buyer.name} officially exercised their ₹${buyoutPrice}M purchase option for ${p.name}!`,
    at: new Date().toISOString()
  });

  world.persist();
  return {
    success: true,
    player: p,
    buyoutPrice,
    message: `Buyout option exercised! ${p.name} has officially joined ${buyer.name} on a permanent 3-year contract.`
  };
};

// Helper: Get Expiring Contracts (Bosman eligible / 6 months left)
world.getExpiringContracts = function(w) {
  return (w.market || []).filter(p => {
    return (p.contract && p.contract.years <= 1) || p.contractExpiring || p.ownerClub === 'Free Agent';
  });
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
function generateProceduralPressQuestions(c, mc, oppClub, starPlayer, pendingBidsCount, approaches, stage) {
  const div = c.division || 3;
  const oppName = oppClub ? oppClub.name : 'your upcoming opponent';
  const starName = starPlayer ? starPlayer.name : 'your talisman striker';
  const approachesCount = approaches.length;
  const firstApproachClub = approachesCount > 0 ? approaches[0].club : 'an ambitious rival';
  const firstApproachBudget = approachesCount > 0 ? approaches[0].offeredBudget : 25;

  if (stage === 'headhunt' || (approachesCount > 0 && stage !== 'post' && stage !== 'pre')) {
    return [
      {
        id: 'q1_headhunt_rumors',
        outlet: 'The Athletic UK',
        journalist: 'David Ornstein',
        category: 'Headhunt & Job Approaches',
        question: `Boss, we are breaking news that ${firstApproachClub} has made an aggressive formal approach to poach you as their manager with a ₹${firstApproachBudget}M war chest. Are you considering walking away from ${c.name}?`,
        options: [
          {
            id: 'opt1_loyal_pledge',
            style: 'Unwavering Loyalty',
            quote: `"My heart and complete commitment belong to ${c.name}. We have built something extraordinary here and I am not abandoning my dressing room for anyone."`,
            effects: { reputation: 3, morale: 10, boardConfidence: 8, fanApproval: 12 }
          },
          {
            id: 'opt1_flirt_pressure',
            style: 'Flirting & Demanding Ambition',
            quote: `"In modern football, you always listen when ambitious projects approach. If ${c.name} wants to keep me long-term, the board must match that level of ambition."`,
            effects: { reputation: 4, morale: -3, boardConfidence: 6, fanApproval: -2 }
          },
          {
            id: 'opt1_focused_silence',
            style: 'Cool Professionalism',
            quote: `"I don't comment on media gossip. My sole focus is preparing my players for our next fixture. Everything else is handled by representatives."`,
            effects: { reputation: 2, morale: 4, boardConfidence: 5, fanApproval: 4 }
          }
        ]
      },
      {
        id: 'q2_dressing_room_focus',
        outlet: 'Sky Sports News',
        journalist: 'Kaveh Solhekol',
        category: 'Dressing Room Impact',
        question: `With reports of other clubs chasing your signature, is there any concern that your squad's morale or focus could be disrupted in the middle of our campaign?`,
        options: [
          {
            id: 'opt2_absolute_trust',
            style: 'Absolute Dressing Room Unity',
            quote: `"My players know exactly who I am. We look each other in the eye every day. This noise only pulls us closer together as a family."`,
            effects: { reputation: 3, morale: 8, boardConfidence: 5, fanApproval: 7 }
          },
          {
            id: 'opt2_merit_standards',
            style: 'No Excuses / High Standards',
            quote: `"Anyone who lets rumors affect their running on the pitch will find themselves sitting in the reserves. Elite standards apply to everyone."`,
            effects: { reputation: 4, morale: -1, boardConfidence: 7, fanApproval: 5 }
          },
          {
            id: 'opt2_collective_mission',
            style: 'Eyes on Promotion Prize',
            quote: `"We are on a historic mission to climb this football pyramid. No outside distractions will derail our promotion charge."`,
            effects: { reputation: 4, morale: 7, boardConfidence: 6, fanApproval: 9 }
          }
        ]
      },
      {
        id: 'q3_contract_negotiation',
        outlet: 'BBC Sport Football',
        journalist: 'Simon Stone',
        category: 'Contract Negotiations',
        question: `Will you be demanding an emergency contract renegotiation with the ${c.name} board to reflect your rising market value and reputation?`,
        options: [
          {
            id: 'opt3_results_first',
            style: 'Results First, Contracts Later',
            quote: `"Contracts take care of themselves when you win football matches. My only negotiation right now is getting 3 points at the weekend."`,
            effects: { reputation: 4, morale: 7, boardConfidence: 8, fanApproval: 8 }
          },
          {
            id: 'opt3_board_backing',
            style: 'Demand Board Investment',
            quote: `"A manager needs backing. If the boardroom wants to build a dynasty, we need contract security and fresh transfer war chests."`,
            effects: { reputation: 3, morale: 3, boardConfidence: 4, fanApproval: 6 }
          }
        ]
      }
    ];
  }

  if (stage === 'transfer') {
    return [
      {
        id: 'q1_transfer_negotiation',
        outlet: 'Transfer Market Insider',
        journalist: 'Fabrizio Romano',
        category: 'Transfer Bids & Poaching',
        question: `Boss, rival clubs are heavily circling your key squad members with official cash bids (${pendingBidsCount} offers tabled). What is your firm stance on incoming transfer negotiations?`,
        options: [
          {
            id: 'opt1_hardball',
            style: 'Tough Negotiator',
            quote: `"Nobody leaves this squad on the cheap. We set the valuations. If suitors don't meet our terms and record fees, they can look elsewhere."`,
            effects: { morale: 6, boardConfidence: 6, fanApproval: 8, reputation: 3 }
          },
          {
            id: 'opt1_reinvest',
            style: 'Pragmatic Rebuilder',
            quote: `"Every player has a price. If a marquee bid arrives that allows us to recruit 3 or 4 high-caliber replacements, we will negotiate."`,
            effects: { morale: 2, boardConfidence: 8, fanApproval: 4, reputation: 2 }
          },
          {
            id: 'opt1_lockdown',
            style: 'Squad Lockdown / Untouchable',
            quote: `"This squad is strictly NOT FOR SALE. We are building a winning project and our key men are essential to our promotion charge."`,
            effects: { morale: 10, boardConfidence: 3, fanApproval: 12, reputation: 2 }
          }
        ]
      },
      {
        id: 'q2_targets',
        outlet: 'Sky Sports News Desk',
        journalist: 'Melissa Reddy',
        category: 'Squad Reinforcements',
        question: `Are you actively negotiating to bring in new signings before the transfer deadline, or are you satisfied with the squad depth?`,
        options: [
          {
            id: 'opt2_active_push',
            style: 'Demanding Board Backing',
            quote: `"We have identified key transfer targets. I am pushing the board to release funds and seal negotiations to reinforce our starting XI."`,
            effects: { morale: 5, boardConfidence: 4, fanApproval: 8, reputation: 2 }
          },
          {
            id: 'opt2_trust_academy',
            style: 'Faith in Youth Academy',
            quote: `"We won't make panic buys. We have brilliant hungry young talent in our academy who are ready to step up and shine."`,
            effects: { morale: 8, boardConfidence: 8, fanApproval: 6, reputation: 3 }
          },
          {
            id: 'opt2_secretive',
            style: 'Cards Close to Chest',
            quote: `"Negotiations happen behind closed doors, not in front of microphones. We do our business quietly and efficiently."`,
            effects: { morale: 4, boardConfidence: 5, fanApproval: 4, reputation: 2 }
          }
        ]
      },
      {
        id: 'q3_lower_div_ambition',
        outlet: 'The Football League Weekly',
        journalist: 'Henry Winter',
        category: 'Division Ambition',
        question: `Managing in Division ${div}, how do you persuade top-tier talent to sign with ${c.name} over established top-flight giants?`,
        options: [
          {
            id: 'opt3_vision',
            style: 'Inspiring Tactical Vision',
            quote: `"Players come here because of our tactical philosophy and because they know they will be the cornerstone of a historic promotion rise."`,
            effects: { morale: 8, boardConfidence: 7, fanApproval: 10, reputation: 4 }
          },
          {
            id: 'opt3_development',
            style: 'Player Development Promise',
            quote: `"Under my coaching staff, players improve their ratings rapidly and become fan icons. That is more valuable than sitting on a big club bench."`,
            effects: { morale: 7, boardConfidence: 6, fanApproval: 7, reputation: 3 }
          }
        ]
      }
    ];
  }

  if (stage === 'post') {
    return [
      {
        id: 'q1_post_verdict',
        outlet: 'BBC Match of the Day',
        journalist: 'Gary Lineker',
        category: 'Post-Match Reaction',
        question: `Gaffer, what was your debrief in the dressing room just now? How do you assess the squad's character and execution under matchday pressure?`,
        options: [
          {
            id: 'opt1_proud_shield',
            style: 'Passionate Player Defense',
            quote: `"I am immensely proud of the lads. They left every drop of sweat on that pitch. When we play with that courage, no team can break us."`,
            effects: { reputation: 3, morale: 10, boardConfidence: 4, fanApproval: 9 }
          },
          {
            id: 'opt1_tactical_debrief',
            style: 'Clinical Tactical Breakdown',
            quote: `"Tactically we executed our transitions well, but we missed chances to kill off the game earlier. We analyze the tape and improve on Monday."`,
            effects: { reputation: 4, morale: 4, boardConfidence: 7, fanApproval: 5 }
          },
          {
            id: 'opt1_ruthless_critique',
            style: 'Ruthless High Standards',
            quote: `"Good is not good enough at ${c.name}. If we want to win trophies, we cannot afford defensive lapses. I expect sharper focus."`,
            effects: { reputation: 3, morale: -3, boardConfidence: 7, fanApproval: 6 }
          }
        ]
      },
      {
        id: 'q2_star_performer',
        outlet: 'The Athletic Football Review',
        journalist: 'James Pearce',
        category: 'Key Player Performance',
        question: `Pundits singled out ${starName} during the match. How critical has their role been to your overall tactical setup?`,
        options: [
          {
            id: 'opt2_praise_star',
            style: 'Star Talisman Praise',
            quote: `"${starName} is a world-class professional. They set the benchmark in training and deliver moments of pure magic when we need it most."`,
            effects: { reputation: 3, morale: 8, boardConfidence: 5, fanApproval: 8 }
          },
          {
            id: 'opt2_team_ethos',
            style: 'Collective Team Above All',
            quote: `"Individual brilliance is wonderful, but football is eleven warriors moving as one unit. The entire squad earned those plaudits."`,
            effects: { reputation: 4, morale: 9, boardConfidence: 6, fanApproval: 7 }
          }
        ]
      },
      {
        id: 'q3_referee_incident',
        outlet: 'Sky Sports Debrief',
        journalist: 'Geoff Shreeves',
        category: 'Matchday Controversy & VAR',
        question: `There were heated moments and contentious refereeing decisions on the pitch today. Do you feel the officials treated your side fairly?`,
        options: [
          {
            id: 'opt3_take_stand',
            style: 'Combative Stance',
            quote: `"The supporters saw it, the players saw it. We won't be bullied by poor decisions. But we fight through adversity no matter what."`,
            effects: { reputation: 3, morale: 8, boardConfidence: -2, fanApproval: 11 }
          },
          {
            id: 'opt3_dignified_focus',
            style: 'Dignified & In Control',
            quote: `"Referees have a tough job. I prefer to focus on what my team can control: our positioning, our pressing, and our finishing."`,
            effects: { reputation: 4, morale: 4, boardConfidence: 8, fanApproval: 5 }
          }
        ]
      }
    ];
  }

  if (stage === 'pre') {
    return [
      {
        id: 'q1_tactical_setup',
        outlet: 'Sky Sports Football',
        journalist: 'David Croft',
        category: 'Tactical Blueprint',
        question: `Manager, how are you approaching the tactical setup for ${c.name} against ${oppName}? Pundits are debating whether your system is suited for a promotion charge in Division ${div}.`,
        options: [
          {
            id: 'opt1_agg',
            style: 'High-Pressing Attack',
            quote: `"We don't fear anyone. We're going to press high, control transitions, and attack with relentless intensity!"`,
            effects: { morale: 7, boardConfidence: 5, fanApproval: 9, reputation: 3 }
          },
          {
            id: 'opt1_comp',
            style: 'Tactical Discipline',
            quote: `"We have analyzed our opponents rigorously. Compact defense, disciplined shape, and ruthless counter-attacks win trophies."`,
            effects: { morale: 4, boardConfidence: 7, fanApproval: 5, reputation: 4 }
          },
          {
            id: 'opt1_hum',
            style: 'Fan & Grassroots Passion',
            quote: `"This match is for every supporter in the stands. My players will battle for every inch on that pitch with pure heart."`,
            effects: { morale: 10, boardConfidence: 4, fanApproval: 12, reputation: 2 }
          }
        ]
      },
      {
        id: 'q2_mind_games',
        outlet: 'The Guardian Sport',
        journalist: 'Jonathan Wilson',
        category: 'Managerial Mind Games',
        question: `The opposing dugout has hinted that your squad lacks the depth and stamina to sustain high-tempo pressure for 90 minutes. What is your response?`,
        options: [
          {
            id: 'opt2_fiery_rebuttal',
            style: 'Fiery Retort',
            quote: `"Let them talk in the press. We do our talking on the grass. When that whistle blows, they'll discover what my squad is made of."`,
            effects: { reputation: 4, morale: 9, boardConfidence: 5, fanApproval: 10 }
          },
          {
            id: 'opt2_tactical_smile',
            style: 'Psychological Composure',
            quote: `"They are trying to distract themselves from their own defensive vulnerabilities. We will exploit the spaces they leave behind."`,
            effects: { reputation: 5, morale: 6, boardConfidence: 7, fanApproval: 6 }
          }
        ]
      },
      {
        id: 'q3_squad_fitness',
        outlet: 'L\'Equipe Football',
        journalist: 'Julien Laurens',
        category: 'Squad Fitness & Rotation',
        question: `How are you managing dressing room energy and fitness levels ahead of this crucial encounter?`,
        options: [
          {
            id: 'opt3_peak_condition',
            style: 'Peak Physical Readiness',
            quote: `"Our sports science and medical team have the boys in peak physical condition. We are ready to run through brick walls."`,
            effects: { reputation: 3, morale: 7, boardConfidence: 6, fanApproval: 6 }
          },
          {
            id: 'opt3_rotation_warning',
            style: 'Every Man Ready',
            quote: `"Everyone in this dressing room is fighting for a starting shirt. Nobody gets comfortable, and that keeps our hunger sharp."`,
            effects: { reputation: 3, morale: 5, boardConfidence: 7, fanApproval: 5 }
          }
        ]
      }
    ];
  }

  // Default: General Media Briefing
  return [
    {
      id: 'q1_tactics_general',
      outlet: 'Sky Sports Football',
      journalist: 'David Croft',
      category: 'Tactical Philosophy',
      question: `Manager, how are you approaching the overall tactical identity of ${c.name}? Supporters are eager to know whether you prioritize expressive attacking or defensive solidity in Division ${div}.`,
      options: [
        {
          id: 'opt1_agg',
          style: 'High-Pressing Attack',
          quote: `"We don't fear anyone. We're going to press high, control transitions, and attack with relentless intensity!"`,
          effects: { morale: 7, boardConfidence: 5, fanApproval: 8, reputation: 3 }
        },
        {
          id: 'opt1_comp',
          style: 'Tactical Discipline',
          quote: `"We have analyzed our league rigorously. Compact defense, disciplined shape, and ruthless counter-attacks win promotions."`,
          effects: { morale: 4, boardConfidence: 7, fanApproval: 5, reputation: 4 }
        },
        {
          id: 'opt1_hum',
          style: 'Grassroots Passion & Heart',
          quote: `"This match is for every supporter in the stands. My players will battle for every inch on that pitch with pure heart."`,
          effects: { morale: 10, boardConfidence: 4, fanApproval: 12, reputation: 2 }
        }
      ]
    },
    {
      id: 'q2_dressing_room',
      outlet: 'The Athletic Football Review',
      journalist: 'Amy Lawrence',
      category: 'Squad Morale & Harmony',
      question: `Squad morale currently stands at ${c.morale}%. How do you keep the dressing room unified and hungry as the season unfolds?`,
      options: [
        {
          id: 'opt2_merit',
          style: 'Total Meritocracy',
          quote: `"Reputation counts for zero in my squad. Whoever trains hardest and executes our tactical plan earns the shirt on matchday."`,
          effects: { morale: 6, boardConfidence: 6, fanApproval: 5, reputation: 3 }
        },
        {
          id: 'opt2_diplomatic',
          style: 'United Brotherhood',
          quote: `"We have an exceptional bond in this dressing room. We win together, suffer together, and conquer together as one family."`,
          effects: { morale: 10, boardConfidence: 5, fanApproval: 7, reputation: 3 }
        },
        {
          id: 'opt2_demanding',
          style: 'Relentless High Standards',
          quote: `"Anyone who puts ego above the club crest can find the exit. We hold elite standards for every minute we wear this badge."`,
          effects: { morale: 2, boardConfidence: 8, fanApproval: 6, reputation: 4 }
        }
      ]
    },
    {
      id: 'q3_board_expectations',
      outlet: 'Gazzetta dello Sport',
      journalist: 'Matteo Bellini',
      category: 'Board Ambitions & Silverware',
      question: `The board and fans have set clear expectations for this campaign. Do you feel the personal pressure to deliver promotion and silverware?`,
      options: [
        {
          id: 'opt3_thrive',
          style: 'Thrive on Pressure',
          quote: `"Pressure is a privilege. I came to ${c.name} to build a legacy, gain promotion, and take this club to the very top division."`,
          effects: { boardConfidence: 8, fanApproval: 10, morale: 7, reputation: 4 }
        },
        {
          id: 'opt3_process',
          style: 'Process & Sustainability',
          quote: `"We are building a sustainable football powerhouse block by block. Trust our process and the silverware will follow."`,
          effects: { boardConfidence: 7, fanApproval: 5, morale: 4, reputation: 3 }
        },
        {
          id: 'opt3_demand_backing',
          style: 'Demand Board Transfer Backing',
          quote: `"If the board want titles, they must continue backing our transfer negotiations and sanctioning key target signings."`,
          effects: { boardConfidence: 3, fanApproval: 8, morale: 5, reputation: 3 }
        }
      ]
    }
  ];
}

world.getPressConference = async function(w, clubName, stage = 'general', regenerate = false) {
  const c = w.clubs.find(x => x.name === clubName) || w.clubs[0];
  if (!c) return { error: 'Club not found' };

  if (!w.managerCareer) {
    world.getManagerCareerState(w);
  }
  const mc = w.managerCareer || { name: 'Head Coach', reputation: 30, tier: 'Tactician' };
  const oppClub = w.clubs.find(x => x.name !== c.name && x.division === c.division) || w.clubs[0];
  const pendingBidsCount = (w.incomingOffers || []).filter(o => o.status === 'pending').length;
  const approaches = (mc.approaches || []).filter(a => a.status === 'pending' || a.status === 'stalled');

  const squadPlayers = (c.players || []).map(pid => w.market.find(p => p.id === pid)).filter(Boolean);
  const starPlayer = squadPlayers.sort((a,b) => (b.rating || 0) - (a.rating || 0))[0] || { name: 'Star Player', position: 'ST' };

  let questions = null;
  let isAiLiveGenerated = false;

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are a sports media AI generating realistic, high-stakes football press conference questions for a manager career simulation game.
Club: "${c.name}" (Division ${c.division})
Manager: "${mc.name}" (Reputation: ${mc.reputation}/100, Tier: "${mc.tier}", Wins: ${mc.wins || 0}, Matches: ${mc.matches || 0})
Squad Morale: ${c.morale || 75}%
Board Confidence: ${c.boardConfidence || 85}%
Current Press Stage: "${stage}" (choices: general, pre, post, transfer, headhunt)
Opponent Context: "${oppClub?.name}"
Star Player: "${starPlayer.name}" (${starPlayer.position})
Pending Transfer Bids: ${pendingBidsCount}
Other Clubs Actively Approaching Manager: "${approaches.map(a => a.club).join(', ') || 'None'}"

Generate exactly 3 sharp, distinct journalistic questions from top media outlets (e.g. Sky Sports, The Athletic, BBC Sport, Fabrizio Romano, Gazzetta dello Sport, Marca, ESPN).
For each question, provide 3 realistic response options with direct in-character quotes and explicit stat impacts:
1. Passionate/Combative/Dressing-Room backing
2. Tactical/Analytical/Pragmatic
3. Demanding/High-standards/Controversial

Return ONLY a valid JSON array of 3 objects with this exact structure:
[
  {
    "id": "q1",
    "outlet": "Sky Sports",
    "journalist": "Journalist Name",
    "category": "Topic",
    "question": "Question text referencing specific club details",
    "options": [
      {
        "id": "opt1_1",
        "style": "Tone / Philosophy label",
        "quote": "Direct manager quote",
        "effects": { "reputation": 3, "morale": 8, "boardConfidence": 4, "fanApproval": 8 }
      },
      {
        "id": "opt1_2",
        "style": "Tactical Masterclass",
        "quote": "Direct manager quote",
        "effects": { "reputation": 5, "morale": 4, "boardConfidence": 7, "fanApproval": 5 }
      },
      {
        "id": "opt1_3",
        "style": "Demanding Standards",
        "quote": "Direct manager quote",
        "effects": { "reputation": 3, "morale": -2, "boardConfidence": 8, "fanApproval": 6 }
      }
    ]
  }
]`;

      const response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500))
      ]);

      const text = response?.text?.trim() || '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          questions = parsed;
          isAiLiveGenerated = true;
        }
      }
    } catch (e) {}
  }

  if (!questions || questions.length === 0) {
    questions = generateProceduralPressQuestions(c, mc, oppClub, starPlayer, pendingBidsCount, approaches, stage);
  }

  return {
    stage,
    questions,
    club: c.name,
    opponent: oppClub ? oppClub.name : 'Rival',
    division: c.division,
    managerName: mc.name,
    managerReputation: mc.reputation || 30,
    squadMorale: c.morale || 75,
    boardConfidence: c.boardConfidence || 85,
    approachesCount: approaches.length,
    isAiLiveGenerated
  };
};

world.submitPressConference = function(w, clubName, answers = [], customStatements = {}) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  if (!w.managerCareer) {
    world.getManagerCareerState(w);
  }
  const mc = w.managerCareer || { name: 'Head Coach', reputation: 30, tier: 'Tactician' };

  let totalMoraleChange = 0;
  let totalBoardChange = 0;
  let totalFanChange = 0;
  let totalRepChange = 0;
  let summaryQuotes = [];

  answers.forEach((ans, idx) => {
    const qId = ans.questionId || `q_${idx}`;
    const customTxt = customStatements[qId] || customStatements[idx];

    if (customTxt && String(customTxt).trim().length > 3) {
      const textLower = String(customTxt).toLowerCase();
      let repDelta = 3;
      let moraleDelta = 6;
      let boardDelta = 5;
      let fanDelta = 7;

      if (/win|glory|heart|pride|fight|warrior|together|family|passion|fans|belie(ve|f)/.test(textLower)) {
        moraleDelta += 4;
        fanDelta += 4;
        repDelta += 1;
      }
      if (/tactics|system|compact|press|shape|analysis|discipline|transition|study/.test(textLower)) {
        repDelta += 2;
        boardDelta += 3;
      }
      if (/referee|var|cheat|corrupt|disgrace|unacceptable|blame|rubbish/.test(textLower)) {
        fanDelta += 3;
        boardDelta -= 2;
        moraleDelta += 2;
      }
      if (/loyal|staying|committed|love this club|never leave|here to stay/.test(textLower)) {
        boardDelta += 5;
        fanDelta += 6;
        moraleDelta += 4;
      }

      totalRepChange += repDelta;
      totalMoraleChange += moraleDelta;
      totalBoardChange += boardDelta;
      totalFanChange += fanDelta;
      summaryQuotes.push(`"${customTxt.trim()}"`);
    } else if (ans.effects) {
      totalMoraleChange += Number(ans.effects.morale) || 0;
      totalBoardChange += Number(ans.effects.boardConfidence) || 0;
      totalFanChange += Number(ans.effects.fanApproval) || 0;
      totalRepChange += Number(ans.effects.reputation) || 0;
      if (ans.quote) summaryQuotes.push(ans.quote);
    }
  });

  const prevMorale = c.morale || 70;
  const prevRep = mc.reputation || 28;

  c.morale = Math.max(25, Math.min(99, prevMorale + totalMoraleChange));
  c.fanSatisfaction = Math.max(25, Math.min(99, (c.fanSatisfaction || 70) + totalFanChange));
  c.boardConfidence = Math.max(25, Math.min(99, (c.boardConfidence || 75) + totalBoardChange));

  mc.boardConfidence = c.boardConfidence;
  mc.reputation = Math.min(100, Math.max(10, prevRep + totalRepChange));

  if (mc.reputation < 35) mc.tier = 'Grassroots Tactician';
  else if (mc.reputation < 55) mc.tier = 'Rising Coach';
  else if (mc.reputation < 75) mc.tier = 'Respected Gaffer';
  else if (mc.reputation < 90) mc.tier = 'Elite Mastermind';
  else mc.tier = 'World-Class Legend';

  let headline = '';
  let subheading = '';
  if (totalMoraleChange >= 12) {
    headline = `🔥 GAFFER RALLIES THE DRESSING ROOM: ${mc.name.toUpperCase()} DELIVERS MASTERCLASS IN MEDIA LEADERSHIP`;
    subheading = `Spirited answers inspire players and supporters as squad morale surges to ${c.morale}%!`;
  } else if (totalRepChange >= 7) {
    headline = `⭐ TACTICAL INTELLECT: HOW ${mc.name.toUpperCase()} WON OVER THE NATIONAL MEDIA`;
    subheading = `Pundits praise manager's vision and clarity. Manager reputation climbs to ${mc.reputation}/100 (${mc.tier}).`;
  } else if (totalBoardChange >= 10) {
    headline = `🤝 BOARD BACKING SECURED: DIRECTORS ENTHRALLED BY ${mc.name.toUpperCase()}'S PRESS ADDRESS`;
    subheading = `Boardroom confidence rises to an impressive ${c.boardConfidence}%.`;
  } else {
    headline = `🎙️ PRESS BRIEFING CONCLUDED: ${mc.name.toUpperCase()} SETS THE AGENDA FOR ${c.name.toUpperCase()}`;
    subheading = `Full media transcript reveals tactical intent, player backing, and promotion ambitions.`;
  }

  mc.careerHistory = mc.careerHistory || [];
  mc.careerHistory.unshift({
    season: w.season || 1,
    club: c.name,
    event: `Addressed National Press Conference: Rep ${prevRep} &rarr; ${mc.reputation} (+${totalRepChange}), Squad Morale ${prevMorale}% &rarr; ${c.morale}%`
  });
  if (mc.careerHistory.length > 50) mc.careerHistory.pop();

  w.news.unshift({
    id: `press_${Date.now()}`,
    season: w.season,
    type: 'media',
    text: `🎙️ PRESS HEADLINES: ${headline}. Manager Reputation stands at ${mc.reputation}/100 (${mc.tier}), Squad Morale at ${c.morale}%.`,
    at: new Date().toISOString()
  });

  world.persist();
  return {
    success: true,
    headline,
    subheading,
    leadQuote: summaryQuotes[0] || '',
    allQuotes: summaryQuotes,
    repChange: totalRepChange,
    moraleChange: totalMoraleChange,
    boardChange: totalBoardChange,
    fanChange: totalFanChange,
    newReputation: mc.reputation,
    newTier: mc.tier,
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

// -------------------------------------------------------------
// 12. ADVANCED MANAGER & CLUB OWNER ECOSYSTEM
// -------------------------------------------------------------

// 1. Opponent Scouting Report & Pre-Match Tactical Dossier
world.getOpponentScoutingReport = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const fixture = world.getNextFixture(w);
  let opponentName = null;
  let isHome = true;

  if (fixture && fixture.fixture) {
    if (fixture.fixture.home === c.name) {
      opponentName = fixture.fixture.away;
      isHome = true;
    } else if (fixture.fixture.away === c.name) {
      opponentName = fixture.fixture.home;
      isHome = false;
    }
  }

  if (!opponentName) {
    const rival = c.rivals?.same?.name || c.rivalName || w.clubs.find(x => x.name !== c.name)?.name || 'FC Barcelona';
    opponentName = rival;
  }

  const opp = w.clubs.find(x => x.name === opponentName) || w.clubs[0];
  const oppPlayers = (opp.players || []).map(id => w.market.find(p => p.id === id)).filter(Boolean);

  // Identify Danger Man
  const dangerMan = oppPlayers.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || {
    name: 'Opposition Playmaker',
    position: 'CF',
    rating: 86,
    form: 92,
    goals: 14
  };

  const formations = [
    { name: '4-3-3 Gegenpress', style: 'High pressing & suffocating counter-press', weakness: 'Space left behind aggressive full-backs', counter: 'Direct counter-attacks down the flanks with pacey wingers' },
    { name: '3-5-2 Wingbacks Overload', style: 'Midfield numerical superiority & wingback crosses', weakness: 'Vulnerable in wide defensive transitions when wingbacks push up', counter: 'Quick diagonals into the channels' },
    { name: '4-2-3-1 Fluid Possession', style: 'Patient build-up through central attacking midfielders', weakness: 'Over-reliance on the central pivot playmaker', counter: 'Aggressive man-marking on their central midfield pivot' },
    { name: '5-4-1 Deep Low Block', style: 'Resolute defensive bunker waiting for set-pieces', weakness: 'Low shot volume & lack of forward passing outlets', counter: 'Overloading the half-spaces and taking long-range efforts' }
  ];

  const tacticInfo = formations[Math.abs((opp.name.length + (w.season || 1)) % formations.length)];

  return {
    opponent: {
      name: opp.name,
      division: opp.division,
      reputation: opp.reputation || 75,
      jersey: opp.jersey,
      crest: opp.crest,
      isHome
    },
    dangerMan: {
      name: dangerMan.name,
      position: dangerMan.position || 'CF',
      rating: dangerMan.rating || 85,
      form: dangerMan.form || 88,
      style: dangerMan.personality || 'Clinical Finisher'
    },
    tactics: tacticInfo,
    scoutTips: [
      `Double-mark ${dangerMan.name} to cut off their primary final-third pass outlet.`,
      `Opponent transitions slowly into defensive shape; instruct wingers to attack space immediately upon winning possession.`,
      `Their goalkeeper struggles with aerial deliveries; instruct corner-takers to whip in near-post crosses.`
    ]
  };
};

// 2. Elite Manager Job Offers from Global Heavyweights
world.getManagerJobOffers = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { offers: [] };

  const rep = c.manager?.reputation || 75;
  const wins = c.stats?.wins || 0;

  const candidateClubs = [
    { name: 'Real Madrid', country: 'Spain', division: 1, prestige: 98, budget: 120, salary: 8.5, objective: 'Conquer the Continental Champions League' },
    { name: 'Manchester City', country: 'England', division: 1, prestige: 96, budget: 140, salary: 9.0, objective: 'Execute flawless tactical domination & Domestic Double' },
    { name: 'Bayern Munich', country: 'Germany', division: 1, prestige: 94, budget: 95, salary: 7.5, objective: 'Undefeated League Title & Super Cup' },
    { name: 'Paris Saint-Germain', country: 'France', division: 1, prestige: 92, budget: 110, salary: 8.0, objective: 'Deliver European silverware with world-class galacticos' },
    { name: 'Kerala Blasters FC', country: 'India', division: 1, prestige: 85, budget: 45, salary: 3.5, objective: 'National Championship & AFC Champions League qualification' },
    { name: 'Inter Milan', country: 'Italy', division: 1, prestige: 91, budget: 70, salary: 6.0, objective: 'Scudetto Triumph & Tactical Perfection' }
  ].filter(x => x.name !== c.name);

  // Generate 2-3 tailored offers based on club success
  const offers = candidateClubs.slice(0, 3).map((item, idx) => ({
    id: `offer_${item.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${idx}`,
    clubName: item.name,
    country: item.country,
    division: item.division,
    prestige: item.prestige,
    transferBudget: item.budget,
    managerSalary: item.salary,
    seasonObjective: item.objective,
    expiryWeeks: 2
  }));

  return { offers, currentClub: c.name };
};

world.acceptManagerJobOffer = function(w, currentClubName, targetClubName) {
  const curr = w.clubs.find(x => x.name === currentClubName);
  const target = w.clubs.find(x => x.name === targetClubName);
  if (!target) return { error: 'Target club not found.' };

  const mgrName = curr?.manager?.name || 'Head Coach';
  target.manager = {
    name: mgrName,
    style: curr?.manager?.style || 'Gegenpress',
    salary: 8.0,
    reputation: Math.min(99, (curr?.manager?.reputation || 75) + 8)
  };

  w.selectedClub = target.name;
  w.news.unshift({
    id: `hire_${Date.now()}`,
    season: w.season,
    type: 'manager',
    text: `🚨 BLOCKBUSTER APPOINTMENT: ${mgrName} has officially left ${currentClubName} to become the new Head Manager of ${target.name}!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, newClub: target };
};

// 3. Stadium & Kit Naming Rights Deals for Owners
world.getNamingRightsOffers = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { stadiumBids: [], kitBids: [] };

  const stadiumBids = [
    {
      id: 'stadium_emirates',
      sponsor: 'Emirates Global Airways',
      proposedName: 'Fly Emirates Arena',
      upfrontCash: 35.0,
      annualRevenue: 12.0,
      contractYears: 3,
      perks: '+15% Global International Fan Engagement'
    },
    {
      id: 'stadium_telecom',
      sponsor: 'Apex Ultra Telecom 5G',
      proposedName: 'Apex 5G Superdome',
      upfrontCash: 28.0,
      annualRevenue: 10.5,
      contractYears: 4,
      perks: 'Free High-Density Wi-Fi for 60,000 Spectators'
    },
    {
      id: 'stadium_redbull',
      sponsor: 'Red Bull Energy World',
      proposedName: 'Red Bull Sports Complex',
      upfrontCash: 42.0,
      annualRevenue: 15.0,
      contractYears: 3,
      perks: '+8% Extra Squad Stamina Regrowth at Home matches'
    }
  ];

  const kitBids = [
    {
      id: 'kit_spotify',
      sponsor: 'Spotify Worldwide',
      slogan: 'Music Meets Football',
      upfrontCash: 22.0,
      annualRevenue: 8.5,
      contractYears: 3
    },
    {
      id: 'kit_samsung',
      sponsor: 'Samsung Electronics',
      slogan: 'Inspire the World',
      upfrontCash: 25.0,
      annualRevenue: 9.5,
      contractYears: 3
    }
  ];

  return { stadiumBids, kitBids, activeNaming: c.stadiumNamingDeal || null };
};

world.signNamingRightsDeal = function(w, clubName, bidType, bidId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const data = world.getNamingRightsOffers(w, clubName);
  let deal = null;

  if (bidType === 'stadium') {
    deal = data.stadiumBids.find(b => b.id === bidId);
    if (!deal) return { error: 'Stadium bid not found' };
    c.cash = Math.round((c.cash + deal.upfrontCash) * 10) / 10;
    c.stadium.name = deal.proposedName;
    c.stadiumNamingDeal = deal;
  } else {
    deal = data.kitBids.find(b => b.id === bidId);
    if (!deal) return { error: 'Kit bid not found' };
    c.cash = Math.round((c.cash + deal.upfrontCash) * 10) / 10;
    c.shirtSponsorDeal = deal;
  }

  w.news.unshift({
    id: `naming_${Date.now()}`,
    season: w.season,
    type: 'finance',
    text: `🤝 COMMERCIAL TRIUMPH: ${c.name} signed a landmark ₹${deal.upfrontCash}M sponsorship agreement with ${deal.sponsor}!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, deal, cash: c.cash };
};

// 4. Minority Stake Equity Financing
world.getMinorityStakeOffers = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { offers: [] };

  const equitySold = c.minorityEquitySold || 0;
  const remainingSellable = Math.max(0, 49 - equitySold); // Owner retains absolute >51% control

  const offers = [
    {
      id: 'equity_apex_pe',
      syndicate: 'Apex Private Equity Syndicate',
      stakePct: 15,
      valuation: Math.round((c.cash + 100) * 1.6),
      cashInjection: 32.0,
      terms: 'Non-voting minority partnership. Chairman retains 100% sporting and tactical control.'
    },
    {
      id: 'equity_sovereign',
      syndicate: 'Sovereign Heritage Sports Fund',
      stakePct: 20,
      valuation: Math.round((c.cash + 120) * 1.8),
      cashInjection: 50.0,
      terms: 'Capital designated for state-of-the-art youth academy and stadium hospitality tier.'
    }
  ];

  return { offers, equitySold, remainingSellable };
};

world.sellMinorityStake = function(w, clubName, offerId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const data = world.getMinorityStakeOffers(w, clubName);
  const offer = data.offers.find(o => o.id === offerId);
  if (!offer) return { error: 'Offer not found' };

  if ((c.minorityEquitySold || 0) + offer.stakePct > 49) {
    return { error: 'Cannot sell more than 49% equity. Owner must retain controlling 51% stake.' };
  }

  c.minorityEquitySold = (c.minorityEquitySold || 0) + offer.stakePct;
  c.cash = Math.round((c.cash + offer.cashInjection) * 10) / 10;

  w.news.unshift({
    id: `equity_${Date.now()}`,
    season: w.season,
    type: 'finance',
    text: `🏛️ EQUITY FINANCING: ${c.name} received a ₹${offer.cashInjection}M capital injection from ${offer.syndicate} for a ${offer.stakePct}% minority stake.`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, cash: c.cash, remainingEquity: 100 - c.minorityEquitySold };
};

// 5. Director of Football (DoF) Appointments
world.getDoFCandidates = function(w) {
  return [
    {
      id: 'dof_sabermetrics',
      name: 'Marco "Sabermetrics" Silva',
      specialty: 'Data Analytics & Transfer Value Optimization',
      perk: '15% Discount on all transfer negotiations & automatic bargain scout alerts',
      salary: 1.8,
      rating: 92
    },
    {
      id: 'dof_galactico',
      name: 'Sir Reginald Vance',
      specialty: 'Marquee Superstar Negotiation & VIP Network',
      perk: 'Convinces 85+ OVR superstars to accept 20% lower wage demands',
      salary: 2.5,
      rating: 95
    },
    {
      id: 'dof_academy',
      name: 'Jean-Luc Fontaine',
      specialty: 'Youth Scouting & Academy Nurturing',
      perk: '+5 OVR Rating boost to all regenerated youth academy graduates',
      salary: 1.5,
      rating: 90
    }
  ];
};

world.hireDirectorOfFootball = function(w, clubName, dofId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  const candidates = world.getDoFCandidates(w);
  const dof = candidates.find(x => x.id === dofId);
  if (!dof) return { error: 'Candidate not found' };

  c.directorOfFootball = dof;
  w.news.unshift({
    id: `dof_${Date.now()}`,
    season: w.season,
    type: 'manager',
    text: `👔 FRONT OFFICE APPOINTMENT: ${c.name} appointed ${dof.name} as Director of Football (${dof.specialty})!`,
    at: new Date().toISOString()
  });

  world.persist();
  return { success: true, dof: c.directorOfFootball };
};

// 6. Seasonal Board Mandates & Target Tracker
world.getSeasonalMandates = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { mandates: [] };

  const isDiv1 = c.division === 1;
  const mandates = [
    {
      id: 'target_league',
      title: isDiv1 ? 'Crown Champions / Continental Qualification' : 'Earn Promotion to Higher Division',
      description: isDiv1 ? 'Finish in the Top 3 to secure continental elite glory.' : 'Finish 1st or 2nd in the division standings.',
      progress: `${c.stats?.wins || 0} Wins logged`,
      status: (c.stats?.wins || 0) >= 3 ? 'on_track' : 'pending',
      bonusReward: 15.0
    },
    {
      id: 'target_financial',
      title: 'Maintain Prudent Financial Fair Play (FFP)',
      description: 'Keep the annual wage bill below the 70% threshold and avoid negative cash balance.',
      progress: `Current Treasury: ₹${Math.round(c.cash)}M`,
      status: c.cash > 5 ? 'on_track' : 'at_risk',
      bonusReward: 10.0
    },
    {
      id: 'target_youth',
      title: 'Academy Integration Pathway',
      description: 'Promote at least one youth prospect and maintain academy training regimes.',
      progress: 'Academy Active',
      status: 'on_track',
      bonusReward: 8.0
    },
    {
      id: 'target_derby',
      title: `Dominate Regional Derby Showdown`,
      description: `Defeat primary rival (${c.rivals?.same?.name || c.rivalName || 'Local Rival'}) in direct clashes.`,
      progress: 'Fixture pending',
      status: 'pending',
      bonusReward: 12.0
    }
  ];

  return { mandates };
};

// 7. Dressing Room Hierarchies & Player Private Meetings
world.getPlayerMeetings = function(w, clubName) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { meetings: [] };

  const squad = (c.players || []).map(id => w.market.find(p => p.id === id)).filter(Boolean);
  if (!squad.length) return { meetings: [] };

  const veteran = squad.find(p => p.age >= 30) || squad[0];
  const underpaid = squad.slice().sort((a, b) => (a.contract?.salary || 1) - (b.contract?.salary || 1))[0];
  const youngGun = squad.find(p => p.age <= 21) || squad[squad.length - 1];

  const meetings = [
    {
      id: 'meeting_minutes',
      player: veteran,
      type: 'playing_time',
      title: 'Veteran Playing Time Confrontation',
      issue: `"Boss, I've noticed I haven't been in the starting XI lately. As a squad leader, I need regular minutes on the pitch, or I will have to explore other options."`,
      choices: [
        { id: 'promise_start', text: '🤝 Promise to start in next fixture (+8 Morale)', outcome: 'player_pleased' },
        { id: 'stand_ground', text: '🛑 "No player is bigger than the team" (-6 Morale)', outcome: 'player_disgruntled' },
        { id: 'rotation_role', text: '🔄 Explain rotation strategy (+4 Morale)', outcome: 'player_understanding' }
      ]
    },
    {
      id: 'meeting_wages',
      player: underpaid,
      type: 'wage_demand',
      title: 'Wage Equity & Performance Demands',
      issue: `"Coach, my performances have outstripped my current wage. The squad knows I'm underpaid compared to recent signings. We need an immediate wage adjustment."`,
      choices: [
        { id: 'grant_bonus', text: '💰 Grant ₹0.5M signing bonus and wage review (+10 Morale)', outcome: 'player_elated' },
        { id: 'postpone_summer', text: '⏳ Promise to renegotiate in the summer window (Neutral)', outcome: 'player_neutral' },
        { id: 'reject_demand', text: '❌ Reject request firmly (-10 Morale, Transfer Request risk)', outcome: 'player_furious' }
      ]
    }
  ];

  return { meetings };
};

world.resolvePlayerMeeting = function(w, clubName, meetingId, choiceId) {
  const c = w.clubs.find(x => x.name === clubName);
  if (!c) return { error: 'Club not found' };

  let moraleDelta = 0;
  let feedback = '';

  if (choiceId === 'promise_start') {
    moraleDelta = 8;
    feedback = 'The player accepted your personal commitment and returned to training energized.';
  } else if (choiceId === 'stand_ground') {
    moraleDelta = -6;
    feedback = 'The player accepted your decision grudgingly, but some dressing room tension remains.';
  } else if (choiceId === 'rotation_role') {
    moraleDelta = 4;
    feedback = 'The player appreciated your honest tactical explanation and committed to his squad role.';
  } else if (choiceId === 'grant_bonus') {
    moraleDelta = 10;
    c.cash = Math.max(0, Math.round((c.cash - 0.5) * 10) / 10);
    feedback = 'Bonus approved! The player is thrilled and pledged his long-term loyalty to the badge.';
  } else if (choiceId === 'postpone_summer') {
    moraleDelta = 0;
    feedback = 'The player agreed to wait until the summer transfer window opens.';
  } else if (choiceId === 'reject_demand') {
    moraleDelta = -10;
    feedback = 'The player walked out of your office furious and has reportedly contacted his agent.';
  }

  c.morale = Math.max(30, Math.min(100, c.morale + moraleDelta));
  world.persist();

  return {
    success: true,
    moraleDelta,
    currentMorale: c.morale,
    feedback
  };
};

module.exports = world;



