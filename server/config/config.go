package config

import (
	"os"

	"github.com/Golden76z/social-network/utils"
)

type Config struct {
	Port          string
	DBPath        string
	MigrationsDir string
	Environment   string
	JWTKey        string
}

func Load() (*Config, error) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	key, err := utils.GenerateSecureKey()
	if err != nil {
		return nil, err
	}

	utils.Settings = &utils.ServerSettings{
		JwtKey: key,
		Port:   port,
	}

	return &Config{
		Port:          port,
		DBPath:        "social_network.db",
		MigrationsDir: "db/migrations",
		Environment:   os.Getenv("ENV"),
		JWTKey:        key,
	}, nil
}
