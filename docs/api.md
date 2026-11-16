# API Specification: Collaborative Graph-Based Fraud Detection Console

## 1. Overview & General Protocols

The **Collaborative Graph-Based Fraud Detection Console** exposes an enterprise-grade RESTful API alongside a bi-directional WebSocket interface for real-time collaboration.

### 1.1 Base URLs
- **REST API**: `http://localhost:4000/api`
- **Interactive OpenAPI / Swagger UI**: `http://localhost:4000/api/docs`
- **WebSocket Gateway**: `ws://localhost:4000` (or `http://localhost:4000` via Socket.IO transport)

### 1.2 Authentication & Authorization
All endpoints except `/api/auth/login` and `/api/auth/register` mandate an HTTP `Authorization` header containing an HMAC-SHA256 Bearer JWT:
```http
Authorization: Bearer <jwt_access_token>
```
If an unauthenticated request is received, the gateway responds with HTTP 401 Unauthorized:
```json
{
  "success": false,
  "error": "Access token required. Please sign in."
}
```

### 1.3 Uniform Response Envelope
All REST endpoints adhere to a standardized JSON envelope:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "meta": {
    "total": 100,
    "page": 1,
    "pageSize": 25
  }
}
```

---

## 2. Authentication Endpoints

### 2.1 Authenticate User (Login)
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth Required**: No
- **Request Body**:
```json
{
  "email": "investigator@fraudconsole.internal",
  "password": "Investigator@123"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "e8a93902-86ec-49c7-876a-360ecb3524b0",
      "email": "investigator@fraudconsole.internal",
      "firstName": "Marcus",
      "lastName": "Vance",
      "role": "INVESTIGATOR"
    }
  }
}
```

### 2.2 Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth Required**: No (or Admin in restricted policy)
- **Request Body**:
```json
{
  "email": "analyst2@fraudconsole.internal",
  "password": "SecurePassword123!",
  "firstName": "Elena",
  "lastName": "Rostova",
  "role": "INVESTIGATOR"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "f1b82791-44bb-4c22-b5bc-19812dfaa123",
      "email": "analyst2@fraudconsole.internal",
      "firstName": "Elena",
      "lastName": "Rostova",
      "role": "INVESTIGATOR"
    }
  }
}
```

### 2.3 Retrieve Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "e8a93902-86ec-49c7-876a-360ecb3524b0",
    "email": "investigator@fraudconsole.internal",
    "firstName": "Marcus",
    "lastName": "Vance",
    "role": "INVESTIGATOR"
  }
}
```

### 2.4 Logout Session
- **Method**: `POST`
- **Path**: `/api/auth/logout`
- **Auth Required**: Yes
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Accounts & Entities Endpoints

### 3.1 List Accounts
- **Method**: `GET`
- **Path**: `/api/accounts?search=CYCLE&riskLevel=CRITICAL&limit=10&page=1`
- **Query Parameters**:
  - `search` *(string, optional)*: Filter by account ID or owner name
  - `riskLevel` *(string, optional)*: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `minRisk` *(number, optional)*: Filter accounts with riskScore $\ge$ value
  - `page` *(number, optional)*: Default 1
  - `limit` *(number, optional)*: Default 25
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "accountId": "ACC-CYCLE-01",
      "ownerName": "Global Trading Horizon LLC",
      "accountType": "BUSINESS",
      "riskScore": 0.94,
      "status": "SUSPICIOUS",
      "balance": 184500.50,
      "country": "BVI",
      "createdAt": "2024-03-15T08:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10
  }
}
```

### 3.2 Get Account Profile & Metrics
- **Method**: `GET`
- **Path**: `/api/accounts/:id`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accountId": "ACC-CYCLE-01",
    "ownerName": "Global Trading Horizon LLC",
    "accountType": "BUSINESS",
    "riskScore": 0.94,
    "status": "SUSPICIOUS",
    "balance": 184500.50,
    "country": "BVI",
    "metrics": {
      "inDegree": 1,
      "outDegree": 1,
      "totalInflow": 46000.00,
      "totalOutflow": 48500.00,
      "netFlow": -2500.00,
      "velocityPerHour": 3.2
    }
  }
}
```

