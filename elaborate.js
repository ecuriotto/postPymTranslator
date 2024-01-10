const fs = require('fs');
const readlineSync = require('readline-sync');

const { extractKeyValueFromString, promptUser } = require('./utils');

function elaborate(filePath) {
  const inputFilePath = filePath;
  const outputFilePath = 'updated_it.json';
  const VERIFY = '_PLEASEVERIFYTHESENTENCE';
  const REFERENCE = '_PLEASEVERIFYTHESENTENCE_REFERENCE';
  const TRANSLATE = '_PLEASETRANSLATETHESENTENCE';

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  const inputStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
  const outputStream = fs.createWriteStream(outputFilePath, { encoding: 'utf8' });

  let verifySentenceFound = false;
  let proposalValue;

  function processLine(line, proposalValue, outputStream) {
    const { key: refKey, value: refValue } = extractKeyValueFromString(line);
    const cleanKey = refKey.replace(REFERENCE, '').replace(TRANSLATE, '');
    promptUser(cleanKey, refValue, proposalValue);
    let newValue;
    if (proposalValue) {
      newValue = readlineSync.question(
        `Press "Enter" to keep the current value or enter a new value for ${cleanKey}: `
      );
    } else {
      newValue = readlineSync.question(`Enter a translation for ${cleanKey}: `);
    }

    let userTranslation = '';
    if (newValue.trim()) {
      userTranslation = newValue.trim();
    } else {
      userTranslation = proposalValue;
    }
    let outputLine = line.replace(REFERENCE, '').replace(TRANSLATE, '');
    outputLine = outputLine.replace(refValue, userTranslation);
    outputStream.write(`${outputLine}\n`);
  }

  inputStream.on('data', (chunk) => {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.includes(VERIFY)) {
        if (!verifySentenceFound) {
          const keyValues = extractKeyValueFromString(line);
          proposalValue = keyValues.value;
          verifySentenceFound = true;
        } else {
          processLine(line, proposalValue, outputStream);
          proposalValue = '';
          verifySentenceFound = false;
        }
      } else if (line.includes(TRANSLATE)) {
        processLine(line, '', outputStream);
      } else {
        outputStream.write(`${line}\n`);
      }
    }
  });

  inputStream.on('end', () => {
    outputStream.end();
    console.log('Processing complete.');
  });

  inputStream.on('error', (err) => {
    console.error('Error reading the file:', err);
  });

  outputStream.on('error', (err) => {
    console.error('Error writing to the file:', err);
  });
}

// Call the function with the path to your JSON file
elaborate('it.json');
