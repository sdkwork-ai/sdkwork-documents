import {
  getSdkSystemConfig,
  readDocumentsRuntimeEnv,
} from '@sdkwork/documents-pc-commons/runtime';
import type { DocumentsGeneratedSdkMetadata } from '@sdkwork/documents-pc-commons/runtime';
import type { SdkReferenceSystem } from '../sdkReferenceRuntime';
import {resolveBaseUrlWithAlignProtocol} from '@sdkwork/sdk-common';

export interface SdkLanguage {
  id: string;
  name: string;
  icon: string;
  description: string;
  installCommand: string;
  importCode: string;
  initCode: string;
  exampleCode: string;
  githubUrl: string;
}

export type ApiSystem = SdkReferenceSystem;
export type GeneratedSdkMetadata = DocumentsGeneratedSdkMetadata;

type LanguagePackageSet = {
  ts: string;
  py: string;
  go: string;
  java: string;
  ruby: string;
  php: string;
  csharp: string;
  rust: string;
  flutter: string;
};

type LanguageExampleSet = {
  ts: string;
  py: string;
  go: string;
  java: string;
  ruby: string;
  php: string;
  csharp: string;
  rust: string;
  flutter: string;
};

export const getGeneratedSdkMetadataForSystem = (system: ApiSystem): GeneratedSdkMetadata => (
  getSdkSystemConfig()[system]
);

const NODE_ENV_REFERENCE = 'process' + '.env';
const GITHUB_BASE_URL = readDocumentsRuntimeEnv('VITE_SDKWORK_DOCUMENTS_GITHUB_BASE_URL')
  ?? 'https://github.com/sdkwork/sdkwork-documents/tree/main';

const SYSTEM_NAMES: Record<ApiSystem, string> = {
  'llm-open-api': 'LLM Open API',
  'image-open-api': 'Image Open API',
  'video-open-api': 'Video Open API',
  'audio-open-api': 'Audio Open API',
  'drive-open-api': 'Drive Open API',
  'knowledgebase-open-api': 'Knowledgebase Open API',
  'memory-open-api': 'Memory Open API',
  'agent-open-api': 'Agent Open API',
  'payment-open-api': 'Payment Open API',
  'iaas-open-api': 'IaaS Open API',
  'paas-open-api': 'PaaS Open API',
  'app-api': 'App API',
  'backend-api': 'Backend API',
};

let cachedSystemPackageNames: Record<ApiSystem, LanguagePackageSet> | null = null;

// Lazily resolved on first use: `getSdkSystemConfig()` reads the host-registered
// documents reference runtime, which only exists after the React provider
// mounts. Module-scope evaluation would throw in Node tests and SSR.
function systemPackageNames(): Record<ApiSystem, LanguagePackageSet> {
  if (!cachedSystemPackageNames) {
    const openApiPackages = packageSetFromMetadata(
      getSdkSystemConfig()['llm-open-api'],
      'open',
      'Open',
    );
    const driveOpenApiPackages: LanguagePackageSet = {
      ts: getSdkSystemConfig()['drive-open-api'].packageName,
      py: 'sdkwork-drive-sdk-generated',
      go: 'github.com/sdkwork/drive-sdk-generated',
      java: 'drive-sdk-generated',
      ruby: 'sdkwork-drive-sdk',
      php: 'sdkwork/drive-sdk-php',
      csharp: 'Sdkwork.DriveSdk',
      rust: 'sdkwork-drive-sdk-generated',
      flutter: 'sdkwork_drive_sdk',
    };
    const memoryOpenApiPackages: LanguagePackageSet = {
      ts: getSdkSystemConfig()['memory-open-api'].packageName,
      py: 'sdkwork-memory-sdk',
      go: 'github.com/sdkwork/memory-sdk',
      java: 'memory-sdk',
      ruby: 'sdkwork-memory-sdk',
      php: 'sdkwork/memory-sdk-php',
      csharp: 'Sdkwork.MemorySdk',
      rust: 'sdkwork-memory-sdk',
      flutter: 'sdkwork_memory_sdk',
    };
    const agentOpenApiPackages: LanguagePackageSet = {
      ts: getSdkSystemConfig()['agent-open-api'].packageName,
      py: 'sdkwork-agent-sdk',
      go: 'github.com/sdkwork/agent-sdk',
      java: 'agent-sdk',
      ruby: 'sdkwork-agent-sdk',
      php: 'sdkwork/agent-sdk-php',
      csharp: 'Sdkwork.AgentSdk',
      rust: 'sdkwork-agent-sdk',
      flutter: 'sdkwork_agent_sdk',
    };
    cachedSystemPackageNames = {
      'llm-open-api': openApiPackages,
      'image-open-api': openApiPackages,
      'video-open-api': openApiPackages,
      'audio-open-api': openApiPackages,
      'drive-open-api': driveOpenApiPackages,
      'knowledgebase-open-api': openApiPackages,
      'memory-open-api': memoryOpenApiPackages,
      'agent-open-api': agentOpenApiPackages,
      'payment-open-api': packageSet('payment-open-api', 'payment', 'Payment'),
      'iaas-open-api': packageSet('iaas-open-api', 'iaas', 'Iaas'),
      'paas-open-api': packageSet('paas-open-api', 'paas', 'Paas'),
      'app-api': packageSet('app-api', 'app', 'App'),
      'backend-api': packageSet('backend-api', 'backend', 'Backend'),
    };
  }
  return cachedSystemPackageNames;
}

