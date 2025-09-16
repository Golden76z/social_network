// /* eslint-disable @next/next/no-img-element */
// /**
//  * Composant PostCard - Affichage d'un post
//  *
//  * Ce composant affiche un post avec toutes ses informations :
//  * - Auteur et avatar
//  * - Titre et contenu
//  * - Images
//  * - Date de création
//  * - Actions (like, commenter, etc.)
//  */

// import React, { useState } from 'react';
// import {
//   Heart,
//   MessageCircle,
//   MoreHorizontal,
//   Edit,
//   Trash2,
// } from 'lucide-react';
// import { PostResponse } from '@/services/posts';
// import { postsService } from '@/services/posts';
// import { useAuth } from '@/context/AuthProvider';
// import Button from './ui/button';
// import { Card, CardContent, CardHeader } from '@/components/ui/card';

// interface PostCardProps {
//   post: PostResponse;
//   onUpdate?: (post: PostResponse) => void;
//   onDelete?: (postId: number) => void;
//   showActions?: boolean;
// }

// export const PostCard: React.FC<PostCardProps> = ({
//   post,
//   onDelete,
//   showActions = true,
// }) => {
//   const { user } = useAuth();
//   const [isLiked, setIsLiked] = useState(false);
//   const [likeCount, setLikeCount] = useState(0);
//   const [commentCount] = useState(0);
//   const [showMenu, setShowMenu] = useState(false);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // Vérifier si l'utilisateur actuel est l'auteur du post
//   const isAuthor = user?.id === post.author_id;

//   // Formater la date de création
//   const formattedDate = postsService.formatDate(post.created_at);

//   // Gérer le like
//   const handleLike = () => {
//     setIsLiked(!isLiked);
//     setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
//   };

//   // Gérer la suppression
//   const handleDelete = async () => {
//     if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
//       return;
//     }

//     try {
//       setIsDeleting(true);
//       await postsService.deletePost(post.id);
//       onDelete?.(post.id);
//     } catch (error) {
//       console.error('Erreur lors de la suppression:', error);
//       alert('Erreur lors de la suppression du post');
//     } finally {
//       setIsDeleting(false);
//       setShowMenu(false);
//     }
//   };

//   // Gérer l'édition
//   const handleEdit = () => {
//     // TODO: Implémenter l'édition
//     console.log('Éditer le post:', post.id);
//     setShowMenu(false);
//   };

//   return (
//     <Card className="mb-4 hover:shadow-md transition-shadow">
//       <CardHeader className="pb-3">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center space-x-3">
//             {/* Avatar de l'auteur */}
//             <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
//               {post.author_avatar ? (
//                 <img
//                   src={post.author_avatar}
//                   alt={post.author_nickname}
//                   className="w-full h-full rounded-full object-cover"
//                 />
//               ) : (
//                 post.author_nickname.charAt(0).toUpperCase()
//               )}
//             </div>

//             <div>
//               <div className="flex items-center space-x-2">
//                 <p className="font-semibold text-sm">{post.author_nickname}</p>
//                 {post.group_name && (
//                   <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
//                     {post.group_name}
//                   </span>
//                 )}
//               </div>
//               <p className="text-xs text-gray-500">{formattedDate}</p>
//             </div>
//           </div>

//           {/* Menu d'actions pour l'auteur */}
//           {isAuthor && showActions && (
//             <div className="relative">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => setShowMenu(!showMenu)}
//                 className="p-1"
//               >
//                 <MoreHorizontal className="w-4 h-4" />
//               </Button>

//               {showMenu && (
//                 <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
//                   <button
//                     onClick={handleEdit}
//                     className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
//                   >
//                     <Edit className="w-4 h-4" />
//                     <span>Modifier</span>
//                   </button>
//                   <button
//                     onClick={handleDelete}
//                     disabled={isDeleting}
//                     className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-red-600"
//                   >
//                     <Trash2 className="w-4 h-4" />
//                     <span>{isDeleting ? 'Suppression...' : 'Supprimer'}</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </CardHeader>

//       <CardContent className="pt-0">
//         {/* Titre du post */}
//         {post.title && (
//           <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
//         )}

//         {/* Contenu du post */}
//         <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.body}</p>

//         {/* Images du post */}
//         {post.images && post.images.length > 0 && (
//           <div className="mb-4">
//             {post.images.length === 1 ? (
//               <img
//                 src={post.images[0]}
//                 alt="Post image"
//                 className="w-full max-h-96 object-cover rounded-lg"
//               />
//             ) : (
//               <div className="grid grid-cols-2 gap-2">
//                 {post.images.slice(0, 4).map((image, index) => (
//                   <img
//                     key={index}
//                     src={image}
//                     alt={`Post image ${index + 1}`}
//                     className="w-full h-32 object-cover rounded-lg"
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Actions du post */}
//         {showActions && (
//           <div className="flex items-center justify-between pt-3 border-t border-gray-100">
//             <div className="flex items-center space-x-6">
//               <button
//                 onClick={handleLike}
//                 className={`flex items-center space-x-2 text-sm transition-colors ${
//                   isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
//                 }`}
//               >
//                 <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
//                 <span>{likeCount}</span>
//               </button>

//               <button className="flex items-center space-x-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
//                 <MessageCircle className="w-4 h-4" />
//                 <span>{commentCount}</span>
//               </button>
//             </div>

//             {/* Indicateur de mise à jour */}
//             {post.updated_at && (
//               <span className="text-xs text-gray-400">
//                 Modifié le{' '}
//                 {new Date(post.updated_at).toLocaleDateString('fr-FR')}
//               </span>
//             )}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };
