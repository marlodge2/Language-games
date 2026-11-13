"use strict";
/*
 * VERBALIST — ported from DISPLAY.FRM (VB6, John & Muriel Higgins).
 * Function names in comments refer to the original VB subs/functions.
 */

// ---------------------------------------------------------------------
// Rule text (Writerule) and modal verbs
// ---------------------------------------------------------------------

const RULE = {
  1: "double the S and add ES if the verb has less than three syllables and ends in one vowel plus S or -Z",
  2: "add ES if the verb ends in S, X, Z, SH, CH or consonant + O",
  3: "change Y to IES if the verb ends in consonant plus Y",
  4: "add S to verbs which do not end in S, SH, CH, consonant + Y or consonant + O",
  5: "add ING if the verb is only two letters long",
  6: "change final IE to YING",
  7: "add ING to verbs which end in EE, OE, YE or INGE",
  8: "delete the final E and add ING",
  9: "add KING if the verb ends in vowel + C",
  10: "add ING if the verb ends in two consonants or two vowels plus a consonant",
  11: "add ING to the verb if it ends in a vowel other than E or one of the consonants F, H, J, Q, W, X or Y",
  12: "add ING to verbs of three or more syllables",
  13: "double the last letter and add ING if the verb has two syllables, ends consonant-vowel-consonant, and begins with a Latin prefix",
  14: "double the last letter and add ING if the verb has one syllable and ends consonant-vowel-consonant",
  15: "double the L and add ING to a two-syllable verb which ends consonant-vowel-L",
  16: "add ING to a two-syllable verb ending in R, N or T with stress on the first syllable",
  17: "double the final consonant and add ING if the verb ends consonant-vowel-consonant and the last consonant is B, D, G, K, M, P, S, V or Z",
  18: "change BE to BEEN (irregular)",
  19: "change BE to WAS (irregular)",
  20: "change BE to WERE (irregular)",
  21: "add D to any verb which ends in E",
  22: "if the verb ends consonant-Y, change Y to IED",
  23: "if the verb ends vowel-Y, add ED",
  24: "add ED to a verb which ends with any vowel except E or with the consonants F, H, J, Q, W or X",
  25: "add ED to verbs of three or more syllables",
  26: "double the last letter and add ED if the verb has two syllables, ends consonant-vowel-consonant, and begins with a Latin prefix",
  27: "add ED to a two-syllable verb ending in R, N or T with stress on the first syllable",
  28: "double the R and add ED if the verb ends in R preceded by a single vowel other than E",
  29: "double the final consonant and add ED to a one-syllable verb which ends consonant-vowel plus N or T",
  30: "add KED if the verb ends in vowel + C",
  31: "double the L and add ED to a two-syllable verb which ends consonant-vowel-L",
  32: "double the final consonant and add ED if the verb ends consonant-vowel-consonant and the last consonant is B, D, G, J, K, M, P, S, V or Z",
  33: "add ED if the verb ends in two consonants or two vowels plus a consonant",
  34: "reverse the last two letters and add ING if the word ends in consonant + RE",
  35: "reverse the last two letters and add ED if the word ends in consonant + RE",
  36: "change HAVE to HAS (irregular)",
  37: "add S to a verb which ends in -CH preceded by just one vowel or Y",
};

// modalverb(z, 0)=present, modalverb(z,1)=past
const MODALS = {
  1: ["shall", "should"],
  2: ["will", "would"],
  3: ["can", "could"],
  4: ["may", "might"],
  5: ["must", "had to"],
};

const PRONOUNS = { 1: "I", 2: "we", 3: "you", 4: "they", 5: "he", 6: "she", 7: "it" };

// ---------------------------------------------------------------------
// Word-shape helpers (Isavowel, Hasaprefix, Sending$, Ing$, Regular$)
// ---------------------------------------------------------------------

function isVowel(ch) {
  return "AEIOUaeiou".includes(ch || "");
}

