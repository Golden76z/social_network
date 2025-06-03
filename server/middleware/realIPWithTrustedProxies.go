package middleware

import (
	"net"
	"net/http"
	"strings"
)

func RealIPWithTrustedProxies(trustedProxies []string) func(next http.Handler) http.Handler {
	// Parse trusted proxy CIDR ranges
	var trustedCIDRs []*net.IPNet
	for _, proxy := range trustedProxies {
		_, cidr, err := net.ParseCIDR(proxy)
		if err != nil {
			// Handle single IPs (convert to CIDR)
			ip := net.ParseIP(proxy)
			if ip == nil {
				continue
			}
			mask := net.CIDRMask(32, 32) // /32 for IPv4
			if ip.To4() == nil {
				mask = net.CIDRMask(128, 128) // /128 for IPv6
			}
			cidr = &net.IPNet{IP: ip, Mask: mask}
		}
		trustedCIDRs = append(trustedCIDRs, cidr)
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get the immediate client IP
			clientIP, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				clientIP = r.RemoteAddr
			}
			ip := net.ParseIP(clientIP)

			// Check if request comes from trusted proxy
			fromTrustedProxy := false
			for _, cidr := range trustedCIDRs {
				if cidr.Contains(ip) {
					fromTrustedProxy = true
					break
				}
			}

			// Only use headers if from trusted proxy
			if fromTrustedProxy {
				if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
					r.RemoteAddr = realIP
				} else if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
					// Take the first IP in the list
					if ips := strings.Split(xff, ","); len(ips) > 0 {
						r.RemoteAddr = strings.TrimSpace(ips[0])
					}
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}
