#!/usr/bin/env python3
"""Statically validate the generated developer-catalog seed SQL.

The seeds are applied by the gateway at startup, but the workspace normally has
no PostgreSQL server during development. This script uses ``pglast`` (the real
PostgreSQL parser) when available to check syntax, column/value arity, JSONB
payloads, foreign keys, uniqueness, and the operation counts stored on each
surface. When ``pglast`` is not installed it prints a skip notice and exits 0,
so CI without the optional parser still passes.
"""

from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
DOCUMENTS_ROOT = SCRIPT_DIR.parents[2]
SEEDS_DIR = DOCUMENTS_ROOT / "database" / "seeds" / "common"

try:
    from pglast import parse_sql
    from pglast.ast import A_Const, Boolean, Float, FuncCall, Integer, String, TypeCast
except ImportError:  # pragma: no cover - optional developer dependency
    print("pglast is not installed; skipping developer catalog SQL AST validation")
    raise SystemExit(0)


def scalar(node: Any) -> Any:
    if isinstance(node, A_Const):
        if node.isnull:
            return None
        value = node.val
        if isinstance(value, String):
            return value.sval
        if isinstance(value, Integer):
            return value.ival
        if isinstance(value, Float):
            return float(value.fval)
        if isinstance(value, Boolean):
            return bool(value.boolval)
        return str(value)
    if isinstance(node, TypeCast):
        inner = scalar(node.arg)
        type_name = str(node.typeName.names[-1].sval) if node.typeName.names else ""
        if type_name == "jsonb":
            if not isinstance(inner, str):
                raise ValueError(f"jsonb cast without string literal: {inner!r}")
            return json.loads(inner)
        return inner
    if isinstance(node, FuncCall):
        name = str(node.funcname[-1].sval).lower() if node.funcname else ""
        if name in {"now", "current_timestamp"}:
            return "now()"
        return f"{name}()"
    raise ValueError(f"unsupported seed value node: {node!r}")


def load_rows() -> dict[str, list[dict[str, Any]]]:
    tables: dict[str, list[dict[str, Any]]] = defaultdict(list)
    sql_files = sorted(SEEDS_DIR.glob("*.sql"))
    if len(sql_files) < 15:
        raise SystemExit(f"expected at least 15 seed files, found {len(sql_files)}")

    for path in sql_files:
        sql = path.read_text(encoding="utf-8")
        try:
            statements = parse_sql(sql)
        except Exception as error:  # pglast raises its own parse error type
            raise SystemExit(f"{path.name}: PostgreSQL parse error: {error}") from error
        for raw in statements:
            statement = raw.stmt
            if type(statement).__name__ != "InsertStmt":
                continue
            table = str(statement.relation.relname)
            if not table.startswith("documents_"):
                continue
            columns = [str(column.name) for column in statement.cols]
            if len(columns) != len(set(columns)):
                raise SystemExit(f"{path.name}: duplicate column in {table}: {columns}")
            values_lists = statement.selectStmt.valuesLists or []
            for values in values_lists:
                if len(values) != len(columns):
                    raise SystemExit(
                        f"{path.name}: {table} has {len(columns)} columns but "
                        f"{len(values)} values: {values}"
                    )
                row = {name: scalar(value) for name, value in zip(columns, values)}
                tables[table].append(row)
    return tables


def require_unique(rows: list[dict[str, Any]], key: str, label: str, errors: list[str]) -> None:
    seen: set[Any] = set()
    for row in rows:
        value = row.get(key)
        if value in seen:
            errors.append(f"{label}: duplicate {key}={value}")
        seen.add(value)


def main() -> int:
    tables = load_rows()
    errors: list[str] = []

    modules = tables["documents_catalog_module"]
    surfaces = tables["documents_api_surface"]
    schemas = tables["documents_api_schema"]
    operations = tables["documents_api_operation"]
    surface_categories = tables["documents_api_surface_category"]
    families = tables["documents_sdk_family"]
    releases = tables["documents_sdk_release"]
    sdk_categories = tables["documents_sdk_category"]
    categories = tables["documents_catalog_category"]
    languages = tables["documents_sdk_language"]
    sync = tables["documents_catalog_sync"]

    summary = json.loads((SCRIPT_DIR / "catalog.summary.json").read_text(encoding="utf-8"))
    expected = summary["counts"]
    actual_counts = {
        "modules": len(modules),
        "apiSurfaces": len(surfaces),
        "apiOperations": len(operations),
        "sdkFamilies": len(families),
        "sdkReleases": len(releases),
    }
    for key, expected_value in expected.items():
        if actual_counts[key] != expected_value:
            errors.append(f"count mismatch for {key}: seed={actual_counts[key]} summary={expected_value}")

    for table_name in (
        "documents_catalog_module",
        "documents_api_surface",
        "documents_api_schema",
        "documents_api_operation",
        "documents_catalog_category",
        "documents_sdk_family",
        "documents_sdk_release",
    ):
        require_unique(tables[table_name], "id", table_name, errors)

    require_unique(categories, "category_code", "categories", errors)
    require_unique(surfaces, "api_authority", "surfaces", errors)
    require_unique(families, "sdk_code", "sdk families", errors)
    require_unique(languages, "language_code", "languages", errors)

    module_ids = {row["id"] for row in modules}
    surface_ids = {row["id"] for row in surfaces}
    family_ids = {row["id"] for row in families}
    category_codes = {row["category_code"] for row in categories}
    language_codes = {row["language_code"] for row in languages}

    for surface in surfaces:
        if surface["module_id"] not in module_ids:
            errors.append(f"surface {surface['api_authority']} references missing module")
        if surface["category_code"] not in category_codes:
            errors.append(f"surface {surface['api_authority']} uses missing category")
    for family in families:
        if family["module_id"] not in module_ids:
            errors.append(f"sdk {family['sdk_code']} references missing module")
        if family["category_code"] not in category_codes:
            errors.append(f"sdk {family['sdk_code']} uses missing category")

    schema_counts = Counter(row["surface_id"] for row in schemas)
    for surface in surfaces:
        if schema_counts[surface["id"]] != 1:
            errors.append(
                f"surface {surface['api_authority']} has {schema_counts[surface['id']]} schema rows"
            )

    operation_counts = Counter(row["surface_id"] for row in operations)
    seen_operation_keys: set[tuple[str, str]] = set()
    for surface in surfaces:
        actual = operation_counts[surface["id"]]
        declared = surface["operation_count"]
        if actual != declared:
            errors.append(
                f"surface {surface['api_authority']} declares {declared} operations but seeds {actual}"
            )
        if declared == 0 and surface["publish_status"] != "draft":
            errors.append(f"zero-operation surface {surface['api_authority']} must be draft")
        if declared > 0 and surface["publish_status"] != "published":
            errors.append(f"non-empty surface {surface['api_authority']} must be published")
    for operation in operations:
        if operation["surface_id"] not in surface_ids:
            errors.append(f"operation {operation['operation_key']} references missing surface")
        key = (operation["surface_id"], operation["operation_key"])
        if key in seen_operation_keys:
            errors.append(f"duplicate operation key {operation['operation_key']}")
        seen_operation_keys.add(key)

    for link in surface_categories:
        if link["surface_id"] not in surface_ids:
            errors.append("surface category references missing surface")
        if link["category_code"] not in category_codes:
            errors.append("surface category references missing category")
    for link in sdk_categories:
        if link["sdk_family_id"] not in family_ids:
            errors.append("SDK category references missing family")
        if link["category_code"] not in category_codes:
            errors.append("SDK category references missing category")

    surface_category_keys = [
        (link["surface_id"], link["category_code"]) for link in surface_categories
    ]
    if len(surface_category_keys) != len(set(surface_category_keys)):
        errors.append("duplicate surface category link")
    sdk_category_keys = [
        (link["sdk_family_id"], link["category_code"]) for link in sdk_categories
    ]
    if len(sdk_category_keys) != len(set(sdk_category_keys)):
        errors.append("duplicate SDK category link")
    primary_counts = Counter(
        link["surface_id"] for link in surface_categories if link.get("is_primary")
    )
    for surface in surfaces:
        if primary_counts[surface["id"]] != 1:
            errors.append(
                f"surface {surface['api_authority']} has {primary_counts[surface['id']]} primary categories"
            )

    release_counts = Counter(row["sdk_family_id"] for row in releases)
    seen_release_keys: set[tuple[str, str, str]] = set()
    for release in releases:
        if release["sdk_family_id"] not in family_ids:
            errors.append(f"release {release['package_name']} references missing family")
        if release["language_code"] not in language_codes:
            errors.append(f"release {release['package_name']} uses missing language")
        key = (release["sdk_family_id"], release["language_code"], release["sdk_version"])
        if key in seen_release_keys:
            errors.append(f"duplicate release {key}")
        seen_release_keys.add(key)
    for family in families:
        if release_counts[family["id"]] < 1:
            errors.append(f"SDK family {family['sdk_code']} has no releases")

    for module in modules:
        has_surface = any(surface["module_id"] == module["id"] for surface in surfaces)
        has_family = any(family["module_id"] == module["id"] for family in families)
        if not has_surface and not has_family:
            errors.append(f"module {module['module_code']} has neither API nor SDK")

    if len(sync) != 1:
        errors.append(f"expected one catalog sync row, found {len(sync)}")
    elif sync[0]["module_count"] != len(modules):
        errors.append(
            f"catalog sync module_count={sync[0]['module_count']} but modules={len(modules)}"
        )

    if errors:
        print("developer catalog seed SQL validation FAILED", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        return 1

    print(
        "developer catalog seed SQL validation passed: "
        f"{len(modules)} modules, {len(surfaces)} surfaces ({len(operations)} operations), "
        f"{len(families)} SDK families, {len(releases)} releases, "
        f"{len(categories)} categories, {len(languages)} languages"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
