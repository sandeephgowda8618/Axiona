# Axiona Video Conference System - Complete Architecture & Implementation Guide

## 🧠 1. Overall Architecture

Your stack now looks like this:

```
┌────────────────────────────────────────────┐
│                 FRONTEND (React)           │
│  • WebRTC (P2P audio/video)                │
│  • Socket.IO client (signaling + chat)     │
│  • Firebase Auth SDK (login, tokens)       │
└────────────────────────────────────────────┘
                ↓   ↑ (JWT / signaling)
┌────────────────────────────────────────────┐
│             BACKEND (Node + Express)       │
│  • Socket.IO signaling server              │
│  • Express REST routes                     │
│  • Firebase Admin SDK (token verification) │
│  • MongoDB (meetings, messages, users)     │
│  • coturn (TURN/STUN for connectivity)     │
└────────────────────────────────────────────┘
                ↓   ↑ (media ICE)
┌────────────────────────────────────────────┐
│           PEER CONNECTIONS (WebRTC)        │
│  • Direct browser ↔ browser media streams   │
│  • Uses TURN/STUN relay if NAT/firewall     │
└────────────────────────────────────────────┘
```

## 🔐 2. Authentication Flow (Firebase Integration)

You already use Firebase Auth for login. Here's how it ties into your conference logic:

### Flow:
1. **User logs in via Firebase (frontend)**: Firebase issues an ID Token (JWT)
2. **React app sends this token when connecting to Socket.IO**:
   ```javascript
   socket = io(serverUrl, { auth: { token: firebaseToken } });
   ```
3. **Backend verifies it using the Firebase Admin SDK**:
   - On connection, verify the token
   - Extract the uid and displayName
   - If valid, allow the connection; otherwise reject
4. **Meetings and chats are tied to the Firebase UID** — no need to manage separate user accounts in MongoDB

### Result:
- ✅ Secure, real-user-only access to meetings
- ✅ Works seamlessly even offline (Firebase handles re-auth)

## 🎥 3. Video Conference Flow (WebRTC + Socket.IO)

**Goal**: Enable 1-to-1 and small group calls locally.

### Flow:

1. **User joins a room**:
   - Client emits `join-room` with `{roomId, uid, displayName}`

2. **Server tracks participants**:
   - Keeps an array of connected peers
   - Broadcasts `user-joined` event

3. **Peer connection negotiation**:
   - WebRTC peer creates an "offer"
   - Sends offer via Socket.IO
   - Remote peer responds with "answer"
   - ICE candidates exchanged via Socket.IO

4. **Media streaming begins**:
   - Each peer's `getUserMedia()` adds tracks (audio/video)
   - Direct P2P connection formed
   - If P2P fails (e.g., school network), TURN server relays

## 🌐 4. Connectivity Layer (STUN/TURN)

Since you're self-hosting:

### Install coturn:
```bash
sudo apt install coturn
```

### Enable TURN in your ICE config:
```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'turn:your.server.ip:443', username: 'user', credential: 'pass' }
]
```

### Result:
- ✅ Even behind firewalls, students can connect

## 💬 5. Chat + Reactions + Hand Raise

All handled via Socket.IO, separate from the WebRTC stream.

### Flow:

1. **When a user sends a chat message** → emit `message` event
2. **Backend stores it temporarily or in MongoDB**
3. **When a new user joins** → backend sends the last 100 messages (for history)

### Similar events for:
- `reaction` → broadcast emoji overlay
- `hand_raise` → show notification to host
- `user_typing`, `user_muted`, etc. (optional)

### Persistence:
```javascript
Message.create({ roomId, userId, text, timestamp });
```
Then fetch recent ones on join.

## 👥 6. Participants and Roles

Maintain a participant state per meeting.

| Role   | Privileges                    |
|--------|-------------------------------|
| Host   | Mute others, end meeting      |
| Member | Mute self, share screen       |
| Guest  | Listen-only (optional)        |

### Logic:
- Backend keeps `roomParticipants[roomId]`
- Broadcast updates on every join/leave
- React maintains a local list for UI display

## 🖥️ 7. Screen Sharing and Audio

Use the browser's native API:

```javascript
navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
```

- Add both video + audio tracks to the existing peer connection
- When user stops sharing: Remove screen track and restore camera feed

## 📋 8. Database Layer (MongoDB)

Keep it minimal and useful:

### Meetings Collection
```javascript
{
  meetingId: String,
  topic: String,
  createdBy: String, // Firebase UID
  participants: [String], // Firebase UIDs
  chat: [{
    userId: String,
    message: String,
    timestamp: Date
  }],
  createdAt: Date,
  endedAt: Date,
  isActive: Boolean
}
```

