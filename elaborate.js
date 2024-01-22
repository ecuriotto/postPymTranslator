const fs = require('fs');
const readlineSync = require('readline-sync');

const {
  extractKeyValueFromString,
  promptUser,
  validateArgs,
  getInputFilePath,
  getOutputFilePath,
  backupFile,
} = require('./utils');

async function elaborate() {
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

  // Check if the output file already exists
  if (fs.existsSync(outputFilePath)) {
    backupFile(outputFilePath);
  }

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
  let proposalValue;

  async function processLine(line, proposalValue, outputStream) {
    currentOccurrence++;
    let {
      key: refKey,
      value: refValue,
      exitFlagError: exitFlagError,
    } = extractKeyValueFromString(line);
    const cleanKey = refKey.replace(REFERENCE, '').replace(TRANSLATE, '');
    exitFlag = exitFlagError; //If there's an error in the key/val extraction it's reported
    const useless = await promptUser(
      currentOccurrence,
      totalOccurrences,
      cleanKey,
      refValue,
      proposalValue
    );
    let newValue;
    if (proposalValue) {
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
      userTranslation = proposalValue;
    }
    let outputLine = line.replace(REFERENCE, '').replace(TRANSLATE, '');
    outputLine = outputLine.replace(refValue, userTranslation);
    outputStream.write(`${outputLine}\n`);
    return;
  }

  inputStream.on('data', async (chunk) => {
    await processData(chunk, outputStream);
  });

  async function processData(chunk, outputStream) {
    const lines = chunk.split('\n');
    for (const line of lines) {
      //console.log(line);
      if (line.includes(VERIFY) && !line.includes(REFERENCE) && !exitFlag) {
        const keyValues = extractKeyValueFromString(line);
        proposalValue = keyValues.value;
        if (proposalValue && proposalValue.length > 0) {
          proposalValue = proposalValue.substring(0, 131);
        }
        exitFlag = keyValues.exitFlag;
        verifySentenceFound = true;
      } else if (line.includes(REFERENCE) && !exitFlag) {
        if (!verifySentenceFound) {
          console.error(
            `The line ${line} doesn't have a related ${VERIFY}. Correct the file and try again`
          );
          exitFlag = true;
        } else {
          await processLine(line, proposalValue, outputStream);
          proposalValue = '';
          verifySentenceFound = false;
        }
      } else if (line.includes(TRANSLATE) && !exitFlag) {
        await processLine(line, '', outputStream);
      } else {
        outputStream.write(`${line}\n`);
      }
    }
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

// Call the function with the path to your JSON file
elaborate();
