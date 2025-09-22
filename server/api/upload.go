package api

import (
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// UploadAvatarHandler handles multipart avatar upload, validation and user avatar update.
func UploadAvatarHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method allowed", http.StatusMethodNotAllowed)
        return
    }

    // Require auth
    currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    cfg := config.GetConfig()
    if cfg == nil || !cfg.EnableFileUpload {
        http.Error(w, "File upload is disabled", http.StatusForbidden)
        return
    }

    // Limit body size (allow a small headroom)
    maxBytes := int64(cfg.MaxFileSizeMB*1024*1024 + 1024)
    r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

    // Parse multipart
    if err := r.ParseMultipartForm(maxBytes); err != nil {
        http.Error(w, "Invalid multipart form", http.StatusBadRequest)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Missing file field", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // Read sniff bytes
    sniff := make([]byte, 512)
    n, _ := io.ReadFull(file, sniff)
    sniff = sniff[:n]
    mime := http.DetectContentType(sniff)

    ext, allowed := utils.ExtForAllowedImageMIME(mime)
    if !allowed {
        http.Error(w, "Unsupported file type", http.StatusBadRequest)
        return
    }

    // Prepare destination
    destDir := filepath.Join("uploads", "avatars")
    if err := utils.EnsureDir(destDir); err != nil {
        http.Error(w, "Server storage error", http.StatusInternalServerError)
        return
    }

    filename := utils.GenerateSafeImageFilename(ext)
    destPath := filepath.Join(destDir, filename)

    // Save file streaming (prepend sniffed bytes)
    if err := utils.SaveUploadedFile(destPath, sniff, file); err != nil {
        http.Error(w, "Failed to save file", http.StatusInternalServerError)
        return
    }

    // Public URL
    url := "/uploads/avatars/" + filename

    // Fetch current user to get previous avatar
    user, err := db.DBService.GetUserByID(int64(currentUserID))
    if err != nil {
        // Best-effort cleanup on failure
        _ = os.Remove(destPath)
        http.Error(w, "User not found", http.StatusNotFound)
        return
    }

    // Update user's avatar
    updateReq := models.UpdateUserProfileRequest{Avatar: &url}
    if err := db.DBService.UpdateUser(int64(currentUserID), updateReq); err != nil {
        _ = os.Remove(destPath)
        http.Error(w, "Failed to update user avatar", http.StatusInternalServerError)
        return
    }

    // Remove old avatar file if any
    oldURL := user.GetAvatar()
    if oldURL != "" && oldURL != url {
        // Only allow deletion within uploads/avatars
        if strings.HasPrefix(oldURL, "/uploads/avatars/") {
            // Convert URL path to filesystem path
            oldPath := filepath.Clean("." + oldURL)
            _ = os.Remove(oldPath)
        }
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    _ = json.NewEncoder(w).Encode(map[string]any{
        "url":       url,
        "mime":      mime,
        "sizeBytes": header.Size,
        "uploadedAt": time.Now().UTC().Format(time.RFC3339),
    })
}

// UploadPostImageHandler handles multipart post image upload and returns a public URL.
func UploadPostImageHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Only POST method allowed", http.StatusMethodNotAllowed)
        return
    }

    // Auth required (images are tied to a user action)
    if _, ok := r.Context().Value(middleware.UserIDKey).(int); !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    cfg := config.GetConfig()
    if cfg == nil || !cfg.EnableFileUpload {
        http.Error(w, "File upload is disabled", http.StatusForbidden)
        return
    }

    maxBytes := int64(cfg.MaxFileSizeMB*1024*1024 + 1024)
    r.Body = http.MaxBytesReader(w, r.Body, maxBytes)

    if err := r.ParseMultipartForm(maxBytes); err != nil {
        http.Error(w, "Invalid multipart form", http.StatusBadRequest)
        return
    }

    file, header, err := r.FormFile("file")
    if err != nil {
        http.Error(w, "Missing file field", http.StatusBadRequest)
        return
    }
    defer file.Close()

    sniff := make([]byte, 512)
    n, _ := io.ReadFull(file, sniff)
    sniff = sniff[:n]
    mime := http.DetectContentType(sniff)

    ext, allowed := utils.ExtForAllowedImageMIME(mime)
    if !allowed {
        http.Error(w, "Unsupported file type", http.StatusBadRequest)
        return
    }

    destDir := filepath.Join("uploads", "posts")
    if err := utils.EnsureDir(destDir); err != nil {
        http.Error(w, "Server storage error", http.StatusInternalServerError)
        return
    }

    filename := utils.GenerateSafeImageFilename(ext)
    destPath := filepath.Join(destDir, filename)

    if err := utils.SaveUploadedFile(destPath, sniff, file); err != nil {
        http.Error(w, "Failed to save file", http.StatusInternalServerError)
        return
    }

    url := "/uploads/posts/" + filename

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    _ = json.NewEncoder(w).Encode(map[string]any{
        "url":       url,
        "mime":      mime,
        "sizeBytes": header.Size,
        "uploadedAt": time.Now().UTC().Format(time.RFC3339),
    })
}



