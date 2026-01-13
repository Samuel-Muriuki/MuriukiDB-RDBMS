import { useState } from 'react';
import { REPL } from '@/components/REPL';
import { ContactManager } from '@/components/ContactManager';
import { TabButton } from '@/components/TabButton';
import { Terminal, Users, Github } from 'lucide-react';

type Tab = 'repl' | 'contacts';

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>('repl');

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/20 border border-primary/50 flex items-center justify-center">
                <Terminal className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-mono font-bold text-sm text-foreground">MuriukiDB</h1>
                <p className="font-mono text-[10px] text-muted-foreground">Custom RDBMS Engine</p>
              </div>
            </div>
            
            <nav className="flex items-center">
              <TabButton 
                active={activeTab === 'repl'} 
                onClick={() => setActiveTab('repl')}
                icon={<Terminal className="w-3.5 h-3.5" />}
              >
                SQL REPL
              </TabButton>
              <TabButton 
                active={activeTab === 'contacts'} 
                onClick={() => setActiveTab('contacts')}
                icon={<Users className="w-3.5 h-3.5" />}
              >
                Demo App
              </TabButton>
            </nav>

            <a 
              href="https://github.com/Samuel-Muriuki" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'repl' ? <REPL /> : <ContactManager />}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-4 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-xs font-mono text-muted-foreground">
            Pesapal Junior Dev Challenge '26 • Built by Samuel-Muriuki
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
