const fs = require('fs');
const readlineSync = require('readline-sync');

const { extractKeyValueFromString } = require('./utils');

function elaborate(filePath) {
  const inputFilePath = filePath;
  const outputFilePath = 'updated_it.json';

  const inputStream = fs.createReadStream(inputFilePath, { encoding: 'utf8' });
  const outputStream = fs.createWriteStream(outputFilePath, { encoding: 'utf8' });

  let verifySentenceFound = false;
  let proposalValue;

  inputStream.on('data', (chunk) => {
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.includes('PLEASEVERIFYTHESENTENCE')) {
        if (!verifySentenceFound) {
          const keyValues = extractKeyValueFromString(line);
          proposalValue = keyValues.value;
          verifySentenceFound = true;
        } else {
          const { key: refKey, value: refValue } = extractKeyValueFromString(line);
          const cleanKey = refKey.replace('_PLEASEVERIFYTHESENTENCE_REFERENCE', '');
          console.log(`Key: ${cleanKey}`);
          console.log(`Reference: ${refValue}`);
          console.log(`Proposal: ${proposalValue}`);
          const newValue = readlineSync.question(
            `Press "Enter" to keep the current value or enter a new value for ${cleanKey}: `
          );
          let userTranslation = '';
          if (newValue.trim()) {
            userTranslation = newValue.trim();
          } else {
            userTranslation = proposalValue;
          }
          let outputLine = line.replace('_PLEASEVERIFYTHESENTENCE_REFERENCE', '');
          outputLine = outputLine.replace(refValue, userTranslation);
          outputStream.write(`${outputLine}\n`);

          proposalValue = '';
          verifySentenceFound = false;
        }
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
