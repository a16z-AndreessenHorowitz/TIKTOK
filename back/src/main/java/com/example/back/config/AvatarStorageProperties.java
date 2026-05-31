package com.example.back.config;

import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class AvatarStorageProperties {

  private static final String BACK_MODULE_DIR = "back";

  private final Path storageRoot;

  public AvatarStorageProperties(@Value("${app.avatar.storage-dir}") String storageDir) {
    this.storageRoot = resolveStorageRoot(storageDir);
  }

  public Path storageRoot() {
    return storageRoot;
  }

  private static Path resolveStorageRoot(String storageDir) {
    if (!StringUtils.hasText(storageDir)) {
      throw new IllegalArgumentException("Thiếu app.avatar.storage-dir trong application.properties.");
    }

    Path configuredPath = Path.of(storageDir.trim());
    if (configuredPath.isAbsolute()) {
      return configuredPath.normalize();
    }

    return resolveBackModuleDir().resolve(configuredPath).toAbsolutePath().normalize();
  }

  private static Path resolveBackModuleDir() {
    Path workingDir = Path.of("").toAbsolutePath().normalize();
    if (isBackModuleDir(workingDir)) {
      return workingDir;
    }

    Path nestedBackDir = workingDir.resolve(BACK_MODULE_DIR);
    if (isBackModuleDir(nestedBackDir)) {
      return nestedBackDir;
    }

    return workingDir;
  }

  private static boolean isBackModuleDir(Path dir) {
    return dir != null
        && dir.getFileName() != null
        && BACK_MODULE_DIR.equals(dir.getFileName().toString())
        && Files.isRegularFile(dir.resolve("pom.xml"));
  }
}
