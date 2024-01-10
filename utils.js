const readlineSync = require('readline-sync');

function updateJSONValues(obj) {
  const updatedPairs = [];
  let tempKey = '';
  let tempValue = '';

  for (const key in obj) {
    if (key.includes('PLEASEVERIFYTHESENTENCE')) {
      if (!tempKey) {
        tempKey = key;
        tempValue = obj[key];
      } else {
        const cleanKey = tempKey.replace('_PLEASEVERIFYTHESENTENCE', '');
        if (key.includes('PLEASEVERIFYTHESENTENCE_REFERENCE')) {
          console.log(`Key: ${cleanKey}`);
          console.log(`Reference: ${obj[key]}`);
          console.log(`Current value: ${tempValue}`);
          const newValue = readlineSync.question(
            'Press "Enter" to keep the current value or enter a new value: '
          );
          if (newValue.trim()) {
            updatedPairs.push({ key: cleanKey, value: newValue.trim() });
          } else {
            updatedPairs.push({ key: cleanKey, value: tempValue });
          }
        } else {
          console.error(
            `${cleanKey} PLEASEVERIFYTHESENTENCE not followed by PLEASEVERIFYTHESENTENCE_REFERENCE`
          );
        }
        tempKey = '';
        tempValue = '';
      }
    } else if (typeof obj[key] === 'object') {
      updateJSONValues(obj[key]); // Recursively call for nested objects
    }
  }

  updatedPairs.forEach(({ key, value }) => {
    obj[key] = value;
  });
}

function extractKeyValueFromString(inputString) {
  const regex = /^\s*"([^"]+)"\s*:\s*"([^"]+)"\s*(?=,|$)/;
  const match = inputString.match(regex);

  if (match) {
    const key = match[1];
    const value = match[2];
    return { key, value };
  } else {
    return null; // Return null if no match found
  }
}

module.exports = {
  updateJSONValues,
  extractKeyValueFromString,
};
