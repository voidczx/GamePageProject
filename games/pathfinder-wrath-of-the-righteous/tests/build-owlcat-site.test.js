"use strict";

const assert = require("assert");
const vm = require("vm");
const { parseArgs } = require("../tools/build-owlcat-site");
const { renderOwlcatSiteJson, renderOwlcatSiteJs } = require("../tools/lib/owlcat-site-adapter");

const parsed = parseArgs(["--install-root", "C:/Game", "--json", "out/site.json", "--js", "out/site.js", "--global", "SITE_DATA", "--summary"]);
assert.equal(parsed.installRoot, "C:/Game");
assert.equal(parsed.json, "out/site.json");
assert.equal(parsed.js, "out/site.js");
assert.equal(parsed.globalName, "SITE_DATA");
assert.equal(parsed.summary, true);
assert.throws(() => parseArgs(["--install-root", "C:/Game"]), /Usage:/);
assert.throws(() => parseArgs(["--install-root", "C:/Game", "--summary", "--unknown"]), /Unknown or incomplete/);
assert.throws(() => parseArgs(["--install-root", "C:/Game", "--js", "out.js", "--global", "bad-name"]), /Invalid JavaScript global name/);

const siteData = {
  schemaVersion: 1,
  sourceSnapshot: {
    dataSha256: "sha256:data",
    snapshotSha256: "sha256:snapshot",
    sources: [{ kind: "blueprints", sha256: "sha256:blueprints" }]
  },
  counts: { spells: 671 },
  unordered: { z: 1, a: 2 }
};
const json = renderOwlcatSiteJson(siteData);
const js = renderOwlcatSiteJs(siteData);
assert.equal(json, renderOwlcatSiteJson(siteData), "compact JSON must be byte-deterministic");
assert.equal(js, renderOwlcatSiteJs(siteData), "compact JS must be byte-deterministic");
assert.equal(json.split("\n").length, 2, "compact JSON must be one data line plus a terminal newline");
assert.equal(js.split("\n").length, 2, "compact JS must be one assignment line plus a terminal newline");
const context = vm.createContext({ window: {} });
vm.runInContext(js, context, { filename: "fixture.site.js" });
assert.equal(JSON.stringify(context.window.WOTR_OWLCAT_SITE_DATA), JSON.stringify(JSON.parse(json)), "JS global must parse to the compact JSON value");
assert.equal(context.window.WOTR_OWLCAT_SITE_DATA.sourceSnapshot.sources[0].sha256, "sha256:blueprints");
assert.equal(context.window.WOTR_OWLCAT_SITE_DATA.counts.spells, 671);
assert.throws(() => renderOwlcatSiteJs(siteData, "not-valid-name"), /invalid JavaScript global name/);

console.log("build-owlcat-site.test.js: CLI arguments, deterministic compact rendering, and JS syntax passed");
