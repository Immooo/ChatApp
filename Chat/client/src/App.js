import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";
import HomePage from "./HomePage";
import { auth } from "./firebase";
import { io } from "socket.io-client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

const ENDPOINT = "http://localhost:3000";

function App() {
  const [username, setUsername] = useState("");
  const [channel, setChannel] = useState("");
  const [socket, setSocket] = useState(null);
  const [response, setResponse] = useState([]);
  const [input, setInput] = useState("");
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [lastInput, setLastInput] = useState("");
  const [isNotificationActive, setIsNotificationActive] = useState(false);
  const [editMessageId, setEditMessageId] = useState(null);
  const [editMessageInput, setEditMessageInput] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchUser, setSearchUser] = useState("");
  const [user, setUser] = useState(null);

  // Add this function to handle user login
  const handleLogin = (username) => {
    setUsername(username);
    setUser({ username });
  };

  const handleLogout = () => {
    auth.signOut();
  };

  const connectSocket = () => {
    if (username !== "" && channel !== "") {
      const newSocket = io(ENDPOINT, {
        query: { username, channel },
      });

      setSocket(newSocket);
    }
  };

  const onSaveMessage = (messageId, newMessage) => {
    // Emit the 'edit message' event to the server
    socket.emit("edit message", { messageId, newMessage });

    // Reset the editMessageId
    setEditMessageId(null);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        setUser(authUser);
        setUsername(authUser.displayName); // Use the username from the Google user
      } else {
        setUser(null);
        setUsername(""); // Reset the username to an empty string if the user logs out
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (socket) {
      if (input.trim() !== "") {
        socket.emit("user typing", { isTyping: true });
      } else {
        socket.emit("user typing", { isTyping: false });
      }
      setLastInput(input);
    }
  }, [socket, input, lastInput]);

  useEffect(() => {
    if (socket) {
      socket.off("chat message");
      socket.off("private message");
      socket.off("previous messages");
      socket.off("current users");
      socket.off("typing notification");
      socket.off("edit message");
      socket.off("delete message");

      socket.on("chat message", (messageData) => {
        setResponse((oldMessages) => [...oldMessages, messageData]);
        if (messageData.username !== username) {
          const notification = `${messageData.username} sent a new message`;
          toast.info(notification);
          setIsNotificationActive(true);
        }
      });

      socket.on("private message", (messageData) => {
        setResponse((oldMessages) => [...oldMessages, messageData]);
        if (messageData.username !== username) {
          const notification = `${messageData.username} sent you a private message`;
          toast.info(notification);
          setIsNotificationActive(true);
        }
      });

      socket.on("previous messages", (messages) => {
        setResponse((oldMessages) => [...oldMessages, ...messages]);
      });

      socket.on("current users", (users) => {
        setConnectedUsers(users);
      });

      socket.on("typing notification", ({ username, isTyping }) => {
        setConnectedUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (user.username === username) {
              return { ...user, isTyping };
            }
            return user;
          })
        );
      });

      socket.on("edit message", ({ messageId, newMessage }) => {
        setResponse((oldMessages) =>
          oldMessages.map((message) => {
            if (message.id === messageId) {
              return { ...message, msg: newMessage, edited: true }; // Indicate that the message has been edited.
            }
            return message;
          })
        );
      });

      socket.on("delete message", (messageId) => {
        setResponse((oldMessages) =>
          oldMessages.filter((message) => message.id !== messageId)
        );
      });

      return () => {
        socket.off("chat message");
        socket.off("private message");
        socket.off("previous messages");
        socket.off("current users");
        socket.off("typing notification");
        socket.off("edit message");
        socket.off("delete message");
      };
    }
  }, [socket]);

  useEffect(() => {
    let titleInterval;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsNotificationActive(false);
        clearInterval(titleInterval);
        document.title = "Chat App";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (isNotificationActive) {
      titleInterval = setInterval(() => {
        document.title =
          document.title === "New Message" ? "Chat App" : "New Message";
      }, 1000);
    } else {
      document.title = "Chat App";
    }

    return () => {
      clearInterval(titleInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.title = "Chat App";
    };
  }, [isNotificationActive]);

  const disconnectFromChannel = () => {
    if (socket) {
      socket.emit("disconnect from channel");
      setSocket(null);
    }
  };

  const sendMessage = () => {
    if (socket && input.trim() !== "") {
      if (editMessageId) {
        socket.emit("edit message", {
          messageId: editMessageId,
          newMessage: input,
        });
        setEditMessageId(null);
        setEditMessageInput("");
      } else if (selectedUser) {
        socket.emit("private message", {
          message: input,
          recipient: selectedUser.username,
        });
      } else {
        socket.emit("chat message", { message: input, isTyping: false });
      }
      setInput("");
    }
  };

  const editMessage = (messageId, message) => {
    setEditMessageId(messageId);
    setEditMessageInput(message);
    setInput(message);
  };

  const cancelEditMessage = () => {
    setEditMessageId(null);
    setEditMessageInput("");
    setInput("");
  };

  const deleteMessage = (messageId) => {
    if (socket) {
      socket.emit("delete message", messageId);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const selectUser = (user) => {
    setSelectedUser(user);
  };

  const deselectUser = () => {
    setSelectedUser(null);
  };

  const handleSearchUser = (e) => {
    setSearchUser(e.target.value);
  };

  const filteredUsers = connectedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <HomePage user={user} onLogout={handleLogout} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route path="/inscription" element={<RegisterPage />} />
        <Route path="/connexion" element={<LoginPage />} />
      </Routes>

      {user && (
        <>
          {!socket && (
            <div className="user-list" style={{ position: "relative" }}>
              <label>Username: </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label>Channel: </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
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
                        className={`user-status ${
                          user.isConnected ? "online" : "offline"
                        }`}
                      ></div>
                      {user.username}
                      {user.username !== username && (
                        <button onClick={() => selectUser(user)}>
                          Private Message
                        </button>
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
                        <span className="timestamp">
                          {messageData.timestamp}
                        </span>
                        <strong>{messageData.username}:</strong>
                        {editMessageId === messageData.id ? (
                          <div>
                            <input
                              type="text"
                              value={editMessageInput}
                              onChange={(e) =>
                                setEditMessageInput(e.target.value)
                              }
                            />
                            <button
                              onClick={() =>
                                onSaveMessage(editMessageId, editMessageInput)
                              }
                            >
                              Save
                            </button>
                            <button onClick={cancelEditMessage}>Cancel</button>
                          </div>
                        ) : (
                          <div>
                            &nbsp;{messageData.msg}
                            {messageData.isPrivate && <span> (PM)</span>}
                            {messageData.edited && <span> (Edited)</span>}
                            {messageData.username === username && (
                              <div className="message-options">
                                <button
                                  onClick={() =>
                                    editMessage(messageData.id, messageData.msg)
                                  }
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteMessage(messageData.id)}
                                >
                                  Delete
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
                  <strong>Private Message with {selectedUser.username}</strong>
                  <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={deselectUser}>Cancel</button>
                  <button onClick={sendMessage}>Send</button>
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
                    {editMessageId ? "Edit" : "Send"}
                  </button>
                  &nbsp;
                  <button onClick={disconnectFromChannel}>
                    Disconnect Channel
                  </button>
                  <button onClick={handleLogout}>Logout Google</button>
                </div>
              )}
            </div>
          )}
          <ToastContainer />
          <p>
            <strong>© 2023, Adrien TROISE</strong>
          </p>
        </>
      )}
    </div>
  );
}

export default App;
