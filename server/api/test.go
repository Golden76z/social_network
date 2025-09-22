package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/Golden76z/social-network/db"
	"github.com/Golden76z/social-network/middleware"
	"github.com/Golden76z/social-network/models"
	"github.com/Golden76z/social-network/utils"
)

// TestCookieHandler tests if cookies can be set properly
func TestCookieHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("TestCookieHandler: Setting test cookie\n")

	// Set a simple test cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "test_cookie",
		Value:    "test_value",
		HttpOnly: false, // Make it accessible to JavaScript for testing
		Secure:   false, // Allow in development
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   3600, // 1 hour
	})

	fmt.Printf("TestCookieHandler: Test cookie set\n")

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Test cookie set", "cookie": "test_cookie=test_value"}`))
}

// DebugCookieHandler helps debug cookie issues
func DebugCookieHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("DebugCookieHandler: Debugging cookies\n")

	// Get all cookies from the request
	cookies := r.Cookies()
	cookieMap := make(map[string]string)
	for _, cookie := range cookies {
		cookieMap[cookie.Name] = cookie.Value
	}

	// Check specifically for JWT token
	jwtCookie, err := r.Cookie("jwt_token")
	jwtInfo := map[string]interface{}{
		"found": false,
		"value": "",
		"error": "",
	}

	if err == nil {
		jwtInfo["found"] = true
		jwtInfo["value"] = jwtCookie.Value[:min(20, len(jwtCookie.Value))] + "..."
		jwtInfo["full_length"] = len(jwtCookie.Value)
	} else {
		jwtInfo["error"] = err.Error()
	}

	response := map[string]interface{}{
		"all_cookies": cookieMap,
		"jwt_token":   jwtInfo,
		"user_agent":  r.UserAgent(),
		"origin":      r.Header.Get("Origin"),
		"referer":     r.Header.Get("Referer"),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// TestAuthHandler tests authentication status
func TestAuthHandler(w http.ResponseWriter, r *http.Request) {
	// Check if JWT token exists
	cookie, err := r.Cookie("jwt_token")
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"authenticated": false, "error": "No JWT token found"}`))
		return
	}

	fmt.Printf("TestAuthHandler: JWT token found: %s...\n", cookie.Value[:20])

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"authenticated": true, "token": "` + cookie.Value[:20] + `..."}`))
}

// TestConversationsHandler tests the conversations endpoint with proper context handling
func TestConversationsHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("TestConversationsHandler: Handler called!\n")

	// Check if userID is in context
	userIDValue := r.Context().Value(middleware.UserIDKey)
	if userIDValue == nil {
		fmt.Printf("TestConversationsHandler: No user ID in context\n")
		http.Error(w, "User not authenticated", http.StatusUnauthorized)
		return
	}

	fmt.Printf("TestConversationsHandler: userIDValue type: %T, value: %v\n", userIDValue, userIDValue)
	userID, ok := userIDValue.(int64)
	if !ok {
		fmt.Printf("TestConversationsHandler: Type assertion failed, got type: %T\n", userIDValue)
		http.Error(w, "Invalid user ID in context", http.StatusInternalServerError)
		return
	}

	fmt.Printf("TestConversationsHandler: Success! User ID: %d\n", userID)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Test conversations handler working", "user_id": ` + fmt.Sprintf("%d", userID) + `}`))
}

