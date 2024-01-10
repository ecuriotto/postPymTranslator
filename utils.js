const readlineSync = require('readline-sync');

function updateJSONValues(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      console.log(`Key: ${key}, Current Value: ${obj[key]}`);
      const answer = readlineSync.question('Do you want to update this value? (y/n): ');

      if (answer.trim().toLowerCase() === 'y') {
        const newValue = readlineSync.question(`Enter new value for ${key}: `);
        obj[key] = newValue.trim();
      }
    } else if (typeof obj[key] === 'object') {
      updateJSONValues(obj[key]); // Recursively call for nested objects
    }
  }
}

module.exports = {
  updateJSONValues,
};
