import * as React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Filter, Search, ThumbsUp, ThumbsDown, MessageCircle, Eye, EyeOff, Image, X, Send } from 'lucide-react';
import { CommunityPost, CommunityComment, CommunityCategory, BasicProfile } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';
import { useNotification } from '../hooks/useNotification.ts';
import { createCommunityPost, fetchCommunityPosts, voteOnPost, createCommunityComment, fetchCommunityComments } from '../services/api.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import EmptyState from '../components/common/EmptyState.tsx';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const CATEGORIES: CommunityCategory[] = [
  'Campus Life',
  'Study Tips',
  'Dating Advice',
  'General Chat',
  'Memes',
  'Lost & Found',
  'Events',
  'Study Groups'
];

// Community posts will be loaded from API

const CommunityScreen: React.FC = () => {
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<CommunityCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showCreatePost, setShowCreatePost] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [creatingPost, setCreatingPost] = React.useState(false);
  const [postForm, setPostForm] = React.useState({
    title: '',
    content: '',
    category: CATEGORIES[0] as CommunityCategory,
    isAnonymous: false,
    mediaFiles: [] as File[]
  });
  const [formError, setFormError] = React.useState('');
  const [expandedPosts, setExpandedPosts] = React.useState<Set<string>>(new Set());
  const [comments, setComments] = React.useState<Record<string, CommunityComment[]>>({});
  const [commentInputs, setCommentInputs] = React.useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = React.useState<Record<string, boolean>>({});
  const { user } = useUser();
  const { showNotification } = useNotification();

  // Load posts on component mount
  React.useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchCommunityPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      showNotification('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    try {
      await voteOnPost(postId, voteType);
      // Reload posts to get updated vote counts
      await loadPosts();
    } catch (error) {
      console.error('Error voting on post:', error);
      showNotification('Failed to vote on post', 'error');
    }
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      setFormError('Title and content are required');
      return;
    }

    try {
      setCreatingPost(true);
      setFormError('');

      await createCommunityPost(
        postForm.title,
        postForm.content,
        postForm.category,
        postForm.isAnonymous,
        postForm.mediaFiles.length > 0 ? postForm.mediaFiles : undefined
      );

      // Reset form and close modal
      setPostForm({
        title: '',
        content: '',
        category: CATEGORIES[0] as CommunityCategory,
        isAnonymous: false,
        mediaFiles: []
      });
      setShowCreatePost(false);

      // Reload posts
      await loadPosts();

      showNotification('Post created successfully!', 'success');
    } catch (error) {
      console.error('Error creating post:', error);
      setFormError('Failed to create post. Please try again.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      showNotification('Only image files are allowed', 'info');
    }

    setPostForm(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...imageFiles].slice(0, 4) // Max 4 images
    }));
  };

  const removeMediaFile = (index: number) => {
    setPostForm(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }));
  };

  const togglePostExpansion = async (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Load comments if not already loaded
      if (!comments[postId]) {
        try {
          const postComments = await fetchCommunityComments(postId);
          setComments(prev => ({ ...prev, [postId]: postComments }));
        } catch (error) {
          console.error('Error loading comments:', error);
          showNotification('Failed to load comments', 'error');
        }
      }
    }
    setExpandedPosts(newExpanded);
  };

  const handlePostComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;

    try {
      setPostingComment(prev => ({ ...prev, [postId]: true }));

      await createCommunityComment(postId, content, false);

      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      // Reload comments
      const updatedComments = await fetchCommunityComments(postId);
      setComments(prev => ({ ...prev, [postId]: updatedComments }));

      // Update post comment count
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );

      showNotification('Comment posted!', 'success');
    } catch (error) {
      console.error('Error posting comment:', error);
      showNotification('Failed to post comment', 'error');
    } finally {
      setPostingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  const CommentItem: React.FC<{ comment: CommunityComment; depth?: number }> = ({ comment, depth = 0 }) => (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 mt-3' : 'mt-3'}`}>
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
        {comment.isAnonymous ? '?' : comment.author?.name.charAt(0) || 'U'}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-zinc-300">
            {comment.isAnonymous ? 'Anonymous' : comment.author?.name}
          </span>
          <span className="text-xs text-zinc-600">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-zinc-300 text-sm">{comment.content}</p>
        <div className="flex items-center gap-2 mt-2">
          <MotionButton
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            <ThumbsUp size={12} />
            {comment.upvotes}
          </MotionButton>
          <MotionButton
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
          >
            <ThumbsDown size={12} />
            {comment.downvotes}
          </MotionButton>
        </div>
      </div>
    </div>
  );

  const PostCard: React.FC<{ post: CommunityPost }> = ({ post }) => {
    const isExpanded = expandedPosts.has(post.id);
    const postComments = comments[post.id] || [];

    return (
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
            {post.isAnonymous ? '?' : post.author?.name.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                {post.category}
              </span>
              <span className="text-xs text-zinc-500">
                {post.isAnonymous ? 'Anonymous' : post.author?.name}
              </span>
              <span className="text-xs text-zinc-600">•</span>
              <span className="text-xs text-zinc-600">
                {new Date(post.created_at).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
            <p className="text-zinc-300 mb-3">{post.content}</p>

            {/* Media display */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {post.mediaUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post media ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                  />
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MotionButton
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(post.id, 'up')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    post.userVote === 'up'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <ThumbsUp size={14} />
                  {post.upvotes}
                </MotionButton>
                <MotionButton
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVote(post.id, 'down')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    post.userVote === 'down'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <ThumbsDown size={14} />
                  {post.downvotes}
                </MotionButton>
              </div>

              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={() => togglePostExpansion(post.id)}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
              >
                <MessageCircle size={14} />
                {post.commentCount}
              </MotionButton>
            </div>

            {/* Comments Section */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                {/* Comment Input */}
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.name.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Write a comment..."
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !postingComment[post.id]) {
                          handlePostComment(post.id);
                        }
                      }}
                    />
                    <MotionButton
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePostComment(post.id)}
                      disabled={postingComment[post.id] || !commentInputs[post.id]?.trim()}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {postingComment[post.id] ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send size={14} />
                      )}
                    </MotionButton>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {postComments.length > 0 ? (
                    postComments.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  ) : (
                    <p className="text-zinc-500 text-sm text-center py-4">
                      No comments yet. Be the first to comment!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </MotionDiv>
    );
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="text-purple-400" />
            Community
          </h1>
          <MotionButton
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreatePost(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={18} />
            New Post
          </MotionButton>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as CommunityCategory | 'All')}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <MotionButton
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-purple-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            All
          </MotionButton>
          {CATEGORIES.map(category => (
            <MotionButton
              key={category}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {category}
            </MotionButton>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <EmptyState
            icon={<MessageSquare size={48} className="text-zinc-600" />}
            title="No posts found"
            message={searchQuery || selectedCategory !== 'All'
              ? "Try adjusting your search or filter"
              : "Be the first to start a discussion!"}
          />
        )}
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-lg p-6 border border-zinc-700 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Post</h2>
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreatePost(false)}
                className="p-2 text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </MotionButton>
            </div>

            <div className="space-y-4">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What's your post about?"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  maxLength={200}
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Category *
                </label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm(prev => ({ ...prev, category: e.target.value as CommunityCategory }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Content *
                </label>
                <textarea
                  value={postForm.content}
                  onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
                  maxLength={10000}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Images (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-700 cursor-pointer transition-colors"
                  >
                    <Image size={16} />
                    Choose Images (Max 4)
                  </label>

                  {/* Selected Images Preview */}
                  {postForm.mediaFiles.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {postForm.mediaFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-zinc-700"
                          />
                          <button
                            onClick={() => removeMediaFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={postForm.isAnonymous}
                  onChange={(e) => setPostForm(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-zinc-800 border-zinc-700 rounded focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="text-sm text-zinc-300">
                  Post anonymously
                </label>
              </div>

              {/* Error Message */}
              {formError && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <MotionButton
                whileTap={{ scale: 0.95 }}
                onClick={handleCreatePost}
                disabled={creatingPost}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creatingPost ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Create Post
                  </>
                )}
              </MotionButton>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  );
};

export default CommunityScreen;
