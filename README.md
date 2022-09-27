# lua-wiki-generator
[![Publish package to GitHub Packages](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml/badge.svg)](https://github.com/edunad/lua-wiki-generator/actions/workflows/release.yaml)

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
import IASWikiExtract from '@edunad/lua-wiki-generator';

...

const methodTemplate = await fs.readFile("./my-method-template.md", 'utf8');
const classTemplate = await fs.readFile("./my-class-template.md", 'utf8');
const extensionTemplate = await fs.readFile("./my-extension-template.md", 'utf8');
const summaryTemplate = await fs.readFile("./my-summary-template.md", 'utf8');

await new IASWikiExtract("./my-lib/**/*.lua", "./home", {
  summary: summaryTemplate,
  method: methodTemplate,
  class: classTemplate,
  extension: extensionTemplate,
}).extract();
```

## USING THE CLI

> Either install it globally, or use `npx` to call the cli

Example: 
```bash
lua-wiki-generator generate --out "./home" --path "./my-lua-lib/**/*.lua" --method "./my-templates/METHOD_TEMPLATE.md" --extension "./my-templates/EXTENSION_TEMPLATE.md" --class "./my-templates/CLASS_TEMPLATE.md" --summary "./my-templates/SUMMARY_TEMPLATE.md"
```
