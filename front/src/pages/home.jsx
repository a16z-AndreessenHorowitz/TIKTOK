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

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastVolume,setLastVolume] = useState(0.8);



  const containerRef = useRef(null);
  const videoRefs = useRef([]);

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

            video.muted = muted;
            video.volume = volume;

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
  }, [videos, muted, volume]);

  // =========================
  // 🔊 TOGGLE SOUND
  // =========================
  const toggleSound = () => {
  const video = videoRefs.current[activeIndex];
  if (!video) return;

  if (muted) {
    // UNMUTE → trả lại volume cũ
    setMuted(false);
    setVolume(lastVolume);

    video.muted = false;
    video.volume = lastVolume;
  } else {
    //  MUTE → lưu volume hiện tại
    setLastVolume(volume);
    setMuted(true);
    setVolume(0);

    video.muted = true;
    video.volume = 0;
  }
};

  // =========================
  //  CHANGE VOLUME
  // =========================
  const handleVolumeChange = (e) => {
  const v = parseFloat(e.target.value);
  setVolume(v);

  const video = videoRefs.current[activeIndex];
  if (!video) return;

  video.volume = v;

  if (v === 0) {
    setMuted(true);
  } else {
    setMuted(false);
    setLastVolume(v); // 🔥 cập nhật volume gần nhất
  }
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
      {videos.map((video, index) => (
        <div
          key={video.id}
          className="feed-item"
        >

          <div
          className="video-frame"
          >
          
          <div className="video-wrapper">
                      <video
            ref={(el) => (videoRefs.current[index] = el)}
            src={video.videoUrl}
            loop
            playsInline

            className="video-player"

          />

          {/* 🔊 VOLUME CONTROL */}
          <div
            className="volume-box"
          >
            {/* BUTTON */}
            <button onClick={toggleSound}>
              {muted ? (
                <i className="fa-solid fa-volume-xmark"></i>
              ) : (
                <i className="fa-solid fa-volume-high"></i>
              )}
            </button>

            {/* RANGE */}
            <input
              className="volume-range"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>
          </div>
        </div>
      </div>
      ))}
    </div>
  );
}