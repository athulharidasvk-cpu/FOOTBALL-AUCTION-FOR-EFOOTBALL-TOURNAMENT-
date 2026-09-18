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

// Selling lists the player's asking price. A real club must still make the buying offer,
// so there is no fake "FREE_MARKET_BUYER" club.
world.sellPlayer = function(w,clubName,playerId,asking){
  const c=w.clubs.find(x=>x.name===clubName),p=w.market.find(x=>x.id===playerId);
  if(!c||!p||p.ownerClub!==c.name)return {error:'Player not owned by this club.'};
  p.askingPrice=Math.max(1,Math.round(Number(asking)||p.askingPrice||5));
  p.status='listed';
  w.news.unshift({id:`sell_${Date.now()}`,season:w.season,type:'transfer',text:`${p.name} is listed by ${c.name} for ₹${p.askingPrice}M.`,at:new Date().toISOString()});
  world.persist();
  return p;
};
