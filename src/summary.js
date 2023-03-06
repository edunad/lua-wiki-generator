#!/usr/bin/env node
'use strict';

const fs = require('fs');
const glob = require('fast-glob');
const { basename } = require('path');

/**
 * The MD summary generator
 * @class
 */
module.exports = class SummaryGenerator {
    static #linkMDParser;

    constructor() {
        this.#linkMDParser = this.#defaultLinkParser;
    }
    /**
     * Sets the link md parser
     * @param {function(string, object, string): string} parser
     * @returns {void}
     */
    static setLinkMDParser = (parser) => {
        this.#linkMDParser = parser ? parser : this.#defaultLinkParser;
    };

    /**
     * Generates the md with the given template
     * @param {string} outputPath - the output path
     * @param {summaryMap} summaryMap - the summary map
     * @param {string} template - the summary template
     *
     * @returns {string}
     */
    static generate = async (outputPath, summaryMap, template) => {
        const dirs = await fs
            .readdirSync(`${outputPath}`, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        let data = '';
        for (const dir of dirs) {
            data += `  * ${this.#linkMDParser('SUMMARY', {}, { dir, fileName: null, name: null })}\n`;

            const mdFiles = await glob([`${outputPath}/${dir}/*.md`], { followSymbolicLinks: true, dot: true });
            mdFiles.forEach((file) => {
                const summary = summaryMap[file];
                if (!summary) return console.warn(`[SummaryGenerator] Failed to generate summary for file '${file}'`);

                const name = summary.title.msg;
                const fileName = basename(file);
                if (fileName === 'README.md') return;

                data += `    * ${this.#linkMDParser('SUMMARY', {}, { name, dir, fileName })}\n`;
            });
        }

        return template.replace('$FILES$', data);
    };

    /**
     * The default link parser
     * @param {string} type
     * @param {object} linkMap
     * @param {object} data
     *
     * @returns {string}
     */
    static #defaultLinkParser = (type, linkMap, data) => {
        if (type === 'SUMMARY') {
            if (data.fileName) {
                // Not root
                return `[${data.name}](${data.dir}/${data.fileName})`;
            } else {
                // ROOT
                return `[${data.dir}](${data.dir}/README.md)`;
            }
        }

        throw new Error(`Unknown type: ${type}`);
    };
};
