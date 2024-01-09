let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, value, videoId } = obj;

    if (type === "NEW") {
        currentVideo = videoId;
        newVideoLoaded();
    } else if (type === "PLAY") {
        youtubePlayer.currentTime = value;
    } else if (type === "DELETE") {

        currentVideoBookmarks = currentVideoBookmarks.filter((b) => b.time != value);
        chrome.storage.sync.set({ [currentVideo]: JSON.stringify(currentVideoBookmarks) });

        response(currentVideoBookmarks);
    }
});

const fetchBookmarks = () => {
    return new Promise((resolve) => {
        return chrome.storage.sync.get([currentVideo], (obj) => {
            resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        });
    })
}

const newVideoLoaded = async () => {
    const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
    currentVideoBookmarks = await fetchBookmarks()

    if (!bookmarkBtnExists) {
        const bookmarkBtn = document.createElement("img");

        bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
        bookmarkBtn.className = "ytp-button " + "bookmark-btn";
        bookmarkBtn.title = "Click to bookmark current timestamp";
        bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);

        youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];

        youtubeLeftControls.append(bookmarkBtn);

        youtubePlayer = document.getElementsByClassName("video-stream")[0];
    }
}

const addNewBookmarkEventHandler = async () => {
    const currentTime = youtubePlayer.currentTime;
    const newBookmark = {
        time: currentTime,
        desc: "Bookmark at " + getTime(currentTime),
    };

    chrome.storage.sync.set({
        [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
    });

    currentVideoBookmarks = await fetchBookmarks()
}

const getTime = (t) => {
    var date = new Date(0);
    date.setSeconds(t);

    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = Math.round(t % 60);

    const formattedTime = `${hours > 0 ? hours + ':' : ''}${minutes > 0 ? minutes + ':' : ''}${seconds}`;

    return formattedTime;
}
