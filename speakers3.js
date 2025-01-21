var titles = [];
var speakers = {};

let platform = "omnyfm";
const platforms = ['omnyfm', 'spotify'];
const savedPlatform = localStorage.getItem('platform');
if (platforms.includes(savedPlatform)) {
    platform = savedPlatform;
}
else {
    platform = "omnyfm";
    localStorage.setItem('platform', platform);
}
document.getElementById("platform").value = platform;

const localStorageKey = 'jsonData';

const month0 = 2020 * 12 + 7; // 2020年8月
const today = new Date();
const month1 = today.getFullYear() * 12 + today.getMonth();

function calculateMonthValue(dateStr) {
    const match = dateStr.match(/^(\d{4})年(\d{2})月/);
    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        return year * 12 + (month - 1);
    }
    return null;
}

function calculateMonthStr(dateInt) {
    const year = Math.floor(dateInt / 12);
    const month = dateInt % 12 + 1;
    return `${year}-${String(month).padStart(2, '0')}`
}

const startDate = calculateMonthStr(month0);
let startMonth = month0;
const endDate = calculateMonthStr(month1);
let endMonth = month1;

function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, function (match) {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
}
function fullToHalf(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (match) {
        return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
}
function getTitleForSearch(str) {
    str = katakanaToHiragana(str);
    str = fullToHalf(str);
    return str.toLowerCase();
}

let categories = ["genba", "media", "sdgs"];

function readData(data) {
    titles = [];
    speakers = {};
    for (let cat = 0; cat < 3; cat++) {
        let catData = data[categories[cat]];
        for (let i = 0; i < catData.length; i++) {
            const combined = catData[i].mc.concat(catData[i].speakers);
            const duration = catData[i].duration;
            const title = catData[i].title;
            let actualDuration = duration;
            const date = new Date(catData[i].pubDate);
            const unixtime = date.getTime();
            if (title.length >= 3 && title.substring(0, 3) === "（再）") {
                actualDuration = 0;
            }
            if (title.length >= 7 && title.substring(0, 7) === "（ふりかえり）") {
                actualDuration = 0;
            }
            combined.forEach(function (speaker) {
                if (!(speaker in speakers)) {
                    const speakerData = {};
                    speakerData.duration = actualDuration;
                    speakerData.categories = 1 << cat;
                    speakerData.oldest = unixtime;
                    speakerData.newest = unixtime;
                    speakers[speaker] = speakerData;
                } else {
                    speakers[speaker].duration += actualDuration;
                    speakers[speaker].categories |= 1 << cat;
                    speakers[speaker].oldest = Math.min(speakers[speaker].oldest, unixtime);
                    speakers[speaker].newest = Math.max(speakers[speaker].newest, unixtime);
                }
            });
            const titleData = {};
            titleData.linkOmnyfm = catData[i].link;
            titleData.linkSpotify = catData[i].spotify;
            titleData.unixtime = unixtime;
            titleData.title = catData[i].title;
            titleData.titleForSearch = getTitleForSearch(catData[i].title);
            titleData.speakers = combined;
            titleData.duration = duration;
            titleData.minutes = Math.floor(titleData.duration / 60);
            titleData.months = date.getFullYear() * 12 + date.getMonth();
            titles.push(titleData);
        }
    }
}


function fetchData() {
    console.log("Start of fetchData");
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', true);
    xhr.onload = function () {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            readData(data);
        } else {
            console.log('Error: ' + xhr.status);
        }
        displayTitles();
        displaySpeakers();
    };
    xhr.send();
    console.log("End of fetchData");
}

function loadFromLocalStorage() {
    console.log("loadFromLocalStorage");
    const storedData = localStorage.getItem(localStorageKey);
    if (storedData) {
        const data = JSON.parse(storedData);
        readData(data);
    }
    console.log("loadFromLocalStorage");
}

loadFromLocalStorage();
displayTitles();
displaySpeakers();
fetchData();

