/**
 * tests/data.test.js
 * Dependency-free test script to validate data.json
 * Runs with: node tests/data.test.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

const VALID_CATEGORIES = ['Food', 'History', 'Hospitality', 'Parks/Attractions'];
const VALID_BUDGETS = ['low', 'medium', 'high'];
const PUNE_LAT_MIN = 18.3;
const PUNE_LAT_MAX = 18.9;
const PUNE_LNG_MIN = 73.3;
const PUNE_LNG_MAX = 74.1;
const SCORE_MIN = 0;
const SCORE_MAX = 10;

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function runCheck(description, testFn) {
  totalChecks++;
  try {
    const result = testFn();
    if (result === true || (result && result.pass)) {
      passedChecks++;
      console.log(`PASS: ${description}`);
      return true;
    } else {
      failedChecks++;
      const msg = result && result.message ? ` - ${result.message}` : '';
      console.error(`FAIL: ${description}${msg}`);
      return false;
    }
  } catch (err) {
    failedChecks++;
    console.error(`FAIL: ${description} - Exception: ${err.message}`);
    return false;
  }
}

console.log('========================================');
console.log('Chaos2Calm - data.json Validation Suite');
console.log('========================================\n');

// 1. File loading
let data = null;
runCheck('data.json exists and is valid JSON', () => {
  if (!fs.existsSync(DATA_FILE)) {
    return { pass: false, message: `File not found at ${DATA_FILE}` };
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  data = JSON.parse(raw);
  return Array.isArray(data.places) && data.places.length > 0;
});

if (!data || !Array.isArray(data.places)) {
  console.error('\nCannot continue testing: data.places is missing or not an array.');
  process.exit(1);
}

const places = data.places;

// 2. Name check
runCheck('Every place has a non-empty name', () => {
  const invalid = places.filter(p => typeof p.name !== 'string' || p.name.trim() === '');
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places missing valid names (e.g. id: ${invalid[0].id || 'unknown'})` };
  }
  return true;
});

// 3. Category check
runCheck(`Every place has a valid category (${VALID_CATEGORIES.join(', ')})`, () => {
  const invalid = places.filter(p => !VALID_CATEGORIES.includes(p.category));
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places have invalid category: ${invalid.map(p => `"${p.name}": ${p.category}`).slice(0, 3).join(', ')}` };
  }
  return true;
});

// 4. Budget check
runCheck(`Every place has a valid budget (${VALID_BUDGETS.join(', ')})`, () => {
  const invalid = places.filter(p => !VALID_BUDGETS.includes(p.budget));
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places have invalid budget: ${invalid.map(p => `"${p.name}": ${p.budget}`).slice(0, 3).join(', ')}` };
  }
  return true;
});

// 5. Latitude and Longitude check inside Pune region
runCheck(`Every place coordinates are inside the Pune region (lat: ${PUNE_LAT_MIN}-${PUNE_LAT_MAX}, lng: ${PUNE_LNG_MIN}-${PUNE_LNG_MAX})`, () => {
  const invalid = places.filter(p => {
    return typeof p.lat !== 'number' || isNaN(p.lat) || p.lat < PUNE_LAT_MIN || p.lat > PUNE_LAT_MAX ||
           typeof p.lng !== 'number' || isNaN(p.lng) || p.lng < PUNE_LNG_MIN || p.lng > PUNE_LNG_MAX;
  });
  if (invalid.length > 0) {
    return {
      pass: false,
      message: `${invalid.length} places with coordinates out of bounds: ${invalid.map(p => `"${p.name}" (lat: ${p.lat}, lng: ${p.lng})`).slice(0, 3).join(', ')}`
    };
  }
  return true;
});

// 6. Scores existence check
runCheck('Every place has scores (safetyScore, cleanlinessScore, affordabilityScore)', () => {
  const invalid = places.filter(p => {
    return typeof p.safetyScore === 'undefined' ||
           typeof p.cleanlinessScore === 'undefined' ||
           typeof p.affordabilityScore === 'undefined';
  });
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places missing score fields: ${invalid.map(p => p.name).slice(0, 3).join(', ')}` };
  }
  return true;
});

// 7. Scores numeric range check (0 to 10)
runCheck(`Every place score is a valid number between ${SCORE_MIN} and ${SCORE_MAX}`, () => {
  const scoreKeys = ['safetyScore', 'cleanlinessScore', 'affordabilityScore'];
  const invalid = places.filter(p => {
    return scoreKeys.some(key => {
      const val = p[key];
      return typeof val !== 'number' || isNaN(val) || val < SCORE_MIN || val > SCORE_MAX;
    });
  });
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places have scores out of [0, 10] range: ${invalid.map(p => p.name).slice(0, 3).join(', ')}` };
  }
  return true;
});

// 8. Required fields completeness check
runCheck('Every place has all required core fields (name, category, lat, lng, budget, scores)', () => {
  const requiredFields = ['name', 'category', 'lat', 'lng', 'budget', 'safetyScore', 'cleanlinessScore', 'affordabilityScore'];
  const invalid = places.filter(p => {
    return requiredFields.some(f => typeof p[f] === 'undefined' || p[f] === null);
  });
  if (invalid.length > 0) {
    return { pass: false, message: `${invalid.length} places missing one or more required core fields` };
  }
  return true;
});

console.log('\n----------------------------------------');
console.log(`Summary: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed).`);
console.log('----------------------------------------\n');

if (failedChecks > 0) {
  console.error(`Result: FAIL (${failedChecks} check(s) failed)`);
  process.exit(1);
} else {
  console.log(`Result: PASS (All ${places.length} places in data.json are valid)`);
  process.exit(0);
}
