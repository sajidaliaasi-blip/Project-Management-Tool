import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true
    });
  }
  return socket;
};

export const joinProject = (projectId) => {
  const s = getSocket();
  s.emit('join-project', projectId);
};

export const leaveProject = (projectId) => {
  const s = getSocket();
  s.emit('leave-project', projectId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
