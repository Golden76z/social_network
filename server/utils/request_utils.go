package utils

import (
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

// Context key for path parameters
type contextKey string

const pathParamsKey contextKey = "pathParams"

func SetPathParam(ctx context.Context, key, value string) context.Context {
	params, _ := ctx.Value(pathParamsKey).(map[string]string)
	if params == nil {
		params = make(map[string]string)
	}
	params[key] = value
	return context.WithValue(ctx, pathParamsKey, params)
}

// GetPathParam retrieves a path parameter from the request context
func GetPathParam(req *http.Request, key string) string {
	if params, ok := req.Context().Value(pathParamsKey).(map[string]string); ok {
		return params[key]
	}
	return ""
}

// EnsureDir creates the directory if it does not exist.
func EnsureDir(dir string) error {
    if _, err := os.Stat(dir); os.IsNotExist(err) {
        return os.MkdirAll(dir, 0o755)
    }
    return nil
}

// ExtForAllowedImageMIME maps detected MIME to an allowed extension.
// Returns (ext, true) if allowed; otherwise ("", false).
func ExtForAllowedImageMIME(mime string) (string, bool) {
    switch strings.ToLower(mime) {
    case "image/jpeg", "image/jpg":
        return ".jpg", true
    case "image/png":
        return ".png", true
    case "image/gif":
        return ".gif", true
    default:
        return "", false
    }
}

// GenerateSafeImageFilename returns a unique filename using uuid + timestamp + extension.
func GenerateSafeImageFilename(ext string) string {
    id := uuid.New().String()
    ts := time.Now().UTC().Format("20060102T150405Z")
    // ensure ext begins with dot
    if ext != "" && !strings.HasPrefix(ext, ".") {
        ext = "." + ext
    }
    return ts + "_" + id + ext
}

// SaveUploadedFile writes an uploaded file to destPath. It writes sniff bytes first then streams the rest.
func SaveUploadedFile(destPath string, sniff []byte, src io.Reader) error {
    // Ensure parent dir exists
    if err := EnsureDir(filepath.Dir(destPath)); err != nil {
        return err
    }
    f, err := os.Create(destPath)
    if err != nil {
        return err
    }
    defer f.Close()

    if len(sniff) > 0 {
        if _, err := f.Write(sniff); err != nil {
            return err
        }
    }
    if _, err := io.Copy(f, src); err != nil {
        return err
    }
    return nil
}
