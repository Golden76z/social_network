package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Golden76z/social-network/db"
)

var serverStartTime = time.Now()

// SetStartTime allows the main package to set the accurate server start time
func SetStartTime(t time.Time) { serverStartTime = t }

type healthResponse struct {
	Status    string                 `json:"status"`
	Timestamp time.Time              `json:"timestamp"`
	Uptime    string                 `json:"uptime"`
	Checks    map[string]interface{} `json:"checks"`
}

// HealthHandler returns a simple health status for the API
// GET /health
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	checks := make(map[string]interface{})

	// Database check
	dbStatus := "unknown"
	if db.DBService != nil && db.DBService.DB != nil {
		if err := db.DBService.DB.Ping(); err != nil {
			dbStatus = "down"
			checks["db_error"] = err.Error()
		} else {
			dbStatus = "up"
		}
	} else {
		dbStatus = "not_initialized"
	}
	checks["database"] = dbStatus

	resp := healthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Uptime:    time.Since(serverStartTime).String(),
		Checks:    checks,
	}

	// Consider overall status degraded if DB is not up
	if dbStatus != "up" {
		resp.Status = "degraded"
	}

	_ = json.NewEncoder(w).Encode(resp)
}
