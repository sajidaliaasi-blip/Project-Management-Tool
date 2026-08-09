const socketIO = require('socket.io');

let io;

module.exports = {
  init: (server) => {
    io = socketIO(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      // Join project room
      socket.on('join-project', (projectId) => {
        socket.join(`project-${projectId}`);
        console.log(`Socket ${socket.id} joined project ${projectId}`);
      });

      // Leave project room
      socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);
        console.log(`Socket ${socket.id} left project ${projectId}`);
      });

      // Handle task updates
      socket.on('task-updated', (data) => {
        io.to(`project-${data.projectId}`).emit('task-updated', data);
      });

      // Handle task created
      socket.on('task-created', (data) => {
        io.to(`project-${data.projectId}`).emit('task-created', data);
      });

      // Handle task deleted
      socket.on('task-deleted', (data) => {
        io.to(`project-${data.projectId}`).emit('task-deleted', data);
      });

      // Handle new comment
      socket.on('new-comment', (data) => {
        io.to(`project-${data.projectId}`).emit('new-comment', data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};