let cachedSystemClassNames: Record<ApiSystem, string> | null = null;

function systemClassNames(): Record<ApiSystem, string> {
  if (!cachedSystemClassNames) {
    const systemConfig = getSdkSystemConfig();
    cachedSystemClassNames = {
      'llm-open-api': systemConfig['llm-open-api'].name,
      'image-open-api': systemConfig['image-open-api'].name,
      'video-open-api': systemConfig['video-open-api'].name,
      'audio-open-api': systemConfig['audio-open-api'].name,
      'drive-open-api': systemConfig['drive-open-api'].name,
      'knowledgebase-open-api': systemConfig['knowledgebase-open-api'].name,
      'memory-open-api': systemConfig['memory-open-api'].name,
      'agent-open-api': systemConfig['agent-open-api'].name,
      'payment-open-api': systemConfig['payment-open-api'].name,
      'iaas-open-api': systemConfig['iaas-open-api'].name,
      'paas-open-api': systemConfig['paas-open-api'].name,
      'app-api': systemConfig['app-api'].name,
      'backend-api': systemConfig['backend-api'].name,
    };
  }
  return cachedSystemClassNames;
}

const SYSTEM_EXAMPLES: Record<ApiSystem, LanguageExampleSet> = {
  'llm-open-api': exampleSet(
    `const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: "Hello world!" }],
  });
  console.log(response.choices[0].message.content);`,
    'client.chat.completions.create(...)',
  ),
  'image-open-api': exampleSet(
    `const image = await client.images.generations.create({
    model: "gpt-image-1",
    prompt: "A clean SDKWork router architecture diagram",
  });
  console.log(image.data[0].url);`,
    'client.images.generations.create(...)',
  ),
  'video-open-api': exampleSet(
    `const task = await client.video.generations.create({
    providerCode: "kling",
    prompt: "A product demo video storyboard",
  });
  console.log(task.id);`,
    'client.video.generations.create(...)',
  ),
  'audio-open-api': exampleSet(
    `const speech = await client.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "alloy",
    input: "Welcome to SDKWork Documents.",
  });
  console.log(speech);`,
    'client.audio.speech.create(...)',
  ),
  'drive-open-api': exampleSet(
    `const files = await client.files.list({
    limit: 20,
  });
  console.log(files.data);`,
    'client.files.list(...)',
  ),
  'knowledgebase-open-api': exampleSet(
    `const stores = await client.vectorStores.list({
    limit: 20,
  });
  console.log(stores.data);`,
    'client.vectorStores.list(...)',
  ),
  'memory-open-api': exampleSet(
    `const conversations = await client.conversations.list({
    limit: 20,
  });
  console.log(conversations.data);`,
    'client.conversations.list(...)',
  ),
  'agent-open-api': exampleSet(
    `const assistants = await client.assistants.list({
    limit: 20,
  });
  console.log(assistants.data);`,
    'client.assistants.list(...)',
  ),
  'payment-open-api': exampleSet(
    `const intent = await client.payments.intents.create({
    amount: 1999,
    currency: "USD",
    providerCode: "stripe",
  });
  console.log(intent.id);`,
    'client.payments.intents.create(...)',
  ),
  'iaas-open-api': exampleSet(
    `const config = await client.storage.sdkConfig.retrieve({
    providerCode: "aws_s3",
    bucket: "uploads",
  });
  console.log(config.data.endpoint);`,
    'client.storage.sdkConfig.retrieve(...)',
  ),
  'paas-open-api': exampleSet(
    `const result = await client.ocr.recognitions.create({
    providerCode: "baidu",
    imageUrl: "https://example.com/invoice.png",
  });
  console.log(result.blocks);`,
    'client.ocr.recognitions.create(...)',
  ),
  'app-api': exampleSet(
    `const profile = await client.iam.users.current.retrieve();
  console.log(profile);`,
    'client.iam.users.current.retrieve()',
  ),
  'backend-api': exampleSet(
    `const apiKeys = await client.iam.apiKeys.list();
  console.log(apiKeys);`,
    'client.iam.apiKeys.list()',
  ),
};

