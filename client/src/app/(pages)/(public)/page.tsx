export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Connect with Friends & Share Your World
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our social network to stay connected with friends, share moments, 
            and discover new communities around your interests.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/register"
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
            >
              Get Started
            </a>
            <a 
              href="/login"
              className="px-8 py-3 border border-border rounded-lg text-lg hover:bg-accent transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Join Us?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-muted-foreground">
                Find and connect with friends, family, and like-minded people
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-semibold mb-2">Share</h3>
              <p className="text-muted-foreground">
                Share your moments, thoughts, and experiences with your network
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold mb-2">Discover</h3>
              <p className="text-muted-foreground">
                Discover new content, communities, and opportunities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users already connecting on our platform
          </p>
          <a 
            href="/register"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-lg hover:bg-primary/90 transition-colors"
          >
            Create Your Account
          </a>
        </div>
      </section>
    </div>
  );
}
