import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import './ChatsPage.scss';
import './AudioPlayer.scss';
import './UserProfile.scss';
import { FaMicrophone, FaStopCircle } from 'react-icons/fa';
import { BsPlusCircleFill } from 'react-icons/bs';
import { IoSend } from 'react-icons/io5';
import AudioPlayer from './AudioPlayer';
import UserProfile from './UserProfile';
import PropTypes from 'prop-types';

// A default avatar for users without a profile picture
const defaultAvatar = 'https://icon-library.com/images/default-user-icon/default-user-icon-13.jpg';

// This should match the address of your backend server
const socket = io('http://localhost:3001');

const ChatsPage = (props) => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState({ isGlobal: true, name: 'Global Chat' });
  const [notifications, setNotifications] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userStatuses, setUserStatuses] = useState({});
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing events with debouncing
  const handleTyping = (e) => {
    setCurrentMessage(e.target.value);
    
    // Emit typing start if not already typing
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing_start', {
        username: props.user.username,
        recipient: selectedChat.isGlobal ? null : selectedChat.username,
        isGlobal: selectedChat.isGlobal
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing_stop', {
        username: props.user.username,
        recipient: selectedChat.isGlobal ? null : selectedChat.username,
        isGlobal: selectedChat.isGlobal
      });
    }, 1000); // Stop typing indicator after 1 second of no input
  };

  useEffect(() => {
    // Fetch all users and their statuses
    axios.get('http://localhost:3001/api/users')
      .then(res => {
        const fetchedUsers = res.data.filter(u => u.username !== props.user.username);
        setUsers(fetchedUsers);
        // Initialize statuses
        const statuses = {};
        res.data.forEach(user => {
          statuses[user.username] = user.status || 'offline';
        });
        setUserStatuses(statuses);
      })
      .catch(err => console.error("Error fetching users:", err));

    socket.emit('user_online', props.user.username);

    socket.on('status_changed', ({ username, status }) => {
      setUserStatuses(prev => ({ ...prev, [username]: status }));
    });

    // Request initial global history
    if(selectedChat.isGlobal) {
      socket.emit('get_chat_history', { isGlobal: true });
    }

    socket.on('chat_history', ({ messages, isGlobal, user }) => {
      // Check if the received history corresponds to the currently selected chat
      if ((isGlobal && selectedChat.isGlobal) || (!isGlobal && selectedChat.username === user)) {
        setMessages(messages);
      }
    });

    socket.on('receive_message', (message) => {
      const { sender, recipient } = message;
      const currentUser = props.user.username;

      // Determine if the message belongs to the current chat
      const inGlobalChat = selectedChat.isGlobal && !recipient;
      const inPrivateChat = !selectedChat.isGlobal &&
        ((sender === currentUser && recipient === selectedChat.username) ||
         (sender === selectedChat.username && recipient === currentUser));

      if (inGlobalChat || inPrivateChat) {
        setMessages((prevMessages) => [...prevMessages, message]);
        // Remove typing indicator when message is received
        setTypingUsers(prev => prev.filter(user => user !== sender));
      } else {
        // It's a message for another chat, so show a notification
        const notificationSource = recipient ? sender : 'Global Chat';
        setNotifications(prev => ({
          ...prev,
          [notificationSource]: (prev[notificationSource] || 0) + 1,
        }));
      }
    });

    // Handle typing indicators
    socket.on('user_typing', (data) => {
      const { username, isGlobal, recipient } = data;
      const currentUser = props.user.username;
      
      // Only show typing indicator if it's for the current chat
      const inGlobalChat = selectedChat.isGlobal && isGlobal;
      const inPrivateChat = !selectedChat.isGlobal && 
        username === selectedChat.username && recipient === currentUser;

      if ((inGlobalChat || inPrivateChat) && username !== currentUser) {
        setTypingUsers(prev => {
          if (!prev.includes(username)) {
            return [...prev, username];
          }
          return prev;
        });
      }
    });

    socket.on('user_stopped_typing', (data) => {
      const { username } = data;
      setTypingUsers(prev => prev.filter(user => user !== username));
    });

    return () => {
      socket.off('status_changed');
      socket.off('chat_history');
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [props.user.username, selectedChat]);

  useEffect(() => {
    // This effect runs when the selected chat changes
    setMessages([]); // Clear messages
    setTypingUsers([]); // Clear typing indicators
    if (selectedChat.isGlobal) {
      socket.emit('get_chat_history', { isGlobal: true });
    } else {
      socket.emit('get_chat_history', { currentUser: props.user.username, otherUser: selectedChat.username });
    }
  }, [selectedChat, props.user.username]);

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    // Clear notifications for the selected chat
    const chatName = chat.isGlobal ? 'Global Chat' : chat.username;
    setNotifications(prev => {
      const newNotifications = { ...prev };
      delete newNotifications[chatName];
      return newNotifications;
    });
  };

  const handleStatusChange = (status) => {
    socket.emit('change_status', { username: props.user.username, status });
  };

  const uploadAndSendFile = async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sender', props.user.username);
    formData.append('recipient', selectedChat.isGlobal ? '' : selectedChat.username);
    formData.append('type', type);
    
    setIsUploading(true);
    try {
      const res = await axios.post('http://localhost:3001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // The backend now handles message creation and socket emission
      console.log('File uploaded successfully:', res.data);
    } catch (err) {
      console.error(`Error uploading ${type}:`, err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSend = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadAndSendFile(file, 'image');
    }
  };

  const startRecording = async () => {
    console.log('Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Got media stream:', stream);
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudio(audioBlob);
        audioChunksRef.current = [];
        // Stop all tracks from the media stream to release the mic
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      console.log('MediaRecorder started');
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingIntervalRef.current);
    }
  };

  const toggleRecording = () => {
    console.log('Toggle recording called, isRecording:', isRecording);
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (currentMessage.trim()) {
      const messageData = {
        type: 'text',
        text: currentMessage,
        sender: props.user.username,
        recipient: selectedChat.isGlobal ? null : selectedChat.username,
        senderProfileImage: props.user.profileImage
      };
      socket.emit('send_message', messageData);
      setCurrentMessage('');
      
      // Stop typing indicator when message is sent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setIsTyping(false);
      socket.emit('typing_stop', {
        username: props.user.username,
        recipient: selectedChat.isGlobal ? null : selectedChat.username,
        isGlobal: selectedChat.isGlobal
      });
    } else if (recordedAudio) {
      // Send the recorded audio
      uploadAndSendFile(recordedAudio, 'record');
      setRecordedAudio(null);
      setRecordingTime(0);
    }
  };

  return (
    <div className="chats-container">
      <div className="sidebar">
        <h3 className="sidebar-header">Users</h3>
        <ul className="user-list">
          <li 
            className={`user-list-item ${selectedChat.isGlobal ? 'selected-chat' : ''}`}
            onClick={() => handleSelectChat({ isGlobal: true, name: 'Global Chat' })}
          >
            <div className="user-info">
              <img src={defaultAvatar} alt="Global" className="avatar" />
              # Global Chat
              {notifications['Global Chat'] > 0 && 
                <span className="notification-badge">{notifications['Global Chat']}</span>}
            </div>
          </li>
          {users.map(user => {
            const status = userStatuses[user.username] || 'offline';
            return (
              <li 
                key={user._id} 
                className={`user-list-item ${selectedChat._id === user._id ? 'selected-chat' : ''}`}
                onClick={() => handleSelectChat(user)}
              >
                <div className="user-info">
                  <div className="avatar-wrapper">
                    <img src={user.profileImage || defaultAvatar} alt={user.username} className="avatar" />
                    <span className={`status-indicator ${status}`}></span>
                  </div>
                  {user.username}
                  <div className="user-status-container">
                    {notifications[user.username] > 0 &&
                      <span className="notification-badge">{notifications[user.username]}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <UserProfile 
          user={{...props.user, status: userStatuses[props.user.username]}} 
          onStatusChange={handleStatusChange} 
        />
      </div>
      <div className="chat-area">
        <div className="header">
          <h3>{selectedChat.name || selectedChat.username}</h3>
          <div className="current-user-info">
            <p>Welcome, {props.user.username}!</p>
            <img src={props.user.profileImage || defaultAvatar} alt="My Avatar" className="avatar" />
          </div>
        </div>
        <div className="messages-container">
          {messages.map((msg, index) => {
            const senderUser = users.find(u => u.username === msg.sender) || (msg.sender === props.user.username ? props.user : {});
            return (
              <div
                key={index}
                className={`message-bubble ${msg.sender === props.user.username ? 'my-message' : 'other-message'}`}
              >
                <img 
                  src={senderUser.profileImage || defaultAvatar} 
                  alt={msg.sender} 
                  className="avatar message-avatar" 
                />
                <div className="message-content">
                  <div className="message-header">
                    <strong>{msg.sender}</strong>
                    <span className="timestamp">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {msg.type === 'text' && <p className="message-text">{msg.text}</p>}
                  {msg.type === 'image' && <img src={msg.fileUrl} alt="Sent file" className="chat-image" />}
                  {msg.type === 'record' && <AudioPlayer audioUrl={msg.fileUrl} />}
                </div>
              </div>
            );
          })}
          {typingUsers.length > 0 && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.join(', ')} are typing...`
                }
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={sendMessage} className={`message-form ${isRecording ? 'is-recording' : ''}`}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSend}
            disabled={isUploading}
          />
          {!isRecording && (
            <button 
              type="button" 
              className="icon-button attachment-button" 
              onClick={() => fileInputRef.current.click()}
              disabled={isUploading}
            >
              <BsPlusCircleFill />
            </button>
          )}
          <div className={`input-wrapper ${isRecording ? 'is-recording' : ''}`}>
            {isRecording ? (
              <div className="recorder-active-container">
                <div className="recording-indicator">
                  <AudioPlayer audioUrl={null} isRecording={true} recordingTime={recordingTime} />
                </div>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="icon-button stop-recording-button"
                >
                  <FaStopCircle />
                </button>
              </div>
            ) : recordedAudio ? (
              <div className="recorder-active-container">
                <AudioPlayer 
                  audioUrl={URL.createObjectURL(recordedAudio)} 
                  onDelete={() => {
                    setRecordedAudio(null);
                    setRecordingTime(0);
                  }}
                />
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={currentMessage}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="message-input"
                  disabled={isUploading}
                />
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="icon-button"
                  disabled={isUploading}
                >
                  <FaMicrophone />
                </button>
              </>
            )}
          </div>
          {!isRecording && (
            <button 
              type="submit" 
              className="icon-button send-button" 
              disabled={isUploading || (!currentMessage.trim() && !recordedAudio)}
            >
              <IoSend />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

ChatsPage.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string,
    secret: PropTypes.string,
    email: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    profileImage: PropTypes.string
  }).isRequired
};

export default ChatsPage;