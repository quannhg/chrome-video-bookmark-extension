let youtubeLeftControls, youtubePlayer;
let currentVideo = "";
let currentVideoBookmarks = [];
let userStatus;
let offLifeTime = 0;
const gapTime = 180; //3 minus
const timeout = 10000;

const getTime = (t) => {
    var date = new Date(0);
    date.setSeconds(t);

    const hours = Math.floor(t / 3600);
    const minutes = Math.floor((t % 3600) / 60);
    const seconds = Math.round(t % 60);

    const formattedTime = `${hours > 0 ? hours + ':' : ''}${minutes > 0 ? minutes + ':' : ''}${seconds}`;

    return formattedTime;
}

const fetchBookmarks = () => {
    return new Promise((resolve) => {
        return chrome.storage.sync.get([currentVideo], (obj) => {
            resolve(obj[currentVideo] ? JSON.parse(obj[currentVideo]) : []);
        });
    })
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

const watchingOffline = () => {
    let pauseStartTime;

    const checkOfflineStatus = () => {
        if (!youtubePlayer.paused) return;

        const currentTime = new Date().getTime();
        const pauseDuration = (currentTime - pauseStartTime) / 1000;

        if (pauseDuration > gapTime) {
            userStatus = "offline";
            chrome.storage.local.set({ userStatus });
        } else {
            setTimeout(checkOfflineStatus, timeout);
        }
    };

    if (youtubePlayer.paused) {
        pauseStartTime = new Date().getTime();
        checkOfflineStatus();
    } else {
        userStatus = "online";
        chrome.storage.local.set({ userStatus });
    }
};

const updateStatus = () => {
    if (youtubePlayer.paused) {
        watchingOffline();
    } else {
        userStatus = "online";
        chrome.storage.local.set({ userStatus });
    }
};

const setupPlayerEventListeners = () => {
    youtubePlayer.addEventListener('pause', updateStatus);

    youtubePlayer.addEventListener('play', updateStatus);

    chrome.storage.local.set({ userStatus });

    if (userPlayer.paused) {
        userPlayer.paused = false;
        userPlayer.paused = true;
    }
};

const newVideoLoaded = async () => {

    const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
    currentVideoBookmarks = await fetchBookmarks();

    if (!bookmarkBtnExists) {
        const bookmarkBtn = document.createElement("img");

        bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
        bookmarkBtn.className = "ytp-button " + "bookmark-btn";
        bookmarkBtn.title = "Click to bookmark current timestamp";
        bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);

        youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];

        youtubeLeftControls.append(bookmarkBtn);

        youtubePlayer = document.getElementsByClassName("video-stream")[0];

        setupPlayerEventListeners();
    }
}

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
