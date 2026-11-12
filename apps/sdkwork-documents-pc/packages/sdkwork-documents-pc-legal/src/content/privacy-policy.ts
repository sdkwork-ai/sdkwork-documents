import type { LegalDocumentContent } from '../legal-document.ts';

export const privacyPolicyContent: LegalDocumentContent = {
  en: {
    title: 'Privacy Policy',
    summary:
      'How SDKWork Cloud Router collects, uses, protects, and shares information when you use our websites, web console, APIs, SDKs, and desktop applications.',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'privacy@sdkwork.com',
    sections: [
      {
        id: 'scope',
        heading: '1. Scope and who is responsible',
        blocks: [
          {
            type: 'paragraph',
            text: 'This Privacy Policy explains how SDKWork Cloud Router (the "Service") handles personal data. It applies to the Cloud Router website, the web console and desktop clients, the public API and generated SDKs, and the documentation and support channels that link to this policy.',
          },
          {
            type: 'paragraph',
            text: 'SDKWork is the data controller for account and usage data processed through the SDKWork-hosted cloud service. When an organization runs Cloud Router in a standalone or customer-owned deployment, that organization is the controller and SDKWork processes data only as its processor under the applicable data processing agreement.',
          },
          {
            type: 'paragraph',
            text: 'A customer organization that administers a workspace may access and manage the accounts, API keys, usage records, and billing details of its members. Contact your workspace administrator first for requests about data held in that workspace.',
          },
          {
            type: 'callout',
            tone: 'info',
            title: 'In short',
            text: 'We do not sell personal data, and we do not use your prompts or completions to train SDKWork models.',
          },
        ],
      },
      {
        id: 'data-we-collect',
        heading: '2. Information we collect',
        blocks: [
          {
            type: 'paragraph',
            text: 'We collect the categories below. Which categories apply to you depends on how you use the Service, such as browsing the public site, signing in to the console, calling the API, or contacting support.',
          },
          {
            type: 'table',
            columns: ['Category', 'Examples', 'Why we process it'],
            rows: [
              [
                'Account and identity',
                'Name, email address, phone number, password hash, organization and tenant identifiers, role, locale',
                'Create and secure your account, authenticate sign-in, and apply workspace permissions',
              ],
              [
                'Authentication and security',
                'Sign-in time, session identifier, IP address, browser and device type, multi-factor status, security events',
                'Protect accounts, detect fraud and abuse, and investigate security incidents',
              ],
              [
                'Billing and transactions',
                'Plan, credit balance, invoices, tax identifiers, masked payment method, transaction history',
                'Charge for paid features, issue invoices, and meet accounting obligations',
              ],
              [
                'API usage and routing metadata',
                'API key prefix, request identifier, selected model, token counts, latency, HTTP status, error codes, timestamps',
                'Route requests, meter usage, enforce quotas, bill accurately, and diagnose failures',
              ],
              [
                'Request and response content',
                'Prompts, completions, uploaded files, and tool inputs you send through the API or playground',
                'Deliver the inference result you requested and route it to the model provider you selected',
              ],
              [
                'Support and communications',
                'Messages, attachments, and contact details you provide to support or sales',
                'Answer your request and keep a record of the conversation',
              ],
              [
                'Cookies and browser storage',
                'Session and preference entries described in the Cookie Policy',
                'Keep you signed in, remember interface preferences, and secure requests',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: 'We also collect aggregated and de-identified statistics, such as total request volume by model family, that cannot reasonably be used to identify a person.',
          },
          {
            type: 'paragraph',
            text: 'Some fields are optional, such as a phone number used only for verification or account recovery. You can decline optional fields, but a feature that depends on one may then be unavailable.',
          },
        ],
      },
      {
        id: 'how-we-use-data',
        heading: '3. How we use information',
        blocks: [
          {
            type: 'paragraph',
            text: 'We use personal data for the following purposes:',
          },
          {
            type: 'bulletList',
            items: [
              'Provide, operate, and maintain the Service, including authentication, request routing, usage metering, and billing.',
              'Protect the Service and our users by detecting abuse, enforcing rate limits, preventing fraud, and responding to security incidents.',
              'Respond to support, sales, and privacy requests, and send service messages such as security alerts, invoice notices, and material policy changes.',
              'Improve reliability and product quality using aggregated usage statistics and diagnostic data. We do not use your prompt or completion content for this purpose unless a workspace explicitly opts in to request logging.',
              'Comply with applicable law, enforce our Terms of Service, and establish, exercise, or defend legal claims.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Where data protection law requires a legal basis, we rely on performance of our contract with you, our legitimate interests in operating and securing the Service, your consent where we ask for it, and compliance with legal obligations. You can withdraw consent at any time, without affecting processing that already took place.',
          },
        ],
      },
      {
        id: 'prompts-and-model-routing',
        heading: '4. Prompts, completions, and model providers',
        blocks: [
          {
            type: 'paragraph',
            text: 'Cloud Router is a routing layer. When you call a model, your request content is transmitted to the model provider that serves the selected model. That provider processes the content under its own terms and privacy policy, and some providers retain data for abuse monitoring or model improvement according to their settings.',
          },
          {
            type: 'paragraph',
            text: 'SDKWork does not use your prompts or completions to train foundation models, does not sell them, and does not disclose them to other customers. Content passes through the gateway in memory to complete the request. Persistent request logging is off by default and can be enabled per workspace by an administrator for debugging or audit purposes.',
          },
          {
            type: 'paragraph',
            text: 'Where a provider offers a zero-retention or enterprise data-processing mode, the gateway selects it for workspace configurations that require it. Availability depends on the provider and the model.',
          },
          {
            type: 'callout',
            tone: 'important',
            title: 'Avoid sensitive data in prompts',
            text: 'Do not submit passwords, payment card numbers, government identifiers, health data, or other sensitive personal data in prompts unless your agreement with SDKWork explicitly covers that use case.',
          },
        ],
      },
      {
        id: 'cookies-and-local-storage',
        heading: '5. Cookies and browser storage',
        blocks: [
          {
            type: 'paragraph',
            text: 'We use a small number of cookies and browser storage entries to keep you signed in, remember interface preferences, and protect requests. The Cookie Policy lists the entries we currently set, their purpose, and how to remove them.',
          },
          {
            type: 'paragraph',
            text: 'We do not use advertising cookies or cross-site tracking pixels in the Cloud Router console.',
          },
        ],
      },
      {
        id: 'sharing-and-subprocessors',
        heading: '6. Sharing and subprocessors',
        blocks: [
          {
            type: 'paragraph',
            text: 'We share personal data only as described below, and we never sell it.',
          },
          {
            type: 'definitions',
            items: [
              {
                term: 'Hosting and infrastructure providers',
                description:
                  'Operate the servers, databases, object storage, and content delivery that run the Service, under data processing agreements.',
              },
              {
                term: 'Payment processors',
                description:
                  'Process card, wallet, and bank transactions. We receive a token and transaction status, not your full card number.',
              },
              {
                term: 'Model providers',
                description:
                  'Receive request content to produce the completion you requested, as described in section 4.',
              },
              {
                term: 'Communications and support tools',
                description:
                  'Deliver transactional email and help us answer support requests.',
              },
              {
                term: 'Security and observability providers',
                description:
                  'Detect abuse, monitor availability, and store security logs with access limited to authorized personnel.',
              },
              {
                term: 'Professional advisers and authorities',
                description:
                  'Receive data when required by law, legal process, or a binding order, or when necessary to protect rights, safety, and the integrity of the Service.',
              },
              {
                term: 'A successor entity',
                description:
                  'If we are involved in a merger, acquisition, or sale of assets, data may transfer subject to this policy and applicable law.',
              },
            ],
          },
          {
            type: 'paragraph',
            text: 'A current list of subprocessors is available from your account team or on request at privacy@sdkwork.com. We give customers a reasonable opportunity to object before adding a subprocessor that processes customer content.',
          },
        ],
      },
      {
        id: 'international-transfers',
        heading: '7. International transfers and data residency',
        blocks: [
          {
            type: 'paragraph',
            text: 'SDKWork operates globally. Account, billing, and usage data may be processed in the region you select for your workspace and in the regions where our infrastructure and support teams operate.',
          },
          {
            type: 'paragraph',
            text: 'When data moves out of the European Economic Area, the United Kingdom, or Switzerland, we rely on an adequacy decision or the standard contractual clauses together with supplementary safeguards. Customers can request a copy of the applicable safeguards from privacy@sdkwork.com.',
          },
          {
            type: 'paragraph',
            text: 'Standalone and customer-owned deployments keep tenant data inside the infrastructure the operator provides. In that mode SDKWork receives only the operational telemetry the operator chooses to send.',
          },
        ],
      },
      {
        id: 'retention',
        heading: '8. Retention',
        blocks: [
          {
            type: 'paragraph',
            text: 'We keep personal data only for as long as needed for the purposes described above, then delete or de-identify it. Retention periods are summarized below and may be shorter where a workspace configures a stricter policy.',
          },
          {
            type: 'table',
            columns: ['Data', 'Default retention'],
            rows: [
              ['Account and profile data', 'While the account is active and for 30 days after deletion'],
              ['API usage and routing metadata', '30 days, configurable by the workspace between 7 and 90 days'],
              ['Request logs enabled by a workspace', 'Per the workspace setting, up to 30 days'],
              ['Security and audit events', '180 days, or longer when required for an investigation'],
              ['Billing records and invoices', '7 years where required by tax and accounting law'],
              ['Support conversations', '24 months after the case is closed'],
              ['Backups', '35 days on a rolling cycle'],
            ],
          },
          {
            type: 'paragraph',
            text: 'When you delete content, copies leave the active system immediately and are removed from backups as the backup cycle expires. Records we must keep for legal or accounting reasons are restricted to that purpose.',
          },
        ],
      },
      {
        id: 'security',
        heading: '9. Security',
        blocks: [
          {
            type: 'paragraph',
            text: 'We protect data with encryption in transit using TLS 1.2 or later, encryption at rest for stored data, hashed API keys that are displayed only by prefix after creation, least-privilege access for personnel, and auditing of administrative actions.',
          },
          {
            type: 'paragraph',
            text: 'Our engineering practices include mandatory code review, dependency and vulnerability scanning, isolated environments, and an incident response process. No system is completely secure, so protect your API keys and report suspected compromise to security@sdkwork.com.',
          },
          {
            type: 'paragraph',
            text: 'If a security incident affects your personal data, we notify you and the competent authority without undue delay and, where the law requires it, within 72 hours of becoming aware of the incident.',
          },
        ],
      },
      {
        id: 'your-rights',
        heading: '10. Your rights',
        blocks: [
          {
            type: 'paragraph',
            text: 'Depending on your location, you may have the right to access, correct, delete, export, restrict, or object to the processing of your personal data, and to withdraw consent.',
          },
          {
            type: 'paragraph',
            text: 'Signed-in users can update profile details and end active sessions in the console. To exercise other rights, email privacy@sdkwork.com. We verify your identity before acting, respond within 30 days, and explain any lawful exception we apply. You may also authorize an agent to submit a request on your behalf.',
          },
          {
            type: 'paragraph',
            text: 'If your workspace administrator controls your account, we forward the request to that administrator. You always have the right to complain to your local data protection authority.',
          },
        ],
      },
      {
        id: 'children',
        heading: '11. Children',
        blocks: [
          {
            type: 'paragraph',
            text: 'The Service is intended for organizations and business users and is not directed to children. We do not knowingly collect personal data from anyone under 16, or under the higher minimum age set by local law. If you believe a child provided personal data, contact privacy@sdkwork.com and we will delete it.',
          },
        ],
      },
      {
        id: 'changes-and-contact',
        heading: '12. Changes and contact',
        blocks: [
          {
            type: 'paragraph',
            text: 'We update this policy when our practices or the law change. The version, effective date, and last-updated date appear at the top of the page. For material changes we provide notice in the console or by email at least 30 days before the change takes effect, unless an earlier change is required by law.',
          },
          {
            type: 'paragraph',
            text: 'Questions, requests, and complaints: privacy@sdkwork.com. Security reports: security@sdkwork.com. Where local law requires a representative in your region, the representative is identified in the regional addendum provided with your order form.',
          },
        ],
      },
    ],
  },
  zh: {
    title: '隐私政策',
    summary:
      '本政策说明您在使用 SDKWork Cloud Router 的网站、Web 控制台、API、SDK 与桌面应用时，我们如何收集、使用、保护与共享信息。',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'privacy@sdkwork.com',
    sections: [
      {
        id: 'scope',
        heading: '一、适用范围与责任主体',
        blocks: [
          {
            type: 'paragraph',
            text: '本隐私政策说明 SDKWork Cloud Router（以下简称“本服务”）如何处理个人数据。本政策适用于 Cloud Router 网站、Web 控制台与桌面客户端、公开 API 与生成的 SDK，以及链接到本政策的文档与支持渠道。',
          },
          {
            type: 'paragraph',
            text: '对于通过 SDKWork 托管的云服务处理的账户数据与使用数据，SDKWork 是数据控制者。当组织以独立部署或客户自有环境运行 Cloud Router 时，该组织是数据控制者，SDKWork 仅依据适用的数据处理协议作为其处理者处理数据。',
          },
          {
            type: 'paragraph',
            text: '管理某个工作区的客户组织可以访问并管理其成员的账户、API 密钥、使用记录与账单信息。如您希望查询该工作区内的数据，请先联系工作区管理员。',
          },
          {
            type: 'callout',
            tone: 'info',
            title: '简要说明',
            text: '我们不会出售个人数据，也不会使用您的提示词或生成结果训练 SDKWork 模型。',
          },
        ],
      },
      {
        id: 'data-we-collect',
        heading: '二、我们收集的信息',
        blocks: [
          {
            type: 'paragraph',
            text: '我们收集以下类别的信息。具体适用哪些类别取决于您使用本服务的方式，例如浏览公开网站、登录控制台、调用 API 或联系支持团队。',
          },
          {
            type: 'table',
            columns: ['数据类别', '示例', '处理目的'],
            rows: [
              [
                '账户与身份信息',
                '姓名、电子邮箱、手机号、密码哈希、组织与租户标识、角色、语言偏好',
                '创建并保护您的账户、完成登录认证、应用工作区权限',
              ],
              [
                '认证与安全信息',
                '登录时间、会话标识、IP 地址、浏览器与设备类型、多因素认证状态、安全事件',
                '保护账户、识别欺诈与滥用、调查安全事件',
              ],
              [
                '账单与交易信息',
                '套餐、积分余额、发票、税务标识、脱敏后的支付方式、交易记录',
                '收取付费功能费用、开具发票、履行会计义务',
              ],
              [
                'API 使用与路由元数据',
                'API 密钥前缀、请求标识、所选模型、Token 数量、时延、HTTP 状态、错误码、时间戳',
                '路由请求、计量用量、执行配额、准确计费、定位故障',
              ],
              [
                '请求与响应内容',
                '您通过 API 或 Playground 提交的提示词、生成结果、上传文件与工具输入',
                '返回您请求的推理结果，并将其路由到您选择的模型提供商',
              ],
              [
                '支持与沟通信息',
                '您提供给支持或销售团队的消息、附件与联系方式',
                '回复您的请求并保留沟通记录',
              ],
              [
                'Cookie 与浏览器存储',
                'Cookie 政策中说明的会话与偏好设置条目',
                '保持登录状态、记住界面偏好、保护请求安全',
              ],
            ],
          },
          {
            type: 'paragraph',
            text: '我们还会收集经过聚合与去标识化处理的统计数据，例如按模型系列汇总的请求总量，这些数据无法合理用于识别个人。',
          },
          {
            type: 'paragraph',
            text: '部分字段为可选项，例如仅用于验证或账户找回的手机号。您可以拒绝提供可选项，但依赖该字段的功能可能因此不可用。',
          },
        ],
      },
      {
        id: 'how-we-use-data',
        heading: '三、我们如何使用信息',
        blocks: [
          {
            type: 'paragraph',
            text: '我们将个人数据用于以下目的：',
          },
          {
            type: 'bulletList',
            items: [
              '提供、运营与维护本服务，包括身份认证、请求路由、用量计量与计费。',
              '通过识别滥用、执行速率限制、防范欺诈与响应安全事件，保护本服务与用户安全。',
              '回复支持、销售与隐私请求，并发送安全提醒、发票通知与重大政策变更等服务消息。',
              '使用聚合后的使用统计与诊断数据提升可靠性与产品质量。除非工作区明确开启请求日志，我们不会为此使用您的提示词或生成结果内容。',
              '遵守适用法律、执行本服务条款，并建立、行使或抗辩法律主张。',
            ],
          },
          {
            type: 'paragraph',
            text: '在数据保护法律要求具备合法性基础时，我们依据履行与您签订的合同、运营与保护本服务的正当利益、在征得您同意时的同意，以及遵守法律义务进行处理。您可以随时撤回同意，但撤回不影响此前已进行的处理。',
          },
        ],
      },
      {
        id: 'prompts-and-model-routing',
        heading: '四、提示词、生成结果与模型提供商',
        blocks: [
          {
            type: 'paragraph',
            text: 'Cloud Router 是路由层。当您调用模型时，请求内容会被传输到提供所选模型的模型提供商。该提供商依据其自身条款与隐私政策处理内容，部分提供商可能根据其设置保留数据用于滥用监测或模型改进。',
          },
          {
            type: 'paragraph',
            text: 'SDKWork 不会使用您的提示词或生成结果训练基础模型，不会将其出售，也不会向其他客户披露。内容在网关内存中传递以完成请求。持久化请求日志默认关闭，管理员可按工作区开启，用于调试或审计。',
          },
          {
            type: 'paragraph',
            text: '当提供商支持零保留或企业数据处理模式时，网关会为有相应要求的工作区配置启用该模式。是否可用取决于提供商与具体模型。',
          },
          {
            type: 'callout',
            tone: 'important',
            title: '请勿在提示词中提交敏感数据',
            text: '除非您与 SDKWork 的协议明确覆盖相应场景，请勿在提示词中提交密码、支付卡号、政府证件号码、健康数据或其他敏感个人数据。',
          },
        ],
      },
      {
        id: 'cookies-and-local-storage',
        heading: '五、Cookie 与浏览器存储',
        blocks: [
          {
            type: 'paragraph',
            text: '我们使用少量 Cookie 与浏览器存储条目来保持您的登录状态、记住界面偏好并保护请求安全。Cookie 政策列出了我们当前设置的条目、用途以及清除方式。',
          },
          {
            type: 'paragraph',
            text: 'Cloud Router 控制台不使用广告 Cookie 或跨站跟踪像素。',
          },
        ],
      },
      {
        id: 'sharing-and-subprocessors',
        heading: '六、共享与次级处理者',
        blocks: [
          {
            type: 'paragraph',
            text: '我们仅在下列情形共享个人数据，且从不出售个人数据。',
          },
          {
            type: 'definitions',
            items: [
              {
                term: '托管与基础设施提供商',
                description:
                  '在数据处理协议约束下运营本服务所需的服务器、数据库、对象存储与内容分发。',
              },
              {
                term: '支付处理商',
                description:
                  '处理银行卡、钱包与银行交易。我们仅接收支付令牌与交易状态，不接收完整卡号。',
              },
              {
                term: '模型提供商',
                description:
                  '接收请求内容以生成您所请求的结果，具体如第四条所述。',
              },
              {
                term: '通信与支持工具',
                description:
                  '发送事务性邮件，并协助我们回复支持请求。',
              },
              {
                term: '安全与可观测性提供商',
                description:
                  '识别滥用、监测可用性并存储安全日志，访问权限仅限经授权人员。',
              },
              {
                term: '专业顾问与主管机关',
                description:
                  '在法律、法律程序或有约束力的命令要求时，或为保护权利、安全与本服务完整性所必需时接收数据。',
              },
              {
                term: '承继主体',
                description:
                  '如我们涉及合并、收购或资产出售，数据可能依本政策与适用法律发生转移。',
              },
            ],
          },
          {
            type: 'paragraph',
            text: '当前的次级处理者清单可向您的客户团队索取，或发送邮件至 privacy@sdkwork.com 获取。在新增处理客户内容的次级处理者之前，我们会为客户提供合理的反对机会。',
          },
        ],
      },
      {
        id: 'international-transfers',
        heading: '七、跨境传输与数据驻留',
        blocks: [
          {
            type: 'paragraph',
            text: 'SDKWork 在全球范围内运营。账户、账单与使用数据可能在您为工作区选择的区域，以及我们基础设施与支持团队所在的区域进行处理。',
          },
          {
            type: 'paragraph',
            text: '当数据从欧洲经济区、英国或瑞士传出时，我们依据充分性认定或标准合同条款并辅以补充保障措施。客户可发送邮件至 privacy@sdkwork.com 获取适用保障措施的副本。',
          },
          {
            type: 'paragraph',
            text: '独立部署与客户自有部署将租户数据保留在运营方提供的基础设施内。在该模式下，SDKWork 仅接收运营方选择发送的运维遥测数据。',
          },
        ],
      },
      {
        id: 'retention',
        heading: '八、保留期限',
        blocks: [
          {
            type: 'paragraph',
            text: '我们仅在实现上述目的所需的期限内保留个人数据，随后予以删除或去标识化处理。保留期限概述如下；如工作区配置了更严格的政策，期限可能更短。',
          },
          {
            type: 'table',
            columns: ['数据', '默认保留期限'],
            rows: [
              ['账户与资料数据', '账户存续期间，以及删除后 30 天'],
              ['API 使用与路由元数据', '30 天，工作区可在 7 至 90 天之间配置'],
              ['工作区开启的请求日志', '按工作区设置，最长 30 天'],
              ['安全与审计事件', '180 天；调查需要时可能更长'],
              ['账单记录与发票', '税务与会计法律要求时保留 7 年'],
              ['支持沟通记录', '工单关闭后 24 个月'],
              ['备份', '按滚动周期保留 35 天'],
            ],
          },
          {
            type: 'paragraph',
            text: '当您删除内容时，副本会立即从活动系统中移除，并在备份周期到期后从备份中清除。因法律或会计原因必须保留的记录仅限用于该目的。',
          },
        ],
      },
      {
        id: 'security',
        heading: '九、安全',
        blocks: [
          {
            type: 'paragraph',
            text: '我们通过 TLS 1.2 或更高版本的传输加密、静态数据加密、仅显示前缀的 API 密钥哈希存储、人员最小权限访问以及管理操作审计来保护数据。',
          },
          {
            type: 'paragraph',
            text: '我们的工程实践包括强制代码评审、依赖与漏洞扫描、环境隔离以及事件响应流程。任何系统都无法做到绝对安全，请妥善保管 API 密钥，并将可疑泄露报告至 security@sdkwork.com。',
          },
          {
            type: 'paragraph',
            text: '如安全事件影响您的个人数据，我们将及时通知您与主管机关；在法律要求的情况下，我们会在知悉事件后 72 小时内完成通知。',
          },
        ],
      },
      {
        id: 'your-rights',
        heading: '十、您的权利',
        blocks: [
          {
            type: 'paragraph',
            text: '根据您所在地区的规定，您可能有权访问、更正、删除、导出、限制或反对处理您的个人数据，并有权撤回同意。',
          },
          {
            type: 'paragraph',
            text: '已登录用户可在控制台中更新个人资料并结束活动会话。如需行使其他权利，请发送邮件至 privacy@sdkwork.com。我们会在采取行动前验证您的身份，在 30 天内回复，并说明所适用的任何合法例外。您也可以授权代理人代为提交请求。',
          },
          {
            type: 'paragraph',
            text: '如您的账户由工作区管理员管理，我们会将请求转交给该管理员。您始终有权向当地数据保护主管机关投诉。',
          },
        ],
      },
      {
        id: 'children',
        heading: '十一、儿童',
        blocks: [
          {
            type: 'paragraph',
            text: '本服务面向组织与商业用户，并非针对儿童。我们不会在明知的情况下收集未满 16 周岁（或当地法律规定的更高最低年龄）者的个人数据。如您认为儿童提供了个人数据，请联系 privacy@sdkwork.com，我们将予以删除。',
          },
        ],
      },
      {
        id: 'changes-and-contact',
        heading: '十二、变更与联系方式',
        blocks: [
          {
            type: 'paragraph',
            text: '当我们的实践或法律发生变化时，我们会更新本政策。版本、生效日期与最后更新日期显示在页面顶部。对于重大变更，我们会在变更生效前至少 30 天通过控制台或电子邮件通知；法律要求更早变更的除外。',
          },
          {
            type: 'paragraph',
            text: '问题、请求与投诉：privacy@sdkwork.com。安全报告：security@sdkwork.com。如当地法律要求设立区域代表，该代表信息会在随订单提供的区域附录中注明。',
          },
        ],
      },
    ],
  },
};
