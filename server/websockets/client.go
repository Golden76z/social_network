package websockets

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

// Client message handling methods
func (c *Client) ReadPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	// Set read deadline and pong handler for heartbeat
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var msg Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Add client info to message
		msg.UserID = c.UserID
		msg.Username = c.Username
		msg.Timestamp = time.Now()

		// Handle different message types
		switch msg.Type {
		case MessageTypeChat:
			// Validate and sanitize message content
			if len(msg.Content) > 1000 {
				msg.Content = msg.Content[:1000]
			}
			c.Hub.broadcast <- msg

		case MessageTypePing:
			// Respond with pong
			pongMsg := Message{
				Type:      MessageTypePong,
				Timestamp: time.Now(),
			}
			select {
			case c.Send <- pongMsg:
			default:
				return
			}
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteJSON(message); err != nil {
				log.Printf("WebSocket write error: %v", err)
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
