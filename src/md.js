#!/usr/bin/env node
'use strict';

/**
 * The MD generator
 * @class
 */
module.exports = class MDGenerator {
    static #textMDParser;
    static #linkMDParser;
    static #hintMDParser;

    constructor() {
        this.#linkMDParser = this.#defaultLinkParser;
        this.#hintMDParser = this.#defaultHintParser;
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
     * @param {function(type: string, folder: string, data: object): string} parser
     * @returns {void}
     */
    static setLinkMDParser = (parser) => {
        this.#linkMDParser = parser ? parser : this.#defaultLinkParser;
    };

    /**
     * Sets the hint md parser
     * @param {function(object): string} parser
     * @returns {void}
     */
    static setHintMDParser = (parser) => {
        this.#hintMDParser = parser ? parser : this.#defaultHintParser;
    };

    /**
     * Generates the md with the given template
     * @param {object} linkMap - a map containing all the links
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static generate = (linkMap, template, data) => {
        if (!template || template.trim() === '') throw new Error('[MDGenerator] Invalid md template');
        if (!data) throw new Error('[MDGenerator] Invalid data');

        if (this.#textMDParser) {
            const result = this.#textMDParser(linkMap, template, data);

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
        template = this.#parseTitle(linkMap, template, data);
        template = this.#parseMethodName(template, data);
        template = this.#parseHint(template, data);
        template = this.#parseParameters(linkMap, template, data);
        template = this.#parseReturns(linkMap, template, data);
        template = this.#parseExamples(template, data);
        template = this.#parseFields(linkMap, template, data);
        template = this.#parseDeprecated(template, data);

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
        let description = '';

        if (data.commentBlock.description) {
            data.commentBlock.description.forEach((desc) => {
                description += `${desc}<br/>`;
            });

            description += `\n`;
        }

        return template.replace(/\$DESCRIPTION\$/g, description);
    };

    /**
     * Parses the scope
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseScope = (template, data) => {
        let env = '';
        if (data.commentBlock.env) env = data.commentBlock.env.toLowerCase();

        return template.replace(/\$SCOPE\$/g, env);
    };

    /**
     * Parses the title
     * @param {object} linkMap
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseTitle = (linkMap, template, data) => {
        let title = '';

        if (data.title) {
            const isDeprecated = data.commentBlock.deprecated.length !== 0;

            if (isDeprecated) {
                title = data.title.link ? `~~${this.#linkMDParser('$TITLE_NAME$', linkMap, data)}~~` : `~~${data.title.msg}~~`;
            } else {
                title = data.title.link ? this.#linkMDParser('$TITLE_NAME$', linkMap, data) : data.title.msg;
            }
        }

        return template.replace(/\$TITLE_NAME\$/g, title);
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
                hints += this.#hintMDParser(hint);
            });

            hints += '\n';
        }

        return template.replace(/\$HINTS\$/g, hints);
    };

    /**
     * Parses the method name
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseMethodName = (template, data) => {
        let method = '';

        if (data.method) {
            method = '\n```lua\n';
            method += `${data.method}\n`;
            method += '```\n\n';
        }

        return template.replace(/\$METHOD\$/g, method);
    };

    /**
     * Parses deprecated
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseDeprecated = (template, data) => {
        let depr = '';
        if (data.commentBlock.deprecated.length > 0) {
            depr += '\n';

            data.commentBlock.deprecated.forEach((msg) => {
                if (msg.trim() === '') return;
                depr += `> ⚠ Deprecated: ${msg}\n`;
            });
        }

        return template.replace(/\$DEPRECATED\$/g, depr);
    };

    /**
     * Parses the parameters
     * @param {object} linkMap
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseParameters = (linkMap, template, data) => {
        let params = '';
        if (data.commentBlock.params.length > 0) {
            params += `\n-----------------\n`;
            params += `## Parameters\n\n`;
            params += `| Type   | Name | Description | Optional |\n`;
            params += `| ------ | ---- | ----------- | -------: |\n`;

            data.commentBlock.params.forEach((param) => {
                const type = param.link ? this.#linkMDParser('$PARAMETERS$', linkMap, param) : param.type;
                params += `| ${type} | ${param.name} | ${param.description} | ${param.optional ? '✔' : ' '} |\n`;
            });
        }

        return template.replace(/\$PARAMETERS\$/g, params);
    };

    /**
     * Parses the returns
     * @param {object} linkMap
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseReturns = (linkMap, template, data) => {
        let returns = '';
        if (data.commentBlock.returns.length > 0) {
            returns += `\n-----------------\n`;
            returns += `## Returns\n\n`;
            returns += `| Type   | Description |\n`;
            returns += `| ------ | ----------: |\n`;

            data.commentBlock.returns.forEach((ret) => {
                const type = ret.link ? this.#linkMDParser('$RETURNS$', linkMap, ret) : ret.type;
                returns += `| ${type} | ${ret.description} |\n`;
            });
        }

        return template.replace(/\$RETURNS\$/g, returns);
    };

    /**
     * Parses the fields
     * @param {object} linkMap
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #parseFields = (linkMap, template, data) => {
        let fields = '';
        if (data.commentBlock.fields.length > 0) {
            fields += `\n-----------------\n`;
            fields += `## Fields\n\n`;
            fields += `| Type   | Name | Optional |\n`;
            fields += `| ------ | ---- | -------: |\n`;

            data.commentBlock.fields.forEach((field) => {
                const type = field.link ? this.#linkMDParser('$FIELDS$', linkMap, field) : field.type;
                fields += `| ${type} | ${field.name} | ${field.optional ? '✔' : ' '} |\n`;
            });
        }

        return template.replace(/\$FIELDS\$/g, fields);
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

        return template.replace(/\$EXAMPLE\$/g, example);
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
        /*if (type === '$TITLE_NAME$') {
            const link = linkMap[data.title.link];
            if (!link) throw new Error(`Unknown type: ${data.title.link}`);

            return `[${data.title.link}](${link}/README.md)${data.title.msg.replace(data.title.link, '')}`;
        } else if (type === '$PARAMETERS$' || type === '$RETURNS$' || type === '$FIELDS$') {
            const link = linkMap[data.link];
            if (!link) throw new Error(`Unknown type: ${data.link}`);

            return `[${data.link}](${link}/README.md)`;
        }*/

        throw new Error(`Unknown type: ${type}`);
    };

    /**
     * The default hint parser
     * @param {string} template - md template
     * @param {object} data - comment block data
     *
     * @returns {string}
     */
    static #defaultHintParser = (hint) => {
        if (hint.message.trim() === '') return;
        return `:::${hint.type}\n${hint.message}\n:::\n`;
    };
};
