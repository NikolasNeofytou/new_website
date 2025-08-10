// Generates simple branded PWA icons (192, 512) using pngjs
const { PNG } = require('pngjs');
const fs = require('fs');

// Brand colors pulled from theme
const BG = '#274c9b'; // primary indigo
const ACCENT = '#b87333'; // copper
const ELECTRIC = '#38d4ff';

function hexToRGBA(hex){
  const m = hex.replace('#','');
  const bigint = parseInt(m,16);
  if(m.length===6) {
    return {r:(bigint>>16)&255,g:(bigint>>8)&255,b:bigint&255,a:255};
  }
  throw new Error('Unsupported hex');
}

function setPixel(png,x,y,{r,g,b,a=255}){
  const idx = (png.width*y + x) << 2;
  png.data[idx] = r; png.data[idx+1]=g; png.data[idx+2]=b; png.data[idx+3]=a;
}

function gradient(png, topHex, bottomHex){
  const top = hexToRGBA(topHex); const bottom = hexToRGBA(bottomHex);
  for(let y=0;y<png.height;y++) {
    const t = y/(png.height-1);
    const r = Math.round(top.r + (bottom.r-top.r)*t);
    const g = Math.round(top.g + (bottom.g-top.g)*t);
    const b = Math.round(top.b + (bottom.b-top.b)*t);
    for(let x=0;x<png.width;x++) setPixel(png,x,y,{r,g,b,a:255});
  }
}

function drawCircuitGlyph(png,colorHex){
  const c = hexToRGBA(colorHex);
  const mid = Math.floor(png.width/2);
  // vertical spine
  for(let y=png.height*0.2|0; y<png.height*0.8; y++) setPixel(png, mid, y, c);
  // horizontal bars
  const bars=[0.3,0.5,0.7];
  bars.forEach(fr=>{
    const y = png.height*fr|0;
    for(let x=png.width*0.25|0; x<png.width*0.75; x++) if(Math.abs(x-mid)>2) setPixel(png,x,y,c);
  });
  // terminal pads (circles) approximate
  function circle(cx,cy,r){
    for(let y=cy-r; y<=cy+r; y++) for(let x=cx-r; x<=cx+r; x++){
      if(x<0||y<0||x>=png.width||y>=png.height) continue;
      if((x-cx)**2 + (y-cy)**2 <= r*r) setPixel(png,x,y,{r:c.r,g:c.g,b:c.b,a:255});
    }
  }
  circle(mid, png.height*0.2|0, 6);
  circle(mid, png.height*0.8|0, 6);
}

function outline(png,colorHex){
  const o = hexToRGBA(colorHex);
  for(let x=0;x<png.width;x++){ setPixel(png,x,0,o); setPixel(png,x,png.height-1,o);}  
  for(let y=0;y<png.height;y++){ setPixel(png,0,y,o); setPixel(png,png.width-1,y,o);}  
}

function generate(size){
  const png = new PNG({width:size,height:size});
  gradient(png, BG, '#1c2e4e');
  drawCircuitGlyph(png,ELECTRIC);
  outline(png, ACCENT);
  const buf = PNG.sync.write(png);
  fs.writeFileSync(`icons/icon-${size}.png`, buf);
  console.log(`Created icons/icon-${size}.png`);
}

if(!fs.existsSync('icons')) fs.mkdirSync('icons');
[192,512].forEach(generate);
