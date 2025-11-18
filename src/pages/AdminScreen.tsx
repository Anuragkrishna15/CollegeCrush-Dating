import * as React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, MessageSquare, BarChart3, Mail, AlertTriangle, CheckCircle, XCircle, Trash2, Eye, Search, Filter } from 'lucide-react';
import { useUser } from '../hooks/useUser.ts';
import { useNotification } from '../hooks/useNotification.ts';
import { CommunityPost } from '../types/types.ts';
import { fetchCommunityPosts, deleteCommunityPost, fetchReports, resolveReport, getAppMetrics, sendBulkMessage } from '../services/api.ts';
import LoadingSpinner from '../components/LoadingSpinner.tsx';
import EmptyState from '../components/common/EmptyState.tsx';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const AdminScreen: React.FC = () => {
  const { user } = useUser();
  const { showNotification } = useNotification();

  const [activeTab, setActiveTab] = React.useState<'posts' | 'reports' | 'metrics' | 'messaging'>('posts');
  const [loading, setLoading] = React.useState(false);

  // Check if user is admin - for now, check if email contains 'admin' or specific admin emails
  const isAdmin = React.useMemo(() => {
    if (!user?.email) return false;
    // TODO: Replace with proper admin role check from database
    return user.email.includes('admin') || user.email === 'admin@collegecrush.com';
  }, [user]);

  React.useEffect(() => {
    if (!isAdmin) {
      showNotification('Access denied. Admin privileges required.', 'error');
    }
  }, [isAdmin, showNotification]);

  if (!isAdmin) {
    return (
      <div className="h-full flex flex-col bg-zinc-950">
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={<Shield size={48} className="text-zinc-600" />}
            title="Access Denied"
            message="You don't have permission to access the admin panel."
          />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'posts', label: 'Community Posts', icon: MessageSquare },
    { id: 'reports', label: 'User Reports', icon: AlertTriangle },
    { id: 'metrics', label: 'App Metrics', icon: BarChart3 },
    { id: 'messaging', label: 'Bulk Messaging', icon: Mail },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return <PostsModerationTab />;
      case 'reports':
        return <ReportsManagementTab />;
      case 'metrics':
        return <MetricsTab />;
      case 'messaging':
        return <BulkMessagingTab />;
      default:
        return <PostsModerationTab />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800 p-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-red-400" size={24} />
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <MotionButton
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                <IconComponent size={16} />
                {tab.label}
              </MotionButton>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

// Placeholder components for each tab
const PostsModerationTab: React.FC = () => {
  const { showNotification } = useNotification();
  const [posts, setPosts] = React.useState<CommunityPost[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const loadPosts = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedPosts = await fetchCommunityPosts(selectedCategory === 'All' ? undefined : selectedCategory, 50);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      showNotification('Failed to load posts', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showNotification]);

  React.useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteCommunityPost(postId, 'Admin moderation');
      setPosts(prev => prev.filter(p => p.id !== postId));
      showNotification('Post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      showNotification('Failed to delete post', 'error');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Community Posts Moderation</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
          >
            <option value="All">All Categories</option>
            <option value="Campus Life">Campus Life</option>
            <option value="Study Tips">Study Tips</option>
            <option value="Dating Advice">Dating Advice</option>
            <option value="General Chat">General Chat</option>
            <option value="Memes">Memes</option>
            <option value="Lost & Found">Lost & Found</option>
            <option value="Events">Events</option>
            <option value="Study Groups">Study Groups</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={48} className="text-zinc-600" />}
          title="No posts found"
          message={searchQuery || selectedCategory !== 'All'
            ? "Try adjusting your search or filter"
            : "No community posts available."}
        />
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => (
            <MotionDiv
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4"
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

                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {post.mediaUrls.slice(0, 2).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post media ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-zinc-700"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>{post.upvotes} upvotes</span>
                      <span>{post.commentCount} comments</span>
                    </div>
                    <div className="flex gap-2">
                      <MotionButton
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeletePost(post.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash2 size={14} />
                        Delete
                      </MotionButton>
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsManagementTab: React.FC = () => {
  const { showNotification } = useNotification();
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedReports = await fetchReports();
      setReports(fetchedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      showNotification('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  React.useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolveReport = async (reportId: string, resolution: 'approved' | 'rejected') => {
    try {
      await resolveReport(reportId, resolution);
      setReports(prev => prev.filter(r => r.id !== reportId));
      showNotification(`Report ${resolution === 'approved' ? 'resolved' : 'dismissed'} successfully`, 'success');
    } catch (error) {
      console.error('Error resolving report:', error);
      showNotification('Failed to resolve report', 'error');
    }
  };

  const getReportTargetInfo = (report: any) => {
    if (report.reported_post) {
      return {
        type: 'Post',
        title: report.reported_post.title,
        content: report.reported_post.content?.substring(0, 100) + '...',
        isDeleted: report.reported_post.is_deleted
      };
    } else if (report.reported_comment) {
      return {
        type: 'Comment',
        title: 'Comment',
        content: report.reported_comment.content?.substring(0, 100) + '...',
        isDeleted: report.reported_comment.is_deleted
      };
    } else if (report.reported_user) {
      return {
        type: 'User',
        title: report.reported_user.name,
        content: `Email: ${report.reported_user.email}`,
        isDeleted: false
      };
    }
    return { type: 'Unknown', title: 'Unknown', content: '', isDeleted: false };
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">User Reports Management</h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={48} className="text-zinc-600" />}
          title="No reports to review"
          message="All user reports have been handled."
        />
      ) : (
        <div className="space-y-3">
          {reports.map(report => {
            const targetInfo = getReportTargetInfo(report);
            return (
              <MotionDiv
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        report.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        report.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {report.severity?.toUpperCase() || 'LOW'}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Reported by: {report.reporter?.name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-zinc-600">•</span>
                      <span className="text-xs text-zinc-600">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {targetInfo.type}: {targetInfo.title}
                      </h3>
                      <p className="text-zinc-300 text-sm mb-2">{targetInfo.content}</p>
                      <p className="text-zinc-400 text-sm">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      {report.description && (
                        <p className="text-zinc-400 text-sm mt-1">
                          <strong>Description:</strong> {report.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-500">
                        Type: {report.type}
                      </span>
                      <div className="flex gap-2">
                        <MotionButton
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResolveReport(report.id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                        >
                          <XCircle size={14} />
                          Dismiss
                        </MotionButton>
                        <MotionButton
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleResolveReport(report.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          <CheckCircle size={14} />
                          Resolve
                        </MotionButton>
                      </div>
                    </div>
                  </div>
                </div>
              </MotionDiv>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MetricsTab: React.FC = () => {
  const { showNotification } = useNotification();
  const [metrics, setMetrics] = React.useState<{
    totalUsers: number;
    activeUsers: number;
    totalPosts: number;
    totalReports: number;
    recentSignups: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadMetrics = React.useCallback(async () => {
    try {
      setLoading(true);
      const fetchedMetrics = await getAppMetrics();
      setMetrics(fetchedMetrics);
    } catch (error) {
      console.error('Error loading metrics:', error);
      showNotification('Failed to load metrics', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  React.useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">App Metrics</h2>
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">App Metrics</h2>
        <MotionButton
          whileTap={{ scale: 0.95 }}
          onClick={loadMetrics}
          className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Refresh
        </MotionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Users className="text-blue-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">Total Users</p>
              <p className="text-white text-2xl font-bold">{metrics?.totalUsers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-green-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">Active Users (7d)</p>
              <p className="text-white text-2xl font-bold">{metrics?.activeUsers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="text-purple-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">Community Posts</p>
              <p className="text-white text-2xl font-bold">{metrics?.totalPosts || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">Pending Reports</p>
              <p className="text-white text-2xl font-bold">{metrics?.totalReports || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Users className="text-cyan-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">Recent Signups (30d)</p>
              <p className="text-white text-2xl font-bold">{metrics?.recentSignups || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Mail className="text-pink-400" size={24} />
            <div>
              <p className="text-zinc-400 text-sm">User Engagement</p>
              <p className="text-white text-2xl font-bold">
                {metrics?.totalUsers ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BulkMessagingTab: React.FC = () => {
  const { showNotification } = useNotification();
  const [sending, setSending] = React.useState(false);
  const [formData, setFormData] = React.useState({
    targetAudience: 'all' as 'all' | 'premium' | 'free' | 'active' | 'inactive',
    title: '',
    message: '',
    sendPush: false
  });

  const handleSendMessage = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      showNotification('Please fill in both title and message', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to send this message to ${formData.targetAudience === 'all' ? 'ALL users' : formData.targetAudience.toUpperCase() + ' users'}?`)) {
      return;
    }

    try {
      setSending(true);
      await sendBulkMessage(formData.targetAudience, formData.title, formData.message, formData.sendPush);

      // Reset form
      setFormData({
        targetAudience: 'all',
        title: '',
        message: '',
        sendPush: false
      });

      showNotification('Bulk message sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending bulk message:', error);
      showNotification('Failed to send bulk message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Bulk Messaging</h2>
      <div className="bg-zinc-900/70 backdrop-blur-lg border border-zinc-800 rounded-2xl p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Target Audience
            </label>
            <select
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as any }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="all">All Users</option>
              <option value="premium">Premium Users</option>
              <option value="free">Free Users</option>
              <option value="active">Active Users (Last 7 days)</option>
              <option value="inactive">Inactive Users</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Message Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              placeholder="Enter message title..."
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Message Content
            </label>
            <textarea
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
              placeholder="Enter your message..."
              maxLength={1000}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="send-push"
              checked={formData.sendPush}
              onChange={(e) => setFormData(prev => ({ ...prev, sendPush: e.target.checked }))}
              className="w-4 h-4 text-red-600 bg-zinc-800 border-zinc-700 rounded focus:ring-red-500"
            />
            <label htmlFor="send-push" className="text-sm text-zinc-300">
              Send as push notification
            </label>
          </div>
          <MotionButton
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={sending || !formData.title.trim() || !formData.message.trim()}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <LoadingSpinner size="sm" />
                Sending...
              </>
            ) : (
              <>
                <Mail size={16} />
                Send Message
              </>
            )}
          </MotionButton>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-400 mt-0.5" size={20} />
          <div>
            <h3 className="text-yellow-400 font-semibold mb-1">Important Notes</h3>
            <ul className="text-zinc-300 text-sm space-y-1">
              <li>• Bulk messages will be sent as in-app notifications to all targeted users</li>
              <li>• Push notifications will only be sent to users who have enabled them</li>
              <li>• All bulk messages are logged for audit purposes</li>
              <li>• Use this feature responsibly and only for important announcements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;