export const getSdkDataForSystem = (system: ApiSystem): SdkLanguage[] => {
  const pkgs = systemPackageNames()[system];
  const cls = systemClassNames()[system];
  const ex = SYSTEM_EXAMPLES[system];
  const sysName = SYSTEM_NAMES[system];
  const generatedSdk = getSdkSystemConfig()[system];
  const defaultBaseUrl = isOpenCompatibleSystem(system)
    ? fallbackOpenApiBaseUrl(generatedSdk.apiPrefix)
    : generatedSdk.apiPrefix;

  return [
    {
      id: 'typescript',
      name: 'TypeScript / Node.js',
      icon: 'Terminal',
      description: `Generated TypeScript SDK for ${sysName} in Node.js and browser environments.`,
      installCommand: `npm install ${pkgs.ts}`,
      importCode: `import { ${cls} } from "${pkgs.ts}";`,
      initCode: `const client = new ${cls}({\n  baseUrl: ${NODE_ENV_REFERENCE}.SDKWORK_API_BASE_URL ?? "${defaultBaseUrl}",\n  apiKey: ${NODE_ENV_REFERENCE}.SDKWORK_API_KEY,\n});`,
      exampleCode: ex.ts,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'python',
      name: 'Python',
      icon: 'Code',
      description: `Generated Python SDK for ${sysName}.`,
      installCommand: `pip install ${pkgs.py}`,
      importCode: `from ${pkgs.py.replace(/-/g, '_')} import ${cls}`,
      initCode: `client = ${cls}(\n    api_key="YOUR_API_KEY"\n)`,
      exampleCode: ex.py,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'go',
      name: 'Go',
      icon: 'TerminalSquare',
      description: `Generated Go SDK for ${sysName}.`,
      installCommand: `go get ${pkgs.go}`,
      importCode: `import "${pkgs.go}"`,
      initCode: `client := cloud.New${cls}(os.Getenv("SDKWORK_API_KEY"))`,
      exampleCode: ex.go,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'java',
      name: 'Java',
      icon: 'Coffee',
      description: `Generated Java SDK for ${sysName}.`,
      installCommand: `<dependency>\n  <groupId>com.sdkwork</groupId>\n  <artifactId>${pkgs.java}</artifactId>\n  <version>1.0.0</version>\n</dependency>`,
      importCode: `import com.sdkwork.${pkgs.java.replace(/-/g, '')}.${cls};`,
      initCode: `${cls} client = ${cls}.builder()\n    .apiKey(System.getenv("SDKWORK_API_KEY"))\n    .build();`,
      exampleCode: ex.java,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'ruby',
      name: 'Ruby',
      icon: 'Gem',
      description: `Generated Ruby SDK for ${sysName}.`,
      installCommand: `gem install ${pkgs.ruby}`,
      importCode: `require '${pkgs.ruby.replace(/-/g, '_')}'`,
      initCode: `client = Sdkwork::${cls}.new(api_key: ENV['SDKWORK_API_KEY'])`,
      exampleCode: ex.ruby,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'php',
      name: 'PHP',
      icon: 'FileCode2',
      description: `Generated PHP SDK for ${sysName}.`,
      installCommand: `composer require ${pkgs.php}`,
      importCode: `require_once('vendor/autoload.php');\nuse Sdkwork\\${cls};`,
      initCode: `$client = new ${cls}($_ENV['SDKWORK_API_KEY']);`,
      exampleCode: ex.php,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'csharp',
      name: 'C# (.NET)',
      icon: 'Hash',
      description: `Generated C# .NET SDK for ${sysName}.`,
      installCommand: `dotnet add package ${pkgs.csharp}`,
      importCode: `using ${pkgs.csharp};`,
      initCode: `var client = new ${cls}(Environment.GetEnvironmentVariable("SDKWORK_API_KEY"));`,
      exampleCode: ex.csharp,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'rust',
      name: 'Rust',
      icon: 'Cog',
      description: `Generated Rust SDK for ${sysName}.`,
      installCommand: `cargo add ${pkgs.rust}`,
      importCode: `use ${pkgs.rust.replace(/-/g, '_')}::${cls};`,
      initCode: `let client = ${cls}::new(env::var("SDKWORK_API_KEY").unwrap());`,
      exampleCode: ex.rust,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
    {
      id: 'flutter',
      name: 'Flutter / Dart',
      icon: 'Smartphone',
      description: `Generated Flutter/Dart SDK for ${sysName}.`,
      installCommand: `flutter pub add ${pkgs.flutter}`,
      importCode: `import 'package:${pkgs.flutter}/${pkgs.flutter}.dart';`,
      initCode: `final client = ${cls}(apiKey: Platform.environment['SDKWORK_API_KEY']!);`,
      exampleCode: ex.flutter,
      githubUrl: `${GITHUB_BASE_URL}/${generatedSdk.sourceDir}`,
    },
  ];
};

function packageSet(system: ApiSystem, stem: string, classStem: string): LanguagePackageSet {
  return packageSetFromMetadata(getSdkSystemConfig()[system], stem, classStem);
}

function packageSetFromMetadata(
  metadata: GeneratedSdkMetadata,
  stem: string,
  classStem: string,
): LanguagePackageSet {
  const slug = metadata.packageName.replace(/^@sdkwork\//, '').replace(/-sdk$/, '');
  const resolvedStem = stem || slug.replace(/^sdkwork-/, '');
  const pascal = classStem || resolvedStem
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  return {
    ts: metadata.packageName,
    py: `sdkwork-${resolvedStem}-sdk`,
    go: `github.com/sdkwork/${resolvedStem}-sdk`,
    java: `${resolvedStem}-sdk-java`,
    ruby: `sdkwork-${resolvedStem}-sdk`,
    php: `sdkwork/${resolvedStem}-sdk-php`,
    csharp: `Sdkwork.${pascal}Sdk`,
    rust: `${resolvedStem}-sdk`,
    flutter: `${resolvedStem.replace(/-/g, '_')}_sdk`,
  };
}

function exampleSet(typescriptBody: string, genericCall: string): LanguageExampleSet {
  return {
    ts: `async function main() {\n  ${typescriptBody}\n}\n\nmain();`,
    py: `def main():\n    response = ${genericCall}\n    print(response)\n\nif __name__ == "__main__":\n    main()`,
    go: `func main() {\n    response, err := ${genericCall}\n    if err != nil {\n        log.Fatal(err)\n    }\n    fmt.Println(response)\n}`,
    java: `public class Main {\n    public static void main(String[] args) {\n        Object response = ${genericCall};\n        System.out.println(response);\n    }\n}`,
    ruby: `response = ${genericCall}\nputs response`,
    php: `$response = ${genericCall};\nprint_r($response);`,
    csharp: `var response = await ${genericCall};\nConsole.WriteLine(response);`,
    rust: `let response = ${genericCall}.await?;\nprintln!("{:?}", response);`,
    flutter: `void main() async {\n  final response = await ${genericCall};\n  print(response);\n}`,
  };
}

function fallbackOpenApiBaseUrl(apiPrefix: string): string {
  // §6.3: the displayed open-api edge derives from the current page host via
  // the shared resolver (api[-<env>].<brand> family) instead of a pinned
  // production literal; non-vendor prefixes are surfaced as-authored.
  return apiPrefix === '/v1' ? resolveBaseUrlWithAlignProtocol({ mode: 'cloud' }).url : apiPrefix;
}

function isOpenCompatibleSystem(system: ApiSystem): boolean {
  return system === 'llm-open-api'
    || system === 'image-open-api'
    || system === 'video-open-api'
    || system === 'audio-open-api'
    || system === 'drive-open-api'
    || system === 'knowledgebase-open-api'
    || system === 'memory-open-api'
    || system === 'agent-open-api';
}
