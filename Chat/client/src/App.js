import React, { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './App.css';
import LoginPage from './LoginPage';
import { auth } from './firebase';

const ENDPOINT = 'http://localhost:3000';

function App() {
  const [username, setUsername] = useState('');
  const [channel, setChannel] = useState('');
  const [socket, setSocket] = useState(null);
  const [response, setResponse] = useState([]);
  const [input, setInput] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [lastInput, setLastInput] = useState('');
  const [isNotificationActive, setIsNotificationActive] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMessageInput, setEditMessageInput] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchUser, setSearchUser] = useState('');
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);

  // Ajoutez cette fonction pour gérer la connexion de l'utilisateur
  const handleLogin = (username) => {
    setUsername(username);
    setUser({ username });
  };


  const connectSocket = () => {
    if (username !== '' && channel !== '') {
      const newSocket = socketIOClient(ENDPOINT, {
        query: { username, channel },
      });

      setSocket(newSocket);
    }
  };

  const onSaveMessage = (messageId, newMessage) => {
    // Emit the 'edit message' event to the server
    socket.emit('edit message', { messageId, newMessage });
    
    // Reset the editMessageId
    setEditMessageId(null);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
        setUsername(authUser.displayName); // Utilisez le pseudo de l'utilisateur Google
      } else {
        setUser(null);
        setUsername(''); // Remettez le nom d'utilisateur à une chaîne vide si l'utilisateur se déconnecte
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  useEffect(() => {
    if (socket) {
      if (input.trim() !== '') {
        socket.emit('user typing', { isTyping: true });
      } else {
        socket.emit('user typing', { isTyping: false });
      }
      setLastInput(input);
    }
  }, [socket, input, lastInput]);

  useEffect(() => {
    if (socket) {
      socket.off('chat message');
      socket.off('private message');
      socket.off('previous messages');
      socket.off('current users');
      socket.off('typing notification');
      socket.off('edit message');
      socket.off('delete message');

      socket.on('chat message', messageData => {
        setResponse(oldMessages => [...oldMessages, messageData]);
        if (messageData.username !== username) {
          const notification = `${messageData.username} a envoyé un nouveau message`;
          toast.info(notification);
          setIsNotificationActive(true);
        }
      });

      socket.on('private message', messageData => {
        setResponse(oldMessages => [...oldMessages, messageData]);
        if (messageData.username !== username) {
          const notification = `${messageData.username} vous a envoyé un message privé`;
          toast.info(notification);
          setIsNotificationActive(true);
        }
      });

      socket.on('previous messages', messages => {
        setResponse(oldMessages => [...oldMessages, ...messages]);
      });

      socket.on('current users', users => {
        setConnectedUsers(users);
      });

      socket.on('typing notification', ({ username, isTyping }) => {
        setConnectedUsers(prevUsers =>
          prevUsers.map(user => {
            if (user.username === username) {
              return { ...user, isTyping };
            }
            return user;
          })
        );
      });

      socket.on('edit message', ({ messageId, newMessage }) => {
        setResponse(oldMessages =>
          oldMessages.map(message => {
            if (message.id === messageId) {
              return { ...message, msg: newMessage, edited: true }; // Indiquez que le message a été modifié.
            }
            return message;
          })
        );
      });

      socket.on('delete message', messageId => {
        setResponse(oldMessages =>
          oldMessages.filter(message => message.id !== messageId)
        );
      });

      return () => {
        socket.off('chat message');
        socket.off('private message');
        socket.off('previous messages');
        socket.off('current users');
        socket.off('typing notification');
        socket.off('edit message');
        socket.off('delete message');
      };
    }
  }, [socket]);

  useEffect(() => {
    let titleInterval;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsNotificationActive(false);
        clearInterval(titleInterval);
        document.title = 'Chat App';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (isNotificationActive) {
      titleInterval = setInterval(() => {
        document.title = document.title === 'Nouveau message' ? 'Chat App' : 'Nouveau message';
      }, 1000);
    } else {
      document.title = 'Chat App';
    }

    return () => {
      clearInterval(titleInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.title = 'Chat App';
    };
  }, [isNotificationActive]);

  const disconnectFromChannel = () => {
    if (socket) {
      socket.emit('disconnect from channel');
      setSocket(null);
    }
  };

  const sendMessage = () => {
    if (socket && input.trim() !== '') {
      if (editMessageId) {
        socket.emit('edit message', { messageId: editMessageId, newMessage: input });
        setEditMessageId(null);
        setEditMessageInput('');
      } else if (selectedUser) {
        socket.emit('private message', {
          message: input,
          recipient: selectedUser.username,
        });
      } else {
        socket.emit('chat message', { message: input, isTyping: false });
      }
      setInput('');
    }
  };

  const editMessage = (messageId, message) => {
    setEditMessageId(messageId);
    setEditMessageInput(message);
    setInput(message);
  };

  const cancelEditMessage = () => {
    setEditMessageId(null);
    setEditMessageInput('');
    setInput('');
  };

  const deleteMessage = messageId => {
    if (socket) {
      socket.emit('delete message', messageId);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = e => {
    setInput(e.target.value);
  };

  const selectUser = user => {
    setSelectedUser(user);
  };

  const deselectUser = () => {
    setSelectedUser(null);
  };

  const handleSearchUser = e => {
    setSearchUser(e.target.value);
  };

  const filteredUsers = connectedUsers.filter(user =>
    user.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="App">
      {user ? (
        <>
          {!socket && (
            <div className="user-list" style={{ position: 'relative' }}>
              <label>Username: </label>
              <input value={username} onChange={e => setUsername(e.target.value)} />
              <label>Channel: </label>
              <select value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="">Select a channel...</option>
                <option value="channel1">Channel 1</option>
                <option value="channel2">Channel 2</option>
                <option value="channel3">Channel 3</option>
                <option value="channel4">Channel 4</option>
                <option value="channel5">Channel 5</option>
              </select>
              <button onClick={connectSocket}>Connect</button>
            </div>
          )}

          {socket && (
            <div>
              <div className="user-list">
                <label>Users connected: </label>
                <input
                  type="text"
                  placeholder="Search user..."
                  value={searchUser}
                  onChange={handleSearchUser}
                />
                <ul>
                  {filteredUsers.map((user, idx) => (
                    <li key={idx}>
                      <div
                        className={`user-status ${user.isConnected ? 'online' : 'offline'}`}
                      ></div>
                      {user.username}
                      {user.username !== username && (
                        <button onClick={() => selectUser(user)}>Message privé</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="separator"></div>
              <ul className="message-list">
                <TransitionGroup>
                  {response.map((messageData, idx) => (
                    <CSSTransition key={idx} timeout={500} classNames="message">
                      <li className="message-line">
                      <span className="timestamp">{messageData.timestamp}</span>
                      <strong>{messageData.username}:</strong>
                      {editMessageId === messageData.id ? (
                          <div>
                            <input
                              type="text"
                              value={editMessageInput}
                              onChange={e => setEditMessageInput(e.target.value)}
                            />
                            <button onClick={() => onSaveMessage(editMessageId, editMessageInput)}>Enregistrer</button>
                            <button onClick={cancelEditMessage}>Annuler</button>
                          </div>
                        ) : (
                          <div>
                            &nbsp;{messageData.msg}
                            {messageData.isPrivate && <span> (MP)</span>} {/* Ajout de l'indication de MP */}
                            {messageData.edited && <span> (Modifié)</span>}
                            {messageData.username === username && (
                              <div className="message-options">
                                <button onClick={() => editMessage(messageData.id, messageData.msg)}>
                                  Modifier
                                </button>
                                <button onClick={() => deleteMessage(messageData.id)}>
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    </CSSTransition>
                  ))}
                </TransitionGroup>
              </ul>
              {selectedUser && (
                <div className="private-message">
                  <strong>Message privé avec {selectedUser.username}</strong>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={deselectUser}>Annuler</button>
                  <button onClick={sendMessage}>Envoyer</button>        
                </div>
              )}
              {!selectedUser && (
                <div>
                  <label>Message: </label>
                  <input
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={sendMessage}>
                    {editMessageId ? 'Modifier' : 'Envoyer'}
                  </button>
                  &nbsp; {}
                  <button onClick={disconnectFromChannel}>Déconnexion</button>
                </div>
              )}
            </div>
          )}
          <ToastContainer />
          <p><strong>© 2023, TROISE Adrien</strong></p>
        </>
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;