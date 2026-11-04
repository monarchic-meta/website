import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Source-only preparation. Uses the syntax parser only: no program, language
// service, diagnostics, emission, browser, API, or repository mutation.
const repo = path.resolve(process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url)))
const outputIndex = process.argv.indexOf('--out')
assert.ok(outputIndex >= 0 && process.argv[outputIndex + 1], 'Manual generation requires explicit --out DIRECTORY; tests never regenerate source')
const out = path.resolve(process.argv[outputIndex + 1])
fs.mkdirSync(out, { recursive: true })
const require = createRequire(path.join(repo, 'package.json')), ts = require('typescript')
const openingFile = path.join(repo, 'docs/design-studies/code-components/SourceCantorOpening.tsx')
const rollingFile = path.join(repo, 'docs/design-studies/code-components/SourceCantorRollingText.tsx')
const opening = fs.readFileSync(openingFile, 'utf8'), rolling = fs.readFileSync(rollingFile, 'utf8')
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
assert.equal(sha(opening), '910767a75f23ea0398328245d86ec6cafc056afeb30770a84ae0ad48d8ede46a')
assert.equal(sha(rolling), '64879d4374f0e34d1aa78011e4e3b8d01dcf28c3d8a3681a478a56c372c6a0ba')
const parse = (name, text) => ts.createSourceFile(name, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX)
const openingAST = parse(openingFile, opening), rollingAST = parse(rollingFile, rolling)
const isExport = node => node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)
const namesOf = tree => tree.statements.flatMap(node => {
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.map(row => row.name)
    if (ts.isFunctionDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) return node.name ? [node.name] : []
    return []
}).map(name => { assert.ok(ts.isIdentifier(name), 'No unreviewed top-level binding pattern'); return name.text })
const oldNames = namesOf(openingAST), newNames = namesOf(rollingAST), collisions = newNames.filter(name => oldNames.includes(name))
assert.deepEqual(collisions, [], 'No private or public top-level collisions; no renaming needed')
const imports = rollingAST.statements.filter(ts.isImportDeclaration)
assert.equal(imports.length, 4)
assert.deepEqual(imports.map(node => node.moduleSpecifier.text), ['react', 'react', 'framer', './SourceCantorOpening.tsx'])
assert.equal(imports[0].getStart(rollingAST), 0)
let cutEnd = imports.at(-1).end
if (rolling.slice(cutEnd, cutEnd + 2) === '\r\n') cutEnd += 2
else if (rolling[cutEnd] === '\n') cutEnd++
const removedImportPrefix = rolling.slice(0, cutEnd), appendix = rolling.slice(cutEnd)
assert.equal(removedImportPrefix + appendix, rolling)
const separator = '\n\n// Manual same-module Framer package: Rolling append; retained Opening prefix above is byte-exact.\n'
const bundle = opening + separator + appendix, ast = parse('SourceCantorOpeningRolling.tsx', bundle)
const publicFunctions = tree => tree.statements.filter(node => ts.isFunctionDeclaration(node) && isExport(node))
const oldFunctions = publicFunctions(openingAST), newFunctions = publicFunctions(rollingAST), allFunctions = publicFunctions(ast)
assert.equal(oldFunctions.length, 52)
assert.equal(newFunctions.length, 4)
assert.equal(allFunctions.length, 56)
assert.ok(newFunctions.every(node => node.parameters[0].type.getText(rollingAST) === 'ComponentType<RollingProps>' && node.type.getText(rollingAST) === 'ComponentType<RollingProps>'))
for (const fn of newFunctions) assert.equal(allFunctions.find(node => node.name.text === fn.name.text).getText(ast), fn.getText(rollingAST), 'New public body is byte-exact after removing imports')
assert.equal(bundle.slice(0, opening.length), opening)
assert.equal(ast.statements.filter(ts.isImportDeclaration).length, 3)
assert.equal((bundle.match(/const OpeningContext = React\.createContext/g) ?? []).length, 1)
assert.equal((bundle.match(/const RollingContext = React\.createContext/g) ?? []).length, 1)
const save = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
save('SourceCantorOpening.preimage.tsx', opening)
save('SourceCantorRollingText.preimage.tsx', rolling)
save('SourceCantorOpeningRolling.tsx', bundle)
save('bundle-inverse.json', { indexUnits: 'UTF-16 code units; UTF-8 byte pins are separate', bundle: { bytes: Buffer.byteLength(bundle), sha256: sha(bundle) }, targetOpening: { bytes: Buffer.byteLength(opening), sha256: sha(opening) }, patches: [{ start: opening.length, length: separator.length + appendix.length, before: separator + appendix, after: '' }], restoreOriginalRolling: { removeExactlyTheBundleSeparator: true, prependToAppendix: removedImportPrefix, bytes: Buffer.byteLength(rolling), sha256: sha(rolling) } })
save('private-collision-audit.json', { method: 'Syntax parser enumerates every top-level declaration, including all declarations in each variable statement; no TypeScript program/semantic compile', parserVersion: ts.version, openingNames: oldNames, rollingNames: newNames, collisions, renames: 0, old52PublicNames: oldFunctions.map(node => node.name.text), new4PublicNames: newFunctions.map(node => node.name.text), completePublicCount: 56, exactOpeningPrefix: true, exactFourNewBodies: true, oldOpeningContexts: 1, newRollingContexts: 1, imports: ast.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), parseDiagnostics: ast.parseDiagnostics.map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') })), compilerRun: false, browserRun: false, actualFramerChanges: false })
console.log(JSON.stringify({ sourceOnlyPrepared: true, bundleSHA256: sha(bundle), bytes: Buffer.byteLength(bundle), oldPrefixBytes: Buffer.byteLength(opening), publicHOCs: 56, collisionCount: 0, renames: 0, out }))
