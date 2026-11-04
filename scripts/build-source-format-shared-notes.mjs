import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Manual external preparation. Running the LanguageService rename requires
// Root's serial CPU token. No emit/browser/API/repository write is performed.
const repo = path.resolve(process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url)))
const outputIndex = process.argv.indexOf('--out')
assert.ok(outputIndex >= 0 && process.argv[outputIndex + 1], 'Manual generation requires explicit --out DIRECTORY; tests never regenerate source')
const out = path.resolve(process.argv[outputIndex + 1])
fs.mkdirSync(out, { recursive: true })
const require = createRequire(path.join(repo, 'package.json')), ts = require('typescript')
const detailsFile = path.join(repo, 'docs/design-studies/code-components/SourceFormatDetails.tsx')
const sharedFile = path.join(repo, 'docs/design-studies/code-components/SourceHeroNativeBehaviors.tsx')
const details = fs.readFileSync(detailsFile, 'utf8'), shared = fs.readFileSync(sharedFile, 'utf8')
const sha = text => crypto.createHash('sha256').update(text).digest('hex')
const pins = { shared: { bytes: 85154, sha256: '318f04932e3ac1f247ad5881744a7ed62d263b99fb54ff055c6e4f3855cb514c' }, details: { bytes: 185812, sha256: '3dcf9273c8d0936b0e4fc3e00a18a0def156905c4336bdcc173023f29bb664b3' } }
for (const [key, text] of [['shared', shared], ['details', details]]) { assert.equal(Buffer.byteLength(text), pins[key].bytes); assert.equal(sha(text), pins[key].sha256) }
const options = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, noLib: true, noResolve: true }
const parse = (name, text) => ts.createSourceFile(name, text, options.target, true, ts.ScriptKind.TSX)
const detailsAST = parse(detailsFile, details), sharedAST = parse(sharedFile, shared)
const exported = node => node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)
const publicFunctions = tree => tree.statements.filter(node => ts.isFunctionDeclaration(node) && exported(node))
const sharedFunctions = publicFunctions(sharedAST), detailsFunctions = publicFunctions(detailsAST)
const sharedNames = new Set(sharedFunctions.map(node => node.name.text)), detailsNames = new Set(detailsFunctions.map(node => node.name.text))
assert.equal(sharedNames.size, 56); assert.equal(detailsNames.size, 191)
assert.deepEqual([...detailsNames].filter(name => sharedNames.has(name)), [])
assert.ok(sharedNames.has('withFormatNotesStateBridge'))
const privateDeclarations = tree => tree.statements.flatMap(node => {
    if (exported(node)) return []
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.map(row => row.name)
    if (ts.isFunctionDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) return node.name ? [node.name] : []
    assert.ok(!ts.isEnumDeclaration(node) && !ts.isModuleDeclaration(node), 'No unsupported declaration scope')
    return []
}).map(node => { assert.ok(ts.isIdentifier(node), 'No unreviewed binding pattern'); return node })
const privateNodes = privateDeclarations(detailsAST), oldPrivate = new Set(privateDeclarations(sharedAST).map(node => node.text))
const service = ts.createLanguageService({ getCompilationSettings: () => options, getScriptFileNames: () => [detailsFile], getScriptVersion: () => '1', getScriptSnapshot: name => name === detailsFile ? ts.ScriptSnapshot.fromString(details) : undefined, getCurrentDirectory: () => repo, getDefaultLibFileName: () => '', fileExists: name => name === detailsFile, readFile: name => name === detailsFile ? details : undefined })
const editsBySpan = new Map(), renames = []
for (const node of privateNodes) {
    const beforeName = node.text, afterName = 'FormatDetailsPrivate_' + beforeName
    assert.notEqual(beforeName, 'withFormatNotesStateBridge', 'Public imported bridge is never privately renamed')
    assert.ok(service.getRenameInfo(detailsFile, node.getStart(detailsAST), { allowRenameOfImportPath: false }).canRename, beforeName)
    const locations = service.findRenameLocations(detailsFile, node.getStart(detailsAST), false, false, { providePrefixAndSuffixTextForRename: true })
    assert.ok(locations?.length, beforeName + ' semantic locations')
    const occurrences = []
    for (const location of locations) {
        assert.equal(location.fileName, detailsFile, 'No shared/private external source changes')
        const { start, length } = location.textSpan, before = details.slice(start, start + length)
        assert.equal(before, beforeName)
        const after = (location.prefixText ?? '') + afterName + (location.suffixText ?? '')
        const edit = { start, length, before, after, kind: 'semantic-private-rename', symbol: beforeName }, key = start + ':' + length
        if (editsBySpan.has(key)) assert.deepEqual(editsBySpan.get(key), edit)
        else editsBySpan.set(key, edit)
        occurrences.push({ start, length, before, after, prefixText: location.prefixText ?? '', suffixText: location.suffixText ?? '' })
    }
    renames.push({ beforeName, afterName, collidedWithShared: oldPrivate.has(beforeName), occurrences })
}
service.dispose()
const imports = detailsAST.statements.filter(ts.isImportDeclaration)
assert.equal(imports.length, 4)
assert.deepEqual(imports.map(node => node.moduleSpecifier.text), ['react', 'react', 'framer', './SourceHeroNativeBehaviors.tsx'])
assert.equal(imports[3].importClause.namedBindings.elements.length, 1)
assert.equal(imports[3].importClause.namedBindings.elements[0].name.text, 'withFormatNotesStateBridge')
for (const node of imports) {
    const start = node.getStart(detailsAST); let end = node.end
    if (details.slice(end, end + 2) === '\r\n') end += 2
    else if (details[end] === '\n') end++
    editsBySpan.set(start + ':' + (end - start), { start, length: end - start, before: details.slice(start, end), after: '', kind: 'remove-redundant-import' })
}
const edits = [...editsBySpan.values()].sort((a, b) => a.start - b.start)
let appendix = '', cursor = 0
for (const edit of edits) {
    assert.ok(edit.start >= cursor, 'No overlapping edits')
    appendix += details.slice(cursor, edit.start)
    edit.outputStart = appendix.length; edit.outputLength = edit.after.length
    appendix += edit.after; cursor = edit.start + edit.length
}
appendix += details.slice(cursor)
let restored = appendix
for (const edit of [...edits].sort((a, b) => b.outputStart - a.outputStart || b.start - a.start)) {
    assert.equal(restored.slice(edit.outputStart, edit.outputStart + edit.outputLength), edit.after)
    restored = restored.slice(0, edit.outputStart) + edit.before + restored.slice(edit.outputStart + edit.outputLength)
}
assert.equal(restored, details, 'Private renames and all four imports invert to every original Details byte')
const separator = '\n\n// Manual same-module Framer package: Details191 and Notes append; retained Shared56 prefix above is byte-exact.\n'
const bundle = shared + separator + appendix, bundleAST = parse('SourceFormatSharedNotes.tsx', bundle)
const allFunctions = publicFunctions(bundleAST), bundlePrivate = privateDeclarations(bundleAST).map(node => node.text)
assert.equal(allFunctions.length, 247)
assert.equal(new Set(allFunctions.map(node => node.name.text)).size, 247)
assert.equal(new Set(bundlePrivate).size, bundlePrivate.length)
assert.ok(allFunctions.filter(node => detailsNames.has(node.name.text)).every(node => node.parameters[0]?.type?.getText(bundleAST) === 'ComponentType<FormatDetailsPrivate_LayerProps>' && node.type?.getText(bundleAST) === 'ComponentType<FormatDetailsPrivate_LayerProps>'))
assert.equal(bundle.slice(0, shared.length), shared)
assert.equal(bundleAST.statements.filter(ts.isImportDeclaration).length, 3)
assert.equal((appendix.match(/\bwithFormatNotesStateBridge\b/g) ?? []).length, 1, 'Exactly one retained public bridge call; import removed')
assert.ok(appendix.includes('withFormatNotesStateBridge(FormatDetailsPrivate_formatNotesLayer(Component))'))
const save = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
save('SourceHeroNativeBehaviors.shared56.preimage.tsx', shared)
save('SourceFormatDetails.details191.preimage.tsx', details)
save('SourceFormatSharedNotes.tsx', bundle)
save('details-private-rename-map.json', { indexUnits: 'UTF-16 code units for every input/output span; file pins use UTF-8 bytes', method: 'LanguageService semantic findRenameLocations, strings/comments off, shorthand prefix/suffix retained', TypeScript: ts.version, input: pins.details, privateRenames: renames, edits })
save('bundle-inverse.json', { indexUnits: 'UTF-16 code units; source sizes and hashes use UTF-8 bytes', inputs: pins, bundle: { bytes: Buffer.byteLength(bundle), sha256: sha(bundle) }, sharedPrefixUTF16Length: shared.length, appendixUTF16Start: shared.length + separator.length, separator, patches: [{ start: shared.length, length: separator.length + appendix.length, before: separator + appendix, after: '' }], detailsInverse: 'Take appendix at appendixUTF16Start; reverse details-private-rename-map.edits by outputStart then original start. This restores exact3dcf source including all4 imports.' })
save('private-collision-audit.json', { inputs: pins, privateDetailsSymbols: privateNodes.length, semanticOccurrences: edits.filter(edit => edit.kind === 'semantic-private-rename').length, originalPrivateCollisions: renames.filter(row => row.collidedWithShared).map(row => row.beforeName), remainingPrivateCollisions: 0, sharedPublicNames: [...sharedNames], detailsPublicNames: [...detailsNames], publicIntersection: [], genuineDirectPublicExports: 247, old56PrefixExact: true, allDetailsBytesInvertible: true, publicBridgeCallResolvesToSharedPrefix: 'withFormatNotesStateBridge', extraContextOrToggleStoreCopied: false, parseDiagnostics: bundleAST.parseDiagnostics.map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') })), compilerRun: false, declarationSizeMeasured: false, browserRun: false, actualFramerChanges: false })
console.log(JSON.stringify({ prepared: true, source: 'SourceFormatSharedNotes.tsx', bytes: Buffer.byteLength(bundle), sha256: sha(bundle), privateSymbols: privateNodes.length, semanticOccurrences: edits.filter(edit => edit.kind === 'semantic-private-rename').length, publicHOCs: 247, prefixExact: true, detailsInverseExact: true, out }))