### Users Collection (optional)
Synced from Firebase on first login (uid, email, name)

## 🧩 9. Addressing the "Tiny Gaps"

| Gap                              | Solution Summary                                    |
|----------------------------------|-----------------------------------------------------|
| P2P fails behind firewall       | Install coturn and add TURN creds to ICE config   |
| Mobile Chrome blocks autoplay   | Keep local video muted until user taps to start   |
| >4 users causes lag             | Later integrate mediasoup SFU for multi-stream    |
| Screen share missing audio      | Pass `{audio:true}` in getDisplayMedia()          |
| Chat lost on reload             | Store each message in DB; reload last 100 on join |

All these fixes are local and free.

## 🎨 10. Optional Free Add-ons (Future Enhancements)

| Feature            | Tool                           | Notes                                    |
|--------------------|--------------------------------|------------------------------------------|
| Whiteboard         | Excalidraw self-hosted backend | Runs in Docker; users draw collaboratively |
| File Sharing       | socket.io-stream + Mongo GridFS | Uploads PDFs or slides during meet      |
| Background Blur    | TensorFlow.js BodyPix          | Client-side, no server load             |
| Auth/Access Control| Firebase Auth                  | Already in place — fast and secure      |

## 🔄 11. Typical Runtime Flow (Step-by-Step)

1. User logs in (Firebase)
2. Frontend joins via Socket.IO with token
3. Server verifies token → accepts user
4. User enters meeting → emits "join-room"
5. Server sends list of existing participants
6. Peers perform WebRTC signaling via Socket.IO
7. Direct video/audio streaming starts
8. Chat/reactions handled in parallel channels
9. Meeting data logged in MongoDB
10. User leaves → cleanup + broadcast to others

## ✅ Summary — What You'll Have

| Area            | Tool        | Status |
|-----------------|-------------|--------|
| Authentication  | Firebase    | ✅ ready |
| Video/Audio     | WebRTC      | ✅ peer-to-peer |
| Signaling       | Socket.IO   | ✅ backend-driven |
| TURN/STUN       | coturn      | ✅ local relay |
| Chat/Reactions  | Socket.IO events | ✅ real-time |
| Storage         | MongoDB     | ✅ persistent |
| Deployment      | Docker or Node | ✅ free/local |

---

# 🚀 Implementation Plan - Step by Step Tasks

## Phase 1: Backend Foundation (Week 1)

### Task 1.1: Socket.IO Server Setup
**Time**: 2-3 hours
**Files to create/modify**:
- `server/src/services/socketService.js`
- `server/src/app.js` (add socket.io)
- `server/package.json` (add socket.io dependency)

**Goal**: Basic Socket.IO server with Firebase auth verification

### Task 1.2: Meeting Database Models
**Time**: 1-2 hours
**Files to create**:
- `server/src/models/Meeting.js`
- `server/src/models/Message.js`
- `server/src/models/Participant.js`

**Goal**: MongoDB schemas for meetings, chat, and participants

### Task 1.3: Meeting REST API Routes
**Time**: 2-3 hours
**Files to create**:
- `server/src/routes/meetings.js`
- `server/src/controllers/meetingController.js`

**Goal**: Create, join, list, and end meetings via REST API

## Phase 2: Real-time Communication (Week 2)

### Task 2.1: Socket.IO Event Handlers
**Time**: 4-5 hours
**Files to modify**:
- `server/src/services/socketService.js`

**Events to implement**:
- `join-room`
- `leave-room`
- `offer`
- `answer`
- `ice-candidate`
- `chat-message`

### Task 2.2: Room Management
**Time**: 2-3 hours
**Files to create**:
- `server/src/services/roomService.js`

**Goal**: Track participants, handle join/leave, broadcast events

### Task 2.3: Chat System Backend
**Time**: 2 hours
**Goal**: Store and retrieve chat messages, broadcast to room participants

## Phase 3: Frontend Foundation (Week 3)

### Task 3.1: Socket.IO Client Setup
**Time**: 2-3 hours
**Files to create/modify**:
- `client/src/services/socketService.js`
- `client/src/contexts/SocketContext.tsx`

**Goal**: Connect to backend with Firebase token, handle disconnections

### Task 3.2: Meeting Components Structure
**Time**: 3-4 hours
**Files to create**:
- `client/src/components/Meeting/MeetingRoom.tsx`
- `client/src/components/Meeting/VideoGrid.tsx`
- `client/src/components/Meeting/ChatPanel.tsx`
- `client/src/components/Meeting/ControlBar.tsx`

