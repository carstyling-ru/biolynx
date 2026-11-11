'use strict';
// All image assets and PDF code are local; exporting does not send markup to a server.
window.exportAtlasPdf = async function({structures,opacity,activeId,views,bounds}) {
  const {PDFDocument,rgb}=window.PDFLib;
  const doc=await PDFDocument.create();
  doc.setTitle('БИОЛИНКС — Схема лица и шеи для косметологов');
  doc.setCreator('БИОЛИНКС');
  const page=doc.addPage([841.89,595.28]);
  const {width,height}=page.getSize();
  const margin=30,gap=14,columnWidth=(width-2*margin-2*gap)/3;
  const imageTop=height-99,k=columnWidth/1024;
  const ink=rgb(25/255,55/255,49/255),accent=rgb(78/255,96/255,200/255);
  // Rasterize only Cyrillic text at 4× resolution, avoiding missing system glyphs in PDFs.
  async function text(value,x,top,size,color='#193731',weight=400){
    const factor=4,canvas=document.createElement('canvas');
    let ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas недоступен');
    ctx.font=`${weight} ${size*factor}px Arial, sans-serif`;
    canvas.width=Math.ceil(ctx.measureText(value).width)+8;canvas.height=Math.ceil(size*1.6*factor);
    ctx=canvas.getContext('2d');ctx.font=`${weight} ${size*factor}px Arial, sans-serif`;
    ctx.textBaseline='top';ctx.fillStyle=color;ctx.fillText(value,0,size*.12*factor);
    const img=await doc.embedPng(canvas.toDataURL('image/png'));
    page.drawImage(img,{x,y:height-top-canvas.height/factor,width:canvas.width/factor,height:canvas.height/factor});
  }
  const color=hex=>rgb(...hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255));
  await text('БИОЛИНКС',margin,21,16,'#4E60C8',700);
  await text('Схема лица и шеи для косметологов',margin,48,14,'#193731',500);
  page.drawLine({start:{x:margin,y:height-77},end:{x:width-margin,y:height-77},color:accent,thickness:.5,opacity:.25});
  const images=await Promise.all(views.map(async([id,label,angle,file])=>{
    const response=await fetch(`assets/${file}`);if(!response.ok)throw Error('Не удалось загрузить изображение');
    return doc.embedPng(await response.arrayBuffer());
  }));
  const ordered=structures.slice().sort((a,b)=>(a.id===activeId?1:0)-(b.id===activeId?1:0));
  for(let i=0;i<views.length;i++){
    const [view,label]=views[i],x=margin+i*(columnWidth+gap);
    await text(label,x,82,10,'#193731',500);
    const [top,bottom]=bounds[view],scale=(1432-96)/(bottom-top);
    const tx=512*(1-scale),ty=96-top*scale;
    page.drawImage(images[i],{x:x+tx*k,y:imageTop-(ty+1536*scale)*k,width:1024*scale*k,height:1536*scale*k});
    for(const s of ordered)for(const points of s.views[view]){
      const path=points.map(([px,py],j)=>`${j?'L':'M'} ${tx+px*scale} ${ty+py*scale}`).join(' ')+' Z';
      page.drawSvgPath(path,{x,y:imageTop,scale:k,color:color(s.color),opacity,borderColor:color(s.color),borderOpacity:.85,borderWidth:3});
    }
  }
  await text(`Выбрано структур: ${structures.length}  ·  Прозрачность: ${Math.round(opacity*100)}%`,margin,height-41,9,'#788780');
  page.drawLine({start:{x:margin,y:49},end:{x:width-margin,y:49},color:ink,opacity:.12,thickness:.5});
  return new Blob([await doc.save()],{type:'application/pdf'});
};
