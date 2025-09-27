
import * as React from 'react';
import { createProfile } from '../../services/api.ts';
import { ProfileOnboardingData, Prompt } from '../../types/types.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { supabase } from '../../services/supabase.ts';
import { Camera, Plus, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for framer-motion type errors
const MotionDiv: any = motion.div;
const MotionButton: any = motion.button;

interface OnboardingScreenProps {
  onProfileCreated: () => void;
}

const TAG_OPTIONS = ['Movies', 'Music', 'Sports', 'Gaming', 'Reading', 'Travel', 'Foodie', 'Art', 'Coding', 'Fitness'];
const PROMPT_QUESTIONS = [
    "A random fact I love is...",
    "The key to my heart is...",
    "My simple pleasures are...",
    "Two truths and a lie...",
    "I'm looking for someone who...",
    "My go-to karaoke song is...",
    "A goal I'm working on is...",
    "You should message me if...",
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onProfileCreated }) => {
  const [step, setStep] = React.useState(1);
  const [sessionUser, setSessionUser] = React.useState<any>(null);
  const [formData, setFormData] = React.useState<Omit<ProfileOnboardingData, 'tags' | 'prompts'>>({
    name: '',
    dob: '',
    gender: 'Male',
    bio: '',
    course: ''
  });
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [prompts, setPrompts] = React.useState<(Prompt | null)[]>([null, null, null]);
  const [profilePicFile, setProfilePicFile] = React.useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSessionUser(session?.user);
    });
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const handlePromptChange = (index: number, prompt: Prompt) => {
      setPrompts(prev => {
          const newPrompts = [...prev];
          newPrompts[index] = prompt;
          return newPrompts;
      })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   if (e.target.files && e.target.files[0]) {
     const file = e.target.files[0];
     if (file.size > 5 * 1024 * 1024) { // 5MB limit
       setError("Profile picture must be less than 5MB.");
       return;
     }
     if (!file.type.startsWith('image/')) {
       setError("Please select a valid image file.");
       return;
     }
     setProfilePicFile(file);
     setError(null);
     const reader = new FileReader();
     reader.onloadend = () => {
         setProfilePicPreview(reader.result as string);
     };
     reader.readAsDataURL(file);
   }
 };
  
  const validateStep1 = () => {
    if (!profilePicFile) { setError("Please upload a profile picture."); return false; }
    if (!formData.name || !formData.dob || !formData.bio || !formData.course) { setError("Please fill out all fields."); return false; }
    if (selectedTags.length < 3) { setError("Please select at least 3 tags."); return false; }
    setError(null);
    return true;
  }
  
  const validateStep2 = () => {
      const allFilled = prompts.every(p => p && p.answer.trim());
      if(!allFilled) { setError("Please complete all 3 prompts."); return false; }
      setError(null);
      return true;
  }
  
  const handleNextStep = () => {
      if (validateStep1()) {
          setStep(2);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2() || !sessionUser?.id || !sessionUser?.email || !profilePicFile) return;

    setLoading(true);
    setError(null);

    try {
      const finalPrompts = prompts.filter(p => p !== null) as Prompt[];
      await createProfile(sessionUser.id, sessionUser.email, {...formData, tags: selectedTags, prompts: finalPrompts }, profilePicFile);
      onProfileCreated(); // This will refetch user and switch the screen in App.tsx
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
      setStep(1); // Go back to the first step on error
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
      <MotionDiv initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
        <h1 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT} text-center`}>Create Your Profile</h1>
        <p className="text-zinc-400 mt-2 text-center">Let's get you set up to start connecting.</p>
        <div className="mt-8 space-y-6">
            <div className="flex flex-col items-center">
                <label htmlFor="profile-pic" className="relative cursor-pointer">
                {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Profile preview" className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"/>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                        <Camera size={32} />
                    </div>
                )}
                </label>
                <input id="profile-pic" name="profile-pic" type="file" accept="image/*" required onChange={handleFileChange} className="hidden" />
                <label htmlFor="profile-pic" className="mt-2 text-sm font-medium text-pink-500 cursor-pointer">Upload a Picture</label>
            </div>
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-400">Full Name</label>
                <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} placeholder="Your full name"
                className="mt-1 block w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div className="flex gap-4">
                <div className="flex-1">
                    <label htmlFor="dob" className="block text-sm font-medium text-zinc-400">Date of Birth</label>
                    <input id="dob" name="dob" type="date" required value={formData.dob} onChange={handleInputChange} max={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div className="flex-1">
                    <label htmlFor="gender" className="block text-sm font-medium text-zinc-400">Gender</label>
                    <select id="gender" name="gender" required value={formData.gender} onChange={handleInputChange}
                    className="mt-1 block w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="course" className="block text-sm font-medium text-zinc-400">Your Course</label>
                <input id="course" name="course" type="text" required value={formData.course} onChange={handleInputChange} placeholder="e.g., B.Tech CSE, MBA..."
                className="mt-1 block w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
                <label htmlFor="bio" className="block text-sm font-medium text-zinc-400">Your Bio</label>
                <textarea id="bio" name="bio" rows={3} required value={formData.bio} onChange={handleInputChange} placeholder="Tell us something interesting..."
                className="mt-1 block w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-400">Your Interests (min. 3)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {TAG_OPTIONS.map(tag => (
                        <button type="button" key={tag} onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors border ${selectedTags.includes(tag) ? 'bg-pink-600 border-pink-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
             <div>
                <MotionButton whileTap={{ scale: 0.95 }} type="button" onClick={handleNextStep}
                className={`w-full mt-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity`}>
                    Next
                </MotionButton>
            </div>
        </div>
      </MotionDiv>
  );
  
  const renderStep2 = () => (
      <MotionDiv initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <h1 className={`text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${PREMIUM_GRADIENT} text-center`}>Answer 3 Prompts</h1>
        <p className="text-zinc-400 mt-2 text-center">This helps others get to know you better.</p>
        <div className="mt-8 space-y-4">
            {[0, 1, 2].map(index => (
                <PromptEditor 
                    key={index} 
                    prompt={prompts[index]} 
                    onChange={(p) => handlePromptChange(index, p)}
                    usedQuestions={prompts.map(p => p?.question).filter(Boolean) as string[]}
                />
            ))}
        </div>
        <div className="flex gap-4 mt-6">
            <MotionButton whileTap={{ scale: 0.95 }} type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-lg font-semibold text-white bg-zinc-700 hover:bg-zinc-600 transition-colors">
                Back
            </MotionButton>
             <MotionButton whileTap={{ scale: 0.95 }} type="submit" disabled={loading}
              className={`flex-1 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}>
              {loading ? <LoadingSpinner /> : 'Create Profile'}
            </MotionButton>
        </div>
      </MotionDiv>
  );

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-zinc-950/70 backdrop-blur-lg border border-white/10 p-8 rounded-2xl">
            <AnimatePresence mode="wait">
                {step === 1 ? renderStep1() : renderStep2()}
            </AnimatePresence>
            {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

const PromptEditor: React.FC<{prompt: Prompt | null, onChange: (prompt: Prompt) => void, usedQuestions: string[]}> = ({ prompt, onChange, usedQuestions }) => {
    const [isChoosing, setIsChoosing] = React.useState(false);
    
    const handleQuestionSelect = (question: string) => {
        onChange({ question, answer: '' });
        setIsChoosing(false);
    }
    
    if (isChoosing) {
        return (
            <div className="bg-zinc-900 p-4 rounded-xl">
                <p className="text-sm font-semibold text-zinc-400 mb-2">Choose a prompt</p>
                <div className="space-y-1">
                {PROMPT_QUESTIONS.map(q => {
                    const isUsed = usedQuestions.includes(q) && q !== prompt?.question;
                    return (
                        <button type="button" key={q} onClick={() => handleQuestionSelect(q)} disabled={isUsed}
                            className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${isUsed ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-200 hover:bg-zinc-800'}`}>
                            {q}
                        </button>
                    )
                })}
                </div>
            </div>
        )
    }

    if (!prompt) {
        return (
             <button type="button" onClick={() => setIsChoosing(true)} className="w-full flex items-center justify-center gap-2 p-6 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:border-pink-500 hover:text-white transition-colors">
                <Plus /> Select a prompt
            </button>
        )
    }
    
    return (
        <div className="bg-zinc-900 p-4 rounded-xl">
             <button type="button" onClick={() => setIsChoosing(true)} className="w-full flex justify-between items-center text-left text-sm font-semibold text-zinc-400 mb-2 hover:text-pink-400">
                {prompt.question} <Edit3 size={14} />
            </button>
            <textarea
                value={prompt.answer}
                onChange={e => onChange({ ...prompt, answer: e.target.value })}
                placeholder="Your answer..."
                rows={2}
                required
                className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-base"
            />
        </div>
    )
}

export default OnboardingScreen;
