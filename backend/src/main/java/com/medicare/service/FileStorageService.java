package com.medicare.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
    );

    public StoredFile storePatientFile(MultipartFile file, Long patientId, String folderName) {
        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
                throw new RuntimeException("Only PDF, JPG, JPEG, PNG, and WEBP files are allowed");
            }

            String originalFileName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
            String extension = getExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + extension;

            Path folderPath = Paths.get(uploadDir, "patients", String.valueOf(patientId), folderName)
                    .toAbsolutePath()
                    .normalize();
            Files.createDirectories(folderPath);

            Path target = folderPath.resolve(storedFileName).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/api/files/patients/" + patientId + "/" + folderName + "/" + storedFileName;
            return new StoredFile(originalFileName, storedFileName, contentType, fileUrl);
        } catch (IOException e) {
            throw new RuntimeException("Could not store file: " + e.getMessage());
        }
    }

    private String getExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        return index >= 0 ? fileName.substring(index) : "";
    }

    public record StoredFile(String originalFileName, String storedFileName, String contentType, String fileUrl) {}
}