**Goal**: Basic UI layout for video conference

### Task 3.3: Meeting Pages
**Time**: 2-3 hours
**Files to create**:
- `client/src/pages/MeetingLobby.tsx`
- `client/src/pages/JoinMeeting.tsx`
- `client/src/pages/CreateMeeting.tsx`

**Goal**: Meeting creation and joining flow

## Phase 4: WebRTC Implementation (Week 4)

### Task 4.1: WebRTC Service
**Time**: 6-8 hours
**Files to create**:
- `client/src/services/webrtcService.js`
- `client/src/hooks/useWebRTC.ts`

**Features**:
- Peer connection management
- Media stream handling
- ICE candidate exchange
- Offer/answer handling

### Task 4.2: Video Stream Components
**Time**: 4-5 hours
**Files to create**:
- `client/src/components/Meeting/VideoTile.tsx`
- `client/src/components/Meeting/LocalVideo.tsx`
- `client/src/components/Meeting/RemoteVideo.tsx`

**Goal**: Display local and remote video streams

### Task 4.3: Audio/Video Controls
**Time**: 3-4 hours
**Files to modify**:
- `client/src/components/Meeting/ControlBar.tsx`

**Features**:
- Mute/unmute audio
- Enable/disable video
- Camera/microphone device selection

## Phase 5: Advanced Features (Week 5)

### Task 5.1: Screen Sharing
**Time**: 4-5 hours
**Files to modify**:
- `client/src/services/webrtcService.js`
- `client/src/components/Meeting/ControlBar.tsx`

**Goal**: Share screen with audio support

### Task 5.2: Chat Implementation
**Time**: 3-4 hours
**Files to modify**:
- `client/src/components/Meeting/ChatPanel.tsx`
- `client/src/hooks/useChat.ts`

**Features**:
- Send/receive messages
- Message history
- Typing indicators
- Emoji reactions

### Task 5.3: Participant Management
**Time**: 2-3 hours
**Files to create**:
- `client/src/components/Meeting/ParticipantList.tsx`
- `client/src/hooks/useParticipants.ts`

**Features**:
- Show participant list
- Mute/unmute others (host only)
- Hand raise system

## Phase 6: TURN Server & Production (Week 6)

### Task 6.1: TURN Server Setup
**Time**: 3-4 hours
**Server setup**:
- Install and configure coturn
- Update WebRTC ICE configuration
- Test firewall traversal

### Task 6.2: Error Handling & Reconnection
**Time**: 3-4 hours
**Files to modify**:
- All WebRTC and Socket.IO related files

**Features**:
- Handle connection failures
- Automatic reconnection
- Graceful error messages

### Task 6.3: Performance Optimization
**Time**: 2-3 hours
**Goal**: 
- Optimize video quality based on network
- Implement adaptive bitrate
- Add connection quality indicators

## Phase 7: Polish & Testing (Week 7)

### Task 7.1: UI/UX Polish
**Time**: 4-5 hours
**Goal**: 
- Responsive design
- Loading states
- Smooth animations
- Accessibility features

### Task 7.2: Testing & Bug Fixes
**Time**: 6-8 hours
**Goal**:
- Cross-browser testing
- Mobile testing
- Network condition testing
- Multi-user testing

### Task 7.3: Documentation
**Time**: 2-3 hours
**Files to create**:
- `VIDEO_CONFERENCE_GUIDE.md`
- API documentation
- Deployment guide

---

# 📋 Quick Start Checklist

## Prerequisites
- [ ] MongoDB running
- [ ] Firebase project configured
- [ ] Node.js 18+ installed
- [ ] React development environment ready

## Installation Steps
1. [ ] Install Socket.IO: `npm install socket.io socket.io-client`
2. [ ] Install WebRTC utilities: `npm install simple-peer`
3. [ ] Update Firebase Admin SDK
4. [ ] Create meeting database models
5. [ ] Set up basic Socket.IO server
6. [ ] Create meeting UI components
7. [ ] Implement WebRTC peer connections
8. [ ] Add chat functionality
9. [ ] Set up TURN server
10. [ ] Test and deploy

## Success Metrics
- [ ] 2+ users can join a video call
- [ ] Audio and video work reliably
- [ ] Chat messages are delivered
- [ ] Screen sharing works
- [ ] Works behind firewalls (with TURN)
- [ ] Mobile devices can participate
- [ ] Meetings are persistent in database

---

This architecture provides a solid foundation for a production-ready video conferencing system integrated with your existing Axiona study platform!
