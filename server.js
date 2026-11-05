const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dns = require('dns');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// Prisma v7 requires adapter or accelerateUrl; handle gracefully
let prisma = null;
try {
  prisma = new PrismaClient();
} catch (e) {
  console.error('Prisma init failed (watchlist will use in-memory fallback):', e.message);
}

// In-memory fallback for watchlist when Prisma is unavailable
let memoryWatchlist = [];

// Initialize Gemini API with validation
let ai = null;
if (process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (e) {
        console.error('Gemini init warning:', e.message);
    }
}

// Initialize OpenRouter with validation
let openRouter = null;
if (process.env.OPENROUTER_API_KEY) {
    try {
        openRouter = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });
    } catch (e) {
        console.error('OpenRouter init warning:', e.message);
    }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DOMAIN_MAP = {
  '2embed': 'www.2embed.cc',
  'streamimdb': 'streamimdb.ru',
  'vidApi': 'vidapi.co',
  'vidKing': 'vidking.link',
  'multiembed': 'multiembed.mov',
  'videasy': 'player.videasy.net',
  'vidcore': 'www.vidcore.org',
  'twoembed': 'www.2embed.cc'
};

const checkDomainHealth = async (domain) => {
    const startTime = Date.now();
    const timeoutMs = 4000;

    // Check DNS first to fail fast on ISP blockades
    const dnsResolve = new Promise((resolve) => {
        dns.lookup(domain, (err) => {
            if (err) resolve(false);
            else resolve(true);
        });
    });

    const hasDns = await dnsResolve;
    if (!hasDns) {
        return { status: 'offline', error: 'DNS_UNRESOLVED', ping: null };
    }

    if (typeof fetch !== 'undefined') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const response = await fetch(`https://${domain}/`, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamVerse/2.0'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return {
                status: 'online',
                ping: Date.now() - startTime,
                error: null
            };
        } catch (err) {
            clearTimeout(timeoutId);
            const isTimeout = err.name === 'AbortError' || err.code === 'ETIMEOUT';
            return {
                status: 'offline',
                ping: null,
                error: isTimeout ? 'TIMEOUT' : (err.code || err.message)
            };
        }
    } else {
        // Fallback to https module
        return new Promise((resolve) => {
            const req = https.request({
                hostname: domain,
                port: 443,
                path: '/',
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) StreamVerse/2.0'
                },
                timeout: timeoutMs
            }, () => {
                resolve({
                    status: 'online',
                    ping: Date.now() - startTime,
                    error: null
                });
            });

            req.on('error', (err) => {
                resolve({
                    status: 'offline',
                    ping: null,
                    error: err.code || err.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    status: 'offline',
                    ping: null,
                    error: 'TIMEOUT'
                });
            });

            req.end();
        });
    }
};

