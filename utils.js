const readlineSync = require('readline-sync');

function updateJSONValues(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      console.log(`\x1b[33mKey: ${key}, Current Value: ${obj[key]}\x1b[0m`);
      const newValue = readlineSync.question(
        `\x1b[32mPress "Enter" to keep the current value or enter a new value for ${key}:\n\x1b[0m`
      );
      obj[key] = newValue.trim() || obj[key]; // Use the new value if entered, else keep the current value
    } else if (typeof obj[key] === 'object') {
      updateJSONValues(obj[key]); // Recursively call for nested objects
    }
  }
}

module.exports = {
  updateJSONValues,
};
