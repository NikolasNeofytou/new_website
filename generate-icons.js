// Generates simple branded PWA icons (192, 512) using pngjs
const { PNG } = require('pngjs');
const fs = require('fs');

// Brand colors pulled from theme
// Palette tuned for Electrical Engineering theme
// Deep navy + electric cyan + copper traces
const BG_TOP = '#0b1e3a';
const BG_BOTTOM = '#123c73';
const BG_DARK_TOP = '#091528';
const BG_DARK_BOTTOM = '#0f2547';
const ELECTRIC = '#33d6ff';
const COPPER = '#c47a2c';
const GLINT = '#f9f9fb';
const LIGHT_BG_TOP = '#eef3f8';
const LIGHT_BG_BOTTOM = '#d5dde7';

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

function applyRoundedMask(png, radius){
  const r = radius;
  const w = png.width, h = png.height;
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const inCorner = (x<r && y<r && (x-r)**2+(y-r)**2>r*r) ||
                       (x>=w-r && y<r && (x-(w-r-1))**2+(y-r)**2>r*r) ||
                       (x<r && y>=h-r && (x-r)**2+(y-(h-r-1))**2>r*r) ||
                       (x>=w-r && y>=h-r && (x-(w-r-1))**2+(y-(h-r-1))**2>r*r);
      if(inCorner){
        const idx=(w*y+x)<<2; png.data[idx+3]=0; // make transparent
      }
    }
  }
}

function overlayGrid(png, step, colorHex, alpha=40){
  const c = hexToRGBA(colorHex);
  for(let y=0;y<png.height;y++){
    for(let x=0;x<png.width;x++){
      if(x%step===0 || y%step===0){
        const idx=(png.width*y + x)<<2;
        // simple alpha blend over existing
        png.data[idx] = (png.data[idx]*(255-alpha) + c.r*alpha)/255;
        png.data[idx+1] = (png.data[idx+1]*(255-alpha) + c.g*alpha)/255;
        png.data[idx+2] = (png.data[idx+2]*(255-alpha) + c.b*alpha)/255;
      }
    }
  }
}

function drawCircuitGlyph(png,colorHex, scale=1){
  // Stylized PCB traces forming an abstract op-amp / network
  const c = hexToRGBA(colorHex);
  const w = png.width, h = png.height;
  const pad = Math.round(w*0.18*(2-scale));
  const left = pad, right = w-pad-1, top = pad, bottom = h-pad-1;
  // Diagonal traces
  for(let i=0;i<=1;i+=0.002){
    const x = Math.round(left + (right-left)*i);
    const y1 = Math.round(top + (bottom-top)*i*0.9);
    const y2 = Math.round(bottom - (bottom-top)*i*0.9);
    setPixel(png,x,y1,c); setPixel(png,x,y2,c);
  }
  // Horizontal bus center
  const midY = Math.round(h/2);
  for(let x=left; x<=right; x++) setPixel(png,x,midY,c);
  // Vertical via spine
  const midX = Math.round(w/2);
  for(let y=top; y<=bottom; y++) if(Math.abs(y-midY)>2) setPixel(png,midX,y,c);
  // Nodes
  function circle(cx,cy,r){
    for(let y=cy-r; y<=cy+r; y++) for(let x=cx-r; x<=cx+r; x++){
      if(x<0||y<0||x>=w||y>=h) continue;
      if((x-cx)**2 + (y-cy)**2 <= r*r) setPixel(png,x,y,{r:c.r,g:c.g,b:c.b,a:255});
    }
  }
  const nodes=[ [midX, top+3], [midX, bottom-3], [left+4, midY], [right-4, midY], [midX, midY] ];
  nodes.forEach(([x,y])=> circle(x,y, Math.max(2,Math.round(w*0.045*scale))));
}

function outline(png,colorHex,radius){
  const o = hexToRGBA(colorHex);
  const w=png.width,h=png.height; const r=radius;
  // Draw rounded rectangle border (1px) using midpoint circle logic for corners
  function setIf(x,y){ if(x>=0&&y>=0&&x<w&&y<h){ const idx=(w*y+x)<<2; png.data[idx]=o.r; png.data[idx+1]=o.g; png.data[idx+2]=o.b; png.data[idx+3]=255; } }
  for(let x=r; x<w-r; x++){ setIf(x,0); setIf(x,h-1); }
  for(let y=r; y<h-r; y++){ setIf(0,y); setIf(w-1,y); }
  // Corners (quarter circle)
  for(let theta=0; theta<=Math.PI/2; theta+=0.01){
    const dx = Math.round(r*Math.cos(theta));
    const dy = Math.round(r*Math.sin(theta));
    setIf(r-dx, r-dy); // TL
    setIf(w-r+dx-1, r-dy); // TR
    setIf(r-dx, h-r+dy-1); // BL
    setIf(w-r+dx-1, h-r+dy-1); // BR
  }
}

function generate(size, {variant='light', maskable=false}={}){
  const png = new PNG({width:size,height:size});
  if(variant==='dark') gradient(png, BG_DARK_TOP, BG_DARK_BOTTOM); else gradient(png, BG_TOP, BG_BOTTOM);
  overlayGrid(png, Math.max(4, Math.round(size/18)), variant==='dark'? '#163250':'#1f3f66', 35);
  const radius = Math.round(size*0.18);
  applyRoundedMask(png, radius);
  drawCircuitGlyph(png, maskable? (variant==='dark'? GLINT : ELECTRIC) : (variant==='dark'? ELECTRIC : GLINT), maskable?0.85:1);
  outline(png, COPPER, radius);
  const buf = PNG.sync.write(png);
  const nameParts = ['icon'];
  if(variant==='dark') nameParts.push('dark');
  if(maskable) nameParts.push('maskable');
  nameParts.push(size);
  const file = `icons/${nameParts.join('-')}.png`;
  fs.writeFileSync(file, buf);
  console.log('Created', file);
}

if(!fs.existsSync('icons')) fs.mkdirSync('icons');
// Light standard
[32,48,64,180,192,512].forEach(s=> generate(s,{variant:'light'}));
// Dark variants
[32,48,64,180,192,512].forEach(s=> generate(s,{variant:'dark'}));
// Maskable (supply at least 192 & 512)
[192,512].forEach(s=> generate(s,{variant:'light', maskable:true}));
