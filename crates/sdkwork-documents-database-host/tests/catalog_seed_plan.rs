use std::path::PathBuf;

use sdkwork_database_spi::{DefaultDatabaseModule, LocaleTag, SeedProfile, SeedProvider};

/// The gateway applies the documents seed plan on startup. Guard the contract
/// that makes that useful: boot seeding is enabled and the standard profile
/// resolves every catalog seed file, not only the empty bootstrap.
#[tokio::test]
async fn documents_manifest_boot_seeds_the_developer_catalog() {
    let app_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
    let module =
        DefaultDatabaseModule::from_app_root(&app_root).expect("load documents database module");

    assert!(
        module.manifest().lifecycle.seed_on_boot,
        "documents must seed on boot so gateway startup initializes the catalog"
    );

    let plan = module
        .resolve_seed_plan(
            &LocaleTag("zh-CN".to_owned()),
            &SeedProfile("standard".to_owned()),
        )
        .await
        .expect("resolve documents standard seed plan");

    assert!(
        plan.common_scripts.len() >= 15,
        "expected bootstrap plus catalog seeds, found {}",
        plan.common_scripts.len()
    );
    let names: Vec<String> = plan
        .common_scripts
        .iter()
        .filter_map(|path| path.file_name().and_then(|name| name.to_str()))
        .map(str::to_owned)
        .collect();
    for expected in [
        "100_catalog_taxonomy.sql",
        "101_catalog_modules.sql",
        "110_api_surfaces_01.sql",
        "120_sdk_families_01.sql",
        "121_sdk_releases_01.sql",
    ] {
        assert!(
            names.iter().any(|name| name == expected),
            "missing catalog seed {expected} in {names:?}"
        );
    }
}
