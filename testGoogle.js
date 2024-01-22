const GoogleTranslateClient = require('./googleTranslateClient');
const fs = require('fs');
async function elaborate() {
  async function promptUser(text) {
    const translatedTextArr = await GoogleTranslateClient.translateText(text, 'it');
    console.log(translatedTextArr[0]);
  }
  async function processLine(line) {
    const result1 = await promptUser(line);
    console.log('in processLine');
  }
  async function processData(data) {
    const lines = data.split('\n');
    await Promise.all(
      lines.map(async (line) => {
        await processLine(line);
      })
    );
    console.log('in processData');
    console.log(`*** Processing complete ***`);
  }

  const inputFilePath = 'it-google.txt';

  try {
    const fileContent = fs.readFileSync(inputFilePath, 'utf8');
    await processData(fileContent);
  } catch (error) {
    console.error('Error reading the file:', error);
  }
}
elaborate();
