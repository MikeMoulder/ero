import { TrendingUp, Newspaper, CloudSun, ShieldCheck, Globe, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskTemplate {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  prompt: string;
}

const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'crypto-snapshot',
    icon: <TrendingUp className="w-4 h-4 text-accent" />,
    title: 'Crypto Market Snapshot',
    description: 'Fetch BTC, ETH, XLM market pairs via Dexscreener and summarize market trends.',
    prompt: 'Use the dexscreener API to find current market data for Bitcoin, Ethereum, and Stellar (XLM), then provide a brief market analysis with trends and liquidity context.',
  },
  {
    id: 'weather-report',
    icon: <CloudSun className="w-4 h-4 text-accent" />,
    title: 'Weather Intelligence',
    description: 'Look up a city via geocoding, then fetch weather from Open-Meteo.',
    prompt: 'Use the geocoding API to find the coordinates for Tokyo, then use the open-meteo API to get the current weather and 3-day forecast. Summarize as a travel advisory.',
  },
  {
    id: 'space-briefing',
    icon: <Newspaper className="w-4 h-4 text-accent" />,
    title: 'Space Mission Briefing',
    description: 'Track the ISS position and pull NASA\'s Astronomy Picture of the Day.',
    prompt: 'Use the iss-position API to get the current location of the International Space Station, then use the nasa API to fetch today\'s Astronomy Picture of the Day. Combine both into a short space exploration briefing.',
  },
  {
    id: 'country-exchange',
    icon: <Globe className="w-4 h-4 text-accent" />,
    title: 'Country & Currency Report',
    description: 'Look up country info and exchange rates for a travel finance brief.',
    prompt: 'Use the countries API to get information about Japan, then use the exchangerate API to get current JPY exchange rates. Produce a brief travel finance report.',
  },
  {
    id: 'wiki-verify',
    icon: <ShieldCheck className="w-4 h-4 text-accent" />,
    title: 'Wikipedia Cross-Check',
    description: 'Fetch a Wikipedia summary and verify facts against live market data.',
    prompt: 'Use the wikipedia API to get a summary of Stellar (payment network), then use the dexscreener API to verify current market activity for XLM. Produce a fact-checked report.',
  },
  {
    id: 'multi-api-analysis',
    icon: <Sparkles className="w-4 h-4 text-accent" />,
    title: 'Fun Facts Mashup',
    description: 'Grab random quotes, cat facts, jokes, and number trivia into a digest.',
    prompt: 'Use the catfact API to get a random cat fact, the jokeapi API to get a programming joke, and the numbersapi API to get a random math fact. Combine them into an entertaining "Daily Fun Facts" digest.',
  },
];

interface TaskTemplatesProps {
  onSelect: (prompt: string) => void;
}

export function TaskTemplates({ onSelect }: TaskTemplatesProps) {
  return (
    <div className="mb-3">
      <h2 className="text-[9px] font-mono font-medium text-text-secondary uppercase tracking-[0.2em] mb-2">Quick Start Templates</h2>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {TASK_TEMPLATES.map((template, idx) => (
          <motion.button
            key={template.id}
            onClick={() => onSelect(template.prompt)}
            className="text-left border border-border bg-bg-secondary hover:border-accent/50 transition-all duration-[80ms] active:scale-[0.97] p-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-2">
              {template.icon}
              <span className="text-xs font-mono font-medium text-text-primary">{template.title}</span>
            </div>
            <p className="text-[10px] font-mono text-text-secondary leading-relaxed">{template.description}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
