use std::process::{Command, Stdio};
use walkdir::WalkDir;

const WEB_DIRECTORY: &str = "web";

fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    let ci = Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(["ci"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .output()?;

    if !ci.status.success() {
        return Err("could not get packages for website".into());
    }

    let build = Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(["run", "build"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .output()?;

    if !build.status.success() {
        return Err("could not build website".into());
    }

    for entry in WalkDir::new(WEB_DIRECTORY)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|x| {
            !x.path()
                .starts_with(format!("{}/{}", WEB_DIRECTORY, "node_modules"))
        })
        .filter(|x| {
            !x.path()
                .starts_with(format!("{}/{}", WEB_DIRECTORY, "build"))
        })
        .filter(|x| !x.file_name().to_string_lossy().starts_with('.'))
        .filter(|x| x.path().is_file())
    {
        println!("cargo:rerun-if-changed={}", entry.path().to_string_lossy());
    }

    Ok(())
}
