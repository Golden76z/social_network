export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Public header with login/register links */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">SocialNetwork</div>
          <nav className="flex gap-4">
            <a
              href="/login"
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Login
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign Up
            </a>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 SocialNetwork. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