// Hasaprefix — returns true if `a` begins with a Latin prefix, needs `syllable`
function hasLatinPrefix(a, syllable) {
  if (!(a.length > 3 && syllable < 3)) return false;
  if (a.slice(0, 2) === "re") {
    const c = isVowel(a[2]);
    const cc = isVowel(a[3]);
    return (c || cc) && a !== "reason";
  }
  if ("ab/ad/be/de/ex/in/im/oc/un".includes(a.slice(0, 2)) && a !== "exit") return true;
  if (a.length > 4 && syllable < 3) {
    if ("con/com/for/mis/out/pre/per/sub".includes(a.slice(0, 3))) return true;
  }
  if (a.length > 5) {
    if ("over".includes(a.slice(0, 4))) return true;
  }
  if (a.length > 6) {
    if ("handi/inter/super/trans/under".includes(a.slice(0, 5))) return true;
  }
  return false;
}

// Sending$ — adds -s to a verb. Returns { text, rule }.
function addS(a) {
  if (a === "have") return { text: "has", rule: 36 };

  const X = a.slice(-1);
  if (a.length <= 1) return { text: a.toUpperCase() + "s", rule: null };
  const Y = a[a.length - 2];
  const z = a.length > 2 ? a[a.length - 3] : "";
  const zz = a.length > 3 ? a[a.length - 4] : "";

  switch (X) {
    case "s":
    case "z":
      if (isVowel(Y) && (!isVowel(z) || zz === "q")) {
        return { text: a + X + "es", rule: 1 };
      }
      return { text: a + "es", rule: 2 };
    case "x":
      return { text: a + "es", rule: 2 };
    case "h":
      if (Y === "c" && z !== "i" && (isVowel(z) || z === "y") && !isVowel(zz)) {
        return { text: a + "s", rule: 37 };
      } else if (Y === "c" || Y === "s") {
        return { text: a + "es", rule: 2 };
      }
      return { text: a + "s", rule: 4 };
    case "y":
      if (!isVowel(Y)) return { text: a.slice(0, -1) + "ies", rule: 3 };
      return { text: a + "s", rule: 4 };
    case "o":
      if (!isVowel(Y)) return { text: a + "es", rule: 2 };
      return { text: a + "s", rule: 4 };
    default:
      return { text: a + "s", rule: 4 };
  }
}

// Ing$ — adds -ing to a verb. Returns { text, rule }. Needs `syllable`.
function addIng(a, syllable) {
  const X = a.slice(-1);
  if (a.length <= 1) return { text: a.toUpperCase() + "ing", rule: null };
  const Y = a[a.length - 2];
  const z = a.length > 2 ? a[a.length - 3] : "a";
  const zz = a.length > 3 ? a[a.length - 4] : "a";

  if (X === "e") {
    if (a.length < 3) return { text: a + "ing", rule: 5 };
    if (Y === "i") return { text: a.slice(0, -2) + "ying", rule: 6 };
    if (Y === "e" || Y === "o" || Y === "y") return { text: a + "ing", rule: 7 };
    if (Y === "g" && z === "n" && zz === "i") return { text: a + "ing", rule: 7 };
    if (Y === "r" && !isVowel(z)) return { text: a.slice(0, -2) + "ering", rule: 34 };
    return { text: a.slice(0, -1) + "ing", rule: 8 };
  }

  if (X === "c") {
    if (isVowel(Y) && !isVowel(z)) return { text: a + "king", rule: 9 };
    return { text: a + "ing", rule: 10 };
  }

  if ("afhijoquwxy".includes(X)) {
    return { text: a + "ing", rule: 11 };
  }

  // b, d, g, k, l, m, n, p, r, s, t, v, z
  if (isVowel(Y) && (!isVowel(z) || zz === "q")) {
    switch (X) {
      case "r":
        if (syllable > 2) return { text: a + "ing", rule: 12 };
        if (hasLatinPrefix(a, syllable) || a !== "conquer") return { text: a + X + "ing", rule: 13 };
        if (syllable === 1) return { text: a + X + "ing", rule: 14 };
        return { text: a + "ing", rule: 16 };
      case "n":
      case "t":
        if ((syllable > 2 && !hasLatinPrefix(a, syllable)) || a === "interpret") {
          return { text: a + "ing", rule: 12 };
        }
        if (syllable === 2) {
          if (hasLatinPrefix(a, syllable) || a === "emit" || a === "omit") {
            return { text: a + X + "ing", rule: 13 };
          }
          return { text: a + "ing", rule: 16 };
        }
        return { text: a + X + "ing", rule: 14 };
      case "l":
        if (syllable > 2) return { text: a + "ing", rule: 12 };
        if (syllable === 1) return { text: a + X + "ing", rule: 14 };
        return { text: a + X + "ing", rule: 15 };
      case "p":
        if (syllable > 2 && !hasLatinPrefix(a, syllable)) return { text: a + "ing", rule: 12 };
        if (syllable === 1) return { text: a + X + "ing", rule: 14 };
        if (hasLatinPrefix(a, syllable) || a === "equip") return { text: a + X + "ing", rule: 13 };
        return { text: a + "ing", rule: 16 };
      default:
        if (syllable > 2 && !hasLatinPrefix(a, syllable)) return { text: a + "ing", rule: 12 };
        return { text: a + X + "ing", rule: 17 };
    }
  }
  return { text: a + "ing", rule: 10 };
}

