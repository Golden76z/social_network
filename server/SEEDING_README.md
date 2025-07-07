# Database Seeding Guide

Simple guide to populate your social network database with test data.

## Quick Start

```bash
# Make sure you're in the server directory
cd server

# Run the seeder
./seed.sh
```

## What Gets Created

The seeder adds realistic test data:

### 👥 Test Users (5 accounts)
- `test_alice@example.com` - Alice Johnson (Public profile)
- `test_bob@example.com` - Bob Wilson (Public profile)  
- `test_carol@example.com` - Carol Davis (Private profile)
- `test_david@example.com` - David Miller (Public profile)
- `test_emma@example.com` - Emma Brown (Private profile)

**Password for all accounts:** `password123`

### 📝 Content
- **Posts**: 10+ posts with various content (public and private)
- **Comments**: 1-2 comments per post
- **Groups**: 5 groups (Tech, Photography, Books, Fitness, Travel)
- **Follow Requests**: Various follow relationships between users
- **Group Features**: Members, posts, comments, events, messages, invitations
- **Interactions**: Likes/dislikes on posts and comments
- **Notifications**: System notifications for all users
- **Private Messages**: Direct messages between users
- **Event RSVPs**: Responses to group events
- **Post Visibility**: Custom post visibility settings

## How It Works

1. **Self-contained**: The script creates a temporary Go program
2. **Safe**: Can be run multiple times without conflicts
3. **Fast**: Completes in seconds
4. **Clean**: Removes temporary files automatically

## Troubleshooting

### Database Not Found
```
❌ Error: social_network.db not found
```
**Solution**: Run from the `server` directory where the database exists.

### Permission Denied
```
permission denied: ./seed.sh
```
**Solution**: Make the script executable:
```bash
chmod +x seed.sh
```

### Go Not Installed
```
❌ Error: Go is not installed
```
**Solution**: Install Go from https://golang.org/dl/

## Manual Database Check

After seeding, verify the data:

```bash
# Connect to database
sqlite3 social_network.db

# Check user count
SELECT COUNT(*) FROM users;

# View test users
SELECT nickname, email FROM users WHERE email LIKE 'test_%';

# Exit
.quit
```

### Consistent Test Data
- All team members get the same test accounts
- Passwords are consistent (`password123`)
- Data is realistic and varied

### Development Workflow
```bash
# 1. Set up database
go run . # Start server to create/migrate database

# 2. Add test data  
./seed.sh

# 3. Start development
go run .
```

---

**That's it!** Simple, clean, and easy to use. 🚀
