#!/usr/bin/env node
'use strict';

class MDClass {
    #outputFolder;
    #template;

    constructor(outputFolder, template) {
        if (!template) throw new Error('Invalid MD template');

        this.#outputFolder = outputFolder;
        this.#template = template;
    }

    generate = (data) => {
        if (!data) throw new Error('No data to generate a MD template');
        let fixedTemplate = this.#template;

        fixedTemplate = this.#parseDescription(fixedTemplate, data);
        fixedTemplate = this.#parseScope(fixedTemplate, data);
        fixedTemplate = this.#parseTitle(fixedTemplate, data);
        fixedTemplate = this.#parseHint(fixedTemplate, data);
        fixedTemplate = this.#parseFields(fixedTemplate, data);

        return fixedTemplate;
    };

    #parseDescription = (template, data) => {
        if (!data.commentBlock.description) return template;
        return template.replace('$DESCRIPTION$', `${data.commentBlock.description}\n`);
    };

    #parseScope = (template, data) => {
        if (!data.commentBlock.env) return template;
        return template.replace(/\$SCOPE\$/g, data.commentBlock.env.toLowerCase());
    };

    #parseTitle = (template, data) => {
        if (!data.title) return template;
        return template.replace('$TITLE_BASE_NAME$', data.title.msg);
    };

    #parseHint = (template, data) => {
        let hints = '';
        if (data.commentBlock.hints.length > 0) {
            data.commentBlock.hints.forEach((hint) => {
                if (hint.message.trim() === '') return;
                hints += `{% hint style="${hint.type}" %} ${hint.message} {% endhint %}\n`;
            });

            hints += `\n`;
        }

        return template.replace('$HINTS$', hints);
    };

    #parseFields = (template, data) => {
        let fields = '';
        if (data.commentBlock.fields.length > 0) {
            fields += `------\n`;
            fields += `## Fields\n\n`;
            fields += `| Type   | Name |\n`;
            fields += `| ------ | ---: |\n`;

            data.commentBlock.fields.forEach((field) => {
                const type = field.link ? `[${field.link}](${this.#outputFolder}/${field.link})` : field.type;
                fields += `| ${type} | ${field.name} |\n`;
            });

            fields += `\n`;
        }

        return template.replace('$FIELDS$', fields);
    };
}

module.exports = MDClass;
