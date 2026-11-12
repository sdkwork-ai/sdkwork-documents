export { publicDocsMessages } from './public/docs.ts';
export { publicApiReferenceMessages } from './public/api-reference.ts';
export { publicSdkReferenceMessages } from './public/sdk-reference.ts';
export { publicLegalMessages } from './public/legal.ts';
export type { I18nMessageBundle, I18nResources, LocaleCode, LocaleMessages } from './types.ts';

import { publicDocsMessages } from './public/docs.ts';
import { publicApiReferenceMessages } from './public/api-reference.ts';
import { publicSdkReferenceMessages } from './public/sdk-reference.ts';
import { publicLegalMessages } from './public/legal.ts';

export const documentsPcMessages = {
  en: {
    translation: {
      ...publicDocsMessages.en,
      ...publicApiReferenceMessages.en,
      ...publicSdkReferenceMessages.en,
      ...publicLegalMessages.en,
    },
  },
  zh: {
    translation: {
      ...publicDocsMessages.zh,
      ...publicApiReferenceMessages.zh,
      ...publicSdkReferenceMessages.zh,
      ...publicLegalMessages.zh,
    },
  },
};
