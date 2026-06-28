import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { fetchUserProfile, updateMyProfile } from "../../api/usersApi";
import { getUser, saveSessionFromAuthData } from "../../features/auth/model/authSession";
import { defaultAvatar } from "../../shared/lib/userAvatar";
import "../../styles/ProfilePage.css";

function formatCount(value) {
  const count = Number(value ?? 0);
  if (!Number.isFinite(count)) return "0";
  return new Intl.NumberFormat("vi-VN", { notation: count >= 10000 ? "compact" : "standard" }).format(count);
}

function getVideoUrl(video) {
  return video?.videoUrl || video?.video?.playUrl || "";
}

function getThumbnailUrl(video) {
  return video?.thumbnailUrl || video?.video?.thumbnailUrl || "";
}

function ProfileVideoTile({ video }) {
  const videoUrl = getVideoUrl(video);
  const thumbnailUrl = getThumbnailUrl(video);
  const views = video?.viewCount ?? video?.stats?.views ?? 0;
  const [fitMode, setFitMode] = useState("cover");

  const updateFitMode = (event) => {
    const media = event.currentTarget;
    if (!media.videoWidth || !media.videoHeight) return;
    setFitMode(media.videoWidth > media.videoHeight ? "contain" : "cover");
  };

  return (
    <article className="profile-video">
      <div className="profile-video__media">
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={thumbnailUrl || undefined}
            muted
            playsInline
            preload="metadata"
            className={`profile-video__player profile-video__player--${fitMode}`}
            onLoadedMetadata={updateFitMode}
            onMouseEnter={(event) => event.currentTarget.play().catch(() => {})}
            onMouseLeave={(event) => {
              event.currentTarget.pause();
              event.currentTarget.currentTime = 0;
            }}
          />
        ) : (
          <div className="profile-video__fallback" />
        )}
        <div className="profile-video__views">
          <i className="fa-solid fa-play" aria-hidden />
          <span>{formatCount(views)}</span>
        </div>
      </div>
      {video?.caption ? <p className="profile-video__caption">{video.caption}</p> : null}
    </article>
  );
}

