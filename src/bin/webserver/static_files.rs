use include_dir::{include_dir, Dir};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::path::Path;

use rouille::{Request, Response};

static WEB_SOURCES: Dir = include_dir!("web/build");

pub fn static_file(request: &Request) -> Response {
    let request_url = request.url();
    let filename = get_filename_from_url(&request_url);
    let file = match WEB_SOURCES.get_file(filename) {
        Some(f) => f,
        None => return Response::empty_404(),
    };

    let filepath = Path::new(filename);
    let content_type = filepath
        .extension()
        .map(|extension| content_type_for_extension(&extension.to_string_lossy()))
        .unwrap_or("application/octet-stream");

    let etag = calculate_hash(&file.contents()).to_string();

    Response::from_data(content_type, file.contents()).with_etag(request, etag)
}

fn get_filename_from_url(url: &str) -> &str {
    if url == "/" {
        "index.html"
    } else {
        &url[1..]
    }
}

fn content_type_for_extension(extension: &str) -> &'static str {
    match extension {
        "css" => "text/css; charset=utf8",
        "html" => "text/html; charset=utf8",
        "ico" => "image/x-icon",
        "js" => "application/javascript; charset=utf8",
        "json" => "application/json; charset=utf8",
        "map" => "text/plain; charset=utf8",
        "png" => "image/png",
        "svg" => "image/svg+xml",
        "txt" => "text/plain; charset=utf8",
        _ => "application/octet-stream",
    }
}

fn calculate_hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}