// Regular$ — adds -ed ending for past tense/participle. Returns { text, rule }.
// Needs `syllable` and `person` (only for the special "be" case).
function addEd(a, syllable, person) {
  const X = a.slice(-1);
  if (a.length <= 1) return { text: a.toUpperCase() + "ed", rule: null };
  const Y = a[a.length - 2];
  const z = a.length > 2 ? a[a.length - 3] : "a";
  const zz = a.length > 3 ? a[a.length - 4] : "a";

  if (a === "be") {
    // handled by caller via ifPerfect/ifVoice flags; this branch kept for parity
    return { text: "been", rule: 18 };
  }

  if (X === "e") {
    if (Y === "r" && !isVowel(z)) return { text: a.slice(0, -2) + "ered", rule: 35 };
    return { text: a + "d", rule: 21 };
  }
  if (X === "y") {
    if (!isVowel(Y)) return { text: a.slice(0, -1) + "ied", rule: 22 };
    return { text: a + "ed", rule: 23 };
  }
  if ("afhijoquwx".includes(X)) {
    return { text: a + "ed", rule: 24 };
  }
  // b, c, d, g, k, l, m, n, p, r, s, t, v, z
  if (isVowel(Y) && (!isVowel(z) || zz === "q")) {
    switch (X) {
      case "r":
        if (Y === "e") {
          if (syllable > 2) return { text: a + "ed", rule: 25 };
          if (hasLatinPrefix(a, syllable) || a !== "conquer") return { text: a + X + "ed", rule: 26 };
          return { text: a + "ed", rule: 27 };
        }
        return { text: a + X + "ed", rule: 28 };
      case "n":
      case "t":
        if ((syllable > 2 && !hasLatinPrefix(a, syllable)) || a === "interpret") {
          return { text: a + "ed", rule: 25 };
        }
        if (syllable === 2) {
          if (hasLatinPrefix(a, syllable) || a === "emit" || a === "omit") {
            return { text: a + X + "ed", rule: 26 };
          }
          return { text: a + "ed", rule: 27 };
        }
        return { text: a + X + "ed", rule: 29 };
      case "c":
        return { text: a + "ked", rule: 30 };
      case "l":
        if (syllable > 2) return { text: a + "ed", rule: 25 };
        return { text: a + X + "ed", rule: 31 };
      default:
        return { text: a + X + "ed", rule: 32 };
    }
  }
  return { text: a + "ed", rule: 33 };
}

// ---------------------------------------------------------------------
// App state
// ---------------------------------------------------------------------

const state = {
  tense: "present", // present | past
  hasModal: false,
  emphatic: false,
  whichModal: 3, // 1..5
  hasPerfect: false,
  aspect: "simple", // simple | continuous | goingTo
  goingToPerfect: false, // extra "have" after going to
  goingToContinuous: false, // extra "be ...ing" after going to
  voice: "active", // active | passive
  polarity: "affirmative", // affirmative | negative
  statementType: "statement", // statement | question | tag
  person: 1,
  mainVerb: "walk",
  syllable: 1,
  found: false, // is a recognised strong (irregular) verb
  intransitive: false,
  stative: false,
  defin: "",
  note: "",
  strongPast: "",
  strongPerfect: "",
  rules: 0,
};

let VERBS = [];
let VERB_INDEX = new Map();

async function loadVerbs() {
  const res = await fetch("data/verbs.json");
  if (!res.ok) throw new Error("verbs.json responded with " + res.status);
  VERBS = await res.json();
  VERB_INDEX = new Map(VERBS.map((v) => [v.word, v]));
}