// Resolve Link Endpoint
app.post('/api/resolve-link', async (req, res) => {
    try {
        const { movieTitle, providerDomain, imdbId, tmdbId, isTv } = req.body;
        
        if (!movieTitle && !tmdbId) {
            return res.status(400).json({ error: 'Movie title or tmdbId is required.' });
        }
        
        let url = '';
        const domain = String(providerDomain || '').toLowerCase();
        
        // Handle specific provider resolution
        if (domain.includes('streamimdb')) {
            url = `https://playimdb.org/embed/${isTv ? 'tv' : 'movie'}/${tmdbId || imdbId || 'tt1375666'}`;
        } else if (domain.includes('netmirror')) {
            url = `https://netmirror.gg/?s=${encodeURIComponent(movieTitle)}`;
        } else if (domain.includes('7reel')) {
            url = `https://7reel.cc/?s=${encodeURIComponent(movieTitle)}`;
        } else if (domain.includes('cinehd')) {
            url = `https://cinehd.app/?s=${encodeURIComponent(movieTitle)}`;
        } else {
            // Default fallback is VIDSRC
            url = isTv 
                ? `https://vidsrc.to/embed/tv/${tmdbId}`
                : `https://vidsrc.to/embed/movie/${tmdbId}`;
        }

        // Optional: Gemini search resolution when AI is active
        if (ai && movieTitle && providerDomain && !domain.includes('streamimdb')) {
            try {
                const prompt = `Find the direct streaming or search URL for the movie/show "${movieTitle}" on the domain "${providerDomain}". Return ONLY the URL, nothing else.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        tools: [{ googleSearch: {} }]
                    }
                });
                const resolvedUrl = (response.text || '').trim();
                if (resolvedUrl.startsWith('http')) {
                    url = resolvedUrl;
                }
            } catch (e) {
                console.error('Gemini AI Resolve Link Warning:', e.message);
            }
        }
        
        res.json({ url });
    } catch (error) {
        console.error('Link resolution failed:', error);
        res.status(500).json({ error: 'Failed to resolve streaming link.' });
    }
});

// Gateways Health Endpoint
app.post('/api/gateways-health', async (req, res) => {
    try {
        const { keys } = req.body;
        const requestedKeys = Array.isArray(keys) && keys.length > 0 ? keys : Object.keys(DOMAIN_MAP);
        
        const promises = requestedKeys.map(async (key) => {
            const domain = DOMAIN_MAP[key];
            if (!domain) return null;
            
            try {
                const health = await checkDomainHealth(domain);
                return { key, ...health };
            } catch (err) {
                return { key, status: 'offline', ping: null, error: err.message };
            }
        });
        
        const results = (await Promise.all(promises)).filter(r => r !== null);
        res.json({ results });
    } catch (error) {
        console.error('Gateways health check failed:', error);
        res.status(500).json({ error: 'Failed to check gateways health.' });
    }
});

// AI Endpoint
app.post('/api/stream-ai', async (req, res) => {
    try {
        const { movieTitle, overview, genres, rating, releaseYear } = req.body;
        
        if (!movieTitle) {
            return res.status(400).json({ error: 'Movie title is required.' });
        }

        const prompt = `
        You are the StreamVerse AI, a futuristic cinematic intelligence engine. 
        A user has selected the movie/show: "${movieTitle}" (${releaseYear || 'N/A'}).
        Rating: ${rating || 'N/A'}/10
        Genres: ${genres && Array.isArray(genres) ? genres.join(', ') : 'Unknown'}
        Overview: ${overview || 'No overview available'}

        Provide a very brief (2-3 sentences), highly engaging, sci-fi-toned summary of why they should watch this.
        Analyze if this title is originally from Netflix, Amazon Prime, HBO, or general Hollywood cinemas.
        If it is a Hollywood or streaming original, explicitly recommend using the 7REEL COGNITION, NETMIRROR SECURE, or CINEHD GATEWAY nodes below.
        If it is an Anime or K-Drama, recommend using our high-speed Asian drama indexing servers (like VIDSRC CORE or SMASHYSTREAM).
        Direct the user to select the appropriate active Network Gateway below to decrypt the stream directly inside our terminal site. Keep the tone futuristic and detached.
        `;

        let responseText = "StreamVerse AI is currently unavailable. Using fallback recommendation.";
        
        if (ai) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                responseText = response.text || responseText;
            } catch (geminiError) {
                console.error('Gemini AI Error, attempting fallback:', geminiError.message);
                if (openRouter) {
                    try {
                        const completion = await openRouter.chat.completions.create({
                            model: "meta-llama/llama-3.3-70b-instruct",
                            messages: [{ role: "user", content: prompt }]
                        });
                        responseText = completion.choices[0].message.content || responseText;
                    } catch (fallbackErr) {
                        console.error('OpenRouter fallback also failed:', fallbackErr.message);
                    }
                }
            }
        } else if (openRouter) {
            try {
                const completion = await openRouter.chat.completions.create({
                    model: "meta-llama/llama-3.3-70b-instruct",
                    messages: [{ role: "user", content: prompt }]
                });
                responseText = completion.choices[0].message.content || responseText;
            } catch (err) {
                console.error('OpenRouter Error:', err.message);
            }
        }
        res.json({ result: responseText });
    } catch (error) {
        console.error('AI Error (Both Engines Failed):', error);
        res.status(500).json({ error: 'AI processing failed. Check API key configuration.' });
    }
});

// IMDb Rating Proxy via Gemini with in-memory caching
const imdbRatingsCache = {};
app.get('/api/imdb-rating/:imdbId', async (req, res) => {
    try {
        const { imdbId } = req.params;
        if (!imdbId) return res.status(400).json({ error: 'IMDb ID is required' });
        
        if (imdbRatingsCache[imdbId]) {
            return res.json({ rating: imdbRatingsCache[imdbId] });
        }
        
        let rating = 'N/A';
        
        if (ai) {
            try {
                const prompt = `Return ONLY the IMDb rating (e.g. 7.8 or 8.5) for the movie/show with IMDb ID "${imdbId}". Return nothing else, just the number or N/A.`;
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                const fetched = (response.text || '').trim();
                if (fetched && !isNaN(parseFloat(fetched))) {
                    rating = parseFloat(fetched).toFixed(1);
                    imdbRatingsCache[imdbId] = rating;
                }
            } catch (e) {
                console.error('Error fetching IMDb rating via Gemini:', e);
            }
        }
        res.json({ rating });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch IMDb rating' });
    }
});

// AI Mood-Based Recommendation Endpoint
app.post('/api/mood-recommend', async (req, res) => {
    try {
        const { mood, tmdbKey } = req.body;
        
        if (!mood) {
            return res.status(400).json({ error: 'Mood query is required.' });
        }

        const resolvedTmdbKey = tmdbKey || process.env.TMDB_API_KEY || 'a86a4b74b161d18c36145fc882b7284b';

        const prompt = `
        You are a futuristic, cybernetic cinematic recommendation engine.
        A user has requested movie/TV recommendations based on their current mood/theme: "${mood}".
        Recommend exactly 6 highly tailored movies or TV shows that perfectly align with this mood.
        Return ONLY a raw JSON array of objects, with no markdown backticks, no markdown formatting, and no conversational text.
        Each object in the array MUST have exactly these two keys: "title" and "year".
        
        Example output:
        [
          {"title": "Blade Runner 2049", "year": "2017"},
          {"title": "Ghost in the Shell", "year": "1995"}
        ]
        `;

        let recommendations = [];
        
        if (ai) {
            try {
                const aiResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json'
                    }
                });

                try {
                    recommendations = JSON.parse(aiResponse.text.trim());
                } catch (parseError) {
                    console.error('Failed to parse Gemini JSON output:', aiResponse.text);
                    const cleanedText = aiResponse.text.replace(/```json/gi, '').replace(/```/g, '').trim();
                    recommendations = JSON.parse(cleanedText);
                }
            } catch (geminiError) {
                console.error('Gemini AI Error in mood-recommend, attempting fallback:', geminiError.message);
                if (openRouter) {
                    try {
                        const completion = await openRouter.chat.completions.create({
                            model: "meta-llama/llama-3.3-70b-instruct",
                            messages: [{ role: "user", content: prompt }]
                        });
                        const responseText = completion.choices[0]?.message?.content || '[]';
                        const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                        recommendations = JSON.parse(cleanedText);
                    } catch (fallbackErr) {
                        console.error('OpenRouter fallback also failed:', fallbackErr.message);
                        recommendations = [];
                    }
                }
            }
        } else if (openRouter) {
            try {
                const completion = await openRouter.chat.completions.create({
                    model: "meta-llama/llama-3.3-70b-instruct",
                    messages: [{ role: "user", content: prompt }]
                });
                const responseText = completion.choices[0]?.message?.content || '[]';
                const cleanedText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
                recommendations = JSON.parse(cleanedText);
            } catch (err) {
                console.error('OpenRouter Error:', err.message);
                recommendations = [];
            }
        }

        if (!Array.isArray(recommendations)) {
            recommendations = [];
        }

        // Helper function to resolve TMDB metadata
        const fetchTmdbMetadata = async (item) => {
            try {
                const queryUrl = `https://api.themoviedb.org/3/search/multi?api_key=${resolvedTmdbKey}&query=${encodeURIComponent(item.title || '')}`;
                
                let searchData;
                try {
                    if (typeof fetch === 'function') {
                        const response = await fetch(queryUrl);
                        searchData = await response.json();
                    } else {
                        const https = require('https');
                        searchData = await new Promise((resolve, reject) => {
                            https.get(queryUrl, (res) => {
                                let data = '';
                                res.on('data', (chunk) => data += chunk);
                                res.on('end', () => {
                                    try {
                                        resolve(JSON.parse(data));
                                    } catch (e) {
                                        resolve({});
                                    }
                                });
                            }).on('error', reject);
                        });
                    }
                } catch (err) {
                    console.error(`TMDB API call failed for query ${item.title}:`, err.message);
                    return null;
                }

                if (searchData && searchData.results && searchData.results.length > 0) {
                    let match = searchData.results.find(r => 
                        (r.media_type === 'movie' || r.media_type === 'tv') &&
                        (r.title || r.name)
                    );
                    
                    if (!match) match = searchData.results[0];

                    const releaseYear = (match.release_date || match.first_air_date || '').slice(0, 4);
                    
                    return {
                        id: match.id,
                        title: match.title || match.name,
                        name: match.name || match.title,
                        poster_path: match.poster_path,
                        backdrop_path: match.backdrop_path,
                        vote_average: match.vote_average,
                        release_date: match.release_date || match.first_air_date,
                        first_air_date: match.first_air_date || match.release_date,
                        overview: match.overview,
                        media_type: match.media_type || (match.first_air_date ? 'tv' : 'movie')
                    };
                }
                return null;
            } catch (err) {
                console.error('Error fetching TMDB metadata:', err.message);
                return null;
            }
        };

        // Query TMDB for all recommendations in parallel with timeout
        const resolvePromises = recommendations.map(item => 
            Promise.race([
                fetchTmdbMetadata(item),
                new Promise(resolve => setTimeout(() => resolve(null), 5000))
            ])
        );
        const resolvedResults = await Promise.all(resolvePromises);
        
        const finalResults = resolvedResults.filter(item => item !== null);

        res.json({ results: finalResults });
    } catch (error) {
        console.error('Mood Recommendation Error:', error);
        res.status(500).json({ error: 'Failed to process mood-based recommendations.' });
    }
});


