const readlineSync = require('readline-sync');
const fs = require('fs');

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
  const regex = /^\s*"([^"]+)"\s*:\s*"((?:\\"|[^"])*)"\s*(?=,|$)/;
  const match = inputString.match(regex);

  if (match) {
    const key = match[1];
    const value = match[2];
    return { key, value, exitFlag: false };
  } else {
    return {
      key: '**ERROR write "exit" to save your work**',
      value: '**ERROR write "exit" to save your work**',
      exitFlag: true,
    };
  }
}

function promptUser(currentOccurrence, totalOccurrences, cleanKey, refValue, proposalValue) {
  const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    orange: '\x1b[38;5;208m', // Replace 'blue' with 'orange'
    reset: '\x1b[0m',
  };

  const occurrenceText = `Occurrence: ${currentOccurrence}/${totalOccurrences} - To exit and save just write "exit"`;
  const keyText = `Key: ${colors.green}${cleanKey}${colors.reset}`;
  const referenceText = `Reference: ${colors.yellow}${refValue}${colors.reset}`;
  const proposalText = proposalValue
    ? `Proposal: ${colors.orange}${proposalValue}${colors.reset}`
    : '';

  // Find the length of the longest string
  const maxLength = Math.max(
    occurrenceText.length,
    keyText.length,
    referenceText.length,
    proposalText.length
  );

  const separator = '+'.padEnd(maxLength, '-');

  const occurrenceLine = `| ${occurrenceText.padEnd(maxLength - 4)} |`;
  const keyLine = `| ${keyText.padEnd(maxLength + 7 - 1)}|`;
  const referenceLine = `| ${referenceText.padEnd(maxLength + 7 - 1)}|`;
  const proposalLine = proposalValue ? `| ${proposalText.padEnd(maxLength + 13 - 1)}|` : '';

  console.log(`\n`);
  console.log(separator);
  console.log(occurrenceLine);
  console.log(separator);
  console.log(keyLine);
  console.log(separator);
  console.log(referenceLine);
  console.log(separator);
  if (proposalValue) {
    console.log(proposalLine);
    console.log(separator);
  }
}

function printHelp() {
  console.log('Usage: node app.js [inputFile] [outputFile]');
  console.log('Example: node app.js it.json ');
  console.log(
    `
    The program will prompt for translations and create an updated JSON file.
    You can exit when you want just writing "exit" when prompted for a translation, your work will be saved.`
  );
}
function validateArgs() {
  if (process.argv.length > 4) {
    printHelp();
    process.exit(1);
  }
  if (
    process.argv.length > 1 &&
    typeof process.argv[2] === 'string' &&
    (process.argv[2] === '-h' || process.argv[2].includes('help'))
  ) {
    printHelp();
    process.exit(1);
  }
}

function getInputFilePath() {
  return process.argv[2] || 'it.json'; // Default filename if not provided
}

function getOutputFilePath() {
  return process.argv[3] || 'updated-' + (process.argv[2] || 'it.json'); // Default filename if not provided
}

function backupFile(filePath) {
  const timestamp = new Date().toISOString().replace(/[-:]/g, ''); // Generate a timestamp for the backup
  const backupFilePath = `${filePath}.backup.${timestamp}`;

  fs.copyFileSync(filePath, backupFilePath);
  console.log(`Backup created: ${backupFilePath}`);
}

module.exports = {
  updateJSONValues,
  extractKeyValueFromString,
  promptUser,
  printHelp,
  validateArgs,
  getInputFilePath,
  getOutputFilePath,
  backupFile,
};
