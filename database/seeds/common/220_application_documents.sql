-- sdkwork:seed
-- 220_application_documents.sql - BirdCoder application policies and support pages.
-- Idempotent: stable ids plus the (tenant, app, locale, slug) unique index keep re-runs safe.
-- Published rows resolve at /docs/{slug} on the first boot of a fresh installation.

INSERT INTO documents_document
  (id, tenant_id, app_key, slug, locale, title, summary, body, category, sort_order, status, published_at)
VALUES
  ('3f1c2a7e-5b84-4c61-9e2a-8d7f4b1c6a10', 100001, 'sdkwork-birdcoder2', 'privacy', 'zh-CN',
   '隐私政策',
   '说明 BirdCoder 如何收集、使用、保护与共享信息。',
   '<h2>适用范围</h2><p>本政策适用于 BirdCoder 的桌面客户端、网页控制台、公开 API 与生成的 SDK。企业独立部署时，运营方是数据处理者，SDKWork 仅作为受托处理方。</p><h2>我们收集的信息</h2><ul><li>账户与身份：姓名、邮箱、手机号、组织与租户标识、角色。</li><li>认证与安全：登录时间、会话标识、IP 地址、设备类型与安全事件。</li><li>使用与账单：套餐、额度、发票与脱敏后的支付方式。</li><li>API 与模型调用元数据：请求标识、所选模型、Token 数量、时延与错误码。</li><li>您提交的提示词、生成结果、文件与支持沟通内容。</li></ul><h2>使用目的与法律基础</h2><p>我们为提供与运营服务、认证与路由、计量与计费、安全与反滥用、客户支持与合规而处理数据，依据合同履行、正当利益、您的同意及法律义务。</p><h2>提示词与模型提供商</h2><p>请求内容会传输至您选择的模型提供商，并受其条款约束。SDKWork 不会使用您的提示词或生成结果训练基础模型，不会出售，也不会向其他客户披露。持久化请求日志默认关闭。</p><h2>共享与次级处理者</h2><p>我们仅与托管、支付、通信、安全及模型提供商等次级处理者共享必要数据，并签署数据处理协议。我们不出售个人数据。</p><h2>保留与安全</h2><p>账户数据在账户存续期间保留，注销后 30 天内删除；API 元数据默认保留 30 天；安全审计事件保留 180 天；账单记录按税法要求保留 7 年。我们使用 TLS、静态加密、密钥前缀展示、最小权限与操作审计保护数据。</p><h2>您的权利</h2><p>您可以通过 privacy@birdcoder.com 请求访问、更正、删除、导出或限制处理，我们将在 30 天内回复。您也可以向当地数据保护主管机关投诉。</p><h2>变更与联系方式</h2><p>重大变更会在生效前至少 30 天通过控制台或邮件通知。联系方式：privacy@birdcoder.com。</p>',
   'policy', 10, 'published', NOW()),

  ('9a2d6e4b-1c7f-4b83-a5d2-6e9f3c8b7a21', 100001, 'sdkwork-birdcoder2', 'privacy', 'en-US',
   'Privacy Policy',
   'How BirdCoder collects, uses, protects, and shares information.',
   '<h2>Scope</h2><p>This policy covers the BirdCoder desktop client, web console, public API, and generated SDKs. For standalone deployments the operator is the data controller and SDKWork acts as a processor.</p><h2>Information we collect</h2><ul><li>Account and identity: name, email, phone, organization and tenant identifiers, role.</li><li>Authentication and security: sign-in time, session identifier, IP address, device type, security events.</li><li>Usage and billing: plan, credits, invoices, masked payment method.</li><li>API and model call metadata: request identifier, selected model, token counts, latency, error codes.</li><li>Prompts, completions, files, and support communications you submit.</li></ul><h2>Purposes and legal bases</h2><p>We process data to provide and operate the service, authenticate and route requests, meter and bill usage, prevent abuse, support customers, and meet legal obligations, based on contract performance, legitimate interests, consent, and legal duties.</p><h2>Prompts and model providers</h2><p>Request content is transmitted to the model provider you select and is governed by that provider terms. SDKWork does not use your prompts or completions to train foundation models, does not sell them, and does not disclose them to other customers. Persistent request logging is off by default.</p><h2>Sharing and subprocessors</h2><p>We share only the data needed with hosting, payment, communications, security, and model provider subprocessors under data processing agreements. We do not sell personal data.</p><h2>Retention and security</h2><p>Account data is kept while the account is active and deleted within 30 days after closure. API metadata is kept for 30 days by default, security audit events for 180 days, and billing records for 7 years where tax law requires. We protect data with TLS, encryption at rest, prefix-only API keys, least-privilege access, and administrative audit logs.</p><h2>Your rights</h2><p>You may request access, correction, deletion, export, or restriction at privacy@birdcoder.com. We respond within 30 days, and you may also complain to your local data protection authority.</p><h2>Changes and contact</h2><p>We give at least 30 days notice of material changes through the console or email. Contact: privacy@birdcoder.com.</p>',
   'policy', 10, 'published', NOW()),

  ('4b8e1d3f-7a52-4c96-b3e1-2f6d9a5c8b32', 100001, 'sdkwork-birdcoder2', 'terms', 'zh-CN',
   '服务条款',
   '您与 SDKWork 之间关于访问和使用 BirdCoder 的协议。',
   '<h2>条款的接受</h2><p>创建账户、调用 API 或以其他方式使用本服务，即表示您同意本条款。企业客户以签署的订单、企业协议或数据处理协议为准。</p><h2>账户与资格</h2><p>本服务面向商业用户。您须年满 16 周岁，提供准确信息，妥善保管凭据，并对使用您凭据产生的活动负责。</p><h2>可接受使用</h2><ul><li>不得用于违法、欺诈、骚扰或传播恶意软件。</li><li>不得未经授权访问系统、绕过限流与配额，或逆向工程本服务。</li><li>不得违反所选模型提供商的使用政策。</li></ul><h2>许可证与知识产权</h2><p>您保留输入与输出的所有权，但须遵守适用法律与模型提供商条款。SDKWork 拥有本服务、软件、文档与商标。我们授予您一项非独占、不可转让的许可，用于在许可范围内使用客户端与 SDK。</p><h2>第三方模型</h2><p>模型由第三方提供商运营，其可用性、价格与输出质量可能变化。生成结果可能不准确，依赖前请自行审核。</p><h2>费用</h2><p>API 密钥属于机密凭据，请勿放入客户端代码或公开仓库。您对密钥产生的用量与费用负责。额度为预付，除法律要求或书面同意外不予退款。</p><h2>终止与责任</h2><p>您可随时停止使用。如您重大违约、欠费或造成安全风险，我们可暂停或终止访问。除法律禁止限制的情形外，我们的累计责任以索赔前 12 个月您支付的费用为限。</p><h2>联系方式</h2><p>条款问题请联系 legal@birdcoder.com。</p>',
   'policy', 20, 'published', NOW()),

  ('c7d3a9f2-6e41-4b8d-9a5c-1f7e2d6b4a43', 100001, 'sdkwork-birdcoder2', 'terms', 'en-US',
   'Terms of Service',
   'The agreement between you and SDKWork for access to BirdCoder.',
   '<h2>Acceptance</h2><p>By creating an account, calling the API, or otherwise using the service, you agree to these terms. A signed order form, enterprise agreement, or data processing agreement controls where it conflicts.</p><h2>Accounts and eligibility</h2><p>The service is for business use. You must be at least 16 years old, provide accurate information, protect your credentials, and remain responsible for activity under them.</p><h2>Acceptable use</h2><ul><li>Do not use the service for unlawful activity, fraud, harassment, or malware.</li><li>Do not access systems without authorization, bypass rate limits or quotas, or reverse engineer the service.</li><li>Do not violate the usage policies of the model provider you select.</li></ul><h2>License and intellectual property</h2><p>You retain ownership of input and output subject to applicable law and model provider terms. SDKWork owns the service, software, documentation, and trademarks, and grants you a non-exclusive, non-transferable license to use the client and SDKs within the permitted scope.</p><h2>Third-party models</h2><p>Models are operated by third-party providers, and availability, pricing, and output quality may change. Generated output may be inaccurate, so review it before relying on it.</p><h2>Fees</h2><p>API keys are confidential. Keep them out of client code and public repositories. You are responsible for usage and charges under your keys. Credits are prepaid and non-refundable except where law or a written agreement requires.</p><h2>Termination and liability</h2><p>You may stop using the service at any time. We may suspend or terminate access for material breach, non-payment, or security risk. To the extent permitted by law, our aggregate liability is limited to the fees you paid in the 12 months before the claim.</p><h2>Contact</h2><p>Questions about these terms: legal@birdcoder.com.</p>',
   'policy', 20, 'published', NOW()),

  ('5e9f2b4a-8c63-4d17-9b2e-3a7c1f6d8e54', 100001, 'sdkwork-birdcoder2', 'support', 'zh-CN',
   '支持',
   'BirdCoder 的帮助渠道、响应时效与问题提交指引。',
   '<h2>获取帮助</h2><p>遇到安装、登录、模型调用或客户端异常时，请先查看文档中心的常见问题；仍未解决可通过 support@birdcoder.com 联系我们。</p><h2>提交问题时请包含</h2><ul><li>BirdCoder 版本、操作系统与安装方式。</li><li>租户与已注册 App ID（关于页可复制）。</li><li>发生时间、复现步骤、预期结果与实际结果。</li><li>错误码或日志片段（请先移除令牌、密钥与个人数据）。</li></ul><h2>响应时效</h2><p>工作日内 24 小时首次响应；影响多人使用的故障优先处理。企业客户按合同中约定的服务级别执行。</p><h2>安全与隐私</h2><p>请勿在工单中发送访问令牌、API 密钥或完整对话内容。安全漏洞请发送至 security@birdcoder.com。</p><h2>服务状态与更新</h2><p>版本发布说明与计划内维护会通过控制台公告与邮件通知。联系方式：support@birdcoder.com。</p>',
   'support', 5, 'published', NOW()),

  ('d2a7c5e9-3f84-4b6a-8c1d-5e9f2a7b6c65', 100001, 'sdkwork-birdcoder2', 'support', 'en-US',
   'Support',
   'How to reach BirdCoder support, expected response times, and what to include.',
   '<h2>Getting help</h2><p>For installation, sign-in, model, or client issues, check the document center FAQ first. If the problem remains, contact support@birdcoder.com.</p><h2>Include in your request</h2><ul><li>BirdCoder version, operating system, and installation method.</li><li>Tenant and registered app ID (copy them from the About page).</li><li>Time of occurrence, reproduction steps, expected and actual results.</li><li>Error codes or log excerpts with tokens, keys, and personal data removed.</li></ul><h2>Response times</h2><p>First response within 24 hours on business days; multi-user outages are prioritized. Enterprise customers follow the service levels in their agreement.</p><h2>Security and privacy</h2><p>Do not include access tokens, API keys, or full conversation content in a ticket. Report security issues to security@birdcoder.com.</p><h2>Status and updates</h2><p>Release notes and planned maintenance are announced in the console and by email. Contact: support@birdcoder.com.</p>',
   'support', 5, 'published', NOW())
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