function EditProfileModal({ profile, avatarSrc, onClose, onSaved }) {
  const [form, setForm] = useState({
    username: profile?.username || "",
    displayName: profile?.displayName || profile?.username || "",
    bio: profile?.bio || "",
  });
  const [avatarPreview, setAvatarPreview] = useState(avatarSrc);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const normalizedUsername = form.username.trim().replace(/^@+/, "");
  const normalizedDisplayName = form.displayName.trim();
  const normalizedBio = form.bio.trim();
  const hasChanges =
    normalizedUsername !== (profile?.username || "") ||
    normalizedDisplayName !== (profile?.displayName || profile?.username || "") ||
    normalizedBio !== (profile?.bio || "") ||
    avatarFile != null;
  const canSave = hasChanges && normalizedUsername && normalizedDisplayName && !saving;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview, onClose]);

  const updateField = (field) => (event) => {
    setForm((currentForm) => ({ ...currentForm, [field]: event.target.value }));
    setError(null);
  };

  const previewAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const nextPreview = URL.createObjectURL(file);
    setAvatarPreview((currentPreview) => {
      if (currentPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreview);
      }
      return nextPreview;
    });
  };

  const saveProfile = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      setError(null);
      const updatedProfile = await updateMyProfile({
        username: normalizedUsername,
        displayName: normalizedDisplayName,
        bio: normalizedBio,
        avatarFile,
      });
      const currentUser = getUser();
      saveSessionFromAuthData({
        user: {
          ...currentUser,
          id: updatedProfile.id,
          username: updatedProfile.username,
          avatarUrl: updatedProfile.avatarUrl,
        },
      });
      onSaved(updatedProfile);
    } catch (err) {
      setError(err?.message || "Không lưu được hồ sơ.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
      <button type="button" className="profile-edit-modal__backdrop" aria-label="Đóng" onClick={onClose} />
      <section className="profile-edit-modal__panel">
        <header className="profile-edit-modal__header">
          <h2 id="profile-edit-title">Sửa hồ sơ</h2>
          <button type="button" className="profile-edit-modal__close" aria-label="Đóng" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </header>

        <div className="profile-edit-modal__body">
          <div className="profile-edit-row profile-edit-row--avatar">
            <label>Ảnh hồ sơ</label>
            <div className="profile-edit-avatar">
              <img src={avatarPreview} alt="" />
              <label className="profile-edit-avatar__button" aria-label="Chọn ảnh hồ sơ">
                <input type="file" accept="image/*" onChange={previewAvatar} />
                <i className="fa-solid fa-pen" aria-hidden />
              </label>
            </div>
          </div>

          <div className="profile-edit-row">
            <label htmlFor="profile-edit-username">TikTok ID</label>
            <div className="profile-edit-field">
              <input
                id="profile-edit-username"
                value={form.username}
                maxLength={30}
                onChange={updateField("username")}
              />
              <p>www.tiktok.com/@{normalizedUsername || profile?.username}</p>
              <p>TikTok ID chỉ có thể bao gồm chữ cái, chữ số, dấu gạch dưới và dấu chấm.</p>
            </div>
          </div>

          <div className="profile-edit-row">
            <label htmlFor="profile-edit-name">Tên</label>
            <div className="profile-edit-field">
              <input
                id="profile-edit-name"
                value={form.displayName}
                maxLength={80}
                onChange={updateField("displayName")}
              />
              <p>Bạn chỉ có thể thay đổi biệt danh 7 ngày một lần.</p>
            </div>
          </div>

          <div className="profile-edit-row">
            <label htmlFor="profile-edit-bio">Tiểu sử</label>
            <div className="profile-edit-field">
              <textarea
                id="profile-edit-bio"
                value={form.bio}
                maxLength={80}
                placeholder="Tiểu sử"
                onChange={updateField("bio")}
              />
              <p>{normalizedBio.length}/80</p>
            </div>
          </div>

          {error ? <p className="profile-edit-modal__error">{error}</p> : null}
        </div>

        <footer className="profile-edit-modal__footer">
          <button type="button" onClick={onClose}>Hủy</button>
          <button type="button" className="profile-edit-modal__save" disabled={!canSave} onClick={saveProfile}>
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const navigate = useNavigate();
  const username = useMemo(() => String(params.username || "").replace(/^@+/, ""), [params.username]);
  const [profileState, setProfileState] = useState({
    username,
    loading: true,
    error: null,
    profile: null,
  });
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchUserProfile(username)
      .then((profile) => {
        if (cancelled) return;
        setProfileState({ username, loading: false, error: null, profile });
      })
      .catch((err) => {
        if (cancelled) return;
        setProfileState({
          username,
          loading: false,
          error: err?.message || "Không tải được hồ sơ.",
          profile: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  const isStaleProfile = profileState.username !== username;
  const loading = isStaleProfile || profileState.loading;
  const error = isStaleProfile ? null : profileState.error;
  const profile = isStaleProfile ? null : profileState.profile;
  const videos = Array.isArray(profile?.videos) ? profile.videos : [];
  const avatarSrc = profile?.avatarUrl || defaultAvatar;

  const handleProfileSaved = (updatedProfile) => {
    setProfileState({
      username: updatedProfile?.username || username,
      loading: false,
      error: null,
      profile: updatedProfile,
    });
    setEditingProfile(false);
    if (updatedProfile?.username && updatedProfile.username !== username) {
      navigate(`/@${encodeURIComponent(updatedProfile.username)}`, { replace: true });
    }
  };

  if (loading) {
    return <main className="profile-page profile-page--center">Đang tải hồ sơ...</main>;
  }

  if (error) {
    return <main className="profile-page profile-page--center">{error}</main>;
  }

  if (!profile) {
    return <main className="profile-page profile-page--center">Không tìm thấy hồ sơ.</main>;
  }

  return (
    <main className="profile-page">
      <section className="profile-header" aria-label="Thông tin hồ sơ">
        <img className="profile-header__avatar" src={avatarSrc} alt="" />
        <div className="profile-header__content">
          <div className="profile-header__identity">
            <h1>{profile.displayName || profile.username}</h1>
            <span>@{profile.username}</span>
          </div>

          <div className="profile-header__stats" aria-label="Thống kê hồ sơ">
            <span><strong>{formatCount(profile.followingCount)}</strong> Đã follow</span>
            <span><strong>{formatCount(profile.followerCount)}</strong> Follower</span>
            <span><strong>{formatCount(profile.likeCount)}</strong> Lượt thích</span>
          </div>

          <div className="profile-header__actions">
            {profile.self ? (
              <>
                <button type="button" onClick={() => setEditingProfile(true)}>Sửa hồ sơ</button>
                <button type="button">Quảng bá bài đăng</button>
              </>
            ) : (
              <button type="button" className="profile-header__primary">
                {profile.followed ? "Đã follow" : "Follow"}
              </button>
            )}
            <button type="button" aria-label="Cài đặt">
              <i className="fa-solid fa-gear" aria-hidden />
            </button>
            <button type="button" aria-label="Chia sẻ">
              <i className="fa-solid fa-share" aria-hidden />
            </button>
          </div>

          <p className="profile-header__bio">{profile.bio || "Chưa có tiểu sử."}</p>
        </div>
      </section>

      <section className="profile-tabs" aria-label="Nội dung hồ sơ">
        <div className="profile-tabs__nav">
          <button type="button" className="profile-tabs__tab profile-tabs__tab--active">
            <i className="fa-solid fa-grip-vertical" aria-hidden />
            Video
          </button>
          <button type="button" className="profile-tabs__tab" disabled>Bài đăng lại</button>
          <button type="button" className="profile-tabs__tab" disabled>Yêu thích</button>
          <button type="button" className="profile-tabs__tab" disabled>Đã thích</button>
        </div>
        <div className="profile-tabs__sort">
          <button type="button" className="profile-tabs__sort-btn profile-tabs__sort-btn--active">
            Mới nhất
          </button>
          <button type="button" className="profile-tabs__sort-btn">Thịnh hành</button>
          <button type="button" className="profile-tabs__sort-btn">Cũ nhất</button>
        </div>
      </section>

      {videos.length ? (
        <section className="profile-grid" aria-label="Video của người dùng">
          {videos.map((video) => (
            <ProfileVideoTile key={video.id || video.videoUrl} video={video} />
          ))}
        </section>
      ) : (
        <section className="profile-empty">
          <i className="fa-regular fa-file-video" aria-hidden />
          <h2>Chưa có video</h2>
          <p>Khi người dùng đăng video công khai, video sẽ xuất hiện ở đây.</p>
        </section>
      )}

      {editingProfile ? (
        <EditProfileModal
          profile={profile}
          avatarSrc={avatarSrc}
          onClose={() => setEditingProfile(false)}
          onSaved={handleProfileSaved}
        />
      ) : null}
    </main>
  );
}
