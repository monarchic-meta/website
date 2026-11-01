import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Owned deterministic test patterns only. These are not source-reference films.
const directory=fileURLToPath(new URL('./fixtures/portfolio-film/',import.meta.url));
const ffmpeg=process.env.FFMPEG??'ffmpeg';
fs.mkdirSync(directory,{recursive:true});
const specifications=[['desktop',320,180,0],['phone',180,320,160],['alternate',320,180,110],['alternate-phone',180,320,300]];
const run=args=>{const result=spawnSync(ffmpeg,args,{stdio:'inherit'});if(result.status!==0)throw Error('FFmpeg fixture generation failed: '+result.status)};
for(const[name,width,height,hue]of specifications){
 const video=path.join(directory,name+'.webm');
 run(['-hide_banner','-loglevel','error','-y','-fflags','+bitexact','-f','lavfi','-i',`testsrc2=size=${width}x${height}:rate=12:duration=3`,'-vf',`hue=h=${hue}`,'-an','-c:v','libvpx-vp9','-threads','1','-b:v','0','-crf','35','-flags:v','+bitexact',video]);
 run(['-hide_banner','-loglevel','error','-y','-i',video,'-frames:v','1','-threads','1',path.join(directory,name+'.png')]);
}
const files=specifications.flatMap(([name])=>['webm','png'].map(extension=>{const filename=name+'.'+extension,data=fs.readFileSync(path.join(directory,filename));return{file:filename,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')}}));
const version=spawnSync(ffmpeg,['-version'],{encoding:'utf8'}).stdout?.split('\n')[0]??'';
fs.writeFileSync(path.join(directory,'manifest.json'),JSON.stringify({purpose:'Owned FFmpeg testsrc2/hue patterns for deterministic media/controller/resource tests. They are never used as source-fidelity evidence or product artwork.',generator:'scripts/build-portfolio-film-fixtures.mjs',ffmpegVersion:version,frameRate:12,durationSeconds:3,specifications:specifications.map(([name,width,height,hue])=>({name,width,height,hue})),files},null,2)+'\n');
console.log(JSON.stringify({generated:true,directory,ffmpegVersion:version,files},null,2));
