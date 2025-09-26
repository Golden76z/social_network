package utils

import (
	"crypto/ecdsa"
	"time"
)

// ConfigAdapter implements configInterface to avoid circular imports
type ConfigAdapter struct {
	JwtExpiration time.Duration
	JwtPrivateKey *ecdsa.PrivateKey
	JwtPublicKey  *ecdsa.PublicKey
	Environment   string
	PostMaxLength int
	MaxFileSizeMB int
}

func (c *ConfigAdapter) GetJwtExpiration() time.Duration {
	return c.JwtExpiration
}

func (c *ConfigAdapter) GetJwtPrivateKey() interface{} {
	return c.JwtPrivateKey
}

func (c *ConfigAdapter) GetJwtPublicKey() interface{} {
	return c.JwtPublicKey
}

func (c *ConfigAdapter) GetEnvironment() string {
	return c.Environment
}

func (c *ConfigAdapter) GetPostMaxLength() int {
	return c.PostMaxLength
}

func (c *ConfigAdapter) GetMaxFileSizeMB() int {
	return c.MaxFileSizeMB
}

// SetConfig sets the global config for utils package
func SetConfig(jwtExpiration time.Duration, privateKey *ecdsa.PrivateKey, publicKey *ecdsa.PublicKey, environment string, postMaxLength int, maxFileSizeMB int) {
	globalConfig = &ConfigAdapter{
		JwtExpiration: jwtExpiration,
		JwtPrivateKey: privateKey,
		JwtPublicKey:  publicKey,
		Environment:   environment,
		PostMaxLength: postMaxLength,
		MaxFileSizeMB: maxFileSizeMB,
	}
}
