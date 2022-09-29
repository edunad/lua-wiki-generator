#!/usr/bin/env node
'use strict';

/**
 * The MD generator
 * @class
 */
module.exports = class MDGenerator {
    static #textMDParser;
    static #linkMDParser;

    constructor() {
        this.#linkMDParser = this.#defaultLinkParser;
    }

    /**
     * Sets the custom text md parser
     * @param {function(string, string, object): [boolean, string]} parser
     * @returns {void}
     */
    static setTextMDParser = (parser) => {
        this.#textMDParser = parser;
    };

    /**
     * Sets the link md parser
     * @param {function(string, string): string} parser
     * @returns {void}
     */
    static setLinkMDParser = (parser) => {
        this.#linkMDParser = parser ? parser : this.#defaultLinkParser;
    };

    /**
     * Generates the md with the given template
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static generate = (outputPath, template, data) => {
        if (!template || template.trim() === '') throw new Error('[MDGenerator] Invalid md template');
        if (!data) throw new Error('[MDGenerator] Invalid data');

        if (this.#textMDParser) {
            const result = this.#textMDParser(outputPath, template, data);

            if (result && result.length == 2) {
                if (!result[0]) return result[1];
                else template = result[1];
            } else {
                throw new Error(
                    '[MDGenerator] Invalid custom parser, it must return [boolean -> true to continue parsing using default, string -> the parse result]',
                );
            }
        }

        template = this.#parseDescription(template, data);
        template = this.#parseScope(template, data);
        template = this.#parseTitle(outputPath, template, data);
        template = this.#parseMethodName(template, data);
        template = this.#parseHint(template, data);
        template = this.#parseParameters(outputPath, template, data);
        template = this.#parseReturns(outputPath, template, data);
        template = this.#parseExamples(template, data);
        template = this.#parseFields(outputPath, template, data);

        return template;
    };

    /**
     * Parses the description
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseDescription = (template, data) => {
        if (!data.commentBlock.description) return template;
        return template.replace('$DESCRIPTION$', `${data.commentBlock.description}\n`);
    };

    /**
     * Parses the scope
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseScope = (template, data) => {
        if (!data.commentBlock.env) return template;
        return template.replace(/\$SCOPE\$/g, data.commentBlock.env.toLowerCase());
    };

    /**
     * Parses the title
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseTitle = (outputPath, template, data) => {
        if (!data.title) return template;
        return template.replace('$TITLE_NAME$', data.title.link ? this.#linkMDParser('$TITLE_NAME$', outputPath, data) : data.title.msg);
    };

    /**
     * Parses the method name
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseMethodName = (template, data) => {
        if (!data.method) return template;
        let method = '\n```lua\n';
        method += `${data.method}\n`;
        method += '```\n\n';

        return template.replace('$METHOD$', method);
    };

    /**
     * Parses the hints
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseHint = (template, data) => {
        let hints = '';
        if (data.commentBlock.hints.length > 0) {
            hints += '\n';

            data.commentBlock.hints.forEach((hint) => {
                if (hint.message.trim() === '') return;
                hints += `{% hint style="${hint.type}" %} ${hint.message} {% endhint %}\n`;
            });

            hints += '\n';
        }

        return template.replace('$HINTS$', hints);
    };

    /**
     * Parses the parameters
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseParameters = (outputPath, template, data) => {
        let params = '';
        if (data.commentBlock.params.length > 0) {
            params += `\n------\n`;
            params += `## Parameters\n\n`;
            params += `| Type   | Name | Description | Optional |\n`;
            params += `| ------ | ---- | ----------- | -------: |\n`;

            data.commentBlock.params.forEach((param) => {
                const type = param.link ? this.#linkMDParser('$PARAMETERS$', outputPath, param) : param.type;
                params += `| ${type} | ${param.name} | ${param.description} | ${param.optional ? '✔' : ''} |\n`;
            });

            params += '\n';
        }

        return template.replace('$PARAMETERS$', params);
    };

    /**
     * Parses the returns
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseReturns = (outputPath, template, data) => {
        let returns = '';
        if (data.commentBlock.returns.length > 0) {
            returns += `\n------\n`;
            returns += `## Returns\n\n`;
            returns += `| Type   | Description |\n`;
            returns += `| ------ | ----------: |\n`;

            data.commentBlock.returns.forEach((ret) => {
                const type = ret.link ? this.#linkMDParser('$RETURNS$', outputPath, ret) : ret.type;
                returns += `| ${type} | ${ret.description} |\n`;
            });

            returns += '\n';
        }

        return template.replace('$RETURNS$', returns);
    };

    /**
     * Parses the fields
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseFields = (outputPath, template, data) => {
        let fields = '';
        if (data.commentBlock.fields.length > 0) {
            fields += `\n------\n`;
            fields += `## Fields\n\n`;
            fields += `| Type   | Name |\n`;
            fields += `| ------ | ---: |\n`;

            data.commentBlock.fields.forEach((field) => {
                const type = field.link ? this.#linkMDParser('$FIELDS$', outputPath, field) : field.type;
                fields += `| ${type} | ${field.name} |\n`;
            });

            fields += `\n`;
        }

        return template.replace('$FIELDS$', fields);
    };

    /**
     * Parses the examples
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseExamples = (template, data) => {
        let example = '';
        if (data.commentBlock.examples.length > 0) {
            example += '```lua\n';
            data.commentBlock.examples.forEach((ex) => {
                example += `${ex}\n`;
            });
            example += '```\n\n';
        }

        return template.replace('$EXAMPLE$', example);
    };

    /**
     * The default link parser
     * @param {string} type
     * @param {string} outputPath
     * @param {object} data
     *
     * @returns {string}
     */
    static #defaultLinkParser = (type, outputPath, data) => {
        if (type === '$TITLE_NAME$') {
            return `[${data.title.link}](${outputPath}/${data.title.link.toLowerCase()}.md)${data.title.msg.replace(data.title.link, '')}`;
        } else if (type === '$PARAMETERS$' || type === '$RETURNS$' || type === '$FIELDS$') {
            return `[${data.link}](${outputPath}/${data.link.toLowerCase()}.md)`;
        }

        throw new Error(`Unknown type: ${type}`);
    };
};
