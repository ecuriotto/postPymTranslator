const Translate = require('@google-cloud/translate').v2;

const path = require('path');
// Creates a client
class GoogleTranslateClient {
  constructor() {
    this.translate = new Translate.Translate({
      keyFilename: path.join(__dirname, '../serviceAccount/service-account.json'),
    });
  }
  async translateText(text, target) {
    // Translates the text into the target language. "text" can be a string for
    // translating a single piece of text, or an array of strings for translating
    // multiple texts.
    let [translations] = await this.translate.translate(text, target);
    translations = Array.isArray(translations) ? translations : [translations];
    return translations;
  }
}

module.exports = new GoogleTranslateClient();
