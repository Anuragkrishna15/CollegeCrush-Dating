
import * as React from 'react';
import { updateProfile, uploadProfilePicture } from '../../services/api.ts';
import { ProfileOnboardingData, Prompt } from '../../types/types.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { PREMIUM_GRADIENT } from '../../constants/constants.ts';
import { useUser } from '../../hooks/useUser.ts';
import { useNotification } from '../../hooks/useNotification.ts';
import { Camera, X, GripVertical, Plus, Edit3 } from 'lucide-react';
import { getOptimizedUrl } from '../../utils/date.ts';
import type { Database } from '../../services/database.types.ts';
import { motion } from 'framer-motion';
import { Json } from '../../services/database.types.ts';

// Fix for framer-motion type errors
const MotionButton: any = motion.button;

interface EditProfileScreenProps {
  onProfileUpdate: () => void;
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


const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onProfileUpdate }) => {
  const { user } = useUser();
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = React.useState<Omit<ProfileOnboardingData, 'tags' | 'prompts'>>({
    name: '',
    dob: '',
    gender: 'Male',
    bio: '',
    course: ''
  });
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [pictures, setPictures] = React.useState<string[]>([]);
  const [prompts, setPrompts] = React.useState<(Prompt | null)[]>([null, null, null]);
  const [newPicFile, setNewPicFile] = React.useState<File | null>(null);
  const [newPicPreview, setNewPicPreview] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // For Drag and Drop
  const dragItem = React.useRef<number | null>(null);
  const dragOverItem = React.useRef<number | null>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        dob: user.dob,
        gender: user.gender,
        bio: user.bio,
        course: user.course,
      });
      setSelectedTags(user.tags);
      setPictures(user.profilePics || []);
      
      // Ensure there are always 3 slots for prompts, filling with existing or null
      const userPrompts = user.prompts || [];
      const displayPrompts = Array(3).fill(null).map((_, i) => userPrompts[i] || null);
      setPrompts(displayPrompts);

    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const handlePromptChange = (index: number, prompt: Prompt | null) => {
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
       showNotification("Profile picture must be less than 5MB.", "error");
       return;
     }
     if (!file.type.startsWith('image/')) {
       showNotification("Please select a valid image file.", "error");
       return;
     }
     setNewPicFile(file);
     setNewPicPreview(URL.createObjectURL(file));
   }
 };
  
  const handleRemovePicture = (indexToRemove: number) => {
      if (pictures.length <= 1) {
          showNotification("You must have at least one picture.", "error");
          return;
      }
      setPictures(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _pictures = [...pictures];
    const draggedItemContent = _pictures.splice(dragItem.current, 1)[0];
    _pictures.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setPictures(_pictures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.name || !formData.dob || !formData.bio || !formData.course) {
        setError("Please fill out all fields.");
        return;
    }
    if (selectedTags.length < 3) {
        setError("Please select at least 3 tags.");
        return;
    }
    const filledPrompts = prompts.filter(p => p && p.answer.trim());
    if(filledPrompts.length < 3) {
        setError("Please complete all 3 prompts.");
        return;
    }


    setLoading(true);
    setError(null);

    try {
        let finalPictures = [...pictures];
        if (newPicFile) {
            const newUrl = await uploadProfilePicture(user.id, newPicFile);
            finalPictures.unshift(newUrl); // Add new picture to the front
            setNewPicFile(null);
            setNewPicPreview(null);
        }

        const updatePayload: Partial<Database['public']['Tables']['profiles']['Update']> = {
          ...formData,
          tags: selectedTags,
          profilePics: finalPictures,
          prompts: prompts.filter(p => p !== null) as unknown as Json,
        };
        
        await updateProfile(user.id, updatePayload);
        showNotification('Profile updated successfully!', 'success');
        onProfileUpdate();
    } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  if (!user) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner/></div>
  }

  return (
    <div className="relative h-full">
      <div className="p-4 md:p-6 pb-28">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Your Photos</label>
            <div className="grid grid-cols-3 gap-2">
                {pictures.map((pic, index) => (
                    <div 
                        key={pic} 
                        className={`relative group aspect-square bg-zinc-800 rounded-lg cursor-grab transition-opacity ${draggedIndex === index ? 'opacity-50' : 'opacity-100'}`}
                        draggable
                        onDragStart={() => {
                            dragItem.current = index;
                            setDraggedIndex(index);
                        }}
                        onDragEnter={() => dragOverItem.current = index}
                        onDragEnd={() => {
                            handleSort();
                            setDraggedIndex(null);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <img src={getOptimizedUrl(pic, {width: 150, height: 150})} className="w-full h-full object-cover rounded-lg" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <button type="button" onClick={() => handleRemovePicture(index)} className="absolute top-1 right-1 p-0.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100">
                            <X size={14} />
                        </button>
                         {index === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs bg-black/60 text-white rounded">Main</span>}
                        <GripVertical size={16} className="absolute top-1/2 left-1 -translate-y-1/2 text-white/50 opacity-0 group-hover:opacity-100" />
                    </div>
                ))}
                 <label htmlFor="profile-pic" className="relative cursor-pointer group aspect-square flex items-center justify-center bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg">
                     {newPicPreview ? (
                        <img src={newPicPreview} alt="New pic preview" className="w-full h-full object-cover rounded-lg" />
                     ) : (
                        <Camera size={32} className="text-zinc-500" />
                     )}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs text-center p-1 opacity-0 group-hover:opacity-100">
                         Add New
                     </div>
                </label>
                <input id="profile-pic" name="profile-pic" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-xs text-zinc-500 mt-2">Drag and drop to reorder photos. The first photo is your main profile picture.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Your Prompts</label>
            <div className="space-y-4">
                {[0, 1, 2].map(index => (
                    <PromptEditor 
                        key={index} 
                        prompt={prompts[index]} 
                        onChange={(p) => handlePromptChange(index, p)}
                        usedQuestions={prompts.map(p => p?.question).filter(Boolean) as string[]}
                    />
                ))}
            </div>
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
            <MotionButton 
              whileTap={{ scale: 0.95 }}
              type="submit" disabled={loading}
              className={`w-full mt-4 py-3 rounded-lg font-semibold text-white bg-gradient-to-r ${PREMIUM_GRADIENT} hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center`}>
              {loading ? <LoadingSpinner /> : 'Save Changes'}
            </MotionButton>
          </div>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
};

const PromptEditor: React.FC<{prompt: Prompt | null, onChange: (prompt: Prompt | null) => void, usedQuestions: string[]}> = ({ prompt, onChange, usedQuestions }) => {
    const [isChoosing, setIsChoosing] = React.useState(false);
    
    const handleQuestionSelect = (question: string) => {
        onChange({ question, answer: prompt?.answer || '' });
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
                 <button type="button" onClick={() => setIsChoosing(false)} className="w-full text-center mt-2 p-1 rounded-lg text-xs text-zinc-500 hover:bg-zinc-800">Cancel</button>
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

export default EditProfileScreen;
