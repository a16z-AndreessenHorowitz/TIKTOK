import React from "react";
import "./MessagesPage.css";

const DUMMY_CHATS = [
  {
    id: 1,
    name: "Văn Khiêm",
    lastMessage: "Bạn đã gửi một...",
    date: "1/6/2026",
    avatar: "https://i.pravatar.cc/150?u=vankhiem",
  },
  {
    id: 2,
    name: "lạc quan nhưng hay b...",
    lastMessage: "Mấy giờ mới ngủ",
    date: "1/6/2026",
    avatar: "https://i.pravatar.cc/150?u=lacquan",
  },
  {
    id: 3,
    name: "🥰",
    lastMessage: ":))",
    date: "1/6/2026",
    avatar: "https://i.pravatar.cc/150?u=icon",
  },
  {
    id: 4,
    name: "Soo🎀",
    lastMessage: "Loại tin nhắn n...",
    date: "26/5/2026",
    avatar: "https://i.pravatar.cc/150?u=soo",
  },
  {
    id: 5,
    name: "Góc Sửa Chữa",
    lastMessage: "Giá thay pin re...",
    date: "25/5/2026",
    avatar: "https://i.pravatar.cc/150?u=gocsuachua",
  },
  {
    id: 6,
    name: "Dg",
    lastMessage: "đã gửi một nhã...",
    date: "25/5/2026",
    avatar: "https://i.pravatar.cc/150?u=dg",
  },
  {
    id: 7,
    name: "Khnah_Thuw🐥",
    lastMessage: "thì vậy đó hiu s...",
    date: "24/5/2026",
    avatar: "https://i.pravatar.cc/150?u=khnah",
  },
];

function MessagesPage() {
  return (
    <div className="MessagesPage">
      {/* Box trái: Danh sách tin nhắn */}
      <div className="MessagesPage__sidebar">
        <div className="MessagesPage__sidebar-header">
          <h2 className="MessagesPage__sidebar-title">Tin nhắn</h2>
          <div className="MessagesPage__sidebar-actions">
            <i className="fa-solid fa-gear"></i>
          </div>
        </div>

        <div className="MessagesPage__chat-list">
          {DUMMY_CHATS.map((chat) => (
            <div key={chat.id} className="MessagesPage__chat-item">
              <img src={chat.avatar} alt={chat.name} className="MessagesPage__avatar" />
              <div className="MessagesPage__chat-info">
                <p className="MessagesPage__chat-name">{chat.name}</p>
                <div className="MessagesPage__chat-preview">
                  <span className="MessagesPage__chat-text">{chat.lastMessage}</span>
                  <span className="MessagesPage__chat-time">{chat.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Box phải: Khung chat trống */}
      <div className="MessagesPage__content">
        <div className="MessagesPage__empty-state">
          <i className="fa-regular fa-comment-dots MessagesPage__empty-icon" style={{ transform: "scaleX(-1)" }}></i>
        </div>
      </div>
    </div>
  );
}

export default MessagesPage;
