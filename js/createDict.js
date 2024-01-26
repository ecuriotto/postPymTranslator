const fs = require('fs');
const GoogleTranslateClient = require('./googleTranslateClient');
const {extractKeyValueFromString, printHelp} = require('./utils');

const REFERENCE = '_PLEASEVERIFYTHESENTENCE_REFERENCE';
const TRANSLATE = '_PLEASETRANSLATETHESENTENCE';
let inputFilePath = '../data/it.json';
let language = 'it';

async function loopLines(fileContent, outputStream, language, existingTranslationMap) {
  const translationMap = {...existingTranslationMap};

  const lines = fileContent.split('\n');
  for (const line of lines) {
    if (line.includes(REFERENCE) || line.includes(TRANSLATE)) {
      let {
        key: refKey,
        value: textToTranslate,
        exitFlagError: exitFlagError,
      } = extractKeyValueFromString(line);

      // Check if the translation for this key already exists in the output file
      if (!translationMap.hasOwnProperty(textToTranslate)) {
        // Call GoogleTranslateClient only if the textToTranslate key is not present
        const translatedTextArr = await GoogleTranslateClient.translateText(
          textToTranslate,
          language
        );
        translationMap[textToTranslate] = translatedTextArr[0];
      }
    }
  }

  const jsonOutput = JSON.stringify(translationMap, null, 2);
  outputStream.write(jsonOutput, 'utf8');
  outputStream.end();
}

async function createDict(language, inputFilePath) {
  const outputFilePath = `../data/dict-${language}.json`;

  if (fs.existsSync(outputFilePath)) {
    console.log(`Using existing dictionary file: ${outputFilePath}`);
    try {
      const existingContent = fs.readFileSync(outputFilePath, 'utf8');
      let existingTranslationMap;

      if (existingContent.trim() === '') {
        console.log(`Existing dictionary file is empty.`);
        existingTranslationMap = {};
      } else {
        existingTranslationMap = JSON.parse(existingContent);
        console.log(`Existing translations:`, existingTranslationMap);
      }

      const outputStream = fs.createWriteStream(outputFilePath, {encoding: 'utf8'});

      if (!fs.existsSync(inputFilePath)) {
        console.error(`Input file not found: ${inputFilePath}`);
        return;
      }

      try {
        const fileContent = fs.readFileSync(inputFilePath, 'utf8');
        await loopLines(fileContent, outputStream, language, existingTranslationMap);
        console.log(`Dictionary ${language} updated in ${outputFilePath}`);
      } catch (error) {
        console.error('Error reading the file:', error);
      }
    } catch (error) {
      console.error('Error reading existing file:', error);
    }
    return;
  }

  const outputStream = fs.createWriteStream(outputFilePath, {encoding: 'utf8'});

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Input file not found: ${inputFilePath}`);
    return;
  }

  try {
    const fileContent = fs.readFileSync(inputFilePath, 'utf8');
    await loopLines(fileContent, outputStream, language, {});
    console.log(`Dictionary ${language} created in ${outputFilePath}`);
  } catch (error) {
    console.error('Error reading the file:', error);
  }
}

// Handle command-line arguments
const args = process.argv.slice(2);
if (args.length === 1) {
  const param = args[0];
  if (param.includes('-h')) {
    printHelp('createDict');
    process.exit(1);
  } else if (param.length === 2) {
    language = param;
    inputFilePath = `../data/${language}.json`;
  } else {
    console.error('Invalid parameter. Language should be two characters.');
    printHelp('createDict');
    process.exit(1);
  }
} else if (args.length === 2) {
  const param = args[0];
  if (param.length === 2) {
    language = args[0];
    inputFilePath = args[1];
  } else {
    console.error('Invalid parameter. Language should be two characters.');
    printHelp('createDict');
    process.exit(1);
  }
} else if (args.length > 2) {
  console.error('Invalid number of parameters.');
  printHelp('createDict');
  process.exit(1);
}

createDict(language, inputFilePath);
