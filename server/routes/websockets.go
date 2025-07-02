package routes

import (
	"github.com/Golden76z/social-network/websockets"
)

func setupWebSocketRoutes(r *Router, wsHub *websockets.Hub) {
	r.GET("/ws", websockets.Handler(wsHub))
}