// TestTokenHandler generates a JWT token for testing purposes
func TestTokenHandler(w http.ResponseWriter, r *http.Request) {
	userIDStr := r.URL.Query().Get("userId")
	if userIDStr == "" {
		http.Error(w, "userId parameter is required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid userId format", http.StatusBadRequest)
		return
	}

	// Generate JWT token - need to get username first
	var username string
	switch userID {
	case 1:
		username = "ckent"
	case 2:
		username = "bwayne"
	default:
		username = fmt.Sprintf("user%d", userID)
	}
	token, err := utils.JWTGeneration(username, w)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"token":   token,
		"user_id": userID,
		"message": "Test token generated successfully",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// TestFollowAPIHandler - Comprehensive test for follow functionality
func TestFollowAPIHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("=== FOLLOW API TEST STARTED ===")

	// Get current user ID from context
	currentUserID, ok := r.Context().Value(middleware.UserIDKey).(int)
	if !ok {
		fmt.Println("❌ ERROR: No user ID in context")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Printf("✅ Current user ID: %d\n", currentUserID)

	// Get test parameters
	targetUserIDStr := r.URL.Query().Get("targetUserId")
	action := r.URL.Query().Get("action") // "follow", "unfollow", "check", "list_followers", "list_following"

	if targetUserIDStr == "" {
		http.Error(w, "targetUserId parameter required", http.StatusBadRequest)
		return
	}

	targetUserID, err := strconv.ParseInt(targetUserIDStr, 10, 64)
	if err != nil {
		fmt.Printf("❌ ERROR: Invalid target user ID: %s\n", targetUserIDStr)
		http.Error(w, "Invalid target user ID", http.StatusBadRequest)
		return
	}

	fmt.Printf("✅ Target user ID: %d\n", targetUserID)
	fmt.Printf("✅ Action: %s\n", action)

	// Prevent self-follow
	if int64(currentUserID) == targetUserID {
		fmt.Println("❌ ERROR: Cannot follow self")
		http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
		return
	}

	// Check if target user exists
	targetUser, err := db.DBService.GetUserByID(targetUserID)
	if err != nil {
		fmt.Printf("❌ ERROR: Target user not found: %v\n", err)
		http.Error(w, "Target user not found", http.StatusBadRequest)
		return
	}
	fmt.Printf("✅ Target user found: %s (%s)\n", targetUser.Nickname, targetUser.FirstName+" "+targetUser.LastName)
	fmt.Printf("✅ Target user is private: %v\n", targetUser.IsPrivate)

	// Check current follow status
	fmt.Println("--- Checking current follow status ---")
	existing, err := db.DBService.GetFollowRequestBetween(int64(currentUserID), targetUserID)
	if err != nil {
		fmt.Printf("✅ No existing follow relationship found: %v\n", err)
	} else {
		fmt.Printf("✅ Existing relationship found: ID=%d, Status=%s, Created=%s\n",
			existing.ID, existing.Status, existing.CreatedAt)
	}

	// Check if following using IsFollowing method
	isFollowing, err := db.DBService.IsFollowing(int64(currentUserID), targetUserID)
	if err != nil {
		fmt.Printf("❌ ERROR checking IsFollowing: %v\n", err)
	} else {
		fmt.Printf("✅ IsFollowing result: %v\n", isFollowing)
	}

	switch action {
	case "follow":
		fmt.Println("--- Testing FOLLOW action ---")
		testFollowAction(w, int64(currentUserID), targetUserID, targetUser)

	case "unfollow":
		fmt.Println("--- Testing UNFOLLOW action ---")
		testUnfollowAction(w, int64(currentUserID), targetUserID)

	case "check":
		fmt.Println("--- Testing CHECK status ---")
		testCheckStatus(w, int64(currentUserID), targetUserID)

	case "list_followers":
		fmt.Println("--- Testing LIST FOLLOWERS ---")
		testListFollowers(w, targetUserID)

	case "list_following":
		fmt.Println("--- Testing LIST FOLLOWING ---")
		testListFollowing(w, int64(currentUserID))

	default:
		fmt.Printf("❌ ERROR: Unknown action: %s\n", action)
		http.Error(w, "Unknown action. Use: follow, unfollow, check, list_followers, list_following", http.StatusBadRequest)
		return
	}

	fmt.Println("=== FOLLOW API TEST COMPLETED ===")
}

func testFollowAction(w http.ResponseWriter, currentUserID, targetUserID int64, targetUser *models.User) {
	fmt.Printf("Attempting to follow user %d...\n", targetUserID)

	// Check for existing relationship first
	existing, err := db.DBService.GetFollowRequestBetween(currentUserID, targetUserID)
	if err == nil {
		fmt.Printf("Found existing relationship: Status=%s\n", existing.Status)
		if existing.Status == "accepted" {
			fmt.Println("✅ Already following - returning success")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"message": "Already following", "status": "accepted"}`))
			return
		}
		if existing.Status == "pending" {
			fmt.Println("✅ Request already pending - returning success")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"message": "Request already pending", "status": "pending"}`))
			return
		}
	}

	// Create follow request
	status := "pending"
	if !targetUser.IsPrivate {
		status = "accepted"
		fmt.Println("✅ Public profile - auto-accepting")
	} else {
		fmt.Println("✅ Private profile - creating pending request")
	}

	err = db.DBService.CreateFollowRequest(currentUserID, targetUserID, status)
	if err != nil {
		fmt.Printf("❌ ERROR creating follow request: %v\n", err)
		http.Error(w, fmt.Sprintf("Error creating follow request: %v", err), http.StatusInternalServerError)
		return
	}

	fmt.Printf("✅ Follow request created with status: %s\n", status)

	// Update counters if accepted
	if status == "accepted" {
		err1 := db.DBService.IncrementFollowingCount(currentUserID)
		err2 := db.DBService.IncrementFollowersCount(targetUserID)
		if err1 != nil {
			fmt.Printf("⚠️ WARNING: Error incrementing following count: %v\n", err1)
		}
		if err2 != nil {
			fmt.Printf("⚠️ WARNING: Error incrementing followers count: %v\n", err2)
		}
		fmt.Println("✅ Counters updated")
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(fmt.Sprintf(`{"message": "Follow request %s", "status": "%s"}`,
		map[string]string{"accepted": "created", "pending": "sent"}[status], status)))
}