// ---------------------------------------------------------------------
// Discover — dictionary lookup, mirrors Discover() in DISPLAY.FRM
// ---------------------------------------------------------------------

function countSyllables(word) {
  // Port of the loop in newverb_Click: counts vowel->non-vowel transitions.
  let syllables = 0;
  for (let n = 0; n < word.length - 1; n++) {
    if (isVowel(word[n]) && !isVowel(word[n + 1])) syllables++;
  }
  return syllables;
}

async function discover(rawWord, { confirmOblique } = {}) {
  const word = rawWord.trim().toLowerCase();
  const entry = VERB_INDEX.get(word);

  state.found = false;
  state.intransitive = false;
  state.stative = false;
  state.note = "";
  state.strongPast = "";
  state.strongPerfect = "";

  if (entry) {
    if (entry.strong && !entry.isBase) {
      // oblique principal-part entry, e.g. "saw", "went"
      const ok = confirmOblique
        ? await confirmOblique(word)
        : window.confirm(`Do you really mean TO ${word.toUpperCase()}?`);
      if (!ok) return false; // caller keeps previous verb
      state.defin = "Unrecognised verb";
    } else {
      state.defin = entry.defin;
      state.intransitive = !!entry.intransitive;
      state.stative = !!entry.stative;
    }
  } else {
    state.defin = "Unrecognised verb";
  }

  if (entry && entry.strong && entry.isBase) {
    state.found = true;
    state.strongPast = entry.pastForm || "";
    state.strongPerfect = entry.pastParticiple || "";
    state.note = entry.usageNote || "";
  } else if (entry && entry.usageNote) {
    state.note = entry.usageNote;
  }

  state.mainVerb = word;
  state.syllable = countSyllables(word);
  return true;
}

// ---------------------------------------------------------------------
// Phrase builder — Buildon / Buildup / Buildverb
// ---------------------------------------------------------------------

// mainVerbPastParticiple — used wherever VB does:
//   If found = 0 Then phrase += Regular$(mainverb) Else rules = -2; phrase += strongperfect
function pastParticipleText() {
  if (state.found === false) {
    const r = addEd(state.mainVerb, state.syllable, state.person);
    state.rules = r.rule;
    return r.text;
  }
  state.rules = -2;
  return state.strongPerfect;
}

function ingText() {
  const r = addIng(state.mainVerb, state.syllable);
  state.rules = r.rule;
  return r.text;
}

// Buildon — used after "going to", assembles the part after "going to"
function buildOn() {
  let out = "";
  if (state.goingToPerfect) {
    if (state.goingToContinuous) {
      out += state.voice === "passive" ? "have been being " + pastParticipleText() : "have been " + ingText();
    } else {
      out += state.voice === "passive" ? "have been " + pastParticipleText() : "have " + pastParticipleText();
    }
  } else {
    if (state.goingToContinuous) {
      out += state.voice === "passive" ? "be being " + pastParticipleText() : "be " + ingText();
    } else {
      out += state.voice === "passive" ? "be " + pastParticipleText() : state.mainVerb;
    }
  }
  return out;
}

// Buildup(frst) — appends the remainder of the verb phrase to the finite portion
function buildUp(frst) {
  let out = "";
  switch (frst) {
    case 2: // modal or "do" is first element
      if (state.hasPerfect) {
        if (state.aspect === "continuous") {
          out += state.voice === "passive" ? "have been being " + pastParticipleText() : "have been " + ingText();
        } else if (state.aspect === "goingTo") {
          out += "have been going to " + buildOn();
        } else {
          out += (state.voice === "passive" ? "have been " : "have ") + pastParticipleText();
        }
      } else {
        if (state.aspect === "continuous") {
          out += state.voice === "passive" ? "be being " + pastParticipleText() : "be " + ingText();
        } else if (state.aspect === "goingTo") {
          out += "be going to " + buildOn();
        } else if (state.voice === "passive") {
          out += (state.emphatic ? "get " : "be ") + pastParticipleText();
        } else {
          out += state.mainVerb;
        }
      }
      break;
    case 3: // "have" is first element
      if (state.aspect === "continuous") {
        out += state.voice === "passive" ? "been being " + pastParticipleText() : "been " + ingText();
      } else if (state.aspect === "goingTo") {
        out += "been going to " + buildOn();
      } else {
        if (state.voice === "passive") out += "been ";
        out += pastParticipleText();
      }
      break;
    case 4: // continuous / "going to" be is first element
      if (state.aspect === "goingTo") {
        out += "going to " + buildOn();
      } else if (state.voice === "passive") {
        out += "being " + pastParticipleText();
      } else {
        out += ingText();
      }
      break;
    case 5:
      out += pastParticipleText();
      break;
    default:
      if (state.polarity === "negative" || state.statementType === "question") {
        if (state.mainVerb !== "be") out += state.mainVerb;
      }
      break;
  }
  return out;
}

