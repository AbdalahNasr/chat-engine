import { useState } from 'react';
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';

function MessageItem({ message, isOwn, onUpdate, onDelete, token }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleEdit = async () => {
    try {
      const res = await axios.put(
        `http://localhost:3001/api/users/messages/${message._id}`,
        { text: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdate(res.data); // update message in parent state
      setEditing(false);
    } catch (err) {
      alert('Failed to edit message');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(
        `http://localhost:3001/api/users/messages/${message._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onDelete(message._id); // remove message from parent state
    } catch (err) {
      alert('Failed to delete message');
    }
  };

  return (
    <div className="message-item">
      {editing ? (
        <div className="edit-area">
          <input
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="edit-input"
          />
          <button onClick={handleEdit} title="Save"><FaSave /></button>
          <button onClick={() => setEditing(false)} title="Cancel"><FaTimes /></button>
        </div>
      ) : (
        <>
          <span className="message-text">{message.text}</span>
          {isOwn && (
            <span className="message-actions">
              <button onClick={() => setEditing(true)} title="Edit"><FaEdit /></button>
              <button onClick={handleDelete} title="Delete"><FaTrash /></button>
            </span>
          )}
        </>
      )}
    </div>
  );
}

export default MessageItem; 