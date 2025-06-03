// middleware/cloudflare.go
package middleware

import (
	"net"
	"net/http"
	"strings"
)

var cloudflareIPs = []string{
	"173.245.48.0/20",
	"103.21.244.0/22",
	"103.22.200.0/22",
	"103.31.4.0/22",
	"141.101.64.0/18",
	"108.162.192.0/18",
	"190.93.240.0/20",
	"188.114.96.0/20",
	"197.234.240.0/22",
	"198.41.128.0/17",
	"162.158.0.0/15",
	"104.16.0.0/13",
	"104.24.0.0/14",
	"172.64.0.0/13",
	"131.0.72.0/22",
}

func CloudflareRealIP(next http.Handler) http.Handler {
	// Pre-parse Cloudflare CIDRs
	var cfCIDRs []*net.IPNet
	for _, cidr := range cloudflareIPs {
		_, network, err := net.ParseCIDR(cidr)
		if err == nil {
			cfCIDRs = append(cfCIDRs, network)
		}
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get connecting IP
		ipStr, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ipStr = r.RemoteAddr
		}
		ip := net.ParseIP(ipStr)

		// Verify IP is from Cloudflare
		fromCloudflare := false
		for _, cidr := range cfCIDRs {
			if cidr.Contains(ip) {
				fromCloudflare = true
				break
			}
		}

		// Only trust headers from Cloudflare IPs
		if fromCloudflare {
			if cfConnectingIP := r.Header.Get("CF-Connecting-IP"); cfConnectingIP != "" {
				r.RemoteAddr = cfConnectingIP
			} else if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				// Take the first non-Cloudflare IP in the chain
				ips := strings.Split(xff, ",")
				for i := len(ips) - 1; i >= 0; i-- {
					trimmed := strings.TrimSpace(ips[i])
					if parsed := net.ParseIP(trimmed); parsed != nil {
						isCF := false
						for _, cidr := range cfCIDRs {
							if cidr.Contains(parsed) {
								isCF = true
								break
							}
						}
						if !isCF {
							r.RemoteAddr = trimmed
							break
						}
					}
				}
			}
		}

		next.ServeHTTP(w, r)
	})
}