// Buildverb — the main assembler, returns { phrase, tagQuestion }
function buildVerb() {
  state.rules = 0;
  let phrase = "";
  let putin = 0;
  let tagques = "";

  let firstwd;
  if (state.hasModal || state.emphatic) firstwd = 2;
  else if (state.hasPerfect) firstwd = 3;
  else if (state.aspect === "continuous" || state.aspect === "goingTo") firstwd = 4;
  else if (state.voice === "passive") firstwd = 5;
  else firstwd = 1;

  const neg = state.polarity === "negative";
  const ques = state.statementType === "question";
  const qtag = state.statementType === "tag";
  const past = state.tense === "past";
  const person = state.person;

  if (firstwd === 2) {
    if (state.emphatic) {
      phrase = past ? "did" : person > 4 ? "does" : "do";
    } else {
      phrase = MODALS[state.whichModal][past ? 1 : 0];
    }
    if (neg) {
      tagques = phrase + " ";
      if (past || state.emphatic) {
        phrase += "n't ";
        if (state.whichModal === 5 && !state.emphatic) {
          phrase = "didn't have to ";
          putin = 7;
          tagques = "did ";
        }
      } else {
        phrase = { 1: "shan't ", 2: "won't ", 3: "can't ", 4: "mayn't ", 5: "mustn't " }[state.whichModal];
      }
    } else {
      if (past) {
        tagques = phrase + "n't ";
        if (state.whichModal === 5 || state.emphatic) {
          tagques = "didn't ";
          putin = 4;
        }
      } else if (state.emphatic) {
        tagques = phrase + "n't ";
      } else {
        tagques = { 1: "shan't ", 2: "won't ", 3: "can't ", 5: "mustn't " }[state.whichModal];
        if (state.whichModal === 4) tagques = "may not";
      }
      phrase += " ";
    }
  } else if (firstwd === 3) {
    phrase = past ? "had" : person > 4 ? "has" : "have";
    if (neg) {
      tagques = phrase + " ";
      phrase += "n't ";
    } else {
      tagques = phrase + "n't ";
      phrase += " ";
    }
  } else if (firstwd > 3) {
    if (past) {
      phrase = person === 1 || person > 4 ? "was" : "were";
      tagques = phrase;
    } else {
      if (person === 1) {
        if (neg && ques) {
          phrase = "are";
        } else {
          phrase = "am";
          tagques = neg ? "am" : "are";
        }
      } else if (person > 4) {
        phrase = "is";
        tagques = "is";
      } else {
        phrase = "are";
        tagques = "are";
      }
    }
    if (neg) {
      tagques += " ";
      if (person === 1 && (state.statementType === "statement" || qtag) && !past) {
        phrase += " not ";
      } else {
        phrase += "n't ";
      }
    } else {
      tagques = phrase + "n't ";
      phrase += " ";
      if (person === 1 && qtag && !past) tagques = "aren't ";
    }
  } else {
    // firstwd === 1: main verb only
    if (past) {
      tagques = "did";
      if (state.mainVerb === "be") {
        phrase = person === 1 || person > 4 ? "was" : "were";
        tagques = phrase;
      } else if (state.mainVerb === "have") {
        phrase = "had";
        tagques = "had";
      } else if (neg || ques) {
        phrase = "did";
        tagques = "did";
      } else {
        phrase = pastParticipleTextForFinitePast();
      }
    } else if (state.mainVerb === "be") {
      phrase = person === 1 ? "am" : [2, 3, 4].includes(person) ? "are" : "is";
      tagques = phrase;
    } else if (person > 4) {
      tagques = "does";
      if (neg || ques) {
        phrase = "does";
      } else {
        const r = addS(state.mainVerb);
        state.rules = r.rule;
        phrase = r.text;
      }
    } else if (neg || ques) {
      phrase = "do";
      tagques = "do";
    } else {
      phrase = state.mainVerb;
      tagques = "do";
    }

    if (neg) {
      tagques += " ";
      phrase += phrase === "am" ? " not " : "n't ";
    } else {
      tagques += "n't ";
      phrase += " ";
    }
  }

  const pron = PRONOUNS[person];

  if (firstwd === 2 && state.whichModal === 4 && !past) {
    tagques = "may " + pron + " not ";
  } else {
    tagques += pron;
  }

  if (ques) {
    if (putin > 0) {
      // VB: Left$(phrase, putin) + pron$ + Mid$(phrase, putin) — Mid$ is
      // 1-indexed and inclusive of position `putin`, i.e. slice(putin - 1).
      phrase = phrase.slice(0, putin) + pron + phrase.slice(putin - 1);
    } else {
      phrase += pron + " ";
    }
  } else {
    phrase = pron + " " + phrase;
  }

  phrase += buildUp(firstwd);

  if (ques) {
    phrase += " ...?";
  } else if (qtag) {
    phrase += " ..., " + tagques + "?";
  } else {
    phrase += " ...";
  }

  phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);

  return { phrase };
}

