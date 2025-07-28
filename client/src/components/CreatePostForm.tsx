/* eslint-disable jsx-a11y/alt-text */
/**
 * Composant CreatePostForm - Formulaire de création de post
 *
 * Ce composant permet de créer un nouveau post avec :
 * - Titre et contenu
 * - Gestion des images (à implémenter)
 * - Visibilité (public/privé)
 * - Validation des données
 */

import React, { useState } from 'react';
import { Send, Image, Eye, EyeOff } from 'lucide-react';
import { CreatePostRequest } from '@/services/posts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface CreatePostFormProps {
  onSubmit: (postData: CreatePostRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CreatePostRequest>({
    title: '',
    body: '',
    images: [],
    visibility: 'public',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    } else if (formData.title.length > 125) {
      newErrors.title = 'Le titre ne peut pas dépasser 125 caractères';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Le contenu est requis';
    } else if (formData.body.length > 2200) {
      newErrors.body = 'Le contenu ne peut pas dépasser 2200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements dans le formulaire
  const handleChange = (
    field: keyof CreatePostRequest,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);

      // Réinitialiser le formulaire après succès
      setFormData({
        title: '',
        body: '',
        images: [],
        visibility: 'public',
      });
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de la création du post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion de l'ajout d'images (placeholder pour l'instant)
  const handleImageUpload = () => {
    // TODO: Implémenter l'upload d'images
    alert("Fonctionnalité d'upload d'images à implémenter");
  };

  const isFormValid = formData.title.trim() && formData.body.trim();
  const isDisabled = isLoading || isSubmitting || !isFormValid;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Créer un nouveau post</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre du post */}
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              type="text"
              placeholder="Titre de votre post..."
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
              maxLength={125}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/125 caractères
            </p>
          </div>

          {/* Contenu du post */}
          <div>
            <Label htmlFor="body">Contenu</Label>
            <textarea
              id="body"
              placeholder="Partagez vos pensées..."
              value={formData.body}
              onChange={(e) => handleChange('body', e.target.value)}
              className={`w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.body ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={4}
              maxLength={2200}
            />
            {errors.body && (
              <p className="text-sm text-red-500 mt-1">{errors.body}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.body.length}/2200 caractères
            </p>
          </div>

          {/* Visibilité */}
          <div>
            <Label>Visibilité</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => handleChange('visibility', e.target.value)}
                  className="text-blue-600"
                />
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm">Public</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => handleChange('visibility', e.target.value)}
                  className="text-blue-600"
                />
                <EyeOff className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Privé</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageUpload}
                disabled={isDisabled}
              >
                <Image className="w-4 h-4 mr-2" />
                Ajouter des images
              </Button>
            </div>

            <div className="flex space-x-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isDisabled}
                >
                  Annuler
                </Button>
              )}

              <Button
                type="submit"
                disabled={isDisabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Publication...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Publier</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
