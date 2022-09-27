#!/usr/bin/env node
'use strict';

const { resolve } = require('path');
const LuaParser = require('../src/parser.js');

describe('LUAParser', () => {
    it('Parses classes', async () => {
        const file = `./ias.class_test.lua`;
        const parser = new LuaParser(resolve(__dirname, file));

        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();

        expect(data).not.toBe(undefined);

        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(data.blocks[0].type).toBe('CLASS');

        expect(data.blocks[0].title.msg).toBe('AABB');
        expect(data.blocks[0].title.link).toBe(null);

        expect(data.blocks[0].method).toBe('');
        expect(data.blocks[0].commentBlock).not.toBe(undefined);

        expect(data.blocks[0].commentBlock.description).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.description.length).toBe(1);
        expect(data.blocks[0].commentBlock.description[0]).toBe("AABB's entry class");

        expect(data.blocks[0].commentBlock.env).toBe('SHARED');

        expect(data.blocks[0].commentBlock.examples).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.examples.length).toBe(0);

        expect(data.blocks[0].commentBlock.fields).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.fields.length).toBe(2);
        expect(data.blocks[0].commentBlock.fields[0].name).toBe('pos');
        expect(data.blocks[0].commentBlock.fields[0].type).toBe('Vector');
        expect(data.blocks[0].commentBlock.fields[0].link).toBe('Vector');

        expect(data.blocks[0].commentBlock.fields[1].name).toBe('size');
        expect(data.blocks[0].commentBlock.fields[1].type).toBe('Vector');
        expect(data.blocks[0].commentBlock.fields[1].link).toBe('Vector');

        expect(data.blocks[0].commentBlock.hints).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.hints.length).toBe(0);

        expect(data.blocks[0].commentBlock.returns).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.returns.length).toBe(0);

        expect(data.blocks[0].commentBlock.params).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.params.length).toBe(0);
    });

    it('Parses methods', async () => {
        const file = `./ias.method_test.lua`;
        const parser = new LuaParser(resolve(__dirname, file));

        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();

        expect(data).not.toBe(undefined);

        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(data.blocks[0].type).toBe('METHOD');

        expect(data.blocks[0].title.msg).toBe('console:execute');
        expect(data.blocks[0].title.link).toBe('console');

        expect(data.blocks[0].method).toBe('boolean, string console:execute(args)');
        expect(data.blocks[0].commentBlock).not.toBe(undefined);

        expect(data.blocks[0].commentBlock.description).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.description.length).toBe(1);
        expect(data.blocks[0].commentBlock.description[0]).toBe('Executes a console command programmatically');

        expect(data.blocks[0].commentBlock.env).toBe('SHARED');

        expect(data.blocks[0].commentBlock.examples).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.examples.length).toBe(2);
        expect(data.blocks[0].commentBlock.examples[0]).toBe('--my_command is the command to execute, true is a parameter');
        expect(data.blocks[0].commentBlock.examples[1]).toBe('console:execute({"my_command", "true"})');

        expect(data.blocks[0].commentBlock.fields).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.fields.length).toBe(0);

        expect(data.blocks[0].commentBlock.hints).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.hints.length).toBe(2);
        expect(data.blocks[0].commentBlock.hints[0].message).toBe('PAGE / FUNCTIONALITY STILL IN CONSTRUCTION');
        expect(data.blocks[0].commentBlock.hints[0].type).toBe('@warning');
        expect(data.blocks[0].commentBlock.hints[1].message).toBe('OH NOOOOOOO');
        expect(data.blocks[0].commentBlock.hints[1].type).toBe('@danger');

        expect(data.blocks[0].commentBlock.returns).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.returns.length).toBe(2);
        expect(data.blocks[0].commentBlock.returns[0].description).toBe('If command was executed successfully');
        expect(data.blocks[0].commentBlock.returns[0].type).toBe('boolean');
        expect(data.blocks[0].commentBlock.returns[0].link).toBe(null);
        expect(data.blocks[0].commentBlock.returns[1].description).toBe('No description');
        expect(data.blocks[0].commentBlock.returns[1].type).toBe('string');
        expect(data.blocks[0].commentBlock.returns[1].link).toBe(null);

        expect(data.blocks[0].commentBlock.params).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.params.length).toBe(1);
        expect(data.blocks[0].commentBlock.params[0].description).toBe('No description');
        expect(data.blocks[0].commentBlock.params[0].name).toBe('args');
        expect(data.blocks[0].commentBlock.params[0].optional).toBe(false);
        expect(data.blocks[0].commentBlock.params[0].type).toBe('string[]');
        expect(data.blocks[0].commentBlock.params[0].link).toBe(null);
    });

    it('Parses extensions', async () => {
        const file = `./ias.extension_test.lua`;
        const parser = new LuaParser(resolve(__dirname, file));

        expect(parser).not.toBe(undefined);

        const data = await parser.parseLua();

        expect(data).not.toBe(undefined);

        expect(data.blocks).not.toBe(undefined);
        expect(data.blocks.length).toBe(1);

        expect(data.blocks[0].type).toBe('EXTENSION');
        expect(data.blocks[0].title.msg).toBe('math.isNan');
        expect(data.blocks[0].title.link).toBe(null);

        expect(data.blocks[0].method).toBe('boolean math.isNan(val)');
        expect(data.blocks[0].commentBlock).not.toBe(undefined);

        expect(data.blocks[0].commentBlock.description).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.description.length).toBe(1);
        expect(data.blocks[0].commentBlock.description[0]).toBe('Returns true if the number is NaN (not a number)');

        expect(data.blocks[0].commentBlock.env).toBe('CLIENT');

        expect(data.blocks[0].commentBlock.examples).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.examples.length).toBe(0);

        expect(data.blocks[0].commentBlock.fields).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.fields.length).toBe(0);

        expect(data.blocks[0].commentBlock.hints).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.hints.length).toBe(0);

        expect(data.blocks[0].commentBlock.returns).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.returns.length).toBe(1);
        expect(data.blocks[0].commentBlock.returns[0].description).toBe('If its NaN');
        expect(data.blocks[0].commentBlock.returns[0].type).toBe('boolean');
        expect(data.blocks[0].commentBlock.returns[0].link).toBe(null);

        expect(data.blocks[0].commentBlock.params).not.toBe(undefined);
        expect(data.blocks[0].commentBlock.params.length).toBe(1);
        expect(data.blocks[0].commentBlock.params[0].description).toBe('No description');
        expect(data.blocks[0].commentBlock.params[0].name).toBe('val');
        expect(data.blocks[0].commentBlock.params[0].link).toBe(null);
    });
});
