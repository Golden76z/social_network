package utils

var Settings *ServerSettings

type ServerSettings struct {
	JwtKey string
	Port   string
}
