//! Drive-backed content storage for SDKWork Documents.
//!
//! Documents owns document metadata and delivery, but rich-text bodies live in
//! Drive. This crate links the Drive Rust crates in-process (per
//! `DRIVE_SPEC.md` §9.2) instead of calling the Drive HTTP APIs. It owns a
//! dedicated Drive pool on the documents database so the Drive schema, spaces,
//! nodes, and object storage stay authoritative in Drive.

mod bootstrap;
mod content;

pub use bootstrap::{
    connect_documents_drive_pool, connect_documents_drive_pool_from_env,
    documents_drive_health_check,
};
pub use content::{
    DocumentsDriveContent, DocumentsDriveContentAdapter, DocumentsDriveError, DocumentsDriveRef,
};

/// Stable Drive space name used by the document center.
pub const DOCUMENTS_DRIVE_SPACE_DISPLAY_NAME: &str = "Documents";
