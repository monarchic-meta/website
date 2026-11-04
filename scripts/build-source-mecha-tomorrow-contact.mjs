import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// Preparation only: semantic renames and source bookkeeping; no emit, browser,
// project evaluation, network, repository mutation, or Framer operation.
const repo = path.resolve(process.env.MONARCHIC_REPO_ROOT ?? fileURLToPath(new URL('../', import.meta.url)))
const outputIndex = process.argv.indexOf('--out')
assert.ok(outputIndex >= 0 && process.argv[outputIndex + 1], 'Manual generation requires an explicit --out DIRECTORY; tests never regenerate the source')
const out = path.resolve(process.argv[outputIndex + 1])
fs.mkdirSync(out, { recursive: true })
const require = createRequire(path.join(repo, 'package.json')), ts = require('typescript')
const file = path.join(repo, 'docs/design-studies/code-components/SourceMechaContact.tsx')
const oldFile = path.join(repo, 'docs/design-studies/code-components/SourceMechaTomorrowDetail.tsx')
const source = fs.readFileSync(file, 'utf8'), old = fs.readFileSync(oldFile, 'utf8')
const sha = data => crypto.createHash('sha256').update(data).digest('hex')
const pins = {
    tomorrow: { bytes: 15281, sha256: 'fccf92d790ae5ecb5aee489fff9c7cf63ce1b5a0fe4f01fc4494829b1f57ce6b' },
    contact: { bytes: 30471, sha256: '7ba1c6b229bb6b8d1b87e6cc1a89b3d0752de5d7f2b0ddd631e15668bfaeaff5' },
}
for (const [key, text] of [['tomorrow', old], ['contact', source]]) {
    assert.equal(Buffer.byteLength(text), pins[key].bytes, key + ' bytes')
    assert.equal(sha(text), pins[key].sha256, key + ' SHA')
}
const options = { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.React, noLib: true, noResolve: true }
const service = ts.createLanguageService({
    getCompilationSettings: () => options,
    getScriptFileNames: () => [file],
    getScriptVersion: () => '1',
    getScriptSnapshot: name => name === file ? ts.ScriptSnapshot.fromString(source) : undefined,
    getCurrentDirectory: () => repo,
    getDefaultLibFileName: () => '',
    fileExists: name => name === file,
    readFile: name => name === file ? source : undefined,
})
const ast = ts.createSourceFile(file, source, options.target, true, ts.ScriptKind.TSX)
const oldAST = ts.createSourceFile(oldFile, old, options.target, true, ts.ScriptKind.TSX)
const isExport = node => node.modifiers?.some(mod => mod.kind === ts.SyntaxKind.ExportKeyword)
const declarations = tree => tree.statements.flatMap(node => {
    if (isExport(node)) return []
    if (ts.isVariableStatement(node)) return node.declarationList.declarations.map(d => d.name)
    if (ts.isFunctionDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) return node.name ? [node.name] : []
    return []
}).filter(node => ts.isIdentifier(node))
const oldPrivate = new Set(declarations(oldAST).map(node => node.text))
const privateNames = declarations(ast), renames = [], bySpan = new Map()
assert.equal(privateNames.length, 23)
for (const node of privateNames) {
    const beforeName = node.text, afterName = 'MechaContactPrivate_' + beforeName
    const info = service.getRenameInfo(file, node.getStart(ast), { allowRenameOfImportPath: false })
    assert.ok(info.canRename, beforeName + ' can rename')
    const locations = service.findRenameLocations(file, node.getStart(ast), false, false, { providePrefixAndSuffixTextForRename: true })
    assert.ok(locations?.length, beforeName + ' has semantic references')
    const occurrences = []
    for (const location of locations) {
        assert.equal(location.fileName, file, 'No cross-file mutation')
        const { start, length } = location.textSpan, before = source.slice(start, start + length)
        assert.equal(before, beforeName, 'Rename span is the declared symbol')
        const after = (location.prefixText ?? '') + afterName + (location.suffixText ?? '')
        const edit = { start, length, before, after, kind: 'semantic-private-rename', symbol: beforeName }
        const key = start + ':' + length
        if (bySpan.has(key)) assert.deepEqual(bySpan.get(key), edit)
        else bySpan.set(key, edit)
        occurrences.push({ start, length, before, after, prefixText: location.prefixText ?? '', suffixText: location.suffixText ?? '' })
    }
    renames.push({ beforeName, afterName, originallyCollidesWithTomorrow: oldPrivate.has(beforeName), occurrences })
}
const imports = ast.statements.filter(ts.isImportDeclaration)
assert.equal(imports.length, 4)
assert.deepEqual(imports.map(node => node.moduleSpecifier.text), ['react', 'react', 'framer', './SourceMechaTomorrowDetail.tsx'])
for (const node of imports) {
    const start = node.getStart(ast)
    let end = node.end
    if (source.slice(end, end + 2) === '\r\n') end += 2
    else if (source[end] === '\n') end++
    bySpan.set(start + ':' + (end - start), { start, length: end - start, before: source.slice(start, end), after: '', kind: 'remove-redundant-import' })
}
service.dispose()
const edits = [...bySpan.values()].sort((a, b) => a.start - b.start)
let cursor = 0, appendix = '', outputEdits = []
for (const edit of edits) {
    assert.ok(edit.start >= cursor, 'Nonoverlapping semantic edits')
    appendix += source.slice(cursor, edit.start)
    const outputStart = appendix.length
    appendix += edit.after
    outputEdits.push({ ...edit, outputStart, outputLength: edit.after.length })
    cursor = edit.start + edit.length
}
appendix += source.slice(cursor)
let recovered = appendix
for (const edit of [...outputEdits].sort((a, b) => b.outputStart - a.outputStart || b.start - a.start)) {
    assert.equal(recovered.slice(edit.outputStart, edit.outputStart + edit.outputLength), edit.after)
    recovered = recovered.slice(0, edit.outputStart) + edit.before + recovered.slice(edit.outputStart + edit.outputLength)
}
assert.equal(recovered, source, 'Every Contact byte is recoverable by recorded rename/import inverse')
const separator = '\n\n// Manual same-module Framer package: Contact append; retained Tomorrow prefix above is byte-exact.\n'
const bundle = old + separator + appendix
const bundleAST = ts.createSourceFile('SourceMechaTomorrowContact.tsx', bundle, options.target, true, ts.ScriptKind.TSX)
const functions = bundleAST.statements.filter(node => ts.isFunctionDeclaration(node) && isExport(node))
const oldFunctions = functions.filter(node => node.name.text.startsWith('withMechaTomorrow'))
const contactFunctions = functions.filter(node => node.name.text.startsWith('withMechaContact'))
assert.equal(functions.length, 47)
assert.equal(oldFunctions.length, 7)
assert.equal(contactFunctions.length, 40)
assert.ok(contactFunctions.every(node => node.parameters[0]?.type?.getText(bundleAST) === 'ComponentType<MechaContactPrivate_Props>' && node.type?.getText(bundleAST) === 'ComponentType<MechaContactPrivate_Props>'))
assert.equal(bundle.slice(0, old.length), old)
const names = declarations(bundleAST).map(node => node.text)
assert.equal(new Set(names).size, names.length, 'No private top-level collision remains')
assert.equal(bundleAST.statements.filter(ts.isImportDeclaration).length, 3, 'Only original React/Framer imports remain')
assert.equal((bundle.match(/const Context = React\.createContext/g) ?? []).length, 1, 'Exactly one retained Tomorrow Context declaration')
assert.equal((bundle.match(/const MechaContactPrivate_Context = React\.createContext/g) ?? []).length, 1, 'Exactly one distinct existing Contact Context declaration')
const save = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n')
save('SourceMechaTomorrowDetail.preimage.tsx', old)
save('SourceMechaContact.preimage.tsx', source)
save('SourceMechaTomorrowContact.tsx', bundle)
save('contact-private-rename-map.json', { indexUnits: 'UTF-16 code units for all source/output indices; byte pins are UTF-8 bytes', method: 'TypeScript LanguageService semantic findRenameLocations; no string/comment renaming; prefix/suffix retained', compilerVersion: ts.version, source: { path: file, ...pins.contact }, privateRenames: renames, edits: outputEdits })
save('bundle-inverse.json', { indexUnits: 'UTF-16 code units for patch start/length; byte pins are UTF-8 bytes', target: pins.tomorrow, bundle: { bytes: Buffer.byteLength(bundle), sha256: sha(bundle) }, patches: [{ start: old.length, length: separator.length + appendix.length, before: separator + appendix, after: '' }], contactAppendixInverse: 'contact-private-rename-map.json edits reverse by outputStart; restores exact Contact preimage including four imports' })
save('private-collision-audit.json', { inputs: pins, sourceOnlyPreparation: true, parseDiagnostics: bundleAST.parseDiagnostics.map(d => ({ code: d.code, message: ts.flattenDiagnosticMessageText(d.messageText, ' ') })), privateDeclarations: names, collisionCount: names.length - new Set(names).size, originalCollisions: renames.filter(row => row.originallyCollidesWithTomorrow).map(row => row.beforeName), oldPrefixSHA256: sha(bundle.slice(0, old.length)), oldPublicNames: oldFunctions.map(node => node.name.text), contactPublicNames: contactFunctions.map(node => node.name.text), retainedTomorrowContextDeclarations: 1, contactContextDeclarations: 1, imports: bundleAST.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), actualFramerCompileVerified: false, actualFramerPaintVerified: false })
save('bundle-preparation-receipt.json', { prepared: true, inputs: pins, bundle: { file: 'SourceMechaTomorrowContact.tsx', bytes: Buffer.byteLength(bundle), sha256: sha(bundle) }, privateSymbols: renames.length, semanticOccurrences: outputEdits.filter(edit => edit.kind === 'semantic-private-rename').length, removedImports: 4, oldPrefixExact: true, contactInverseExact: true, publicDirectHOCs: 47, oldPublicHOCs: 7, newPublicHOCs: 40, compilerRun: false, browserRun: false, repositoryChanges: false, actualFramerChanges: false, boundary: 'LanguageService rename only. Syntax/source bookkeeping is not strict semantic compilation or actual Framer inference.' })
console.log(JSON.stringify({ prepared: true, bundleSHA256: sha(bundle), bytes: Buffer.byteLength(bundle), privateSymbols: renames.length, semanticOccurrences: outputEdits.filter(edit => edit.kind === 'semantic-private-rename').length, oldPrefixExact: true, contactInverseExact: true, out }))
