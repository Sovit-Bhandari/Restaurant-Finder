require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Endpoint to fetch restaurants based on location, dietary preference, and pagination
app.get('/restaurants', async (req, res) => {
    const { location, term, pageToken } = req.query;
    try {
        const params = {
            key: GOOGLE_PLACES_API_KEY,
        };

        if (pageToken) {
            params.pagetoken = pageToken; // Use the next_page_token for paginated requests
        } else {
            params.query = `${term} restaurants in ${location}`;
        }

        const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
            params,
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data from Google Places API:', error);
        res.status(500).json({ error: 'Failed to fetch data from Google Places API' });
    }
});

// Endpoint to provide the Google Maps API key to the frontend
app.get('/maps-api-key', (req, res) => {
    res.json({ apiKey: GOOGLE_PLACES_API_KEY });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
