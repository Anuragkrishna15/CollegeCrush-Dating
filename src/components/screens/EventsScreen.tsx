

import * as React from 'react';
import { fetchEvents, rsvpEvent } from '../../services/api.ts';
import { CollegeEvent } from '../../types/types.ts';
import { useUser } from '../../hooks/useUser.ts';
import ScrollToTopButton from '../common/ScrollToTopButton.tsx';
import EmptyState from '../common/EmptyState.tsx';
import GridSkeleton from '../skeletons/GridSkeleton.tsx';
import { Check, Star, PartyPopper, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const EventCard: React.FC<{ collegeEvent: CollegeEvent, onRsvp: (id: string, status: 'going' | 'interested') => void }> = React.memo(({ collegeEvent, onRsvp }) => {
    const rsvpStatus = collegeEvent.rsvpStatus || 'none';
  
    return (
    <MotionDiv 
        whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(139, 92, 246, 0.1)" }}
        className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden"
    >
      <img src={collegeEvent.imageUrl} alt={collegeEvent.name} loading="lazy" className="w-full h-32 object-cover" />
      <div className="p-4">
        <h3 className="font-bold text-lg">{collegeEvent.name}</h3>
        <p className="text-sm text-zinc-400">{collegeEvent.college} &middot; {collegeEvent.date}</p>
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
          <p className="text-sm text-zinc-300">Are you attending?</p>
          <div className="flex items-center gap-2">
            <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onRsvp(collegeEvent.id, 'interested')} className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${rsvpStatus === 'interested' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-zinc-800 border-transparent hover:bg-zinc-700'}`}>
              <Star size={14} /> Interested
            </MotionButton>
            <MotionButton whileTap={{ scale: 0.95 }} onClick={() => onRsvp(collegeEvent.id, 'going')} className={`px-3 py-1.5 text-sm rounded-full border transition-colors flex items-center gap-1 ${rsvpStatus === 'going' ? 'bg-green-500/20 text-green-300 border-green-500/50' : 'bg-zinc-800 border-transparent hover:bg-zinc-700'}`}>
              <Check size={14} /> Going
            </MotionButton>
          </div>
        </div>
      </div>
    </MotionDiv>
  );
});


const EventsScreen: React.FC = () => {
  const [events, setEvents] = React.useState<CollegeEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
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
  }, [loadEvents]);

  const handleRsvp = async (eventId: string, status: 'going' | 'interested') => {
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
    if (events.length > 0) {
        return (
            <div className="space-y-4">
              {events.map(event => <EventCard key={event.id} collegeEvent={event} onRsvp={handleRsvp} />)}
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
        {renderContent()}
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default EventsScreen;