// WATCHLIST API
app.get('/api/watchlist/:deviceId', async (req, res) => {
    try {
        if (prisma) {
            const user = await prisma.anonymousUser.findUnique({
                where: { deviceId: req.params.deviceId },
                include: { watchList: true }
            });
            res.json({ items: user ? user.watchList : [] });
        } else {
            const items = memoryWatchlist.filter(w => w.deviceId === req.params.deviceId);
            res.json({ items });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

app.post('/api/watchlist', async (req, res) => {
    try {
        const { deviceId, title, tmdbId, mediaType, posterUrl } = req.body;
        if (prisma) {
            const user = await prisma.anonymousUser.upsert({
                where: { deviceId },
                update: {},
                create: { deviceId }
            });
            const item = await prisma.watchItem.create({
                data: {
                    title, tmdbId, mediaType, posterUrl, userId: user.id
                }
            });
            res.json({ success: true, item });
        } else {
            const item = { id: Date.now().toString(), deviceId, title, tmdbId, mediaType, posterUrl, addedAt: new Date().toISOString() };
            memoryWatchlist.push(item);
            res.json({ success: true, item });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

app.delete('/api/watchlist/:id', async (req, res) => {
    try {
        if (prisma) {
            await prisma.watchItem.delete({ where: { id: req.params.id } });
        } else {
            memoryWatchlist = memoryWatchlist.filter(w => w.id !== req.params.id);
        }
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to delete' });
    }
});

app.listen(PORT, () => {
    console.log(`[StreamVerse OS] Backend initialized on port ${PORT}`);
});


