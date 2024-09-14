import toast from 'react-hot-toast';

const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class RTCHandler {
  constructor(meeting_name, username, socket, setPeers, onError) {
    this.meeting_name = meeting_name;
    this.username = username;
    this.socket = socket;
    this.localStream = null;
    this.peerConnections = {};
    this.setPeers = setPeers;
    this.mediaEnabled = { video: true, audio: true };
    this.hasMediaDevices = false;
    this.onError = onError;
  }

  async initialize() {
    await this.initializeLocalStream();
    this.setupSocketListeners();
    const response = await fetch(`${apiUrl}/api/users/${this.meeting_name}`);
    if (!response.ok) {
      this.onError('Failed to fetch users. Please try again.');
      return;
    }
    const users = await response.json();
    this.handleUsers(users);
  }

  async initializeLocalStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.hasMediaDevices = true;

      // Log out details of the localStream
      console.log("Local Stream:", this.localStream);

      this.localStream.getTracks().forEach(track => {
        console.log(`Track kind: ${track.kind}, Track ID: ${track.id}, Track enabled: ${track.enabled}`);
      });
    } catch (err) {
      console.warn('No media devices found or access denied:', err);
      toast.error('No media devices found or access denied. Continuing without video/audio.');
      // Create an empty MediaStream to avoid issues with peer connections
      this.localStream = new MediaStream();
      this.hasMediaDevices = false;
    }
  }

  setupSocketListeners() {
    this.socket.on('user_joined', this.handleUserJoined);
    this.socket.on('user_left', this.handleUserLeft);
    this.socket.on('offer', this.handleOffer);
    this.socket.on('answer', this.handleAnswer);
    this.socket.on('ice_candidate', this.handleNewICECandidateMsg);
  }

  createPeerConnection = (peerUsername) => {
    if (!this.localStream) {
      console.error('Local stream not available');
      return null;
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: process.env.REACT_APP_TURN_SERVER_USERNAME,
          credential: process.env.REACT_APP_TURN_SERVER_CREDENTIALS,
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: process.env.REACT_APP_TURN_SERVER_USERNAME,
          credential: process.env.REACT_APP_TURN_SERVER_CREDENTIALS,
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: process.env.REACT_APP_TURN_SERVER_USERNAME,
          credential: process.env.REACT_APP_TURN_SERVER_CREDENTIALS,
        },
        // {
        //   urls: "turns:global.relay.metered.ca:443?transport=tcp",
        //   username: process.env.REACT_APP_TURN_SERVER_USERNAME,
        //   credential: process.env.REACT_APP_TURN_SERVER_CREDENTIALS,
        // },
        // { urls: 'stun:stun.l.google.com:19302' },
      ]
    });

    pc.onicecandidate = (event) => this.handleICECandidateEvent(event, peerUsername);
    pc.ontrack = (event) => this.handleTrackEvent(event, peerUsername);

    this.localStream.getTracks().forEach(track => {
      pc.addTrack(track, this.localStream);
    });

    this.peerConnections[peerUsername] = pc;

    return pc;
  }

  handleUserJoined = ({ username: peerUsername, users }) => {
    console.log(`${peerUsername} joined the room. Current users:`, users);
    this.updatePeers({ [peerUsername]: { stream: null } });
  }

  handleUserLeft = ({ username: peerUsername }) => {
    console.log(`${peerUsername} left the room`);
    if (this.peerConnections[peerUsername]) {
      this.peerConnections[peerUsername].close();
      delete this.peerConnections[peerUsername];
    }
    this.setPeers(prevPeers => {
      const newPeers = { ...prevPeers };
      delete newPeers[peerUsername];
      return newPeers;
    });
  }

  handleOffer = async ({ offer, from: peerUsername }) => {
    console.log(`Received offer from ${peerUsername}`);
    const pc = this.peerConnections[peerUsername] || this.createPeerConnection(peerUsername);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.socket.emit('answer', {
          meeting_name: this.meeting_name,
          answer: pc.localDescription,
          from: this.username,
          to: peerUsername
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    }
  }

  handleAnswer = async ({ answer, from: peerUsername }) => {
    console.log(`Received answer from ${peerUsername}`);
    const pc = this.peerConnections[peerUsername];
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error('Error handling answer:', err);
      }
    }
  }

  handleICECandidateEvent = (event, peerUsername) => {
    if (event.candidate) {
      console.log(`Sending ICE candidate to ${peerUsername}`);
      this.socket.emit('ice_candidate', {
        meeting_name: this.meeting_name,
        candidate: event.candidate,
        from: this.username,
        to: peerUsername
      });
    }
  }

  handleNewICECandidateMsg = async ({ candidate, from: peerUsername }) => {
    console.log(`Received ICE candidate from ${peerUsername}`);
    const pc = this.peerConnections[peerUsername];
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  }

  handleTrackEvent = (event, peerUsername) => {
    console.log(`Received tracks from ${peerUsername}:`, event.streams);
    this.updatePeers({ [peerUsername]: { stream: event.streams[0] } });
  }

  handleUsers = (users) => {
    console.log('Received users list:', users);
    users.forEach(user => {
      if (user !== this.username && !this.peerConnections[user]) {
        console.log(`Creating peer connection for ${user}`);
        const pc = this.createPeerConnection(user);
        if (pc) {
          pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .then(() => {
              this.socket.emit('offer', {
                meeting_name: this.meeting_name,
                offer: pc.localDescription,
                from: this.username,
                to: user
              });
            })
            .catch(err => console.error('Error creating offer:', err));
        }
      }
    });
  }

  updatePeers = (update) => {
    if (this.setPeers) {
      this.setPeers(prevPeers => ({...prevPeers, ...update}));
    }
  }

  toggleMedia(trackType, enabled) {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (track.kind === trackType) {
          track.enabled = enabled;
          this.mediaEnabled[trackType] = enabled;
        }
      });
    }
  }

  toggleVideo(enabled) {
    this.toggleMedia('video', enabled);
  }

  toggleAudio(enabled) {
    this.toggleMedia('audio', enabled);
  }

  cleanup() {
    this.localStream?.getTracks().forEach(track => track.stop());
    Object.values(this.peerConnections).forEach(pc => pc.close());
  }
}

export default RTCHandler;
