const express = require('express');
const app = express();
app.use(express.json());

const servers = []; // Replace this with a proper database if needed
const mappings = {}; // Replace this with a proper database

// Endpoint to register a server
app.post('/registerServer', (req, res) => {
    const { serverAddress, name } = req.body; // Removed port as it's not needed in Vercel
    if (!serverAddress) {
        return res.status(400).send('Server address is required');
    }

    // Register the server if it hasn't been registered yet
    if (!servers.some(server => server.serverAddress === serverAddress)) {
        servers.push({ serverAddress, name });
        console.log(`Server registered: ${name} at ${serverAddress}`);
    }
    res.sendStatus(200);
});

// Endpoint to add file mapping
app.post('/addMapping', (req, res) => {
    const { contentType, fileName, server } = req.body;
    if (!contentType || !fileName || !server) {
        return res.status(400).send('contentType, fileName, and server are required');
    }

    if (!mappings[contentType]) {
        mappings[contentType] = {};
    }
    mappings[contentType][fileName] = server;
    console.log(`File mapping added: ${fileName} -> ${server}`);
    res.sendStatus(200);
});

// Fetch matching files endpoint
app.get('/fetchResults', (req, res) => {
    const { fileName } = req.query;
    if (!fileName) {
        return res.status(400).send('FileName query parameter is required');
    }

    const results = [];
    const fileNameRegex = new RegExp(fileName, 'i'); // Case-insensitive match

    for (const [contentType, files] of Object.entries(mappings)) {
        for (const [mappedFileName, server] of Object.entries(files)) {
            if (fileNameRegex.test(mappedFileName)) {
                results.push({ contentType, fileName: mappedFileName, server });
            }
        }
    }

    if (results.length === 0) {
        return res.status(404).json({ message: 'No matching files found' });
    }

    res.json(results);
});

// Endpoint to fetch a file (redirect to the respective server)
app.get('/getFile', (req, res) => {
    const { contentType, fileName } = req.query;
    const server = mappings[contentType]?.[fileName];
    if (server) {
        // Redirect to the server that holds the file
        res.redirect(`${server}/giveFile?contentType=${contentType}&fileName=${fileName}`);
    } else {
        res.status(404).send('File not found');
    }
});

// Endpoint to get all registered servers
app.get('/servers', (req, res) => {
    res.json(servers);
});

// Endpoint to get all file mappings
app.get('/mappings', (req, res) => {
    res.json(mappings);
});

// Welcome page
app.get('/', (req, res) => {
    res.send('Welcome to the Master Node!');
});

// Start the master server
app.listen(3000, () => {
    console.log('Master node listening on port 3000');
});

module.exports = app;
