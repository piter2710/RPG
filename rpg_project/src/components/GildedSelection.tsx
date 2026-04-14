import React from 'react';

export interface RealityData {
  id: string;
  title: string;
  description: string;
  buttonLabel: string;
  themeColor: 'primary' | 'secondary' | 'tertiary';
}

export interface GildedSelectionProps {
  realities: [RealityData, RealityData, RealityData]; // Enforce exactly 3 cards
  onSelectReality?: (realityId: string) => void;
  onNavClick?: (navTarget: string) => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
}

export const GildedSelection: React.FC<GildedSelectionProps> = ({
  realities,
  onSelectReality,
  onNavClick,
  onSettingsClick,
  onNotificationsClick,
}) => {
  
  // Helper to resolve specific color classes based on themeColor prop
  const getThemeClasses = (themeColor: string) => {
    switch (themeColor) {
      case 'primary':
        return {
          text: 'text-primary',
          bg: 'bg-primary',
          buttonHover: 'active:scale-95 transition-transform hover:brightness-110 gilded-gradient text-on-primary-container',
          line: 'bg-primary',
          borderHover: 'hover:border-primary/50'
        };
      case 'secondary':
        return {
          text: 'text-secondary',
          bg: 'bg-secondary',
          buttonHover: 'active:scale-95 transition-all border border-outline-variant/30 text-secondary hover:bg-surface-container-highest',
          line: 'bg-secondary',
          borderHover: 'hover:border-secondary/50'
        };
      case 'tertiary':
      default:
        return {
          text: 'text-tertiary',
          bg: 'bg-tertiary',
          buttonHover: 'active:scale-95 transition-all bg-surface-container-highest text-tertiary hover:bg-tertiary hover:text-on-tertiary',
          line: 'bg-tertiary',
          borderHover: 'hover:border-tertiary/50'
        };
    }
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col selection:bg-primary/30 dark">
      {/* Top Navigation Anchor */}
      <header className="bg-[#131313] shadow-[0_20px_40px_-15px_rgba(242,202,80,0.06)] flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50">
        <div className="text-2xl font-bold text-[#f2ca50] tracking-widest font-headline uppercase">The Relic Archive</div>
        <nav className="hidden md:flex items-center space-x-8 font-headline tracking-tight uppercase text-sm">
          <button onClick={() => onNavClick?.('journal')} className="text-[#f2ca50] border-b-2 border-[#f2ca50] pb-1 cursor-pointer active:scale-95 transition-all pb-1">Journal</button>
          <button onClick={() => onNavClick?.('lore')} className="text-[#c6c6c6] hover:text-[#f2ca50] cursor-pointer active:scale-95 transition-all border-b-2 border-transparent pb-1">Lore</button>
        </nav>
      </header>

      {/* Separation Element */}
      <div className="fixed top-[72px] left-0 bg-[#20201f] h-[2px] w-full z-40"></div>


      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-6 pt-32 pb-24 w-full">
        {/* Page Title */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-headline font-light tracking-tight text-on-surface mb-16 text-center">
            Choose Your Reality
        </h1>
        
        {/* Reality Path Selection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {realities.map((reality) => {
            const classes = getThemeClasses(reality.themeColor);
            
            return (
              <div key={reality.id} className={`bg-surface-container-low group relative border border-outline-variant/15 transition-all duration-500 hover:translate-y-[-8px] flex flex-col ${classes.borderHover}`}>
                <div className="p-6 md:p-8 flex flex-col flex-grow">
                  <h3 className={`text-2xl font-headline ${classes.text} mb-2`}>{reality.title}</h3>
                  <div className={`h-px w-8 ${classes.line} mb-6`}></div>
                  <p className="text-on-surface-variant font-body italic mb-8 min-h-[4rem] flex-grow">{reality.description}</p>
                  <button 
                    onClick={() => onSelectReality?.(reality.id)} 
                    className={`${classes.buttonHover} font-label uppercase text-xs tracking-widest font-bold py-4 px-6 w-full md:w-auto`}
                  >
                    {reality.buttonLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Narrative Decorative Element */}
        <div className="mt-20 flex flex-col items-center">
          <div className="flex items-center space-x-10">
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent to-outline-variant/30"></div>
            <div className="w-2 h-2 bg-primary rotate-45"></div>
            <div className="h-[1px] w-24 bg-gradient-to-l from-transparent to-outline-variant/30"></div>
          </div>
          <p className="mt-6 font-label text-[10px] tracking-[0.4em] uppercase text-outline/60 text-center">Destiny Awaits the Brave</p>
        </div>
      </main>

    </div>
  );
};
