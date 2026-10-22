use std::path::PathBuf;

use sdkwork_database_lifecycle::validate_seed_content;

/// Gateway startup seeds the documents module from `database/seeds/common`.
/// The lifecycle applies a security validator before executing each file, so a
/// seed that contains a forbidden pattern would fail the whole gateway start.
#[test]
fn common_seed_files_pass_gateway_security_validation() {
    let seeds_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../database/seeds/common");
    let seeds_dir = std::fs::canonicalize(seeds_dir).expect("resolve documents seeds directory");

    let mut checked = 0usize;
    for entry in std::fs::read_dir(&seeds_dir).expect("read documents seeds directory") {
        let path = entry.expect("read seed entry").path();
        if path.extension().and_then(|value| value.to_str()) != Some("sql") {
            continue;
        }
        let content = std::fs::read_to_string(&path).expect("read seed file");
        let report = validate_seed_content(&content, &path).expect("validate seed file");
        let errors: Vec<String> = report
            .errors
            .iter()
            .map(|error| format!("line {}: {}", error.line, error.message))
            .collect();
        assert!(
            report.is_safe,
            "seed {} is rejected by the gateway lifecycle validator: {}",
            path.display(),
            errors.join("; ")
        );
        checked += 1;
    }

    assert!(
        checked >= 15,
        "expected the bootstrap plus catalog seeds, checked {checked}"
    );
}
