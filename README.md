# lua-wiki-generator

[![Publish package to GitHub Packages](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml)
[![Coverage Status](https://coveralls.io/repos/github/edunad/lua-wiki-generator/badge.svg?branch=master)](https://coveralls.io/github/edunad/lua-wiki-generator?branch=master)⠀⠀⠀⠀
[![npm version](https://badge.fury.io/js/@edunad%2Flua-wiki-generator.svg)](https://badge.fury.io/js/@edunad%2Flua-wiki-generator)

Generates a **MARKDOWN** wiki using [sumneko's lua extension](https://github.com/sumneko/lua-language-server/wiki/Annotations) documentation format.

Look at https://github.com/MythicalRawr/ias_wiki and https://iaswiki.rawr.dev/ as an example

## SUPPORTS

```
---@hint
---@env
---@param
---@field
---@return
---@deprecated
---* <Comment>
```

Lua Examples :

````
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

## CREATING THE TEMPLATES

[Have a look at the test templates](https://github.com/edunad/lua-wiki-generator/tree/master/tests/__test_templates__)

## USING THE API

Simple usage:

```js
const fs = require('fs');
const { WikiExtract } = require('@edunad/lua-wiki-generator');

const init = () => {
    const methodTemplate = fs.readFileSync('./md-templates/METHOD_TEMPLATE.md', 'utf8');
    const classTemplate = fs.readFileSync('./md-templates/CLASS_TEMPLATE.md', 'utf8');
    const extensionTemplate = fs.readFileSync('./md-templates/EXTENSION_TEMPLATE.md', 'utf8');
    const summaryTemplate = fs.readFileSync('./md-templates/SUMMARY_TEMPLATE.md', 'utf8');

    new WikiExtract('./ias-lib/**/*.lua', './readme', {
        templates: {
            summary: summaryTemplate,

            // Alternatively you can use the same template for the 3 lua types
            method: methodTemplate,
            class: classTemplate,
            extension: extensionTemplate,
        },
    }).extract();
};

init();
```

Custom usage:

```js
const fs = require('fs');
const { WikiExtract } = require('@edunad/lua-wiki-generator');

const init = () => {
    const methodTemplate = fs.readFileSync('./md-templates/METHOD_TEMPLATE.md', 'utf8');
    const classTemplate = fs.readFileSync('./md-templates/CLASS_TEMPLATE.md', 'utf8');
    const extensionTemplate = fs.readFileSync('./md-templates/EXTENSION_TEMPLATE.md', 'utf8');
    const summaryTemplate = fs.readFileSync('./md-templates/SUMMARY_TEMPLATE.md', 'utf8');

    new WikiExtract('./ias-lib/**/*.lua', './readme', {
        templates: {
            summary: summaryTemplate,

            // Alternatively you can use the same template for the 3 lua types
            method: methodTemplate,
            class: classTemplate,
            extension: extensionTemplate,
        },
        mdTextParser: (folder, template, codeBlock) => {
            return [true, template.replace('$MY_CUSTOM_FIELD$', 'hi')]; // Pass true to use default parsers, false to disable them
        },
        mdLinkParser: (type, outputFolder, data) => {
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

Example:

```bash
lua-wiki-generator generate --out "./home" --path "./my-lua-lib/**/*.lua" --method "./my-templates/METHOD_TEMPLATE.md" --extension "./my-templates/EXTENSION_TEMPLATE.md" --class "./my-templates/CLASS_TEMPLATE.md" --summary "./my-templates/SUMMARY_TEMPLATE.md"
```
