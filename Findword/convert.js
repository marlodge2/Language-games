const fs = require("fs");

// read the whole file
const lines = fs.readFileSync("dictionary.txt", "utf8").split(/\r?\n/);

// your ASCII→IPA converter
function asciiToIpa(ascii) {
  return ascii
    .replace(/I@R/g, "ɪər")
    .replace(/I@/g,  "ɪə")
    .replace(/IN/g,  "ɪŋ")
    .replace(/eI/g,  "eɪ")
    .replace(/aI/g,  "aɪ")
    .replace(/aU/g,  "aʊ")
    .replace(/OI/g,  "ɔɪ")
    .replace(/i:/g,  "iː")
    .replace(/u:/g,  "uː")
    .replace(/'/g,  "ˈ")
    .replace(/,/g,  "ˌ")
    // '+' marks a boundary between two consonants (often identical) that
    // should NOT assimilate into one, e.g. back+cloth, Cambridgeshire's
    // -dge+shire. Render as the IPA syllable-boundary mark so it can't be
    // mistaken for a genuine affricate like the tʃ/dʒ produced below.
    .replace(/\+/g, ".")
    .replace(/3/g,  "ɜː")
    .replace(/@/g,  "ə")
    .replace(/0/g,  "ɒ")
    .replace(/&/g,  "æ")
    .replace(/A/g,  "ɑː")
    .replace(/U/g,  "ʊ")
    .replace(/I/g,  "ɪ")
    .replace(/V/g,  "ʌ")
    .replace(/O/g,  "ɔː")
    .replace(/S/g,  "ʃ")
    .replace(/Z/g,  "ʒ")
    .replace(/T/g,  "θ")
    .replace(/D/g,  "ð")
    .replace(/N/g,  "ŋ")
    .replace(/C/g,  "tʃ")
    .replace(/J/g,  "dʒ")
    .replace(/R/g,  "r");
}

const entries = [];

for (const line of lines) {
  if (line.trim() === "") continue;

  const spelling     = line.slice(0, 23).trim();
  const pronAscii    = line.slice(23, 46).trim();
  const pos          = line.slice(46, 69).trim();
  const syllables    = line.slice(69, 70).trim();
  const verbPattern  = line.slice(70, 128).trim();

  entries.push({
    spelling,
    pron_ascii: pronAscii,
    pron_ipa: asciiToIpa(pronAscii),
    pos,
    syllables: Number(syllables),
    verb_pattern: verbPattern
  });
}

// write JSON file
fs.writeFileSync("dictionary.json", JSON.stringify(entries, null, 2), "utf8");

console.log("Done. Created dictionary.json");
