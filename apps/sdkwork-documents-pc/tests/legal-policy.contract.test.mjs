#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  LEGAL_DOCUMENTS,
  LEGAL_LOCALES,
  resolveLegalLocale,
} from '../packages/sdkwork-documents-pc-legal/src/legal-document.ts';
import {
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_PATHS,
} from '../packages/sdkwork-documents-pc-legal/src/paths.ts';
import { publicLegalMessages } from '../packages/sdkwork-documents-pc-i18n/src/resources/public/legal.ts';

const pcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legalPackageRoot = path.join(pcRoot, 'packages/sdkwork-documents-pc-legal');

test('legal document package exposes one canonical route per policy', () => {
  assert.deepEqual([...LEGAL_DOCUMENT_IDS], ['privacy-policy', 'terms-of-service', 'cookie-policy']);
  assert.deepEqual(
    { ...LEGAL_DOCUMENT_PATHS },
    {
      'privacy-policy': '/privacy',
      'terms-of-service': '/terms',
      'cookie-policy': '/cookies',
    },
  );
  assert.deepEqual([...LEGAL_LOCALES], ['en', 'zh']);

  for (const relativePath of [
    'package.json',
    'tsconfig.json',
    'specs/component.spec.json',
    'src/index.ts',
    'src/paths.ts',
    'src/legal-document.ts',
    'src/components/LegalDocumentPage.tsx',
    'src/content/privacy-policy.ts',
    'src/content/terms-of-service.ts',
    'src/content/cookie-policy.ts',
  ]) {
    assert.ok(fs.existsSync(path.join(legalPackageRoot, relativePath)), `missing legal package file: ${relativePath}`);
  }
});

test('every legal document is authored for both locales with stable anchors', () => {
  for (const documentId of LEGAL_DOCUMENT_IDS) {
    for (const locale of LEGAL_LOCALES) {
      const document = LEGAL_DOCUMENTS[locale][documentId];

      assert.equal(document.id, documentId);
      assert.equal(document.locale, locale);
      assert.equal(document.path, LEGAL_DOCUMENT_PATHS[documentId]);
      assert.ok(document.title.trim().length >= 2, `${documentId}/${locale} title`);
      assert.ok(document.summary.trim().length >= 40, `${documentId}/${locale} summary`);
      assert.match(document.version, /^\d+\.\d+$/);
      assert.match(document.effectiveDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(document.lastUpdated, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(document.contactEmail, /^[^@\s]+@[^@\s]+$/);
      assert.ok(document.sections.length >= 4, `${documentId}/${locale} needs real sections`);

      const seenSectionIds = new Set();
      for (const section of document.sections) {
        assert.match(section.id, /^[a-z0-9-]+$/);
        assert.ok(!seenSectionIds.has(section.id), `${documentId}/${locale} duplicate section ${section.id}`);
        seenSectionIds.add(section.id);
        assert.ok(section.heading.trim().length > 0);
        assert.ok(section.blocks.length > 0);

        for (const block of section.blocks) {
          switch (block.type) {
            case 'paragraph':
              assert.ok(block.text.trim().length > 0);
              break;
            case 'bulletList':
            case 'numberedList':
              assert.ok(block.items.length > 0);
              assert.ok(block.items.every((item) => item.trim().length > 0));
              break;
            case 'table':
              assert.ok(block.columns.length >= 2);
              assert.ok(block.rows.length > 0);
              assert.ok(
                block.rows.every((row) => row.length === block.columns.length),
                `${documentId}/${locale}/${section.id} table shape`,
              );
              break;
            case 'callout':
              assert.ok(block.title.trim().length > 0);
              assert.ok(block.text.trim().length > 0);
              break;
            case 'definitions':
              assert.ok(block.items.length > 0);
              assert.ok(
                block.items.every((item) => item.term.trim().length > 0 && item.description.trim().length > 0),
              );
              break;
            default: {
              const exhaustive = block;
              assert.fail(`unhandled legal block ${String(exhaustive)}`);
            }
          }
        }
      }
    }
  }
});

test('legal page chrome is bilingual and locale fallback is explicit', () => {
  assert.deepEqual(Object.keys(publicLegalMessages.zh).sort(), Object.keys(publicLegalMessages.en).sort());
  assert.match(publicLegalMessages.en['legal.page.fallbackNotice'], /\{\{locale\}\}/);
  assert.match(publicLegalMessages.zh['legal.page.fallbackNotice'], /\{\{locale\}\}/);

  assert.equal(resolveLegalLocale('zh-CN'), 'zh');
  assert.equal(resolveLegalLocale('en-US'), 'en');
  assert.equal(resolveLegalLocale('fr-FR'), 'en');
  assert.equal(resolveLegalLocale(undefined), 'en');
});

test('documents shell mounts every legal page and links it from the footer', () => {
  const shellSource = fs.readFileSync(
    path.join(pcRoot, 'packages/sdkwork-documents-pc-shell/src/index.tsx'),
    'utf8',
  );
  const i18nSource = fs.readFileSync(
    path.join(pcRoot, 'packages/sdkwork-documents-pc-i18n/src/resources/index.ts'),
    'utf8',
  );

  assert.match(shellSource, /from '@sdkwork\/documents-pc-legal'/);
  assert.match(shellSource, /LEGAL_DOCUMENT_PATHS\['privacy-policy'\]/);
  assert.match(shellSource, /LEGAL_DOCUMENT_PATHS\['terms-of-service'\]/);
  assert.match(shellSource, /LEGAL_DOCUMENT_PATHS\['cookie-policy'\]/);
  assert.match(shellSource, /PrivacyPolicyPage/);
  assert.match(shellSource, /TermsOfServicePage/);
  assert.match(shellSource, /CookiePolicyPage/);
  assert.match(i18nSource, /publicLegalMessages/);
});
