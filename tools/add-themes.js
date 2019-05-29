#!/usr/bin/env node
"use strict";

const fs = require("fs").promises;
const path = require("path");
const defaults = require("../defaults.json");

const {exit} = require("./utils");

async function getThemesInFolder() {
  const themes = path.join(__dirname, "..", "themes");
  let files = await fs.readdir(themes);

  // put the default theme (twilight) first
  files = files.sort((a, b) => {
    if (/twilight/i.exec(a)) return -1;
    if (/twilight/i.exec(b)) return 1;
    return a.localeCompare(b);
  });

  return await Promise.all(files.map(file => fs.readFile(themes + "/" + file, "utf8")));
}

function extractThemeName(css) {
  return css
    .substring(3, css.indexOf("*/"))
    .trim()
    // remove group (e.g. "GitHub: ")
    .replace(/^.+:\s/, "");
}

// Prevent comments in theme from breaking out of the meta data block
function escapeSlash(css) {
  // "/* test */" => "/* test *\/"
  return css.replace(/\*\//g, "*\\/");
}

function updateDefaults(themes) {
  const val = defaults.variables["Github syntax theme"].value = {};
  themes.forEach(theme => val[extractThemeName(theme)] = escapeSlash(theme));
  return JSON.stringify(defaults, null, 2);
}

getThemesInFolder()
  .then(themes => fs.writeFile(path.join(__dirname, "..", "defaults.json"), updateDefaults(themes)))
  .then(() => console.log("\x1b[32m%s\x1b[0m", "Themes updated in defaults.json"))
  .catch(exit);
