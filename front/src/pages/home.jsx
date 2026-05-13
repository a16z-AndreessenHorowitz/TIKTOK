// import { useEffect, useState, useRef } from "react";
// import "../assets/styles/home.css";


// export default function Home() {
//   const [videos, setVideos] = useState([]);
//   const [muted, setMuted] = useState(true);
//   const containerRef = useRef(null);
//   const videoRefs = useRef([]);
//   const [volume, setVolume] = useState(1);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const res = await fetch("http://localhost:8080/api/v1/videos/feed");
//         const data = await res.json();
//         setVideos(data.data || []);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchData();
//   }, []);

//   // =========================
//   // 🎬 AUTO PLAY (CHUẨN)
//   // =========================
//   useEffect(() => {
//     const container = containerRef.current;

//     const handleScroll = () => {
//       if (!container) return;

//       const scrollTop = container.scrollTop;
//       const height = window.innerHeight;

//       const index = Math.round(scrollTop / height);

//       videoRefs.current.forEach((video, i) => {
//         if (!video) return;

//         if (i === index) {
//           video.muted = muted;
//           video.play().catch(() => {});
//         } else {
//           video.pause();
//           video.currentTime = 0;
//           video.muted = true;
//         }
//       });
//     };

//     if (container) {
//       container.addEventListener("scroll", handleScroll);
//       handleScroll();
//     }

//     return () => {
//       if (container) {
//         container.removeEventListener("scroll", handleScroll);
//       }
//     };
//   }, [muted, videos]);

//   // =========================
//   // TOGGLE SOUND
//   // =========================
// const toggleSound = () => {
//   const newMuted = !muted;
//   setMuted(newMuted);

//   // 🔥 lấy video đang active
//   const activeIndex = Math.round(
//     containerRef.current.scrollTop / window.innerHeight
//   );

//   const video = videoRefs.current[activeIndex];
//   if (!video) return;

//   video.muted = newMuted;
// };

//  return videos.length === 0 ? (
//   <div
//     style={{
//       height: "100vh",
//       display: "flex",
//       justifyContent: "center",
//       alignItems: "center",
//       color: "#fff",
//       background: "#000",
//       fontSize: "20px",
//     }}
//   >
//     Không có video
//   </div>
// ) : (
//   // =========================
//   // VIDEO FEED
//   // =========================


  


//   <div
//     ref={containerRef}
//     style={{
//       height: "100vh",
//       overflowY: "auto",
//       scrollSnapType: "y mandatory",
//       WebkitOverflowScrolling: "touch",
//       scrollbarWidth: "none",
//     }}
//   >
//     {videos.map((video, index) => (
//       <div
//         key={video.id}
//         style={{
//           height: "100vh",
//           scrollSnapAlign: "start",
//           scrollSnapStop: "always",
//           position: "relative",
//         }}
//       >
//         <video
//           ref={(el) => (videoRefs.current[index] = el)}
//           src={video.videoUrl}
//           loop
//           playsInline
//           style={{
//             width: "100%",
//             height: "100%",
//             objectFit: "cover",
//           }}
//         />

//         <div
//           className="volume-box"
//           style={{
//             position: "absolute",
//             bottom: "100px",
//             right: "20px",
//             zIndex: 10,
//             display: "flex",
//             alignItems: "center",
//             gap: "10px",
//             padding: "8px 12px",
//             borderRadius: "30px",
//           }}
//         >
//           {/* BUTTON */}
//           <button
//             onClick={toggleSound}
            
//           >
//             {muted
//               ? <i className="fa-solid fa-volume-xmark"></i>
//               : <i className="fa-solid fa-volume-high"></i>}
//           </button>

//           {/* RANGE */}
//           <input
//             className="volume-range"
//             type="range"
//             min="0"
//             max="1"
//             step="0.1"
//             value={volume}
        
