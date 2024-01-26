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
            updatedPairs.push({key: cleanKey, value: newValue.trim()});
          } else {
            updatedPairs.push({key: cleanKey, value: tempValue});
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
      updateJSONValues(obj[key]);
    }
  }

  updatedPairs.forEach(({key, value}) => {
    obj[key] = value;
  });
}

function extractKeyValueFromString(inputString) {
  const regex = /^\s*"([^"]+)"\s*:\s*"((?:\\"|[^"])*)"\s*(?=,|$)/;
  const match = inputString.match(regex);

  if (match) {
    const key = match[1];
    const value = match[2];
    return {key, value, exitFlag: false};
  } else {
    return {
      key: '**ERROR write "exit" to save your work**',
      value: '**ERROR write "exit" to save your work**',
      exitFlag: true,
    };
  }
}

function printHelp(functionName) {
  console.log(`Usage: node ${functionName} [language] [inputFile] [outputFile]`);
  console.log(`Example: node ${functionName} it ../data/it.json`);
  if (functionName === 'translate')
    console.log(
      `
    The program will prompt for translations and create an updated JSON file.
    You can exit when you want just writing "exit" when prompted for a translation, your work will be saved.
    It requires:\n
    \t args[0]: language (ex. it)\n
    \t args[1]: input file (ex. ../data/it.json)\n
    \t args[2]: output file (ex. ../data/it-updated.json)\n
    \t args[3]: input file (ex. ../data/dict-it.json)\n`
    );
  else if (functionName === 'createDict') {
    console.log(
      `
    The program will create a dictionary of translations from Google to use then in the translate function.\n
    It requires:\n
    \t args[0]: language (ex. it)\n
    \t args[1]: input file (ex. it.json)\n`
    );
  } else {
    console.log(
      `You need to run two programs:\n
      1 - createDict: generates a dictionary starting from a language and an input file, using google translate service\n
      2 - translate: will prompt the user to validate translations from the input file, using the dictionary previously created with google translate `
    );
  }
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
  printHelp,
  backupFile,
};
