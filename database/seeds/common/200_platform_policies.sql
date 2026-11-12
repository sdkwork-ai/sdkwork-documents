-- sdkwork:seed
-- 200_platform_policies.sql - bootstrap document center policies for the platform tenant.
-- Idempotent: stable ids plus the (tenant, app, locale, slug) unique index keep re-runs safe.

INSERT INTO documents_document
  (id, tenant_id, app_key, slug, locale, title, summary, body, category, sort_order, status, published_at)
VALUES
  ('ff83d635-2b98-494d-93aa-ff09cc346329', 100001, 'sdkwork-cloudrouter', 'privacy-policy', 'zh-CN',
   '隐私政策',
   '说明 SDKWork Cloud Router 如何收集、使用、保护与共享信息。',
   '<h2>适用范围</h2><p>本政策适用于 SDKWork Cloud Router 的网站、Web 控制台、桌面客户端、公开 API 与生成的 SDK。企业独立部署时，运营方是数据控制者，SDKWork 仅作为处理者。</p><h2>我们收集的信息</h2><ul><li>账户与身份信息：姓名、邮箱、手机号、组织与租户标识、角色。</li><li>认证与安全信息：登录时间、会话标识、IP 地址、设备类型与安全事件。</li><li>账单与交易信息：套餐、积分、发票与脱敏后的支付方式。</li><li>API 使用与路由元数据：请求标识、所选模型、Token 数量、时延与错误码。</li><li>您提交的提示词、生成结果、文件与支持沟通内容。</li></ul><h2>使用目的与法律基础</h2><p>我们为提供与运营服务、认证与路由、计量与计费、安全与反滥用、支持与合规而处理数据，依据履行合同、正当利益、您的同意及法律义务。</p><h2>提示词与模型提供商</h2><p>请求内容会传输至您选择的模型提供商，并受其条款约束。SDKWork 不会使用您的提示词或生成结果训练基础模型，不会出售，也不会向其他客户披露。持久化请求日志默认关闭。</p><h2>共享与次级处理者</h2><p>我们仅与托管、支付、通信、安全及模型提供商等次级处理者共享必要数据，并签署数据处理协议。我们不会出售个人数据。</p><h2>保留与安全</h2><p>账户数据在账户存续期间保留，删除后 30 天内清除；API 元数据默认保留 30 天；安全审计事件保留 180 天；账单记录按税法要求保留 7 年。我们使用 TLS、静态加密、密钥前缀展示、最小权限与操作审计保护数据。</p><h2>您的权利</h2><p>您可以通过 privacy@sdkwork.com 请求访问、更正、删除、导出或限制处理，我们将在 30 天内回复。您也可以向当地数据保护主管机关投诉。</p><h2>变更与联系方式</h2><p>重大变更会在生效前至少 30 天通过控制台或邮件通知。联系方式：privacy@sdkwork.com。</p>',
   'policy', 10, 'published', NOW()),

  ('8c0370ca-3400-4b61-b1f8-2bc361a88f6d', 100001, 'sdkwork-cloudrouter', 'privacy-policy', 'en-US',
   'Privacy Policy',
   'How SDKWork Cloud Router collects, uses, protects, and shares information.',
   '<h2>Scope</h2><p>This policy covers the SDKWork Cloud Router website, web console, desktop clients, public API, and generated SDKs. For standalone deployments the operator is the data controller and SDKWork acts as a processor.</p><h2>Information we collect</h2><ul><li>Account and identity: name, email, phone, organization and tenant identifiers, role.</li><li>Authentication and security: sign-in time, session identifier, IP address, device type, security events.</li><li>Billing and transactions: plan, credits, invoices, masked payment method.</li><li>API usage and routing metadata: request identifier, selected model, token counts, latency, error codes.</li><li>Prompts, completions, files, and support communications you submit.</li></ul><h2>Purposes and legal bases</h2><p>We process data to provide and operate the service, authenticate and route requests, meter and bill usage, prevent abuse, support customers, and meet legal obligations, based on contract performance, legitimate interests, consent, and legal duties.</p><h2>Prompts and model providers</h2><p>Request content is transmitted to the model provider you select and is governed by that provider terms. SDKWork does not use your prompts or completions to train foundation models, does not sell them, and does not disclose them to other customers. Persistent request logging is off by default.</p><h2>Sharing and subprocessors</h2><p>We share only the data needed with hosting, payment, communications, security, and model provider subprocessors under data processing agreements. We do not sell personal data.</p><h2>Retention and security</h2><p>Account data is kept while the account is active and deleted within 30 days after closure. API metadata is kept for 30 days by default, security audit events for 180 days, and billing records for 7 years where tax law requires. We protect data with TLS, encryption at rest, prefix-only API keys, least-privilege access, and administrative audit logs.</p><h2>Your rights</h2><p>You may request access, correction, deletion, export, or restriction at privacy@sdkwork.com. We respond within 30 days, and you may also complain to your local data protection authority.</p><h2>Changes and contact</h2><p>We give at least 30 days notice of material changes through the console or email. Contact: privacy@sdkwork.com.</p>',
   'policy', 10, 'published', NOW()),

  ('1696ff26-5dd9-411b-9f01-a7e8a98189df', 100001, 'sdkwork-cloudrouter', 'terms-of-service', 'zh-CN',
   '服务条款',
   '您与 SDKWork 之间关于访问和使用 Cloud Router 的协议。',
   '<h2>条款的接受</h2><p>创建账户、调用 API 或以其他方式使用本服务，即表示您同意本条款。企业客户以签署的订单、企业协议或数据处理协议为准。</p><h2>账户与资格</h2><p>本服务面向商业用户。您须年满 16 周岁，提供准确信息，妥善保管凭据，并对使用您凭据产生的活动负责。</p><h2>可接受使用</h2><ul><li>不得用于违法、欺诈、骚扰或传播恶意软件。</li><li>不得未经授权访问系统、绕过限流与配额，或逆向工程本服务。</li><li>不得违反所选模型提供商的使用政策。</li></ul><h2>API 密钥与费用</h2><p>API 密钥属于机密凭据，请勿放入客户端代码或公开仓库。您对密钥产生的用量与费用负责。积分属于预付余额，除法律要求或书面同意外不予退款。</p><h2>第三方模型</h2><p>模型由第三方提供商运营，其可用性、价格与输出质量可能变化。生成结果可能不准确，请在依赖前自行审核。</p><h2>知识产权</h2><p>您保留输入与输出的所有权，但须遵守适用法律与模型提供商条款。SDKWork 拥有本服务、软件、文档与商标。</p><h2>终止与责任</h2><p>您可随时停止使用。如您重大违约、欠费或造成安全风险，我们可暂停或终止访问。除法律禁止限制的情形外，我们的累计责任以索赔前 12 个月您支付的费用为限。</p><h2>联系方式</h2><p>条款问题请联系 legal@sdkwork.com。</p>',
   'policy', 20, 'published', NOW()),

  ('69f74d29-42e1-401d-a0a5-d0f74963a535', 100001, 'sdkwork-cloudrouter', 'terms-of-service', 'en-US',
   'Terms of Service',
   'The agreement between you and SDKWork for access to Cloud Router.',
   '<h2>Acceptance</h2><p>By creating an account, calling the API, or otherwise using the service, you agree to these terms. A signed order form, enterprise agreement, or data processing agreement controls where it conflicts.</p><h2>Accounts and eligibility</h2><p>The service is for business use. You must be at least 16 years old, provide accurate information, protect your credentials, and remain responsible for activity under them.</p><h2>Acceptable use</h2><ul><li>Do not use the service for unlawful activity, fraud, harassment, or malware.</li><li>Do not access systems without authorization, bypass rate limits or quotas, or reverse engineer the service.</li><li>Do not violate the usage policies of the model provider you select.</li></ul><h2>API keys and fees</h2><p>API keys are confidential. Keep them out of client code and public repositories. You are responsible for usage and charges under your keys. Credits are prepaid and non-refundable except where law or a written agreement requires.</p><h2>Third-party models</h2><p>Models are operated by third-party providers, and availability, pricing, and output quality may change. Generated output may be inaccurate, so review it before relying on it.</p><h2>Intellectual property</h2><p>You retain ownership of input and output subject to applicable law and model provider terms. SDKWork owns the service, software, documentation, and trademarks.</p><h2>Termination and liability</h2><p>You may stop using the service at any time. We may suspend or terminate access for material breach, non-payment, or security risk. To the extent permitted by law, our aggregate liability is limited to the fees you paid in the 12 months before the claim.</p><h2>Contact</h2><p>Questions about these terms: legal@sdkwork.com.</p>',
   'policy', 20, 'published', NOW()),

  ('a173f110-8b43-4b91-b3bf-9769f1947deb', 100001, 'sdkwork-cloudrouter', 'cookie-policy', 'zh-CN',
   'Cookie 政策',
   'Cloud Router 使用的 Cookie 与浏览器存储条目及清除方式。',
   '<h2>Cookie 与浏览器存储</h2><p>我们使用少量 Cookie 与浏览器存储维持登录、记住偏好并保护请求安全。控制台不使用广告 Cookie 或跨站跟踪像素。</p><h2>类别</h2><ul><li>严格必要：维持已认证会话，缺少时服务无法运行。</li><li>安全：请求完整性、滥用检测与会话失效。</li><li>偏好：语言、主题与布局选择。</li><li>分析：可选的产品使用统计，独立部署默认关闭。</li></ul><h2>当前使用的条目</h2><ul><li>sdkwork.cloudRouter.appSession.v1：本地存储，保存已登录会话，退出或过期时清除。</li><li>user_explicit_lang：本地存储，记住界面语言。</li><li>i18nextLng：本地存储，缓存翻译运行时语言。</li><li>cloud-router-theme：本地存储，记住主题偏好。</li><li>cloud-router-theme-color：本地存储，记住强调色偏好。</li><li>身份主机会话 Cookie：HttpOnly，启用单点登录时由身份主机设置。</li></ul><h2>管理</h2><p>您可以在浏览器设置中查看、删除或阻止这些条目。清除严格必要条目会使您退出登录并可能中断进行中的请求。</p><h2>更新与联系方式</h2><p>当条目或用途变化时我们会更新本政策。联系方式：privacy@sdkwork.com。</p>',
   'policy', 30, 'published', NOW()),

  ('e6afad7a-111d-4f77-afb9-8a5ecdef04a7', 100001, 'sdkwork-cloudrouter', 'cookie-policy', 'en-US',
   'Cookie Policy',
   'The cookies and browser storage entries used by Cloud Router, and how to remove them.',
   '<h2>Cookies and browser storage</h2><p>We use a small number of cookies and browser storage entries to keep you signed in, remember preferences, and protect requests. The console does not use advertising cookies or cross-site tracking pixels.</p><h2>Categories</h2><ul><li>Strictly necessary: maintains the authenticated session; the service cannot run without it.</li><li>Security: request integrity, abuse detection, and session invalidation.</li><li>Preferences: language, theme, and layout choices.</li><li>Analytics: optional aggregated usage measurement, off by default in standalone deployments.</li></ul><h2>Entries we currently set</h2><ul><li>sdkwork.cloudRouter.appSession.v1: local storage, signed-in session, cleared on sign-out or expiry.</li><li>user_explicit_lang: local storage, interface language.</li><li>i18nextLng: local storage, translation runtime language cache.</li><li>cloud-router-theme: local storage, theme preference.</li><li>cloud-router-theme-color: local storage, accent color preference.</li><li>Identity host session cookie: HttpOnly, set by the identity host when single sign-on is enabled.</li></ul><h2>Managing entries</h2><p>You can view, delete, or block these entries in your browser settings. Removing strictly necessary entries signs you out and may interrupt an in-progress request.</p><h2>Updates and contact</h2><p>We update this policy when entries or purposes change. Contact: privacy@sdkwork.com.</p>',
   'policy', 30, 'published', NOW())
ON CONFLICT (tenant_id, app_key, locale, slug) WHERE slug IS NOT NULL
DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  sort_order = EXCLUDED.sort_order,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = NOW();