//             onChange={(e) => {
//               const v = parseFloat(e.target.value); setVolume(v);
//               // lấy video đang active 
//               const activeIndex = Math.round( containerRef.current.scrollTop / window.innerHeight ); 
//               const video = videoRefs.current[activeIndex]; 
//               if (!video) return; video.volume = v; 
//               if (v === 0) { setMuted(true); video.muted = true; } 
//               else { setMuted(false); video.muted = false; } 
//             }
//             }
//           />
//         </div>


//       </div>
//     ))}
//   </div>





// // =========================
// // END VIDEO FEED
// );
// }



// v2
import { useEffect, useState, useRef } from "react";
import "../assets/styles/home.css";

/** Khóa list React — id có thể trùng/null */
function clipListKey(video, index) {
  return `${video?.id ?? "na"}:${index}`;
}

export default function Home() {
  const [videos, setVideos] = useState([]);
  /** Một lần bật/tắt tiếng & mức volume cho cả feed (giống TikTok) */
  const [feedAudio, setFeedAudio] = useState({
    volume: 0.8,
    muted: true,
    lastVolume: 0.8,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef(null);
  const videoRefs = useRef([]);
  const feedAudioRef = useRef(feedAudio);

  useEffect(() => {
    feedAudioRef.current = feedAudio;
  }, [feedAudio]);

  // =========================
  // FETCH DATA
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/v1/videos/feed");
        const data = await res.json();
        setVideos(data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // =========================
  // 🎬 AUTO PLAY (TIKTOK STYLE)
  // =========================
  useEffect(() => {
    if (!videos.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (entry.isIntersecting) {
            const index = videoRefs.current.findIndex(
              (v) => v === video
            );

            setActiveIndex(index);

            const a = feedAudioRef.current;

            video.volume = a.volume;
            video.muted = a.muted;

            video.play().catch(() => {});
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      {
        threshold: 0.7, // giống TikTok
      }
    );

    videoRefs.current.forEach((video) => {
      if (video) observer.observe(video);
    });

    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    const el = videoRefs.current[activeIndex];
    if (!el) return;
    el.volume = feedAudio.volume;
    el.muted = feedAudio.muted;
  }, [feedAudio, activeIndex, videos]);

  const toggleSound = () => {
    setFeedAudio((prev) => {
      if (prev.muted) {
        const vol = prev.lastVolume > 0 ? prev.lastVolume : 0.8;
        return { ...prev, muted: false, volume: vol };
      }
      return {
        ...prev,
        muted: true,
        lastVolume: prev.volume > 0 ? prev.volume : prev.lastVolume,
      };
    });
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setFeedAudio((prev) => ({
      ...prev,
      volume: v,
      muted: v === 0,
      lastVolume: v > 0 ? v : prev.lastVolume,
    }));
  };

  // =========================
  // EMPTY
  // =========================
  if (videos.length === 0) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#fff",
          background: "#000",
          fontSize: "20px",
        }}
      >
        Không có video
      </div>
    );
  }

  // =========================
  // VIDEO FEED
  // =========================
  return (
    <div
      ref={containerRef}
      className="feed-container"
    >
      {videos.map((video, index) => {
        const rowKey = clipListKey(video, index);
        return (
        <div
          key={rowKey}
          className="feed-item"
        >

          <div
          className="video-frame"
          >
          
          <div className="video-wrapper">
            <div className="video-inner video">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={video.videoUrl}
                loop
                playsInline
                className="video-player"
              />

              {/* Overlay âm lượng trong khung video (góc trên trái, giống TikTok) */}
              <div className="volume-box">
                <button
                  type="button"
                  className="volume-box__btn"
                  onClick={toggleSound}
                  aria-label={feedAudio.muted ? "Bật tiếng" : "Tắt tiếng"}
                >
                  {feedAudio.muted ? (
                    <i className="fa-solid fa-volume-xmark" aria-hidden />
                  ) : (
                    <i className="fa-solid fa-volume-high" aria-hidden />
                  )}
                </button>

                <input
                  className="volume-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={feedAudio.volume}
                  onChange={handleVolumeChange}
                  aria-label="Âm lượng"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
        );
      })}
    </div>
  );
}