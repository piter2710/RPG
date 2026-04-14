import React, { useState } from 'react';


export interface BackendGameState {
  id: number;
  current_hp: number;
  max_hp: number;
  current_location: string;
  status_effects: string;
}

export interface BackendStats {
  id: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface BackendInventoryItem {
  item_id: number;
  name: string;
  quantity: number;
  is_equipped: boolean;
  equipment_slot: string;
}

export interface BackendJournalEntry {
  entry_id: number;
  description: string;
  status: string; // active, completed, failed
}

export interface BackendEntity {
  id: number;
  name: string;
  disposition: string; // hostile, neutral, friendly
  current_hp: number;
  max_hp: number;
  base_damage: number;
  difficulty_modifier: number;
}

export interface StoryMessage {
  role: 'user' | 'model';
  content: string;
}

export interface StoryAction {
  id: string;
  title: string;
  description: string;
}

export interface StoryState {
  narration: StoryMessage[];
  actions: StoryAction[];
}

export interface GildedHUDProps {  
  gameState: BackendGameState | null;
  stats: BackendStats | null;
  inventory: BackendInventoryItem[];
  journal: BackendJournalEntry[];
  entities: BackendEntity[];
  story: StoryState;

  // Ready to call functions for the backend
  onActionSelect?: (actionId: string) => void;
  onCommandSubmit?: (command: string) => void;
  onNavClick?: (navTarget: string) => void;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onRefresh?: () => void;
  isProcessing?: boolean;
}

export const GildedHUD: React.FC<GildedHUDProps> = ({
  gameState,
  stats,
  inventory,
  journal,
  entities,
  story,
  onActionSelect,
  onCommandSubmit,
  onNavClick,
  onSettingsClick,
  onNotificationsClick,
  onRefresh,
  isProcessing = false,
}) => {
  const [commandInput, setCommandInput] = useState("");
  const [activeTab, setActiveTab] = useState<'journal' | 'inventory' | 'entities'>('journal');

  const handleCommandSubmit = () => {
    if (commandInput.trim() && onCommandSubmit) {
      onCommandSubmit(commandInput.trim());
      setCommandInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommandSubmit();
    }
  };

  return (
    <div className="bg-background text-on-surface font-body overflow-hidden h-screen flex flex-col dark">
      {/* TopAppBar Component */}
      <header className="bg-[#131313] shadow-[0_20px_40px_-15px_rgba(242,202,80,0.06)] z-50">
          <div className="flex justify-between items-center w-full px-8 py-4">
          <div onClick={() => onNavClick?.('selection')} className="text-2xl font-bold text-[#f2ca50] tracking-widest font-headline uppercase cursor-pointer hover:brightness-110 active:scale-95 transition-all">The Relic Archive</div>
          <nav className="hidden md:flex space-x-8">
            <button onClick={() => setActiveTab('journal')} className={`pb-1 font-headline tracking-tight uppercase text-sm active:scale-95 transition-all outline-none ${activeTab === 'journal' ? 'text-[#f2ca50] border-b-2 border-[#f2ca50]' : 'text-[#c6c6c6] hover:text-[#f2ca50] border-b-2 border-transparent'}`}>Journal</button>
            <button onClick={() => setActiveTab('inventory')} className={`pb-1 font-headline tracking-tight uppercase text-sm active:scale-95 transition-all outline-none ${activeTab === 'inventory' ? 'text-[#f2ca50] border-b-2 border-[#f2ca50]' : 'text-[#c6c6c6] hover:text-[#f2ca50] border-b-2 border-transparent'}`}>Inventory</button>
            <button onClick={() => setActiveTab('entities')} className={`pb-1 font-headline tracking-tight uppercase text-sm active:scale-95 transition-all outline-none ${activeTab === 'entities' ? 'text-[#f2ca50] border-b-2 border-[#f2ca50]' : 'text-[#c6c6c6] hover:text-[#f2ca50] border-b-2 border-transparent'}`}>Entities</button>
          </nav>
        </div>
        <div className="bg-[#20201f] h-[2px] w-full"></div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* SideNavBar / Character Summary */}
        <aside className="fixed left-0 top-[74px] h-[calc(100%-74px)] w-64 bg-[#20201f] border-r border-[#4d4635]/15 pt-8 hidden lg:flex flex-col z-40">
          <div className="px-6 mb-8">
            <div className="w-16 h-16 bg-surface-container-highest mb-4 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">person</span>
            </div>
            {gameState ? (
              <>
                <h2 className="text-xl font-headline text-on-surface">HP: {gameState.current_hp}/{gameState.max_hp}</h2>
                <p className="text-[10px] font-label text-secondary uppercase tracking-widest opacity-70 mt-1">LOC: {gameState.current_location}</p>
                <p className="text-[10px] font-label text-secondary uppercase tracking-widest opacity-70 mt-1">STATUS: {gameState.status_effects}</p>
              </>
            ) : (
              <div className="animate-pulse space-y-2 mt-4">
                <div className="h-5 bg-surface-container rounded w-1/2"></div>
                <div className="h-3 bg-surface-container rounded w-3/4"></div>
                <div className="h-3 bg-surface-container rounded w-full"></div>
              </div>
            )}
          </div>
          <div className="px-6 mb-4">
            {stats ? (
              <div className="grid grid-cols-2 gap-2 text-xs text-on-surface-variant font-label opacity-80 uppercase tracking-widest">
                <div>STR: {stats.strength}</div>
                <div>DEX: {stats.dexterity}</div>
                <div>CON: {stats.constitution}</div>
                <div>INT: {stats.intelligence}</div>
                <div>WIS: {stats.wisdom}</div>
                <div>CHA: {stats.charisma}</div>
              </div>
            ) : (
              <div className="animate-pulse grid grid-cols-2 gap-2 mt-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-3 bg-surface-container rounded w-full"></div>
                ))}
              </div>
            )}
          </div>
          <nav className="flex flex-col space-y-1">
            <button onClick={() => setActiveTab('journal')} className={`py-3 px-6 flex flex-col sm:flex-row items-center space-x-3 transition-all duration-200 text-left w-full border-l-4 outline-none ${activeTab === 'journal' ? 'bg-[#353535] text-[#f2ca50] border-[#f2ca50] opacity-80 scale-[0.99]' : 'text-[#c6c6c6] hover:bg-[#353535]/50 hover:text-[#f2ca50] border-transparent'}`}>
              <span className="material-symbols-outlined text-sm">chat</span>
              <span className="hidden sm:inline text-xs font-label uppercase tracking-tighter">Journal</span>
            </button>
            <button onClick={() => setActiveTab('inventory')} className={`py-3 px-6 flex flex-col sm:flex-row items-center space-x-3 transition-all duration-200 text-left w-full border-l-4 outline-none ${activeTab === 'inventory' ? 'bg-[#353535] text-[#f2ca50] border-[#f2ca50] opacity-80 scale-[0.99]' : 'text-[#c6c6c6] hover:bg-[#353535]/50 hover:text-[#f2ca50] border-transparent'}`}>
              <span className="material-symbols-outlined text-sm">swords</span>
              <span className="text-xs font-label uppercase tracking-tighter">Inventory</span>
            </button>
            <button onClick={() => setActiveTab('entities')} className={`py-3 px-6 flex flex-col sm:flex-row items-center space-x-3 transition-all duration-200 text-left w-full border-l-4 outline-none ${activeTab === 'entities' ? 'bg-[#353535] text-[#f2ca50] border-[#f2ca50] opacity-80 scale-[0.99]' : 'text-[#c6c6c6] hover:bg-[#353535]/50 hover:text-[#f2ca50] border-transparent'}`}>
              <span className="material-symbols-outlined text-sm">visibility</span>
              <span className="text-xs font-label uppercase tracking-tighter">Entities</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <div className="flex-1 flex flex-col lg:pl-64 overflow-hidden">
          <div className="flex h-full flex-col md:flex-row">
            {/* Left Column: Dynamic Content */}
            <section className="flex-1 flex flex-col bg-surface border-r border-outline-variant/10 relative overflow-y-auto">
              {activeTab === 'journal' && (
                <>
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-32 md:pb-8">
                    {/* GM Narration */}
                    <div className="w-full max-w-6xl mx-auto space-y-6">
                      <div className="flex items-center space-x-4 mb-8">
                        <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
                        <span className="text-[10px] font-label text-primary uppercase tracking-[0.3em]">Game Master</span>
                        <div className="h-[1px] flex-1 bg-outline-variant/30"></div>
                      </div>
                      
                      <div className="space-y-6">
                        {story.narration.map((msg, i) => (
                          <div key={i} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-container-highest border-outline-variant/30 text-secondary'}`}>
                              <span className="material-symbols-outlined text-xl">
                                {msg.role === 'user' ? 'person' : 'smart_toy'}
                              </span>
                            </div>
                            <div className={`p-4 rounded-sm prose prose-invert max-w-none prose-newsreader border ${msg.role === 'user' ? 'bg-primary/5 border-primary/20 text-primary/90' : 'bg-surface-container border-outline-variant/10 text-on-surface/80'}`}>
                              <p className={`text-base md:text-[15px] leading-relaxed m-0 whitespace-pre-wrap ${i === 0 && msg.role === 'model' ? 'text-lg md:text-[17px] text-on-surface/90 italic' : ''}`}>
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                        {story.actions.map((act) => (
                          <button 
                            key={act.id} 
                            onClick={() => onActionSelect?.(act.id)} 
                            className="group p-4 bg-surface-container border border-outline-variant/20 hover:border-primary/50 transition-all text-left"
                          >
                            <span className="block text-[10px] font-label text-secondary uppercase mb-1">{act.title}</span>
                            <span className="text-sm font-headline text-on-surface group-hover:text-primary">{act.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* User Input */}
                  <div className="p-4 md:p-6 bg-surface-container-low border-t border-outline-variant/10 hidden md:block z-10 sticky bottom-0">
                    <div className={`w-full max-w-6xl mx-auto flex items-center space-x-4 bg-surface-container-lowest p-1 border ${isProcessing ? 'border-red-500 opacity-50' : 'border-outline-variant/20 focus-within:border-primary/50'} transition-colors`}>
                      <input 
                        value={commandInput} 
                        onChange={e => setCommandInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        disabled={isProcessing}
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface font-body px-4 py-3 placeholder-secondary/50 disabled:cursor-not-allowed" 
                        placeholder={isProcessing ? "Processing..." : "Speak your intention..."} 
                        type="text" 
                      />
                      <button 
                        onClick={handleCommandSubmit} 
                        disabled={isProcessing}
                        className="bg-primary px-6 py-3 text-on-primary font-label uppercase text-[11px] font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Execute
                      </button>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'inventory' && (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <span className="material-symbols-outlined text-primary text-3xl">swords</span>
                      <h2 className="text-2xl font-headline text-on-surface uppercase tracking-widest">Inventory</h2>
                    </div>
                    <button 
                      onClick={onRefresh}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-4 py-2 bg-surface-container hover:bg-surface-container-highest border border-outline-variant/30 text-secondary transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      <span className="text-[10px] uppercase font-label tracking-widest">Refresh Sync</span>
                    </button>
                  </div>

                  <div className="space-y-12">
                    {/* Slots 1-10 */}
                    <div>
                      <h3 className="text-xs font-label uppercase tracking-[0.2em] text-primary mb-4 border-b border-primary/20 pb-2">Active Equipment (Slots 1-10)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const item = inventory[i];
                          return item ? (
                            <div key={`slot-${i}`} className="p-4 bg-surface-container border border-primary/30 min-h-[140px] flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] text-secondary font-label mb-2 block">Slot {i + 1}</span>
                                <h4 className="text-sm font-headline text-on-surface leading-tight mb-2">{item.name}</h4>
                                <p className="text-[10px] font-body text-on-surface-variant">Qty: {item.quantity}</p>
                              </div>
                              {item.is_equipped && (
                                <span className="text-[9px] font-label text-primary uppercase tracking-widest mt-2 block opacity-90">
                                  {item.equipment_slot || 'Equipped'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div key={`slot-${i}`} className="p-4 bg-surface-container-lowest border border-outline-variant/10 min-h-[140px] flex items-center justify-center opacity-30">
                              <span className="text-[10px] font-label text-secondary uppercase tracking-widest">Slot {i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slots 11-20 */}
                    <div>
                      <h3 className="text-xs font-label uppercase tracking-[0.2em] text-secondary mb-4 border-b border-outline-variant/20 pb-2">Backpack (Slots 11-20)</h3>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => {
                          const item = inventory[10 + i];
                          const slotNum = 11 + i;
                          return item ? (
                            <div key={`slot-${slotNum}`} className="p-4 bg-surface-container border border-outline-variant/30 min-h-[140px] flex flex-col justify-between">
                              <div>
                                <span className="text-[10px] text-secondary font-label mb-2 block">Slot {slotNum}</span>
                                <h4 className="text-sm font-headline text-on-surface leading-tight mb-2">{item.name}</h4>
                                <p className="text-[10px] font-body text-on-surface-variant">Qty: {item.quantity}</p>
                              </div>
                              {item.is_equipped && (
                                <span className="text-[9px] font-label text-primary uppercase tracking-widest mt-2 block opacity-90">
                                  {item.equipment_slot || 'Equipped'}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div key={`slot-${slotNum}`} className="p-4 bg-surface-container-lowest border border-outline-variant/10 min-h-[140px] flex items-center justify-center opacity-30">
                              <span className="text-[10px] font-label text-secondary uppercase tracking-widest">Slot {slotNum}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'entities' && (
                <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <span className="material-symbols-outlined text-primary text-3xl">visibility</span>
                      <h2 className="text-2xl font-headline text-on-surface uppercase tracking-widest">Entities</h2>
                    </div>
                    <button 
                      onClick={onRefresh}
                      disabled={isProcessing}
                      className="flex items-center space-x-2 px-4 py-2 bg-surface-container hover:bg-surface-container-highest border border-outline-variant/30 text-secondary transition-all active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      <span className="text-[10px] uppercase font-label tracking-widest">Refresh Sync</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {entities.map((entity) => (
                      <div key={entity.id} className="p-5 bg-surface-container border border-outline-variant/20 hover:border-primary/30 transition-colors flex space-x-4">
                        <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center shrink-0 border border-primary/20">
                          <span className="material-symbols-outlined text-primary text-2xl">pest_control</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-headline text-on-surface mb-1">{entity.name}</h3>
                          <p className="text-xs font-body text-on-surface-variant mb-2">Disposition: <span className="uppercase text-primary">{entity.disposition}</span></p>
                          <span className="text-[10px] font-label text-secondary uppercase tracking-widest">HP: {entity.current_hp}/{entity.max_hp} | DMG: {entity.base_damage}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Right Column: Player HUD */}
            <section className="w-full lg:w-[320px] 2xl:w-[380px] bg-surface-container-low flex flex-col overflow-y-auto border-l border-outline-variant/5 pb-20 md:pb-0 shrink-0">
              {/* Progress Bars Section */}
              <div className="p-6 space-y-4">
                <h3 className="text-xs font-label uppercase tracking-widest text-secondary mb-4">Vitality & Essence</h3>
                
                {/* Health */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-label uppercase">
                    <span className="text-error">Health</span>
                    <span className="text-on-surface">{gameState?.current_hp ?? 0} / {gameState?.max_hp ?? 0}</span>
                  </div>
                  <div className="h-2 bg-surface-container-lowest overflow-hidden">
                    <div className="h-full bg-error-container transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, ((gameState?.current_hp ?? 0) / Math.max(1, gameState?.max_hp ?? 1)) * 100))}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="px-6 py-4 bg-surface-container-high/30 border-y border-outline-variant/5">
                <h3 className="text-xs font-label uppercase tracking-widest text-secondary mb-4">Core Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-primary/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Strength</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.strength ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-tertiary/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Dexterity</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.dexterity ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-secondary/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Constitution</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.constitution ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-primary-fixed/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Intelligence</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.intelligence ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-primary-fixed/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Wisdom</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.wisdom ?? 0}</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 border-l-2 border-primary-fixed/40">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[9px] font-label uppercase tracking-tighter text-secondary">Charisma</span>
                    </div>
                    <div className="text-lg font-headline text-on-surface">{stats?.charisma ?? 0}</div>
                  </div>
                </div>
              </div>

              {/* Journal */}
              <div className="p-6 border-b border-outline-variant/10 flex-1">
                <h3 className="text-xs font-label uppercase tracking-widest text-secondary mb-4">Quest Journal</h3>
                <div className="space-y-4">
                  {journal.map((entry, i) => (
                    <div key={i} className={`bg-surface-container-lowest p-4 border border-outline-variant/15 ${entry.status === 'completed' ? 'opacity-50' : ''}`}>
                      <p className="font-body text-sm leading-snug text-on-surface mb-2">{entry.description}</p>
                      <span className="text-[10px] font-label uppercase text-primary">{entry.status}</span>
                    </div>
                  ))}
                  {journal.length === 0 && (
                    <div className="text-secondary/50 text-xs font-label uppercase tracking-widest italic p-4 text-center border border-dashed border-outline-variant/20">
                      No active quests
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile User Input (Sticky bottom chat bar) */}
      {activeTab === 'journal' && (
        <div className="md:hidden fixed bottom-[60px] left-0 w-full p-3 bg-surface-container border-t border-outline-variant/10 z-40">
          <div className="flex items-center space-x-2 bg-surface-container-lowest p-1 border border-outline-variant/20 focus-within:border-primary/50">
            <input 
              value={commandInput} 
              onChange={e => setCommandInput(e.target.value)} 
              onKeyDown={handleKeyDown} 
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-on-surface font-body px-3 py-2 text-sm placeholder-secondary/50" 
              placeholder="Action..." 
              type="text" 
            />
            <button 
              onClick={handleCommandSubmit} 
              className="bg-primary px-3 py-2 text-on-primary font-label uppercase text-[10px] font-bold tracking-widest active:scale-95 transition-all"
            >
              Go
            </button>
          </div>
        </div>
      )}

      {/* Mobile Nav Anchor */}
      <nav className="md:hidden fixed justify-around py-3 z-50 bottom-0 left-0 right-0 bg-surface-container border-t border-outline-variant/10 flex text-xs">
        <button onClick={() => setActiveTab('journal')} className={`flex flex-col items-center space-y-1 active:scale-95 transition-transform ${activeTab === 'journal' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
          <span className="material-symbols-outlined text-lg">chat</span>
          <span className="text-[9px] font-label uppercase">Story</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center space-y-1 active:scale-95 transition-transform ${activeTab === 'inventory' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
          <span className="material-symbols-outlined text-lg">swords</span>
          <span className="text-[9px] font-label uppercase">Inventory</span>
        </button>
        <button onClick={() => setActiveTab('entities')} className={`flex flex-col items-center space-y-1 active:scale-95 transition-transform ${activeTab === 'entities' ? 'text-primary' : 'text-secondary hover:text-primary'}`}>
          <span className="material-symbols-outlined text-lg">visibility</span>
          <span className="text-[9px] font-label uppercase">Entities</span>
        </button>
      </nav>
    </div>
  );
};
