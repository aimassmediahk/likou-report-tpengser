import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve('./site');
const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let u = req.url.split('?')[0];
  if(u==='/')u='/index.html';
  let p = path.join(ROOT,u);
  if(!fs.existsSync(p)||fs.statSync(p).isDirectory()) p = path.join(ROOT,'index.html');
  const ext = path.extname(p).toLowerCase();
  res.writeHead(200,{'Content-Type':MIME[ext]||'text/plain','Access-Control-Allow-Origin':'*'});
  res.end(fs.readFileSync(p));
}).listen(8099, '127.0.0.1', ()=>console.log('serving on 127.0.0.1:8099'));
