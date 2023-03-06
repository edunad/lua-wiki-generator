#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const glob = require('fast-glob');
const { basename, dirname } = require('path');

const LuaParser = require('./parser.js');
const MDGenerator = require('./md.js');
const SummaryGenerator = require('./summary.js');

const defaultTemplate = `# $TITLE_NAME$

$DEPRECATED$$HINTS$$METHOD$$DESCRIPTION$$EXAMPLE$$PARAMETERS$$RETURNS$$FIELDS$
`;

/**
 * Extract class
 * @class
 */
module.exports = class WikiExtract {
    #libPath;
    #outputPath;
    #options;

    /**
     * @constructor
     * @param {string} libPath - the input folder with the lua lib
     * @param {string} outputPath - the output folder
     * @param {object} options - options
     * @param {string} options.glob - (default: **\/*.lua)
     * @param {boolean?} options.clean - if it should clean the output folder (default: true)
     * @param {boolean?} options.silent - hides output log (default: false)
     * @param {object?} options.templates - templates
     * @param {string?} options.templates.summary
     * @param {string?} options.templates.method
     * @param {string?} options.templates.class
     * @param {string?} options.templates.extension
     * @param {string?} options.templates.gvar
     * @param {function(type: string, linkMap: object, data: object): string?} options.mdLinkParser
     * @param {function(hint: object): string?} options.mdHintParser
     * @param {function(linkMap: object, template: string, data: object): [boolean, string]?} options.mdTextParser
     * @param {function(file: string): string?} options.mdFolderParser
     */
    constructor(libPath, outputPath, options) {
        if (!libPath) throw new Error('[WikiExtract] Missing lib path');
        if (!outputPath) throw new Error('[WikiExtract] Missing output path');

        if (!options) options = {};
        if (!options.templates) options.templates = {};

        if (!options.templates.method) options.templates.method = defaultTemplate;
        if (!options.templates.class) options.templates.class = defaultTemplate;
        if (!options.templates.extension) options.templates.extension = defaultTemplate;
        if (!options.templates.gvar) options.templates.gvar = defaultTemplate;

        if (!options.mdFolderParser) options.mdFolderParser = this.#defaultMdFolderParser;

        if (!options.glob) options.glob = '**/*.lua';

        // Setup method overrides
        MDGenerator.setTextMDParser(options.mdTextParser);
        MDGenerator.setLinkMDParser(options.mdLinkParser);
        MDGenerator.setHintMDParser(options.mdHintParser);
        SummaryGenerator.setLinkMDParser(options.mdLinkParser);
        // ---

        this.#libPath = libPath;
        this.#outputPath = outputPath;
        this.#options = options;
    }

    warn = (txt, ...args) => {
        if (this.#options.silent) return;
        console.warn(txt, ...args);
    };

    /**
     * Reads lua files comments and generates markdown files
     * @returns {Promise<void>}
     */
    extract = async () => {
        this.warn(`== Setup`);

        // Cleanup
        await this.#cleanOutput();

        // GENERATE WIKI
        this.warn(`== Generating wiki`);

        const summaryMap = await this.#generateWiki();
        if (!summaryMap || summaryMap.length <= 0) throw new Error(`[WikiExtract] Failed to generate wiki? Summary can't be generated`);

        // GENERATE SUMMARY.md
        if (this.#options.templates.summary) {
            this.warn(`== Generating summary`);
            const summary = await SummaryGenerator.generate(this.#outputPath, summaryMap, this.#options.templates.summary);

            fs.writeFileSync(`./SUMMARY.md`, summary, { encoding: 'utf-8' });
            this.warn(`Wrote summary file`);
        }

        // Done, no pre-cleanup steps
        console.warn(`== Success!`);
    };

    /**
     * Removes output folder and re-creates it
     * @returns {Promise<void>}
     */
    #cleanOutput = async () => {
        const cleanOutput = this.#options.clean || true;
        if (cleanOutput) await fs.remove(this.#outputPath);
        await fs.ensureDir(this.#outputPath);
    };

    /**
     * Default folder parser
     * @returns {Promise<void>}
     */
    #defaultMdFolderParser = (file) => {
        return basename(file).replace('.lua', '').toLowerCase();
    };

    /**
     * Generates the wiki files
     *
     * @returns {Promise<void>}
     */
    #generateWiki = async () => {
        const summaryMap = {};

        const luaFiles = await glob([`${this.#libPath}/${this.#options.glob}`], { followSymbolicLinks: true, dot: true, objectMode: true });
        if (!luaFiles) throw new Error('No lua files found');

        // Parse files
        let linkMap = {};
        const parsePromises = luaFiles.map((file) => {
            return new LuaParser(this.#libPath, file.path.replace(`${this.#libPath}/`, '')).parseLua().then((data) => {
                if (data.linkMap) linkMap = { ...linkMap, ...data.linkMap };
                return data;
            });
        });

        const parsedData = await Promise.all(parsePromises);

        // GENERATE MD FILES ----
        parsedData.forEach((data) => {
            if (!data.blocks || data.blocks.length <= 0) return;

            // Generate folder
            const folderTitle = this.#options.mdFolderParser(data.file);
            fs.ensureDirSync(`${this.#outputPath}/${folderTitle}`);
            // -----

            const hasSingleClass = data.blocks.filter((block) => block.type === 'CLASS').length === 1;

            // Generate files
            data.blocks.forEach((codeBlock) => {
                const blockType = codeBlock.type.toLowerCase();

                const template = this.#options.templates[blockType];
                if (!template) throw new Error(`[WikiExtract] Missing template for '${blockType}'`);

                let mdData = MDGenerator.generate(linkMap, this.#options.templates[codeBlock.type.toLowerCase()], codeBlock);
                if (mdData.trim() === '') return this.warn(`Failed to generate md for type '${blockType}'`);

                let fileName = codeBlock.title.msg.split(':');
                if (!fileName || fileName.length <= 1) fileName = codeBlock.title.msg;
                else fileName = fileName[1];

                let output = `${this.#outputPath}/${folderTitle}/${fileName}.md`;
                if (blockType === 'class' && hasSingleClass) output = `${this.#outputPath}/${folderTitle}/README.md`;

                summaryMap[output] = {
                    title: codeBlock.title,
                    type: codeBlock.type,
                };

                fs.writeFileSync(output, mdData, { encoding: 'utf-8' });
                this.warn(`Wrote wiki file: '${output}' | Using template type '${blockType}'`);
            });
        });

        return summaryMap;
    };
};
