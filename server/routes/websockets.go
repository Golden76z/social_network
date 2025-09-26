package routes

import (
	"github.com/Golden76z/social-network/config"
	"github.com/Golden76z/social-network/websockets"
)

func setupWebSocketRoutes(r *Router, wsHub *websockets.Hub, cfg *config.Config) {
	r.GET("/ws", websockets.WebSocketHandler(wsHub, cfg))
}
