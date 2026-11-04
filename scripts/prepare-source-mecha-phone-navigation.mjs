import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import {fileURLToPath} from 'node:url'
// Explicit manual source inspection, split and inverse preparation only. No compiler/browser, Framer, network,
// asset upload, dependency install or repository/VCS mutation is performed.
const option=name=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1]}
const output=option('--out')
assert.ok(output,'Manual preparation requires --out DIRECTORY; it never writes back to the source or Framer')
const repo=path.resolve(option('--repo')??process.env.MONARCHIC_REPO_ROOT??fileURLToPath(new URL('../',import.meta.url)))
const canonical=path.resolve(option('--source')??path.join(repo,'docs/design-studies/code-components/SourceMechaPhoneNavigation.tsx'))
const retained=path.resolve(option('--retained')??path.join(repo,'docs/design-studies/code-components/SourceMechaTomorrowContact.tsx'))
const source=fs.readFileSync(canonical),old=fs.readFileSync(retained),out=path.resolve(output)
assert.ok(out!==path.dirname(canonical),'Output must be an explicit review directory outside the canonical source directory')
const hash=value=>crypto.createHash('sha256').update(value).digest('hex')
assert.equal(old.length,49548,'Retained genuine47 byte count');assert.equal(hash(old),'0c4449f16fb119c860641dc0b8054da31164e389c2f5f4af8cb0bec84fe06071','Retained genuine47 hash')
assert.ok(source.subarray(0,old.length).equals(old),'Canonical source retains every old byte')
const append=source.subarray(old.length),prepared=Buffer.concat([old,append])
assert.ok(prepared.equals(source),'Prepared review copy retains the exact canonical bytes')
const names=[...source.toString().matchAll(/^export function (with\w+)\(/gm)].map(row=>row[1]),oldNames=[...old.toString().matchAll(/^export function (with\w+)\(/gm)].map(row=>row[1])
assert.equal(oldNames.length,47);assert.equal(names.length,77);assert.equal(new Set(names).size,77)
assert.equal((append.toString().match(/withMechaContactTrigger\(/g)||[]).length,1)
assert.ok(append.toString().includes('return withMechaContactRoot(MechaPhoneNav_provider(Component))'))
assert.ok(!/^import|MechaContactPrivate_/m.test(append.toString()),'No sibling import/private Contact controller in appended menu')
fs.mkdirSync(out,{recursive:true})
const save=(name,value)=>fs.writeFileSync(path.join(out,name),Buffer.isBuffer(value)||typeof value==='string'?value:JSON.stringify(value,null,2)+'\n')
save('SourceMechaPhoneNavigation.tsx',prepared)
save('SourceMechaTomorrowContact.retained47.tsx',old)
save('phone-navigation.append.tsx.txt',append)
save('exact-prefix-inverse.json',{units:'UTF-8 bytes',candidate:{bytes:source.length,sha256:hash(source)},operation:{kind:'truncate-after-byte',offset:old.length},target:{bytes:old.length,sha256:hash(old)}})
save('public-roles.json',{old:oldNames,added:names.filter(name=>!oldNames.includes(name)),total:names.length,sourceSHA256:hash(source)})
save('source-split-receipt.json',{status:'MANUAL_SOURCE_INSPECTION_SPLIT_INVERSE_ONLY',canonical,retained,source:{bytes:source.length,sha256:hash(source)},append:{bytes:append.length,sha256:hash(append)},oldPrefixExact:true,independentRegenerationProof:false,publicHOCs:names.length,compilerRun:false,browserRun:false,nativeWrites:0,largestJSBytes:null,declarationBytes:null,emissionStatus:'NOT EMITTED HERE; serial compiler measurement requires heavy-token ownership. Use the separate tested checker for strict/native-like DOM proof.'})
console.log(JSON.stringify({prepared:true,bytes:source.length,sha256:hash(source),oldPrefixExact:true,publicHOCs:names.length,out}))
