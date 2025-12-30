# Audit Trail Backend Service
### Backend Internship Take-Home Assignment

## 1. Deliverables Summary
This repository contains all required deliverables as specified in the assignment:

- **Fully working backend code**: Implemented using Node.js/Express.
- **Clear instructions**: Steps to run the project locally.
- **Sample API endpoints**: Ready for testing via Postman or Curl.
- **Design Documentation**: Explanations of design, decisions, and scalability (found below).

The backend implements an audit trail system using an **Event Sourcing** approach, enabling historical inspection and time-travel queries.

---

## 2. Problem Overview
In typical CRUD systems, updates overwrite existing data, making it difficult to:
- Track historical changes.
- Inspect previous states.
- Perform audits or debugging.

This assignment requires a backend system that tracks **every change** made to an entity over time and allows reconstructing how the entity looked at any given point in the past.

---

## 3. High-Level Solution
The solution uses **Event Sourcing** with diff-based audit events:
1. Every `Create`, `Update`, or `Delete` action generates an immutable event.
2. Only the changed fields (diffs) are stored.
3. The current or past state is reconstructed by replaying events.

This ensures full traceability, auditability, and deterministic reconstruction.

---

## 4. Data Model and Design Rationale (Mandatory)

### 4.1 Project Entity
The core business entity is **Project**.

- **`id`**: Unique identifier.
- **`data`**: Flexible JSON object holding project information.

**Rationale:**
- The `data` field is intentionally schema-less to support arbitrary attributes.
- Keeps the focus of the assignment on audit logic rather than domain modeling.

### 4.2 AuditEvent Entity
Every change to a Project generates an **AuditEvent**.

- **`entityType`**: Type of entity (Project).
- **`entityId`**: Reference to the Project.
- **`action`**: Enum (`create`, `update`, `delete`).
- **`timestamp`**: Date/Time when the change occurred.
- **`diff`**: Object containing only changed fields.

Each diff stores both the **old value** and the **new value**.

**Why this model was chosen:**
- Prevents duplication of full object snapshots.
- Enables precise historical inspection.
- Keeps storage efficient.
- Aligns naturally with Event Sourcing principles.

---

## 5. How Diffs Are Computed (Mandatory)
Diffs are computed by comparing the **existing project data** against the **incoming update payload**.

**Logic:**
For each field:
- If the value has changed, it is added to the diff.
- Unchanged fields are ignored.

**Example Behavior:**
- **Old value:** `name = "Alpha"`
- **New value:** `name = "Beta"`
- **Stored diff:**
```json
{
  "name": { 
    "old": "Alpha", 
    "new": "Beta" 
  }
}
```

This ensures only meaningful changes are recorded, minimizing data storage and providing clear visibility into exactly what changed.

---

## 6. How State Reconstruction Works (Mandatory)
To reconstruct the state of a Project at a specific timestamp, the system follows this algorithm:

1. **Fetch** all audit events for the project.
2. **Filter** events up to the requested time.
3. **Sort** events in chronological order.
4. **Start** with an empty state.
5. **Apply** each diff sequentially.
6. **Produce** the final reconstructed state.

*Note: Delete events terminate reconstruction and return a null state.*

**Why this works:**
- Events are immutable.
- Order guarantees deterministic replay.
- Reconstruction always yields the same result, enabling true time-travel queries.

---

## 7. API Capabilities and Sample Calls
The backend exposes RESTful APIs for the following operations:

### Capabilities
- Creating, Updating, and Deleting a project.
- Fetching full audit history.
- Reconstructing state at a specific timestamp.
- Comparing state between two timestamps.

### Sample Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/projects` | Create a new project |
| `PATCH` | `/api/projects/:id` | Update an existing project |
| `GET` | `/api/projects/:id/history` | Get full audit log |
| `GET` | `/api/projects/:id/reconstruct` | Get state at `?time=ISO_TIMESTAMP` |
| `GET` | `/api/projects/:id/compare` | Compare `?t1=ISO&t2=ISO` |

---

## 8. System Behavior at Scale (Mandatory)

### Write Performance
- Events are **append-only**.
- No overwrites or locks are required.
- Writes remain fast even with large datasets.

### Read Performance
- Reconstruction cost grows linearly with the number of events.
- Indexed timestamps reduce query overhead.
- Reads are deterministic and safe.

### Scalability Options
- **Horizontal Scaling**: Supported due to stateless logic.
- **Snapshotting**: Can be introduced to optimize long event chains.
- **Caching**: Reconstructed states can be cached.

---

## 9. Design Decision I Am Not Fully Satisfied With (Mandatory)
One design decision I am not fully satisfied with is **on-the-fly reconstruction for every historical query**.

**Limitations:**
- Reconstruction becomes slower for very long event chains (e.g., thousands of updates).
- Incurs repeated reconstruction work for frequently queried states.

**Potential Improvement:**
- Introduce **periodic snapshots** (e.g., save the full state every 50 events).
- Replay only events occurring *after* the last snapshot.
- This trades off a small amount of storage for significantly faster reads.

*This limitation was intentionally accepted to keep the initial design simple and transparent.*

---

## 10. Project Structure

```text
audit-trail-system
│
├── backend
│   ├── src
│   │   ├── config
│   │   ├── models
│   │   ├── controllers
│   │   ├── routes
│   │   ├── utils
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
```

---

## 11. How to Run the Project Locally

### Prerequisites
- Node.js installed
- MongoDB installed and running

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/audit_db
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

The backend will be available on `http://localhost:5000`.