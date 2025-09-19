package config

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"github.com/Golden76z/social-network/utils"
	"github.com/joho/godotenv"
	"os"
	"strconv"
	"strings"

	//"os"
	"sync"
	"time"
)

type Config struct {
	// Server
	Port        string
	Environment string

	// Database
	DBPath        string
	MigrationsDir string

	// JWT
	JWTKey        string
	JwtPrivateKey *ecdsa.PrivateKey
	JwtPublicKey  *ecdsa.PublicKey
	JwtExpiration time.Duration

	// Application Settings
	PostMaxLength          int
	PostTitleMaxLength     int
	PostContentMaxLength   int
	MaxImagesPerPost       int
	FeedPostLimit          int
	MaxFileSizeMB          int
	SessionCleanupInterval time.Duration

	// Security
	BcryptCost             int
	RateLimitRequests      int
	RateLimitWindowMinutes int

	// Features
	EnableRegistration bool
	EnableFileUpload   bool
	EnableChat         bool

	// CORS
	CORSAllowedOrigins []string
	CORSAllowedMethods []string
	CORSAllowedHeaders []string

	// Logging
	LogLevel string
	LogFile  string
}

var (
	configInstance *Config
	once           sync.Once
)

// Load initializes the global config once.
func Load() error {
	var err error

	once.Do(func() {
		// Load .env file
		if err = godotenv.Load(); err != nil {
			// .env file is required, stop without it
			fmt.Println("[WARNING] .env file not found")
			return
		}
		// Load or generate ECDSA key pair for JWT
		privateKey, keyErr := loadOrGenerateJWTKeys()
		if keyErr != nil {
			err = keyErr
			return
		}

		// Keep the old key generation for backward compatibility
		key, keyErr := utils.GenerateSecureKey()
		if keyErr != nil {
			err = keyErr
			return
		}

		// Parse JWT expiration
		jwtHours := getEnvAsInt("JWT_EXPIRATION_HOURS", 4)
		jwtExpiration := time.Duration(jwtHours) * time.Hour

		// Parse environment
		environment := getEnv("ENV", "development")

		// Override JWT expiration for production if not explicitly set
		if environment == "production" && !isEnvSet("JWT_EXPIRATION_HOURS") {
			jwtExpiration = 2 * time.Hour
		}

		// Update utils.Settings for backward compatibility
		utils.Settings = &utils.ServerSettings{
			JwtKey: key,
			Port:   getEnv("PORT", "8080"),
		}

		configInstance = &Config{
			// Server
			Port:        getEnv("PORT", "8080"),
			Environment: environment,

			// Database
			DBPath:        getEnv("DB_PATH", "social_network.db"),
			MigrationsDir: getEnv("MIGRATIONS_DIR", "db/migrations"),

			// JWT
			//JWTKey:        key,
			JwtPrivateKey: privateKey,
			JwtPublicKey:  &privateKey.PublicKey,
			JwtExpiration: jwtExpiration,

			// Application Settings
			PostMaxLength:          getEnvAsInt("POST_MAX_LENGTH", 280),
			PostTitleMaxLength:     getEnvAsInt("POST_TITLE_MAX_LENGTH", 125),
			PostContentMaxLength:   getEnvAsInt("POST_CONTENT_MAX_LENGTH", 2200),
			MaxImagesPerPost:       getEnvAsInt("MAX_IMAGES_PER_POST", 4),
			FeedPostLimit:          getEnvAsInt("FEED_POST_LIMIT", 20),
			MaxFileSizeMB:          getEnvAsInt("MAX_FILE_SIZE_MB", 10),
			SessionCleanupInterval: time.Duration(getEnvAsInt("SESSION_CLEANUP_INTERVAL_HOURS", 1)) * time.Hour,

			// Security
			BcryptCost:             getEnvAsInt("BCRYPT_COST", 12),
			RateLimitRequests:      getEnvAsInt("RATE_LIMIT_REQUESTS", 100),
			RateLimitWindowMinutes: getEnvAsInt("RATE_LIMIT_WINDOW_MINUTES", 15),

			// Features
			EnableRegistration: getEnvAsBool("ENABLE_REGISTRATION", true),
			EnableFileUpload:   getEnvAsBool("ENABLE_FILE_UPLOAD", true),
			EnableChat:         getEnvAsBool("ENABLE_CHAT", true),

			// CORS
			CORSAllowedOrigins: getEnvAsSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000"}),
			CORSAllowedMethods: getEnvAsSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
			CORSAllowedHeaders: getEnvAsSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Authorization", "X-CSRF-Token"}),

			// Logging
			LogLevel: getEnv("LOG_LEVEL", "info"),
			LogFile:  getEnv("LOG_FILE", "app.log"),
		}
	})

	return err

}

// Get returns the globally loaded config instance.
func GetConfig() *Config {
	return configInstance
}

// Helper functions for environment variable parsing
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}

func isEnvSet(key string) bool {
	_, exists := os.LookupEnv(key)
	return exists
}

// loadOrGenerateJWTKeys loads JWT keys from environment variables or generates new ones
func loadOrGenerateJWTKeys() (*ecdsa.PrivateKey, error) {
	// Try to load from environment variables first
	privateKeyPEM := os.Getenv("JWT_PRIVATE_KEY")
	publicKeyPEM := os.Getenv("JWT_PUBLIC_KEY")
	
	if privateKeyPEM != "" && publicKeyPEM != "" {
		// Load private key from PEM
		block, _ := pem.Decode([]byte(privateKeyPEM))
		if block == nil {
			return nil, fmt.Errorf("failed to decode private key PEM")
		}
		
		privateKey, err := x509.ParseECPrivateKey(block.Bytes)
		if err != nil {
			return nil, fmt.Errorf("failed to parse private key: %v", err)
		}
		
		fmt.Println("✅ Loaded JWT keys from environment variables")
		return privateKey, nil
	}
	
	// Generate new keys if not found in environment
	fmt.Println("🔑 Generating new JWT keys (add JWT_PRIVATE_KEY and JWT_PUBLIC_KEY to .env for persistence)")
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return nil, fmt.Errorf("failed to generate JWT keys: %v", err)
	}
	
	// Print the keys so they can be added to .env
	privateKeyBytes, _ := x509.MarshalECPrivateKey(privateKey)
	privateKeyPEM = string(pem.EncodeToMemory(&pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: privateKeyBytes,
	}))
	
	publicKeyBytes, _ := x509.MarshalPKIXPublicKey(&privateKey.PublicKey)
	publicKeyPEM = string(pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: publicKeyBytes,
	}))
	
	fmt.Printf("Add these to your .env file for persistent JWT keys:\n")
	fmt.Printf("JWT_PRIVATE_KEY=\"%s\"\n", privateKeyPEM)
	fmt.Printf("JWT_PUBLIC_KEY=\"%s\"\n", publicKeyPEM)
	
	return privateKey, nil
}
