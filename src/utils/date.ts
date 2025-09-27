



const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
};

export const formatMessageTime = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (error) {
        console.error("Invalid date string for message time:", dateString);
        return '';
    }
};

export const formatNotificationDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short'
        });
    } catch (error) {
        console.error("Invalid date string for notification date:", dateString);
        return '';
    }
};


export const formatCommentDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now.getTime() - date.getTime();
        const diffSeconds = Math.floor(diffTime / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) return "Just now";
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    } catch (error) {
        console.error("Invalid date string for comment date:", dateString);
        return '';
    }
};


export const formatDateSeparator = (dateString: string): string => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const now = new Date();
        
        if (isSameDay(date, now)) {
            return 'Today';
        }
        if (isYesterday(date)) {
            return 'Yesterday';
        }
        return date.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (error) {
        console.error("Invalid date string for separator:", dateString);
        return '';
    }
};

export const getOptimizedUrl = (
  url: string,
  options: { width: number; height: number; quality?: number }
): string => {
  // Return original URL if it's not a valid Supabase storage URL
  if (!url || !url.includes('supabase.co') || !url.includes('/storage/v1/object/public/')) {
    return url;
  }

  const { width, height, quality = 75 } = options;
  try {
    // Replace the path to use the image transformation API endpoint.
    const transformUrl = url.replace('/object/public/', '/render/image/public/');
    const urlObj = new URL(transformUrl);
    
    // Append transformation options as query parameters.
    urlObj.searchParams.set('width', width.toString());
    urlObj.searchParams.set('height', height.toString());
    urlObj.searchParams.set('resize', 'cover');
    urlObj.searchParams.set('quality', quality.toString());
    
    return urlObj.toString();
  } catch (error) {
    console.error("Failed to transform Supabase URL:", error, url);
    return url; // Return original URL on failure.
  }
};
