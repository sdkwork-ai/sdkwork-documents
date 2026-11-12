import type { LegalDocumentContent } from '../legal-document.ts';

export const termsOfServiceContent: LegalDocumentContent = {
  en: {
    title: 'Terms of Service',
    summary:
      'The agreement between you and SDKWork governing access to the Cloud Router website, console, API, SDKs, and desktop applications.',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'legal@sdkwork.com',
    sections: [
      {
        id: 'acceptance',
        heading: '1. Acceptance of these terms',
        blocks: [
          {
            type: 'paragraph',
            text: 'These Terms of Service ("Terms") govern your access to and use of SDKWork Cloud Router, including the website, web console, desktop applications, public API, generated SDKs, and related documentation (together, the "Service"). By creating an account, calling the API, or otherwise using the Service, you agree to these Terms.',
          },
          {
            type: 'paragraph',
            text: 'If you use the Service on behalf of an organization, you represent that you have authority to bind that organization, and "you" refers to both you and the organization. If you do not have that authority, or you do not agree to these Terms, do not use the Service.',
          },
          {
            type: 'paragraph',
            text: 'An order form, enterprise agreement, or data processing agreement signed with SDKWork may add to or override these Terms. If those documents conflict with these Terms, the signed document controls for the covered subject matter.',
          },
        ],
      },
      {
        id: 'accounts-and-eligibility',
        heading: '2. Accounts and eligibility',
        blocks: [
          {
            type: 'paragraph',
            text: 'The Service is intended for business and professional use. You must be at least 16 years old, or the higher minimum age required by the law that applies to you, and legally able to enter into a contract.',
          },
          {
            type: 'paragraph',
            text: 'You must provide accurate account information, keep it current, and protect your credentials and devices. Activity performed with your credentials is your responsibility unless you can show it resulted from our breach of these Terms.',
          },
          {
            type: 'paragraph',
            text: 'Workspace administrators can access, manage, and remove member accounts and API keys. If your account is controlled by an administrator, that administrator may change your access or terminate it, and you should direct data requests to them first.',
          },
          {
            type: 'paragraph',
            text: 'Notify us promptly at security@sdkwork.com if you believe your account or an API key has been compromised.',
          },
        ],
      },
      {
        id: 'acceptable-use',
        heading: '3. Acceptable use',
        blocks: [
          {
            type: 'paragraph',
            text: 'Subject to these Terms, we grant you a limited, non-exclusive, non-transferable right to use the Service for your internal business purposes or to build products that call the Service.',
          },
          {
            type: 'paragraph',
            text: 'You must not, and must not permit anyone else to:',
          },
          {
            type: 'bulletList',
            items: [
              'Use the Service to violate any law, regulation, or third-party right, or to facilitate fraud, harassment, or the distribution of malware.',
              'Attempt to access accounts, systems, data, or networks without authorization, or probe, scan, or test the vulnerability of the Service except under a written security-testing agreement.',
              'Reverse engineer, decompile, or disassemble the Service, except to the extent the restriction is prohibited by applicable law.',
              'Bypass rate limits, quotas, billing, access controls, or model provider restrictions, or use the Service to build a substantially similar competing gateway from our non-public materials.',
              'Resell, sublicense, or provide the Service to third parties as a standalone offering unless your order form or partner agreement expressly permits it.',
              'Submit content that infringes intellectual property, violates privacy or publicity rights, or contains unlawful material.',
              'Use the Service for automated decisions about individuals in employment, credit, housing, health, education, or similar high-impact domains without appropriate human review and legal safeguards.',
              'Use the Service in a way that violates the terms of the model provider selected for a request, including its usage policies and prohibited-use restrictions.',
            ],
          },
          {
            type: 'paragraph',
            text: 'We may investigate suspected violations, suspend access while we do, and report unlawful activity to the appropriate authorities.',
          },
        ],
      },
      {
        id: 'api-keys-and-security',
        heading: '4. API keys and security',
        blocks: [
          {
            type: 'paragraph',
            text: 'API keys are confidential credentials. Keep them out of client-side bundles, public repositories, logs, screenshots, and support tickets, and rotate any key that may have been exposed. After creation, a key is displayed only by prefix.',
          },
          {
            type: 'paragraph',
            text: 'You are responsible for all usage and charges incurred with your API keys. Configure per-key limits and separate keys per environment or application so that a single exposure can be contained.',
          },
          {
            type: 'paragraph',
            text: 'We may rate-limit or throttle requests to protect the Service and other customers. Limits are published in the console and may be adjusted with notice.',
          },
        ],
      },
      {
        id: 'fees-and-billing',
        heading: '5. Fees and billing',
        blocks: [
          {
            type: 'paragraph',
            text: 'Paid features, credits, and usage-based charges are described in the console or an order form. Prices are exclusive of taxes unless stated otherwise, and you are responsible for applicable sales, value-added, and withholding taxes.',
          },
          {
            type: 'paragraph',
            text: 'Credits are prepaid balances and are not refundable except where required by law or expressly agreed in writing. Auto-recharge, when enabled, purchases additional credits when your balance falls below the configured threshold.',
          },
          {
            type: 'paragraph',
            text: 'Invoices are due on the date stated on the invoice. Overdue amounts may accrue interest at the lower of 1.5% per month or the maximum permitted by law, and we may suspend paid features while an invoice remains unpaid.',
          },
          {
            type: 'paragraph',
            text: 'We may change prices with at least 30 days notice. Changes apply to the next billing period and never retroactively to charges already incurred.',
          },
        ],
      },
      {
        id: 'third-party-models',
        heading: '6. Third-party models and services',
        blocks: [
          {
            type: 'paragraph',
            text: 'The Service routes requests to models operated by third-party providers. Your use of a model is also subject to that provider\'s terms and usage policies. We do not control third-party models and are not responsible for their outputs, availability, or independent data practices.',
          },
          {
            type: 'paragraph',
            text: 'Model availability, pricing, context limits, and capabilities may change when a provider updates or retires a model. We publish deprecation information in the console and documentation when we receive it in time.',
          },
          {
            type: 'paragraph',
            text: 'Generated output may be inaccurate, incomplete, biased, or unsuitable for your purpose. Review output before relying on it, especially in legal, medical, financial, or safety-critical contexts.',
          },
        ],
      },
      {
        id: 'content-and-intellectual-property',
        heading: '7. Content and intellectual property',
        blocks: [
          {
            type: 'paragraph',
            text: 'You retain ownership of the prompts, files, and other content you submit ("Input") and of the output generated for you ("Output"), subject to applicable law and the terms of the model provider that produced the Output. We do not claim ownership of your Input or Output.',
          },
          {
            type: 'paragraph',
            text: 'You grant SDKWork a worldwide, non-exclusive license to host, process, transmit, and display Input and Output solely to provide, secure, and support the Service, and as described in the Privacy Policy.',
          },
          {
            type: 'paragraph',
            text: 'You are responsible for ensuring that your Input and your use of Output do not infringe third-party rights. If you provide feedback or suggestions, we may use them without obligation to you.',
          },
          {
            type: 'paragraph',
            text: 'SDKWork owns the Service, including its software, gateway technology, documentation, and trademarks. These Terms do not grant you any rights in our brand or in our non-public materials.',
          },
        ],
      },
      {
        id: 'availability-and-support',
        heading: '8. Availability and support',
        blocks: [
          {
            type: 'paragraph',
            text: 'We work to keep the Service available and perform maintenance during published windows, but availability targets apply only when an order form or service-level agreement states them. Preview, beta, and experimental features are provided as-is and may change or be withdrawn.',
          },
          {
            type: 'paragraph',
            text: 'Support scope and response targets depend on your plan. We may access your workspace to diagnose an issue only with your authorization or when necessary to address a security or availability incident.',
          },
        ],
      },
      {
        id: 'suspension-and-termination',
        heading: '9. Suspension and termination',
        blocks: [
          {
            type: 'paragraph',
            text: 'You may stop using the Service at any time and may close your account in the console. We may suspend or terminate access if you materially breach these Terms, fail to pay, create a security or legal risk, or if required by law.',
          },
          {
            type: 'paragraph',
            text: 'Before termination takes effect, export the data you need. After termination, we delete account data according to the retention periods in the Privacy Policy, except records we must keep for legal, tax, or dispute-resolution purposes.',
          },
          {
            type: 'paragraph',
            text: 'Provisions that by their nature should survive termination, including payment obligations, intellectual property, disclaimers, liability limits, and dispute resolution, continue to apply.',
          },
        ],
      },
      {
        id: 'disclaimers-and-liability',
        heading: '10. Disclaimers and limitation of liability',
        blocks: [
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by law, the Service is provided "as is" and "as available" without warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted operation. We do not warrant that output will be accurate or that the Service will meet every requirement.',
          },
          {
            type: 'paragraph',
            text: 'To the maximum extent permitted by law, neither party is liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenue, data, or goodwill. Our aggregate liability arising from or related to the Service is limited to the amounts you paid to SDKWork for the Service in the 12 months before the event giving rise to the claim, or 100 US dollars if you used the Service without charge.',
          },
          {
            type: 'paragraph',
            text: 'These limits do not apply to fraud, willful misconduct, payment obligations, or any liability that applicable law does not allow to be limited.',
          },
        ],
      },
      {
        id: 'governing-law-and-disputes',
        heading: '11. Governing law and disputes',
        blocks: [
          {
            type: 'paragraph',
            text: 'The governing law and the courts with jurisdiction are stated in your order form or enterprise agreement. If no document states them, the laws and courts of the jurisdiction in which SDKWork is established apply, without regard to conflict-of-law rules.',
          },
          {
            type: 'paragraph',
            text: 'Before filing a claim, contact legal@sdkwork.com and allow 30 days for good-faith resolution. Either party may then bring an individual claim in the competent court. Nothing in these Terms limits a consumer\'s statutory rights or either party\'s ability to seek urgent injunctive relief.',
          },
        ],
      },
      {
        id: 'changes-and-contact',
        heading: '12. Changes and contact',
        blocks: [
          {
            type: 'paragraph',
            text: 'We may update these Terms to reflect changes in the Service or the law. The version and effective date appear at the top of this page. For material changes we provide notice in the console or by email at least 30 days before they take effect. Continuing to use the Service after the effective date means you accept the updated Terms.',
          },
          {
            type: 'paragraph',
            text: 'Questions about these Terms: legal@sdkwork.com. Privacy questions: privacy@sdkwork.com. Security reports: security@sdkwork.com.',
          },
        ],
      },
    ],
  },
  zh: {
    title: '服务条款',
    summary:
      '您与 SDKWork 之间关于访问和使用 Cloud Router 网站、控制台、API、SDK 与桌面应用的协议。',
    version: '1.0',
    effectiveDate: '2026-11-12',
    lastUpdated: '2026-11-12',
    contactEmail: 'legal@sdkwork.com',
    sections: [
      {
        id: 'acceptance',
        heading: '一、条款的接受',
        blocks: [
          {
            type: 'paragraph',
            text: '本服务条款（以下简称“本条款”）约束您对 SDKWork Cloud Router 的访问与使用，包括网站、Web 控制台、桌面应用、公开 API、生成的 SDK 及相关文档（合称“本服务”）。您创建账户、调用 API 或以其他方式使用本服务，即表示同意本条款。',
          },
          {
            type: 'paragraph',
            text: '如您代表组织使用本服务，您声明已获得约束该组织的授权，“您”同时指您本人与该组织。如您不具备该授权，或不同意本条款，请勿使用本服务。',
          },
          {
            type: 'paragraph',
            text: '与 SDKWork 签署的订单、企业协议或数据处理协议可能对本条款作出补充或变更。如上述文件与本条款冲突，就其所涵盖的事项以已签署文件为准。',
          },
        ],
      },
      {
        id: 'accounts-and-eligibility',
        heading: '二、账户与资格',
        blocks: [
          {
            type: 'paragraph',
            text: '本服务面向商业与专业用途。您须年满 16 周岁，或达到适用于您的法律规定的更高最低年龄，并具备订立合同的法律能力。',
          },
          {
            type: 'paragraph',
            text: '您须提供准确的账户信息并及时更新，妥善保管凭据与设备。使用您凭据进行的活动由您负责，但您能证明系我们违反本条款所致的除外。',
          },
          {
            type: 'paragraph',
            text: '工作区管理员可以访问、管理并移除成员账户与 API 密钥。如您的账户由管理员管理，该管理员可能变更或终止您的访问权限，数据相关请求应首先向其提出。',
          },
          {
            type: 'paragraph',
            text: '如您认为账户或 API 密钥已泄露，请立即发送邮件至 security@sdkwork.com 通知我们。',
          },
        ],
      },
      {
        id: 'acceptable-use',
        heading: '三、可接受使用',
        blocks: [
          {
            type: 'paragraph',
            text: '在本条款约束下，我们授予您有限的、非排他、不可转让的权利，以便您将本服务用于内部业务目的，或构建调用本服务的产品。',
          },
          {
            type: 'paragraph',
            text: '您不得，也不得允许他人：',
          },
          {
            type: 'bulletList',
            items: [
              '利用本服务违反任何法律、法规或第三方权利，或为欺诈、骚扰、传播恶意软件提供便利。',
              '未经授权尝试访问账户、系统、数据或网络，或探测、扫描、测试本服务漏洞，但依据书面安全测试协议的除外。',
              '对本服务进行逆向工程、反编译或反汇编，但适用法律禁止该限制的除外。',
              '绕过速率限制、配额、计费、访问控制或模型提供商限制，或利用我们的非公开材料构建实质相似的竞争性网关。',
              '转售、再许可或向第三方提供本服务作为独立产品，但您的订单或合作伙伴协议明确允许的除外。',
              '提交侵犯知识产权、违反隐私或肖像权，或包含违法材料的内容。',
              '在就业、信贷、住房、医疗、教育或类似高影响领域，将本服务用于对个人作出自动化决策，而未采取适当的人工审核与法律保障措施。',
              '以违反所选模型提供商条款（包括其使用政策与禁用限制）的方式使用本服务。',
            ],
          },
          {
            type: 'paragraph',
            text: '我们可调查涉嫌违规行为，在调查期间暂停访问，并向有关主管机关报告违法活动。',
          },
        ],
      },
      {
        id: 'api-keys-and-security',
        heading: '四、API 密钥与安全',
        blocks: [
          {
            type: 'paragraph',
            text: 'API 密钥是机密凭据。请勿将其放入客户端代码包、公开代码仓库、日志、截图或支持工单中，并轮换任何可能已泄露的密钥。密钥创建后仅显示前缀。',
          },
          {
            type: 'paragraph',
            text: '您对使用您 API 密钥产生的全部用量与费用负责。请为每把密钥配置限额，并按环境或应用拆分密钥，以便在单次泄露时将影响控制在有限范围内。',
          },
          {
            type: 'paragraph',
            text: '为保护本服务及其他客户，我们可能对请求进行限流或节流。限制会在控制台中公布，并可能经通知后调整。',
          },
        ],
      },
      {
        id: 'fees-and-billing',
        heading: '五、费用与计费',
        blocks: [
          {
            type: 'paragraph',
            text: '付费功能、积分与按量计费规则在控制台或订单中说明。除另有说明外，价格不含税费，您须承担适用的销售税、增值税与预提税。',
          },
          {
            type: 'paragraph',
            text: '积分属于预付余额，除法律要求或经书面明确同意外不予退款。开启自动充值后，当余额低于设定阈值时将自动购买积分。',
          },
          {
            type: 'paragraph',
            text: '发票应在票面日期支付。逾期款项可能按每月 1.5% 与法律允许的最高利率中的较低者计息；在发票未付清期间，我们可能暂停付费功能。',
          },
          {
            type: 'paragraph',
            text: '我们可提前至少 30 天通知调整价格。价格调整适用于下一计费周期，不追溯已产生的费用。',
          },
        ],
      },
      {
        id: 'third-party-models',
        heading: '六、第三方模型与服务',
        blocks: [
          {
            type: 'paragraph',
            text: '本服务将请求路由至第三方提供商运营的模型。您对模型的使用还须遵守该提供商的条款与使用政策。我们无法控制第三方模型，亦不对其输出、可用性或独立的数据处理实践负责。',
          },
          {
            type: 'paragraph',
            text: '当提供商更新或下线模型时，模型的可用性、价格、上下文限制与能力可能发生变化。如我们及时获知，会在控制台与文档中发布下线信息。',
          },
          {
            type: 'paragraph',
            text: '生成结果可能不准确、不完整、存在偏见或不适用于您的目的。在依赖输出之前请进行审核，尤其是在法律、医疗、金融或安全关键场景中。',
          },
        ],
      },
      {
        id: 'content-and-intellectual-property',
        heading: '七、内容与知识产权',
        blocks: [
          {
            type: 'paragraph',
            text: '您保留对所提交的提示词、文件及其他内容（“输入”）以及为您生成的输出（“输出”）的所有权，但须遵守适用法律与生成该输出的模型提供商的条款。我们不主张对您的输入或输出的所有权。',
          },
          {
            type: 'paragraph',
            text: '您授予 SDKWork 全球范围、非排他的许可，仅为提供、保护与支持本服务之目的，以及按隐私政策所述，托管、处理、传输与展示输入和输出。',
          },
          {
            type: 'paragraph',
            text: '您有责任确保输入以及对输出的使用不侵犯第三方权利。如您提供反馈或建议，我们可在不对您承担义务的情况下使用。',
          },
          {
            type: 'paragraph',
            text: 'SDKWork 拥有本服务，包括其软件、网关技术、文档与商标。本条款不授予您对我们品牌或非公开材料的任何权利。',
          },
        ],
      },
      {
        id: 'availability-and-support',
        heading: '八、可用性与支持',
        blocks: [
          {
            type: 'paragraph',
            text: '我们努力保持本服务可用，并在公布的时间窗口内进行维护；但只有当订单或服务级别协议明确约定时，可用性目标才具有约束力。预览、测试与实验性功能按现状提供，可能变更或停止。',
          },
          {
            type: 'paragraph',
            text: '支持范围与响应目标取决于您的套餐。我们仅在获得您授权，或为处理安全或可用性事件所必需时，才会访问您的工作区进行诊断。',
          },
        ],
      },
      {
        id: 'suspension-and-termination',
        heading: '九、暂停与终止',
        blocks: [
          {
            type: 'paragraph',
            text: '您可随时停止使用本服务，并可在控制台关闭账户。如您实质性违反本条款、未支付费用、造成安全或法律风险，或法律要求，我们可暂停或终止访问。',
          },
          {
            type: 'paragraph',
            text: '在终止生效前，请导出您需要的数据。终止后，我们按隐私政策中的保留期限删除账户数据，但为法律、税务或争议解决目的必须保留的记录除外。',
          },
          {
            type: 'paragraph',
            text: '依其性质应继续有效的条款，包括付款义务、知识产权、免责声明、责任限制与争议解决，在终止后继续适用。',
          },
        ],
      },
      {
        id: 'disclaimers-and-liability',
        heading: '十、免责声明与责任限制',
        blocks: [
          {
            type: 'paragraph',
            text: '在法律允许的最大范围内，本服务按“现状”与“现有可用”提供，不作适销性、特定用途适用性、不侵权或持续运行的保证。我们不保证输出准确，也不保证本服务满足您的全部要求。',
          },
          {
            type: 'paragraph',
            text: '在法律允许的最大范围内，任何一方均不对间接、附带、特殊、后果性或惩罚性损害，或利润、收入、数据、商誉损失承担责任。我们就本服务产生的累计责任，以索赔事由发生前 12 个月内您向 SDKWork 支付的费用为限；如您免费使用本服务，则以 100 美元为限。',
          },
          {
            type: 'paragraph',
            text: '上述限制不适用于欺诈、故意不当行为、付款义务，以及适用法律不允许限制的责任。',
          },
        ],
      },
      {
        id: 'governing-law-and-disputes',
        heading: '十一、适用法律与争议解决',
        blocks: [
          {
            type: 'paragraph',
            text: '适用法律与有管辖权的法院以您的订单或企业协议为准。如无相关文件约定，则适用 SDKWork 设立地的法律与法院，但不适用冲突法规则。',
          },
          {
            type: 'paragraph',
            text: '在提起诉讼之前，请发送邮件至 legal@sdkwork.com，并给予 30 天善意协商期。此后任何一方可向有管辖权的法院提起个体诉讼。本条款不限制消费者的法定权利，也不限制任何一方申请紧急禁令救济。',
          },
        ],
      },
      {
        id: 'changes-and-contact',
        heading: '十二、变更与联系方式',
        blocks: [
          {
            type: 'paragraph',
            text: '我们可能因本服务或法律变化更新本条款。版本与生效日期显示在本页顶部。对于重大变更，我们会在生效前至少 30 天通过控制台或电子邮件通知。生效日后继续使用本服务，即表示您接受更新后的条款。',
          },
          {
            type: 'paragraph',
            text: '条款相关问题：legal@sdkwork.com。隐私问题：privacy@sdkwork.com。安全报告：security@sdkwork.com。',
          },
        ],
      },
    ],
  },
};
