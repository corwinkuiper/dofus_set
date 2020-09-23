use std::process::Command;
use walkdir::WalkDir;

const WEB_DIRECTORY: &str = "web";

fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(&["ci"])
        .output()?;
    Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(&["run", "build"])
        .output()?;

    for entry in WalkDir::new(WEB_DIRECTORY)
        .into_iter()
        .filter_map(Result::ok)
    {
        println!("cargo:rerun-if-changed={}", entry.path().to_string_lossy());
    }

    Ok(())
}
