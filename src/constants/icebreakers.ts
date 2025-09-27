// Predefined icebreaker templates for conversations
// These are categorized and can be randomly selected based on context

export const ICEBREAKER_TEMPLATES = {
    general: [
        "Hey! How's your day going?",
        "Hi there! What's been the highlight of your week?",
        "Hey! What are you up to this weekend?",
        "Hello! What's something that made you smile today?",
        "Hi! What's your favorite way to unwind after a long day?",
        "Hey there! Coffee or tea person?",
        "Hi! Early bird or night owl?",
        "Hello! What's the last show you binge-watched?",
        "Hey! If you could travel anywhere right now, where would it be?",
        "Hi! What's your go-to comfort food?"
    ],
    
    interests_based: [
        "I noticed you're into {interest}! How did you get started with that?",
        "Your profile mentions {interest} - that's awesome! What do you love most about it?",
        "{interest} caught my eye on your profile! Any recommendations for a beginner?",
        "Fellow {interest} enthusiast here! What's your favorite thing about it?",
        "I see you like {interest}! What got you hooked?"
    ],
    
    college_based: [
        "How's {college} treating you this semester?",
        "What's your favorite spot on campus at {college}?",
        "How do you like the food at {college}? Any hidden gems?",
        "What made you choose {college}?",
        "What's the best thing about studying at {college}?"
    ],
    
    course_based: [
        "How's {course} going for you? I've heard it can be pretty intense!",
        "{course} sounds interesting! What's your favorite part about it?",
        "What made you choose {course}? I'm always curious about different fields!",
        "How are you finding {course}? Any tips for someone considering it?",
        "What's the most surprising thing you've learned in {course}?"
    ],
    
    fun_creative: [
        "If you could have dinner with any three people, dead or alive, who would they be?",
        "What's your most controversial food opinion? 🍕",
        "If you were a superhero, what would your superpower be?",
        "Pineapple on pizza - yes or no? This is important! 🍍",
        "What's your go-to karaoke song? 🎤",
        "If you could only eat one cuisine for the rest of your life, what would it be?",
        "Mountains or beaches for vacation?",
        "What's a skill you'd love to learn but haven't yet?",
        "If you could live in any era, which would you choose?",
        "What's your most used emoji? Mine's probably 😂"
    ],
    
    compliment_based: [
        "Your smile in that photo is contagious! What were you thinking about?",
        "You have great taste in music! What's been on repeat lately?",
        "Your bio made me laugh! Do you write often?",
        "You seem really adventurous! What's your next adventure?",
        "Your energy seems amazing! What keeps you motivated?"
    ],
    
    prompt_based: [
        "I saw your answer about {prompt} - I totally relate! Tell me more?",
        "Your response to {prompt} was interesting! What made you think of that?",
        "{prompt} - loved your take on this! How did you come up with that?",
        "Your answer about {prompt} caught my attention! Any story behind it?",
        "I'm curious about your {prompt} answer - sounds like there's more to it!"
    ]
};

export function generateCustomIcebreakers(profile: {
    name: string;
    college?: string;
    course?: string;
    tags: string[];
    prompts?: Array<{ question: string; answer: string }>;
}): string[] {
    const icebreakers: string[] = [];
    
    // Add a general icebreaker
    const generalIndex = Math.floor(Math.random() * ICEBREAKER_TEMPLATES.general.length);
    icebreakers.push(ICEBREAKER_TEMPLATES.general[generalIndex]);
    
    // Add an interest-based icebreaker if tags exist
    if (profile.tags && profile.tags.length > 0) {
        const randomTag = profile.tags[Math.floor(Math.random() * profile.tags.length)];
        const interestTemplate = ICEBREAKER_TEMPLATES.interests_based[
            Math.floor(Math.random() * ICEBREAKER_TEMPLATES.interests_based.length)
        ];
        icebreakers.push(interestTemplate.replace(/{interest}/g, randomTag));
    } else {
        // Add a fun/creative one instead
        const funIndex = Math.floor(Math.random() * ICEBREAKER_TEMPLATES.fun_creative.length);
        icebreakers.push(ICEBREAKER_TEMPLATES.fun_creative[funIndex]);
    }
    
    // Add a college or course based icebreaker if available
    if (profile.college) {
        const collegeTemplate = ICEBREAKER_TEMPLATES.college_based[
            Math.floor(Math.random() * ICEBREAKER_TEMPLATES.college_based.length)
        ];
        icebreakers.push(collegeTemplate.replace(/{college}/g, profile.college));
    } else if (profile.course) {
        const courseTemplate = ICEBREAKER_TEMPLATES.course_based[
            Math.floor(Math.random() * ICEBREAKER_TEMPLATES.course_based.length)
        ];
        icebreakers.push(courseTemplate.replace(/{course}/g, profile.course));
    } else {
        // Add a compliment-based one
        const complimentIndex = Math.floor(Math.random() * ICEBREAKER_TEMPLATES.compliment_based.length);
        icebreakers.push(ICEBREAKER_TEMPLATES.compliment_based[complimentIndex]);
    }
    
    // Ensure we return exactly 3 unique icebreakers
    while (icebreakers.length < 3) {
        const funIndex = Math.floor(Math.random() * ICEBREAKER_TEMPLATES.fun_creative.length);
        const newIcebreaker = ICEBREAKER_TEMPLATES.fun_creative[funIndex];
        if (!icebreakers.includes(newIcebreaker)) {
            icebreakers.push(newIcebreaker);
        }
    }
    
    return icebreakers.slice(0, 3);
}
