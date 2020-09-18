use std::process::Command;
use walkdir::WalkDir;

const WEB_DIRECTORY: &str = "web";

fn main() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    for entry in WalkDir::new(WEB_DIRECTORY)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| !e.file_type().is_dir())
    {
        println!(
            "cargo:rerun-if-changed={}",
            entry.file_name().to_string_lossy()
        );
    }

    Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(&["install"])
        .output()?;
    Command::new("npm")
        .current_dir(WEB_DIRECTORY)
        .args(&["run", "build"])
        .output()?;

    Ok(())
}