### 3.3 Get Account Direct Transactions
- **Method**: `GET`
- **Path**: `/api/accounts/:id/transactions?direction=ALL&limit=50`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "TX-CYC-001",
      "senderAccountId": "ACC-CYCLE-01",
      "receiverAccountId": "ACC-CYCLE-02",
      "amount": 48500.00,
      "timestamp": "2026-10-12T14:30:00Z",
      "transactionType": "WIRE",
      "status": "COMPLETED"
    }
  ]
}
```

### 3.4 Get 1-Hop Neighbors Subgraph
- **Method**: `GET`
- **Path**: `/api/accounts/:id/neighbors`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "ACC-CYCLE-01", "label": "Global Trading Horizon LLC", "riskScore": 0.94 },
      { "id": "ACC-CYCLE-02", "label": "Pacific Apex Holdings", "riskScore": 0.91 }
    ],
    "edges": [
      { "id": "TX-CYC-001", "source": "ACC-CYCLE-01", "target": "ACC-CYCLE-02", "amount": 48500.00 }
    ]
  }
}
```

---

## 4. Graph Analytics & Traversal Endpoints

### 4.1 Get Full Network Topology & Statistics
- **Method**: `GET`
- **Path**: `/api/graph?limit=500`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "nodes": [ ... ],
    "edges": [ ... ]
  }
}
```
- **Method**: `GET`
- **Path**: `/api/graph/statistics`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalNodes": 700,
    "totalEdges": 3200,
    "averageDegree": 4.57,
    "density": 0.0065,
    "highRiskAccountCount": 42,
    "flaggedTransactionCount": 118,
    "totalTransactionVolume": 14285400.00
  }
}
```

### 4.2 Multi-Hop Reachability Traversal (BFS / DFS)
- **Method**: `POST`
- **Path**: `/api/graph/traverse` (or `/api/graph/bfs` / `/api/graph/dfs`)
- **Request Body**:
```json
{
  "startAccountId": "ACC-SMURF-AGG-01",
  "algorithm": "BFS",
  "direction": "INCOMING",
  "maxDepth": 2,
  "limit": 100,
  "filterOptions": {
    "minAmount": 5000,
    "maxAmount": 10000,
    "dateRange": {
      "startDate": "2026-10-01T00:00:00Z",
      "endDate": "2026-10-15T23:59:59Z"
    }
  }
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "algorithm": "BFS",
    "rootAccountId": "ACC-SMURF-AGG-01",
    "direction": "INCOMING",
    "maxDepth": 2,
    "visitedNodesCount": 11,
    "traversedEdgesCount": 10,
    "executionTimeMs": 2.45,
    "visitedNodes": [
      {
        "accountId": "ACC-SMURF-01",
        "depth": 1,
        "path": ["ACC-SMURF-AGG-01", "ACC-SMURF-01"],
        "riskScore": 0.88
      }
    ],
    "subgraph": {
      "nodes": [ ... ],
      "edges": [ ... ]
    }
  }
}
```

### 4.3 Elementary Cycle Detection (Johnson's Algorithm)
- **Method**: `POST`
- **Path**: `/api/graph/cycles`
- **Request Body**:
```json
{
  "minLength": 3,
  "maxLength": 6,
  "maxCycles": 50,
  "minVolume": 10000.0
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "cyclesFound": 3,
    "executionTimeMs": 14.82,
    "cycles": [
      {
        "cycleId": "CYC-001",
        "length": 3,
        "accounts": ["ACC-CYCLE-01", "ACC-CYCLE-02", "ACC-CYCLE-03", "ACC-CYCLE-01"],
        "totalVolume": 141700.00,
        "initialAmount": 48500.00,
        "returnedAmount": 46000.00,
        "leakagePercentage": 5.15,
        "durationHours": 22.0,
        "severity": "CRITICAL",
        "transactions": [
          { "from": "ACC-CYCLE-01", "to": "ACC-CYCLE-02", "amount": 48500.00 },
          { "from": "ACC-CYCLE-02", "to": "ACC-CYCLE-03", "amount": 47200.00 },
          { "from": "ACC-CYCLE-03", "to": "ACC-CYCLE-01", "amount": 46000.00 }
        ]
      }
    ],
    "stronglyConnectedComponents": 4
  }
}
```

