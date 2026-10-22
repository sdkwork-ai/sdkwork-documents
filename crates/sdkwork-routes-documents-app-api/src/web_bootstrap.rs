use std::sync::Arc;

use axum::Router;
use sdkwork_iam_web_adapter::IamWebRequestContextResolver;
use sdkwork_web_axum::{with_web_request_context, WebFrameworkLayer};
use sdkwork_web_core::{DomainContextInjector, WebRequestContext, WebRequestContextProfile};

use crate::http_route_manifest::app_route_manifest;
use crate::paths;
use sdkwork_documents_contract::DocumentsAppRequestContext;

pub fn documents_app_api_public_path_prefixes() -> Vec<String> {
    vec![paths::HEALTHZ.to_owned()]
}

pub fn documents_app_api_prefixes() -> Vec<String> {
    vec![paths::PREFIX.to_owned()]
}

#[derive(Clone, Default)]
struct DocumentsAppApiContextInjector;

pub fn documents_app_context_injector() -> Arc<dyn DomainContextInjector> {
    Arc::new(DocumentsAppApiContextInjector)
}

impl DomainContextInjector for DocumentsAppApiContextInjector {
    fn inject(&self, request: &mut axum::extract::Request, context: &WebRequestContext) {
        if let Some(mut app_context) = app_api_context_from_web_request(context) {
            app_context.locale = request_locale(request.headers());
            request.extensions_mut().insert(app_context);
        }
    }
}

/// Resolve the catalog locale from the standard request header.
///
/// The gateway forwards the original `Accept-Language` header to embedded
/// assemblies, while the IAM resolver does not project it into
/// `WebRequestContext.locale` on this path. Take the highest-priority
/// compatible tag and fall back to the canonical English catalog labels.
fn request_locale(headers: &axum::http::HeaderMap) -> String {
    let raw = headers
        .get(axum::http::header::ACCEPT_LANGUAGE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    let candidate = raw
        .split(',')
        .find_map(|entry| {
            let tag = entry.split(';').next()?.trim();
            if tag.is_empty() || tag == "*" {
                return None;
            }
            Some(tag.replace('_', "-"))
        })
        .unwrap_or_else(|| "en-US".to_owned());
    let lower = candidate.to_ascii_lowercase();
    match lower.as_str() {
        "zh" | "zh-cn" | "zh-hans" | "zh-hans-cn" => "zh-CN".to_owned(),
        "en" | "en-us" | "en-gb" => "en-US".to_owned(),
        _ => candidate,
    }
}

fn app_api_context_from_web_request(
    context: &WebRequestContext,
) -> Option<DocumentsAppRequestContext> {
    let principal = context.principal.as_ref()?;
    let tenant_id = principal.tenant_id().parse().ok()?;
    let user_id = principal.user_id().parse().ok()?;
    let locale = context
        .locale
        .clone()
        .unwrap_or_else(|| "en-US".to_owned());
    Some(DocumentsAppRequestContext {
        tenant_id,
        user_id,
        locale,
    })
}

pub fn wrap_router_with_web_framework(
    resolver: IamWebRequestContextResolver,
    router: Router,
) -> Router {
    let route_manifest = app_route_manifest();
    route_manifest
        .validate_public_path_prefixes(&documents_app_api_public_path_prefixes())
        .expect("documents app-api public prefixes must not cover protected manifest routes");

    let layer = WebFrameworkLayer::new(resolver)
        .with_profile(WebRequestContextProfile {
            public_path_prefixes: documents_app_api_public_path_prefixes(),
            ..WebRequestContextProfile::default()
        })
        .with_route_manifest(route_manifest)
        .with_domain_injector(documents_app_context_injector());
    with_web_request_context(router, layer)
}

pub async fn wrap_router_with_web_framework_from_env(router: Router) -> Router {
    let resolver = sdkwork_iam_web_adapter::iam_web_request_context_resolver_from_env().await;
    wrap_router_with_web_framework(resolver, router)
}

#[cfg(test)]
mod tests {
    use axum::http::{HeaderMap, HeaderValue};

    use super::request_locale;

    #[test]
    fn resolves_supported_accept_language_tags() {
        let mut headers = HeaderMap::new();
        headers.insert(
            axum::http::header::ACCEPT_LANGUAGE,
            HeaderValue::from_static("zh-CN,zh;q=0.9,en;q=0.8"),
        );
        assert_eq!(request_locale(&headers), "zh-CN");

        headers.insert(
            axum::http::header::ACCEPT_LANGUAGE,
            HeaderValue::from_static("en-US,en;q=0.9"),
        );
        assert_eq!(request_locale(&headers), "en-US");
    }

    #[test]
    fn falls_back_to_english_without_a_usable_header() {
        assert_eq!(request_locale(&HeaderMap::new()), "en-US");

        let mut headers = HeaderMap::new();
        headers.insert(
            axum::http::header::ACCEPT_LANGUAGE,
            HeaderValue::from_static("*"),
        );
        assert_eq!(request_locale(&headers), "en-US");
    }
}
