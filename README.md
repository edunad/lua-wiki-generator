# lua-wiki-generator

[![Publish package to GitHub Packages](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml)
[![Coverage Status](https://coveralls.io/repos/github/edunad/lua-wiki-generator/badge.svg?branch=master)](https://coveralls.io/github/edunad/lua-wiki-generator?branch=master)⠀⠀⠀⠀
[![npm version](https://badge.fury.io/js/%40edunad%2Flua-wiki-generator.svg)](https://badge.fury.io/js/%40edunad%2Flua-wiki-generator)

Generates a **MARKDOWN** wiki using [sumneko's lua extension](https://github.com/sumneko/lua-language-server) documentation format.

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

```js
const fs = require('fs');
const { WikiExtract } = require('@edunad/lua-wiki-generator');

const init = () => {
    const methodTemplate = fs.readFileSync('./md-templates/METHOD_TEMPLATE.md', 'utf8');
    const classTemplate = fs.readFileSync('./md-templates/CLASS_TEMPLATE.md', 'utf8');
    const extensionTemplate = fs.readFileSync('./md-templates/EXTENSION_TEMPLATE.md', 'utf8');
    const summaryTemplate = fs.readFileSync('./md-templates/SUMMARY_TEMPLATE.md', 'utf8');

    new WikiExtract('./ias-lib/**/*.lua', './home', {
        summary: summaryTemplate,
        method: methodTemplate,
        class: classTemplate,
        extension: extensionTemplate,
    }).extract();
};

init();
```

## USING THE CLI

> Either install it globally, or use `npx` to call the cli

Example:

```bash
lua-wiki-generator generate --out "./home" --path "./my-lua-lib/**/*.lua" --method "./my-templates/METHOD_TEMPLATE.md" --extension "./my-templates/EXTENSION_TEMPLATE.md" --class "./my-templates/CLASS_TEMPLATE.md" --summary "./my-templates/SUMMARY_TEMPLATE.md"
```
