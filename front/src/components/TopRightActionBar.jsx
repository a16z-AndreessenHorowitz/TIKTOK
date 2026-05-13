import "./css/TopRightActionBar.css";

import userImg from "../assets/images/user.png";
 function TopRightActionBar(){

  return <>
      <div className="TopRightActionBar ">
        <div className="container-fluid">
          <div className="row d-flex">
            <div className="col-12">
            <div className="row">
              <div className="col-3 p-0">
                <div className="TUXTooltip-reference">
                  <button>
                    <svg fill="currentColor" color="inherit" fontSize="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M28.68 11.5h-4.1v16.39a3.51 3.51 0 1 1-2.34-3.31v-4.21a7.61 7.61 0 1 0 6.44 7.52v-8.34a9.9 9.9 0 0 0 5.86 1.9v-4.1a5.85 5.85 0 0 1-5.86-5.85Z"></path><path fillRule="evenodd" clipRule="evenodd" d="M24 2a22 22 0 1 0 0 44 22 22 0 0 0 0-44ZM6 24a18 18 0 1 1 36 0 18 18 0 0 1-36 0Z"></path></svg> 
                    <span>Nhận Xu</span>
                  </button> 
                </div>
              </div>
              <div className="col-4 p-0">
                <div className="TUXTooltip-reference">
                  <button>
                    <svg fill="currentColor" color="inherit" fontSize="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em"><path d="M20 9c0-1.1.9-2 2-2h4a2 2 0 1 1 0 4h-4a2 2 0 0 1-2-2ZM18 38.5c0-.83.67-1.5 1.5-1.5h9a1.5 1.5 0 0 1 0 3h-9a1.5 1.5 0 0 1-1.5-1.5Z"></path><path fillRule="evenodd" clipRule="evenodd" d="M8 10.6c0-3.36 0-5.04.65-6.32a6 6 0 0 1 2.63-2.63C12.56 1 14.23 1 17.6 1h12.8c3.36 0 5.04 0 6.32.65a6 6 0 0 1 2.63 2.63C40 5.56 40 7.24 40 10.6v26.8c0 3.36 0 5.04-.65 6.32a6 6 0 0 1-2.63 2.63c-1.28.65-2.96.65-6.32.65H17.6c-3.36 0-5.04 0-6.32-.65a6 6 0 0 1-2.63-2.63C8 42.44 8 40.75 8 37.4V10.6ZM17.6 5h12.8c1.75 0 2.82 0 3.62.07.37.03.6.07.73.1.48.11.96.58 1.08 1.08.03.14.07.36.1.73.07.8.07 1.87.07 3.62v26.8c0 1.75 0 2.82-.07 3.62-.03.37-.07.6-.1.73-.11.48-.58.96-1.08 1.08-.14.03-.36.07-.73.1-.8.07-1.87.07-3.62.07H17.6c-1.75 0-2.82 0-3.62-.07-.37-.03-.6-.07-.73-.1-.5-.12-.97-.6-1.08-1.08a5.11 5.11 0 0 1-.1-.73c-.07-.8-.07-1.87-.07-3.62V10.6c0-1.75 0-2.82.07-3.62.03-.37.07-.6.1-.73.12-.5.6-.97 1.08-1.08.14-.03.36-.07.73-.1C14.78 5 15.85 5 17.6 5Z"></path></svg>                  
                    <span>Tải ứng dụng</span>
                  </button> 
                </div>
              </div>
              <div className="col-3 p-0">
                <div className="TUXTooltip-reference">
                  <button>
                    <svg fill="currentColor" color="inherit" fontSize="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" width="40px" height="1em"><path d="M21.9 7.38v19.86l-6.73-6.73a.87.87 0 0 0-1.24 0l-1.73 1.73a.88.88 0 0 0 0 1.24l11.18 11.18c.34.35.9.35 1.24 0L35.8 23.48a.88.88 0 0 0 0-1.24l-1.73-1.73a.87.87 0 0 0-1.24 0l-6.73 6.73V7.38c0-.49-.4-.88-.87-.88h-2.45c-.49 0-.88.4-.88.88ZM10.88 37.13c-.49 0-.88.39-.88.87v2.63c0 .48.4.87.88.87h26.24c.49 0 .88-.4.88-.87V38c0-.48-.4-.87-.87-.87H10.86Z"></path></svg>                 
                    <span>Ứng dụng dành cho máy tính</span>
                   </button> 
                </div>
              </div>
              <div className="col-2 p-0">
                <div className="TUXButton-iconContainer">
                  <img className="ImgAvatar" src={userImg} alt="" />
                </div>
              </div>
            </div>
            </div>
          </div>
      </div>
      </div>
  </>
}

export default TopRightActionBar;
