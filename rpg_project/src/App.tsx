import { useState, useEffect } from 'react'
import { GildedHUD, type BackendGameState, type BackendStats, type BackendInventoryItem, type BackendJournalEntry, type BackendEntity, type StoryState } from './components/GildedHUD'
import { GildedSelection, type RealityData } from './components/GildedSelection'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'selection' | 'hud'>('selection')

  const [gameState, setGameState] = useState<BackendGameState | null>(null);
  const [stats, setStats] = useState<BackendStats | null>(null);
  const [inventory, setInventory] = useState<BackendInventoryItem[]>([]);
  const [journal, setJournal] = useState<BackendJournalEntry[]>([]);
  const [entities, setEntities] = useState<BackendEntity[]>([]);

  const [story, setStory] = useState<StoryState>({
    narration: [],
    actions: []
  });

  const fetchState = async () => {
    try {
      const res = await fetch("http://localhost:8000/state/");
      if (res.ok) {
        const data = await res.json();
        setGameState(data.game_state);
        setStats(data.stats);
        setInventory(data.inventory || []);
        setJournal(data.journal || []);
        setEntities(data.entities || []);
      }
    } catch (e) {
      console.error("Failed to fetch state", e);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/chat-history");
      if (res.ok) {
        const data = await res.json();
        const narration = data
          .filter((msg: any) => msg.role !== 'system')
          .map((msg: any) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            content: msg.content
          }));
        setStory(prev => ({ ...prev, narration }));
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  };

  const defaultRealities: [RealityData, RealityData, RealityData] = [
    {
      id: "r1",
      title: "The Cursed Outskirts",
      description: "Navigate a world of ancient curses and forgotten gods, where every choice carries a heavy price.",
      buttonLabel: "Enter the Void",
      themeColor: "primary"
    },
    {
      id: "r2",
      title: "Neo-Sumeria",
      description: "High tech, low life. Jack into the neon-soaked sprawling megalopolis of Neo-Sumeria.",
      buttonLabel: "Initiate Uplink",
      themeColor: "secondary"
    },
    {
      id: "r3",
      title: "Cozy Tavern",
      description: "Sometimes the greatest adventure is the one found in a warm hearth and a cold flagon of ale.",
      buttonLabel: "Take a Seat",
      themeColor: "tertiary"
    }
  ];

  const [realities, setRealities] = useState<[RealityData, RealityData, RealityData]>(defaultRealities);
  const [isLoadingRealities, setIsLoadingRealities] = useState(true);

  useEffect(() => {
    const fetchRealities = async () => {
      try {
        const res = await fetch("http://localhost:8000/locations");
        if (res.ok) {
          const data = await res.json();
          if (data.locations && data.locations.length === 3) {
             setRealities(data.locations as [RealityData, RealityData, RealityData]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch realities", e);
      } finally {
        setIsLoadingRealities(false);
      }
    };
    fetchRealities();
  }, []);

  const handleSelectReality = async (id: string) => {
    console.log("Selected reality:", id);
    setCurrentView('hud');
    
    const reality = realities.find(r => r.id === id);
    const place = reality ? reality.title : "The Cursed Outskirts";

    setStory({ narration: [{role: 'model', content: "Initializing..."}], actions: [] });
    // Call /campaign/start
    try {
      const response = await fetch(`http://localhost:8000/campaign/start?game_place=${encodeURIComponent(place)}`, {
        method: "POST",
      });
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      setStory((prev) => {
        return { ...prev, narration: [{role: 'model', content: ""}] };
      });

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          setStory((prev) => {
             return { ...prev, narration: [{role: 'model', content: fullResponse}] };
          });
        }
      }
      await fetchState();
    } catch (e) {
      console.error(e);
      setStory({ narration: [{role: 'model', content: "Error: Could not start campaign."}], actions: [] });
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleCommandSubmit = async (cmd: string) => {
    console.log("Command submitted:", cmd);
    setStory((prev) => ({
      ...prev,
      narration: [...prev.narration, {role: 'user', content: cmd}, {role: 'model', content: "Thinking..."}]
    }));

    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:8000/campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ player_input: cmd }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      // Replace the "Thinking..." placeholder with the actual start of the response
      setStory((prev) => {
        const newNarration = [...prev.narration];
        newNarration[newNarration.length - 1] = {role: 'model', content: ""};
        return { ...prev, narration: newNarration };
      });

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;

          if (fullResponse.includes("[[PLAYER_DEAD]]")) {
            alert("You have died. Your save has been wiped.");
            setCurrentView("selection");
            setIsProcessing(false);
            return;
          }

          setStory((prev) => {
            const newNarration = [...prev.narration];
            newNarration[newNarration.length - 1] = {role: 'model', content: fullResponse};
            return { ...prev, narration: newNarration };
          });
        }
      }

      // Sync state after a command
      await fetchState();
      await fetchChatHistory();
    } catch (error) {
      console.error("Error communicating with backend:", error);
      setStory((prev) => {
        const newNarration = [...prev.narration];
        newNarration[newNarration.length - 1] = {role: 'model', content: "Error: Could not reach the server."};
        return { ...prev, narration: newNarration };
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (currentView === 'selection') {    if (isLoadingRealities) {
      return (
        <div className="min-h-screen bg-background text-on-surface flex items-center justify-center font-headline relative">
          <div className="absolute top-[72px] left-0 bg-[#20201f] h-[2px] w-full z-40"></div>
          <header className="bg-[#131313] shadow-[0_20px_40px_-15px_rgba(242,202,80,0.06)] flex justify-between items-center w-full px-8 py-4 fixed top-0 z-50">
            <div className="text-2xl font-bold text-[#f2ca50] tracking-widest uppercase">The Relic Archive</div>
          </header>
          <div className="text-2xl text-[#f2ca50] animate-pulse">Conjuring realities from the void...</div>
        </div>
      );
    }    return (
      <GildedSelection 
        realities={realities} 
        onSelectReality={handleSelectReality}
        onNavClick={(nav) => console.log('Nav:', nav)}
      />
    );
  }

  return (
    <GildedHUD 
      gameState={gameState}
      stats={stats}
      inventory={inventory}
      journal={journal}
      entities={entities}
      story={story}
      onActionSelect={(id) => console.log('Action selected:', id)}
      onCommandSubmit={handleCommandSubmit}
      onRefresh={async () => {
        setIsProcessing(true);
        await fetchState();
        setIsProcessing(false);
      }}
      onNavClick={(nav) => {
        console.log('Nav clicked:', nav)
        if (nav === 'selection') setCurrentView('selection'); // Way to go back 
      }}
      isProcessing={isProcessing}
    />
  )
}

export default App
