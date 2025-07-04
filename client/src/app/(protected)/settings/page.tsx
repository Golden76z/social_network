export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Account Settings */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full p-3 border border-border rounded-lg bg-background"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                className="w-full p-3 border border-border rounded-lg bg-background"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                className="w-full p-3 border border-border rounded-lg bg-background"
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Profile Visibility</div>
                <div className="text-sm text-muted-foreground">
                  Who can see your profile
                </div>
              </div>
              <select className="p-2 border border-border rounded bg-background">
                <option>Everyone</option>
                <option>Friends</option>
                <option>Private</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Message Requests</div>
                <div className="text-sm text-muted-foreground">
                  Who can send you messages
                </div>
              </div>
              <select className="p-2 border border-border rounded bg-background">
                <option>Everyone</option>
                <option>Friends Only</option>
                <option>Nobody</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive notifications via email
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Receive push notifications
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
