#!/usr/bin/env node
'use strict';

import fs from 'fs';
import readline from 'readline';
import events from 'events';

export class LuaParser {
    #currentCommentBlock;
    #currentMode;
    #parsedBlocks;
    #filePath;
    #foundBlock;

    constructor(path) {
        this.#filePath = path;
    }

    parseLua = async () => {
        const stream = fs.createReadStream(this.#filePath, 'utf8');
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
        if (this.#parsedBlocks.length <= 0) console.warn(`File ${this.#filePath} has no lua documentation?`);
        return Promise.resolve(this.#parsedBlocks);
    };

    #reset = () => {
        this.#currentCommentBlock = this.#getDefaultBlock();
        this.#currentMode = 'NONE';
        this.#parsedBlocks = {
            file: this.#filePath,
            blocks: [],
        };
    };

    #isIgnoredAttr = (attr) => {
        return ['---@meta', '---@class'].indexOf(attr) !== -1; // TODO: Add other weird attributes that we don't care
    };

    #isExtensionMethod = (line) => {
        return line.indexOf('function(') !== -1;
    };

    #isClass = (line) => {
        return line.indexOf('={') !== -1;
    };

    #isMethod = (line) => {
        return line.startsWith('function ');
    };
    // ------

    #extractMethod = (line) => {
        return [...line.matchAll(/function ((.*):.*)\((.*)\)/g)][0];
    };

    #extractExtension = (line) => {
        return [...line.matchAll(/(.*)=.*function.*(\(.*\))/g)][0];
    };

    #extractClass = (line) => {
        return [...line.matchAll(/(.*)=.*{/g)][0];
    };

    // DOC PARSING ----
    #parseParam = (line) => {
        //---@param callback function bla
        const paramRegex = [...line.matchAll(/---@param ([^ \r\n]*) ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!paramRegex || paramRegex.length !== 1) return null;

        const params = paramRegex[0];
        if (!params || params.length < 3) return null;
        const isOptional = params[1].indexOf('?') !== -1;

        return {
            name: params[1].replace('?', ''),
            type: params[2],
            description: params[3] || 'No description',
            optional: isOptional,

            link: this.#isLuaPrimitive(params[2]) ? null : params[2],
        };
    };

    #parseField = (line) => {
        //---@field callback function bla
        const fieldRegex = [...line.matchAll(/---@field ([^ \r\n]*) ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!fieldRegex || fieldRegex.length !== 1) return null;

        const fields = fieldRegex[0];
        if (!fields || fields.length < 2) return null;

        return {
            name: fields[1],
            type: fields[2],

            link: this.#isLuaPrimitive(fields[2]) ? null : fields[2],
        };
    };

    #parseReturn = (line) => {
        //---@return boolean asdasdas
        const returnRegex = [...line.matchAll(/---@return ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!returnRegex || returnRegex.length !== 1) return null;

        const returns = returnRegex[0];
        if (!returns || returns.length <= 0) return null;

        return {
            type: returns[1],
            description: returns[2] || 'No description',

            link: this.#isLuaPrimitive(returns[1]) ? null : returns[1],
        };
    };

    #parseHints = (line) => {
        //---@hint @warning PAGE / FUNCTIONALITY STILL IN CONSTRUCTION
        const hintRegex = [...line.matchAll(/---@hint ([^ \r\n]*) ?"?([^"\r\n]*)?"?/g)];
        if (!hintRegex || hintRegex.length !== 1) return null;

        const hints = hintRegex[0];
        if (!hints || hints.length !== 3) return null;

        return {
            type: hints[1],
            message: hints[2],
        };
    };

    #parseEnv = (line) => {
        //---@env shared
        const envRegex = [...line.matchAll(/---@env ([^ \r\n]*)/g)];
        if (!envRegex || envRegex.length !== 1) return 'UNKNOWN';

        const envs = envRegex[0];
        if (!envs || envs.length !== 2) return 'UNKNOWN';

        return envs[1];
    };
    /// --------

    #buildReturn = (returns) => {
        if (!returns || returns.length <= 0) return 'void';
        return returns.map((ret) => ret.type).join(', ');
    };

    /// --------
    #getDefaultBlock = () => {
        return {
            env: 'UNKNOWN',

            params: [],
            hints: [],
            returns: [],
            fields: [],
            description: [],
            examples: [],
        };
    };

    #isLuaPrimitive = (type) => {
        const primitives = ['nil', 'boolean', 'number', 'string', 'function', 'userdata', 'thread', 'table'];

        const fixedStr = type.toLowerCase().trim();
        const name = fixedStr.split('[');

        return primitives.includes(name[0] || fixedStr);
    };

    // ------------
    #parseLine = (line) => {
        const trimmedLine = line.replace(/\s/g, '');
        if (trimmedLine === '' || this.#isIgnoredAttr(trimmedLine)) return; // Ignore

        // Reached a method?
        if (!trimmedLine.startsWith('---')) {
            if (this.#foundBlock) {
                if (this.#isMethod(line)) {
                    // ex: function console:execute(args) end
                    const methodData = this.#extractMethod(line);
                    if (methodData && methodData.length >= 3) {
                        this.#parsedBlocks.blocks.push({
                            type: 'METHOD',
                            title: {
                                msg: methodData[1].trim(),
                                link: this.#isLuaPrimitive(methodData[2]) ? null : methodData[2],
                            },
                            method: methodData[0].replace('function', this.#buildReturn(this.#currentCommentBlock.returns)),
                            commentBlock: this.#currentCommentBlock,
                        });
                    }
                } else if (this.#isExtensionMethod(trimmedLine)) {
                    const methodData = this.#extractExtension(line);
                    if (methodData && methodData.length >= 3) {
                        this.#parsedBlocks.blocks.push({
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
                        this.#parsedBlocks.blocks.push({
                            type: 'CLASS',
                            title: {
                                msg: methodData[1].trim(),
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
                const param = this.#parseParam(line);
                if (param) this.#currentCommentBlock.params.push(param);
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
}
