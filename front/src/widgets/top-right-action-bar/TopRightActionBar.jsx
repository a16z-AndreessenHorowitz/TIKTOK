import "./TopRightActionBar.css";

import { useAuth } from "../../features/auth/hooks/useAuth";
import { openLoginModal } from "../../features/auth/model/authUi";
import { getUserAvatarSrc } from "../../shared/lib/userAvatar";

function TopRightActionBar() {
  const { isLoggedIn, user } = useAuth();
  const avatarSrc = getUserAvatarSrc(user);

  return (
    <div className="TopRightActionBar">
      <div className="TopRightActionBar__inner">
        <div className="TopRightActionBar__item">
          <button type="button" className="TopRightActionBar__link">
            <svg fill="currentColor" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden>
              <path d="M28.68 11.5h-4.1v16.39a3.51 3.51 0 1 1-2.34-3.31v-4.21a7.61 7.61 0 1 0 6.44 7.52v-8.34a9.9 9.9 0 0 0 5.86 1.9v-4.1a5.85 5.85 0 0 1-5.86-5.85Z" />
              <path fillRule="evenodd" clipRule="evenodd" d="M24 2a22 22 0 1 0 0 44 22 22 0 0 0 0-44ZM6 24a18 18 0 1 1 36 0 18 18 0 0 1-36 0Z" />
            </svg>
            <span>Nhận Xu</span>
          </button>
        </div>

        <div className="TopRightActionBar__item TopRightActionBar__item--grow">
          <button type="button" className="TopRightActionBar__link">
            <svg fill="currentColor" viewBox="0 0 48 48" width="1em" height="1em" aria-hidden>
              <path d="M20 9c0-1.1.9-2 2-2h4a2 2 0 1 1 0 4h-4a2 2 0 0 1-2-2ZM18 38.5c0-.83.67-1.5 1.5-1.5h9a1.5 1.5 0 0 1 0 3h-9a1.5 1.5 0 0 1-1.5-1.5Z" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 10.6c0-3.36 0-5.04.65-6.32a6 6 0 0 1 2.63-2.63C12.56 1 14.23 1 17.6 1h12.8c3.36 0 5.04 0 6.32.65a6 6 0 0 1 2.63 2.63C40 5.56 40 7.24 40 10.6v26.8c0 3.36 0 5.04-.65 6.32a6 6 0 0 1-2.63 2.63c-1.28.65-2.96.65-6.32.65H17.6c-3.36 0-5.04 0-6.32-.65a6 6 0 0 1-2.63-2.63C8 42.44 8 40.75 8 37.4V10.6ZM17.6 5h12.8c1.75 0 2.82 0 3.62.07.37.03.6.07.73.1.48.11.96.58 1.08 1.08.03.14.07.36.1.73.07.8.07 1.87.07 3.62v26.8c0 1.75 0 2.82-.07 3.62-.03.37-.07.6-.1.73-.11.48-.58.96-1.08 1.08-.14.03-.36.07-.73.1-.8.07-1.87.07-3.62.07H17.6c-1.75 0-2.82 0-3.62-.07-.37-.03-.6-.07-.73-.1-.5-.12-.97-.6-1.08-1.08a5.11 5.11 0 0 1-.1-.73c-.07-.8-.07-1.87-.07-3.62V10.6c0-1.75 0-2.82.07-3.62.03-.37.07-.6.1-.73.12-.5.6-.97 1.08-1.08.14-.03.36-.07.73-.1C14.78 5 15.85 5 17.6 5Z"
              />
            </svg>
            <span title="Tải ứng dụng điện thoại">Tải ứng dụng điện thoại</span>
          </button>
        </div>

        <div className="TopRightActionBar__auth">
          {isLoggedIn ? (
            <img className="ImgAvatar ImgAvatar--logged-in" src={avatarSrc} alt="" />
          ) : (
            <>
              <span className="TopRightActionBar__divider" aria-hidden />
              <button
                type="button"
                className="TopRightActionBar__login-btn"
                onClick={openLoginModal}
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopRightActionBar;
