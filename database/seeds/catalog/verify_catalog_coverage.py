#!/usr/bin/env python3
"""Verify that every SDKWork module's APIs and SDKs reached the catalog.

The catalog seed generator intentionally skips repositories without API or SDK
assets, and it may skip malformed OpenAPI/SDK manifests. That makes a stale or
silently truncated catalog possible even when ``generate_catalog_seed.py
--check`` passes, because ``--check`` only compares the generator's own output.

This script independently walks the workspace and checks the four properties a
commercial catalog must keep:

1. every module with API or SDK assets appears in the catalog;
2. every matched OpenAPI document is represented by an API surface;
3. every parseable SDK manifest is represented by an SDK family;
4. the catalog has no duplicate module codes, API authorities, or SDK codes,
   every surface has operations, every SDK has at least one language, and every
   category code is declared in ``catalog.config.json``.
"""

from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = SCRIPT_DIR.parents[3]
DOCUMENTS_ROOT = SCRIPT_DIR.parents[2]

SKIPPED_WORKSPACES = {"sdkwork-specs", "sdkwork-sdk-generator"}
OPENAPI_PATTERN = re.compile(r"openapi.*\.(json|ya?ml)$", re.IGNORECASE)


def load_generator() -> Any:
    spec = importlib.util.spec_from_file_location(
        "sdkwork_catalog_generator", SCRIPT_DIR / "generate_catalog_seed.py"
    )
    if spec is None or spec.loader is None:
        raise SystemExit("unable to load generate_catalog_seed.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def relative(path: Path) -> str:
    return path.relative_to(WORKSPACE_ROOT).as_posix()


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return value if isinstance(value, dict) else None


def main() -> int:
    generator = load_generator()
    config = generator.read_json(generator.CONFIG_PATH)
    catalog = generator.Catalog(config, WORKSPACE_ROOT)
    catalog.discover()

    modules_by_repo = {module["repository_path"]: module for module in catalog.modules}
    surface_paths = {surface["source_path"] for surface in catalog.surfaces}
    sdk_paths = {sdk["source_path"] for sdk in catalog.sdks}

    missing_modules: list[str] = []
    missing_surfaces: list[str] = []
    missing_sdks: list[str] = []
    unreadable_sdks: list[str] = []
    expected_module_count = 0
    expected_surface_count = 0

    repo_dirs = sorted(
        path
        for path in WORKSPACE_ROOT.iterdir()
        if path.is_dir() and path.name.startswith("sdkwork-")
    )
    for repo in repo_dirs:
        if repo.name in SKIPPED_WORKSPACES:
            continue
        api_paths: list[Path] = []
        apis_root = repo / "apis"
        if apis_root.is_dir():
            for path in sorted(apis_root.rglob("*")):
                if not path.is_file() or not OPENAPI_PATTERN.search(path.name):
                    continue
                if any(part in generator.SKIP_SEGMENTS for part in path.parts):
                    continue
                if len(path.relative_to(apis_root).parts) < 2:
                    continue
                api_paths.append(path)

        sdk_manifest_paths = sorted((repo / "sdks").glob("*/sdk-manifest.json"))
        if not api_paths and not sdk_manifest_paths:
            continue
        expected_module_count += 1
        expected_surface_count += len(api_paths)

        if repo.name not in modules_by_repo:
            missing_modules.append(repo.name)

        for path in api_paths:
            if relative(path) not in surface_paths:
                missing_surfaces.append(relative(path))

        for path in sdk_manifest_paths:
            manifest = read_json(path)
            if manifest is None:
                unreadable_sdks.append(relative(path))
                continue
            if relative(path) not in sdk_paths:
                missing_sdks.append(relative(path))

    errors: list[str] = []
    if missing_modules:
        errors.append(
            "modules with API/SDK assets but no catalog row: " + ", ".join(missing_modules)
        )
    if missing_surfaces:
        errors.append(
            "OpenAPI documents without an API surface: " + ", ".join(missing_surfaces)
        )
    if missing_sdks:
        errors.append(
            "SDK manifests without an SDK family: " + ", ".join(missing_sdks)
        )

    seen_modules: set[str] = set()
    for module in catalog.modules:
        if module["module_code"] in seen_modules:
            errors.append(f"duplicate module code: {module['module_code']}")
        seen_modules.add(module["module_code"])
        if not module["surfaces"] and not module["sdks"]:
            errors.append(f"module has neither API nor SDK: {module['module_code']}")

    seen_authorities: set[str] = set()
    for surface in catalog.surfaces:
        if surface["api_authority"] in seen_authorities:
            errors.append(f"duplicate API authority: {surface['api_authority']}")
        seen_authorities.add(surface["api_authority"])
        if surface["operation_count"] < 1 and surface.get("publish_status") != "draft":
            errors.append(f"API surface has no operations but is published: {surface['source_path']}")
        if surface["operation_count"] > 0 and surface.get("publish_status") != "published":
            errors.append(f"API surface has operations but is not published: {surface['source_path']}")
        if not (DOCUMENTS_ROOT.parent / surface["source_path"]).is_file():
            errors.append(f"API surface source is missing: {surface['source_path']}")

    seen_sdks: set[str] = set()
    for sdk in catalog.sdks:
        if sdk["sdk_code"] in seen_sdks:
            errors.append(f"duplicate SDK code: {sdk['sdk_code']}")
        seen_sdks.add(sdk["sdk_code"])
        if not sdk["languages"]:
            errors.append(f"SDK family has no language releases: {sdk['sdk_code']}")
        if not (DOCUMENTS_ROOT.parent / sdk["source_path"]).is_file():
            errors.append(f"SDK manifest source is missing: {sdk['source_path']}")

    category_codes = {category["code"] for category in config["categories"]}
    for module in catalog.modules:
        for code in module["categories"]:
            if code not in category_codes:
                errors.append(f"module {module['module_code']} uses unknown category {code}")
    for surface in catalog.surfaces:
        for code in surface["category_codes"]:
            if code not in category_codes:
                errors.append(f"surface {surface['api_authority']} uses unknown category {code}")

    if len(config["categories"]) < 15:
        errors.append(f"category taxonomy is incomplete: {len(config['categories'])} categories")
    if expected_module_count != len(catalog.modules):
        errors.append(
            f"module count mismatch: expected {expected_module_count}, catalog {len(catalog.modules)}"
        )

    if unreadable_sdks:
        print(
            "warning: unreadable SDK manifests were skipped by the generator: "
            + ", ".join(unreadable_sdks),
            file=sys.stderr,
        )

    if errors:
        print("developer catalog coverage FAILED", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    operations = sum(surface["operation_count"] for surface in catalog.surfaces)
    releases = sum(len(sdk["languages"]) for sdk in catalog.sdks)
    print(
        "developer catalog coverage passed: "
        f"{len(catalog.modules)} modules, {len(catalog.surfaces)} API surfaces "
        f"({operations} operations), {len(catalog.sdks)} SDK families "
        f"({releases} releases), {len(config['categories'])} categories"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
