#!/usr/bin/env node
'use strict';

const fs = require('fs-extra');
const { resolve } = require('path');

const SummaryGenerator = require('../src/summary.js');

const SUMMARY_TEMPLATE_FILE = './__test_templates__/SUMMARY_TEMPLATE.md';
const INPUT_TEST_FOLDER = './tests/__test_summary__';

describe('SummaryGenerator', () => {
    beforeAll(async () => {
        this.summary = await fs.readFile(resolve(__dirname, SUMMARY_TEMPLATE_FILE), 'utf8');
    });

    beforeEach(() => {
        SummaryGenerator.setLinkMDParser(null);
    });

    it('Generates summary', async () => {
        const generated = await SummaryGenerator.generate(
            INPUT_TEST_FOLDER,
            {
                './tests/__test_summary__/io/io_open.md': {
                    title: { msg: 'bad_class_test:test' },
                    type: 'METHOD',
                },
                './tests/__test_summary__/console/console_bottom.md': {
                    title: { msg: 'bad_class_test:test' },
                    type: 'METHOD',
                },
            },
            this.summary,
        );

        expect(generated).toMatchSnapshot();
    });

    it('Generates summary with a custom link', async () => {
        SummaryGenerator.setLinkMDParser((type, linkMap, data) => {
            if (type === 'SUMMARY') {
                if (data.fileName) {
                    // Not root
                    return `${data.fileName}`;
                } else {
                    // ROOT
                    return `${data.dir}/MY_ROOT_DOCUMENT.md`;
                }
            }

            throw new Error(`Unknown type: ${type}`);
        });

        const generated = await SummaryGenerator.generate(
            INPUT_TEST_FOLDER,
            {
                './tests/__test_summary__/io/io_open.md': {
                    title: { msg: 'bad_class_test:test' },
                    type: 'METHOD',
                },
                './tests/__test_summary__/console/console_bottom.md': {
                    title: { msg: 'bad_class_test:test' },
                    type: 'METHOD',
                },
            },
            this.summary,
        );

        expect(generated).toMatchSnapshot();
    });
});
