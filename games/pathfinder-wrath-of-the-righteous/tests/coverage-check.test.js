"use strict";

const assert = require("assert");
const {
  loadData,
  loadManifest,
  parseVersionInfo,
  parseSteamManifest,
  sha256,
  evaluateCoverage,
  strictExitCode
} = require("./coverage-check");

const manifest = loadManifest();
const baseData = loadData(undefined, manifest.generatedFrom);
const current = evaluateCoverage(baseData, manifest);

assert.equal(current.complete, false, "partial data must never be reported as complete");
assert.equal(strictExitCode(current), 1, "strict coverage must fail while declared gaps remain");
assert.equal(current.sourceVersion.status, "unverified", "source version must be unverified without provenance files");
assert.ok(current.gaps.some((gap) => gap.id === "sourceVersion.versionInfo"), "missing Version.info must be reported");
assert.ok(!current.gaps.some((gap) => gap.id === "mechanics.nativePrerequisites"), "all installed native prerequisite types must remain modeled");
assert.ok(!current.gaps.some((gap) => gap.id === "mechanics.structuredEffects"), "all installed structured effect components must remain classified");

const missingReferenceData = { ...baseData, domains: baseData.domains.filter((domain) => domain.id !== "good") };
const missingReference = evaluateCoverage(missingReferenceData, manifest);
assert.ok(
  missingReference.structuralErrors.some((error) => error.where.includes("deities") && error.message.includes("good")),
  "removing a referenced domain must create a structural error"
);

const matchingEvidence = {
  versionInfo: parseVersionInfo("2025-Apr-02 deadbeef 2.7.0x 2.7.0"),
  steamManifest: parseSteamManifest('"AppState"\n{\n  "appid" "1184370"\n  "buildid" "20212986"\n  "InstalledDepots"\n  {\n    "1184372"\n    {\n      "manifest" "6624263451234269485"\n    }\n  }\n}'),
  authoritativeSources: {
    blueprints: { size: 10, sha256: sha256("blueprints") },
    cheatdata: { size: 9, sha256: sha256("cheatdata") },
    zhCN: { size: 4, sha256: sha256("zhCN") }
  }
};
const matchingManifest = JSON.parse(JSON.stringify(manifest));
matchingManifest.targetGameBuild.sourceHashes.versionInfoSha256 = matchingEvidence.versionInfo.sha256;
matchingManifest.targetGameBuild.sourceHashes.steamManifestSemanticSha256 = matchingEvidence.steamManifest.semanticSha256;
Object.entries(matchingEvidence.authoritativeSources).forEach(([id, source]) => {
  matchingManifest.targetGameBuild.authoritativeSources[id].size = source.size;
  matchingManifest.targetGameBuild.authoritativeSources[id].sha256 = source.sha256;
});
const matchingSource = evaluateCoverage(baseData, matchingManifest, matchingEvidence);
assert.equal(matchingSource.sourceVersion.status, "verified", "matching source provenance must verify");
assert.ok(!matchingSource.gaps.some((gap) => gap.id.startsWith("sourceVersion.")), "verified provenance must clear source gaps");

const mismatchedEvidence = {
  versionInfo: parseVersionInfo("2024-Jun-13 deadbeef 2.5.0y 2.5.0"),
  steamManifest: parseSteamManifest('"AppState"\n{\n  "appid" "1184370"\n  "buildid" "16446789"\n  "InstalledDepots"\n  {\n    "1184372"\n    {\n      "manifest" "old-manifest"\n    }\n  }\n}'),
  authoritativeSources: matchingEvidence.authoritativeSources
};
const mismatchedSource = evaluateCoverage(baseData, matchingManifest, mismatchedEvidence);
assert.equal(mismatchedSource.sourceVersion.status, "mismatch", "wrong game/build version must fail closed");
assert.ok(mismatchedSource.structuralErrors.some((error) => error.where === "sourceVersion.version"), "version mismatch must be an error");
assert.ok(mismatchedSource.structuralErrors.some((error) => error.where === "sourceVersion.steamBuildId"), "build mismatch must be an error");
assert.ok(mismatchedSource.structuralErrors.some((error) => error.where === "sourceVersion.steamDepotManifestId"), "Windows depot manifest mismatch must be an error");
assert.equal(strictExitCode(mismatchedSource), 1, "mismatched source provenance must fail strict mode");

const tamperedSource = evaluateCoverage(baseData, matchingManifest, {
  versionInfo: parseVersionInfo(`${matchingEvidence.versionInfo.raw}\ntampered`),
  steamManifest: matchingEvidence.steamManifest,
  authoritativeSources: matchingEvidence.authoritativeSources
});
assert.ok(
  tamperedSource.structuralErrors.some((error) => error.where === "sourceVersion.versionInfoSha256"),
  "same-version source content with a different hash must fail closed"
);

const tamperedBlueprints = evaluateCoverage(baseData, matchingManifest, {
  ...matchingEvidence,
  authoritativeSources: {
    ...matchingEvidence.authoritativeSources,
    blueprints: { ...matchingEvidence.authoritativeSources.blueprints, sha256: sha256("tampered") }
  }
});
assert.ok(
  tamperedBlueprints.structuralErrors.some((error) => error.where === "sourceVersion.authoritativeSources.blueprints.sha256"),
  "tampering with an authoritative source must fail closed"
);

const missingParameterData = {
  ...baseData,
  choiceParameterTypes: {
    ...baseData.choiceParameterTypes,
    weapon: { ...baseData.choiceParameterTypes.weapon, options: [] }
  }
};
const missingParameter = evaluateCoverage(missingParameterData, manifest);
assert.ok(
  missingParameter.structuralErrors.some((error) => error.where === "choiceParameterTypes.weapon"),
  "empty parameter pools must create a structural error"
);

console.log(`coverage-check.test.js: ${current.gaps.length} current gaps; missing-data and tamper guards passed`);
