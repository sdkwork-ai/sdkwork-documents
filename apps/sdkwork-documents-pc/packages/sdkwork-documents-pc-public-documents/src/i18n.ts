type MessageBundle = Record<'en' | 'zh', Record<string, string>>;

export const publicDocumentsMessages: MessageBundle = {
  en: {
    'publicDocs.title': 'Documentation',
    'publicDocs.subtitle': 'Policies, industry standards, and product documentation.',
    'publicDocs.searchPlaceholder': 'Search documents',
    'publicDocs.empty': 'No published documents yet.',
    'publicDocs.error': 'Could not load documents.',
    'publicDocs.retry': 'Retry',
    'publicDocs.category.policy': 'Policies',
    'publicDocs.category.standard': 'Industry Standards',
    'publicDocs.category.other': 'Other Documents',
    'publicDocs.read': 'Read',
    'publicDocs.back': 'All documents',
    'publicDocs.notFound': 'This document does not exist or is not published.',
    'publicDocs.updated': 'Published',
    'publicDocs.localeFallback':
      'This document is not available in {{locale}}; the {{servedLocale}} version is shown.',
  },
  zh: {
    'publicDocs.title': '文档中心',
    'publicDocs.subtitle': '隐私政策、行业规范与产品文档。',
    'publicDocs.searchPlaceholder': '搜索文档',
    'publicDocs.empty': '暂无已发布文档。',
    'publicDocs.error': '文档加载失败。',
    'publicDocs.retry': '重试',
    'publicDocs.category.policy': '政策与条款',
    'publicDocs.category.standard': '行业规范',
    'publicDocs.category.other': '其他文档',
    'publicDocs.read': '阅读',
    'publicDocs.back': '全部文档',
    'publicDocs.notFound': '文档不存在或尚未发布。',
    'publicDocs.updated': '发布日期',
    'publicDocs.localeFallback': '本文档暂无 {{locale}} 版本，当前显示 {{servedLocale}} 版本。',
  },
};
