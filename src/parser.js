#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const readline = require('readline');
const events = require('events');

/**
 * Lua comment parser
 * @class
 */
module.exports = class LuaParser {
    #basePath;
    #filePath;

    #linkMap;

    #currentCommentBlock;
    #currentMode;
    #parsedBlocks;
    #foundBlock;

    /**
     * @constructor
     * @param {string} filePath - the input lua file
     */
    constructor(basePath, filePath) {
        this.#basePath = basePath;
        this.#filePath = filePath;

        this.#linkMap = {};
    }

    /**
     * Parse the lua file
     * @returns {Promise<object>}
     */
    parseLua = async () => {
        const stream = fs.createReadStream(`${this.#basePath}/${this.#filePath}`, 'utf8');
        const rl = readline.createInterface({
            input: stream,
            crlfDelay: Infinity,
        });

        // Reset
        this.#reset();

        // Parse
        rl.on('line', (line) => this.#parseLine(line));
        await events.once(rl, 'close');

        // Finish
        if (this.#parsedBlocks.length <= 0) console.warn(`File ${this.#basePath}/${this.#filePath} has no lua documentation?`);

        return Promise.resolve({
            blocks: this.#parsedBlocks,

            linkMap: this.#linkMap,
            file: this.#filePath,
        });
    };

    /**
     * Resets the parsed blocks
     * @returns {void}
     */
    #reset = () => {
        this.#linkMap = {};

        this.#currentCommentBlock = this.#getDefaultBlock();
        this.#currentMode = 'NONE';
        this.#parsedBlocks = [];
    };

    /**
     * Returns true if the line is a lua extension, aka math.something = function(
     * @param {string} line - the reading line
     * @returns {boolean}
     */
    #isExtensionMethod = (line) => {
        return line.replace(/ /g, '').indexOf('=function(') !== -1;
    };

    /**
     * Returns true if the line is a lua class
     * @param {string} line - the attribute line
     * @returns {boolean}
     */
    #isClass = (line) => {
        return line.replace(/ /g, '').indexOf('={') !== -1;
    };

    /**
     * Returns true if the line is a lua global const (_G)
     * @param {string} line - the attribute line
     * @returns {boolean}
     */
    #isGVar = (line) => {
        return line.startsWith('_G.');
    };

    /**
     * Returns true if the line is a lua method
     * @param {string} line - the reading line
     * @returns {boolean}
     */
    #isMethod = (line) => {
        return line.startsWith('function ');
    };

    /**
     * Returns true if the given type is a primitive
     * @param {string} type - the type to check
     * @returns {boolean}
     */
    #isLuaPrimitive = (type) => {
        return ['nil', 'boolean', 'number', 'string', 'function', 'userdata', 'thread', 'table', 'any', 'void'].includes(
            this.#cleanType(type).toLowerCase(),
        );
    };

    /**
     * Returns the type without []
     * @param {string} type - the type to check
     * @returns {boolean}
     */
    #cleanType = (type) => {
        return type.trim().split('[')[0];
    };

    /**
     * Extracts the method using regex
     * @param {string} line - the reading line
     * @returns {RegExpMathArray}
     */
    #extractMethod = (line) => {
        return [...line.matchAll(/function ((.*):.*)\((.*)\)/g)][0];
    };

    /**
     * Extracts the extension using regex
     * @param {string} line - the reading line
     * @returns {RegExpMathArray}
     */
    #extractExtension = (line) => {
        return [...line.matchAll(/(.*)=.*function.*(\(.*\))/g)][0];
    };

    /**
     * Extracts the class using regex
     * @param {string} line - the reading line
     * @returns {RegExpMathArray}
     */
    #extractClass = (line) => {
        return [...line.matchAll(/(.*)=.*{/g)][0];
    };

    /**
     * Extracts the _G. var using regex
     * @param {string} line - the reading line
     * @returns {RegExpMathArray}
     */
    #extractGVar = (line) => {
        return [...line.matchAll(/_G.(.*)=.*/g)][0];
    };

    /**
     * Parse and extract parameters
     * @param {string} line - the reading line
     * @returns {object[]}
     */
    #parseParam = (line) => {
        //---@param callback function bla
        const paramRegex = [...line.matchAll(/---@param ([^ \r\n]*) ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!paramRegex || paramRegex.length !== 1) return null;

        const rawParams = paramRegex[0];
        if (!rawParams || rawParams.length < 3) return null;

        const isOptional = rawParams[1].indexOf('?') !== -1;
        const params = rawParams[2].split('|');

        const ret = [];
        params.forEach((param) => {
            ret.push({
                name: rawParams[1].replace('?', ''),
                type: param,
                description: rawParams[3] ?? 'No description',
                optional: isOptional,

                link: this.#isLuaPrimitive(param) ? null : this.#cleanType(param),
            });
        });

        return ret;
    };

    /**
     * Parse and extract fields
     * @param {string} line - the reading line
     * @returns {object}
     */
    #parseField = (line) => {
        //---@field callback function bla
        const fieldRegex = [...line.matchAll(/---@field ([^ \r\n]*)? ?([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!fieldRegex || fieldRegex.length !== 1) return null;

        const fields = fieldRegex[0];
        if (!fields || fields.length < 1) return null;

        const isOptional = fields[1].indexOf('?') !== -1;
        const typeField = fields[2] ?? '';

        return {
            name: fields[1].replace('?', ''),
            type: typeField,
            optional: isOptional,

            link: typeField === '' ? null : this.#isLuaPrimitive(typeField) ? null : this.#cleanType(typeField),
        };
    };

    /**
     * Parse and extract return
     * @param {string} line - the reading line
     * @returns {object}
     */
    #parseReturn = (line) => {
        //---@return boolean asdasdas
        const returnRegex = [...line.matchAll(/---@return ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!returnRegex || returnRegex.length !== 1) return null;

        const returns = returnRegex[0];
        if (!returns || returns.length <= 0) return null;

        return {
            type: returns[1],
            description: returns[2] ?? 'No description',

            link: this.#isLuaPrimitive(returns[1]) ? null : this.#cleanType(returns[1]),
        };
    };

    /**
     * Parse and extract hints
     * @param {string} line - the reading line
     * @returns {object}
     */
    #parseHints = (line) => {
        //---@hint @warning "PAGE / FUNCTIONALITY STILL IN CONSTRUCTION"
        const hintRegex = [...line.matchAll(/---@hint @([^ \r\n]*) "?([^"\r\n]*)?"/g)];
        if (!hintRegex || hintRegex.length !== 1) return null;

        const hints = hintRegex[0];
        if (!hints || hints.length !== 3) return null;

        return {
            type: hints[1],
            message: hints[2],
        };
    };

    /**
     * Parse and extract deprecated
     * @param {string} line - the reading line
     * @returns {object}
     */
    #parseDeprecated = (line) => {
        //---@deprecated "PAGE / FUNCTIONALITY STILL IN CONSTRUCTION"
        const deprecatedRegex = [...line.matchAll(/---@deprecated "?([^"\r\n]*)?"/g)];
        if (!deprecatedRegex || deprecatedRegex.length !== 1) return null;

        const deprecated = deprecatedRegex[0];
        if (!deprecated) return null;

        return deprecated[1];
    };

    /**
     * Parse and extract the enviroment
     * @param {string} line - the reading line
     * @returns {string}
     */
    #parseEnv = (line) => {
        //---@env shared
        const envRegex = [...line.matchAll(/---@env ([^ \r\n]*)/g)];
        if (!envRegex || envRegex.length !== 1) return 'UNKNOWN';

        const envs = envRegex[0];
        if (!envs || envs.length !== 2) return 'UNKNOWN';

        return envs[1];
    };
    /// --------

    /**
     * Builds the return for the title. (boolean, string, etc..)
     * @param {object} returns - the return object
     * @returns {string}
     */
    #buildReturn = (returns) => {
        if (!returns || returns.length <= 0) return 'void';
        return returns.map((ret) => ret.type).join(', ');
    };

    /**
     * The default comment object
     * @returns {object}
     */
    #getDefaultBlock = () => {
        return {
            env: 'UNKNOWN',

            params: [],
            hints: [],
            returns: [],
            fields: [],
            description: [],
            examples: [],
            deprecated: [],
            unknown: [],
        };
    };

    #addParsedBlock = (data) => {
        this.#parsedBlocks.push(data);
        this.#linkMap[data.title.msg] = this.#filePath;
    };

    /**
     * Parses the given line
     * @param {string} line - the current line to parse
     * @returns {void}
     */
    #parseLine = (line) => {
        const trimmedLine = line.replace(/\s/g, '');
        if (trimmedLine === '') return; // Ignore

        // Reached a method?
        if (!trimmedLine.startsWith('---')) {
            if (this.#foundBlock) {
                if (this.#isMethod(line)) {
                    // ex: function console:execute(args) end
                    const methodData = this.#extractMethod(line);
                    if (methodData && methodData.length >= 3) {
                        this.#addParsedBlock({
                            type: 'METHOD',
                            title: {
                                msg: methodData[1].trim(),
                                link: this.#isLuaPrimitive(methodData[2]) ? null : this.#cleanType(methodData[2]),
                            },
                            method: methodData[0].replace('function', this.#buildReturn(this.#currentCommentBlock.returns)),
                            commentBlock: this.#currentCommentBlock,
                        });
                    }
                } else if (this.#isExtensionMethod(trimmedLine)) {
                    const methodData = this.#extractExtension(line);
                    if (methodData && methodData.length >= 3) {
                        this.#addParsedBlock({
                            type: 'EXTENSION',
                            title: {
                                msg: methodData[1].trim(),
                                link: null,
                            },
                            method: `${this.#buildReturn(this.#currentCommentBlock.returns)} ${methodData[1].trim()}${methodData[2]}`,
                            commentBlock: this.#currentCommentBlock,
                        });
                    }
                } else if (this.#isClass(trimmedLine)) {
                    const methodData = this.#extractClass(line);
                    if (methodData && methodData.length >= 1) {
                        this.#addParsedBlock({
                            type: 'CLASS',
                            title: {
                                msg: methodData[1].trim(),
                                link: null,
                            },
                            method: '',
                            commentBlock: this.#currentCommentBlock,
                        });
                    }
                } else if (this.#isGVar(trimmedLine)) {
                    const gVarData = this.#extractGVar(line);
                    if (gVarData && gVarData.length >= 1) {
                        this.#addParsedBlock({
                            type: 'GVAR',
                            title: {
                                msg: gVarData[1].trim(),
                                link: null,
                            },
                            method: '',
                            commentBlock: this.#currentCommentBlock,
                        });
                    }
                }

                this.#foundBlock = false;
            }

            this.#currentCommentBlock = this.#getDefaultBlock(); // Reset
        } else {
            if (line.startsWith('---@param')) {
                const params = this.#parseParam(line);
                if (params) params.forEach((param) => this.#currentCommentBlock.params.push(param));
            } else if (line.startsWith('---@return')) {
                const ret = this.#parseReturn(line);
                if (ret) this.#currentCommentBlock.returns.push(ret);
            } else if (line.startsWith('---@field')) {
                const ret = this.#parseField(line);
                if (ret) this.#currentCommentBlock.fields.push(ret);
            } else if (line.startsWith('---@env')) {
                this.#currentCommentBlock.env = this.#parseEnv(line);
            } else if (line.startsWith('---@hint')) {
                const ret = this.#parseHints(line);
                if (ret) this.#currentCommentBlock.hints.push(ret);
            } else if (line.startsWith('---@deprecated')) {
                const ret = this.#parseDeprecated(line);
                if (ret) this.#currentCommentBlock.deprecated.push(ret);
            } else if (line.startsWith('---@')) {
                this.#currentCommentBlock.unknown.push(line.replace('---@', ''));
            } else if (line.startsWith('---*')) {
                this.#currentCommentBlock.description.push(line.replace('---*', '').trim());
            } else if (line.startsWith('---```lua')) {
                this.#currentMode = 'EXAMPLE';
            } else if (line.startsWith('---```')) {
                this.#currentMode = 'NONE';
            } else if (this.#currentMode === 'EXAMPLE') {
                this.#currentCommentBlock.examples.push(line.replace('---', '').trim());
            }

            this.#foundBlock = true;
        }
    };
};
