"use strict";

const crypto = require("crypto");

function stableClone(value) {
  if (Array.isArray(value)) return value.map(stableClone);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value)
    .sort((left, right) => left.localeCompare(right, "en"))
    .reduce((result, key) => {
      if (value[key] !== undefined) result[key] = stableClone(value[key]);
      return result;
    }, {});
}

function stableStringify(value, space = 2) {
  return `${JSON.stringify(stableClone(value), null, space)}\n`;
}

function sha256(value) {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

module.exports = { sha256, stableClone, stableStringify };
