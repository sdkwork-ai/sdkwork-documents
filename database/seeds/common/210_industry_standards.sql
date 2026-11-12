-- sdkwork:seed
-- 210_industry_standards.sql - bootstrap industry-standard references for the document center.
-- Idempotent: stable ids plus the (tenant, app, locale, slug) unique index keep re-runs safe.

INSERT INTO documents_document
  (id, tenant_id, app_key, slug, locale, title, summary, body, category, sort_order, status, published_at)
VALUES
  ('13b71e6a-c81e-46c1-a362-f42c63660749', 100001, 'sdkwork-cloudrouter', 'gdpr-compliance', 'zh-CN',
   'GDPR 合规说明',
   'SDKWork Cloud Router 在欧盟与欧洲经济区处理个人数据时遵循的 GDPR 义务。',
   '<h2>适用范围</h2><p>本说明概述 SDKWork Cloud Router 在欧盟与欧洲经济区处理个人数据时遵循的《通用数据保护条例》义务。企业独立部署时，运营方作为数据控制者独立承担合规责任。</p><h2>合法性基础与最小化</h2><p>我们依据履行合同、正当利益、您的同意与法律义务处理数据，并仅收集提供服务所需的字段。可选字段会明确标注，拒绝提供不会影响核心功能。</p><h2>数据主体权利</h2><p>您可请求访问、更正、删除、限制处理、反对处理与数据可携带，也可以撤回同意。请发送邮件至 privacy@sdkwork.com，我们将在 30 天内回复。</p><h2>跨境传输与处理者</h2><p>跨境传输依据充分性认定或标准合同条款并辅以补充保障措施。我们与次级处理者签署数据处理协议，并提供合理的反对机会。</p><h2>安全与事件响应</h2><p>我们采用传输与静态加密、最小权限、审计日志与漏洞管理，并在知悉可报告事件后 72 小时内通知主管机关与受影响的客户。</p>',
   'standard', 100, 'published', NOW()),

  ('42188261-c63c-47c1-97cd-6fa27cd25dff', 100001, 'sdkwork-cloudrouter', 'gdpr-compliance', 'en-US',
   'GDPR Compliance',
   'How SDKWork Cloud Router meets GDPR obligations for EU and EEA personal data.',
   '<h2>Scope</h2><p>This statement summarizes how SDKWork Cloud Router meets its obligations under the General Data Protection Regulation for personal data processed in the European Union and European Economic Area. In standalone deployments the operator is the controller and bears its own compliance obligations.</p><h2>Legal bases and minimization</h2><p>We process data based on contract performance, legitimate interests, consent, and legal obligations, and we collect only the fields needed to deliver the service. Optional fields are marked, and declining them does not affect core functionality.</p><h2>Data subject rights</h2><p>You may request access, correction, deletion, restriction, objection, and portability, and you may withdraw consent. Email privacy@sdkwork.com and we respond within 30 days.</p><h2>Transfers and processors</h2><p>Cross-border transfers rely on adequacy decisions or standard contractual clauses with supplementary safeguards. We sign data processing agreements with subprocessors and give customers a reasonable opportunity to object.</p><h2>Security and incident response</h2><p>We use encryption in transit and at rest, least-privilege access, audit logging, and vulnerability management, and we notify the supervisory authority and affected customers within 72 hours of a reportable incident.</p>',
   'standard', 100, 'published', NOW()),

  ('21e5fad4-f170-4808-a13a-b2156688c79b', 100001, 'sdkwork-cloudrouter', 'pipl-compliance', 'zh-CN',
   'PIPL 合规说明',
   'SDKWork Cloud Router 在中华人民共和国境内处理个人信息时遵循《个人信息保护法》。',
   '<h2>适用范围</h2><p>本说明概述 SDKWork Cloud Router 在中华人民共和国境内处理个人信息时遵循《中华人民共和国个人信息保护法》的要求。企业独立部署时，运营方作为个人信息处理者独立承担责任。</p><h2>告知同意与最小必要</h2><p>我们以清晰易懂的语言告知处理目的、方式、种类与保存期限，仅收集实现服务所需的最少信息。处理敏感个人信息、向境外提供信息或用于其他目的时，另行取得单独同意。</p><h2>个人权利</h2><p>您有权查阅、复制、更正、补充、删除个人信息，撤回同意、限制或拒绝处理，并要求解释处理规则。请发送邮件至 privacy@sdkwork.com。</p><h2>跨境提供</h2><p>如确需向境外提供个人信息，我们将依法完成安全评估、个人信息保护认证或标准合同备案，并履行告知与单独同意义务。</p><h2>安全与留存</h2><p>我们采取加密、去标识化、权限控制、操作审计与应急预案等措施，并仅在实现处理目的所需的最短期限内留存个人信息。</p>',
   'standard', 110, 'published', NOW()),

  ('485d6334-81d0-40e8-bb64-866a95ef6897', 100001, 'sdkwork-cloudrouter', 'pipl-compliance', 'en-US',
   'PIPL Compliance',
   'How SDKWork Cloud Router meets PIPL obligations for personal information in China.',
   '<h2>Scope</h2><p>This statement summarizes how SDKWork Cloud Router meets the Personal Information Protection Law of the People Republic of China for personal information processed in China. In standalone deployments the operator is the personal information processor and bears its own obligations.</p><h2>Notice, consent, and minimization</h2><p>We explain the purpose, method, categories, and retention period in clear language and collect only the minimum information needed to deliver the service. Separate consent is obtained for sensitive personal information, cross-border provision, or unrelated purposes.</p><h2>Individual rights</h2><p>You may access, copy, correct, supplement, or delete your personal information, withdraw consent, restrict or refuse processing, and request an explanation of the rules. Email privacy@sdkwork.com.</p><h2>Cross-border provision</h2><p>Where personal information must leave China, we complete a security assessment, certification, or standard contract filing as required, and we provide notice and obtain separate consent.</p><h2>Security and retention</h2><p>We apply encryption, de-identification, access control, audit logging, and incident response, and we retain personal information only for the shortest period needed for the stated purpose.</p>',
   'standard', 110, 'published', NOW()),

  ('b6337732-d0f5-4177-969f-4a9974c28dad', 100001, 'sdkwork-cloudrouter', 'iso-27001', 'zh-CN',
   'ISO/IEC 27001 信息安全管理',
   'SDKWork 信息安全管理体系的控制框架与持续改进方式。',
   '<h2>信息安全管理体系</h2><p>SDKWork 参照 ISO/IEC 27001 建立信息安全管理体系，覆盖资产分类、访问控制、加密、供应商管理、安全事件与业务连续性。</p><h2>控制措施</h2><ul><li>基于角色的最小权限与定期权限复核。</li><li>密钥与凭据的集中托管、轮换与访问审计。</li><li>变更评审、依赖扫描、漏洞管理与补丁流程。</li><li>安全事件分级、响应、取证与复盘。</li></ul><h2>审计与改进</h2><p>我们通过内部审计、管理评审与纠正措施持续改进体系。认证范围、适用性与证书状态以独立认证机构的正式审核结果为准。</p>',
   'standard', 120, 'published', NOW()),

  ('41b98ae4-e13f-4324-9f2f-1ef541e3bfb7', 100001, 'sdkwork-cloudrouter', 'iso-27001', 'en-US',
   'ISO/IEC 27001 Information Security',
   'The control framework and continuous improvement of the SDKWork information security management system.',
   '<h2>Information security management system</h2><p>SDKWork aligns its information security management system with ISO/IEC 27001, covering asset classification, access control, cryptography, supplier management, security incidents, and business continuity.</p><h2>Controls</h2><ul><li>Role-based least privilege with periodic access reviews.</li><li>Centralized custody, rotation, and audit of keys and credentials.</li><li>Change review, dependency scanning, vulnerability management, and patching.</li><li>Security incident triage, response, forensics, and retrospective review.</li></ul><h2>Audit and improvement</h2><p>We improve the system through internal audit, management review, and corrective action. Certification scope, applicability, and certificate status are determined by the formal audit of an independent certification body.</p>',
   'standard', 120, 'published', NOW()),

  ('4c3253d5-51e8-4bf9-9e3c-9d4c53361839', 100001, 'sdkwork-cloudrouter', 'soc2', 'zh-CN',
   'SOC 2 信任服务原则',
   'SDKWork Cloud Router 按 SOC 2 原则设计并验证的控制措施。',
   '<h2>信任服务原则</h2><p>SDKWork Cloud Router 按 SOC 2 的安全、可用性、处理完整性、保密性与隐私原则设计控制措施，并将控制证据纳入日常运营。</p><h2>控制证据</h2><p>访问评审、变更记录、监控告警、事件响应、备份恢复与供应商评估均保留可审计记录，供独立审计机构抽样验证。</p><h2>报告范围</h2><p>SOC 2 报告由独立审计机构出具，覆盖范围与报告期间以正式报告为准。客户可在签署保密协议后向客户团队申请获取。</p>',
   'standard', 130, 'published', NOW()),

  ('f55a492d-1fea-4042-8c56-2e9da5f450d8', 100001, 'sdkwork-cloudrouter', 'soc2', 'en-US',
   'SOC 2 Trust Services',
   'Controls SDKWork Cloud Router designs and validates against SOC 2 principles.',
   '<h2>Trust services criteria</h2><p>SDKWork Cloud Router designs controls around the SOC 2 security, availability, processing integrity, confidentiality, and privacy principles, and it operates those controls day to day.</p><h2>Control evidence</h2><p>Access reviews, change records, monitoring alerts, incident response, backup restoration, and supplier assessments are retained as auditable evidence for independent auditor sampling.</p><h2>Report scope</h2><p>SOC 2 reports are issued by an independent auditor, and the formal report defines the scope and period. Customers may request a copy from their account team after signing a confidentiality agreement.</p>',
   'standard', 130, 'published', NOW())
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
