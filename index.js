// Dunno, this is a bit hacky, but coulnd't get documentation visible :P

/**
 * @module WikiExtract
 * @param {string} libPath - the input folder with the lua lib (supports glob)
 * @param {string} outputPath - the output folder
 * @param {object} options - options
 * @param {boolean} options.clean - if it should clean the output folder
 * @param {object} options.templates - templates
 * @param {string} options.templates.method
 * @param {string} options.templates.class
 * @param {string} options.templates.extension
 * @param {string} options.templates.summary
 * @param {function(parseField: string, data: object)} options.mdLinkParser
 * @param {function(outputFolder: string, template: string, blockData: object): [boolean, string]} options.mdTextParser
 */
module.exports = require('./src/generator.js');
