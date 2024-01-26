const fs = require('fs');
const readlineSync = require('readline-sync');

const {extractKeyValueFromString, backupFile} = require('./utils');

let language = 'it';
let inputFilePath = '../data/it-sample.json';
let outputFilePath = '../data/it-updated.json';
let dictFilePath = '../data/dict-it.json';

async function translate() {
  const VERIFY = '_PLEASEVERIFYTHESENTENCE';
  const REFERENCE = '_PLEASEVERIFYTHESENTENCE_REFERENCE';
  const TRANSLATE = '_PLEASETRANSLATETHESENTENCE';
  const EXIT_KEYWORD = 'exit';
  let exitFlag = false;
  let totalVerifyOccurrences = 0;
  let totalTranslateOccurrences = 0;

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  // Check if the output file already exists
  if (fs.existsSync(outputFilePath)) {
    backupFile(outputFilePath);
  }
  if (!fs.existsSync(dictFilePath)) {
    console.error(`dict file not found: ${dictFilePath}. Run node createDict.js`);
    return;
  }
  const dictFileContent = fs.readFileSync(dictFilePath, 'utf8');
  const dictObject = JSON.parse(dictFileContent);

  const countFile = fs.readFileSync(inputFilePath, {encoding: 'utf8'});
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

  const inputStream = fs.createReadStream(inputFilePath, {encoding: 'utf8'});
  const outputStream = fs.createWriteStream(outputFilePath, {encoding: 'utf8'});

  let verifySentenceFound = false;

  async function processLine(line, outputStream) {
    currentOccurrence++;
    let {
      key: refKey,
      value: refValue,
      exitFlagError: exitFlagError,
    } = extractKeyValueFromString(line);
    const cleanKey = refKey.replace(REFERENCE, '').replace(TRANSLATE, '');
    exitFlag = exitFlagError; //If there's an error in the key/val extraction it's reported
    const proposalText = await promptUser(currentOccurrence, totalOccurrences, cleanKey, refValue);
    let newValue;
    if (proposalText) {
      //if TRANSLATED there's no proposal
      newValue = readlineSync.question(
        `Press "Enter" to accept the proposal or write a new value:`
      );
    } else {
      newValue = readlineSync.question(`Enter a translation for ${cleanKey}: `);
    }
    if (newValue.toLowerCase() === EXIT_KEYWORD || exitFlag) {
      console.log('Exiting at user request...');
      exitFlag = true;
      outputStream.write(`${line}\n`);
      return;
    }

    let userTranslation = '';
    if (newValue.trim()) {
      userTranslation = newValue.trim();
    } else {
      userTranslation = proposalText;
    }
    let outputLine = line.replace(REFERENCE, '').replace(TRANSLATE, '');
    outputLine = outputLine.replace(refValue, userTranslation);
    outputStream.write(`${outputLine}\n`);
    return;
  }

  async function processData(chunk, outputStream) {
    const lines = chunk.split('\n');
    for (const line of lines) {
      //console.log(line);
      if (line.includes(VERIFY) && !line.includes(REFERENCE) && !exitFlag) {
        const keyValues = extractKeyValueFromString(line);
        exitFlag = keyValues.exitFlag;
        verifySentenceFound = true;
      } else if (line.includes(REFERENCE) && !exitFlag) {
        if (!verifySentenceFound) {
          console.error(
            `The line ${line} doesn't have a related ${VERIFY}. Correct the file and try again`
          );
          exitFlag = true;
        } else {
          await processLine(line, outputStream);
          proposalValue = '';
          verifySentenceFound = false;
        }
      } else if (line.includes(TRANSLATE) && !exitFlag) {
        await processLine(line, outputStream);
      } else {
        outputStream.write(`${line}\n`);
      }
    }
  }
  async function promptUser(currentOccurrence, totalOccurrences, cleanKey, refValue) {
    const colors = {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      orange: '\x1b[38;5;208m', // Replace 'blue' with 'orange'
      reset: '\x1b[0m',
    };

    const occurrenceText = `Occurrence: ${currentOccurrence}/${totalOccurrences} - To exit and save just write "exit"`;
    const keyText = `Key: ${colors.green}${cleanKey}${colors.reset}`;
    const referenceText = `Reference: ${colors.yellow}${refValue}${colors.reset}`;
    let proposalText = '';
    let proposalTextFormatted = '';
    if (dictObject[refValue]) {
      proposalText = dictObject[refValue];
      proposalTextFormatted = `${colors.orange}${proposalText}${colors.reset}`;
    }

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
    const proposalLine = proposalText
      ? `| ${proposalTextFormatted.padEnd(maxLength + 13 - 1)}|`
      : '';

    console.log(`\n`);
    console.log(separator);
    console.log(occurrenceLine);
    console.log(separator);
    console.log(keyLine);
    console.log(separator);
    console.log(referenceLine);
    console.log(separator);
    if (proposalLine) {
      console.log(proposalLine);
      console.log(separator);
    }
    return proposalText;
  }

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

  try {
    const fileContent = fs.readFileSync(inputFilePath, 'utf8');
    await processData(fileContent, outputStream);
  } catch (error) {
    console.error('Error reading the file:', error);
  }
}

function parseInputParams() {
  const args = process.argv.slice(2);
  if (args.length > 4) {
    printHelp(functionName);
    process.exit(1);
  }
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    (args[0] === '-h' || args[0].includes('help'))
  ) {
    printHelp(functionName);
    process.exit(1);
  } else if (args.length > 0) {
    language = args[0];
    if (args.length > 1) {
      inputFilePath = args[1];
      if (args.length > 2) {
        outputFilePath = args[2];
        if (args.length == 4) {
          dictFilePath = args[3];
        }
      }
    }
  }
}
parseInputParams();
// Call the function with the path to your JSON file
translate(language, inputFilePath, outputFilePath, dictFilePath);
