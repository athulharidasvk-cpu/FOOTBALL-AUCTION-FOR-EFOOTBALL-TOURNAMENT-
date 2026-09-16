const express = require('express');
const socketIO = require('socket.io');
const world = require('./world_engine');

let attachedApp = false;
let attachedIO = false;
let appRef = null;
let ioRef = null;

function safeState(w){ return world.globalState(w); }
function ref(body, socket){
  const room = body?.room || socket?.worldRoom || null;
  const soloId = body?.soloId || socket?.worldSoloId || null;
  return {room,soloId};
}
function get(body,socket){return world.getWorld(ref(body,socket));}
function emitState(socket,w){if(socket&&w)socket.emit('world4:state',safeState(w));}
function broadcast(io,w){if(!w)return;const payload=safeState(w);if(w.roomCode)io.to(`world4:${w.roomCode}`).emit('world4:state',payload);}
function joinRoomSocket(socket,w){if(w?.roomCode)socket.join(`world4:${w.roomCode}`);}
function seedNewClub(w,c){
  if(!c)return;
  const free=w.market.filter(p=>!p.ownerClub&&p.status!=='sold').slice(0,15);
  free.forEach((p,i)=>{p.ownerClub=c.name;p.status='contracted';p.askingPrice=Math.max(3,Math.round(p.rating/12));c.players.push(p.id);});
}
function attachApp(app){
  if(attachedApp)return; attachedApp=true; appRef=app;
  app.get('/football-world',(req,res)=>res.sendFile(require('path').join(__dirname,'public','football-world.html')));
  app.get('/api/world4/rooms',(req,res)=>res.json(world.roomsList()));
  app.post('/api/world4/solo/create',(req,res)=>{const w=world.createSolo();res.json({soloId:w.soloId,state:safeState(w)});});
  app.get('/api/world4/state',(req,res)=>{const w=get(req.query,req);if(!w)return res.status(404).json({error:'World not found'});res.json(safeState(w));});
  app.post('/api/world4/room/create',(req,res)=>{const w=world.createRoom(req.body?.name,req.body?.maxHumans,req.body?.managerName);const j=world.joinRoom(w,req.body?.managerName);res.json({code:w.roomCode,managerId:j.id,state:safeState(w)});});
  app.post('/api/world4/room/join',(req,res)=>{const w=world.worldRooms.get(String(req.body?.code||'').toUpperCase());if(!w)return res.status(404).json({error:'Room not found'});const j=world.joinRoom(w,req.body?.managerName);if(j.error)return res.status(400).json(j);res.json({code:w.roomCode,managerId:j.id,state:safeState(w)});});
  app.post('/api/world4/club/select',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.chooseClub(w,req.body.club,req.body.managerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/club/create',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.createClub(w,req.body,req.body.managerId);if(r?.error)return res.status(400).json(r);seedNewClub(w,r);world.persist();res.json(safeState(w));});
  app.post('/api/world4/economy',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.updateEconomy(w,req.body.club,req.body);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.get('/api/world4/sponsors',(req,res)=>{const w=get(req.query,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.sponsorshipOffers(w,req.query.club));});
  app.post('/api/world4/sponsor/sign',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.signSponsor(w,req.body.club,req.body.offerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.get('/api/world4/managers',(req,res)=>{const w=get(req.query,req);if(!w)return res.status(404).json({error:'World not found'});res.json(w.managers);});
  app.post('/api/world4/manager/hire',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.hireManager(w,req.body.club,req.body.managerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(safeState(w));});
  app.get('/api/world4/recommendations',(req,res)=>{const w=get(req.query,req);if(!w)return res.status(404).json({error:'World not found'});res.json(world.managerRecommendations(w,req.query.club));});
  app.post('/api/world4/transfer/offer',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.startBattle(w,req.body.club,req.body.playerId,req.body.fee,req.body.salary,req.body.years,req.body.type||'buy');if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/intervene',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.intervene(w,req.body.battleId,req.body.club,req.body.fee,req.body.salary,req.body.years);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/decide',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.completeBattle(w,req.body.battleId,req.body.club);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/loan',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.loan(w,req.body.club,req.body.playerId,req.body.months,req.body.fee,req.body.salaryShare);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/release',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.releasePlayer(w,req.body.club,req.body.playerId);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/transfer/sell',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.sellPlayer(w,req.body.club,req.body.playerId,req.body.asking);if(r?.error)return res.status(400).json(r);world.persist();res.json(r);});
  app.post('/api/world4/match/simulate',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.simulate(w);if(r?.error)return res.status(400).json(r);world.persist();if(ioRef)broadcast(ioRef,w);res.json(r);});
  app.post('/api/world4/season/advance',(req,res)=>{const w=get(req.body,req);if(!w)return res.status(404).json({error:'World not found'});const r=world.advanceSeason(w);world.persist();if(ioRef)broadcast(ioRef,w);res.json(safeState(w));});
}
function attachIO(io){
  if(attachedIO)return;attachedIO=true;ioRef=io;
  io.on('connection',socket=>{
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
