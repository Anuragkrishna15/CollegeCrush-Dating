

import * as React from 'react';
import { fetchTrips, bookTrip, fetchUserTripBookings, cancelTripBooking } from '../services/api.ts';
import { Trip, MembershipType, TripBooking } from '../types/types.ts';
import { useUser } from '../hooks/useUser.ts';
import { useNotification } from '../hooks/useNotification.ts';
import { PREMIUM_GRADIENT } from '../constants/constants.ts';
import ScrollToTopButton from '../components/common/ScrollToTopButton.tsx';
import GridSkeleton from '../components/skeletons/GridSkeleton.tsx';
import BookTripModal from '../components/modals/BookTripModal.tsx';
import { supabase } from '../services/supabase.ts';
import { Info, IndianRupee, Users, Lock, AlertTriangle, MapPin, X, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/LoadingSpinner.tsx';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

const TripCard: React.FC<{ trip: Trip; onBook: (trip: Trip) => void; isBooking: boolean; activeBookingsCount: number; }> = React.memo(({ trip, onBook, isBooking, activeBookingsCount }) => {
  const { user } = useUser();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isStrangerTrip = trip.type === 'Stranger';
  const isPremium = user?.membership === MembershipType.Premium;
  const canBook = isPremium || activeBookingsCount < 1;

  const needsExpansion = trip.details && trip.details.length > 120;

  return (
    <MotionDiv 
        whileHover={{ y: -5, boxShadow: "0px 10px 30px rgba(236, 72, 153, 0.1)" }}
        className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-lg"
    >
      <div className="relative">
        <img src={trip.image_url} alt={trip.location} loading="lazy" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full border ${isStrangerTrip ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-pink-500/20 text-pink-300 border-pink-500/50'}`}>
          {trip.type} Trip
        </span>
         <div className="absolute bottom-0 p-4 w-full">
            <h3 className="font-bold text-2xl text-white shadow-black [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">{trip.location}</h3>
            <p className="text-sm text-zinc-200 shadow-black [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">{trip.date}</p>
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col bg-transparent">
        
        <div className="mb-4">
            <h4 className="font-semibold text-zinc-300 flex items-center gap-2"><Info size={16} className="text-pink-400"/> Trip Details</h4>
            <div className={`text-sm text-zinc-400 mt-2 transition-all duration-300 ease-in-out overflow-hidden`}>
              <p className={!isExpanded ? 'line-clamp-3' : ''}>
                {trip.details || 'No details provided for this trip.'}
              </p>
            </div>
            {needsExpansion && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="text-pink-400 text-sm font-semibold mt-1 hover:text-pink-300">
                {isExpanded ? 'Show Less' : 'Read More'}
              </button>
            )}
        </div>

        {trip.latitude && trip.longitude && (
            <div className="mb-4">
                <a
                  href={`https://maps.google.com/?q=${trip.latitude},${trip.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-1 text-sm text-purple-300 hover:text-purple-200 font-semibold"
                >
                  <MapPin size={14} /> View on Map
                </a>
            </div>
        )}

        <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800 my-4">
            <div className="flex items-center gap-2">
                <IndianRupee size={20} className="text-green-400"/>
                <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Fare</p>
                    <p className="text-xl font-bold text-white">
                        {trip.fare.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Users size={20} className="text-blue-400"/>
                <div className="text-right">
                    <p className="text-xs text-zinc-400 uppercase tracking-wider">Slots Left</p>
                    <p className="text-xl font-bold text-white">
                        {trip.slots}
                    </p>
                </div>
            </div>
        </div>
        
        <div className="mt-auto pt-4">
            <MotionButton 
                whileTap={{ scale: 0.95 }}
                onClick={() => onBook(trip)}
                disabled={!canBook || trip.slots === 0 || isBooking}
                className={`w-full px-4 py-3 rounded-lg font-semibold text-base transition-all flex items-center justify-center gap-2 ${canBook ? `bg-gradient-to-r ${PREMIUM_GRADIENT} text-white hover:opacity-90` : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'} disabled:opacity-50`}
            >
                {isBooking ? <LoadingSpinner className="h-6 w-6" /> : (
                    <>
                        {!canBook && <Lock size={16} />}
                        {trip.slots === 0 ? 'Fully Booked' : canBook ? 'Book Your Spot' : isPremium ? 'Premium Membership Required' : 'Booking Limit Reached'}
                    </>
                )}
            </MotionButton>
        </div>
      </div>
    </MotionDiv>
  );
});

const BookingCard: React.FC<{ booking: TripBooking; onCancel: (id: number) => void; isCancelling: boolean; }> = React.memo(({ booking, onCancel, isCancelling }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-zinc-400 bg-zinc-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} />;
      case 'cancelled': return <X size={16} />;
      case 'pending': return <Clock size={16} />;
      default: return null;
    }
  };

  if (!booking.trip) return null;

  return (
    <MotionDiv
        whileHover={{ y: -2, boxShadow: "0px 10px 30px rgba(236, 72, 153, 0.1)" }}
        className="bg-zinc-900/60 backdrop-blur-lg border border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-lg"
    >
      <div className="relative">
        <img src={booking.trip.image_url || '/images/logo.png'} alt={booking.trip.location} loading="lazy" className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${getStatusColor(booking.status)}`}>
            {getStatusIcon(booking.status)}
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>
        <div className="absolute bottom-0 p-4 w-full">
          <h3 className="font-bold text-2xl text-white shadow-black [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">{booking.trip.location}</h3>
          <p className="text-sm text-zinc-200 shadow-black [text-shadow:_0_1px_3px_rgb(0_0_0_/_40%)]">{booking.trip.date}</p>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col bg-transparent">
        <div className="mb-4">
          <h4 className="font-semibold text-zinc-300 flex items-center gap-2"><Info size={16} className="text-pink-400"/> Trip Details</h4>
          <p className="text-sm text-zinc-400 mt-2">
            {booking.trip.details || 'No details provided for this trip.'}
          </p>
        </div>

        <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-lg border border-zinc-800 my-4">
          <div className="flex items-center gap-2">
            <IndianRupee size={20} className="text-green-400"/>
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Fare</p>
              <p className="text-xl font-bold text-white">
                {booking.trip.fare?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Booked on</p>
            <p className="text-sm font-bold text-white">
              {new Date(booking.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {booking.status === 'confirmed' && (
          <div className="mt-auto pt-4">
            <MotionButton
              whileTap={{ scale: 0.95 }}
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
              className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCancelling ? <LoadingSpinner className="h-6 w-6" /> : (
                <>
                  <X size={16} />
                  Cancel Booking
                </>
              )}
            </MotionButton>
          </div>
        )}
      </div>
    </MotionDiv>
  );
});


const TripsScreen: React.FC = () => {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [bookings, setBookings] = React.useState<TripBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [bookingsLoading, setBookingsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bookingId, setBookingId] = React.useState<string | null>(null);
  const [cancellingId, setCancellingId] = React.useState<number | null>(null);
  const [activeTab, setActiveTab] = React.useState<'available' | 'bookings'>('available');
  const [showBookModal, setShowBookModal] = React.useState<Trip | null>(null);
  const { user } = useUser();
  const { showNotification } = useNotification();

  const loadTrips = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const fetchedTrips = await fetchTrips();
        setTrips(fetchedTrips);
    } catch(err) {
        console.error("Failed to fetch trips", err);
        setError("Could not load getaways. Please check your connection and try again.");
    } finally {
        setLoading(false);
    }
  }, []);

  const loadBookings = React.useCallback(async () => {
    if (!user) return;
    setBookingsLoading(true);
    try {
        const fetchedBookings = await fetchUserTripBookings(user.id);
        setBookings(fetchedBookings);
    } catch(err) {
        console.error("Failed to fetch bookings", err);
    } finally {
        setBookingsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadTrips();
    if (user) {
      loadBookings();
    }

    const tripsChannel = supabase.channel('trips-realtime-channel')
      .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips'
        },
        (payload: any) => {
          const updatedTrip = payload.new;
          if (updatedTrip && 'id' in updatedTrip && 'current_participants' in updatedTrip && 'max_participants' in updatedTrip) {
            const slots = (updatedTrip.max_participants || 0) - updatedTrip.current_participants;
            setTrips(currentTrips =>
              currentTrips.map(trip =>
                trip.id === updatedTrip.id ? { ...trip, slots } : trip
              )
            );
          }
        }
      )
      .subscribe();

    const bookingsChannel = supabase.channel('bookings-realtime-channel')
      .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'trip_bookings',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        () => {
          if (user) {
            loadBookings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, [loadTrips, loadBookings, user]);

  const handleBookTrip = (trip: Trip) => {
    if (!user) return showNotification("You must be logged in to book a trip.", "error");

    // Check free user limit
    if (user.membership !== MembershipType.Premium) {
      const activeBookings = bookings.filter(b => b.status === 'confirmed');
      if (activeBookings.length >= 1) {
        return showNotification("Free users can only book 1 trip. Upgrade to Premium for unlimited bookings.", "error");
      }
    }

    setShowBookModal(trip);
  };

  const confirmBookTrip = async () => {
    if (!showBookModal || !user) return;
    setBookingId(showBookModal.id);
    try {
        await bookTrip(showBookModal.id, user.id);
        showNotification("Trip booked successfully!", "success");
        setShowBookModal(null);
        // UI will update automatically via the real-time subscription
    } catch (error: any) {
        showNotification(error.message || "Failed to book trip.", "error");
        console.error(error);
    } finally {
        setBookingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
        await cancelTripBooking(bookingId);
        showNotification("Booking cancelled successfully.", "success");
    } catch (error: any) {
        showNotification(error.message || "Failed to cancel booking.", "error");
        console.error(error);
    } finally {
        setCancellingId(null);
    }
  };

  const renderContent = () => {
    if (loading) {
        return <GridSkeleton cardType="trip" />;
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 mt-16 text-zinc-500">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300">Something went wrong</h3>
                <p className="mt-2 max-w-xs">{error}</p>
                <button onClick={loadTrips} className="mt-6 px-6 py-2 bg-pink-600 rounded-lg font-semibold hover:bg-pink-700 transition-colors text-white">
                    Retry
                </button>
            </div>
        );
    }

    return (
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'available' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            Available Trips
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'bookings' ? 'text-pink-400 border-b-2 border-pink-400' : 'text-zinc-400 hover:text-zinc-300'}`}
          >
            My Bookings ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
        </div>

        {activeTab === 'available' ? (
          <div className="space-y-6">
            {trips.map(trip => <TripCard key={trip.id} trip={trip} onBook={handleBookTrip} isBooking={bookingId === trip.id} activeBookingsCount={bookings.filter(b => b.status === 'confirmed').length} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {bookingsLoading ? (
              <GridSkeleton cardType="trip" />
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-8 mt-16 text-zinc-500">
                <MapPin size={48} className="text-zinc-600 mb-4" />
                <h3 className="text-xl font-bold text-zinc-300">No bookings yet</h3>
                <p className="mt-2 max-w-xs">Book your first trip to get started!</p>
              </div>
            ) : (
              bookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                  isCancelling={cancellingId === booking.id}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div className="p-4 md:p-6">
        {renderContent()}
      </div>
      <ScrollToTopButton />
      {showBookModal && (
        <BookTripModal
          trip={showBookModal}
          onClose={() => setShowBookModal(null)}
          onSuccess={() => {
            setShowBookModal(null);
            loadBookings();
          }}
        />
      )}
    </div>
  );
};

export default TripsScreen;