### 4.4 Community Detection (Louvain Modularity Optimization)
- **Method**: `POST`
- **Path**: `/api/graph/communities`
- **Request Body**:
```json
{
  "resolution": 1.0,
  "weightProperty": "amount",
  "minCommunitySize": 3,
  "maxIterations": 20
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "modularity": 0.6842,
    "totalCommunities": 8,
    "executionTimeMs": 31.40,
    "communities": [
      {
        "id": 1,
        "size": 10,
        "internalEdges": 28,
        "totalVolume": 492000.00,
        "averageRiskScore": 0.89,
        "density": 0.622,
        "isSuspicious": true,
        "accountIds": [
          "ACC-COMM1-01", "ACC-COMM1-02", "ACC-COMM1-03", "ACC-COMM1-04",
          "ACC-COMM1-05", "ACC-COMM1-06", "ACC-COMM1-07", "ACC-COMM1-08",
          "ACC-COMM1-09", "ACC-COMM1-10"
        ]
      }
    ],
    "bridgingTransactions": [
      {
        "transactionId": "TX-BRIDGE-01",
        "senderCommunity": 1,
        "receiverCommunity": 2,
        "amount": 75000.00
      }
    ]
  }
}
```

---

## 5. Investigation Cases & Findings Endpoints

### 5.1 List & Create Investigations
- **Method**: `GET`
- **Path**: `/api/investigations?status=open`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "e4a29a00-3490-449e-b530-9b699cfa1101",
      "title": "Operation Carousel: Circular Trade Laundering",
      "description": "Suspected round-tripping carousel moving funds between BVI and London.",
      "status": "in_progress",
      "priority": "critical",
      "createdBy": "e8a93902-86ec-49c7-876a-360ecb3524b0",
      "assignedTo": "e8a93902-86ec-49c7-876a-360ecb3524b0",
      "nodeIds": ["ACC-CYCLE-01", "ACC-CYCLE-02", "ACC-CYCLE-03"],
      "findingsCount": 3,
      "createdAt": "2026-11-01T10:00:00.000Z"
    }
  ]
}
```

- **Method**: `POST`
- **Path**: `/api/investigations`
- **Request Body**:
```json
{
  "title": "Smurfing Ring Alpha Detection",
  "description": "10 structured deposits under $10,000 threshold within 48h.",
  "status": "open",
  "priority": "high",
  "nodeIds": ["ACC-SMURF-AGG-01", "ACC-SMURF-01", "ACC-SMURF-02"]
}
```
- **Response (201 Created)**: Returns the persisted investigation entity.

### 5.2 Case Findings
- **Method**: `GET`
- **Path**: `/api/investigations/:id/findings`
- **Method**: `POST`
- **Path**: `/api/investigations/:id/findings`
- **Request Body**:
```json
{
  "title": "Sub-threshold Structural Velocity",
  "description": "Accumulation of $95,550 via 10 distinct cash accounts.",
  "severity": "critical",
  "status": "confirmed",
  "nodeIds": ["ACC-SMURF-AGG-01", "ACC-SMURF-01"],
  "edgeIds": ["TX-SMURF-001", "TX-SMURF-002"],
  "metadata": {
    "totalVolume": 95550.00,
    "timespanHours": 48
  }
}
```

### 5.3 Collaborative Notes
- **Method**: `GET`
- **Path**: `/api/investigations/:id/notes`
- **Method**: `POST`
- **Path**: `/api/investigations/:id/notes`
- **Request Body**:
```json
{
  "content": "Requested FinCEN SAR filing on Account ACC-CYCLE-01.",
  "isPinned": true
}
```

---

## 6. Dataset Ingestion & Evaluation Endpoints

### 6.1 Upload & Ingest CSV Transactions
- **Method**: `POST`
- **Path**: `/api/datasets/import`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (CSV file with transaction records)
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "datasetId": "d9812a00-1122-3344-5566-778899aabbcc",
    "totalRowsProcessed": 3200,
    "validTransactionsIngested": 3200,
    "invalidRows": [],
    "newAccountsCreated": 700,
    "graphUpdated": true
  }
}
```
- **Response (400 Bad Request on Schema Errors)**:
```json
{
  "success": false,
  "error": "CSV Validation Failed",
  "details": {
    "errorCount": 2,
    "errors": [
      { "row": 14, "field": "amount", "message": "Amount must be greater than 0" },
      { "row": 89, "field": "timestamp", "message": "Invalid ISO 8601 datetime format" }
    ]
  }
}
```

