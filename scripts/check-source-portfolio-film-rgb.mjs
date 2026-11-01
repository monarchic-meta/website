import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { portfolioSources, portfolioServer, portfolioHash, installPortfolioPage } from './portfolio-film-test-support.mjs';

const mapPath=process.env.MONARCHIC_PORTFOLIO_ACTUAL_MEDIA_MAP;
assert.ok(mapPath,'Set MONARCHIC_PORTFOLIO_ACTUAL_MEDIA_MAP to the retained actual13-source film/poster map; synthetic files do not satisfy source-fidelity checks.');
const bundle=portfolioSources(),server=await portfolioServer(mapPath),evidence=process.env.MONARCHIC_PORTFOLIO_RGB_EVIDENCE_DIR??'/tmp/monarchic-source-portfolio-film-rgb';
fs.mkdirSync(evidence,{recursive:true});
const projects=process.env.MONARCHIC_PORTFOLIO_RGB_PROJECTS?.split(',').map(Number)??[0,1,2,3,4,5,6,7];
const layouts=process.env.MONARCHIC_PORTFOLIO_RGB_LAYOUT==='desktop'?[{name:'desktop',width:1280,height:720}]:[{name:'desktop',width:1280,height:720},{name:'phone',width:390,height:844}];
const rows=[],errors=[],browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const layout of layouts){
  const page=await browser.newPage({viewport:{width:layout.width,height:layout.height}});
  page.on('pageerror',error=>errors.push(error.message));
  await page.setContent('<style>html,body,#app{margin:0;width:100%;height:100%;background:black}</style><div id="app"></div>');
  await installPortfolioPage(page,bundle,'preview');
  await page.evaluate(({props,layout})=>{window.__props={...props,autoAdvance:false,showPlayback:false,layout:layout==='phone'?'phone':'desktop'};window.__root=ReactDOM.createRoot(document.getElementById('app'));__root.render(React.createElement(exports.default,__props));},{props:server.props,layout:layout.name});
  for(const project of projects){
   await page.evaluate(project=>filmAPI.getFilmControls().select(project),project);
   await page.waitForFunction(project=>{const c=document.querySelector('canvas');return Number(c?.dataset.sourceFilmProject)===project&&c.dataset.sourceFilmKind==='video'&&Number(c.dataset.sourceFilmTime)>.05&&Number(c.dataset.sourceFilmTransition)===1},project,{timeout:45000});
   await page.evaluate(()=>filmAPI.getFilmControls().togglePaused());
   await page.waitForFunction(()=>filmAPI.getFilmMediaGate().debug().decoders===0&&filmAPI.getStudyPool().debug().live.length===0&&document.querySelector('canvas')?.dataset.sourceFilmKind==='snapshot');
   await page.waitForFunction(()=>{const c=document.querySelector('canvas'),entry=__filmEntries.filter(e=>e.display===c).at(-1);return entry?.hasFrame&&!entry.needsStill&&entry.frameKey===entry.contentKey});
   const filmIndex=Number(server.actualMap.projects[project][layout.name==='phone'?'phoneFilm':'desktopFilm'].replace('film-',''))-1;
   const [rateNumerator,rateDenominator]=server.actualMap.films[filmIndex].frameRate.split('/').map(Number),frameInterval=rateDenominator/rateNumerator;
   const sample=await page.evaluate(async({project,url,frameInterval})=>{
    const canvas=document.querySelector('canvas'),field=filmAPI.FILM_FIELDS.get(canvas),frame=field.frames.get(canvas.dataset.sourceFilmFrame),entry=__filmEntries.filter(e=>e.display===canvas).at(-1);
    const width=canvas.width,height=canvas.height,time=Number(canvas.dataset.sourceFilmTime),actorPNG=canvas.toDataURL('image/png'),actual=canvas.getContext('2d').getImageData(0,0,width,height).data;
    const video=document.createElement('video');video.muted=true;video.playsInline=true;video.crossOrigin='anonymous';video.preload='auto';
    await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(Error('Independent source decoder failed'));video.src=url;video.load()});
    const cover=(ctx,input,sw,sh,w,h)=>{const fit=Math.max(w/sw,h/sh);ctx.drawImage(input,(w-sw*fit)/2,(h-sh*fit)/2,sw*fit,sh*fit)};
    const comparisons=[];let referencePNG='';
    for(const frameOffset of[0,-1,1]){
     const target=Math.max(0,Math.min(time+frameOffset*frameInterval+.000001,video.duration-.04));
     await new Promise((resolve,reject)=>{const ready=()=>{if(video.readyState>=2&&!video.seeking)resolve()};video.onseeked=ready;video.onloadeddata=ready;video.onerror=()=>reject(Error('Independent source seek failed'));if(Math.abs(video.currentTime-target)>.00001)video.currentTime=target;ready()});
     const base=document.createElement('canvas');base.width=frame.width;base.height=frame.height;const bc=base.getContext('2d');bc.fillStyle='#000';bc.fillRect(0,0,base.width,base.height);bc.scale(base.width/entry.logicalWidth,base.height/entry.logicalHeight);cover(bc,video,video.videoWidth,video.videoHeight,entry.logicalWidth,entry.logicalHeight);
     const stage=document.createElement('canvas');stage.width=entry.frameWidth;stage.height=entry.frameHeight;const sc=stage.getContext('2d');sc.scale(stage.width/entry.logicalWidth,stage.height/entry.logicalHeight);cover(sc,base,base.width,base.height,entry.logicalWidth,entry.logicalHeight);
     const reference=document.createElement('canvas');reference.width=width;reference.height=height;reference.getContext('2d').drawImage(stage,0,0,width,height);const expected=reference.getContext('2d').getImageData(0,0,width,height).data;
     let changed=0,max=0,sum=0;for(let i=0;i<actual.length;i++){const difference=Math.abs(actual[i]-expected[i]);if(difference)changed++;sum+=difference;max=Math.max(max,difference)}
     comparisons.push({frameOffset,independentSeek:video.currentTime,changedChannels:changed,maxChannelDifference:max,meanAbsoluteChannelDifference:sum/actual.length});
     if(changed===0){referencePNG=reference.toDataURL('image/png');break}
    }
    const exact=comparisons.find(x=>x.changedChannels===0),result={project,time,width,height,totalChannels:actual.length,sourceDimensions:[video.videoWidth,video.videoHeight],snapshotDimensions:[frame.width,frame.height],entryFrameDimensions:[entry.frameWidth,entry.frameHeight],logicalDimensions:[entry.logicalWidth,entry.logicalHeight],transition:frame.transition,kind:canvas.dataset.sourceFilmKind,sourceURL:url,frameInterval,comparisons,pixelExactSourceFrame:!!exact,matchingFrameOffset:exact?.frameOffset??null,actorPNG,referencePNG};
    video.pause();video.removeAttribute('src');video.load();return result;
   },{project,url:server.base+'/film/'+filmIndex,frameInterval});
   const{actorPNG,referencePNG,...row}=sample;rows.push({layout:layout.name,...row});
   for(const[kind,data]of Object.entries({actor:actorPNG,reference:referencePNG}))if(data)fs.writeFileSync(path.join(evidence,layout.name+'-project-'+project+'-'+kind+'.png'),Buffer.from(data.split(',')[1],'base64'));
   console.log(layout.name+'/'+project+' exact='+row.pixelExactSourceFrame+' frameOffset='+row.matchingFrameOffset);
   await page.evaluate(()=>filmAPI.getFilmControls().togglePaused());
  }
  await page.evaluate(()=>__root.unmount());await page.close();
 }
 const result={passed:errors.length===0&&rows.every(x=>x.pixelExactSourceFrame),sourceSHA256:portfolioHash(bundle.source),testSHA256:portfolioHash(fs.readFileSync(import.meta.filename)),mapSHA256:portfolioHash(fs.readFileSync(mapPath)),sourceMap:mapPath,scope:'Independent actual retained MP4 decoder compares the exact same center-cover/resampling pipeline against immediately paused actor RGBA. The last rVFC mediaTime is tested first, then at most one decoded source-frame interval on either side; the color threshold remains zero changed channels. Matching offsets measure annotation precision, not color tolerance. Source remux identity and immediate pause/cache/controller behavior are separate proofs. No website behavior JavaScript or synthetic source-fidelity substitution.',rows,errors};
 fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:result.passed,cases:rows.length,errors,evidence},null,2));assert.equal(result.passed,true,'No exact genuine source frame at mediaTime±one frame; inspect actual composition/timing before changing expectations');
}finally{await browser.close();await server.close()}
