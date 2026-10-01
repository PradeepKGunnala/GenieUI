use reqwest::{cookie::CookieStore, Method, Url};
use serde::Serialize;
use serde_json::Value;
use std::sync::Arc;
use std::time::{SystemTime, UNIX_EPOCH};

struct Backend {
    client: reqwest::Client,
    cookies: Arc<reqwest::cookie::Jar>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ApiResponse {
    status: u16,
    body: String,
}

#[tauri::command]
async fn api_request(
    backend: tauri::State<'_, Backend>,
    path: String,
    method: String,
    body: Option<Value>,
) -> Result<ApiResponse, String> {
    if !path.starts_with("/api/v1/") || path.contains("\\") {
        return Err("Invalid API path".to_string());
    }
    let method = match method.as_str() {
        "GET" => Method::GET,
        "POST" => Method::POST,
        _ => return Err("Unsupported API method".to_string()),
    };
    let url = Url::parse(&format!("http://127.0.0.1:8080{path}"))
        .map_err(|_| "Invalid API path".to_string())?;
    if !url.path().starts_with("/api/v1/") || url.path().contains("//") {
        return Err("Invalid API path".to_string());
    }
    let mut request = backend.client.request(method.clone(), url.clone()).header(
        "X-Correlation-Id",
        format!(
            "desktop-{}",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map_err(|_| "Clock error".to_string())?
                .as_nanos()
        ),
    );
    if method != Method::GET {
        if let Some(cookies) = backend.cookies.cookies(&url) {
            if let Ok(cookies) = cookies.to_str() {
                if let Some(token) = cookies
                    .split("; ")
                    .find_map(|cookie| cookie.strip_prefix("XSRF-TOKEN="))
                {
                    request = request.header("X-XSRF-TOKEN", token);
                }
            }
        }
    }
    if let Some(body) = body {
        request = request.json(&body);
    }
    let response = request
        .send()
        .await
        .map_err(|_| "Cannot reach the Genie backend on 127.0.0.1:8080".to_string())?;
    let status = response.status().as_u16();
    let body = response
        .text()
        .await
        .map_err(|_| "Cannot read backend response".to_string())?;
    Ok(ApiResponse { status, body })
}

fn main() {
    let cookies = Arc::new(reqwest::cookie::Jar::default());
    let client = reqwest::Client::builder()
        .cookie_provider(cookies.clone())
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .expect("HTTP client");
    tauri::Builder::default()
        .manage(Backend { client, cookies })
        .invoke_handler(tauri::generate_handler![api_request])
        .run(tauri::generate_context!())
        .expect("Genie desktop application failed");
}
