# VERBALIST: VB6 Grammar Rules & Conjugation Logic

**Source**: verbalist/verbalist.txt
**Language**: VB6 (Visual Basic 6)
**Date**: Extracted for JavaScript implementation

---

## Table of Contents

1. [Grammar Rules (37 Rules)](#grammar-rules)
2. [Modal Verbs](#modal-verbs)
3. [Core Functions](#core-functions)
4. [State Variables](#state-variables)
5. [Algorithm Details](#algorithm-details)
6. [Test Cases](#test-cases)

---

## Grammar Rules

### Overview

The Writerule() subroutine (lines 2627-2674) defines 37 distinct grammar rules that cover:
- **Rules 1-4**: S/ES endings (Sending$)
- **Rules 5-17**: ING endings (Ing$)
- **Rules 18-20**: Irregular BE conjugations
- **Rules 21-35**: ED endings (Regular$)
- **Rules 36-37**: Special irregular cases

### Rule 1
**Description**: double the S and add ES if the verb has less than three syllables and ends in one vowel plus S or -Z

### Rule 2
**Description**: add ES if the verb ends in S, X, Z, SH, CH or consonant + O

### Rule 3
**Description**: change Y to IES if the verb ends in consonant plus Y

### Rule 4
**Description**: add S to verbs which do not end in S, SH, CH, consonant + Y or consonant + O

### Rule 5
**Description**: add ING if the verb is only two letters long

### Rule 6
**Description**: change final IE to YING

### Rule 7
**Description**: add ING to verbs which end in EE, OE, YE or INGE

### Rule 8
**Description**: delete the final E and add ING

### Rule 9
**Description**: add KING if the verb ends in vowel + C

### Rule 10
**Description**: add ING if the verb ends in two consonants or two vowels plus a consonant

### Rule 11
**Description**: add ING to the verb if it ends in a vowel other than E or one of the consonants F, H, J, Q, W, X or Y

### Rule 12
**Description**: add ING to verbs of three or more syllables

### Rule 13
**Description**: double the last letter and add ING if the verb has two syllables, ends consonant-vowel-consonant, and begins with a Latin prefix

### Rule 14
**Description**: double the last letter and add ING if the verb has one syllable and ends consonant-vowel-consonant

### Rule 15
**Description**: double the L and add ING to a two-syllable verb which ends consonant-vowel-L

### Rule 16
**Description**: add ING to a two-syllable verb ending in R, N or T with stress on the first syllable

### Rule 17
**Description**: double the final consonant and add ING if the verb ends consonant-vowel-consonant and the last consonant is B, D, G, K, M, P, S, V or Z

### Rule 18
**Description**: change BE to BEEN (irregular)

### Rule 19
**Description**: change BE to WAS (irregular)

### Rule 20
**Description**: change BE to WERE (irregular)

### Rule 21
**Description**: add D to any verb which ends in E

### Rule 22
**Description**: if the verb ends consonant-Y, change Y to IED

### Rule 23
**Description**: if the verb ends vowel-Y, add ED

### Rule 24
**Description**: add ED to a verb which ends with any vowel except E or with the consonants F, H, J, Q, W or X

### Rule 25
**Description**: add ED to verbs of three or more syllables

### Rule 26
**Description**: double the last letter and add ED if the verb has two syllables, ends consonant-vowel-consonant, and begins with a Latin prefix

### Rule 27
**Description**: add ED to a two-syllable verb ending in R, N or T with stress on the first syllable

### Rule 28
**Description**: double the R and add ED if the verb ends in R preceded by a single vowel other than E

### Rule 29
**Description**: double the final consonant and add ED to a one-syllable verb which ends consonant-vowel plus  N or T

### Rule 30
**Description**: add KED if the verb ends in vowel + C

### Rule 31
**Description**: double the L and add ED to a two-syllable verb which ends consonant-vowel-L

### Rule 32
**Description**: double the final consonant and add ED if the verb ends consonant-vowel-consonant and the last consonant is B, D, G, J, K, M, P, S, V or Z

### Rule 33
**Description**: add ED if the verb ends in two consonants or two vowels plus a consonant

### Rule 34
**Description**: reverse the last two letters and add ING if the word ends in consonant + RE

### Rule 35
**Description**: reverse the last two letters and add ED if the word ends in consonant + RE

### Rule 36
**Description**: change HAVE to HAS (irregular)

### Rule 37
**Description**: add S to a verb which ends in -CH preceded by just one vowel or Y


---

## Modal Verbs

The Writerule() subroutine defines 5 modal verbs with present and past forms:

### Modal 1: SHALL / SHOULD
| Form | Value |
|------|-------|
| Present | shall |
| Past | should |

### Modal 2: WILL / WOULD
| Form | Value |
|------|-------|
| Present | will |
| Past | would |

### Modal 3: CAN / COULD
| Form | Value |
|------|-------|
| Present | can |
| Past | could |

### Modal 4: MAY / MIGHT
| Form | Value |
|------|-------|
| Present | may |
| Past | might |

### Modal 5: MUST / HAD TO
| Form | Value |
|------|-------|
| Present | must |
| Past | had to |


---

## Core Functions

### Function Hierarchy

```
Buildverb()
  └── Buildup()
        ├── Ing$() for continuous aspect
        ├── Regular$() for past tense
        ├── Sending$() for -S endings
        └── Buildon() for "going to"

Discover()
  └── Binary search in verb database
```

### 1. Buildverb() (lines 1244-1585)

**Purpose**: Assembles the complete verb phrase for output.

**Key Logic**:
- Determines which word should be first based on tense/aspect/mood/voice
- Five cases based on firstwd value:
  - **Case 1**: Main verb (simple tense)
  - **Case 2**: Modal or emphatic auxiliary (DO/DOES/DID)
  - **Case 3**: HAVE (perfect aspect)
  - **Case 4**: BE (continuous aspect or passive)
  - **Case 5**: BE (passive voice)

**Pronoun Placement** (putin variable):
- Determines where pronoun goes relative to negation and question tags
- Values 0-7 represent different positions in phrase structure

**Negation Handling**:
- Sets phrase with appropriate contraction ("n't", "not", "n't have to", etc.)
- Varies by modal type and tense
- Creates question tag (tagques$) for tag questions

**Question Tags**:
- Built in reverse of main phrase negation
- Stored in tagques$ variable
- tagputin tracks pronoun position in tag

### 2. Buildup() (lines 1110-1243)

**Purpose**: Adds remaining verb phrase elements after main auxiliary.

**Structure**: Nested conditionals based on aspect combinations

**Key Combinations Handled**:
1. **Perfect + Continuous**: "have been ing" or "have been being ed"
2. **Perfect + Simple**: "have ed"
3. **Continuous**: "be ing" or "be being ed" (passive)
4. **Going to**: "have been going to" or "going to"
5. **Passive**: "have been ed" or "be ed"

**Main Verb Handling**:
- For irregular verbs: uses strongperfect from database (rules = -2)
- For regular verbs: calls Regular$() or Ing$()
- For passive: calls Ing$() for progressive passive

### 3. Regular$() (lines 2368-2496)

**Purpose**: Adds -ED to create past participle/past tense.

**Rules Applied**: 21-35

**Algorithm**:
1. Extract last 4 letters of verb
2. Select case on last letter
3. Apply appropriate rule based on:
   - Verb length (syllable count)
   - Letter patterns (consonant-vowel combinations)
   - Stress patterns (first vs second syllable stress)
   - Latin prefix detection
4. Return modified verb with ED suffix

**Special Cases**:
- Verbs ending in E: just add D (rule 21)
- Verbs ending in consonant+Y: change Y to IED (rule 22)
- Vowel+Y: add ED (rule 23)
- Consonant+vowel+consonant: double last consonant (rule 32)
- Consonant+RE: reverse and add ED (rule 35)

### 4. Sending$() (lines 2497-2581)

**Purpose**: Adds -S to create 3rd person singular present.

**Rules Applied**: 1-4, 36-37

**Algorithm**:
1. Extract last few letters of verb
2. Select case on last letter
3. Apply rule based on:
   - Syllable count
   - Ending patterns
   - Vowel/consonant sequences
4. Return modified verb with S/ES suffix

**Special Cases**:
- Verbs ending in S, X, Z, SH, CH: add ES (rule 2)
- Consonant+Y: change Y to IES (rule 3)
- Consonant+O: add ES (rule 2)
- Otherwise: add S (rule 4)
- Vowel+C: add S then CH as special case (rule 37)

### 5. Ing$() (lines 2015-2177)

**Purpose**: Adds -ING to create present participle.

**Rules Applied**: 5-17, 34

**Algorithm**:
1. Extract last 4 letters of verb
2. Select case on last letter
3. Apply rule based on:
   - Ending pattern
   - Syllable count
   - Stress patterns
   - Consonant-vowel-consonant patterns
   - Latin prefix detection
4. Return modified verb with ING suffix

**Special Cases**:
- Final E: delete and add ING (rule 8), except:
  - EE, OE, YE, INGE: add ING (rule 7)
  - IE: change to YING (rule 6)
- Final consonant+vowel+consonant:
  - Double if one syllable (rule 14)
  - Double if two syllables + Latin prefix (rule 13)
  - Don't double if stress on first syllable (rule 16)
- Final R, L, T with consonant+vowel pattern: varies by stress

### 6. Discover() (lines 1616-1736)

**Purpose**: Binary search in verb database to find irregular verb forms and flags.

**Algorithm**:
1. Converts input verb to uppercase
2. Sets up binary search boundaries (first/last record in database)
3. Loop: calculates midpoint and compares
4. If match found: extracts:
   - strongverb (base form for irregular)
   - strongpast (past tense form)
   - strongperfect (past participle form)
   - Stative flag (cannot be continuous)
   - Intransitive flag (cannot be passive)
5. Returns:
   - found = 1 if verb found in database
   - found = 0 if regular verb

**Binary Search Optimization**:
- Reduces lookup time from O(n) to O(log n)
- Critical for performance with large verb database

---

## State Variables

### Person Variables (1-7)

```
1 = I/we     (1st person)
2 = you      (2nd person singular)
3 = he/she/it (3rd person singular)
4 = I/we/you (other 1st/2nd person uses)
5 = he/she/it (uses DOES)
6 = you      (alternative form)
7 = they     (3rd person plural)
```

### Tense Flags

| Variable | Type | Values | Meaning |
|----------|------|--------|---------|
| Past | Boolean | 0/1 | 0=present, 1=past |
| Ifperfect | Boolean | 0/1 | Perfect aspect (have+ed) |
| continuous | Boolean | 0/1 | Continuous aspect (be+ing) |
| going | Boolean | 0/1 | Going to future |

### Mood/Modal Flags

| Variable | Type | Values | Meaning |
|----------|------|--------|---------|
| Ifmodal | Boolean | 0/1 | Modal verb active |
| whichmodal | Integer | 1-5 | Which modal (1=shall, 2=will, etc) |
| Emphatic | Boolean | 0/1 | Emphatic DO/DOES/DID |

### Voice Flags

| Variable | Type | Values | Meaning |
|----------|------|--------|---------|
| Ifvoice | Boolean | 0/1 | Passive voice (be+ed) |

### Affirmation Flags

| Variable | Type | Values | Meaning |
|----------|------|--------|---------|
| Neg | Boolean | 0/1 | Negation present |
| Affirm | Boolean | 0/1 | Affirmation (yes) |

### Question Flags

| Variable | Type | Values | Meaning |
|----------|------|--------|---------|
| ques | Boolean | 0/1 | Question format |
| tag | Boolean | 0/1 | Question tag format |

### Auxiliary Variables

| Variable | Type | Meaning |
|----------|------|---------|
| mainverb | String | The main lexical verb |
| phrase | String | Built output phrase |
| firstwd | Integer | 1-5: which word goes first |
| rules | Integer | Which grammar rule applied (-2=irregular) |
| putin | Integer | Pronoun position in main phrase |
| tagputin | Integer | Pronoun position in tag question |
| found | Integer | 0/1: verb in database |
| syllable | Integer | Syllable count of verb |

---

## Algorithm Details

### Person-Based Conjugation

The system uses 7 person categories to handle English conjugation rules:

**Present Tense (DO/DOES)**:
- Person 1,4: DO
- Person 2,6: DO
- Person 3,5: DOES (also handles "you" in some dialects)
- Person 7: DO

**Past Tense (DID)**:
- All persons: DID

**BE Conjugation**:
- Person 1: am/was
- Person 2,6: are/were
- Person 3,5: is/was
- Person 4,7: are/were

### Tense/Aspect/Mood/Voice Matrix

The Buildverb() function creates phrases from combinations:

```
Tense:    Present | Past
Aspect:   Simple | Perfect | Continuous | Perfect+Continuous
Mood:     Indicative | Emphatic | Modal (5 types)
Voice:    Active | Passive
Negation: Affirmative | Negative
Question: Statement | Question | Question Tag
```

**Total Combinations** (rough): 2×4×7×2×2×3 = 1,344 possible outputs per verb

### Phonetic Rules

The -ING and -ED suffix rules use phonetic patterns:

**Consonant Doubling Rules**:
- One-syllable CVC (consonant-vowel-consonant): double final C
- Two-syllable CVC with Latin prefix (prefix-CVC): double final C
- Two-syllable CVC with stress on first syllable: don't double
- Two-syllable CVC with stress on second syllable: double

**Syllable Detection**:
- Estimated from vowel groups
- Used to determine stress patterns

---

## Test Cases

### Test Verb: WALK (Regular)

**Expected Results**:

#### Present Tense
- I/we/you/they walk
- he/she/it walks

#### Past Tense
- I/we/you/he/she/it/they walked

#### Continuous Aspect
- I am walking
- he/she/it is walking
- you/we/they are walking

#### Perfect Aspect
- I/we have walked
- he/she/it has walked

#### Passive Voice
- I am walked (unnatural but grammatical)
- it is walked (unnatural)

#### Question Forms
- Do I/you/we/they walk?
- Does he/she/it walk?
- Did I/you/he/she/it/we/they walk?

#### Question Tags
- I walk, don't I?
- He walks, doesn't he?
- I walked, didn't I?
- I am walking, aren't I?

#### Negation
- I don't walk
- He doesn't walk
- I didn't walk
- I'm not walking
- I haven't walked

### Test Verb: GO (Irregular)

**Expected Results** (discovered from database):

#### Present Tense
- I/we/you/they go
- he/she/it goes

#### Past Tense
- I/we/you/he/she/it/they went

#### Continuous Aspect
- I am going
- he/she/it is going
- you/we/they are going

#### Perfect Aspect
- I/we have gone
- he/she/it has gone

#### Passive Voice (unnatural but valid)
- it is gone (passive with stative BE)

#### Question Forms
- Do I/you/we/they go?
- Does he/she/it go?
- Did I/you/he/she/it/we/they go?
- Where did you go?

#### Question Tags
- I go, don't I?
- He goes, doesn't he?
- I went, didn't I?

#### Negation
- I don't go
- He doesn't go
- I didn't go

### Test Verb: BE (Highly Irregular)

**Expected Results** (special handling in code):

#### Present Tense
- I am
- you are
- he/she/it is
- we/they are

#### Past Tense (rules 18-20)
- I was (rule 19)
- you were (rule 20)
- he/she/it was (rule 19)
- we/they were (rule 20)

#### Continuous Aspect
- I am being (unusual)
- you are being (unusual)
- etc.

#### Perfect Aspect
- I have been (rule 18)
- you have been (rule 18)

#### Question Forms
- Am I?
- Are you?
- Is he/she/it?
- Were they?

#### Negation
- I am not / I'm not
- you aren't
- he/she/it isn't
- we/they aren't

#### Question Tags
- I am, aren't I?
- You are, aren't you?
- He is, isn't he?
- I was, wasn't I?
- You were, weren't you?

---

## Implementation Notes for JavaScript

### Key Observations

1. **Binary Search in Discover()**: Requires sorted verb database
2. **Person System**: 7 categories provide complete conjugation coverage
3. **Aspect Combinations**: Perfect + Continuous = "have been" (either ed or ing)
4. **Negation Logic**: Changes with tense, aspect, and mood
5. **Question Tags**: Always opposite polarity to main clause
6. **Syllable Counting**: Approximate from vowel groups
7. **Stress Detection**: Heuristic based on Latin prefixes

### Critical Functions to Port

Priority order for JavaScript implementation:

1. **Discover()** - Binary search must be fast
2. **Buildverb()** - Core phrase assembly logic
3. **Buildup()** - Completes phrase after auxiliary
4. **Regular$(), Sending$(), Ing$()** - Suffix addition with rules
5. **Person-based conjugation** - DO/DOES/DID, BE forms

### Data Structures Needed

- Verb database (sorted array or index)
- Rule definitions (37 rules)
- Modal verb pairs (5 modals × 2 forms)
- Irregular verb overrides
- Stative verb list
- Intransitive verb list
- Prefix list for doubling rules


---

## Appendix: VB6 Source Code

### Buildverb() - Main Verb Phrase Assembly (lines 1244-1585)

```vb
Private Sub Buildverb()
' assembles the verb phrase for printing
               
rules = 0
' no rule to apply yet
putin = 0
' where to put pronoun
tagputin = 0

' start by fixing tense
If Ifmodal.Value Or Emphatic.Value Then
  firstwd = 2
ElseIf Ifperfect.Value Then
  firstwd = 3
ElseIf continuous.Value Or going.Value Then
  firstwd = 4
ElseIf Ifvoice.Value Then
  firstwd = 5
Else
  firstwd = 1
End If

tagques$ = ""               ' for possible question tag
       
Select Case firstwd
  Case 2
  ' modal is filled
    If Emphatic.Value Then
      If Past.Value Then
        phrase = "did"
      ElseIf person > 4 Then
        phrase = "does"
      Else
        phrase = "do"
      End If
    Else
      phrase = modalverb(whichmodal, Abs(Past.Value))
      ' writes present or past tense form of modal
      ' to first element
    End If
    If Neg.Value Then
      tagques$ = phrase + " "
      If Past.Value Or Emphatic.Value Then
        phrase = phrase + "n't "
        If whichmodal = 5 And Not Emphatic.Value Then
          phrase = "didn't have to "
          putin = 7
          tagques$ = "did "
        End If
      Else
        Select Case whichmodal
          Case 1
            phrase = "shan't "
          Case 2
            phrase = "won't "
          Case 3
            phrase = "can't "
          Case 4
            phrase = "mayn't "
          Case 5
            phrase = "mustn't "
        End Select
      End If
    Else
      If Past.Value Then
        tagques$ = phrase + "n't "
        If whichmodal = 5 Or Emphatic.Value Then
          tagques$ = "didn't "
          putin = 4
        End If
      ElseIf Emphatic.Value Then
          tagques$ = phrase + "n't "
      Else
        Select Case whichmodal
          Case 1
            tagques$ = "shan't "
          Case 2
            tagques$ = "won't "
          Case 3
            tagques$ = "can't "
          Case 4
            tagques$ = "may not"
            tagputin = 4
          Case Else
            tagques$ = "mustn't "
        End Select
      End If
      phrase = phrase + " "
    End If
  Case 3
  ' have is filled but not modal
    If Past.Value Then
      phrase = "had"
    ElseIf person > 4 Then
      phrase = "has"
    Else
      phrase = "have"
    End If
    If Neg.Value Then
      tagques$ = phrase + " "
      phrase = phrase + "n't "
    Else
      tagques$ = phrase + "n't "
      phrase = phrase + " "
    End If
  Case Is > 3
  ' continuous or passive be is filled
  ' but not have or modal
    If Past.Value Then
      If person = 1 Or person > 4 Then
        phrase = "was"
        tagques$ = "was"
      Else
        phrase = "were"
        tagques$ = "were"
      End If
    Else
      Select Case person
        Case 1
          If Neg.Value And ques.Value Then
          ' special case for "aren't I"
            phrase = "are"
          Else
            phrase = "am"
            If Neg.Value Then
              tagques$ = "am"
            Else
              tagques$ = "are"
            End If
          End If
        Case Is > 4
          phrase = "is"
          tagques$ = "is"
        Case Else
          phrase = "are"
          tagques$ = "are"
      End Select
    End If
    If Neg.Value Then
      tagques$ = tagques$ + " "
      If person = 1 And (Stating.Value Or qtag.Value) And Not Past.Value Then
      ' special case for "I am not"
        phrase = phrase + " not "
      Else
        phrase = phrase + "n't "
      End If
    Else
      tagques$ = phrase + "n't "
      phrase = phrase + " "
      If person = 1 And qtag.Value And Not Past.Value Then
      ' special case for Aren't I
        tagques$ = "aren't "
      End If
    End If

  Case Else
  ' main verb only
    If Past.Value Then
      tagques$ = "did"
      If mainverb = "be" Then
        If person = 1 Or person > 4 Then
          phrase = "was"
          tagques$ = "was"
        Else
          phrase = "were"
          tagques$ = "were"
        End If
      ElseIf mainverb = "have" Then
        phrase = "had"
        tagques$ = "had"
      ElseIf Neg.Value Or ques.Value Then
        phrase = "did"
        tagques$ = "did"
      Else
        If found = 0 Then
          phrase = Regular$(mainverb)
          ' add a regular -ed ending
        Else
          rules = -1
          phrase = strongpast
          ' select second form of strong verb
        End If
      End If
    ElseIf mainverb = "be" Then
    ' present tense of be
      Select Case person
        Case 1
          phrase = "am"
        Case 2, 3, 4
          phrase = "are"
        Case Else
          phrase = "is"
      End Select
      tagques$ = phrase
    ElseIf person > 4 Then
    ' 3rd person singular present of other verbs
      tagques$ = "does"
      If Neg.Value Or ques.Value Then
      ' question or negative
        phrase = "does"
      Else
      ' add the 3rd-person s
        phrase = Sending$(mainverb)
      End If
    ElseIf Neg.Value Or ques.Value Then
    ' question or negative?
      phrase = "do"
      tagques$ = "do"
    Else
    ' verb is main verb
      phrase = mainverb
      tagques$ = "do"
    End If

    If Neg.Value Then
      tagques$ = tagques$ + " "
      If phrase = "am" Then
        phrase = phrase + " not "
      Else
        phrase = phrase + "n't "
      End If
    Else
      tagques$ = tagques$ + "n't "
      phrase = phrase + " "
    End If
  End Select

  Select Case person
  ' invert pronoun/verb if a question
    Case 1
      pron$ = "I"
    Case 2
      pron$ = "we"
    Case 3
      pron$ = "you"
    Case 4
      pron$ = "they"
    Case 5
      pron$ = "he"
    Case 6
      pron$ = "she"
    Case 7
      pron$ = "it"
  End Select
  
  If firstwd = 2 And whichmodal = 4 And Not Past.Value Then
  ' special case for not contracting NOT
    tagques$ = "may " + pron$ + " not "
  Else
    tagques$ = tagques$ + pron$
  End If

  If ques.Value Then
    If putin > 0 Then
      phrase = Left$(phrase, putin) + pron$ + Mid$(phrase, putin)
    Else
      phrase = phrase + pron$ + " "
    End If
  Else
    phrase = pron$ + " " + phrase
'    If tagputin > 0 Then
 '     tagques$ = Left$(tagques$, tagputin) + pron$ + Mid$(tagques$, tagputin)
  '  Else
   '   tagques$ = tagques$ + pron$
    'End If
  End If

  ' at this stage we have the first two words of the
  ' phrase and have to complete it. We can still use
  ' the firstwd variable

  Call Buildup(firstwd)

  If ques.Value Then
    phrase = phrase + " ...?"
  ElseIf qtag.Value Then
    phrase = phrase + " ..., " + tagques$ + "?"
  Else
    phrase = phrase + " ..."
  End If
  phrase = UCase$(Left$(phrase, 1)) + Mid$(phrase, 2)

  Label2.Caption = phrase

  If rules > 0 Then
    a$ = "The rule for "
    Select Case rules
      Case Is < 5
        a$ = a$ + "adding -S to " + UCase$(mainverb)
      Case 5 To 17
        a$ = a$ + "adding -ING to " + UCase$(mainverb)
      Case Else
        If Ifperfect.Value Or Ifvoice.Value Then
          a$ = a$ + "making the past participle of "
          a$ = a$ + UCase$(mainverb)
        Else
          a$ = a$ + "making " + UCase$(mainverb) + " past"
        End If
    End Select
    a$ = a$ + " is: " + rule$(rules) + "."
    Label3.Caption = a$
    Label3.Visible = True
  ElseIf rules < 0 Then
    a$ = UCase$(mainverb) + " is an irregular verb whose "
    If rules = -1 Then
      a$ = a$ + "past tense form is "
      a$ = a$ + UCase$(strongpast) + "."
    Else
      a$ = a$ + "past participle form is "
      a$ = a$ + UCase$(strongperfect) + "."
    End If
    Label3.Caption = a$
    Label3.Visible = True
  Else
    Label3.Visible = False
  End If

  If intransitive And Ifvoice.Value Then
    z$ = "This intransitive verb is not normally used in the passive."
  Else
    z$ = ""
  End If
  If stative And (continuous.Value Or addcont.Value) Then
    Y$ = "This stative verb is not normally used in continuous forms.  "
  ElseIf Not intransitive Then
    Y$ = ""
  End If

  If whichmodal = 5 And Ifmodal.Value And Neg.Value Then
    If Present.Value Then
      zz$ = "The negative of MUST is a prohibition. Is this what you mean? Otherwise, use HAVE TO."
    Else
      zz$ = "The negative of HAVE TO means no obligation. Is this what you mean? Otherwise use COULDN'T."
    End If
  Else
    zz$ = ""
  End If

  Shownote.Caption = note
  warnings.Caption = Y$ + z$ + zz$

End Sub
```

### Buildup() - Complete Verb Phrase (lines 1110-1243)

```vb
Private Sub Buildup(frst)
' adds remainder of verb phrase to finite portion

Select Case frst
  Case 2
  ' modal or to is first element
  ' so no need to change next form
    If Ifperfect.Value Then
    ' have is present
      If continuous.Value Then
      ' continuous be is present
        If Ifvoice.Value Then
          phrase = phrase + "have been being "
          If found = 0 Then
            phrase = phrase + Regular$(mainverb)
          Else
            rules = -2
            phrase = phrase + strongperfect
          End If
        Else
          phrase = phrase + "have been " + Ing$(mainverb)
        End If
      ElseIf going.Value Then
      ' have and going to
        phrase = phrase + "have been going to "
        Buildon
      Else
      ' have but not continuous be
        If Ifvoice.Value Then
        ' passive be
          phrase = phrase + "have been "
        Else
          phrase = phrase + "have "
        End If
        If found = 0 Then
          phrase = phrase + Regular$(mainverb)
        Else
          rules = -2
          phrase = phrase + strongperfect
        End If
      End If
    Else
    ' no have
      If continuous.Value Then
        If Ifvoice.Value Then
          phrase = phrase + "be being "
          If found = 0 Then
            phrase = phrase + Regular$(mainverb)
          Else
            rules = -2
            phrase = phrase + strongperfect
          End If
        Else
          phrase = phrase + "be " + Ing$(mainverb)
        End If
      ElseIf going.Value Then
        phrase = phrase + "be going to "
        Buildon
      ElseIf Ifvoice.Value Then
        If Emphatic.Value Then
          phrase = phrase + "get "
        Else
          phrase = phrase + "be "
        End If
        If found = 0 Then
          phrase = phrase + Regular$(mainverb)
        Else
          rules = -2
          phrase = phrase + strongperfect
        End If
      Else
        phrase = phrase + mainverb
      End If
    End If
  Case 3
  ' have is first element
    If continuous.Value Then
    ' be is present
      If Ifvoice.Value Then
        phrase = phrase + "been being "
        If found = 0 Then
          phrase = phrase + Regular$(mainverb)
        Else
          rules = -2
          phrase = phrase + strongperfect
        End If
      Else
        phrase = phrase + "been " + Ing$(mainverb)
      End If
    ElseIf going.Value Then
      phrase = phrase + "been going to "
      Buildon
    Else
      If Ifvoice.Value Then phrase = phrase + "been "
      If found = 0 Then
        phrase = phrase + Regular$(mainverb)
      Else
        rules = -2
        phrase = phrase + strongperfect
      End If
    End If
  Case 4
  ' continuous or going to be is first element
    If going.Value Then
      phrase = phrase + "going to "
      Buildon
    ElseIf Ifvoice.Value Then
      phrase = phrase + "being "
      If found = 0 Then
        phrase = phrase + Regular$(mainverb)
      Else
        rules = -2
        phrase = phrase + strongperfect
      End If
    Else
      phrase = phrase + Ing$(mainverb)
    End If
  Case 5
    If found = 0 Then
      phrase = phrase + Regular$(mainverb)
    Else
      rules = -2
      phrase = phrase + strongperfect
    End If
  Case Else
    If Neg.Value Or ques.Value Then
      If mainverb <> "be" Then
        phrase = phrase + mainverb
      End If
    End If
End Select

End Sub

```

### Ing$() - Add -ING Suffix (lines 2015-2177)

```vb
Private Function Ing$(a$)
' adds -ing to a

X$ = Right$(a$, 1)
' last letter of word
If Len(a$) > 1 Then
  Y$ = Mid$(a$, Len(a$) - 1, 1)
  ' second-last letter
Else
' one letter only entered
  Ing$ = UCase$(a$) + "ing"
  Exit Function
End If
If Len(a$) > 2 Then
  z$ = Mid$(a$, Len(a$) - 2, 1)
Else
  z$ = "a"
End If
' third-last letter
If Len(a$) > 3 Then
  zz$ = Mid$(a$, Len(a$) - 3, 1)
Else
  zz$ = "a"
End If
' fourth-last letter

Select Case X$
  Case "e"
  ' word ends in -e
  If Len(a$) < 3 Then
  ' verb to be
    Ing$ = a$ + "ing"
    rules = 5
  ElseIf Y$ = "i" Then
  ' word ends in ie
    Ing$ = Left$(a$, Len(a$) - 2) + "ying"
    rules = 6
  ElseIf Y$ = "e" Or Y$ = "o" Or Y$ = "y" Then
  ' word ends in double e, oe or ye
    Ing$ = a$ + "ing"
    rules = 7
  ElseIf Y$ = "g" And z$ = "n" And zz$ = "i" Then
  ' verb ends in inge
    Ing$ = a$ + "ing"
    rules = 7
  ElseIf Y$ = "r" And Not Isavowel(z$) Then
  ' word ends in consonant + re
    Ing$ = Left$(a$, Len(a$) - 2) + "ering"
    rules = 34
  Else
  ' all other letter + e endings
    Ing$ = Left$(a$, Len(a$) - 1) + "ing"
    rules = 8
    ' so drop the final e
  End If
           
  Case "c"
  ' ends in c
  If Isavowel(Y$) And Not Isavowel(z$) Then
  ' eg picnic/picnicking
    Ing$ = a$ + "king"
    rules = 9
  Else
    Ing$ = a$ + "ing"
    rules = 10
  End If
           
  Case "a", "f", "h", "i", "j", "o", "q", "u", "w", "x", "y"
  ' single-f, j and q only possible in loan words
  Ing$ = a$ + "ing"
  rules = 11
           
  Case Else
  ' b, d, g, k, l, m, n, p, r, s, t, v, and z
  If Isavowel(Y$) And (Not Isavowel(z$) Or zz$ = "q") Then
  ' word ends in one consonant preceded by one vowel
    Select Case X$
      Case "r"
      ' word ends in r
      If syllable > 2 Then
        Ing$ = a$ + "ing"
        rules = 12
      ElseIf Hasaprefix(a$) Or a$ <> "conquer" Then
      ' stress on second syllable so double the last letter
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 13
      ElseIf syllable = 1 Then
      ' words like stir, bar, etc which double the -r
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 14
      Else
      ' words like offer and cater
        Ing$ = a$ + "ing"
        rules = 16
      End If
                  
      Case "n", "t"
      If syllable > 2 And Not Hasaprefix(a$) Or a$ = "interpret" Then
        Ing$ = a$ + "ing"
        rules = 12
      ElseIf syllable = 2 Then
      ' word ends in vowel+ n or vowel+t
        If Hasaprefix(a$) Or a$ = "emit" Or a$ = "omit" Then
        ' stress on second syllable so double the last letter
          Ing$ = a$ + Right$(a$, 1) + "ing"
          rules = 13
        Else
        ' words like visit, audit, listen
          Ing$ = a$ + "ing"
          rules = 16
        End If
      Else
      ' word is one-syllable so double final consonant
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 14
      End If
      Case "l"
      If syllable > 2 Then
        Ing$ = a$ + "ing"
        rules = 12
      ElseIf syllable = 1 Then
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 14
      Else
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 15
      End If
      Case "p"
      If syllable > 2 And Not Hasaprefix(a$) Then
        Ing$ = a$ + "ing"
        rules = 12
      ElseIf syllable = 1 Then
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 14
      ElseIf Hasaprefix(a$) Or a$ = "equip" Then
        Ing$ = a$ + Right$(a$, 1) + "ing"
        ' double the last letter
        rules = 13
      Else
        Ing$ = a$ + "ing"
        rules = 16
      End If

      Case Else
      ' other than r, l, t or n
      If syllable > 2 And Not Hasaprefix(a$) Then
        Ing$ = a$ + "ing"
        rules = 12
      Else
        Ing$ = a$ + Right$(a$, 1) + "ing"
        rules = 17
        ' so double the last letter
      End If
      End Select
    Else
      Ing$ = a$ + "ing"
      rules = 10
    End If
           
  End Select

End Function

```

### Regular$() - Add -ED Suffix (lines 2368-2496)

```vb
Private Function Regular$(a$)
' adds ed ending to weak verbs for past tense or participle
         
X$ = Right$(a$, 1)
If Len(a$) > 1 Then
  Y$ = Mid$(a$, Len(a$) - 1, 1)
  ' second last letter
Else
' single letter verb
  Regular$ = UCase$(a$) + "ed"
  Exit Function
End If
If Len(a$) > 2 Then
  z$ = Mid$(a$, Len(a$) - 2, 1)
Else
  z$ = "a"
End If
' third last letter
          
If a$ = "be" Then
  If Ifperfect.Value Or Ifvoice.Value Then
    Regular$ = "been"
    rules = 18
  ElseIf person = 1 Or person = 4 Then
    rules = 19
    Regular$ = "was"
  Else
    Regular$ = "were"
    rules = 20
  End If
  Exit Function
End If
      
Select Case X$
  Case "e"
    If Y$ = "r" And Not Isavowel(z$) Then
    ' word ends in consonant+re
      Regular$ = Left$(a$, Len(a$) - 2) + "ered"
      rules = 35
    Else
      Regular$ = a$ + "d"
      rules = 21
    End If
  Case "y"
    If Not Isavowel(Y$) Then
      Regular$ = Left$(a$, Len(a$) - 1) + "ied"
      rules = 22
    Else
      Regular$ = a$ + "ed"
      rules = 23
    End If
  Case "a", "f", "h", "i", "j", "o", "q", "u", "w", "x"
    Regular$ = a$ + "ed"
    rules = 24
  Case Else
  ' b, c, d, g, k, l, m, n, p, r, s, t, v, and z
    If Isavowel(Y$) And (Not Isavowel(z$) Or zz$ = "q") Then
    ' ends in a single consonant preceded by single vowel
      Select Case X$
        Case "r"
        ' word ends in r
          If Y$ = "e" Then
          ' word ends in -er
            If syllable > 2 Then
            ' 3-syllables, no doubling
               Regular$ = a$ + "ed"
               rules = 25
            ElseIf Hasaprefix(a$) Or a$ <> "conquer" Then
            ' stress on second syllable so double the last letter
              Regular$ = a$ + Right$(a$, 1) + "ed"
              rules = 26
            Else
            ' words like offer, utter, cater
              Regular$ = a$ + "ed"
              rules = 27
            End If
          Else
            Regular$ = a$ + Right$(a$, 1) + "ed"
            rules = 28
            ' double the r
          End If
      
      Case "n", "t"
        If syllable > 2 And Not Hasaprefix(a$) Or a$ = "interpret" Then
        ' three-syllable word
          Regular$ = a$ + "ed"
          rules = 25
        ElseIf syllable = 2 Then
          If Hasaprefix(a$) Or a$ = "emit" Or a$ = "omit" Then
          ' Latin prefix so stress last syllable, double consonant
            Regular$ = a$ + Right$(a$, 1) + "ed"
            rules = 26
          Else
          ' words like visit, listen, audit
            Regular$ = a$ + "ed"
            rules = 27
          End If
        Else
        ' word is one-syllable so double final consonant
          Regular$ = a$ + Right$(a$, 1) + "ed"
          rules = 29
        End If
      Case "c"
      ' eg frolic, panic, picnic, shellac
        Regular$ = a$ + "ked"
        rules = 30
      Case "l"
        If syllable > 2 Then
          Regular$ = a$ + "ed"
          rules = 25
        Else
          Regular$ = a$ + Right$(a$, 1) + "ed"
          rules = 31
        End If
      Case Else
      ' b, d, g, j, k, m, p, s, v, z
      ' preceded by one vowel but not two
        Regular$ = a$ + Right$(a$, 1) + "ed"
        rules = 32
        ' so double the last letter
    End Select
  Else
    Regular$ = a$ + "ed"
    rules = 33
  End If
End Select

End Function

```

### Sending$() - Add -S Suffix (lines 2497-2581)

```vb
Private Function Sending$(a$)
' adds -s to a verb

If a$ = "have" Then
  Sending$ = "has"
  rules = 36
  Exit Function
End If

X$ = Right$(a$, 1)
' last letter
If Len(a$) > 1 Then
  Y$ = Mid$(a$, Len(a$) - 1, 1)
  ' second last letter
Else
' one letter only entered
  Sending$ = UCase$(a$) + "s"
  Exit Function
End If
If Len(a$) > 2 Then
  z$ = Mid$(a$, Len(a$) - 2, 1)
Else
  z$ = ""
End If
' third-last letter
If Len(a$) > 3 Then
  zz$ = Mid$(a$, Len(a$) - 3, 1)
Else
  z$ = ""
End If
' fourth-last letter


Select Case X$
  Case "s", "z"
    If Isavowel(Y$) And (Not Isavowel(z$) Or zz$ = "q") Then
      If syllable < 3 Then
        Sending$ = a$ + Right$(a$, 1) + "es"
        ' double the s after a single vowel
        rules = 1
      Else
        Sending$ = a$ + "es"
        rules = 2
      End If
    Else
      Sending$ = a$ + "es"
      rules = 2
    End If
  Case "x"
    Sending$ = a$ + "es"
    rules = 2
  Case "h"
    If Y$ = "c" And z$ <> "i" And (Isavowel(z$) Or z$ = "y") And Not Isavowel(zz$) Then
      Sending$ = a$ + "s"
      rules = 37
    ElseIf Y$ = "c" Or Y$ = "s" Then
      Sending$ = a$ + "es"
      rules = 2
    Else
      Sending$ = a$ + "s"
      rules = 4
    End If
  Case "y"
    If Not Isavowel(Y$) Then
      Sending$ = Left$(a$, Len(a$) - 1) + "ies"
      rules = 3
    Else
      Sending$ = a$ + "s"
      rules = 4
    End If
  Case "o"
    If Not Isavowel(Y$) Then
      Sending$ = a$ + "es"
      rules = 2
    Else
      Sending$ = a$ + "s"
      rules = 4
    End If
  Case Else
    Sending$ = a$ + "s"
    rules = 4
End Select

End Function

```

### Discover() - Irregular Verb Lookup (lines 1616-1736)

```vb
Private Sub Discover()
' search for verb in strong verb array

  If strongtotal = 0 Then Exit Sub
  increment = strongtotal \ 4
  pointer = strongtotal \ 2
  found = 0
  retried = 0

  Do
    If pointer > strongtotal Then
      pointer = strongtotal
    ElseIf pointer < 1 Then
      pointer = 1
    End If
    Get #1, pointer, target
    If mainverb = LTrim$(RTrim$(target.spell)) Then
      found = pointer
      Exit Do
    ElseIf mainverb > LTrim$(RTrim$(target.spell)) Then
      pointer = pointer + increment
    Else
      pointer = pointer - increment
    End If
    increment = increment \ 2 + increment Mod 2
    If increment < 2 Then
      retried = retried + 1
    End If
    If retried > 3 Then Exit Do
  Loop
  If found Then
    If (target.limits And 1) = 1 And (target.limits And 2) <> 2 Then
      ' user has entered oblique tense of a strong verb
      Msg$ = "Do you really mean TO " + UCase$(mainverb) + "?"
      meantit = MsgBox(Msg$, 292, "SURE?")
      If meantit = 6 Then
        Label4.Caption = "Unrecognised verb"
        intransitive = False
        stative = False
        found = 0
      Else
        mainverb = oldmainverb
        Exit Sub
      End If
    Else
      Label4.Caption = target.defin
      If target.limits And 8 Then
        intransitive = True
      Else
        intransitive = False
      End If
      If (target.limits And 64) Or (target.limits And 128) Then
        stative = True
      Else
        stative = False
      End If
    End If
  ElseIf Right$(UCase$(mainverb), 2) = "ED" Then
    Msg$ = "Do you really mean TO " + UCase$(mainverb) + "?"
    meantit = MsgBox(Msg$, 292, "SURE?")
    If meantit = 6 Then
      Label4.Caption = "Unrecognised verb"
      intransitive = False
      stative = False
    Else
      mainverb = oldmainverb
      Exit Sub
    End If
  Else
    For z = 1 To 5
      For zz = 0 To 1
        If mainverb = modalverb(z, zz) Then
        ' user has entered a modal
          Msg$ = "Do you really mean TO " + UCase$(mainverb) + "?"
          meantit = MsgBox(Msg$, 292, "SURE?")
          If meantit = 6 Then
            Exit For
          Else
            mainverb = oldmainverb
            Exit Sub
          End If
        End If
      Next zz
    Next z
    Label4.Caption = "Unrecognised verb"
    intransitive = False
    stative = False
  End If
  note = ""
  If found And target.reclong > 1 Then
  ' a note exists
    note = Space$(target.reclong)
    Get #2, target.recpoint, note
    If target.limits And 1 Then
    ' this is a strong verb
      chop = InStr(note, " ")
      ' look for first word of note
      If chop > 0 Then strongpast = Left$(note, chop - 1)
      ' and put it into past tense
      note = Mid$(note, chop + 1)
      ' rest of note
      chop = InStr(note, "\")
      ' look for next element up to \
      If chop > 0 Then strongperfect = Left$(note, chop - 1)
      ' and assign it to past participle
      note = Mid$(note, chop + 1)
      ' rest of note after \
    Else
      found = 0
      ' not a strong verb
    End If
  Else
    found = 0
    ' no note and not a strong verb
  End If

  current.Caption = " " + mainverb + " "
  oldmainverb = mainverb
  Buildverb

End Sub
```
