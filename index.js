const express = require('express');
const app = express();
app.use(express.json());

const cors = require('cors');

// Enable CORS for all routes
app.use(cors());


const servers = []; // This will hold server objects with address, name, and lastHeartbeat time
const mappings = {}; // This will hold file mappings

// Function to remove inactive servers and their mappings
const removeInactiveServers = () => {
    const now = Date.now();
    const inactiveServers = [];

    // Identify inactive servers
    servers.forEach((server, index) => {
        if (now - server.lastHeartbeat > 3600000) { //1 hour
            inactiveServers.push({ index, serverAddress: server.serverAddress });
        }
    });

    // Remove inactive servers and their mappings
    inactiveServers.forEach(({ index, serverAddress }) => {
        // Remove from servers array
        const removedServer = servers.splice(index, 1)[0];
        console.log(`Removed inactive server: ${removedServer.name} at ${serverAddress}`);

        // Remove mappings for this server
        for (const [contentType, serversMap] of Object.entries(mappings)) {
            if (serversMap[serverAddress]) {
                delete serversMap[serverAddress]; // Remove serverAddress entry
                console.log(`Removed mappings for server: ${serverAddress} in content type: ${contentType}`);
            }

            // Remove the contentType if no servers are left
            if (Object.keys(serversMap).length === 0) {
                delete mappings[contentType];
                console.log(`Removed content type: ${contentType} as it is empty`);
            }
        }
    });
};



// Register the server with an initial heartbeat time
app.post('/registerServer', (req, res) => {
    const { serverAddress, name } = req.body;
    if (!serverAddress) {
        return res.status(400).send('Server address is required');
    }

    const existingServer = servers.find(server => server.serverAddress === serverAddress);
    
    if (!existingServer) {
        servers.push({
            serverAddress,
            name,
            lastHeartbeat: Date.now(), // Track the time of the last heartbeat
        });
        console.log(`Server registered: ${name} at ${serverAddress}`);
    }
    res.sendStatus(200);
});

// Handle heartbeat requests
app.post('/heartbeat', (req, res) => {
    const { serverAddress } = req.body;

    if (!serverAddress) {
        return res.status(400).send('serverAddress is required');
    }

    // Find the server in the list based on serverAddress
    const server = servers.find(s => s.serverAddress === serverAddress);

    if (server) {
        // Update the lastHeartbeat time for the server
        server.lastHeartbeat = Date.now();
        console.log(`Heartbeat received from ${server.name} (${server.serverAddress}) at ${new Date(server.lastHeartbeat).toISOString()}`);
        res.sendStatus(200);
    } else {
        // If server is not found, send a 404 status
        console.error(`Server not found: ${serverAddress}`);
        res.status(404).send('Server not found');
    }
});

// Periodically check for inactive servers
setInterval(removeInactiveServers, 3600000); // Check every hour for inactive servers

// Endpoint to add file mapping
app.post('/addMapping', (req, res) => {
    const { contentType, fileName, magnetLink, serverAddress } = req.body;

    // Validate required fields
    if (!contentType || !fileName || !magnetLink || !serverAddress) {
        return res.status(400).send('contentType, fileName, magnetLink, and serverAddress are required');
    }

    // Initialize mappings for contentType if it does not exist
    if (!mappings[contentType]) {
        mappings[contentType] = {};
    }

    // Initialize serverAddress mapping if it does not exist
    if (!mappings[contentType][serverAddress]) {
        mappings[contentType][serverAddress] = {};
    }

    // Add or update the file mapping
    mappings[contentType][serverAddress][fileName] = magnetLink;

    console.log(`File mapping added: ${fileName} -> ${serverAddress} (Magnet Link: ${magnetLink})`);
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

    // Iterate over content types
    for (const [contentType, servers] of Object.entries(mappings)) {
        // Iterate over server addresses
        for (const [serverAddress, files] of Object.entries(servers)) {
            // Iterate over file names
            for (const [mappedFileName, magnetLink] of Object.entries(files)) {
                if (fileNameRegex.test(mappedFileName)) {
                    results.push({ contentType, fileName: mappedFileName, magnetLink });
                }
            }
        }
    }

    if (results.length === 0) {
        return res.status(404).json({ message: 'No matching files found' });
    }

    res.json(results);
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
