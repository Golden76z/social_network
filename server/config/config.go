package config

import (
	"os"
	"sync"

	"github.com/Golden76z/social-network/utils"
)

type Config struct {
	Port          string
	DBPath        string
	MigrationsDir string
	Environment   string
	JWTKey        string
}

var (
	configInstance *Config
	once           sync.Once
)

// Load initializes the global config once.
func Load() error {
	var err error

	once.Do(func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}

		key, keyErr := utils.GenerateSecureKey()
		if keyErr != nil {
			err = keyErr
			return
		}

		utils.Settings = &utils.ServerSettings{
			JwtKey: key,
			Port:   port,
		}

		configInstance = &Config{
			Port:          port,
			DBPath:        "social_network.db",
			MigrationsDir: "db/migrations",
			Environment:   os.Getenv("ENV"),
			JWTKey:        key,
		}
	})

	return err
}

// Get returns the globally loaded config instance.
func GetConfig() *Config {
	return configInstance
}
