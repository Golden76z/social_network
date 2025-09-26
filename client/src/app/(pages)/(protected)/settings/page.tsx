'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadAvatar } from '@/lib/api/upload';
import { userApi } from '@/lib/api/user';
import type { UserProfile } from '@/lib/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    userApi
      .getProfile()
      .then(setProfile)
      .catch(() => {});
  }, []);

  const onPick = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!/^image\/(jpeg|jpg|png|gif)$/i.test(f.type)) {
      alert('Format non supporté');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 5 Mo)');
      return;
    }
    setPreview(URL.createObjectURL(f));
  };

  const onUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await uploadAvatar(file);
      setProfile((p) => (p ? { ...p, avatar: url } : p));
      alert('Avatar mis à jour');
      // reset input
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (e: any) {
      alert(e?.message || "Erreur d'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar */}
        <div className="p-6 border border-border rounded-lg bg-card">
          <h2 className="text-lg font-semibold mb-4">Avatar</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
              {preview ? (
                <img src={preview} className="w-full h-full object-cover" />
              ) : (
                <img
                  src={profile?.avatar || '/uploads/avatars/default.jpg'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                onClick={onPick}
                disabled={uploading}
              >
                Choisir une image
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                onClick={onUpload}
                disabled={!preview || uploading}
              >
                {uploading ? 'Envoi...' : 'Mettre à jour'}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>

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
