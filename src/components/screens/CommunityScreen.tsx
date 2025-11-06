import * as React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Filter, Search, ThumbsUp, ThumbsDown, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { CommunityPost, CommunityComment, CommunityCategory, BasicProfile } from '../../types/types.ts';
import { useUser } from '../../hooks/useUser.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import EmptyState from '../common/EmptyState.tsx';

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
  const [loading, setLoading] = React.useState(false);
  const { user } = useUser();
  const { showNotification } = useNotification();

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const currentVote = post.userVote;
          let newUpvotes = post.upvotes;
          let newDownvotes = post.downvotes;
          let newUserVote: 'up' | 'down' | null = voteType;

          // Remove previous vote
          if (currentVote === 'up') newUpvotes--;
          if (currentVote === 'down') newDownvotes--;

          // Add new vote
          if (voteType === 'up') {
            newUpvotes++;
          } else {
            newDownvotes++;
          }

          // If clicking same vote, remove it
          if (currentVote === voteType) {
            newUserVote = null;
            if (voteType === 'up') newUpvotes--;
            else newDownvotes--;
          }

          return {
            ...post,
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            userVote: newUserVote
          };
        }
        return post;
      })
    );
  };

  const PostCard: React.FC<{ post: CommunityPost }> = ({ post }) => (
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
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
            >
              <MessageCircle size={14} />
              {post.commentCount}
            </MotionButton>
          </div>
        </div>
      </div>
    </MotionDiv>
  );

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

      {/* Create Post Modal - Placeholder */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <MotionDiv
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950/60 backdrop-blur-xl rounded-3xl w-full max-w-md p-6 border border-zinc-700"
          >
            <h2 className="text-xl font-bold text-white mb-4">Create New Post</h2>
            <p className="text-zinc-400 mb-4">Coming soon! This feature is under development.</p>
            <MotionButton
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreatePost(false)}
              className="w-full py-3 bg-zinc-800 text-white rounded-xl font-semibold hover:bg-zinc-700 transition-colors"
            >
              Close
            </MotionButton>
          </MotionDiv>
        </div>
      )}
    </div>
  );
};

export default CommunityScreen;