export default function MessagesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="p-4 border border-border rounded-lg bg-card">
            <h2 className="font-semibold mb-4">Conversations</h2>
            
            <div className="space-y-2">
              <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                    J
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">John Doe</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Hey, how are you doing?
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">2m</div>
                </div>
              </div>
              
              <div className="p-3 rounded-lg hover:bg-accent cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                    S
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Sarah Wilson</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Thanks for sharing that article!
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">1h</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="lg:col-span-2">
          <div className="p-4 border border-border rounded-lg bg-card h-96 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="text-4xl mb-4">💬</div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
