'use client';

import { useState } from 'react';
import { uploadPostImage } from '@/lib/api/upload';
import { postApi } from '@/lib/api/post';
import { compressImageToJpeg } from '@/lib/utils';

type LocalImage = { file: File; preview: string };

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const maxImages = 4;
  const maxSize = 5 * 1024 * 1024; // 5MB

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...images];
    for (const f of files) {
      if (next.length >= maxImages) break;
      if (!/^image\/(jpeg|jpg|png|gif)$/i.test(f.type)) continue;
      if (f.size > maxSize) continue;
      next.push({ file: f, preview: URL.createObjectURL(f) });
    }
    setImages(next);
    e.currentTarget.value = '';
  };

  const removeImage = (idx: number) => {
    const next = [...images];
    URL.revokeObjectURL(next[idx].preview);
    next.splice(idx, 1);
    setImages(next);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      // Compress + upload sequentially to honor submit policy
      const urls: string[] = [];
      for (const item of images) {
        const compressed = await compressImageToJpeg(item.file, 1600, 0.85);
        const { url } = await uploadPostImage(compressed);
        urls.push(url);
      }

      await postApi.createPost({
        title,
        body: content,
        images: urls,
        visibility: 'public',
      });
      // Reset
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setImages([]);
      setTitle('');
      setContent('');
      alert('Post créé');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la publication';
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create a New Post</h1>

      <div className="max-w-2xl">
        <div className="p-6 border border-border rounded-lg bg-card">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-2">
                Title
              </label>
              <input
                id="title"
                type="text"
                maxLength={125}
                placeholder="Add a short title..."
                className="w-full p-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {title.length}/125
              </div>
            </div>
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium mb-2"
              >
                What&apos;s on your mind?
              </label>
              <textarea
                id="content"
                placeholder="Share your thoughts..."
                className="w-full min-h-32 p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                  📷 Add Photos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    multiple
                    className="hidden"
                    onChange={onSelectFiles}
                  />
                </label>
                <span className="text-xs text-muted-foreground">
                  {images.length}/{maxImages}
                </span>
              </div>
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={img.preview}
                        alt="preview"
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 text-xs bg-black/60 text-white px-1 rounded"
                        onClick={() => removeImage(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Save Draft
              </button>

              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
