const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const port = 3000;
const app = express();

app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true
}));

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3002',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const channelMessages = {
  channel1: [],
  channel2: [],
  channel3: [],
  channel4: [],
  channel5: []
};

const channelUsers = {
  channel1: [],
  channel2: [],
  channel3: [],
  channel4: [],
  channel5: []
};

io.on('connection', (socket) => {
  const { username, channel } = socket.handshake.query;

  socket.join(channel);
  
  // Check if channelUsers[channel] is undefined and initialize it as an empty array
  if (!channelUsers[channel]) {
    channelUsers[channel] = [];
  }
  
  channelUsers[channel].push({ username, isConnected: true, isTyping: false, socketId: socket.id });

  console.log(`L'utilisateur ${username} s'est connecté au channel ${channel}`);

  io.to(channel).emit('chat message', { username: 'System', msg: `${username} s'est connecté` });

  socket.emit('previous messages', channelMessages[channel]);
  socket.emit('current users', channelUsers[channel]);

  socket.on('chat message', ({ message, isTyping }) => {
    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const messageData = {
        id: Date.now(),
        username,
        timestamp: formattedTime,
        msg: message,
        isTyping,
        edited: false, // Nouveau champ pour vérifier si le message a été modifié.
    };
    channelMessages[channel].push(messageData);

    io.to(channel).emit('chat message', messageData);

    channelUsers[channel] = channelUsers[channel].map(user => {
      if (user.username === username) {
        return { ...user, isConnected: true, isTyping };
      }
      return user;
    });

    if (isTyping) {
      socket.broadcast.to(channel).emit('typing notification', { username, isTyping });
    }
  });

  socket.on('edit message', ({ messageId, newMessage }) => {
    const messageIndex = channelMessages[channel].findIndex(message => message.id === messageId);
    if (messageIndex !== -1) {
      const oldMessage = channelMessages[channel][messageIndex];
      channelMessages[channel][messageIndex].msg = newMessage;
      channelMessages[channel][messageIndex].edited = true; // Indiquez que le message a été modifié.
      io.to(channel).emit('edit message', { messageId, newMessage, username, oldMessage });
    }
  });
  

  socket.on('delete message', messageId => {
    const messageIndex = channelMessages[channel].findIndex(message => message.id === messageId);
    if (messageIndex !== -1) {
      const deletedMessage = channelMessages[channel].splice(messageIndex, 1)[0];
      io.to(channel).emit('delete message', messageId);
      io.to(channel).emit('chat message', { username: 'System', msg: `${deletedMessage.username} a supprimé le message` });
    }
  });

  socket.on('user typing', ({ isTyping }) => {
    channelUsers[channel] = channelUsers[channel].map(user => {
      if (user.username === username) {
        return { ...user, isConnected: true, isTyping };
      }
      return user;
    });

    socket.broadcast.to(channel).emit('typing notification', { username, isTyping });
  });


  socket.on('private message', ({ message, recipient }) => {
    const timestamp = new Date();
    const formattedTime = timestamp.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  
    const privateMessageData = {
      id: Date.now(),
      username,
      timestamp: formattedTime,
      msg: message,
      isPrivate: true, // Indicateur pour déterminer si le message est privé
    };
  
    // Trouver le destinataire dans la liste des utilisateurs connectés
    const recipientUser = channelUsers[channel].find(user => user.username === recipient);
  
    // Si le destinataire est trouvé, envoyez-lui le message privé
    if (recipientUser) {
      socket.to(recipientUser.socketId).emit('private message', privateMessageData);
    }
  });
  

  socket.on('disconnect from channel', () => {
    console.log(`User ${username} has left the channel ${channel}`);
    socket.leave(channel);

    const disconnectedUserIndex = channelUsers[channel].findIndex(user => user.username === username);
    if (disconnectedUserIndex !== -1) {
      channelUsers[channel].splice(disconnectedUserIndex, 1);
    }

    io.to(channel).emit('chat message', { username: 'System', msg: `${username} s'est déconnecté` });
    io.to(channel).emit('current users', channelUsers[channel]);
  });
});

server.listen(port, () => console.log(`Le serveur écoute sur le port ${port}`));