function displayTitlesImpl(element, titleData) {
    const titleElement = document.createElement("a");
    titleElement.href = titleData.linkSpotify;
    titleElement.rel = "nofollow";
    titleElement.target = "_blank";

    const titleSpan = document.createElement("span");
    titleSpan.className = "article-title";
    titleSpan.textContent = titleData.title;

    const dateSpan = document.createElement("span");
    dateSpan.className = "article-date";
    const date = new Date(titleData.unixtime);
    const durationInMinutes = Math.floor(titleData.duration / 60);
    dateSpan.textContent = `${durationInMinutes}分  ${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;

    let speakerNames = titleData.speakers.map(speaker => {
        const span = document.createElement("span");
        span.className = "name";
        span.textContent = speaker;
        span.addEventListener("click", handleNameClick);
        return span;
    });
    const speakersSpan = document.createElement("span");
    speakersSpan.className = "article-speakers";
    speakerNames.forEach(span => {
        speakersSpan.appendChild(span);
        speakersSpan.appendChild(document.createTextNode(", "));
    });
    if (speakersSpan.lastChild) {
        speakersSpan.removeChild(speakersSpan.lastChild);
    }

    titleElement.appendChild(titleSpan);
    element.appendChild(titleElement);
    element.appendChild(dateSpan);
    element.appendChild(speakersSpan);

    element.appendChild(document.createElement("br"));
}

function displayTitles() {
    console.log("Start of displayTitles");

    const allTitleElement = document.getElementById("all_title");
    allTitleElement.innerHTML = ""; // 既存の内容をクリア
    const sortOption = document.querySelector('input[name="sort-title"]:checked').value;
    const durationOption = document.querySelector('input[name="select-duration"]:checked').value;
    const [minDuration, maxDuration] = durationOption.split('-').map(Number);
    const selectedSpeakerRadio = document.querySelector('input[name="select-speaker"]:checked');
    let selectedSpeaker = "";
    if (selectedSpeakerRadio && selectedSpeakerRadio.value === "selected") {
        selectedSpeaker = selectedSpeakerRadio.nextSibling.textContent;
    }
    console.log("selectedSpeaker", selectedSpeaker);

    let sortedTitles = [...titles];
    sortedTitles.sort((a, b) => {
        if (sortOption === "title-oldest") {
            return a.unixtime - b.unixtime;
        } else if (sortOption === "title-newest") {
            return b.unixtime - a.unixtime;
        }
        else { throw new Error("Invalid sort option"); }
    });
    let counts = 0;
    sortedTitles.forEach(titleData => {
        if (titleData.minutes >= minDuration && titleData.minutes <= maxDuration) {
            if (selectedSpeaker === "" || titleData.speakers.includes(selectedSpeaker)) {
                if(startMonth <= titleData.months && titleData.months <= endMonth) {
                    displayTitlesImpl(allTitleElement, titleData);
                    counts += 1;
                }
            }
        }
    });
    document.getElementById("num_title").textContent = counts;
    console.log("End of displayTitles");
}

function displaySpeakers() {
    console.log("Start of displaySpeakers");

    const allSpeakerElement = document.getElementById("all_speaker");
    allSpeakerElement.innerHTML = ""; // 既存の内容をクリア
    const sortOption = document.querySelector('input[name="sort-speaker"]:checked').value;
    let speakerArray = Object.keys(speakers).map(speaker => {
        return {
            name: speaker,
            data: speakers[speaker]
        };
    });
    speakerArray.sort((a, b) => {
        if (sortOption === "speaker-newest") {
            return b.data.newest - a.data.newest;
        } else if (sortOption === "speaker-oldest") {
            return a.data.oldest - b.data.oldest;
        } else if (sortOption === "speaker-duration") {
            return b.data.duration - a.data.duration;
        }
        else { throw new Error("Invalid sort option"); }
    });
    let speakerNames = speakerArray.map(speaker => {
        const span = document.createElement("span");
        span.className = "name";
        span.textContent = speaker.name;
        span.addEventListener("click", handleNameClick);
        return span;
    });
    document.getElementById("num_speaker").textContent = speakerNames.length;
    speakerNames.forEach(span => {
        allSpeakerElement.appendChild(span);
        allSpeakerElement.appendChild(document.createTextNode(", "));
    });

    // 最後のカンマを削除
    if (allSpeakerElement.lastChild) {
        allSpeakerElement.removeChild(allSpeakerElement.lastChild);
    }
    console.log("End of displaySpeakers");
}

function handleNameClick(event) {
    const clickedName = event.target.textContent;

    const labelElement = document.getElementById("select-speaker-label");
    const inputElement = document.createElement("input");
    inputElement.type = "radio";
    inputElement.name = "select-speaker";
    inputElement.value = "selected";
    inputElement.checked = true;
    inputElement.addEventListener("change", () => { displayTitles(); });
    labelElement.innerHTML = "";
    labelElement.appendChild(inputElement);
    labelElement.appendChild(document.createTextNode(clickedName));

    displayTitles();
}

document.querySelectorAll('input[name="sort-speaker"]').forEach(radio => {
    radio.addEventListener('change', displaySpeakers);
});

document.querySelectorAll('input[name="sort-title"]').forEach(radio => {
    radio.addEventListener('change', displayTitles);
});

document.querySelectorAll('input[name="select-duration"]').forEach(radio => {
    radio.addEventListener('change', displayTitles);
});
document.querySelectorAll('input[name="select-speaker"]').forEach(radio => {
    radio.addEventListener('change', displayTitles);
});

function searchSpeaker() {
    const searchInput = getTitleForSearch(document.getElementById("search-speaker-input").value);
    if (searchInput === "") { return; }
    const searchedSpeakerElement = document.getElementById("searched-speaker");
    searchedSpeakerElement.innerHTML = "";

    let speakerArray = Object.keys(speakers).filter(speaker => {
        return speaker.toLowerCase().includes(searchInput);
    }).map(speaker => `<span class="name">${speaker}</span>`);

    if (speakerArray.length === 0) {
        searchedSpeakerElement.innerHTML = "見つかりません";
    } else {
        searchedSpeakerElement.innerHTML = speakerArray.join(", ");
    }
}
window.searchSpeaker = searchSpeaker;

function searchTitle() {
    const searchInput = getTitleForSearch(document.getElementById("search-title-input").value);
    if (searchInput === "") { return; }

    let titleArray = titles.filter(titleData => {
        return titleData.titleForSearch.includes(searchInput);
    });
    const searchedTitleElement = document.getElementById("searched-title");
    if (titleArray.length === 0) {
        searchedTitleElement.innerHTML = "見つかりません";
    }
    else {
        searchedTitleElement.innerHTML = "";
        titleArray.forEach(titleData => {
            displayTitlesImpl(searchedTitleElement, titleData);
        });
    }
}
window.searchTitle = searchTitle;

function checkEnter(event) {
    if (event.key === "Enter") {
        if (event.target.id === "search-speaker-input") { searchSpeaker(); }
        else if (event.target.id === "search-title-input") { searchTitle(); }
    }
}
window.checkEnter = checkEnter;

let startPicker, endPicker;

document.addEventListener("DOMContentLoaded", () => {
    startPicker = flatpickr("#startYearMonthPicker", {
        locale: "ja",
        minDate: startDate,
        maxDate: endDate,
        disableMobile: true,
        defaultDate: calculateMonthStr(startMonth),
        plugins: [
            new monthSelectPlugin({
                shorthand: true,
                dateFormat: "Y年m月から",
                altFormat: "Y年m月から",
            })
        ],
        onChange: (selectedDates, dateStr) => {
            startMonth = calculateMonthValue(dateStr);
            if (startMonth > endMonth) {
                endMonth = startMonth;
                endPicker.setDate(calculateMonthStr(endMonth), false);
            }
            displayTitles();
        }
    });
    endPicker = flatpickr("#endYearMonthPicker", {
        locale: "ja",
        minDate: startDate,
        maxDate: endDate,
        disableMobile: true,
        defaultDate: calculateMonthStr(endMonth),
        plugins: [
            new monthSelectPlugin({
                shorthand: true,
                dateFormat: "Y年m月まで",
                altFormat: "Y年m月まで",
            })
        ],
        onChange: (selectedDates, dateStr) => {
            endMonth = calculateMonthValue(dateStr);
            if (startMonth > endMonth) {
                startMonth = endMonth;
                startPicker.setDate(calculateMonthStr(startMonth), false);
            }
            displayTitles();
        }
    });
});

function resetPicker() {
    startMonth = month0;
    endMonth = month1;
    startPicker.setDate(startDate, true);
    endPicker.setDate(endDate, true);
}
window.resetPicker = resetPicker;
