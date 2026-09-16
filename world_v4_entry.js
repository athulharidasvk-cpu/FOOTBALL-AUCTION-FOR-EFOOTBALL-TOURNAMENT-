const express = require('express');
const path = require('path');
const baseExpress = express;
function entryExpress(){
  const app = baseExpress();
  app.get('/', (req,res)=>res.sendFile(path.join(__dirname,'public','football-world.html')));
  app.get('/auction', (req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
  return app;
}
Object.keys(baseExpress).forEach(k=>{try{entryExpress[k]=baseExpress[k]}catch(e){}});
require.cache[require.resolve('express')].exports=entryExpress;