// Regular$ for the past-tense *finite* main verb (only reached when
// mainverb isn't "be"/"have" and it's an affirmative past statement).
function pastParticipleTextForFinitePast() {
  if (!state.found) {
    const r = addEd(state.mainVerb, state.syllable, state.person);
    state.rules = r.rule;
    return r.text;
  }
  state.rules = -1;
  return state.strongPast;
}

// ---------------------------------------------------------------------
// Warnings / rule note text
// ---------------------------------------------------------------------

function ruleNoteText() {
  if (state.rules > 0) {
    let a = "The rule for ";
    if (state.rules < 5) {
      a += "adding -S to " + state.mainVerb.toUpperCase();
    } else if (state.rules <= 17) {
      a += "adding -ING to " + state.mainVerb.toUpperCase();
    } else {
      if (state.hasPerfect || state.voice === "passive") {
        a += "making the past participle of " + state.mainVerb.toUpperCase();
      } else {
        a += "making " + state.mainVerb.toUpperCase() + " past";
      }
    }
    a += " is: " + RULE[state.rules] + ".";
    return a;
  } else if (state.rules < 0) {
    let a = state.mainVerb.toUpperCase() + " is an irregular verb whose ";
    if (state.rules === -1) {
      a += "past tense form is " + state.strongPast.toUpperCase() + ".";
    } else {
      a += "past participle form is " + state.strongPerfect.toUpperCase() + ".";
    }
    return a;
  }
  return "";
}

// warningsList — like the original's two-tier red/blue warning system
// described in Higgins's 1997 VERBALIST essay: red for a combination that's
// probably ungrammatical (passivising an intransitive verb), blue for one
// that's merely unusual (a stative verb made continuous, or an ambiguous
// negative modal).
function warningsList() {
  const list = [];
  if (state.intransitive && state.voice === "passive") {
    list.push({ text: "This intransitive verb is not normally used in the passive.", severity: "red" });
  }
  if (state.stative && state.aspect === "continuous") {
    list.push({ text: "This stative verb is not normally used in continuous forms.", severity: "blue" });
  }
  if (state.whichModal === 5 && state.hasModal && state.polarity === "negative") {
    const text =
      state.tense === "present"
        ? "The negative of MUST is a prohibition. Is this what you mean? Otherwise, use HAVE TO."
        : "The negative of HAVE TO means no obligation. Is this what you mean? Otherwise use COULDN'T.";
    list.push({ text, severity: "blue" });
  }
  return list;
}

// ---------------------------------------------------------------------
// Exports for ui.js
// ---------------------------------------------------------------------

window.Verbalist = {
  state,
  MODALS,
  PRONOUNS,
  loadVerbs,
  discover,
  buildVerb,
  ruleNoteText,
  warningsList,
  get verbs() {
    return VERBS;
  },
};
