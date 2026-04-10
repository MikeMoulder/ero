import { store } from '../store/memory.store';
import { gatewayService } from '../services/gateway.service';
import { events } from '../services/events.service';

export interface CatalogEntry {
  baseUrl: string;
  slug: string;
  price: number;
  category: string;
  description: string;
  examplePaths: string[];
}

export const API_CATALOG: CatalogEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  //  CRYPTO / FINANCE
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.coingecko.com/api/v3',
    slug: 'coingecko',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Cryptocurrency price data, market caps, volume, and trending coins from CoinGecko.',
    examplePaths: [
      '/simple/price?ids=bitcoin,ethereum,stellar&vs_currencies=usd',
      '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1',
      '/search/trending',
    ],
  },
  {
    baseUrl: 'https://open.er-api.com/v6',
    slug: 'exchangerate',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Currency exchange rates for fiat currencies. Get latest rates for any base currency.',
    examplePaths: [
      '/latest/USD',
      '/latest/EUR',
    ],
  },
  {
    baseUrl: 'https://api.blockchain.info',
    slug: 'blockchain-info',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Bitcoin blockchain statistics, block data, and address info.',
    examplePaths: [
      '/stats',
      '/latestblock',
    ],
  },
  {
    baseUrl: 'https://api.alternative.me',
    slug: 'fear-greed',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Crypto Fear & Greed Index and historical values.',
    examplePaths: [
      '/fng/',
      '/fng/?limit=10',
    ],
  },
  {
    baseUrl: 'https://api.coinlore.net/api',
    slug: 'coinlore',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Cryptocurrency market data, global stats, and coin ticker info.',
    examplePaths: [
      '/global/',
      '/tickers/',
      '/ticker/?id=90',
    ],
  },
  {
    baseUrl: 'https://api.gemini.com/v1',
    slug: 'gemini-market',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Gemini exchange public market data: symbols, ticker, order book.',
    examplePaths: [
      '/symbols',
      '/pubticker/btcusd',
      '/pubticker/ethusd',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  WEATHER / GEO / ENVIRONMENT
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.open-meteo.com/v1',
    slug: 'open-meteo',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Weather forecasts including temperature, precipitation, wind speed. Requires latitude and longitude coordinates.',
    examplePaths: [
      '/forecast?latitude=40.71&longitude=-74.01&current_weather=true',
      '/forecast?latitude=51.51&longitude=-0.13&hourly=temperature_2m&forecast_days=3',
    ],
  },
  {
    baseUrl: 'https://geocoding-api.open-meteo.com/v1',
    slug: 'geocoding',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Convert city names to latitude/longitude coordinates. Use before calling the open-meteo weather API.',
    examplePaths: [
      '/search?name=New+York&count=1',
      '/search?name=London&count=1',
    ],
  },
  {
    baseUrl: 'https://air-quality-api.open-meteo.com/v1',
    slug: 'air-quality',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Air quality index, PM2.5, PM10, ozone, and other pollutant data by coordinates.',
    examplePaths: [
      '/air-quality?latitude=40.71&longitude=-74.01&current=pm10,pm2_5',
      '/air-quality?latitude=51.51&longitude=-0.13&hourly=pm2_5&forecast_days=3',
    ],
  },
  {
    baseUrl: 'https://marine-api.open-meteo.com/v1',
    slug: 'marine-weather',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Marine/ocean weather: wave height, wave period, swell direction by coordinates.',
    examplePaths: [
      '/marine?latitude=54.32&longitude=10.12&current=wave_height,wave_period',
    ],
  },
  {
    baseUrl: 'https://flood-api.open-meteo.com/v1',
    slug: 'flood-data',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Global river discharge and flood forecast data by coordinates.',
    examplePaths: [
      '/flood?latitude=47.37&longitude=8.55&daily=river_discharge',
    ],
  },
  {
    baseUrl: 'https://archive-api.open-meteo.com/v1',
    slug: 'weather-archive',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Historical weather data going back decades. Temperature, rain, wind by date range.',
    examplePaths: [
      '/archive?latitude=40.71&longitude=-74.01&start_date=2024-01-01&end_date=2024-01-07&daily=temperature_2m_max',
    ],
  },
  {
    baseUrl: 'https://api.sunrise-sunset.org',
    slug: 'sunrise-sunset',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Sunrise and sunset times for any location by coordinates.',
    examplePaths: [
      '/json?lat=40.71&lng=-74.01&formatted=0',
      '/json?lat=51.51&lng=-0.13&date=today',
    ],
  },
  {
    baseUrl: 'https://api.zippopotam.us',
    slug: 'zipcode',
    price: 0.01,
    category: 'Weather/Geo',
    description: 'Zip/postal code lookup — returns city, state, country, and coordinates.',
    examplePaths: [
      '/us/10001',
      '/de/10115',
      '/gb/SW1A',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  NEWS / CONTENT / MEDIA
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://hacker-news.firebaseio.com/v0',
    slug: 'hackernews',
    price: 0.01,
    category: 'News/Content',
    description: 'Hacker News API. Get top/new/best story IDs, then fetch individual items by ID.',
    examplePaths: [
      '/topstories.json',
      '/newstories.json',
      '/item/1.json',
    ],
  },
  {
    baseUrl: 'https://en.wikipedia.org/api/rest_v1',
    slug: 'wikipedia',
    price: 0.01,
    category: 'News/Content',
    description: 'Wikipedia article summaries and page content. Use /page/summary/{title} for quick summaries.',
    examplePaths: [
      '/page/summary/Stellar_(payment_network)',
      '/page/summary/Bitcoin',
    ],
  },
  {
    baseUrl: 'https://api.spaceflightnewsapi.net/v4',
    slug: 'spaceflight-news',
    price: 0.01,
    category: 'News/Content',
    description: 'Spaceflight news articles, blogs, and launch reports.',
    examplePaths: [
      '/articles/?limit=5',
      '/articles/?search=SpaceX',
    ],
  },
  {
    baseUrl: 'https://www.reddit.com',
    slug: 'reddit',
    price: 0.01,
    category: 'News/Content',
    description: 'Reddit public JSON feed. Append .json to any subreddit or post URL.',
    examplePaths: [
      '/r/technology/top.json?limit=5&t=day',
      '/r/programming/hot.json?limit=5',
      '/r/stellar/new.json?limit=5',
    ],
  },
  {
    baseUrl: 'https://api.wikimedia.org/feed/v1/wikipedia/en',
    slug: 'wiki-featured',
    price: 0.01,
    category: 'News/Content',
    description: 'Wikipedia featured content, on-this-day events, and most-read pages.',
    examplePaths: [
      '/featured/2024/06/15',
    ],
  },
  {
    baseUrl: 'https://openlibrary.org',
    slug: 'openlibrary',
    price: 0.01,
    category: 'News/Content',
    description: 'Open Library: search books, get book details, cover images, and author info.',
    examplePaths: [
      '/search.json?q=blockchain&limit=5',
      '/works/OL45883W.json',
      '/authors/OL23919A.json',
    ],
  },
  {
    baseUrl: 'https://poetrydb.org',
    slug: 'poetrydb',
    price: 0.01,
    category: 'News/Content',
    description: 'Poetry database: search by author, title, or lines. Full text of classic poems.',
    examplePaths: [
      '/author/Shakespeare',
      '/title/Ozymandias',
      '/random/1',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  SCIENCE / SPACE / ASTRONOMY
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.nasa.gov',
    slug: 'nasa',
    price: 0.02,
    category: 'Science/Space',
    description: 'NASA open APIs: Astronomy Picture of the Day, Mars rover photos, Near-Earth objects. Uses DEMO_KEY.',
    examplePaths: [
      '/planetary/apod?api_key=DEMO_KEY',
      '/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=1&api_key=DEMO_KEY',
      '/neo/rest/v1/feed/today?api_key=DEMO_KEY',
    ],
  },
  {
    baseUrl: 'https://ll.thespacedevs.com/2.3.0',
    slug: 'space-launches',
    price: 0.02,
    category: 'Science/Space',
    description: 'Upcoming and past rocket launches worldwide. Detailed launch info.',
    examplePaths: [
      '/launches/upcoming/?limit=5&mode=list',
      '/launches/previous/?limit=5&mode=list',
    ],
  },
  {
    baseUrl: 'https://api.gbif.org/v1',
    slug: 'biodiversity',
    price: 0.01,
    category: 'Science/Space',
    description: 'Global Biodiversity Information Facility: species search, occurrence records worldwide.',
    examplePaths: [
      '/species/search?q=wolf&limit=5',
      '/species/5231190',
      '/occurrence/search?taxonKey=5231190&limit=5',
    ],
  },
  {
    baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    slug: 'pubmed',
    price: 0.01,
    category: 'Science/Space',
    description: 'PubMed/NCBI: search biomedical literature, gene data. Use esearch + efetch for articles.',
    examplePaths: [
      '/esearch.fcgi?db=pubmed&term=CRISPR&retmax=5&retmode=json',
      '/esummary.fcgi?db=pubmed&id=38012345&retmode=json',
    ],
  },
  {
    baseUrl: 'https://api.crossref.org',
    slug: 'crossref',
    price: 0.01,
    category: 'Science/Space',
    description: 'Academic paper metadata: search by title, DOI, author. Citation counts.',
    examplePaths: [
      '/works?query=machine+learning&rows=5',
      '/works?query.author=Hinton&rows=5',
    ],
  },
  {
    baseUrl: 'https://api.openalex.org',
    slug: 'openalex',
    price: 0.01,
    category: 'Science/Space',
    description: 'Open scholarly metadata: works, authors, institutions, concepts. Modern Crossref alternative.',
    examplePaths: [
      '/works?search=blockchain&per_page=5',
      '/authors?search=vitalik+buterin',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  GOVERNMENT / PUBLIC DATA
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://data.sec.gov/submissions',
    slug: 'sec-filings',
    price: 0.02,
    category: 'Government/Data',
    description: 'SEC EDGAR filings: company SEC filings by CIK number (Central Index Key).',
    examplePaths: [
      '/CIK0000320193.json',
    ],
  },
  {
    baseUrl: 'https://api.fda.gov',
    slug: 'openfda',
    price: 0.01,
    category: 'Government/Data',
    description: 'FDA open data: drug adverse events, recalls, food enforcement.',
    examplePaths: [
      '/drug/event.json?limit=5',
      '/food/enforcement.json?limit=5',
      '/drug/label.json?search=aspirin&limit=3',
    ],
  },
  {
    baseUrl: 'https://earthquake.usgs.gov/fdsnws/event/1',
    slug: 'earthquakes',
    price: 0.01,
    category: 'Government/Data',
    description: 'USGS earthquake data. Recent quakes worldwide, search by magnitude, location, date.',
    examplePaths: [
      '/query?format=geojson&limit=10&orderby=time',
      '/query?format=geojson&minmagnitude=5&limit=5',
    ],
  },
  {
    baseUrl: 'https://api.worldbank.org/v2',
    slug: 'worldbank',
    price: 0.01,
    category: 'Government/Data',
    description: 'World Bank indicators: GDP, population, life expectancy, education by country.',
    examplePaths: [
      '/country/US/indicator/NY.GDP.MKTP.CD?format=json&per_page=5',
      '/country/all/indicator/SP.POP.TOTL?format=json&date=2022&per_page=10',
    ],
  },
  {
    baseUrl: 'https://api.census.gov/data/2021/acs/acs1',
    slug: 'us-census',
    price: 0.01,
    category: 'Government/Data',
    description: 'US Census Bureau American Community Survey data by state, county, or zip.',
    examplePaths: [
      '?get=NAME,B01001_001E&for=state:*',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FOOD / NUTRITION / HEALTH
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://www.themealdb.com/api/json/v1/1',
    slug: 'mealdb',
    price: 0.01,
    category: 'Food/Nutrition',
    description: 'Recipes database: search meals by name, ingredient, category. Full cooking instructions.',
    examplePaths: [
      '/search.php?s=chicken',
      '/random.php',
      '/filter.php?c=Seafood',
      '/categories.php',
    ],
  },
  {
    baseUrl: 'https://www.thecocktaildb.com/api/json/v1/1',
    slug: 'cocktaildb',
    price: 0.01,
    category: 'Food/Nutrition',
    description: 'Cocktail recipes: search by name or ingredient. Full drink instructions and measurements.',
    examplePaths: [
      '/search.php?s=margarita',
      '/random.php',
      '/filter.php?i=Vodka',
    ],
  },
  {
    baseUrl: 'https://api.openbrewerydb.org/v1',
    slug: 'breweries',
    price: 0.01,
    category: 'Food/Nutrition',
    description: 'Open Brewery DB: search breweries by city, state, type. US brewery data.',
    examplePaths: [
      '/breweries?by_city=san_diego&per_page=5',
      '/breweries?by_state=california&per_page=5',
      '/breweries/random?size=3',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  SPORTS / GAMES / ENTERTAINMENT
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.jolpi.ca/ergast/f1',
    slug: 'formula1',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Formula 1 race data: results, standings, circuits, drivers. Historical since 1950.',
    examplePaths: [
      '/current.json',
      '/current/driverStandings.json',
      '/2023/results/1.json',
    ],
  },
  {
    baseUrl: 'https://statsapi.mlb.com/api/v1',
    slug: 'mlb',
    price: 0.01,
    category: 'Sports/Games',
    description: 'MLB baseball data: teams, players, standings, game schedules.',
    examplePaths: [
      '/teams?sportId=1',
      '/standings?leagueId=103,104&season=2024',
      '/schedule?sportId=1&date=2024-06-01',
    ],
  },
  {
    baseUrl: 'https://pokeapi.co/api/v2',
    slug: 'pokeapi',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Pokemon data: all Pokemon, abilities, moves, types, evolutions, locations.',
    examplePaths: [
      '/pokemon/pikachu',
      '/pokemon?limit=20',
      '/type/fire',
      '/ability/overgrow',
    ],
  },
  {
    baseUrl: 'https://api.magicthegathering.io/v1',
    slug: 'mtg',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Magic: The Gathering card database. Search cards by name, color, type.',
    examplePaths: [
      '/cards?name=Black+Lotus',
      '/cards?colors=blue&type=creature&pageSize=5',
      '/sets',
    ],
  },
  {
    baseUrl: 'https://api.opendota.com/api',
    slug: 'opendota',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Dota 2 game data: heroes, items, pro matches, player stats.',
    examplePaths: [
      '/heroes',
      '/heroStats',
      '/proMatches?limit=5',
    ],
  },
  {
    baseUrl: 'https://www.cheapshark.com/api/1.0',
    slug: 'game-deals',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Video game price comparison and deals across Steam, GOG, Epic, and more.',
    examplePaths: [
      '/deals?storeID=1&upperPrice=15&pageSize=5',
      '/games?title=witcher&limit=5',
      '/stores',
    ],
  },
  {
    baseUrl: 'https://api.jikan.moe/v4',
    slug: 'anime-jikan',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Anime and manga data from MyAnimeList: search anime, top charts, characters, reviews.',
    examplePaths: [
      '/top/anime?limit=5',
      '/anime?q=naruto&limit=5',
      '/seasons/now?limit=5',
    ],
  },
  {
    baseUrl: 'https://swapi.dev/api',
    slug: 'starwars',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Star Wars universe data: characters, films, starships, planets, species.',
    examplePaths: [
      '/people/1/',
      '/films/',
      '/starships/?page=1',
    ],
  },
  {
    baseUrl: 'https://superheroapi.com/api/10224839883714262',
    slug: 'superhero',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Superhero database: power stats, biography, appearance for Marvel & DC heroes.',
    examplePaths: [
      '/search/batman',
      '/search/spider',
      '/1',
    ],
  },
  {
    baseUrl: 'https://api.disneyapi.dev',
    slug: 'disney',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Disney character database: search and browse Disney characters and their film appearances.',
    examplePaths: [
      '/character?name=Mickey&pageSize=5',
      '/character?pageSize=10',
    ],
  },
  {
    baseUrl: 'https://hp-api.onrender.com/api',
    slug: 'harry-potter',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Harry Potter characters: full cast with house, wand, patronus, and actor info.',
    examplePaths: [
      '/characters',
      '/characters/house/gryffindor',
      '/characters/staff',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  TECHNOLOGY / DEV TOOLS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.github.com',
    slug: 'github',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'GitHub public API: repos, users, search, trending. No auth for public data.',
    examplePaths: [
      '/search/repositories?q=stellar+language:typescript&sort=stars&per_page=5',
      '/users/torvalds',
      '/repos/stellar/stellar-core',
    ],
  },
  {
    baseUrl: 'https://registry.npmjs.org',
    slug: 'npm-registry',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'NPM package registry: package metadata, versions, dependencies, download counts.',
    examplePaths: [
      '/react/latest',
      '/express/latest',
      '/-/v1/search?text=stellar&size=5',
    ],
  },
  {
    baseUrl: 'https://api.stackexchange.com/2.3',
    slug: 'stackoverflow',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'Stack Overflow: search questions, answers, tags, users. Developer Q&A data.',
    examplePaths: [
      '/questions?order=desc&sort=activity&tagged=stellar&site=stackoverflow&pagesize=5',
      '/search?order=desc&sort=relevance&intitle=blockchain&site=stackoverflow&pagesize=5',
    ],
  },
  {
    baseUrl: 'https://api.github.com/search',
    slug: 'github-search',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'GitHub code and repo search. Find repos, code snippets, issues, and users.',
    examplePaths: [
      '/repositories?q=stars:>50000&sort=stars&per_page=5',
      '/topics?q=blockchain&per_page=5',
    ],
  },
  {
    baseUrl: 'https://endoflife.date/api',
    slug: 'endoflife',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'End-of-life dates for software products: Node.js, Python, Ubuntu, etc.',
    examplePaths: [
      '/all.json',
      '/nodejs.json',
      '/python.json',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  TRANSPORTATION / VEHICLES
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://vpic.nhtsa.dot.gov/api/vehicles',
    slug: 'vehicle-nhtsa',
    price: 0.01,
    category: 'Transportation',
    description: 'NHTSA vehicle data: decode VINs, vehicle makes/models, safety ratings.',
    examplePaths: [
      '/GetAllMakes?format=json',
      '/GetModelsForMakeId/440?format=json',
      '/DecodeVinValues/1HGCM82633A123456?format=json',
    ],
  },
  {
    baseUrl: 'https://api.citybik.es/v2',
    slug: 'citybikes',
    price: 0.01,
    category: 'Transportation',
    description: 'Bike-sharing networks worldwide. Station locations, available bikes, empty slots.',
    examplePaths: [
      '/networks',
      '/networks/citi-bike-nyc',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  EDUCATION / LANGUAGE / KNOWLEDGE
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.dictionaryapi.dev/api/v2/entries/en',
    slug: 'dictionary',
    price: 0.01,
    category: 'Education/Language',
    description: 'English dictionary: word definitions, phonetics, pronunciation, synonyms, usage examples.',
    examplePaths: [
      '/blockchain',
      '/stellar',
      '/protocol',
    ],
  },
  {
    baseUrl: 'https://api.datamuse.com',
    slug: 'datamuse',
    price: 0.01,
    category: 'Education/Language',
    description: 'Word-finding API: rhymes, synonyms, related words, autocomplete, sounds-like.',
    examplePaths: [
      '/words?rel_rhy=coin&max=10',
      '/words?ml=blockchain&max=10',
      '/words?rel_syn=fast&max=10',
      '/sug?s=crypto&max=10',
    ],
  },
  {
    baseUrl: 'https://opentdb.com/api.php',
    slug: 'trivia',
    price: 0.01,
    category: 'Education/Language',
    description: 'Open Trivia DB: random quiz questions in multiple categories and difficulties.',
    examplePaths: [
      '?amount=5&category=18&type=multiple',
      '?amount=10&difficulty=hard',
    ],
  },
  {
    baseUrl: 'https://api.mathjs.org/v4',
    slug: 'mathjs',
    price: 0.01,
    category: 'Education/Language',
    description: 'Math expression evaluator: algebra, calculus, unit conversion, matrix operations.',
    examplePaths: [
      '/?expr=2+*+(3+%2B+4)',
      '/?expr=sqrt(16)',
      '/?expr=derivative(%22x%5E2+%2B+x%22%2C+%22x%22)',
    ],
  },
  {
    baseUrl: 'https://newton.vercel.app/api/v2',
    slug: 'newton-math',
    price: 0.01,
    category: 'Education/Language',
    description: 'Advanced math API: simplify, factor, derive, integrate, find zeroes, cosine, tangent.',
    examplePaths: [
      '/simplify/2%5E2+2%282x%29',
      '/factor/x%5E2+2x',
      '/derive/x%5E2+2x',
      '/integrate/x%5E2+2x',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  COUNTRIES / POPULATION / GEOGRAPHY
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://restcountries.com/v3.1',
    slug: 'countries',
    price: 0.01,
    category: 'Geography/Population',
    description: 'Country information including population, area, languages, currencies, and capitals.',
    examplePaths: [
      '/name/united%20states',
      '/all?fields=name,population,capital',
      '/alpha/US',
    ],
  },
  {
    baseUrl: 'https://countriesnow.space/api/v0.1/countries',
    slug: 'countries-now',
    price: 0.01,
    category: 'Geography/Population',
    description: 'Countries and cities data: cities by country, states, population, flags, currencies.',
    examplePaths: [
      '/iso',
      '/flag/images',
      '/capital',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  IP / NETWORK / SECURITY
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://ipapi.co',
    slug: 'ipapi',
    price: 0.01,
    category: 'Network/Security',
    description: 'IP geolocation data. Get location, ISP, and timezone info for any IP address.',
    examplePaths: [
      '/json',
      '/8.8.8.8/json',
    ],
  },
  {
    baseUrl: 'https://ifconfig.me',
    slug: 'ifconfig',
    price: 0.01,
    category: 'Network/Security',
    description: 'Your public IP address and basic network info (IP, host, user-agent).',
    examplePaths: [
      '/all.json',
    ],
  },
  {
    baseUrl: 'https://dns.google',
    slug: 'google-dns',
    price: 0.01,
    category: 'Network/Security',
    description: 'Google DNS-over-HTTPS resolver. Resolve domain names and query DNS records.',
    examplePaths: [
      '/resolve?name=stellar.org&type=A',
      '/resolve?name=google.com&type=MX',
    ],
  },
  {
    baseUrl: 'https://hasthelargehadroncolliderdestroyedtheworldyet.com',
    slug: 'lhc-status',
    price: 0.01,
    category: 'Network/Security',
    description: 'Has the Large Hadron Collider destroyed the world yet? A critical status check.',
    examplePaths: [
      '/',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ART / CULTURE / MUSEUMS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://collectionapi.metmuseum.org/public/collection/v1',
    slug: 'met-museum',
    price: 0.01,
    category: 'Art/Culture',
    description: 'Metropolitan Museum of Art: 470k+ artworks. Search, departments, object details.',
    examplePaths: [
      '/search?q=sunflowers',
      '/objects/436535',
      '/departments',
    ],
  },
  {
    baseUrl: 'https://api.artic.edu/api/v1',
    slug: 'art-institute-chicago',
    price: 0.01,
    category: 'Art/Culture',
    description: 'Art Institute of Chicago: artworks, artists, exhibitions, galleries.',
    examplePaths: [
      '/artworks?limit=5',
      '/artworks/search?q=monet&limit=5',
      '/artists?limit=5',
    ],
  },
  {
    baseUrl: 'https://api.europeana.eu/record/v2',
    slug: 'europeana',
    price: 0.01,
    category: 'Art/Culture',
    description: 'Europeana digital heritage: millions of items from European museums, libraries, archives.',
    examplePaths: [
      '/search.json?query=Van+Gogh&rows=5&wskey=api2demo',
    ],
  },
  {
    baseUrl: 'https://api.color.pizza/v1',
    slug: 'color-names',
    price: 0.01,
    category: 'Art/Culture',
    description: 'Color name lookup: get the closest named color for any hex value.',
    examplePaths: [
      '/FF4F00',
      '/08080A',
      '/?values=FF4F00,34D399,F87171',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  MUSIC / AUDIO
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://musicbrainz.org/ws/2',
    slug: 'musicbrainz',
    price: 0.01,
    category: 'Music/Audio',
    description: 'MusicBrainz open music encyclopedia: artists, albums, recordings, labels.',
    examplePaths: [
      '/artist/?query=radiohead&fmt=json&limit=5',
      '/release/?query=ok+computer&fmt=json&limit=5',
    ],
  },
  {
    baseUrl: 'https://api.lyrics.ovh/v1',
    slug: 'lyrics',
    price: 0.01,
    category: 'Music/Audio',
    description: 'Song lyrics lookup by artist and title.',
    examplePaths: [
      '/radiohead/creep',
      '/beatles/yesterday',
    ],
  },
  {
    baseUrl: 'https://itunes.apple.com',
    slug: 'itunes-search',
    price: 0.01,
    category: 'Music/Audio',
    description: 'iTunes/Apple Music search: songs, albums, artists, podcasts, apps.',
    examplePaths: [
      '/search?term=radiohead&entity=album&limit=5',
      '/search?term=blockchain&entity=podcast&limit=5',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  UTILITIES / DATA TOOLS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://randomuser.me/api',
    slug: 'randomuser',
    price: 0.01,
    category: 'Utilities',
    description: 'Generate random user profiles for testing. Returns names, emails, addresses, photos.',
    examplePaths: [
      '/?results=5',
      '/?results=3&nat=us',
    ],
  },
  {
    baseUrl: 'https://jsonplaceholder.typicode.com',
    slug: 'jsonplaceholder',
    price: 0.01,
    category: 'Utilities',
    description: 'Fake REST API for testing. Contains posts, comments, users, todos, photos, and albums.',
    examplePaths: [
      '/posts',
      '/posts/1',
      '/users',
      '/todos?userId=1',
    ],
  },
  {
    baseUrl: 'https://httpbin.org',
    slug: 'httpbin',
    price: 0.01,
    category: 'Utilities',
    description: 'HTTP request/response inspection. Echo headers, IP, user-agent, test redirects.',
    examplePaths: [
      '/get',
      '/ip',
      '/user-agent',
      '/headers',
    ],
  },
  {
    baseUrl: 'https://fakerapi.it/api/v2',
    slug: 'faker',
    price: 0.01,
    category: 'Utilities',
    description: 'Fake data generator: persons, addresses, texts, images, companies, credit cards for testing.',
    examplePaths: [
      '/persons?_quantity=3',
      '/addresses?_quantity=3',
      '/companies?_quantity=3',
      '/texts?_quantity=2&_characters=200',
    ],
  },
  {
    baseUrl: 'https://api.genderize.io',
    slug: 'genderize',
    price: 0.01,
    category: 'Utilities',
    description: 'Predict gender from a first name based on statistical data.',
    examplePaths: [
      '/?name=james',
      '/?name=andrea&country_id=IT',
    ],
  },
  {
    baseUrl: 'https://api.nationalize.io',
    slug: 'nationalize',
    price: 0.01,
    category: 'Utilities',
    description: 'Predict nationality from a name based on statistical data.',
    examplePaths: [
      '/?name=johnson',
      '/?name=mueller',
    ],
  },
  {
    baseUrl: 'https://api.agify.io',
    slug: 'agify',
    price: 0.01,
    category: 'Utilities',
    description: 'Predict age from a first name based on statistical data.',
    examplePaths: [
      '/?name=michael',
      '/?name=emma',
    ],
  },
  {
    baseUrl: 'https://uselessfacts.jsph.pl/api/v2/facts',
    slug: 'useless-facts',
    price: 0.01,
    category: 'Utilities',
    description: 'Random useless facts. Get daily fact or random fact.',
    examplePaths: [
      '/random?language=en',
      '/today?language=en',
    ],
  },
  {
    baseUrl: 'https://api.ipify.org',
    slug: 'ipify',
    price: 0.01,
    category: 'Utilities',
    description: 'Simple public IP address lookup. Returns your external IP.',
    examplePaths: [
      '/?format=json',
    ],
  },
  {
    baseUrl: 'https://timeapi.io/api',
    slug: 'worldtime',
    price: 0.01,
    category: 'Utilities',
    description: 'Current time in any timezone. Use /time/current/zone?timeZone=IANA_ZONE for a specific timezone. Common US zones: America/New_York, America/Chicago, America/Denver, America/Los_Angeles.',
    examplePaths: [
      '/time/current/zone?timeZone=America/New_York',
      '/time/current/zone?timeZone=Europe/London',
      '/time/current/zone?timeZone=Asia/Tokyo',
      '/timezone/availabletimezones',
    ],
  },
  {
    baseUrl: 'https://date.nager.at/api/v3',
    slug: 'public-holidays',
    price: 0.01,
    category: 'Utilities',
    description: 'Public holidays by country and year. Also weekend days and long weekends.',
    examplePaths: [
      '/PublicHolidays/2024/US',
      '/PublicHolidays/2024/DE',
      '/NextPublicHolidays/US',
    ],
  },
  {
    baseUrl: 'https://api.chucknorris.io',
    slug: 'chucknorris',
    price: 0.01,
    category: 'Fun',
    description: 'Random Chuck Norris jokes. Filter by category.',
    examplePaths: [
      '/jokes/random',
      '/jokes/categories',
      '/jokes/random?category=dev',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  FUN / RANDOM / MEME
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://dog.ceo/api',
    slug: 'dogapi',
    price: 0.01,
    category: 'Fun',
    description: 'Random dog images and breed listings.',
    examplePaths: [
      '/breeds/image/random',
      '/breeds/list/all',
      '/breed/husky/images/random',
    ],
  },
  {
    baseUrl: 'https://catfact.ninja',
    slug: 'catfact',
    price: 0.01,
    category: 'Fun',
    description: 'Random cat facts and breeds.',
    examplePaths: [
      '/fact',
      '/facts?limit=3',
    ],
  },
  {
    baseUrl: 'https://v2.jokeapi.dev',
    slug: 'jokeapi',
    price: 0.01,
    category: 'Fun',
    description: 'Random jokes by category. Supports Programming, Misc, Dark, Pun, Spooky, Christmas.',
    examplePaths: [
      '/joke/Programming',
      '/joke/Any?amount=3',
    ],
  },
  {
    baseUrl: 'http://numbersapi.com',
    slug: 'numbersapi',
    price: 0.01,
    category: 'Fun',
    description: 'Interesting facts about numbers. Supports trivia, math, date, and year types.',
    examplePaths: [
      '/42/trivia?json',
      '/random/math?json',
    ],
  },
  {
    baseUrl: 'https://api.thecatapi.com/v1',
    slug: 'catapi',
    price: 0.01,
    category: 'Fun',
    description: 'Random cat images, breeds, and categories. The internet loves cats.',
    examplePaths: [
      '/images/search?limit=3',
      '/breeds?limit=5',
    ],
  },
  {
    baseUrl: 'https://dog.ceo/api/breed',
    slug: 'dog-breed',
    price: 0.01,
    category: 'Fun',
    description: 'Dog images by specific breed. Get random images for any dog breed.',
    examplePaths: [
      '/labrador/images/random/3',
      '/poodle/images/random/3',
    ],
  },
  {
    baseUrl: 'https://api.adviceslip.com',
    slug: 'advice',
    price: 0.01,
    category: 'Fun',
    description: 'Random life advice slips. Get a random piece of advice or search by keyword.',
    examplePaths: [
      '/advice',
      '/advice/search/life',
    ],
  },
  {
    baseUrl: 'https://api.kanye.rest',
    slug: 'kanye-quotes',
    price: 0.01,
    category: 'Fun',
    description: 'Random Kanye West quotes. The voice of a generation, one API call at a time.',
    examplePaths: [
      '/',
    ],
  },
  {
    baseUrl: 'https://yesno.wtf/api',
    slug: 'yesno',
    price: 0.01,
    category: 'Fun',
    description: 'Random yes/no/maybe answers with a matching GIF. Decision making as a service.',
    examplePaths: [
      '/',
      '/?force=yes',
    ],
  },
  {
    baseUrl: 'https://official-joke-api.appspot.com',
    slug: 'official-joke',
    price: 0.01,
    category: 'Fun',
    description: 'Clean, family-friendly jokes with setup and punchline.',
    examplePaths: [
      '/random_joke',
      '/jokes/ten',
      '/jokes/programming/random',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ENVIRONMENT / CLIMATE / ENERGY
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.carbonintensity.org.uk',
    slug: 'carbon-intensity',
    price: 0.01,
    category: 'Environment/Energy',
    description: 'UK National Grid carbon intensity of electricity generation, forecasts and regional data.',
    examplePaths: [
      '/intensity',
      '/intensity/date',
      '/generation',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  MOVIES / TV
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.tvmaze.com',
    slug: 'tvmaze',
    price: 0.01,
    category: 'Movies/TV',
    description: 'TV show data: search shows, episodes, cast, schedule, streaming info.',
    examplePaths: [
      '/search/shows?q=breaking+bad',
      '/shows/1/episodes',
      '/schedule?country=US',
    ],
  },
  {
    baseUrl: 'https://ghibliapi.vercel.app',
    slug: 'ghibli',
    price: 0.01,
    category: 'Movies/TV',
    description: 'Studio Ghibli films database: all movies, characters, locations, species, vehicles.',
    examplePaths: [
      '/films',
      '/people',
      '/locations',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  TRAVEL / PLACES
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.opentopodata.org/v1',
    slug: 'elevation',
    price: 0.01,
    category: 'Travel/Places',
    description: 'Elevation/altitude data for any coordinates. Multiple datasets available.',
    examplePaths: [
      '/srtm90m?locations=40.71,-74.01',
      '/srtm90m?locations=51.51,-0.13|48.86,2.35',
    ],
  },
  {
    baseUrl: 'https://nominatim.openstreetmap.org',
    slug: 'nominatim',
    price: 0.01,
    category: 'Travel/Places',
    description: 'OpenStreetMap geocoding: address search and reverse geocoding. Free alternative to Google Maps.',
    examplePaths: [
      '/search?q=Eiffel+Tower&format=json&limit=3',
      '/reverse?lat=40.748817&lon=-73.985428&format=json',
    ],
  },
  {
    baseUrl: 'https://wikitravel.org/wiki/en/api.php',
    slug: 'wikitravel',
    price: 0.01,
    category: 'Travel/Places',
    description: 'Wikitravel content: travel guides, city descriptions, practical travel info.',
    examplePaths: [
      '?action=query&titles=Paris&prop=extracts&exintro=true&format=json',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  BLOCKCHAIN / WEB3 (NON-CRYPTO-PRICE)
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://horizon-testnet.stellar.org',
    slug: 'stellar-testnet',
    price: 0.01,
    category: 'Blockchain/Web3',
    description: 'Stellar Testnet Horizon API: accounts, transactions, operations, ledgers.',
    examplePaths: [
      '/ledgers?limit=5&order=desc',
      '/fee_stats',
    ],
  },
  {
    baseUrl: 'https://horizon.stellar.org',
    slug: 'stellar-mainnet',
    price: 0.02,
    category: 'Blockchain/Web3',
    description: 'Stellar Mainnet Horizon API: real network accounts, transactions, operations.',
    examplePaths: [
      '/ledgers?limit=5&order=desc',
      '/fee_stats',
    ],
  },
  {
    baseUrl: 'https://api.blockchair.com',
    slug: 'blockchair',
    price: 0.02,
    category: 'Blockchain/Web3',
    description: 'Multi-chain blockchain explorer: Bitcoin, Ethereum, and more. Stats and search.',
    examplePaths: [
      '/bitcoin/stats',
      '/ethereum/stats',
    ],
  },
  {
    baseUrl: 'https://api.etherscan.io/api',
    slug: 'etherscan',
    price: 0.01,
    category: 'Blockchain/Web3',
    description: 'Ethereum blockchain data: gas prices, ETH supply, tx status. Partial free tier.',
    examplePaths: [
      '?module=proxy&action=eth_gasPrice&apikey=demo',
      '?module=stats&action=ethsupply&apikey=demo',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  SOCIAL / PEOPLE / COMMUNICATION
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.github.com/users',
    slug: 'github-users',
    price: 0.01,
    category: 'Social/People',
    description: 'GitHub user profiles: repos, followers, activity. Public profile data.',
    examplePaths: [
      '/torvalds',
      '/torvalds/repos?sort=stars&per_page=5',
    ],
  },
  {
    baseUrl: 'https://www.gravatar.com',
    slug: 'gravatar',
    price: 0.01,
    category: 'Social/People',
    description: 'Gravatar profile data and avatar images by email hash.',
    examplePaths: [
      '/205e460b479e2e5b48aec07710c08d50.json',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  HEALTH / FITNESS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://disease.sh/v3/covid-19',
    slug: 'covid19',
    price: 0.01,
    category: 'Health/Fitness',
    description: 'COVID-19 statistics: global totals, by country, historical data, vaccinations.',
    examplePaths: [
      '/all',
      '/countries?sort=cases&yesterday=true',
      '/countries/USA',
      '/vaccine/coverage?lastdays=30',
    ],
  },
  {
    baseUrl: 'https://wger.de/api/v2',
    slug: 'exercise-db',
    price: 0.01,
    category: 'Health/Fitness',
    description: 'Exercise and workout database: exercises by muscle group, equipment, difficulty.',
    examplePaths: [
      '/exercise/?format=json&limit=10',
      '/exercisecategory/?format=json',
      '/muscle/?format=json',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  JOBS / BUSINESS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://remotive.com/api',
    slug: 'remotive-jobs',
    price: 0.01,
    category: 'Jobs/Business',
    description: 'Remote job listings: search by category, company. Software, design, marketing, etc.',
    examplePaths: [
      '/remote-jobs?category=software-dev&limit=5',
      '/remote-jobs?search=blockchain&limit=5',
    ],
  },
  {
    baseUrl: 'https://api.openbrewerydb.org/v1/breweries',
    slug: 'companies-brew',
    price: 0.01,
    category: 'Jobs/Business',
    description: 'Open Brewery DB as business data: brewery names, types, addresses, websites.',
    examplePaths: [
      '?by_state=new_york&per_page=5',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  DESIGN / IMAGES / PLACEHOLDERS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://picsum.photos',
    slug: 'lorem-picsum',
    price: 0.01,
    category: 'Design/Images',
    description: 'Random placeholder images. Specify size, grayscale, blur. Great for mockups.',
    examplePaths: [
      '/v2/list?page=1&limit=5',
      '/id/237/info',
    ],
  },
  {
    baseUrl: 'https://dummyimage.com',
    slug: 'dummy-image',
    price: 0.01,
    category: 'Design/Images',
    description: 'Generate custom placeholder images with text, colors, and dimensions.',
    examplePaths: [
      '/300x200/FF4F00/ffffff&text=x402',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ANIMALS / NATURE
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://dog-api.kinduff.com/api/facts',
    slug: 'dog-facts',
    price: 0.01,
    category: 'Animals/Nature',
    description: 'Random dog facts, because dogs are wonderful.',
    examplePaths: [
      '?number=3',
    ],
  },
  {
    baseUrl: 'https://api.inaturalist.org/v1',
    slug: 'inaturalist',
    price: 0.01,
    category: 'Animals/Nature',
    description: 'iNaturalist: community-sourced species observations. Search species, observations, places.',
    examplePaths: [
      '/taxa?q=bald+eagle&per_page=5',
      '/observations?taxon_name=wolf&per_page=5',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  ECONOMICS / INDICATORS
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service',
    slug: 'us-treasury',
    price: 0.01,
    category: 'Economics',
    description: 'US Treasury fiscal data: national debt, interest rates, federal spending.',
    examplePaths: [
      '/v2/accounting/od/debt_to_penny?sort=-record_date&page[size]=5',
      '/v2/accounting/od/avg_interest_rates?sort=-record_date&page[size]=5',
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  //  MISCELLANEOUS / UNIQUE
  // ═══════════════════════════════════════════════════════════════
  {
    baseUrl: 'https://api.tfl.gov.uk',
    slug: 'tfl-london',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'Transport for London: tube status, bus arrivals, cycle hire, journey planning.',
    examplePaths: [
      '/Line/Mode/tube/Status',
      '/BikePoint',
    ],
  },
  {
    baseUrl: 'https://api.fbi.gov',
    slug: 'fbi-wanted',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'FBI Most Wanted list. Current fugitives, missing persons, and wanted posters.',
    examplePaths: [
      '/@wanted?pageSize=5',
    ],
  },
  {
    baseUrl: 'https://collectionapi.metmuseum.org/public/collection/v1/departments',
    slug: 'met-departments',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'Metropolitan Museum departments listing. Pair with met-museum for filtered art search.',
    examplePaths: [
      '',
    ],
  },
  {
    baseUrl: 'https://api.qrserver.com/v1',
    slug: 'qr-generator',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'QR code generator and reader. Create QR codes for any text or URL.',
    examplePaths: [
      '/create-qr-code/?size=150x150&data=stellar.org',
      '/read-qr-code/?fileurl=example.com/qr.png',
    ],
  },
  {
    baseUrl: 'https://api.spacexdata.com/v4',
    slug: 'spacex',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'SpaceX data: launches, rockets, capsules, landing pads, Starlink satellites.',
    examplePaths: [
      '/launches/latest',
      '/rockets',
      '/starlink',
    ],
  },
  {
    baseUrl: 'https://deckofcardsapi.com/api',
    slug: 'deck-of-cards',
    price: 0.01,
    category: 'Miscellaneous',
    description: 'Virtual deck of cards. Shuffle, draw, create piles. Great for card game simulations.',
    examplePaths: [
      '/deck/new/shuffle/?deck_count=1',
      '/deck/new/draw/?count=5',
    ],
  },
  {
    baseUrl: 'https://api.exchangerate.host',
    slug: 'exchangerate-host',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Historical and live currency conversion. Supports crypto and fiat pairs.',
    examplePaths: [
      '/latest?base=USD',
      '/convert?from=USD&to=EUR&amount=100',
    ],
  },
  {
    baseUrl: 'https://api.frankfurter.app',
    slug: 'frankfurter',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'European Central Bank exchange rates. Historical and latest rates, 30+ currencies.',
    examplePaths: [
      '/latest?from=USD',
      '/2024-01-01..2024-01-31?from=USD&to=EUR',
    ],
  },
  {
    baseUrl: 'https://type.fit/api',
    slug: 'typefit-quotes',
    price: 0.01,
    category: 'Fun',
    description: 'Famous quotes collection with author attribution.',
    examplePaths: [
      '/quotes',
    ],
  },
  {
    baseUrl: 'https://api.github.com/emojis',
    slug: 'github-emojis',
    price: 0.01,
    category: 'Fun',
    description: 'GitHub emoji catalog: every GitHub-supported emoji with its image URL.',
    examplePaths: [
      '',
    ],
  },
  {
    baseUrl: 'https://api.coinstats.app/public/v1',
    slug: 'coinstats',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'Crypto market overview: top coins, markets, news, portfolio data.',
    examplePaths: [
      '/coins?limit=5',
      '/coins/bitcoin?currency=USD',
    ],
  },
  {
    baseUrl: 'https://complimentr.com/api',
    slug: 'compliment',
    price: 0.01,
    category: 'Fun',
    description: 'Random compliment generator. Because everyone deserves a nice word.',
    examplePaths: [
      '/',
    ],
  },
  {
    baseUrl: 'https://api.urbandictionary.com/v0',
    slug: 'urban-dictionary',
    price: 0.01,
    category: 'Education/Language',
    description: 'Urban Dictionary: slang definitions, trending words, pop culture terms.',
    examplePaths: [
      '/define?term=HODL',
      '/define?term=blockchain',
    ],
  },
  {
    baseUrl: 'https://api.github.com/licenses',
    slug: 'open-source-licenses',
    price: 0.01,
    category: 'Technology/Dev',
    description: 'Open source license catalog: MIT, Apache, GPL, etc. Full text and details.',
    examplePaths: [
      '',
      '/mit',
    ],
  },
  {
    baseUrl: 'https://api.chucknorris.io/jokes',
    slug: 'chuck-search',
    price: 0.01,
    category: 'Fun',
    description: 'Search Chuck Norris jokes by keyword. Find the perfect Chuck Norris fact.',
    examplePaths: [
      '/search?query=computer',
    ],
  },
  {
    baseUrl: 'https://collectionapi.metmuseum.org/public/collection/v1/search',
    slug: 'met-search',
    price: 0.01,
    category: 'Art/Culture',
    description: 'Metropolitan Museum art search: find artworks by keyword, filter by department.',
    examplePaths: [
      '?q=monet',
      '?q=armor&departmentId=4',
    ],
  },
  {
    baseUrl: 'https://emojihub.yurace.pro/api/all',
    slug: 'emojihub',
    price: 0.01,
    category: 'Fun',
    description: 'Emoji database: all emojis with names, unicode codes, categories.',
    examplePaths: [
      '/',
    ],
  },
  {
    baseUrl: 'https://api.coingecko.com/api/v3/search',
    slug: 'coingecko-search',
    price: 0.01,
    category: 'Crypto/Finance',
    description: 'CoinGecko search: find coins, exchanges, categories by keyword.',
    examplePaths: [
      '?query=stellar',
    ],
  },
  {
    baseUrl: 'https://www.dnd5eapi.co/api',
    slug: 'dnd5e',
    price: 0.01,
    category: 'Sports/Games',
    description: 'Dungeons & Dragons 5th Edition API: classes, spells, monsters, equipment, races.',
    examplePaths: [
      '/classes',
      '/spells?name=fireball',
      '/monsters?challenge_rating=5',
    ],
  },
  {
    baseUrl: 'https://api.sampleapis.com',
    slug: 'sample-apis',
    price: 0.01,
    category: 'Utilities',
    description: 'Collection of sample APIs: beers, coffee, wines, cartoons, movies, and more.',
    examplePaths: [
      '/beers/ale',
      '/coffee/hot',
      '/wines/reds',
    ],
  },
  {
    baseUrl: 'https://api.wheretheiss.at/v1',
    slug: 'iss-position',
    price: 0.01,
    category: 'Science/Space',
    description: 'International Space Station real-time position, velocity, and orbit data.',
    examplePaths: [
      '/satellites/25544',
      '/satellites/25544/positions?timestamps=1436029892,1436029902&units=miles',
    ],
  },
];

// O(1) lookup by slug
const catalogBySlug = new Map(API_CATALOG.map(e => [e.slug, e]));

export function getCatalogEntry(slug: string): CatalogEntry | undefined {
  return catalogBySlug.get(slug);
}

export function seedCatalogApis(receiverAddress: string): void {
  let seeded = 0;
  for (const entry of API_CATALOG) {
    const existing = store.getApiBySlug(entry.slug);
    if (existing) continue;

    try {
      gatewayService.registerApi(
        entry.baseUrl,
        entry.slug,
        entry.price,
        receiverAddress,
        '' // owner = '' so Soroban sync won't delete them
      );
      seeded++;
    } catch (err: any) {
      console.warn(`[Catalog] Failed to seed ${entry.slug}: ${err.message}`);
    }
  }
  events.log('info', 'System', `Seeded ${seeded} APIs from catalog (${API_CATALOG.length} total in catalog)`);
}
