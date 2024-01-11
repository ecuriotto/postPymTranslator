const fs = require('fs');
const readlineSync = require('readline-sync');

const {
  extractKeyValueFromString,
  promptUser,
  validateArgs,
  getInputFilePath,
  getOutputFilePath,
} = require('./utils');

function elaborate() {
  const VERIFY = '_PLEASEVERIFYTHESENTENCE';
  const REFERENCE = '_PLEASEVERIFYTHESENTENCE_REFERENCE';
  const TRANSLATE = '_PLEASETRANSLATETHESENTENCE';
  const EXIT_KEYWORD = 'exit';
  let exitFlag = false;
  let totalVerifyOccurrences = 0;
  let totalTranslateOccurrences = 0;

  validateArgs();
  const inputFilePath = getInputFilePath();
  const outputFilePath = getOutputFilePath();
  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  const countFile = fs.readFileSync(inputFilePath, { encoding: 'utf8' });
  const lines = countFile.split('\n');

  for (const line of lines) {
    if (line.includes(REFERENCE)) {
      totalVerifyOccurrences++;
    }
    if (line.includes(TRANSLATE)) {
      totalTranslateOccurrences++;
    }
  }

  let totalOccurrences = totalVerifyOccurrences + totalTranslateOccurrences;
  let currentOccurrence = 0;

  const inputStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
  const outputStream = fs.createWriteStream(outputFilePath, { encoding: 'utf8' });

  let verifySentenceFound = false;
  let proposalValue;

  function processLine(line, proposalValue, outputStream) {
    currentOccurrence++;
    const { key: refKey, value: refValue } = extractKeyValueFromString(line);
    const cleanKey = refKey.replace(REFERENCE, '').replace(TRANSLATE, '');
    promptUser(currentOccurrence, totalOccurrences, cleanKey, refValue, proposalValue);
    let newValue;
    if (proposalValue) {
      newValue = readlineSync.question(
        `Press "Enter" to accept the proposal or write a new value:`
      );
    } else {
      newValue = readlineSync.question(`Enter a translation for ${cleanKey}: `);
    }
    if (newValue.toLowerCase() === EXIT_KEYWORD) {
      console.log('Exiting at user request...');
      exitFlag = true;
      outputStream.write(`${line}\n`);
      return;
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
      if (line.includes(VERIFY) && !exitFlag) {
        if (!verifySentenceFound) {
          const keyValues = extractKeyValueFromString(line);
          proposalValue = keyValues.value;
          verifySentenceFound = true;
        } else {
          processLine(line, proposalValue, outputStream);
          proposalValue = '';
          verifySentenceFound = false;
        }
      } else if (line.includes(TRANSLATE) && !exitFlag) {
        processLine(line, '', outputStream);
      } else {
        outputStream.write(`${line}\n`);
      }
    }
  });

  inputStream.on('end', () => {
    outputStream.end();
    console.log(`*** Processing complete, check the ${outputFilePath} file  ***`);
  });

  inputStream.on('error', (err) => {
    console.error('Error reading the file:', err);
  });

  outputStream.on('error', (err) => {
    console.error('Error writing to the file:', err);
  });
}

// Call the function with the path to your JSON file
elaborate();
