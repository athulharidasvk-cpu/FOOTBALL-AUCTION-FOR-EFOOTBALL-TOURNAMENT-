const express = require('express');
const socketIO = require('socket.io');

// Explicit dependency loading sequence:
// 1. world_engine.js: Core state, simulation, club & manager logic
// 2. world_v4_patch.js: Economy, pricing, and seller fixes
// 3. world_v4_recovery.js: Persistence reload from disk & fallback world generator
let world;
try {
  world = require('./world_engine');
} catch (err) {
  console.error('[WorldPreload] FATAL: Error loading ./world_engine:', err);
  throw err;
}

try {
  require('./world_v4_patch');
} catch (err) {
  console.error('[WorldPreload] WARNING: Error loading ./world_v4_patch:', err);
  throw err;
}

try {
  require('./world_v4_recovery');
} catch (err) {
  console.error('[WorldPreload] WARNING: Error loading ./world_v4_recovery:', err);
  throw err;
}

let attachedApp = false;
let attachedIO = false;
let appRef = null;
let ioRef = null;

function safeState(w){ return world.globalState(w); }
function ref(bodyOrReq, socket){
  const b = (bodyOrReq && typeof bodyOrReq === 'object' && bodyOrReq.body) ? bodyOrReq.body : (bodyOrReq || {});
  const q = (bodyOrReq && typeof bodyOrReq === 'object' && bodyOrReq.query) ? bodyOrReq.query : {};
  const room = b.room || b.code || q.room || q.code || socket?.worldRoom || socket?.handshake?.query?.room || null;
  const soloId = b.soloId || q.soloId || socket?.worldSoloId || socket?.handshake?.query?.soloId || null;
  const managerId = b.managerId || q.managerId || socket?.worldManagerId || null;
  return {room, soloId, managerId};
}
function get(bodyOrReq, socket){
  const r = ref(bodyOrReq, socket);
  const found = world.getWorld(r);
  if (!found && (r.room || r.soloId)) {
    console.warn(`[WorldPreload] getWorld lookup failed for ref:`, JSON.stringify(r));
  }
  return found;
}
function emitState(socket,w){if(socket&&w)socket.emit('world4:state',safeState(w));}
function broadcast(io,w){if(!w)return;const payload=safeState(w);if(w.roomCode)io.to(`world4:${w.roomCode}`).emit('world4:state',payload);}
function joinRoomSocket(socket,w){if(w?.roomCode)socket.join(`world4:${w.roomCode}`);}
function seedNewClub(w,c){
  if(!c)return;
  if(c.players && c.players.length >= 11) return;
  const free=w.market.filter(p=>!p.ownerClub&&p.status!=='sold').slice(0,15);
  free.forEach((p,i)=>{p.ownerClub=c.name;p.status='contracted';p.askingPrice=Math.max(3,Math.round(p.rating/12));c.players.push(p.id);});
}
function attachApp(app){
  if(attachedApp)return; attachedApp=true; appRef=app;
  // Parse incoming JSON and URL-encoded bodies for /api/world4 routes
  // (ensures req.body is parsed even when routes are registered before server.js's app.use(express.json()))
  app.use('/api/world4', express.json({ limit: '10mb' }));
  app.use('/api/world4', express.urlencoded({ extended: true, limit: '10mb' }));
  app.get('/',(req,res)=>res.sendFile(require('path').join(__dirname,'public','football-world.html')));
  app.get('/football-world',(req,res)=>res.sendFile(require('path').join(__dirname,'public','football-world.html')));
  app.get('/api/world4/rooms',(req,res)=>res.json(world.roomsList()));
  app.post('/api/world4/solo/create',(req,res)=>{const w=world.createSolo();res.json({soloId:w.soloId,state:safeState(w)});});
  app.get('/api/world4/state',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(safeState(w));});
  app.post('/api/world4/room/create',(req,res)=>{const w=world.createRoom(req.body?.name,req.body?.maxHumans,req.body?.managerName);const j=world.joinRoom(w,req.body?.managerName);res.json({code:w.roomCode,managerId:j.id,state:safeState(w)});});
  app.post('/api/world4/room/join',(req,res)=>{const w=world.worldRooms.get(String(req.body?.code||'').toUpperCase());if(!w)return res.status(404).json({error:'Room not found'});const j=world.joinRoom(w,req.body?.managerName);if(j.error)return res.status(400).json(j);res.json({code:w.roomCode,managerId:j.id,state:safeState(w)});});
  app.post('/api/world4/club/select',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.chooseClub(w,req.body?.club,req.body?.managerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/club/create',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.createClub(w,req.body,req.body?.managerId);if(r?.error)return res.status(400).json(r);seedNewClub(w,r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/economy',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.updateEconomy(w,req.body?.club,req.body);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/jersey/update',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.updateJersey(w,req.body?.club,req.body?.jersey||req.body);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/jersey/launch',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.launchJersey(w,req.body?.club);if(r?.error)return res.status(400).json(r);world.persist();res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/save',(req,res)=>{const w=get(req,req);world.persist();res.json({ok:true,message:'Career successfully saved to persistent storage.',state:w?safeState(w):null});});
  app.get('/api/world4/budget',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const c=w.clubs.find(x=>x.name===(req.query?.club||w.selectedClub));if(!c)return res.status(404).json({error:'Club not found'});res.json(world.calculateClubBudget(w, c));});
  app.get('/api/world4/sponsors',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.sponsorshipOffers(w,req.query?.club));});
  app.post('/api/world4/sponsor/sign',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.signSponsor(w,req.body?.club,req.body?.offerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.get('/api/world4/managers',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(w.managers);});
  app.post('/api/world4/manager/hire',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.hireManager(w,req.body?.club,req.body?.managerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.get('/api/world4/manager/meeting',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.managerMeeting(w,req.query?.club);if(r?.error)return res.status(400).json(r);res.json(r);});
  app.post('/api/world4/manager/expectation',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.setExpectation(w,req.body?.club,req.body?.expectation,req.body?.stance);if(r?.error)return res.status(400).json(r);world.persist();res.json({state:safeState(w),result:r});});
  app.get('/api/world4/recommendations',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.managerRecommendations(w,req.query?.club));});
  app.post('/api/world4/transfer/offer',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.startBattle(w,req.body?.club,req.body?.playerId,req.body?.fee,req.body?.salary,req.body?.years,req.body?.type||'buy');if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/intervene',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.intervene(w,req.body?.battleId,req.body?.club,req.body?.fee,req.body?.salary,req.body?.years);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/decide',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.completeBattle(w,req.body?.battleId,req.body?.club);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/loan',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.loan(w,req.body?.club,req.body?.playerId,req.body?.months,req.body?.fee,req.body?.salaryShare);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/release',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.releasePlayer(w,req.body?.club,req.body?.playerId);if(r?.error)return res.status(400).json(r);world.persist();res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/contract/update',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.updatePlayerSalary(w,req.body?.club,req.body?.playerId,req.body?.salary,req.body?.signingBonus);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/transfer/sell',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.sellPlayer(w,req.body?.club,req.body?.playerId,req.body?.asking);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/scout/dispatch',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.dispatchScout(w,req.body?.club,req.body?.mission);if(r?.error)return res.status(400).json(r);world.persist();res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/player/create',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.createCustomPlayer(w,req.body?.club,req.body?.player);if(r?.error)return res.status(400).json(r);world.persist();res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/transfer/negotiate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.negotiateTransfer(w,req.body?.club,req.body?.playerId,req.body?.offer);if(r?.error)return res.status(400).json(r);world.persist();res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/transfer/exercise-buyout',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.exerciseLoanBuyout(w,req.body?.club||w.selectedClub,req.body?.playerId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/transfer/expiring',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({players:world.getExpiringContracts(w)});});
  app.get('/api/world4/fixture/next',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getNextFixture(w));});
  app.post('/api/world4/match/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulate(w,req.body||{});if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({match:r,...r,state:safeState(w),nextFixture:world.getNextFixture(w)});});
  app.post('/api/world4/youth/train',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.trainYouthAcademy(w,req.body?.club||w.selectedClub,req.body?.regime);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/chemistry',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.calculateClubChemistry(w,req.query?.club||w.selectedClub);res.json(r);});
  app.get('/api/world4/trophies',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.getTrophyCabinetAndCareer(w,req.query?.club||w.selectedClub);res.json(r);});
  app.get('/api/world4/trophy-career',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.getTrophyCabinetAndCareer(w,req.query?.club||w.selectedClub);res.json(r);});
  app.post('/api/world4/job/accept',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.acceptJobOffer(w,req.body?.offerId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/job/decline',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.declineJobOffer(w,req.body?.offerId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/job/negotiate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.negotiateJobOffer(w,req.body?.offerId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/milestones',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.evaluateManagerMilestones(w));});
  app.post('/api/world4/season/advance',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.advanceSeason(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json({verdict:w.lastSeasonVerdict,season:w.season,state:safeState(w)});});
  app.get('/api/world4/awards',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({history:w.awardsHistory||[],latest:w.awardsHistory?.[0]||null});});
  app.get('/api/world4/tournament',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});if(!w.globalTournament&&w.season%2===0)world.initiateGlobalTournament(w);res.json({tournament:w.globalTournament,history:w.tournamentHistory||[]});});
  app.post('/api/world4/tournament',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});if(!w.globalTournament)world.initiateGlobalTournament(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json({tournament:w.globalTournament,history:w.tournamentHistory||[]});});
  app.post('/api/world4/tournament/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulateGlobalTournamentRound(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Competitions: UCL, Europa, Domestic FA Cup, Promotion Playoffs & Deadline Day
  app.get('/api/world4/ucl',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({ucl:world.initiateUclTournament(w)});});
  app.post('/api/world4/ucl/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulateUclRound(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  app.get('/api/world4/europa',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({europa:world.initiateEuropaTournament(w)});});
  app.post('/api/world4/europa/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulateEuropaRound(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  app.get('/api/world4/cup',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({cup:world.initiateDomesticCup(w)});});
  app.post('/api/world4/cup/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulateDomesticCupRound(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  app.get('/api/world4/playoffs',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({playoffs:world.initiatePlayoffs(w)});});
  app.post('/api/world4/playoffs/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulatePlayoffsRound(w,Number(req.body?.targetTier||2));world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Tactical Playbooks & Philosophy Presets
  app.get('/api/world4/tactics',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getTacticalPlaybookState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/tactics/update',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.updateTacticalPlaybook(w,req.body?.club||w.selectedClub,req.body?.tactics);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Sports Science & Medical Rehabilitation
  app.get('/api/world4/medical',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getMedicalCenterState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/medical/action',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeMedicalAction(w,req.body?.club||w.selectedClub,req.body?.action,req.body);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Loan Army & Wonderkid Network
  app.get('/api/world4/loans',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getLoanArmyState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/loans/loan-out',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.loanOutPlayer(w,req.body?.club||w.selectedClub,req.body?.playerId,req.body?.destinationClub,req.body?.terms);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});
  app.post('/api/world4/loans/recall',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.recallLoanPlayer(w,req.body?.club||w.selectedClub,req.body?.playerId);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Manager Career Mode & Lower Division Assignment Routes
  app.get('/api/world4/manager/lower-clubs', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    res.json({ clubs: world.getLowerDivisionClubs(w, req.query?.country) });
  });
  app.get('/api/world4/manager/career', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    res.json(world.getManagerCareerState(w) || {});
  });
  app.post('/api/world4/manager/assign', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.assignManagerToClub(w, req.body?.club, req.body?.managerName);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });
  app.post('/api/world4/manager/accept-job', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.acceptManagerJobOffer(w, req.body?.targetClub);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });
  app.get('/api/world4/manager/contract', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    res.json(world.getManagerContractState(w, req.query?.club) || {});
  });
  app.post('/api/world4/manager/negotiate-role', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.negotiateManagerRole(w, req.body?.club, req.body?.isNewJob, req.body?.offerId, req.body?.demands, req.body?.managerName);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });
  app.get('/api/world4/manager/approaches', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const careerState = world.getManagerCareerState(w);
    const mc = w.managerCareer || (careerState?.managerCareer);
    res.json({
      approaches: mc?.approaches || [],
      latestApproachAlert: mc?.latestApproachAlert || null,
      currentClub: w.selectedClub
    });
  });
  app.post('/api/world4/manager/approaches/respond', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.respondToManagerApproach(w, req.body?.approachId, req.body?.action);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });
  app.post('/api/world4/manager/approaches/solicit', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.solicitManagerApproaches(w);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });
  app.post('/api/world4/manager/approaches/dismiss-alert', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    if (w.managerCareer) {
      w.managerCareer.latestApproachAlert = null;
    }
    world.persist();
    res.json({ success: true });
  });

  // =============================================================
  // SOCCER CHAMPS: NATIONAL TEAMS & INTERNATIONAL MANAGEMENT
  // =============================================================
  app.get('/api/world4/national/state', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    res.json(world.getNationalTeamState(w));
  });

  app.post('/api/world4/national/respond', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.respondToNationalOffer(w, req.body?.offerId || req.body?.country, req.body?.action);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  app.post('/api/world4/national/simulate', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.simulateNationalTournamentMatch(w, req.body?.keyMomentsGoals);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  // =============================================================
  // SOCCER CHAMPS: YOUTH SCOUTS & WONDERKID ACADEMY
  // =============================================================
  app.get('/api/world4/youth/state', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    res.json(world.getYouthScoutState(w, req.query?.club || w.selectedClub));
  });

  app.post('/api/world4/youth/hire-scout', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.hireYouthScout(w, req.body?.club || w.selectedClub, req.body?.scoutId);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  app.post('/api/world4/youth/dispatch', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.dispatchWonderkidExpedition(w, req.body?.club || w.selectedClub, req.body?.scoutId, req.body?.region);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  app.post('/api/world4/youth/sign', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.signWonderkid(w, req.body?.club || w.selectedClub, req.body?.wonderkidId, req.body?.destination);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  app.post('/api/world4/youth/promote', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.promoteAcademyWonderkid(w, req.body?.club || w.selectedClub, req.body?.academyPlayerId);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  // =============================================================
  // SOCCER CHAMPS: KEY MOMENTS MATCH RECORDER
  // =============================================================
  app.post('/api/world4/match/key-moments', (req, res) => {
    const w = get(req, req);
    if (!w) return res.status(404).json({ error: 'World not found' });
    const r = world.recordKeyMomentsMatch(w, req.body);
    if (r?.error) return res.status(400).json(r);
    world.persist();
    if (ioRef) broadcast(ioRef, w);
    res.json({ result: r, state: safeState(w) });
  });

  // Club Takeovers & Multi-Club Empire
  app.get('/api/world4/takeovers',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getTakeoverAndEmpireState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/takeovers/action',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeTakeoverAction(w,req.body?.club||w.selectedClub,req.body?.action,req.body);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Contract Clauses & Agent Matrix
  app.get('/api/world4/contracts',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getContractMatrixState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/contracts/renew',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeContractRenewal(w,req.body?.club||w.selectedClub,req.body?.playerId,req.body?.clauses);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Pre-Season Global Tours
  app.get('/api/world4/preseason',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getPreseasonTourState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/preseason/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulatePreseasonTour(w,req.body?.club||w.selectedClub,req.body?.tourId);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Hall of Fame & Legends Testimonial
  app.get('/api/world4/halloffame',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getHallOfFameState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/halloffame/testimonial',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.hostTestimonialMatch(w,req.body?.club||w.selectedClub,req.body?.legendId);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Half-time talks & VAR review
  app.post('/api/world4/match/halftime-talk',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeHalfTimeTalk(w,req.body?.club||w.selectedClub,req.body?.talkType);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});
  app.post('/api/world4/match/var-check',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.generateVarReviewIncident(w,req.body));});

  app.get('/api/world4/deadline-day',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getDeadlineDayState(w));});
  app.post('/api/world4/deadline-day/action',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeDeadlineDayAction(w,req.body?.action,req.body);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});

  // Feature A: Swap Deals
  app.post('/api/world4/transfer/swap',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.executeSwapTransfer(w,req.body?.club||w.selectedClub,req.body?.offeredPlayerId,req.body?.targetPlayerId,req.body?.additionalCash);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature B: Dressing Room Revolts & 1-on-1 Talks
  app.get('/api/world4/dressingroom/status',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getDressingRoomStatus(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/dressingroom/talk',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.resolveDressingRoomTalk(w,req.body?.club||w.selectedClub,req.body?.playerId,req.body?.action);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature C: International Management
  app.get('/api/world4/international/status',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getInternationalStatus(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/international/accept',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.acceptInternationalRole(w,req.body?.nation);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/international/simulate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulateInternationalMatch(w);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature D: Visual Stadium Architecture & Ultras Tifos
  app.get('/api/world4/stadium/visual',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getStadiumVisualState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/stadium/upgrade-module',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.upgradeStadiumModule(w,req.body?.club||w.selectedClub,req.body?.moduleType);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/stadium/tifo',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.setStadiumTifo(w,req.body?.club||w.selectedClub,req.body?.tifo);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature E: Derby Day & Historical Head-to-Head
  app.get('/api/world4/derby/h2h',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getDerbyHeadToHead(w,req.query?.club||w.selectedClub));});
  app.get('/api/world4/offers/incoming',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({offers:w.incomingOffers||[]});});
  app.post('/api/world4/offers/respond',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.respondToIncomingOffer(w,req.body?.offerId,req.body?.decision,req.body?.counterFee);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});
  app.post('/api/world4/offers/generate',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.generateAiTransferApproaches(w,req.body?.count||1);world.persist();if(ioRef)broadcast(ioRef,w);res.json({offers:r});});

  // Feature 1: Youth Academy & Intake
  app.get('/api/world4/youth/academy',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getYouthAcademyState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/youth/upgrade',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.upgradeYouthAcademy(w,req.body?.club||w.selectedClub);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/youth/intake/trigger',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.triggerYouthIntake(w,req.body?.club||w.selectedClub);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/youth/promote',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.promoteYouthProspect(w,req.body?.club||w.selectedClub,req.body?.prospectId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/youth/mentor',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.mentorYouthProspect(w,req.body?.club||w.selectedClub,req.body?.youthId,req.body?.mentorId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature 2: Press Conferences & Board Confidence
  app.get('/api/world4/press/questions', async (req,res)=>{
    const w = get(req,req);
    if (!w) return res.status(404).json({error:'World not found'});
    try {
      const data = await world.getPressConference(w, req.query?.club||w.selectedClub, req.query?.stage||'pre', req.query?.regenerate === 'true');
      res.json(data);
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post('/api/world4/press/submit', async (req,res)=>{
    const w = get(req,req);
    if (!w) return res.status(404).json({error:'World not found'});
    try {
      const r = await world.submitPressConference(w, req.body?.club||w.selectedClub, req.body?.answers||[], req.body?.customStatements||{});
      if (r?.error) return res.status(400).json(r);
      world.persist();
      if (ioRef) broadcast(ioRef,w);
      res.json({ result: r, state: safeState(w) });
    } catch(err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.get('/api/world4/board/status',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getBoardStatus(w,req.query?.club||w.selectedClub));});

  // Feature 4: Stadium Facilities & FFP & Sponsorships
  app.get('/api/world4/facilities',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getFacilitiesState(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/facility/upgrade',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.upgradeFacility(w,req.body?.club||w.selectedClub,req.body?.type);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/sponsorship/bids',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getSponsorshipBids(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/sponsorship/accept',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.acceptSponsorshipProposal(w,req.body?.club||w.selectedClub,req.body?.bidId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/ffp/report',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getFFPReport(w,req.query?.club||w.selectedClub));});

  // Feature 5: Backroom Staff & Worldwide Scouting
  app.get('/api/world4/staff',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getBackroomStaff(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/staff/hire',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.hireBackroomStaff(w,req.body?.club||w.selectedClub,req.body?.role,req.body?.staffId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/scout/mission',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.dispatchWorldScouting(w,req.body?.club||w.selectedClub,req.body?.region);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});

  // Feature 6: Set-Pieces & Shootout
  app.get('/api/world4/setpieces',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getSetPieceTactics(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/setpieces/save',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.saveSetPieceTactics(w,req.body?.club||w.selectedClub,req.body?.tactics);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.post('/api/world4/shootout/round',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulatePenaltyShootout(w,req.body?.club||w.selectedClub,req.body?.opponent,req.body?.userShot,req.body?.userDive);res.json(r);});

  // Feature 7: Advanced Manager vs Club Owner Deep Systems
  app.get('/api/world4/scout/opponent',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getOpponentScoutingReport(w,req.query?.club||w.selectedClub));});
  app.get('/api/world4/manager/elite-offers',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getManagerJobOffers(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/manager/accept-elite',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.acceptManagerJobOffer(w,req.body?.currentClub||w.selectedClub,req.body?.targetClub);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/owner/naming-offers',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getNamingRightsOffers(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/owner/sign-naming',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.signNamingRightsDeal(w,req.body?.club||w.selectedClub,req.body?.bidType,req.body?.bidId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/owner/equity-offers',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getMinorityStakeOffers(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/owner/sell-equity',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.sellMinorityStake(w,req.body?.club||w.selectedClub,req.body?.offerId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/owner/dof-candidates',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json({candidates:world.getDoFCandidates(w)});});
  app.post('/api/world4/owner/hire-dof',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.hireDirectorOfFootball(w,req.body?.club||w.selectedClub,req.body?.dofId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
  app.get('/api/world4/mandates',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getSeasonalMandates(w,req.query?.club||w.selectedClub));});
  app.get('/api/world4/player/meetings',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.getPlayerMeetings(w,req.query?.club||w.selectedClub));});
  app.post('/api/world4/player/resolve-meeting',(req,res)=>{const w=get(req,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.resolvePlayerMeeting(w,req.body?.club||w.selectedClub,req.body?.meetingId,req.body?.choiceId);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json({result:r,state:safeState(w)});});
}
function attachIO(io){
  if(attachedIO)return;attachedIO=true;ioRef=io;
  io.on('connection',socket=>{
    const initialRef = ref({}, socket);
    if (initialRef.soloId) socket.worldSoloId = initialRef.soloId;
    if (initialRef.room) socket.worldRoom = initialRef.room;
    if (initialRef.managerId) socket.worldManagerId = initialRef.managerId;
    socket.on('world4:soloCreate',()=>{const w=world.createSolo();socket.worldSoloId=w.soloId;socket.emit('world4:session',{type:'solo',soloId:w.soloId,state:safeState(w)});});
    socket.on('world4:createRoom',d=>{const w=world.createRoom(d?.name,d?.maxHumans,d?.managerName);const j=world.joinRoom(w,d?.managerName);socket.worldRoom=w.roomCode;socket.worldManagerId=j.id;joinRoomSocket(socket,w);socket.emit('world4:session',{type:'online',roomCode:w.roomCode,managerId:j.id,state:safeState(w)});broadcast(io,w);});
    socket.on('world4:joinRoom',d=>{const w=world.worldRooms.get(String(d?.code||'').toUpperCase());if(!w)return socket.emit('world4:error',{error:'Room not found'});const j=world.joinRoom(w,d?.managerName);if(j.error)return socket.emit('world4:error',j);socket.worldRoom=w.roomCode;socket.worldManagerId=j.id;joinRoomSocket(socket,w);socket.emit('world4:session',{type:'online',roomCode:w.roomCode,managerId:j.id,state:safeState(w)});broadcast(io,w);});
    socket.on('world4:selectClub',d=>{const w=get(d,socket);if(!w)return;const r=world.chooseClub(w,d.club,d.managerId||socket.worldManagerId);if(r.error)return socket.emit('world4:error',r);world.persist();broadcast(io,w);});
    socket.on('world4:state',()=>{const w=get({},socket);emitState(socket,w);});
    socket.on('world4:simulate',()=>{const w=get({},socket);if(!w)return;const r=world.simulate(w);if(r.error)return socket.emit('world4:error',r);world.persist();broadcast(io,w);socket.emit('world4:match',r);});
    socket.on('world4:advanceSeason',()=>{const w=get({},socket);if(!w)return;world.advanceSeason(w);world.persist();broadcast(io,w);});
    socket.on('disconnect',()=>{if(socket.worldRoom){const w=world.worldRooms.get(socket.worldRoom);if(w)world.leaveRoom(w,socket.worldManagerId);}});
  });
}

// Patch Express factory so the existing server gets the World routes without rewriting its large server.js.
const originalExpress = express;
function wrappedExpress(){const app=originalExpress();attachApp(app);return app;}
Object.keys(originalExpress).forEach(k=>{try{wrappedExpress[k]=originalExpress[k];}catch(e){}});
require.cache[require.resolve('express')].exports=wrappedExpress;

// Patch Socket.IO Server constructor so World sockets share the same backend process.
const OriginalServer=socketIO.Server;
class WrappedServer extends OriginalServer{constructor(...args){super(...args);attachIO(this);}}
socketIO.Server=WrappedServer;
require.cache[require.resolve('socket.io')].exports=socketIO;

// Keep the module alive as a preload hook.
module.exports={attachApp,attachIO};
