const fs = require('fs');
const utils = require('./utils');

const { updateJSONValues } = utils;

const inputFilePath = 'it.json';
const outputFilePath = 'updated_it.json';

function elaborate() {
  try {
    const jsonData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));

    updateJSONValues(jsonData);

    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`Values updated and saved to ${outputFilePath}.`);
  } catch (err) {
    console.error('Error reading or parsing the JSON file:', err);
  }
}

elaborate();