### 6.2 Benchmark Evaluation Suite
- **Method**: `POST`
- **Path**: `/api/evaluation/run`
- **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-11-16T15:30:00.000Z",
    "dataset": { "accounts": 700, "transactions": 3200 },
    "metrics": {
      "cycleDetection": {
        "groundTruthCycles": 3,
        "detectedCycles": 3,
        "precision": 1.0,
        "recall": 1.0,
        "f1Score": 1.0,
        "latencyMs": 14.8
      },
      "smurfingDetection": {
        "groundTruthMules": 10,
        "detectedMules": 10,
        "precision": 0.952,
        "recall": 1.0,
        "f1Score": 0.975,
        "latencyMs": 8.3
      },
      "communityDetection": {
        "groundTruthCommunities": 2,
        "detectedCommunities": 2,
        "modularity": 0.684,
        "purity": 0.98,
        "latencyMs": 31.4
      }
    }
  }
}
```

---

## 7. WebSocket Collaboration Protocol (Socket.IO)

The real-time collaboration gateway establishes an authenticated session over WebSocket.

### 7.1 Connection Handshake
- **Transport**: `websocket` or `polling`
- **Auth Query / Header**:
```javascript
const socket = io("http://localhost:4000", {
  auth: { token: "Bearer eyJhbGciOiJIUzI1NiIs..." }
});
```

### 7.2 Event Catalog

| Event Name | Direction | Payload Schema | Description |
|---|:---:|---|---|
| `investigation:join` | Client ➔ Server | `{ "investigationId": string }` | Join room for specified investigation case |
| `investigation:leave` | Client ➔ Server | `{ "investigationId": string }` | Gracefully exit investigation room |
| `investigation:presence` | Client ➔ Server | `{ "investigationId": string, "activity": string, "cursor": { "x": number, "y": number } }` | Transmit cursor position or active panel |
| `investigation:graph-selection` | Client ➔ Server | `{ "investigationId": string, "selectedNodeId"?: string, "highlightedPath"?: string[] }` | Broadcast node selection or path focus |
| `investigation:presence-list` | Server ➔ Client | `{ "investigationId": string, "users": UserPresence[] }` | Full array of active investigators in room |
| `investigation:user-joined` | Server ➔ Client | `{ "investigationId": string, "user": UserPresence }` | Peer joined room notification |
| `investigation:user-left` | Server ➔ Client | `{ "investigationId": string, "userId": string }` | Peer exited room notification |
| `investigation:graph-selection` | Server ➔ Client | `{ "selectedNodeId": string, "userName": string, "color": string }` | Peer selection overlay on graph canvas |
| `investigation:note-created` | Server ➔ Client | `{ "investigationId": string, "note": object, "author": string }` | Real-time note feed append |
| `investigation:status-updated` | Server ➔ Client | `{ "investigationId": string, "status": string, "updatedBy": string }` | Immediate case status synchronization |
