export { publicDocsMessages } from "./public/docs.js";
export { publicApiReferenceMessages } from "./public/api-reference.js";
export { publicSdkReferenceMessages } from "./public/sdk-reference.js";
export { publicLegalMessages } from "./public/legal.js";
import { publicDocsMessages } from "./public/docs.js";
import { publicApiReferenceMessages } from "./public/api-reference.js";
import { publicSdkReferenceMessages } from "./public/sdk-reference.js";
import { publicLegalMessages } from "./public/legal.js";
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
//# sourceMappingURL=index.js.map