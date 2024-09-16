# Local CDN Master Node

This project represents the master node for a local CDN (Content Delivery Network), designed to coordinate multiple server nodes that upload and serve content. The master node maintains metadata about the servers and their file mappings, ensuring smooth communication and uptime monitoring through heartbeat checks.

## Hosted Backend and Frontend

- **Backend Server:** The master node is hosted on Vercel at [local-cdn-master.vercel.app](https://local-cdn-master.vercel.app/).
- **Frontend:** The frontend for this backend is located in the repository [master-frontend](https://github.com/vaishnav-192/master-frontend) and is deployed on Vercel at [local-cdn-master-frontend.vercel.app](https://local-cdn-master-frontend.vercel.app/).


## Features

1. **Server Registration and Monitoring:**
    - Server nodes register themselves with the master node, providing essential metadata like their `serverAddress` and `name`.
    - The master node continuously monitors the status of registered servers using a **heartbeat** mechanism, where each server sends periodic heartbeat signals. If a server fails to send a heartbeat within a defined interval, it is considered inactive and removed from the network.
    - The master node maintains an active server list with each server's last heartbeat time.

2. **Dynamic File Mapping:**
    - Servers can upload files, and the master node keeps track of the content using **mappings** of `contentType`, `fileName`, and corresponding server information.
    - The master node also supports **magnet links** for efficient file retrieval across servers.

3. **Automatic Cleanup of Inactive Servers and Mappings:**
    - The system checks for servers that have not sent a heartbeat in the last 16 minutes. Inactive servers are removed, along with their associated file mappings, ensuring that only active nodes are part of the CDN.

4. **Content Discovery via File Search:**
    - Users can query the master node for files stored across various servers. The system supports case-insensitive file searches, returning metadata and magnet links of matching files.

## API Endpoints

### 1. Register Server
**`POST /registerServer`**

Registers a new server with the master node.

**Request Body:**
```json
{
    "serverAddress": "http://server1.local",
    "name": "Server 1"
}
```

### 2. Heartbeat
**`POST /hearbeat`**

Servers send a heartbeat signal to indicate they are active.

**Request Body:**
```json
{
    "serverAddress": "http://server1.local"
}
```

### 3. Add File Mapping
**`POST /addMapping`**

Adds a file mapping for a specific server and content type.

**Request Body:**
```json
{
    "contentType": "video/mp4",
    "fileName": "movie.mp4",
    "magnetLink": "magnet:?xt=urn:btih:example",
    "serverAddress": "http://server1.local"
}
```

### 4. Fetch Matching Files
**`GET /fetchResults`**

Fetches file details matching a given fileName.

**Query Parameters:**
   - fileName: Name of the file to search for (supports partial and case-insensitive matching).


**Request Body:**
```json
{
    "contentType": "video/mp4",
    "fileName": "movie.mp4",
    "magnetLink": "magnet:?xt=urn:btih:example",
    "serverAddress": "http://server1.local"
}
```

### 5. Get All Servers
**`GET /servers`**

Returns a list of all active servers registered with the master node.

### 6. Get All Mappings
**`GET /mappings`**

Returns all the content-to-server mappings.

### 7. Welcome Page
**`GET /`**

Displays a welcome message.

## How the Master Node Works
  - Heartbeat Monitoring: Servers send regular heartbeat signals to the master node, ensuring the system knows which servers are active. If a server stops sending heartbeats (due to downtime or other issues), the master node automatically removes the server and its file mappings.
  - Automatic Cleanup: Periodically, inactive servers (those not sending heartbeats) are purged from the system, along with any file mappings that refer to them. This keeps the CDN streamlined and efficient.
  - File Mapping: The master node organizes file mappings based on contentType, fileName, and serverAddress. This allows clients to easily discover where to fetch files from, improving content availability and network resilience.

## Advantages of the Master Node

- **Fault Tolerance:** The master node can dynamically remove inactive servers and keep the system stable without manual intervention.
- **Efficient Search:** With optimized file mappings and magnet links, fetching files from servers is swift and reliable.
- **Real-time Monitoring:** The heartbeat mechanism ensures real-time server health checks, keeping the CDN updated with active nodes only.
- **Scalability:** As new servers register and upload content, the master node dynamically expands its mapping and tracking capabilities, supporting a growing network.
