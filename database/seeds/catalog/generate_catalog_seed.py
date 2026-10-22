#!/usr/bin/env python3
"""Generate the SDKWork developer catalog seed from the workspace.

The developer catalog is owned by the ``sdkwork-documents`` database module.
This generator scans every ``<workspace>/sdkwork-*`` sibling for

* OpenAPI authority documents under ``apis/<surface>/`` and
* SDK manifests under ``sdks/*/sdk-manifest.json``,

and emits idempotent PostgreSQL seed files plus a machine-readable summary.

Usage (from the sdkwork-documents repository root):

    python database/seeds/catalog/generate_catalog_seed.py
    python database/seeds/catalog/generate_catalog_seed.py --check

The workspace root defaults to the parent directory of this repository and can
be overridden with ``SDKWORK_WORKSPACE_ROOT`` or ``--workspace-root``. The
generated SQL is committed, so seeding does not require the siblings.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import uuid
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:  # pragma: no cover - the workspace ships PyYAML for the spec tools
    yaml = None

REPO_ROOT = Path(__file__).resolve().parents[3]
CONFIG_PATH = Path(__file__).resolve().parent / "catalog.config.json"
SEEDS_ROOT = REPO_ROOT / "database/seeds/common"
SUMMARY_PATH = Path(__file__).resolve().parent / "catalog.summary.json"

NAMESPACE = uuid.UUID("6f1f9d2e-9c1a-5d43-8f6e-2f0f4c7b2a11")
CATEGORY_NAMESPACE = uuid.uuid5(NAMESPACE, "category")
MODULE_NAMESPACE = uuid.uuid5(NAMESPACE, "module")
SURFACE_NAMESPACE = uuid.uuid5(NAMESPACE, "surface")
SCHEMA_NAMESPACE = uuid.uuid5(NAMESPACE, "schema")
OPERATION_NAMESPACE = uuid.uuid5(NAMESPACE, "operation")
SDK_NAMESPACE = uuid.uuid5(NAMESPACE, "sdk-family")
RELEASE_NAMESPACE = uuid.uuid5(NAMESPACE, "sdk-release")
SYNC_NAMESPACE = uuid.uuid5(NAMESPACE, "sync")

JSON_TAG = "$sdkwork_catalog$"
HTTP_METHODS = ("get", "post", "put", "patch", "delete", "head", "options", "trace")
SURFACE_DIRS = {
    "open-api": "open",
    "app-api": "app",
    "backend-api": "backend",
    "internal-api": "internal",
    "gateway-api": "gateway",
    "admin-api": "admin",
    "rpc": "rpc",
}
SKIP_SEGMENTS = {
    ".git",
    ".github",
    ".artifacts",
    ".tmp",
    ".workbuddy",
    ".zcode",
    "node_modules",
    "target",
    "target-audit",
    "target-rust-tests",
    "dist",
    "generated",
    "vendor",
    "coverage",
    "test",
    "tests",
    "fixtures",
    "examples",
    "deployments",
}
API_BATCHES = 8
SDK_BATCHES = 2
FEATURED_MODULES = {
    "sdkwork-cloudrouter",
    "sdkwork-iam",
    "sdkwork-documents",
    "sdkwork-drive",
    "sdkwork-knowledgebase",
    "sdkwork-appstore",
    "sdkwork-payment",
    "sdkwork-agents",
}
TYPE_ORDER = {"open": 10, "app": 20, "backend": 30, "internal": 40, "gateway": 50, "admin": 60, "custom": 70, "rpc": 80}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="verify the committed seed is current")
    parser.add_argument(
        "--workspace-root",
        default=os.environ.get("SDKWORK_WORKSPACE_ROOT", str(REPO_ROOT.parent)),
        help="directory containing the sdkwork-* sibling repositories",
    )
    return parser.parse_args()


def gate(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sanitize(value: Any) -> Any:
    """Replace lone UTF-16 surrogates that some hand-authored specs contain.

    PostgreSQL ``jsonb`` rejects unpaired surrogates, and JSON escapes such as
    ``\\udc82`` decode into them. Re-encoding with replacement keeps the catalog
    importable without dropping the whole document.
    """
    if isinstance(value, str):
        return value.encode("utf-8", "replace").decode("utf-8")
    if isinstance(value, list):
        return [sanitize(item) for item in value]
    if isinstance(value, dict):
        return {sanitize(key): sanitize(item) for key, item in value.items()}
    return value


def parse_document(path: Path) -> dict[str, Any] | None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if path.suffix.lower() == ".json":
        try:
            value = json.loads(text)
        except json.JSONDecodeError:
            return None
    else:
        if yaml is None:
            return None
        try:
            value = yaml.safe_load(text)
        except yaml.YAMLError:  # type: ignore[union-attr]
            return None
    value = sanitize(value)
    if not isinstance(value, dict) or not isinstance(value.get("paths"), dict):
        return None
    if not isinstance(value.get("info"), dict):
        value["info"] = {}
    return value


def relative_to_workspace(path: Path, workspace: Path) -> str:
    try:
        return path.relative_to(workspace).as_posix()
    except ValueError:
        return path.as_posix()


def slug(value: str, fallback: str = "item") -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return normalized or fallback


def canonical_language(code: str) -> str | None:
    normalized = (code or "").strip().lower()
    aliases = {
        "c#": "csharp",
        "cs": "csharp",
        "csharp": "csharp",
        "node": "typescript",
        "nodejs": "typescript",
        "js": "javascript",
        "golang": "go",
        "dart": "dart",
        "flutter": "flutter",
        "kt": "kotlin",
        "py": "python",
        "rs": "rust",
        "ts": "typescript",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized if re.fullmatch(r"[a-z0-9+#]+", normalized or "") else None


def version_key(version: str) -> tuple[int, ...]:
    parts: list[int] = []
    for part in re.split(r"[.\-+]", version or "0"):
        digits = re.match(r"\d+", part)
        if digits:
            parts.append(int(digits.group(0)))
    return tuple(parts) or (0,)


def infer_surface(document: dict[str, Any]) -> None:
    """Reserved for future x-sdkwork-surface hints."""


def infer_api_prefix(document: dict[str, Any], surface: str, defaults: dict[str, str]) -> str:
    hinted = document.get("x-sdkwork-api-prefix")
    if isinstance(hinted, str) and hinted.strip():
        return hinted.strip()
    paths = [path for path in document.get("paths", {}) if isinstance(path, str) and path.startswith("/")]
    segments = [path.strip("/").split("/") for path in paths if path.strip("/")]
    if segments:
        width = min(len(item) for item in segments)
        prefix: list[str] = []
        for index in range(width):
            part = segments[0][index]
            if part.startswith("{") or any(item[index] != part for item in segments):
                break
            prefix.append(part)
        if prefix:
            return "/" + "/".join(prefix)
    return defaults.get(surface, "")


def extract_operations(document: dict[str, Any]) -> list[dict[str, Any]]:
    operations: list[dict[str, Any]] = []
    seen: set[str] = set()
    order = 0
    for api_path, path_item in document.get("paths", {}).items():
        if not isinstance(path_item, dict):
            continue
        for method in HTTP_METHODS:
            operation = path_item.get(method)
            if not isinstance(operation, dict):
                continue
            order += 10
            operation_id = operation.get("operationId")
            if not isinstance(operation_id, str) or not operation_id.strip():
                operation_id = f"{method.upper()}:{api_path}"
            operation_key = operation_id.strip()
            if operation_key in seen:
                continue
            seen.add(operation_key)
            tags = operation.get("tags") if isinstance(operation.get("tags"), list) else []
            operations.append(
                {
                    "operation_key": operation_key,
                    "method": method.upper(),
                    "path": api_path,
                    "summary": str(operation.get("summary") or "").strip(),
                    "description": str(operation.get("description") or "").strip(),
                    "tags": [str(tag) for tag in tags if isinstance(tag, (str, int, float))],
                    "deprecated": bool(operation.get("deprecated")),
                    "sort_order": order,
                }
            )
    return operations


def extract_tags(document: dict[str, Any], operations: list[dict[str, Any]]) -> list[str]:
    seen: dict[str, None] = {}
    declared = document.get("tags")
    if isinstance(declared, list):
        for tag in declared:
            name = tag.get("name") if isinstance(tag, dict) else tag
            if isinstance(name, str) and name.strip():
                seen.setdefault(name.strip(), None)
    for operation in operations:
        for tag in operation["tags"]:
            seen.setdefault(tag, None)
    return list(seen)


def extract_auth_modes(document: dict[str, Any]) -> list[str]:
    modes: dict[str, None] = {}
    schemes = document.get("components", {}).get("securitySchemes")
    if isinstance(schemes, dict):
        for scheme in schemes.values():
            if not isinstance(scheme, dict):
                continue
            scheme_type = str(scheme.get("type") or "").strip()
            if scheme_type:
                modes.setdefault(scheme_type, None)
            if str(scheme.get("scheme") or "").lower() == "bearer":
                modes.setdefault("bearer", None)
    if not modes:
        security = document.get("security")
        if isinstance(security, list) and security:
            modes.setdefault("custom", None)
    return sorted(modes)


def extract_servers(document: dict[str, Any]) -> list[dict[str, str]]:
    servers = document.get("servers")
    if not isinstance(servers, list):
        return []
    result: list[dict[str, str]] = []
    for server in servers:
        if not isinstance(server, dict):
            continue
        url = server.get("url")
        if isinstance(url, str) and url.strip():
            item = {"url": url.strip()}
            description = server.get("description")
            if isinstance(description, str) and description.strip():
                item["description"] = description.strip()
            result.append(item)
    return result


def infer_sdk_type(manifest: dict[str, Any], sdk_code: str) -> str:
    for key in ("sdkType", "sdkSurface"):
        value = manifest.get(key)
        if isinstance(value, str) and value.strip():
            normalized = value.strip().lower()
            if normalized in TYPE_ORDER:
                return normalized
            if normalized in ("ai", "custom"):
                return "custom"
            if normalized in ("open", "app", "backend", "internal", "gateway", "admin"):
                return normalized
    discovery = manifest.get("discoverySurface")
    if isinstance(discovery, dict):
        target = discovery.get("sdkTarget")
        if isinstance(target, str) and target.strip():
            normalized = target.strip().lower()
            if normalized in TYPE_ORDER:
                return normalized
            if normalized in ("open", "app", "backend"):
                return normalized
    code = sdk_code.lower()
    for suffix, value in (
        ("-app-sdk", "app"),
        ("-backend-sdk", "backend"),
        ("-open-sdk", "open"),
        ("-open-api-sdk", "open"),
        ("-internal-sdk", "internal"),
        ("-rpc-sdk", "rpc"),
        ("-admin-sdk", "admin"),
        ("-admin-storage-sdk", "admin"),
    ):
        if code.endswith(suffix):
            return value
    if code.endswith("-sdk"):
        return "open"
    return "custom"


def surface_from_dir(directory: str) -> str:
    if directory in SURFACE_DIRS:
        return SURFACE_DIRS[directory]
    if directory.endswith("-api"):
        return slug(directory[: -len("-api")], "custom")
    return "custom"


def install_command(language: str, package_name: str, version: str) -> str | None:
    package = package_name.strip()
    if not package:
        return None
    if language in ("typescript", "javascript"):
        return f"npm install {package}@{version}"
    if language == "python":
        return f"pip install {package}=={version}"
    if language == "java":
        return f"mvn dependency:get -Dartifact={package}:{version}"
    if language == "kotlin":
        return f'implementation("{package}:{version}")'
    if language == "go":
        return f"go get {package}@{version}"
    if language == "rust":
        return f"cargo add {package}@{version}"
    if language == "dart":
        return f"dart pub add {package}"
    if language == "flutter":
        return f"flutter pub add {package}"
    if language == "csharp":
        return f"dotnet add package {package} --version {version}"
    if language == "php":
        return f"composer require {package}:{version}"
    if language == "ruby":
        return f"gem install {package} -v {version}"
    if language == "swift":
        return f'.package(url: "{package}", from: "{version}")'
    return None


def sql_text(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + str(value).replace("'", "''") + "'"


def sql_json(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    gate(JSON_TAG not in payload, "OpenAPI document contains the catalog dollar-quote tag")
    return f"{JSON_TAG}{payload}{JSON_TAG}::jsonb"


def sql_uuid(value: uuid.UUID) -> str:
    return sql_text(str(value))


def stable_id(namespace: uuid.UUID, value: str) -> uuid.UUID:
    return uuid.uuid5(namespace, value)


class Catalog:
    def __init__(self, config: dict[str, Any], workspace: Path) -> None:
        self.config = config
        self.workspace = workspace
        self.tenant = int(config.get("tenantId") or 100001)
        self.categories = config["categories"]
        self.category_by_code = {item["code"]: item for item in self.categories}
        self.module_categories = config.get("modules") or {}
        self.surface_labels = config.get("surfaceLabels") or {}
        self.surface_defaults = config.get("surfaceApiPrefixDefaults") or {}
        self.tag_categories = config.get("tagCategories") or {}
        self.languages = config.get("languages") or []
        self.language_codes = {
            code
            for code in (canonical_language(str(item.get("code") or "")) for item in self.languages)
            if code
        }
        self.modules: list[dict[str, Any]] = []
        self.surfaces: list[dict[str, Any]] = []
        self.sdks: list[dict[str, Any]] = []

    # -- discovery ---------------------------------------------------------

    def discover(self) -> None:
        repo_dirs = sorted(
            [path for path in self.workspace.iterdir() if path.is_dir() and path.name.startswith("sdkwork-")],
            key=lambda path: path.name,
        )
        for repo in repo_dirs:
            if not repo.name.startswith("sdkwork-") or repo.name in ("sdkwork-specs", "sdkwork-sdk-generator"):
                continue
            self.discover_module(repo)
        self.modules.sort(key=lambda item: (item["category_sort"], item["module_code"]))
        for index, module in enumerate(self.modules, start=1):
            module["sort_order"] = index * 10
        self.surfaces.sort(key=lambda item: (item["module_sort"], TYPE_ORDER.get(item["surface_code"], 999), item["api_authority"]))
        for index, surface in enumerate(self.surfaces, start=1):
            surface["sort_order"] = index * 10
        self.sdks.sort(key=lambda item: (item["module_sort"], TYPE_ORDER.get(item["sdk_type"], 999), item["sdk_code"]))
        for index, sdk in enumerate(self.sdks, start=1):
            sdk["sort_order"] = index * 10

    def discover_module(self, repo: Path) -> None:
        app_config = repo / "sdkwork.app.config.json"
        package_json = repo / "package.json"
        app: dict[str, Any] = {}
        backend: dict[str, Any] = {}
        if app_config.exists():
            try:
                app_document = read_json(app_config)
                app = app_document.get("app") or {}
                backend = app_document.get("backend") or {}
            except json.JSONDecodeError:
                pass
        package: dict[str, Any] = {}
        if package_json.exists():
            try:
                package = read_json(package_json)
            except json.JSONDecodeError:
                pass
        module_code = str(app.get("key") or package.get("name") or repo.name).strip()
        module_code = module_code or repo.name
        if any(existing["module_code"] == module_code for existing in self.modules):
            module_code = repo.name
            index = 2
            while any(existing["module_code"] == module_code for existing in self.modules):
                module_code = f"{repo.name}-{index}"
                index += 1
        module_name = str(app.get("displayName") or app.get("name") or repo.name).strip() or repo.name
        description = str(app.get("description") or package.get("description") or "").strip()
        categories = self.module_categories.get(repo.name) or self.module_categories.get(module_code) or ["other"]
        categories = [code for code in categories if code in self.category_by_code] or ["other"]
        module = {
            "id": stable_id(MODULE_NAMESPACE, module_code),
            "module_code": module_code,
            "module_name": module_name,
            "description": description,
            "categories": categories,
            "category_code": categories[0],
            "category_sort": self.category_by_code[categories[0]]["sortOrder"],
            "domain_code": str(backend.get("domain") or "").strip() or None,
            "capability_code": str(backend.get("capability") or "").strip() or None,
            "official_url": str(app.get("officialWebsiteUrl") or "").strip() or None,
            "icon_url": str(app.get("iconUrl") or "").strip() or None,
            "repository_path": repo.name,
            "owner_team": module_code,
            "metadata": {
                "appType": app.get("appType") or None,
                "apiAuthorities": backend.get("apiAuthorities") or [],
            },
            "surfaces": [],
            "sdks": [],
            "repo": repo,
        }
        self.modules.append(module)
        self.discover_apis(repo, module)
        self.discover_sdks(repo, module)
        if not module["surfaces"] and not module["sdks"]:
            self.modules.remove(module)

    def discover_apis(self, repo: Path, module: dict[str, Any]) -> None:
        apis_root = repo / "apis"
        if not apis_root.exists():
            return
        for path in sorted(apis_root.rglob("*")):
            if not path.is_file():
                continue
            if any(part in SKIP_SEGMENTS for part in path.parts):
                continue
            if not re.search(r"openapi.*\.(json|ya?ml)$", path.name, re.IGNORECASE):
                continue
            try:
                relative_parts = path.relative_to(apis_root).parts
            except ValueError:
                continue
            if len(relative_parts) < 2:
                continue
            surface_code = surface_from_dir(relative_parts[0])
            document = parse_document(path)
            if document is None:
                continue
            info = document.get("info") or {}
            operations = extract_operations(document)
            tags = extract_tags(document, operations)
            authority = str(document.get("x-sdkwork-api-authority") or "").strip()
            if not authority:
                authority = self.authority_from_manifests(repo, path) or (
                    f"{module['module_code']}-{surface_code}-api"
                )
            authority = self.unique_authority(authority, surface_code)
            primary_category = module["category_code"]
            category_codes = [primary_category]
            for tag in tags:
                mapped = self.map_tag(tag)
                if mapped and mapped not in category_codes:
                    category_codes.append(mapped)
                if len(category_codes) >= 4:
                    break
            title = str(info.get("title") or f"{module['module_name']} {self.surface_name(surface_code)}").strip()
            version = str(info.get("version") or "0.1.0").strip()
            description = str(info.get("description") or self.surface_description(surface_code)).strip()
            featured = (
                module["repository_path"] in FEATURED_MODULES
                and surface_code in ("open", "app")
                and len(module["surfaces"]) == 0
            )
            surface = {
                "id": stable_id(SURFACE_NAMESPACE, authority),
                "module_id": module["id"],
                "module_code": module["module_code"],
                "module_sort": module["category_sort"],
                "surface_code": surface_code,
                "surface_name": self.surface_name(surface_code),
                "title": title,
                "description": description,
                "api_version": version,
                "api_authority": authority,
                "api_prefix": infer_api_prefix(document, surface_code, self.surface_defaults),
                "protocol_code": "http-openapi",
                "spec_format": "json" if path.suffix.lower() == ".json" else "yaml",
                "operation_count": len(operations),
                "tag_count": len(tags),
                "server_count": len(extract_servers(document)),
                "auth_modes": extract_auth_modes(document),
                "servers": extract_servers(document),
                "category_code": primary_category,
                "category_codes": category_codes,
                "featured": featured,
                "deprecated": bool(info.get("deprecated") or document.get("x-sdkwork-deprecated")),
                "publish_status": "published" if operations else "draft",
                "source_path": relative_to_workspace(path, self.workspace),
                "schema_checksum": hashlib.sha256(
                    json.dumps(document, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
                ).hexdigest(),
                "spec": document,
                "tags": tags,
                "operations": operations,
                "metadata": {
                    "tagNames": tags,
                    "xSdkworkOwner": document.get("x-sdkwork-owner") or None,
                    "xSdkworkDomain": document.get("x-sdkwork-domain") or None,
                    "xSdkworkCapability": document.get("x-sdkwork-capability") or None,
                    "xSdkworkSdkFamily": document.get("x-sdkwork-sdk-family") or None,
                },
            }
            module["surfaces"].append(surface)
            self.surfaces.append(surface)

    def discover_sdks(self, repo: Path, module: dict[str, Any]) -> None:
        sdks_root = repo / "sdks"
        if not sdks_root.exists():
            return
        for path in sorted(sdks_root.glob("*/sdk-manifest.json")):
            if any(part in SKIP_SEGMENTS for part in path.parts):
                continue
            try:
                manifest = read_json(path)
            except json.JSONDecodeError:
                continue
            if not isinstance(manifest, dict):
                continue
            sdk_code = str(
                manifest.get("sdkFamily")
                or manifest.get("sdkName")
                or manifest.get("workspace")
                or path.parent.name
            ).strip()
            sdk_code = sdk_code or path.parent.name
            if any(existing["sdk_code"] == sdk_code for existing in self.sdks):
                continue
            sdk_type = infer_sdk_type(manifest, sdk_code)
            discovery = manifest.get("discoverySurface") if isinstance(manifest.get("discoverySurface"), dict) else {}
            owner = str(manifest.get("sdkOwner") or module["module_code"]).strip()
            target_module = next((item for item in self.modules if item["module_code"] == owner), module)
            languages = self.collect_languages(manifest, path.parent)
            if not languages:
                continue
            version = str(
                manifest.get("fixedSdkVersion")
                or manifest.get("apiVersion")
                or manifest.get("version")
                or max((item["version"] for item in languages), key=version_key)
                or "0.1.0"
            )
            api_prefix = str(manifest.get("apiPrefix") or discovery.get("apiPrefix") or "").strip() or None
            package_name = str(
                manifest.get("packageName")
                or manifest.get("transportPackageName")
                or languages[0]["package_name"]
            ).strip()
            title = str(manifest.get("title") or "").strip()
            description = title or f"{target_module['module_name']} {self.surface_name(sdk_type)} SDK"
            sdk = {
                "id": stable_id(SDK_NAMESPACE, sdk_code),
                "module_id": target_module["id"],
                "module_code": target_module["module_code"],
                "module_sort": target_module["category_sort"],
                "sdk_code": sdk_code,
                "sdk_name": title or sdk_code,
                "sdk_family": sdk_code,
                "sdk_type": sdk_type,
                "surface_code": sdk_type if sdk_type in TYPE_ORDER else "custom",
                "package_name": package_name or None,
                "transport_package_name": manifest.get("transportPackageName") or None,
                "api_authority": manifest.get("apiAuthority") or None,
                "api_prefix": api_prefix,
                "description": description,
                "sdk_version": version,
                "license_code": str(manifest.get("license") or "MIT"),
                "repository_url": f"https://github.com/sdkwork/{target_module['repository_path']}",
                "docs_url": None,
                "support_level": "standard",
                "pricing_tier": "free",
                "featured": target_module["repository_path"] in FEATURED_MODULES and sdk_type in ("open", "app"),
                "category_code": target_module["category_code"],
                "category_codes": target_module["categories"],
                "source_path": relative_to_workspace(path, self.workspace),
                "languages": languages,
                "metadata": {
                    "sdkTarget": discovery.get("sdkTarget") or None,
                    "authoritySpec": manifest.get("authoritySpec") or None,
                    "standardProfile": manifest.get("standardProfile") or None,
                    "ownerOnlyOperationCount": self.read_operation_count(manifest),
                },
            }
            for language in languages:
                language["id"] = stable_id(
                    RELEASE_NAMESPACE, f"{sdk_code}:{language['language_code']}:{language['version']}"
                )
                language["install_command"] = install_command(
                    language["language_code"], language["package_name"], language["version"]
                )
            latest: dict[str, dict[str, Any]] = {}
            for language in languages:
                current = latest.get(language["language_code"])
                if current is None or version_key(language["version"]) > version_key(current["version"]):
                    latest[language["language_code"]] = language
            for language in languages:
                language["is_latest"] = latest.get(language["language_code"]) is language
            target_module["sdks"].append(sdk)
            self.sdks.append(sdk)

    def collect_languages(
        self, manifest: dict[str, Any], sdk_dir: Path | None = None
    ) -> list[dict[str, Any]]:
        collected: dict[str, dict[str, Any]] = {}
        package_base = str(
            manifest.get("packageName")
            or manifest.get("sdkName")
            or manifest.get("sdkFamily")
            or "sdk"
        ).strip()
        version = str(
            manifest.get("fixedSdkVersion")
            or (manifest.get("generation") or {}).get("fixedVersion")
            or manifest.get("apiVersion")
            or "0.1.0"
        ).strip()

        def add_language(
            code: str,
            package_name: str | None = None,
            generated_path: str | None = None,
            metadata: dict[str, Any] | None = None,
            language_version: str | None = None,
            generation_state: str = "declared",
        ) -> None:
            normalized = canonical_language(code)
            if not normalized or normalized not in self.language_codes:
                return
            if normalized in collected:
                existing = collected[normalized]
                if generation_state == "materialized" and existing["generation_state"] != "materialized":
                    existing.update(
                        {
                            "package_name": package_name or existing["package_name"],
                            "version": language_version or existing["version"],
                            "generation_state": generation_state,
                            "generated_path": generated_path or existing["generated_path"],
                            "metadata": metadata or existing["metadata"],
                        }
                    )
                return
            collected[normalized] = {
                "language_code": normalized,
                "package_name": package_name
                or (package_base if normalized == "typescript" else f"{package_base}-{normalized}"),
                "version": language_version or version,
                "generation_state": generation_state,
                "release_state": "not_published",
                "generated_path": generated_path,
                "metadata": metadata or {},
            }

        declared = manifest.get("languages")
        if isinstance(declared, list):
            for entry in declared:
                if isinstance(entry, str):
                    add_language(entry)
                    continue
                if not isinstance(entry, dict):
                    continue
                code = canonical_language(str(entry.get("language") or ""))
                if not code or code not in self.language_codes or code in collected:
                    continue
                collected[code] = {
                    "language_code": code,
                    "package_name": str(
                        entry.get("consumerPackageName")
                        or entry.get("name")
                        or entry.get("transportPackageName")
                        or entry.get("packageName")
                        or f"{manifest.get('sdkFamily') or manifest.get('sdkName') or 'sdk'}-{code}"
                    ).strip(),
                    "version": str(
                        entry.get("version")
                        or manifest.get("fixedSdkVersion")
                        or manifest.get("apiVersion")
                        or version
                    ).strip(),
                    "generation_state": str(entry.get("generationState") or "declared"),
                    "release_state": str(entry.get("releaseState") or "not_published"),
                    "generated_path": entry.get("generatedPath") or entry.get("packagePath") or None,
                    "metadata": {
                        "workspace": entry.get("workspace") or None,
                        "transportPackageName": entry.get("transportPackageName") or None,
                        "consumerPackageName": entry.get("consumerPackageName") or None,
                        "primaryClient": (entry.get("consumerSurface") or {}).get("primaryClient")
                        if isinstance(entry.get("consumerSurface"), dict)
                        else None,
                    },
                }
        packages = manifest.get("generatedPackages")
        if isinstance(packages, dict):
            for key, entry in packages.items():
                code = canonical_language(str((entry or {}).get("language") or key))
                if not code or code not in self.language_codes or code in collected:
                    continue
                collected[code] = {
                    "language_code": code,
                    "package_name": str(
                        (entry or {}).get("packageName")
                        or f"{manifest.get('sdkFamily') or manifest.get('sdkName') or 'sdk'}-{code}"
                    ).strip(),
                    "version": version,
                    "generation_state": "declared",
                    "release_state": "not_published",
                    "generated_path": (entry or {}).get("generatedOutput"),
                    "metadata": {},
                }

        # Legacy manifests declare one language as `language`, a `typescript`
        # block, or only generated `<sdk>-<language>/` directories.
        add_language(str(manifest.get("language") or ""))
        typescript = manifest.get("typescript")
        if isinstance(typescript, dict):
            add_language(
                "typescript",
                package_name=package_base,
                generated_path=typescript.get("composedRoot"),
                metadata={"composedEntry": typescript.get("composedEntry")},
            )
        if sdk_dir is not None and sdk_dir.is_dir():
            sdk_code = str(
                manifest.get("sdkFamily") or manifest.get("sdkName") or sdk_dir.name
            ).strip()
            for child in sorted(sdk_dir.iterdir()):
                if not child.is_dir() or not child.name.startswith(f"{sdk_code}-"):
                    continue
                descriptor_path = child / "generated" / "server-openapi" / "sdkwork-sdk.json"
                if not descriptor_path.is_file():
                    continue
                try:
                    descriptor = read_json(descriptor_path)
                except json.JSONDecodeError:
                    continue
                if not isinstance(descriptor, dict):
                    continue
                add_language(
                    str(descriptor.get("language") or child.name[len(sdk_code) + 1 :]),
                    package_name=str(descriptor.get("packageName") or "").strip() or None,
                    generated_path=child.name,
                    metadata={
                        "sdkDescriptor": relative_to_workspace(descriptor_path, self.workspace),
                        "transportPackageName": descriptor.get("transportPackageName") or None,
                    },
                    language_version=str(descriptor.get("version") or "").strip() or None,
                    generation_state="materialized",
                )
        discovery = manifest.get("discoverySurface")
        if isinstance(discovery, dict):
            add_language(str(discovery.get("sdkTarget") or ""))
        if not collected and (
            manifest.get("authoritySpec")
            or manifest.get("generationInputSpec")
            or manifest.get("sdkType")
        ):
            # SDKWork SDK families default to generated TypeScript even when the
            # legacy manifest omits every language hint.
            add_language("typescript")

        return list(collected.values())

    @staticmethod
    def read_operation_count(manifest: dict[str, Any]) -> int | None:
        """Read ``ownerOnlyOperationCount`` from the top level or metadata bag."""
        direct = manifest.get("ownerOnlyOperationCount")
        if isinstance(direct, int):
            return direct
        metadata = manifest.get("metadata")
        if isinstance(metadata, dict):
            nested = metadata.get("ownerOnlyOperationCount")
            if isinstance(nested, int):
                return nested
        return None

    def authority_from_manifests(self, repo: Path, spec_path: Path) -> str | None:
        sdks_root = repo / "sdks"
        if not sdks_root.exists():
            return None
        for manifest_path in sorted(sdks_root.glob("*/sdk-manifest.json")):
            try:
                manifest = read_json(manifest_path)
            except json.JSONDecodeError:
                continue
            authority_spec = manifest.get("authoritySpec")
            if not isinstance(authority_spec, str):
                continue
            resolved = (manifest_path.parent / authority_spec).resolve()
            if resolved == spec_path.resolve():
                authority = manifest.get("apiAuthority")
                if isinstance(authority, str) and authority.strip():
                    return authority.strip()
        return None

    def unique_authority(self, authority: str, surface_code: str) -> str:
        if not any(item["api_authority"] == authority for item in self.surfaces):
            return authority
        candidate = f"{authority}-{surface_code}"
        index = 2
        while any(item["api_authority"] == candidate for item in self.surfaces):
            candidate = f"{authority}-{surface_code}-{index}"
            index += 1
        return candidate

    def map_tag(self, tag: str) -> str | None:
        normalized = tag.strip().lower()
        if normalized in self.tag_categories:
            return self.tag_categories[normalized]
        for key, category in self.tag_categories.items():
            if key in normalized:
                return category
        return None

    def surface_name(self, surface_code: str) -> str:
        label = self.surface_labels.get(surface_code) or self.surface_labels.get("custom") or {}
        return label.get("name") or f"{surface_code.title()} API"

    def surface_description(self, surface_code: str) -> str:
        label = self.surface_labels.get(surface_code) or {}
        return label.get("description") or ""


def render_sql(catalog: Catalog) -> dict[str, str]:
    tenant = catalog.tenant
    files: dict[str, str] = {}

    taxonomy: list[str] = [
        "-- 100_catalog_taxonomy.sql - developer catalog categories, SDK languages, and sync bookkeeping.",
        "-- Generated by database/seeds/catalog/generate_catalog_seed.py; do not hand-edit.",
        "",
        "INSERT INTO documents_catalog_category",
        "  (id, tenant_id, category_code, parent_code, category_kind, name, name_i18n, description,",
        "   icon, sort_order, category_level, category_path, category_status, metadata)",
        "VALUES",
    ]
    rows: list[str] = []
    for index, category in enumerate(catalog.categories):
        rows.append(
            "  ("
            + ", ".join(
                [
                    sql_uuid(stable_id(CATEGORY_NAMESPACE, f"domain:{category['code']}")),
                    str(tenant),
                    sql_text(category["code"]),
                    "NULL",
                    sql_text("domain"),
                    sql_text(category["name"]),
                    sql_json({"zh-CN": category.get("nameZh") or category["name"], "en-US": category["name"]}),
                    sql_text(category.get("description") or ""),
                    sql_text(category.get("icon") or ""),
                    str(int(category.get("sortOrder") or 0)),
                    "1",
                    sql_text(category["code"]),
                    sql_text("active"),
                    sql_json({}),
                ]
            )
            + ")"
        )
    taxonomy.append(",\n".join(rows))
    taxonomy.extend(
        [
            "ON CONFLICT (tenant_id, category_kind, category_code) DO UPDATE SET",
            "  name = EXCLUDED.name, name_i18n = EXCLUDED.name_i18n,",
            "  description = EXCLUDED.description, icon = EXCLUDED.icon,",
            "  sort_order = EXCLUDED.sort_order, category_path = EXCLUDED.category_path,",
            "  metadata = EXCLUDED.metadata, updated_at = NOW();",
            "",
            "INSERT INTO documents_sdk_language",
            "  (language_code, language_name, language_family, icon, file_extension, official_url, sort_order, language_status)",
            "VALUES",
        ]
    )
    language_rows = [
        "  ("
        + ", ".join(
            [
                sql_text(item["code"]),
                sql_text(item["name"]),
                sql_text(item.get("family") or "server"),
                sql_text(item.get("icon") or ""),
                sql_text(item.get("extension") or ""),
                sql_text(item.get("officialUrl") or ""),
                str(int(item.get("sortOrder") or 0)),
                sql_text("active"),
            ]
        )
        + ")"
        for item in catalog.languages
    ]
    taxonomy.append(",\n".join(language_rows))
    taxonomy.extend(
        [
            "ON CONFLICT (language_code) DO UPDATE SET",
            "  language_name = EXCLUDED.language_name, language_family = EXCLUDED.language_family,",
            "  icon = EXCLUDED.icon, file_extension = EXCLUDED.file_extension,",
            "  official_url = EXCLUDED.official_url, sort_order = EXCLUDED.sort_order;",
            "",
            "INSERT INTO documents_catalog_sync",
            "  (id, tenant_id, source_code, sync_status, started_at, finished_at, module_count,",
            "   api_surface_count, api_operation_count, sdk_family_count, sdk_release_count, metadata)",
            "VALUES",
            "  ("
            + ", ".join(
                [
                    sql_uuid(stable_id(SYNC_NAMESPACE, "workspace-scan")),
                    str(tenant),
                    sql_text("workspace-scan"),
                    sql_text("succeeded"),
                    "NOW()",
                    "NOW()",
                    str(len(catalog.modules)),
                    str(len(catalog.surfaces)),
                    str(sum(item["operation_count"] for item in catalog.surfaces)),
                    str(len(catalog.sdks)),
                    str(sum(len(item["languages"]) for item in catalog.sdks)),
                    sql_json({"generator": "database/seeds/catalog/generate_catalog_seed.py"}),
                ]
            )
            + ")",
            "ON CONFLICT (tenant_id, source_code) DO UPDATE SET",
            "  sync_status = EXCLUDED.sync_status, finished_at = EXCLUDED.finished_at,",
            "  module_count = EXCLUDED.module_count, api_surface_count = EXCLUDED.api_surface_count,",
            "  api_operation_count = EXCLUDED.api_operation_count,",
            "  sdk_family_count = EXCLUDED.sdk_family_count,",
            "  sdk_release_count = EXCLUDED.sdk_release_count, metadata = EXCLUDED.metadata;",
            "",
        ]
    )
    files["100_catalog_taxonomy.sql"] = "\n".join(taxonomy)

    modules: list[str] = [
        "-- 101_catalog_modules.sql - developer catalog module roster.",
        "-- Generated by database/seeds/catalog/generate_catalog_seed.py; do not hand-edit.",
        "",
        "INSERT INTO documents_catalog_module",
        "  (id, tenant_id, module_code, module_name, description, category_code, domain_code,",
        "   capability_code, official_url, icon_url, repository_path, owner_team, module_status,",
        "   sort_order, metadata)",
        "VALUES",
    ]
    module_rows: list[str] = []
    for module in catalog.modules:
        module_rows.append(
            "  ("
            + ", ".join(
                [
                    sql_uuid(module["id"]),
                    str(tenant),
                    sql_text(module["module_code"]),
                    sql_text(module["module_name"]),
                    sql_text(module["description"]),
                    sql_text(module["category_code"]),
                    sql_text(module["domain_code"]),
                    sql_text(module["capability_code"]),
                    sql_text(module["official_url"]),
                    sql_text(module["icon_url"]),
                    sql_text(module["repository_path"]),
                    sql_text(module["owner_team"]),
                    sql_text("active"),
                    str(module["sort_order"]),
                    sql_json(module["metadata"]),
                ]
            )
            + ")"
        )
    modules.append(",\n".join(module_rows))
    modules.extend(
        [
            "ON CONFLICT (tenant_id, module_code) DO UPDATE SET",
            "  module_name = EXCLUDED.module_name, description = EXCLUDED.description,",
            "  category_code = EXCLUDED.category_code, domain_code = EXCLUDED.domain_code,",
            "  capability_code = EXCLUDED.capability_code, official_url = EXCLUDED.official_url,",
            "  icon_url = EXCLUDED.icon_url, repository_path = EXCLUDED.repository_path,",
            "  owner_team = EXCLUDED.owner_team, sort_order = EXCLUDED.sort_order,",
            "  metadata = EXCLUDED.metadata, updated_at = NOW();",
            "",
        ]
    )
    files["101_catalog_modules.sql"] = "\n".join(modules)

    batches: list[list[dict[str, Any]]] = [[] for _ in range(API_BATCHES)]
    if catalog.surfaces:
        per_batch = max(1, (len(catalog.surfaces) + API_BATCHES - 1) // API_BATCHES)
        for index, surface in enumerate(catalog.surfaces):
            batches[min(index // per_batch, API_BATCHES - 1)].append(surface)
    for batch_index, batch in enumerate(batches, start=1):
        name = f"110_api_surfaces_{batch_index:02d}.sql"
        lines: list[str] = [
            f"-- {name} - developer catalog API surfaces (batch {batch_index}/{API_BATCHES}).",
            "-- Generated by database/seeds/catalog/generate_catalog_seed.py; do not hand-edit.",
            "",
        ]
        if not batch:
            lines.append("SELECT 1;")
            files[name] = "\n".join(lines) + "\n"
            continue
        lines.extend(
            [
                "INSERT INTO documents_api_surface",
                "  (id, tenant_id, module_id, surface_code, surface_name, title, description, api_version,",
                "   api_authority, api_prefix, protocol_code, spec_format, operation_count, tag_count,",
                "   server_count, auth_modes, servers, category_code, visibility, publish_status,",
                "   featured, deprecated, source_path, schema_checksum, metadata)",
                "VALUES",
            ]
        )
        surface_rows: list[str] = []
        for surface in batch:
            surface_rows.append(
                "  ("
                + ", ".join(
                    [
                        sql_uuid(surface["id"]),
                        str(tenant),
                        sql_uuid(surface["module_id"]),
                        sql_text(surface["surface_code"]),
                        sql_text(surface["surface_name"]),
                        sql_text(surface["title"]),
                        sql_text(surface["description"]),
                        sql_text(surface["api_version"]),
                        sql_text(surface["api_authority"]),
                        sql_text(surface["api_prefix"]),
                        sql_text(surface["protocol_code"]),
                        sql_text(surface["spec_format"]),
                        str(surface["operation_count"]),
                        str(surface["tag_count"]),
                        str(surface["server_count"]),
                        sql_json(surface["auth_modes"]),
                        sql_json(surface["servers"]),
                        sql_text(surface["category_code"]),
                        sql_text("public"),
                        sql_text(surface["publish_status"]),
                        "TRUE" if surface["featured"] else "FALSE",
                        "TRUE" if surface["deprecated"] else "FALSE",
                        sql_text(surface["source_path"]),
                        sql_text(surface["schema_checksum"]),
                        sql_json(surface["metadata"]),
                    ]
                )
                + ")"
            )
        lines.append(",\n".join(surface_rows))
        lines.extend(
            [
                "ON CONFLICT (tenant_id, api_authority) DO UPDATE SET",
                "  module_id = EXCLUDED.module_id, surface_code = EXCLUDED.surface_code,",
                "  surface_name = EXCLUDED.surface_name, title = EXCLUDED.title,",
                "  description = EXCLUDED.description, api_version = EXCLUDED.api_version,",
                "  api_prefix = EXCLUDED.api_prefix, spec_format = EXCLUDED.spec_format,",
                "  operation_count = EXCLUDED.operation_count, tag_count = EXCLUDED.tag_count,",
                "  server_count = EXCLUDED.server_count, auth_modes = EXCLUDED.auth_modes,",
                "  servers = EXCLUDED.servers, category_code = EXCLUDED.category_code,",
                "  publish_status = EXCLUDED.publish_status,",
                "  featured = EXCLUDED.featured, deprecated = EXCLUDED.deprecated,",
                "  source_path = EXCLUDED.source_path, schema_checksum = EXCLUDED.schema_checksum,",
                "  metadata = EXCLUDED.metadata, updated_at = NOW();",
                "",
            ]
        )
        for surface in batch:
            lines.extend(
                [
                    "INSERT INTO documents_api_schema",
                    "  (id, tenant_id, surface_id, schema_version, spec, schema_checksum, source_path, imported_at)",
                    "VALUES",
                    "  ("
                    + ", ".join(
                        [
                            sql_uuid(stable_id(SCHEMA_NAMESPACE, surface["api_authority"])),
                            str(tenant),
                            sql_uuid(surface["id"]),
                            sql_text(surface["api_version"]),
                            sql_json(surface["spec"]),
                            sql_text(surface["schema_checksum"]),
                            sql_text(surface["source_path"]),
                            "NOW()",
                        ]
                    )
                    + ")",
                    "ON CONFLICT (tenant_id, surface_id, schema_version) DO UPDATE SET",
                    "  spec = EXCLUDED.spec, schema_checksum = EXCLUDED.schema_checksum,",
                    "  source_path = EXCLUDED.source_path, imported_at = NOW();",
                    "",
                ]
            )
            if surface["operations"]:
                lines.extend(
                    [
                        "INSERT INTO documents_api_operation",
                        "  (id, tenant_id, surface_id, operation_key, method, path, summary, description,",
                        "   tags, deprecated, sort_order)",
                        "VALUES",
                    ]
                )
                operation_rows = []
                for operation in surface["operations"]:
                    operation_rows.append(
                        "  ("
                        + ", ".join(
                            [
                                sql_uuid(
                                    stable_id(
                                        OPERATION_NAMESPACE,
                                        f"{surface['api_authority']}:{operation['operation_key']}",
                                    )
                                ),
                                str(tenant),
                                sql_uuid(surface["id"]),
                                sql_text(operation["operation_key"]),
                                sql_text(operation["method"]),
                                sql_text(operation["path"]),
                                sql_text(operation["summary"]),
                                sql_text(operation["description"]),
                                sql_json(operation["tags"]),
                                "TRUE" if operation["deprecated"] else "FALSE",
                                str(operation["sort_order"]),
                            ]
                        )
                        + ")"
                    )
                lines.append(",\n".join(operation_rows))
                lines.extend(
                    [
                        "ON CONFLICT (tenant_id, surface_id, operation_key) DO UPDATE SET",
                        "  method = EXCLUDED.method, path = EXCLUDED.path, summary = EXCLUDED.summary,",
                        "  description = EXCLUDED.description, tags = EXCLUDED.tags,",
                        "  deprecated = EXCLUDED.deprecated, sort_order = EXCLUDED.sort_order;",
                        "",
                    ]
                )
            binding_rows = []
            for index, category_code in enumerate(surface["category_codes"]):
                binding_rows.append(
                    "  ("
                    + ", ".join(
                        [
                            str(tenant),
                            sql_uuid(surface["id"]),
                            sql_text(category_code),
                            "TRUE" if index == 0 else "FALSE",
                            str(index * 10),
                        ]
                    )
                    + ")"
                )
            lines.extend(
                [
                    "INSERT INTO documents_api_surface_category",
                    "  (tenant_id, surface_id, category_code, is_primary, sort_order)",
                    "VALUES",
                    ",\n".join(binding_rows),
                    "ON CONFLICT (tenant_id, surface_id, category_code) DO UPDATE SET",
                    "  is_primary = EXCLUDED.is_primary, sort_order = EXCLUDED.sort_order;",
                    "",
                ]
            )
        files[name] = "\n".join(lines)

    sdk_batches = [catalog.sdks[index::SDK_BATCHES] for index in range(SDK_BATCHES)]
    for batch_index, batch in enumerate(sdk_batches, start=1):
        name = f"120_sdk_families_{batch_index:02d}.sql"
        lines = [
            f"-- {name} - developer catalog SDK families (batch {batch_index}/{SDK_BATCHES}).",
            "-- Generated by database/seeds/catalog/generate_catalog_seed.py; do not hand-edit.",
            "",
        ]
        if not batch:
            lines.append("SELECT 1;")
            files[name] = "\n".join(lines) + "\n"
            continue
        lines.extend(
            [
                "INSERT INTO documents_sdk_family",
                "  (id, tenant_id, module_id, sdk_code, sdk_name, sdk_family, sdk_type, surface_code,",
                "   package_name, transport_package_name, api_authority, api_prefix, description,",
                "   sdk_version, license_code, repository_url, docs_url, support_level, pricing_tier,",
                "   visibility, publish_status, featured, deprecated, download_count, rating,",
                "   category_code, source_path, metadata)",
                "VALUES",
            ]
        )
        family_rows = []
        for sdk in batch:
            family_rows.append(
                "  ("
                + ", ".join(
                    [
                        sql_uuid(sdk["id"]),
                        str(tenant),
                        sql_uuid(sdk["module_id"]),
                        sql_text(sdk["sdk_code"]),
                        sql_text(sdk["sdk_name"]),
                        sql_text(sdk["sdk_family"]),
                        sql_text(sdk["sdk_type"]),
                        sql_text(sdk["surface_code"]),
                        sql_text(sdk["package_name"]),
                        sql_text(sdk["transport_package_name"]),
                        sql_text(sdk["api_authority"]),
                        sql_text(sdk["api_prefix"]),
                        sql_text(sdk["description"]),
                        sql_text(sdk["sdk_version"]),
                        sql_text(sdk["license_code"]),
                        sql_text(sdk["repository_url"]),
                        sql_text(sdk["docs_url"]),
                        sql_text(sdk["support_level"]),
                        sql_text(sdk["pricing_tier"]),
                        sql_text("public"),
                        sql_text("published"),
                        "TRUE" if sdk["featured"] else "FALSE",
                        "FALSE",
                        "0",
                        "5.0",
                        sql_text(sdk["category_code"]),
                        sql_text(sdk["source_path"]),
                        sql_json(sdk["metadata"]),
                    ]
                )
                + ")"
            )
        lines.append(",\n".join(family_rows))
        lines.extend(
            [
                "ON CONFLICT (tenant_id, sdk_code) DO UPDATE SET",
                "  module_id = EXCLUDED.module_id, sdk_name = EXCLUDED.sdk_name,",
                "  sdk_family = EXCLUDED.sdk_family, sdk_type = EXCLUDED.sdk_type,",
                "  surface_code = EXCLUDED.surface_code, package_name = EXCLUDED.package_name,",
                "  transport_package_name = EXCLUDED.transport_package_name,",
                "  api_authority = EXCLUDED.api_authority, api_prefix = EXCLUDED.api_prefix,",
                "  description = EXCLUDED.description, sdk_version = EXCLUDED.sdk_version,",
                "  repository_url = EXCLUDED.repository_url, featured = EXCLUDED.featured,",
                "  category_code = EXCLUDED.category_code, source_path = EXCLUDED.source_path,",
                "  metadata = EXCLUDED.metadata, updated_at = NOW();",
                "",
            ]
        )
        files[name] = "\n".join(lines)

    release_batches = [catalog.sdks[index::SDK_BATCHES] for index in range(SDK_BATCHES)]
    for batch_index, batch in enumerate(release_batches, start=1):
        name = f"121_sdk_releases_{batch_index:02d}.sql"
        lines = [
            f"-- {name} - developer catalog SDK language releases (batch {batch_index}/{SDK_BATCHES}).",
            "-- Generated by database/seeds/catalog/generate_catalog_seed.py; do not hand-edit.",
            "",
        ]
        releases = [language for sdk in batch for language in sdk["languages"]]
        if not releases:
            lines.append("SELECT 1;")
            files[name] = "\n".join(lines) + "\n"
            continue
        lines.extend(
            [
                "INSERT INTO documents_sdk_release",
                "  (id, tenant_id, sdk_family_id, language_code, package_name, sdk_version,",
                "   install_command, install_docs_url, download_url, archive_name, checksum, size_bytes,",
                "   generation_state, release_state, is_latest, download_count, released_at, changelog, metadata)",
                "VALUES",
            ]
        )
        release_rows = []
        for sdk in batch:
            for language in sdk["languages"]:
                release_rows.append(
                    "  ("
                    + ", ".join(
                        [
                            sql_uuid(language["id"]),
                            str(tenant),
                            sql_uuid(sdk["id"]),
                            sql_text(language["language_code"]),
                            sql_text(language["package_name"]),
                            sql_text(language["version"]),
                            sql_text(language["install_command"]),
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            "NULL",
                            sql_text(language["generation_state"]),
                            sql_text(language["release_state"]),
                            "TRUE" if language["is_latest"] else "FALSE",
                            "0",
                            "NULL",
                            "NULL",
                            sql_json(language["metadata"]),
                        ]
                    )
                    + ")"
                )
        lines.append(",\n".join(release_rows))
        lines.extend(
            [
                "ON CONFLICT (tenant_id, sdk_family_id, language_code, sdk_version) DO UPDATE SET",
                "  package_name = EXCLUDED.package_name, install_command = EXCLUDED.install_command,",
                "  generation_state = EXCLUDED.generation_state, release_state = EXCLUDED.release_state,",
                "  is_latest = EXCLUDED.is_latest, metadata = EXCLUDED.metadata, updated_at = NOW();",
                "",
            ]
        )
        category_rows = []
        for sdk in batch:
            for index, category_code in enumerate(sdk["category_codes"]):
                category_rows.append(
                    "  ("
                    + ", ".join(
                        [
                            str(tenant),
                            sql_uuid(sdk["id"]),
                            sql_text(category_code),
                            "TRUE" if index == 0 else "FALSE",
                            str(index * 10),
                        ]
                    )
                    + ")"
                )
        if category_rows:
            lines.extend(
                [
                    "INSERT INTO documents_sdk_category",
                    "  (tenant_id, sdk_family_id, category_code, is_primary, sort_order)",
                    "VALUES",
                    ",\n".join(category_rows),
                    "ON CONFLICT (tenant_id, sdk_family_id, category_code) DO UPDATE SET",
                    "  is_primary = EXCLUDED.is_primary, sort_order = EXCLUDED.sort_order;",
                    "",
                ]
            )
        files[name] = "\n".join(lines)

    return files


def build_summary(catalog: Catalog) -> dict[str, Any]:
    surface_counts: dict[str, int] = {}
    for surface in catalog.surfaces:
        surface_counts[surface["surface_code"]] = surface_counts.get(surface["surface_code"], 0) + 1
    sdk_counts: dict[str, int] = {}
    language_counts: dict[str, int] = {}
    for sdk in catalog.sdks:
        sdk_counts[sdk["sdk_type"]] = sdk_counts.get(sdk["sdk_type"], 0) + 1
        for language in sdk["languages"]:
            language_counts[language["language_code"]] = (
                language_counts.get(language["language_code"], 0) + 1
            )
    category_counts: dict[str, int] = {item["code"]: 0 for item in catalog.categories}
    for surface in catalog.surfaces:
        category_counts[surface["category_code"]] = (
            category_counts.get(surface["category_code"], 0) + 1
        )
    sdk_category_counts: dict[str, int] = {item["code"]: 0 for item in catalog.categories}
    for sdk in catalog.sdks:
        sdk_category_counts[sdk["category_code"]] = (
            sdk_category_counts.get(sdk["category_code"], 0) + 1
        )
    return {
        "schemaVersion": 1,
        "kind": "sdkwork.catalog.summary",
        "generatedBy": "database/seeds/catalog/generate_catalog_seed.py",
        "workspace": catalog.workspace.name,
        "counts": {
            "modules": len(catalog.modules),
            "apiSurfaces": len(catalog.surfaces),
            "apiOperations": sum(item["operation_count"] for item in catalog.surfaces),
            "sdkFamilies": len(catalog.sdks),
            "sdkReleases": sum(len(item["languages"]) for item in catalog.sdks),
        },
        "apiSurfacesByType": dict(sorted(surface_counts.items())),
        "sdkFamiliesByType": dict(sorted(sdk_counts.items())),
        "sdkReleasesByLanguage": dict(sorted(language_counts.items())),
        "apiSurfacesByCategory": dict(sorted(category_counts.items())),
        "sdkFamiliesByCategory": dict(sorted(sdk_category_counts.items())),
    }


def main() -> int:
    args = parse_args()
    workspace = Path(args.workspace_root).resolve()
    gate(workspace.exists(), f"workspace root not found: {workspace}")
    config = read_json(CONFIG_PATH)
    catalog = Catalog(config, workspace)
    catalog.discover()
    gate(catalog.modules, "no sdkwork modules discovered")
    files = render_sql(catalog)
    summary = build_summary(catalog)
    payload = json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True) + "\n"

    if args.check:
        stale: list[str] = []
        for name, content in files.items():
            path = SEEDS_ROOT / name
            if not path.exists() or path.read_text(encoding="utf-8") != content:
                stale.append(name)
        if not SUMMARY_PATH.exists() or SUMMARY_PATH.read_text(encoding="utf-8") != payload:
            stale.append(SUMMARY_PATH.name)
        if stale:
            raise SystemExit(
                "developer catalog seed is stale; run python database/seeds/catalog/"
                "generate_catalog_seed.py\n- " + "\n- ".join(stale)
            )
        print(f"developer catalog seed check passed ({len(files)} files)")
        return 0

    SEEDS_ROOT.mkdir(parents=True, exist_ok=True)
    for name, content in files.items():
        (SEEDS_ROOT / name).write_text(content, encoding="utf-8")
    SUMMARY_PATH.write_text(payload, encoding="utf-8")
    print(
        f"generated {len(files)} seed files and {SUMMARY_PATH.name}: "
        f"{summary['counts']['modules']} modules, "
        f"{summary['counts']['apiSurfaces']} API surfaces, "
        f"{summary['counts']['apiOperations']} operations, "
        f"{summary['counts']['sdkFamilies']} SDK families, "
        f"{summary['counts']['sdkReleases']} releases"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
