# lua-wiki-generator

[![Publish package to GitHub Packages](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml)⠀
[![Coverage Status](https://coveralls.io/repos/github/edunad/lua-wiki-generator/badge.svg?branch=master)](https://coveralls.io/github/edunad/lua-wiki-generator?branch=master)⠀
[![npm version](https://badge.fury.io/js/@edunad%2Flua-wiki-generator.svg)](https://badge.fury.io/js/@edunad%2Flua-wiki-generator)
![](https://img.shields.io/bundlephobia/min/@edunad/lua-wiki-generator)⠀⠀

## Generates a **MARKDOWN** wiki using [sumneko's lua extension](https://github.com/sumneko/lua-language-server/wiki/Annotations) documentation format.

---

## EXAMPLES

Look at https://github.com/MythicalRawr/ias_wiki and https://iaswiki.rawr.dev/ as an example

## FEATURES / SUPPORTS

-   It will try to link custom objects together, if a mdLinkParser is provided (check advanced example)
-   Custom templates for each lua object type
-   CLI support
-   Generates SUMMARY.md

### SUPPORTED ANNOTATIONS:

````
---@hint
---@env
---@param
---@field
---@return
---@deprecated
---* <Comment>

---```lua
---<mycode>
---```
````

## INSTALLATION

yarn

```
yarn add @edunad/lua-wiki-generator --dev
```

npm

```
npm install @edunad/lua-wiki-generator --dev
```

## TEMPLATES

If no template is provided, it will use the internal default template:

```md
# $TITLE_NAME$

$DEPRECATED$$HINTS$$METHOD$$DESCRIPTION$$EXAMPLE$$PARAMETERS$$RETURNS$$FIELDS$
```

### CREATING CUSTOM TEMPLATES

-   [Have a look at the test templates](https://github.com/edunad/lua-wiki-generator/tree/master/tests/__test_templates__)

## USING THE API

-   Simple usage (No SUMMARY.md & using the default template):

    ```js
    const { WikiExtract } = require('@edunad/lua-wiki-generator');

    const init = () => {
        // Input = All lua files inside ias-lib folder & sub-folders
        // Output = ./readme folder
        // Templates will use the default template
        new WikiExtract('./ias-lib/**/*.lua', './readme').extract();
    };

    init();
    ```

-   Custom templates (with SUMMARY.md being generated):

    ```js
    const fs = require('fs');
    const { WikiExtract } = require('@edunad/lua-wiki-generator');

    const init = () => {
        const summaryTemplate = fs.readFileSync('./SUMMARY_TEMPLATE.md', 'utf8');

        const methodTemplate = fs.readFileSync('./METHOD_TEMPLATE.md', 'utf8');
        const classTemplate = fs.readFileSync('./CLASS_TEMPLATE.md', 'utf8');
        const extensionTemplate = fs.readFileSync('./EXTENSION_TEMPLATE.md', 'utf8');
        const gvarTemplate = fs.readFileSync('./GVAR_TEMPLATE.md', 'utf8');

        // Input = All lua files inside ias-lib folder & sub-folders
        // Output = ./readme folder
        // NOTE: Summary will be generated since the template is set
        new WikiExtract('./ias-lib/**/*.lua', './readme', {
            templates: {
                summary: summaryTemplate,

                method: methodTemplate,
                class: classTemplate,
                extension: extensionTemplate,
                gvar: gvarTemplate,
            },
        }).extract();
    };

    init();
    ```

-   Advanced usage (with linking and custom fields):

    ```js
    const fs = require('fs');
    const { WikiExtract } = require('@edunad/lua-wiki-generator');

    const init = () => {
        const summaryTemplate = fs.readFileSync('./SUMMARY_TEMPLATE.md', 'utf8');

        const methodTemplate = fs.readFileSync('./METHOD_TEMPLATE.md', 'utf8');
        const classTemplate = fs.readFileSync('./CLASS_TEMPLATE.md', 'utf8');
        const extensionTemplate = fs.readFileSync('./EXTENSION_TEMPLATE.md', 'utf8');
        const gvarTemplate = fs.readFileSync('./GVAR_TEMPLATE.md', 'utf8');

        new WikiExtract('./ias-lib/**/*.lua', './readme', {
            templates: {
                summary: summaryTemplate, // Comment out summary to not generate a SUMMARY.md

                //method: methodTemplate, // method will use the default template
                class: classTemplate,
                extension: extensionTemplate,
                gvar: gvarTemplate,
            },
            mdTextParser: (folder, template, codeBlock) => {
                // Pass true to use default parsers, false to disable them
                return [true, template.replace(/\$MY_CUSTOM_FIELD\$/g, 'hi')];
            },
            mdHintParser: (hint) => {
                // Custom handle hints / Admonitions, by default it uses the Docusaurus format (https://docusaurus.io/docs/markdown-features/admonitions)
                return `:::\n${hint.type} -> ${hint.message}\n`;
            },
            mdLinkParser: (type, outputFolder, data) => {
                // Handle linking
                if (type === '$TITLE_NAME$') {
                    return `[TITLE](My title link:${data.link})`;
                } else if (type === '$PARAMETERS$' || type === '$RETURNS$' || type === '$FIELDS$') {
                    return `[TITLE](My other link:${data.link})`;
                } else if (type === 'SUMMARY') {
                    if (data.fileName) {
                        // Not root
                        return `[SUB](${outputFolder}/${data.dir}/${data.fileName})`;
                    } else {
                        // ROOT
                        return `[ROOT](${outputFolder}/${data.dir})`;
                    }
                }

                throw new Error(`Unknown type: ${type}`);
            },
        }).extract();
    };

    init();
    ```

## USING THE CLI

Either install it globally, or use `npx` to call the cli

-   Example:

    ```bash
    lua-wiki-generator generate --out "./home" --path "./my-lua-lib/**/*.lua" --method "./METHOD_TEMPLATE.md" --extension "./EXTENSION_TEMPLATE.md" --class "./CLASS_TEMPLATE.md" --summary "./SUMMARY_TEMPLATE.md" --gvar "./GVAR_TEMPLATE.md"
    ```
