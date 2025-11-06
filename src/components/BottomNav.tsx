

import * as React from 'react';
import { motion } from 'framer-motion';
import { Screen } from '../types/types.ts';
import { NAV_ITEMS } from '../constants/constants.ts';

// Fix for framer-motion type errors
const MotionButton: any = motion.button;
const MotionDiv: any = motion.div;

interface BottomNavProps {
  activeScreen: Screen;
  setActiveScreen: (screen: Screen) => void;
}

interface NavItemProps {
    item: typeof NAV_ITEMS[0];
    isActive: boolean;
    onClick: () => void;
}

function NavItem({ item, isActive, onClick }: NavItemProps) {
    const IconComponent = item.icon;
    return (
      <MotionButton
        onClick={onClick}
        className={`flex flex-col md:flex-row items-center justify-center md:justify-start w-full md:w-auto md:px-4 md:py-3 transition-all duration-300 ease-in-out group relative rounded-lg ${isActive ? 'md:bg-zinc-800 text-white md:shadow-lg md:shadow-pink-500/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50 hover:scale-105'}`}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <MotionDiv
            className={`relative transition-all duration-300 ${isActive ? 'text-pink-400 [text-shadow:_0_0_10px_theme(colors.pink.400)]' : 'text-zinc-400 group-hover:text-white'}`}
            animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
        >
            <IconComponent className="w-7 h-7" />
        </MotionDiv>
        <span className={`text-xs md:text-base mt-1 md:mt-0 md:ml-4 font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'}`}>
          {item.label}
        </span>
        {isActive && (
            <MotionDiv
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-pink-400 rounded-full md:hidden"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
            />
        )}
      </MotionButton>
    );
}

function BottomNav({ activeScreen, setActiveScreen }: BottomNavProps) {
  return (
    <>
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-zinc-950/70 backdrop-blur-lg border-t border-zinc-800 shadow-lg-top">
          <div className="flex justify-around items-center h-20 pt-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeScreen === item.screen;
              return <NavItem key={item.screen} item={item} isActive={isActive} onClick={() => setActiveScreen(item.screen)} />;
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black/30 backdrop-blur-xl p-6 border-r border-zinc-800">
        <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">College</span><span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-violet-400">Crush</span>
        </h1>
        <nav className="mt-12 flex flex-col space-y-2">
            {NAV_ITEMS.map((item) => {
                const isActive = activeScreen === item.screen;
                return <NavItem key={item.screen} item={item} isActive={isActive} onClick={() => setActiveScreen(item.screen)} />;
            })}
        </nav>
      </aside>
    </>
  );
}

export default BottomNav;
