

import * as React from 'react';
import { fetchEvents, rsvpEvent } from '../services/api.ts';
import { CollegeEvent } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';
import ScrollToTopButton from '../components/common/ScrollToTopButton.tsx';
import EmptyState from '../components/common/EmptyState.tsx';
import GridSkeleton from '../components/skeletons/GridSkeleton.tsx';
import { Check, Star, PartyPopper, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../services/supabase.ts';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const EventCard: React.FC<{ collegeEvent: CollegeEvent, onRsvp: (id: string, status: 'going' | 'interested' | 'none') => void }> = React.memo(({ collegeEvent, onRsvp }) => {
    const rsvpStatus = collegeEvent.rsvpStatus || 'none';

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '';
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    return (
    <MotionDiv
        whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(139, 92, 246, 0.1)" }}
        className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden"
    >
      <img src={collegeEvent.image_url || '/images/logo.png'} alt={collegeEvent.name} loading="lazy" className="w-full h-32 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg text-white">{collegeEvent.name}</h3>
        <p className="text-sm text-zinc-400 mb-2">{collegeEvent.college} &middot; {formatDate(collegeEvent.event_date)}</p>
        {collegeEvent.description && (
          <p className="text-sm text-zinc-300 mb-2 line-clamp-2">{collegeEvent.description}</p>
        )}
        <div className="space-y-1 text-sm text-zinc-400 mb-3">
          {collegeEvent.event_time && (
            <p><span className="font-medium">Time:</span> {formatTime(collegeEvent.event_time)}{collegeEvent.end_time ? ` - ${formatTime(collegeEvent.end_time)}` : ''}</p>
          )}
          {collegeEvent.location && (
            <p><span className="font-medium">Location:</span> {collegeEvent.location}</p>
          )}
          {collegeEvent.organizer && (
            <p><span className="font-medium">Organizer:</span> {collegeEvent.organizer.name}</p>
          )}
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
          <p className="text-sm text-zinc-300">RSVP Status</p>
          <div className="flex items-center gap-2">
            <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onRsvp(collegeEvent.id, 'going')} className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${rsvpStatus === 'going' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-zinc-800 border-transparent hover:bg-zinc-700'}`}>
              <Check size={14} /> Attending
            </MotionButton>
            <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onRsvp(collegeEvent.id, 'interested')} className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${rsvpStatus === 'interested' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-zinc-800 border-transparent hover:bg-zinc-700'}`}>
              <Star size={14} /> Maybe
            </MotionButton>
            <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onRsvp(collegeEvent.id, 'none')} className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${rsvpStatus === 'none' ? 'bg-red-500/20 text-red-300 border-red-500/50' : 'bg-zinc-800 border-transparent hover:bg-zinc-700'}`}>
              <X size={14} /> Not Attending
            </MotionButton>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
});


const EventsScreen: React.FC = () => {
  const [events, setEvents] = React.useState<CollegeEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = React.useState<CollegeEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = React.useState<string>('All');
  const [dateFilter, setDateFilter] = React.useState<string>('');
  const { user } = useUser();

  const loadEvents = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
        const fetchedEvents = await fetchEvents(user.id);
        setEvents(fetchedEvents);
    } catch(err) {
        setError("Could not load events. Please check your connection and try again.");
    } finally {
        setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadEvents();

    if (!user) return;

    // Set up real-time subscription for RSVP updates
    const channel = supabase
      .channel('rsvp-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_rsvps',
        },
        (payload) => {
          // Update events when RSVP changes
          setEvents(prevEvents =>
            prevEvents.map(event => {
              if (event.id === payload.new?.event_id || event.id === payload.old?.event_id) {
                // If it's the current user's RSVP, update status
                if (payload.new?.user_id === user.id) {
                  return { ...event, rsvpStatus: payload.new.status };
                }
                // For other users, just update attendee count if needed
                // But since we don't have live count, perhaps refetch
                // For now, just update if it's user's own
              }
              return event;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents, user]);

  // Filter events based on category and date
  React.useEffect(() => {
    let filtered = events;

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(event => event.category === categoryFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter(event => event.event_date === dateFilter);
    }

    setFilteredEvents(filtered);
  }, [events, categoryFilter, dateFilter]);

  const handleRsvp = async (eventId: string, status: 'going' | 'interested' | 'none') => {
    if (!user) return;
    
    const originalEvents = [...events];
    const eventToUpdate = events.find(e => e.id === eventId);
    if (!eventToUpdate) return;
    
    const newStatus = eventToUpdate.rsvpStatus === status ? 'none' : status;

    // Optimistic update
    setEvents(prevEvents => 
      prevEvents.map(e => e.id === eventId ? { ...e, rsvpStatus: newStatus } : e)
    );

    try {
      await rsvpEvent(eventId, user.id, status);
    } catch (error) {
      // Revert on failure
      setEvents(originalEvents);
    }
  };

  const renderContent = () => {
    if (loading) {
        return <GridSkeleton cardType="event" />;
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-16 text-zinc-500">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300">Something went wrong</h3>
                <p className="mt-2 max-w-xs">{error}</p>
                <button onClick={loadEvents} className="mt-6 px-6 py-2 bg-pink-600 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-white">
                    Retry
                </button>
            </div>
        );
    }
    if (filteredEvents.length > 0) {
        return (
            <div className="space-y-4">
              {filteredEvents.map(event => <EventCard key={event.id} collegeEvent={event} onRsvp={handleRsvp} />)}
            </div>
        );
    }
    return (
        <EmptyState 
            icon={<PartyPopper size={64} />}
            title="Nothing On The Calendar"
            message="No upcoming events found. Check back soon for new listings from your college!"
        />
    );
  };

  return (
    <div className="relative h-full">
      <div className="p-4 md:p-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="All">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Social">Social</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Career">Career</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
        </div>
        {renderContent()}
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default EventsScreen;
