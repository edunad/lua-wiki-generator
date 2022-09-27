#!/usr/bin/env node
'use strict';

import fs from 'fs-extra';
import glob from 'glob';
import { basename, resolve } from 'path';

import { LuaParser } from './parser.js';

import { MDClass } from './md-generators/class.js';
import { MDExtension } from './md-generators/extension.js';
import { MDMethod } from './md-generators/method.js';

export class IASWikiExtract {
    #libPath;
    #outputPath;
    #templates;

    constructor(libPath, outputPath, templates) {
        if (!libPath) throw new Error('Missing lib path');
        if (!outputPath) throw new Error('Missing output path');

        if (!templates) throw new Error('Missing templates');
        if (!templates.method) throw new Error('Missing method template path');
        if (!templates.class) throw new Error('Missing class template path');
        if (!templates.extension) throw new Error('Missing extension template path');
        if (!templates.summary) throw new Error('Missing summary template path');

        this.#libPath = libPath;
        this.#outputPath = outputPath;
        this.#templates = templates;
    }

    extract = async () => {
        console.warn(`== Initializing`);

        await fs.remove(this.#outputPath);
        await fs.ensureDir(this.#outputPath);

        // GENERATE WIKI
        console.warn(`== Generating wiki`);

        const summaryMap = await this.generateWiki();
        if (!summaryMap || summaryMap.length <= 0) throw new Error(`Failed to generate wiki? Summary can't be generated`);

        console.warn(`== Generating summary`);
        await this.generateSummary(summaryMap);

        console.warn(`== Success!`);
    };

    generateSummary = async (summaryMap) => {
        const dirs = await fs
            .readdirSync(`${this.#outputPath}`, { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);

        let data = '';
        dirs.forEach((dir) => {
            data += `  * [${dir}](home/${dir}/README.md)\n`;

            const mdFiles = glob.sync(`${this.#outputPath}/${dir}/*.md`, { symlinks: true });
            mdFiles.forEach((file) => {
                const name = summaryMap[file].title.msg;
                data += `    * [${name}](home/${dir}/${basename(file)})\n`;
            });
        });

        fs.writeFileSync(`./SUMMARY.md`, this.#templates.summary.replace('$FILES$', data), { encoding: 'utf-8' });
        console.warn(`Wrote summary file`);
    };

    generateWiki = async () => {
        const summaryMap = {};

        const outputFolderName = basename(this.#outputPath);

        const luaFiles = glob.sync(`${this.#libPath}`, { symlinks: true });
        if (!luaFiles) throw new Error('No lua files found');

        // Parse files
        const parsePromises = luaFiles.map((file) => new LuaParser(file).parseLua());
        const parsedData = await Promise.all(parsePromises);

        // GENERATE MD FILES ----
        parsedData.forEach((data) => {
            if (!data.blocks || data.blocks.length <= 0) return;

            // Generate folder
            const folderTitle = basename(data.file).replace('ias.', '').replace('.lua', '').toLowerCase();
            fs.ensureDirSync(`${this.#outputPath}/${folderTitle}`);

            const hasSingleClass = data.blocks.filter((block) => block.type === 'CLASS').length === 1;

            // Generate files
            data.blocks.forEach((codeBlock) => {
                const isClass = codeBlock.type === 'CLASS';
                const isMethod = codeBlock.type === 'METHOD';
                const isExtension = codeBlock.type === 'EXTENSION';

                let mdData = '';
                if (isMethod) {
                    mdData = new MDMethod(outputFolderName, this.#templates.method).generate(codeBlock);
                } else if (isExtension) {
                    mdData = new MDExtension(outputFolderName, this.#templates.extension).generate(codeBlock);
                } else if (isClass) {
                    mdData = new MDClass(outputFolderName, this.#templates.class).generate(codeBlock);
                }

                if (mdData.trim() === '') return;

                let fileName = codeBlock.title.msg.split(':');
                if (!fileName || fileName.length <= 1) fileName = codeBlock.title.msg;
                else fileName = fileName[1];

                let output = `${this.#outputPath}/${folderTitle}/${folderTitle}_${fileName}.md`;
                if (isClass && hasSingleClass) output = `${this.#outputPath}/${folderTitle}/README.md`;

                summaryMap[output] = {
                    title: codeBlock.title,
                    type: codeBlock.type,
                };

                fs.writeFileSync(output, mdData, { encoding: 'utf-8' });
                console.warn(`Wrote wiki file: ${output}`);
            });
        });

        return summaryMap;
    };
}
