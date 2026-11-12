import type { LegalDocumentContent } from '../legal-document.ts';

export const cookiePolicyContent: LegalDocumentContent = {
  en: {
    title: 'Cookie Policy',
    summary:
      'The cookies and browser storage entries used by the Cloud Router website, console, and desktop clients, why we use them, and how to remove them.',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'privacy@sdkwork.com',
    sections: [
      {
        id: 'scope',
        heading: '1. Scope',
        blocks: [
          {
            type: 'paragraph',
            text: 'This Cookie Policy explains how SDKWork Cloud Router uses cookies, local storage, and session storage (together, "browser storage") when you visit our website, sign in to the console, or use a desktop client. It should be read together with the Privacy Policy.',
          },
          {
            type: 'paragraph',
            text: 'The entries described here are set by SDKWork. Where a checkout, embedded player, or single sign-on flow loads a third-party frame, that provider may set its own cookies under its policy, as noted in section 6.',
          },
        ],
      },
      {
        id: 'what-we-store',
        heading: '2. Cookies and browser storage',
        blocks: [
          {
            type: 'paragraph',
            text: 'A cookie is a small file a site stores in your browser and returns with later requests. Local storage and session storage hold key-value data in the browser without sending it automatically with every request.',
          },
          {
            type: 'definitions',
            items: [
              {
                term: 'Strictly necessary cookies',
                description:
                  'Required to route requests, keep a session secure, and remember that you signed in. The Service cannot work without them.',
              },
              {
                term: 'Preference storage',
                description:
                  'Remembers choices such as interface language, color theme, and accent color on this device.',
              },
              {
                term: 'Security storage',
                description:
                  'Supports request integrity checks, abuse prevention, and sign-out of compromised sessions.',
              },
              {
                term: 'Analytics storage',
                description:
                  'Optional, aggregated product usage measurement. Off unless the operator of your deployment enables it with the required consent.',
              },
            ],
          },
        ],
      },
      {
        id: 'categories',
        heading: '3. Categories we use',
        blocks: [
          {
            type: 'table',
            columns: ['Category', 'What it does', 'Consent'],
            rows: [
              [
                'Strictly necessary',
                'Maintains the authenticated session and routes console and API requests to the correct workspace.',
                'Not required; the Service cannot function without it.',
              ],
              [
                'Security',
                'Supports request integrity, abuse detection, and session invalidation after a suspected compromise.',
                'Not required; based on our legitimate interest in protecting the Service.',
              ],
              [
                'Preferences',
                'Stores language, theme, and layout choices so the interface opens the way you left it.',
                'Not required; you can clear the entries at any time.',
              ],
              [
                'Analytics',
                'Measures aggregated feature usage and page performance to improve the product.',
                'Required where law or deployment policy demands it; off by default in standalone deployments.',
              ],
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'No advertising cookies',
            text: 'The Cloud Router console does not use advertising cookies, cross-site tracking pixels, or data brokers.',
          },
        ],
      },
      {
        id: 'browser-storage-inventory',
        heading: '4. Browser storage we set',
        blocks: [
          {
            type: 'paragraph',
            text: 'The table lists the entries the Cloud Router web client currently uses. Key names may change as the product evolves; the category and purpose remain as described.',
          },
          {
            type: 'table',
            columns: ['Storage key', 'Type', 'Purpose', 'Lifetime'],
            rows: [
              [
                'sdkwork.cloudRouter.appSession.v1',
                'Local storage',
                'Keeps the signed-in console session and workspace context so a page reload does not require a new sign-in.',
                'Until sign-out or session expiry.',
              ],
              [
                'user_explicit_lang',
                'Local storage',
                'Remembers the interface language you selected.',
                'Until you clear it or change the language.',
              ],
              [
                'i18nextLng',
                'Local storage',
                'Caches the language resolved by the translation runtime.',
                'Until you clear it or change the language.',
              ],
              [
                'cloud-router-theme',
                'Local storage',
                'Remembers light, dark, or system theme preference.',
                'Until you clear it or change the theme.',
              ],
              [
                'cloud-router-theme-color',
                'Local storage',
                'Remembers the accent color preference.',
                'Until you clear it or change the accent color.',
              ],
              [
                'Identity host session cookie',
                'HttpOnly cookie',
                'Set by the single sign-on host when cookie-based session exchange is enabled; carries the authenticated session reference, not your password.',
                'Session, or until the configured session lifetime ends.',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: 'Session storage entries are temporary, scoped to one browser tab, and cleared when the tab closes. They are used for in-progress form and navigation state.',
          },
        ],
      },
      {
        id: 'managing-preferences',
        heading: '5. Managing and removing browser storage',
        blocks: [
          {
            type: 'paragraph',
            text: 'You can control cookies and browser storage in your browser settings. Most browsers let you view stored entries, delete individual items, block third-party cookies, and clear all data when the window closes.',
          },
          {
            type: 'paragraph',
            text: 'Removing strictly necessary entries signs you out and may interrupt an in-progress request. Removing preference entries resets the interface to its defaults; you can set them again in the console.',
          },
          {
            type: 'paragraph',
            text: 'Where analytics storage requires consent, you can withdraw it in the console privacy settings or by contacting privacy@sdkwork.com. We honor Global Privacy Control and Do Not Track signals for optional analytics where our deployment supports them.',
          },
        ],
      },
      {
        id: 'third-party-and-updates',
        heading: '6. Third parties and updates',
        blocks: [
          {
            type: 'paragraph',
            text: 'Payment checkout pages may be hosted by a payment processor that sets its own cookies to process the transaction and prevent fraud. Those cookies are active only during checkout and are governed by the processor\'s policy.',
          },
          {
            type: 'paragraph',
            text: 'If a page embeds third-party media or documentation, the embedding provider may set cookies when you interact with the embed. We keep such embeds to a minimum and do not allow advertising networks in the console.',
          },
          {
            type: 'paragraph',
            text: 'We update this policy when the entries or their purposes change. The version and effective date appear at the top of the page. Questions: privacy@sdkwork.com.',
          },
        ],
      },
    ],
  },
  zh: {
    title: 'Cookie 政策',
    summary:
      'Cloud Router 网站、控制台与桌面客户端使用的 Cookie 与浏览器存储条目、使用原因以及清除方式。',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'privacy@sdkwork.com',
    sections: [
      {
        id: 'scope',
        heading: '一、适用范围',
        blocks: [
          {
            type: 'paragraph',
            text: '本 Cookie 政策说明 SDKWork Cloud Router 在您访问网站、登录控制台或使用桌面客户端时如何使用 Cookie、本地存储与会话存储（合称“浏览器存储”）。本政策应与隐私政策一并阅读。',
          },
          {
            type: 'paragraph',
            text: '本文所述条目由 SDKWork 设置。当结算流程、嵌入式播放器或单点登录流程加载第三方框架时，该提供商可能依据其政策设置自有 Cookie，具体见第六条。',
          },
        ],
      },
      {
        id: 'what-we-store',
        heading: '二、Cookie 与浏览器存储',
        blocks: [
          {
            type: 'paragraph',
            text: 'Cookie 是网站存储在浏览器中的小文件，并会随后续请求一并发送。本地存储与会话存储在浏览器中保存键值数据，但不会随每个请求自动发送。',
          },
          {
            type: 'definitions',
            items: [
              {
                term: '严格必要的 Cookie',
                description:
                  '用于路由请求、保护会话安全并记住您的登录状态。缺少这些条目，本服务无法运行。',
              },
              {
                term: '偏好存储',
                description:
                  '在本设备上记住界面语言、主题与强调色等选择。',
              },
              {
                term: '安全存储',
                description:
                  '用于请求完整性校验、滥用防范，以及在会话疑似泄露时将其注销。',
              },
              {
                term: '分析存储',
                description:
                  '可选的产品使用情况聚合统计。除部署运营方在取得必要同意后启用外，默认关闭。',
              },
            ],
          },
        ],
      },
      {
        id: 'categories',
        heading: '三、我们使用的类别',
        blocks: [
          {
            type: 'table',
            columns: ['类别', '用途', '是否需要同意'],
            rows: [
              [
                '严格必要',
                '维持已认证会话，并将控制台与 API 请求路由到正确的工作区。',
                '无需同意；缺少该条目本服务无法运行。',
              ],
              [
                '安全',
                '支持请求完整性校验、滥用检测，以及在疑似泄露后使会话失效。',
                '无需同意；基于我们保护本服务的正当利益。',
              ],
              [
                '偏好',
                '保存语言、主题与布局选择，使界面按您上次的设置打开。',
                '无需同意；您可随时清除这些条目。',
              ],
              [
                '分析',
                '统计功能使用与页面性能的聚合数据，用于改进产品。',
                '在法律或部署政策要求时须取得同意；独立部署默认关闭。',
              ],
            ],
          },
          {
            type: 'callout',
            tone: 'info',
            title: '不使用广告 Cookie',
            text: 'Cloud Router 控制台不使用广告 Cookie、跨站跟踪像素或数据经纪服务。',
          },
        ],
      },
      {
        id: 'browser-storage-inventory',
        heading: '四、我们设置的浏览器存储',
        blocks: [
          {
            type: 'paragraph',
            text: '下表列出 Cloud Router Web 客户端当前使用的条目。随着产品演进，键名可能调整，但类别与用途保持一致。',
          },
          {
            type: 'table',
            columns: ['存储键', '类型', '用途', '有效期'],
            rows: [
              [
                'sdkwork.cloudRouter.appSession.v1',
                '本地存储',
                '保存已登录的控制台会话与工作区上下文，使刷新页面时无需重新登录。',
                '直至退出登录或会话过期。',
              ],
              [
                'user_explicit_lang',
                '本地存储',
                '记住您选择的界面语言。',
                '直至您清除或更改语言。',
              ],
              [
                'i18nextLng',
                '本地存储',
                '缓存翻译运行时解析出的语言。',
                '直至您清除或更改语言。',
              ],
              [
                'cloud-router-theme',
                '本地存储',
                '记住浅色、深色或跟随系统的主题偏好。',
                '直至您清除或更改主题。',
              ],
              [
                'cloud-router-theme-color',
                '本地存储',
                '记住强调色偏好。',
                '直至您清除或更改强调色。',
              ],
              [
                '身份主机会话 Cookie',
                'HttpOnly Cookie',
                '在启用基于 Cookie 的会话交换时由单点登录主机设置；仅承载已认证会话引用，不包含您的密码。',
                '会话期间，或至配置的会话有效期结束。',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: '会话存储条目是临时的，仅作用于单个浏览器标签页，并在标签页关闭时清除，用于保存进行中的表单与导航状态。',
          },
        ],
      },
      {
        id: 'managing-preferences',
        heading: '五、管理与清除浏览器存储',
        blocks: [
          {
            type: 'paragraph',
            text: '您可以在浏览器设置中管理 Cookie 与浏览器存储。大多数浏览器支持查看已存储条目、删除单条数据、阻止第三方 Cookie，以及在关闭窗口时清除全部数据。',
          },
          {
            type: 'paragraph',
            text: '清除严格必要的条目会使您退出登录，并可能中断进行中的请求。清除偏好条目会将界面重置为默认值，您可在控制台中重新设置。',
          },
          {
            type: 'paragraph',
            text: '在分析存储需要同意的场景下，您可在控制台隐私设置中撤回，或联系 privacy@sdkwork.com。在部署支持的情况下，我们会遵循 Global Privacy Control 与 Do Not Track 信号处理可选分析。',
          },
        ],
      },
      {
        id: 'third-party-and-updates',
        heading: '六、第三方与政策更新',
        blocks: [
          {
            type: 'paragraph',
            text: '支付结算页面可能由支付处理商托管，该处理商会设置自有 Cookie 以处理交易并防范欺诈。这些 Cookie 仅在结算期间生效，并受该处理商政策约束。',
          },
          {
            type: 'paragraph',
            text: '如页面嵌入第三方媒体或文档，嵌入提供商可能在您与嵌入内容交互时设置 Cookie。我们会尽量减少此类嵌入，且不允许广告网络进入控制台。',
          },
          {
            type: 'paragraph',
            text: '当存储条目或用途发生变化时，我们会更新本政策。版本与生效日期显示在页面顶部。如有疑问，请联系 privacy@sdkwork.com。',
          },
        ],
      },
    ],
  },
};
