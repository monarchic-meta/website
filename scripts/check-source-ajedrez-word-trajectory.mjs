import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
const repo=fileURLToPath(new URL('../',import.meta.url))
const sourcePath=process.env.MONARCHIC_AJEDREZ_SOURCE_PATH??path.join(repo,'docs/design-studies/code-components/SourceAjedrezSequence.tsx')
const source=fs.readFileSync(sourcePath,'utf8')
const actor3=source.includes('AJEDREZ_TYPE_ACTOR3_FITS'),extended=source.includes('function ajedrezTypeTrackedActor(')
const suite=actor3?'./check-source-ajedrez-actor3-additive.mjs':extended?'./check-source-ajedrez-two-track-extension.mjs':'./check-source-ajedrez-measured-word-fits.mjs'
console.log(JSON.stringify({compatibility:'source-ajedrez-word-trajectory',scope:actor3?'actor3-additive-51':extended?'historical-two-track-40':'historical-arrival-33',suite}))
await import(suite)
