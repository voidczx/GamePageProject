"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const scenarios = require("../../../map-scenarios");
const { parseArgs, routesForBattle, requiredDumpFiles, inspectDump, preflightMessage, buildAllMapDetails, toBrowserScript } = require("../batch");
const { createTerrainFixture, createBaiFixture, createBsiFixture } = require("./fixtures");

test("batch argument and route selection contracts are explicit", () => {
  assert.deepEqual(parseArgs(["--dump-dir", "dump", "--out", "details.js", "--extension", "dat"]), {
    dumpDir: "dump",
    out: "details.js",
    extension: ".dat",
    compact: false,
    check: false
  });
  assert.deepEqual(parseArgs(["--dump-dir", "dump", "--check"]), { dumpDir: "dump", extension: ".bin", compact: false, check: true });
  assert.deepEqual(routesForBattle("wc-1"), ["AM", "VW", "CF", "SS"]);
  assert.deepEqual(routesForBattle("pl-war_weak"), ["AM", "VW", "CF", "SS"]);
  assert.deepEqual(routesForBattle("am-13"), ["AM"]);
  assert.deepEqual(routesForBattle("cf-18"), ["CF"]);
});

test("batch preflight reports every missing or invalid indexed file at once", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fe3h-map-preflight-"));
  try {
    const expected = requiredDumpFiles();
    assert.equal(expected.length, scenarios.manifest.length * 3);
    fs.writeFileSync(path.join(directory, expected[0].name), Buffer.alloc(1));
    const report = inspectDump({ dumpDir: directory });

    assert.equal(report.ok, false);
    assert.equal(report.expected, 183);
    assert.equal(report.present, 1);
    assert.equal(report.missing.length, 182);
    assert.equal(report.invalid.length, 1);
    assert.match(preflightMessage(report), /FAIL.*1\/183[\s\S]*Missing \(182\)[\s\S]*Invalid size \(1\)/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("batch builds all 74 guide records from 61 indexed scenarios", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "fe3h-map-batch-"));
  try {
    const terrain = createTerrainFixture();
    const bai = createBaiFixture();
    const bsi = createBsiFixture();
    for (const scenario of scenarios.manifest) {
      fs.writeFileSync(path.join(directory, `${scenario.terrain}.bin`), terrain);
      fs.writeFileSync(path.join(directory, `${scenario.bai}.bin`), bai);
      fs.writeFileSync(path.join(directory, `${scenario.bsi}.bin`), bsi);
    }

    const details = buildAllMapDetails({ dumpDir: directory });
    assert.equal(Object.keys(details.records).length, 74);
    assert.equal(Object.keys(details.records["wc-1"].variants).length, 4);
    assert.deepEqual(Object.keys(details.records["am-13"].variants), ["AM"]);
    assert.equal(details.records["wc-1"].variants.AM.source.routeBlock, 1);
    assert.equal(details.records["wc-1"].variants.VW.source.routeBlock, 2);
    assert.equal(details.records["wc-1"].variants.CF.source.routeBlock, 0);
    assert.equal(details.bsiAuditByScenario[1].events.length, 1);
    assert.equal(details.records["pl-secret_merchant"].scenario, 97);
    assert.match(toBrowserScript(details, true), /^\/\/ Generated locally[\s\S]+window\.FE3H_MAP_DETAILS = /);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
