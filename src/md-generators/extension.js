#!/usr/bin/env node
'use strict';

export class MDExtension {
    #outputFolder;
    #template;

    constructor(outputFolder, template) {
        this.#outputFolder = outputFolder;
        this.#template = template;
    }

    generate = (data) => {
        if (!this.#template) return '';
        let fixedTemplate = this.#template;

        fixedTemplate = this.#parseDescription(fixedTemplate, data);
        fixedTemplate = this.#parseScope(fixedTemplate, data);
        fixedTemplate = this.#parseTitle(fixedTemplate, data);
        fixedTemplate = this.#parseMethodName(fixedTemplate, data);
        fixedTemplate = this.#parseHint(fixedTemplate, data);
        fixedTemplate = this.#parseParameters(fixedTemplate, data);
        fixedTemplate = this.#parseReturns(fixedTemplate, data);
        fixedTemplate = this.#parseExamples(fixedTemplate, data);

        return fixedTemplate;
    };

    #parseDescription = (template, data) => {
        return template.replace(/\$DESCRIPTION\$/g, data.commentBlock.description);
    };

    #parseScope = (template, data) => {
        return template.replace(/\$SCOPE\$/g, data.commentBlock.env.toLowerCase());
    };

    #parseTitle = (template, data) => {
        return template.replace('$METHOD_NAME$', data.title.msg);
    };

    #parseMethodName = (template, data) => {
        return template.replace('$METHOD_NAME$', data.method);
    };

    #parseHint = (template, data) => {
        let hints = '';
        if (data.commentBlock.hints.length > 0) {
            data.commentBlock.hints.forEach((hint) => {
                if (hint.message.trim() === '') return;
                hints += `{% hint style="${hint.type}" %} ${hint.message} {% endhint %}\n`;
            });
        }

        return template.replace('$HINTS$', hints);
    };

    #parseParameters = (template, data) => {
        let params = '';
        if (data.commentBlock.params.length > 0) {
            params += `------\n`;
            params += `## Parameters\n\n`;
            params += `| Type   | Name | Description | Optional |\n`;
            params += `| ------ | ---- | ----------- | -------: |\n`;

            data.commentBlock.params.forEach((param) => {
                const type = param.link ? `[${param.link}](${this.#outputFolder}/${param.link})` : param.type;
                params += `| ${type} | ${param.name} | ${param.description} | ${param.optional ? '✔' : ''} |\n`;
            });
        }

        return template.replace('$PARAMETERS$', params);
    };

    #parseReturns = (template, data) => {
        let returns = '';
        if (data.commentBlock.returns.length > 0) {
            returns += `------\n`;
            returns += `## Returns\n\n`;
            returns += `| Type   | Description |\n`;
            returns += `| ------ | ----------: |\n`;

            data.commentBlock.returns.forEach((ret) => {
                const type = ret.link ? `[${ret.link}](${this.#outputFolder}/${ret.link})` : ret.type;
                returns += `| ${type} | ${ret.description} |\n`;
            });
        }

        return template.replace('$RETURNS$', returns);
    };

    #parseExamples = (template, data) => {
        let example = '';
        if (data.commentBlock.examples.length > 0) {
            example += '```lua\n';
            data.commentBlock.examples.forEach((ex) => {
                example += `${ex}\n`;
            });
            example += '```\n';
        }

        return template.replace('$EXAMPLE$', example);
    };
}