func testUnfollowAction(w http.ResponseWriter, currentUserID, targetUserID int64) {
	fmt.Printf("Attempting to unfollow user %d...\n", targetUserID)

	// Find the relationship to delete
	followReq, err := db.DBService.GetFollowRequestBetween(currentUserID, targetUserID)
	if err != nil {
		fmt.Printf("❌ ERROR: No follow relationship found: %v\n", err)
		http.Error(w, "No follow relationship found", http.StatusNotFound)
		return
	}

	fmt.Printf("✅ Found relationship to delete: ID=%d, Status=%s\n", followReq.ID, followReq.Status)

	// Delete the relationship
	err = db.DBService.DeleteFollowRequest(followReq.ID)
	if err != nil {
		fmt.Printf("❌ ERROR deleting follow request: %v\n", err)
		http.Error(w, "Error deleting follow request", http.StatusInternalServerError)
		return
	}

	fmt.Println("✅ Follow relationship deleted")

	// Update counters if it was accepted
	if followReq.Status == "accepted" {
		err1 := db.DBService.DecrementFollowingCount(currentUserID)
		err2 := db.DBService.DecrementFollowersCount(targetUserID)
		if err1 != nil {
			fmt.Printf("⚠️ WARNING: Error decrementing following count: %v\n", err1)
		}
		if err2 != nil {
			fmt.Printf("⚠️ WARNING: Error decrementing followers count: %v\n", err2)
		}
		fmt.Println("✅ Counters updated")
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Successfully unfollowed"}`))
}

func testCheckStatus(w http.ResponseWriter, currentUserID, targetUserID int64) {
	fmt.Println("Checking follow status...")

	// Check using IsFollowing method
	isFollowing, err := db.DBService.IsFollowing(currentUserID, targetUserID)
	if err != nil {
		fmt.Printf("❌ ERROR in IsFollowing: %v\n", err)
		http.Error(w, "Error checking follow status", http.StatusInternalServerError)
		return
	}

	// Check using GetFollowRequestBetween
	existing, err := db.DBService.GetFollowRequestBetween(currentUserID, targetUserID)
	var relationshipStatus string
	if err != nil {
		relationshipStatus = "none"
	} else {
		relationshipStatus = existing.Status
	}

	fmt.Printf("✅ IsFollowing: %v\n", isFollowing)
	fmt.Printf("✅ Relationship status: %s\n", relationshipStatus)

	response := map[string]interface{}{
		"isFollowing":        isFollowing,
		"relationshipStatus": relationshipStatus,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

func testListFollowers(w http.ResponseWriter, targetUserID int64) {
	fmt.Printf("Getting followers for user %d...\n", targetUserID)

	followers, err := db.DBService.GetFollowers(targetUserID)
	if err != nil {
		fmt.Printf("❌ ERROR getting followers: %v\n", err)
		http.Error(w, "Error getting followers", http.StatusInternalServerError)
		return
	}

	fmt.Printf("✅ Found %d followers\n", len(followers))
	for i, follower := range followers {
		fmt.Printf("  %d. %s (%s)\n", i+1, follower.Nickname, follower.FirstName+" "+follower.LastName)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(followers)
}

func testListFollowing(w http.ResponseWriter, currentUserID int64) {
	fmt.Printf("Getting following list for user %d...\n", currentUserID)

	following, err := db.DBService.GetFollowing(currentUserID)
	if err != nil {
		fmt.Printf("❌ ERROR getting following: %v\n", err)
		http.Error(w, "Error getting following", http.StatusInternalServerError)
		return
	}

	fmt.Printf("✅ Found %d users being followed\n", len(following))
	for i, user := range following {
		fmt.Printf("  %d. %s (%s)\n", i+1, user.Nickname, user.FirstName+" "+user.LastName)
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(following)
}
