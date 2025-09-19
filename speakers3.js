var titles = [];
var speakers = {};
var reporters = {};
var asapoki_members = {};

const localStorageKey = 'jsonData';

let showAll = localStorage.getItem("showAll") === "true";
const showAllToggle = document.getElementById("showAllToggle");
const showAllRadios = document.querySelectorAll('input[name="showAll"]');
function applyShowAllState() {
    const over50 = document.getElementById("over50");
    if (over50) {
        over50.style.display = showAll ? "inline" : "none";
    }
    showAllRadios.forEach(r => {
        r.checked = (r.value === (showAll ? "show-all" : "show-50"));
    });
    showAllToggle.textContent = showAll ? "▲50番組を表示" : "▼全番組表示";
}
applyShowAllState();
showAllRadios.forEach(r => {
    r.addEventListener("change", e => {
        showAll = (e.target.value === "show-all");
        localStorage.setItem("showAll", showAll);
        applyShowAllState();
    });
});
showAllToggle.addEventListener("click", () => {
    showAll = !showAll;
    localStorage.setItem("showAll", showAll);
    applyShowAllState();
});

let platform = "omnyfm";
const platforms = ['omnyfm', 'spotify', 'asahi', 'pca'];
const savedPlatform = localStorage.getItem('platform');
if (platforms.includes(savedPlatform)) {
    platform = savedPlatform;
}
else {
    platform = "omnyfm";
    localStorage.setItem('platform', platform);
}
document.getElementById("platform").value = platform;

const sortSpeaker = localStorage.getItem('sort-speaker') === null ? "speaker-duration" : localStorage.getItem('sort-speaker');
let inputElement = document.querySelector(`input[name="sort-speaker"][value="${sortSpeaker}"]`);
if (inputElement) {
    inputElement.checked = true;
}

const sortTitle = localStorage.getItem('sort-title') === null ? "title-newest" : localStorage.getItem('sort-title');
inputElement = document.querySelector(`input[name="sort-title"][value="${sortTitle}"]`);
if (inputElement) {
    inputElement.checked = true;
}

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
function normalizeKana(kana) {
    return kana.normalize("NFD")
        .replace(/[\u3099\u309A]/g, "")
        .replace(/[ー～]/g, "")
        .charAt(0);
}
function formatDuration(seconds) {
    const days = Math.floor(seconds / 86400); // 1日 = 86400秒
    const hours = Math.floor((seconds % 86400) / 3600); // 1時間 = 3600秒
    const minutes = Math.floor((seconds % 3600) / 60); // 1分 = 60秒
    if (days > 0) { return `${days}日${hours}時間${minutes}分`; }
    else if (hours > 0) { return `${hours}時間${minutes}分`; }
    else { return `${minutes}分`; }
}
function formatMonth(monthInt) {
    const year = Math.floor(monthInt / 12);
    const month = monthInt % 12 + 1;
    return `${year}年${month}月`;
}


const categories = ["genba", "media", "sdgs", "houdan"];
const categoriesShort = ["現場", "メディア", "SDGs", "報談"]
const num_cat = 4;

function readData(data) {
    titles = [];
    speakers = {};
    try {
        for (let cat = 0; cat < num_cat; cat++) {
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
                if (title.length >= 5 && title.substring(0, 5) === "（深掘り）") {
                    actualDuration = 0;
                }
                combined.forEach(function (speaker) {
                    if (!(speaker in speakers)) {
                        const speakerData = {};
                        speakerData.duration = actualDuration;
                        speakerData.categories = 1 << cat;
                        speakerData.oldest = unixtime;
                        speakerData.newest = unixtime;
                        speakerData.furiganaFloat = data["speakers"]?.[speaker]["furiganaFloat"] ?? 0;
                        speakerData.furigana = data["speakers"]?.[speaker]["furigana"] ?? "";
                        speakers[speaker] = speakerData;
                    } else {
                        speakers[speaker].duration += actualDuration;
                        speakers[speaker].categories |= 1 << cat;
                        speakers[speaker].oldest = Math.min(speakers[speaker].oldest, unixtime);
                        speakers[speaker].newest = Math.max(speakers[speaker].newest, unixtime);
                    }
                });
                const titleData = {};
                titleData.link = {};
                titleData.link["omnyfm"] = "https://omny.fm/shows/asahi/" + catData[i].link.split('/').pop();
                titleData.link["spotify"] = "https://open.spotify.com/episode/" + catData[i].spotify.split('/').pop();
                titleData.link["asahi"] = "https://www.asahi.com/special/podcasts/item/?itemid=" + catData[i].clipId.split('=').pop();
                titleData.link["pca"] = "https://pca.st/episode/" + catData[i].pca.split('/').pop();
                titleData.unixtime = unixtime;
                titleData.title = catData[i].title;
                titleData.titleForSearch = getTitleForSearch(catData[i].title);
                titleData.speakers = combined;
                titleData.duration = duration;
                titleData.actualDuration = actualDuration;
                titleData.minutes = Math.floor(titleData.duration / 60);
                titleData.months = date.getFullYear() * 12 + date.getMonth();
                titleData.cat = cat;
                titles.push(titleData);
            }
        }
    } catch (e) {
        console.error("エラーが発生しました:", e.message);
    }

    for (const speaker in data["reporters"]) {
        reporters[speaker] = {};
        reporters[speaker]["url"] = "https://www.asahi.com/reporter-bio/" + data["reporters"][speaker]["url"].split('/').pop();
        reporters[speaker]["asapoki"] = speaker in data.speakers;
        reporters[speaker]["furiganaFloat"] = (data.speakers?.[speaker]?.furiganaFloat) ?? 0;
        reporters[speaker]["furigana"] = (data.speakers?.[speaker]?.furigana) ?? 0;
    }
    for (const speaker in data["asapoki_members"]) {
        asapoki_members[speaker] = data["asapoki_members"][speaker];
    }

    const sortedReportersArray = Object.entries(reporters).sort(([, a], [, b]) => a.furiganaFloat - b.furiganaFloat);
    reporters = Object.fromEntries(sortedReportersArray);
}

function fetchData() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://script.google.com/macros/s/AKfycbzQrE9Q5cQtcHHSb6VYg45aO95Fo6HicFklxA9-rxIqnLTG-B_zPmVvamBhyuFY0gA5/exec', true);
    xhr.onload = function () {
        const startTime = performance.now();
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            readData(data);
        } else {
            console.log('Error: ' + xhr.status);
        }
        displayTitles();
        displaySpeakers();
        displayReporters();
        const endTime = performance.now();
        console.log("onload of fetchData", (endTime - startTime).toFixed(1), "ms");
    };
    xhr.send();
}

function loadFromLocalStorage() {
    const startTime = performance.now();
    const storedData = localStorage.getItem(localStorageKey);
    if (storedData) {
        const data = JSON.parse(storedData);
        readData(data);
    }
    const endTime = performance.now();
    console.log("loadFromLocalStorage", (endTime - startTime).toFixed(1), "ms");
}

function isTargetDevice() {
    try {
        const ua = navigator.userAgent || '';
        return (/Android|iPhone|iPad/i.test(ua));
    } catch (e) {
        return false;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (isTargetDevice()) {
        const appLink = document.getElementById('mobile-app-link');
        if (appLink) {
            appLink.style.display = 'block';
        }
    }
    const urlParams = new URLSearchParams(window.location.search);
    const paramScreen = urlParams.get("screen");
    const savedScreen = localStorage.getItem('selectedScreen');
    const initialScreen = paramScreen !== null ? Number(paramScreen) : (savedScreen !== null ? Number(savedScreen) : 0);
    if (![0, 1, 2, 3].includes(initialScreen)) {
        initialScreen = 0;
    }
    showScreen(initialScreen);
    loadFromLocalStorage();
    displayTitles();
    displaySpeakers();
    displayReporters();
    fetchData();
});





function displayTitlesImpl(element, titleDatas) {
    const fragment = document.createDocumentFragment(); // フラグメントを使用

    over50Wrapper = document.createElement("span");
    over50Wrapper.id = "over50";
    over50Wrapper.style.display = showAll ? "inline" : "none";
    let over50WrapperFlag = false;

    titleDatas.forEach((titleData, index) => {
        const outerSpan = document.createElement("span");
        outerSpan.className = "title";

        const titleElement = document.createElement("a");
        titleElement.href = titleData.link[platform];
        titleElement.rel = "nofollow";
        titleElement.target = "_blank";

        const playlistIcon = document.createElement("span");
        playlistIcon.className = "color-" + categories[titleData.cat];
        playlistIcon.title = categoriesShort[titleData.cat];
        playlistIcon.textContent = "▶";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = titleData.title;

        const dateSpan = document.createElement("span");
        dateSpan.className = "gray-text";
        const date = new Date(titleData.unixtime);
        dateSpan.textContent = ` ${formatDuration(titleData.duration)}  ${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} `;

        const speakersSpan = document.createElement("span");
        speakersSpan.className = "article-speakers";
        speakersSpan.innerHTML = titleData.speakers.map(speaker =>
            `<span class="nowrap name">${speaker}</span>`).join(", ");

        // フラグメントにまとめて追加
        titleElement.appendChild(titleSpan);
        outerSpan.appendChild(playlistIcon);
        outerSpan.appendChild(titleElement);
        outerSpan.appendChild(dateSpan);
        outerSpan.appendChild(speakersSpan);

        if (index < 50) {
            fragment.appendChild(outerSpan);
        } else {
            if (over50WrapperFlag == false) {
                fragment.appendChild(over50Wrapper);
                over50WrapperFlag = true;
            }
            over50Wrapper.appendChild(outerSpan);
        }
    });
    if (over50WrapperFlag == false) {
        fragment.appendChild(over50Wrapper);
    }

    element.appendChild(fragment); // 最後に一括で要素に追加

    element.querySelectorAll(".name").forEach(span => {
        span.addEventListener("click", handleNameClick);
    });
}

function getCheckedDurations() {
    const checkboxes = document.querySelectorAll('input[name="select-duration[]"]:checked');
    const durations = [];

    checkboxes.forEach(cb => {
        const rangeStr = cb.value.replace('-min', ''); // "0-20-min" → "0-20"
        const [start, end] = rangeStr.split('-').map(Number); // [0, 20]
        for (let i = start; i <= end; i++) {
            durations.push(i);
        }
    });

    return durations;
}

function displayTitles() {
    const startTime = performance.now();

    const allTitleElement = document.getElementById("all_title");
    allTitleElement.innerHTML = ""; // 既存の内容をクリア
    const sortOption = document.querySelector('input[name="sort-title"]:checked').value;
    const durations = getCheckedDurations();
    const playlists = Array.from(document.querySelectorAll('input[name="select-playlist"]:checked')).map(checkbox => parseInt(checkbox.value));
    const selectedSpeakerRadio = document.querySelector('input[name="select-speaker"]:checked');
    let selectedSpeaker = "";
    if (selectedSpeakerRadio && selectedSpeakerRadio.value === "selected") {
        selectedSpeaker = selectedSpeakerRadio.nextSibling.textContent;
    }

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
    let totalDuration = 0;
    let titleDatas = [];
    const categoryMonths = {
        0: [], // 現場
        1: [], // メディア
        2: [], // SDGs
        3: []  // 報談
    };
    sortedTitles.forEach(titleData => {
        if (selectedSpeaker === "" || titleData.speakers.includes(selectedSpeaker)) {
            if (titleData.actualDuration > 0) {
                categoryMonths[titleData.cat].push(titleData.months);
            }
            if (playlists.includes(titleData.cat) && durations.includes(titleData.minutes)) {
                if (startMonth <= titleData.months && titleData.months <= endMonth) {
                    titleDatas.push(titleData);
                    if (titleData.actualDuration > 0) {
                        counts += 1;
                        totalDuration += titleData.actualDuration;
                    }
                }
            }
        }
    });
    const svg = document.getElementById("chart");
    if (svg) {
        if (selectedSpeaker === "" || counts < 5) { svg.style.display = "none"; }
        else {
            svg.style.display = "block";
            drawChart(categoryMonths);
        }
    }
    displayTitlesImpl(allTitleElement, titleDatas);

    document.getElementById("start-month").textContent = formatMonth(startMonth);
    document.getElementById("end-month").textContent = formatMonth(endMonth);
    document.getElementById("num_title").textContent = counts;
    document.getElementById("duration").textContent = formatDuration(totalDuration);
    const endTime = performance.now();
    console.log("displayTitles", (endTime - startTime).toFixed(1), "ms");
}






function drawChart(categoryMonths) {
    const svg = document.getElementById("chart");
    svg.innerHTML = ""; // 初期化

    const boxSize = 10;
    const margin = 2;

    const colorScales = [
        ["#ffffff", "#bfe3d7", "#7dc6ae", "#1b9e77"], // 現場
        ["#ffffff", "#f1c4a6", "#e68a52", "#d95f02"], // メディア
        ["#ffffff", "#d3d0e8", "#a59ecf", "#7570b3"], // SDGs
        ["#ffffff", "#b5d3ea", "#75add6", "#1f78b4"]  // 報談
    ];

    function getEventCount(cat, monthInt) {
        return categoryMonths[cat].filter(m => m === monthInt).length;
    }

    for (let m = month0; m <= month1; m++) {
        const col = month1 - m;
        if (m % 12 === 0) {
            const year = Math.floor(m / 12);
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", col * (boxSize + margin) + boxSize / 2);
            text.setAttribute("y", 12);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "13");

            const tspan1 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan1.setAttribute("x", text.getAttribute("x"));
            tspan1.setAttribute("dy", "0");
            tspan1.textContent = `${year}年`;

            const tspan2 = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            tspan2.setAttribute("x", text.getAttribute("x"));
            tspan2.setAttribute("dy", "1em");
            tspan2.textContent = "1月";

            text.appendChild(tspan1);
            text.appendChild(tspan2);
            svg.appendChild(text);
        }

        for (let cat = 0; cat < num_cat; cat++) {
            const row = cat;
            const count = getEventCount(cat, m);

            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", col * (boxSize + margin) + margin);
            rect.setAttribute("y", row * (boxSize + margin) + margin + 30);
            rect.setAttribute("width", boxSize);
            rect.setAttribute("height", boxSize);
            rect.setAttribute("rx", "2");
            rect.setAttribute("ry", "2");
            rect.setAttribute("stroke", "#000");
            rect.setAttribute("stroke-width", "0.3");

            let fillColor;
            if (count === 0) {
                fillColor = colorScales[cat][0];
            } else if (count >= 1 && count <= 2) {
                fillColor = colorScales[cat][1];
            } else if (count >= 3 && count <= 4) {
                fillColor = colorScales[cat][2];
            } else {
                fillColor = colorScales[cat][3];
            }
            rect.setAttribute("fill", fillColor);

            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = `${categoriesShort[cat]} ${formatMonth(m)} ${count === 0 ? "なし" : `${count} 番組`}`;
            rect.appendChild(title);
            svg.appendChild(rect);
        }
    }
    svg.setAttribute("width", (month1 - month0 + 1) * (boxSize + margin) + margin);
    svg.setAttribute("height", num_cat * (boxSize + margin) + margin + 30);
}

function addReporterURL(span) {
    const wrapper = document.createElement("span");
    wrapper.className = "nowrap"; // CSSを適用
    wrapper.appendChild(span);
    return wrapper;
}


function displaySpeakers() {
    const startTime = performance.now();

    const allSpeakerElement = document.getElementById("all_speaker");
    allSpeakerElement.innerHTML = ""; // 既存の内容をクリア
    const sortOption = document.querySelector('input[name="sort-speaker"]:checked').value;
    let speakerArray = Object.keys(speakers).map(speaker => {
        const value =
            sortOption === "speaker-newest" ? -speakers[speaker].newest :
                sortOption === "speaker-oldest" ? speakers[speaker].oldest :
                    sortOption === "speaker-duration" ? -speakers[speaker].duration :
                        sortOption === "speaker-furigana" ? speakers[speaker].furiganaFloat :
                            null;
        return {
            name: speaker,
            data: speakers[speaker],
            value: value
        };
    });
    speakerArray.sort((a, b) => { return a.value - b.value; });

    let splitterInt;
    let splitterLabel;
    const startYear = 2020;
    const currentYear = new Date().getFullYear();
    if (sortOption === "speaker-newest") {
        splitterInt = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
            -(new Date(currentYear - i + 1, 0, 1, 0, 0, 0).getTime())
        );
        splitterLabel = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
            `${currentYear - i}年`
        );
    }
    else if (sortOption === "speaker-oldest") {
        splitterInt = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
            new Date(startYear + i, 0, 1, 0, 0, 0).getTime()
        );
        splitterLabel = Array.from({ length: currentYear - startYear + 1 }, (_, i) =>
            `${startYear + i}年`
        );
    }
    else if (sortOption === "speaker-duration") {
        splitterInt = [-1 * 24 * 60 * 60, -12 * 60 * 60, -6 * 60 * 60, -3 * 60 * 60, -1 * 60 * 60];
        splitterLabel = ["12時間以上", "6時間~12時間", "3時間~6時間", "1時間~3時間", "1時間未満"];
    }
    else if (sortOption === "speaker-furigana") {
        splitterInt = [0, 600 - 1, 1100 - 1, 1600 - 1, 2100 - 1, 2600 - 1, 3100 - 1, 3600 - 1, 3900 - 1, 4400 - 1];
        splitterLabel = ["あ~お", "か~こ", "さ~そ", "た~と", "な~の", "は~ほ", "ま~も", "や~よ", "ら~ろ", "わ~ん"];
    }
    else { throw new Error("Invalid sort option"); }

    let currentSplitter = 0;
    for (let i = 0; i < speakerArray.length; i++) {
        const span = document.createElement("span");
        span.className = "nowrap";
        span.textContent = speakerArray[i].name;
        span.addEventListener("click", handleNameClick);
        if (i == 0) {
            allSpeakerElement.appendChild(document.createTextNode(splitterLabel[0]));
            allSpeakerElement.appendChild(document.createElement("br"));
        }
        else if (currentSplitter + 1 < splitterInt.length && speakerArray[i].value > splitterInt[currentSplitter + 1]) {
            if (allSpeakerElement.lastChild) {
                allSpeakerElement.removeChild(allSpeakerElement.lastChild);
            }
            allSpeakerElement.appendChild(document.createElement("br"));
            allSpeakerElement.appendChild(document.createElement("br"));
            allSpeakerElement.appendChild(document.createTextNode(splitterLabel[currentSplitter + 1]));
            allSpeakerElement.appendChild(document.createElement("br"));
            currentSplitter += 1;
        }
        allSpeakerElement.appendChild(addReporterURL(span));

        allSpeakerElement.appendChild(document.createTextNode(", "));
    }
    if (allSpeakerElement.lastChild) {
        allSpeakerElement.removeChild(allSpeakerElement.lastChild);
    }

    document.getElementById("num_speaker").textContent = speakerArray.length;

    const endTime = performance.now();
    console.log("displaySpeakers", (endTime - startTime).toFixed(1), "ms");
}




function handleNameClick(event) {
    const clickedName = event.target.textContent;

    const labelElement = document.getElementById("select-speaker-label");
    labelElement.style.fontWeight = "600";
    const inputElement = document.createElement("input");
    inputElement.type = "radio";
    inputElement.name = "select-speaker";
    inputElement.value = "selected";
    inputElement.checked = true;
    inputElement.addEventListener("change", () => { displayTitles(); });
    labelElement.innerHTML = "";
    labelElement.appendChild(inputElement);
    labelElement.appendChild(document.createTextNode(clickedName));

    const spanElement = document.getElementById('select-reporter-link');
    if (clickedName in reporters) {
        spanElement.innerHTML = '';
        const link = document.createElement('a');
        link.href = reporters[clickedName].url;
        link.textContent = '(記者ページへ)';
        link.rel = "nofollow";
        link.target = '_blank';
        spanElement.appendChild(link);
        spanElement.style.display = 'inline';
        spanElement.style.fontWeight = "400";
        labelElement.style.paddingRight = '15px';
    }
    else {
        spanElement.innerHTML = '';
        spanElement.style.display = 'none';
        labelElement.style.paddingRight = '0px';
    }

    const savedScreen = localStorage.getItem('selectedScreen');
    if (Number(savedScreen) == 1) {
        showScreen(2);
    }
    displayTitles();
}




document.querySelectorAll('input[name="sort-speaker"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            localStorage.setItem('sort-speaker', radio.value);
        }
        displaySpeakers();
    });
});

document.querySelectorAll('input[name="sort-title"]').forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            localStorage.setItem('sort-title', radio.value);
        }
        displayTitles();
        searchTitle();
    });
});

document.querySelectorAll('input[name="select-duration[]"]').forEach(el => {
    el.addEventListener('change', displayTitles);
    el.addEventListener('change', searchTitle);
});

document.querySelectorAll('input[name="select-speaker"]').forEach(radio => {
    radio.addEventListener('change', displayTitles);
});

document.querySelectorAll('input[name="select-playlist"]').forEach(checkbox => {
    checkbox.addEventListener('change', displayTitles);
});

function searchWords(searchString, text) {
    searchString = searchString.replace(/\u3000/g, " ");
    let searchStrings = searchString.split(" ");
    for (let i = 0; i < searchStrings.length; i++) {
        if (!text.includes(searchStrings[i])) {
            return false;
        }
    }
    return true;
}

function searchSpeaker() {
    const startTime = performance.now();
    const searchInput = getTitleForSearch(document.getElementById("search-speaker-input").value);
    if (searchInput === "") { return; }
    const searchedSpeakerElement = document.getElementById("searched-speaker");
    searchedSpeakerElement.innerHTML = "";

    let speakerArray = Object.entries(speakers).filter(([speaker, value]) => {
        return searchWords(searchInput.split('').join(" "), speaker + value.furigana);
    }).map(([speaker, value]) => {
        const span = document.createElement('span');
        span.className = 'name';
        span.textContent = speaker;
        span.addEventListener('click', handleNameClick);
        return span;
    });

    if (speakerArray.length === 0) {
        searchedSpeakerElement.innerHTML = "見つかりません";
    } else {
        speakerArray.forEach(span => {
            searchedSpeakerElement.appendChild(addReporterURL(span));
            searchedSpeakerElement.appendChild(document.createTextNode(", "));
        });
        searchedSpeakerElement.removeChild(searchedSpeakerElement.lastChild); //最後の, を削除
    }
    if (speakerArray.length === 1) { speakerArray[0].click(); }
    const endTime = performance.now();
    console.log("searchSpeaker", (endTime - startTime).toFixed(1), "ms");
}
window.searchSpeaker = searchSpeaker;

function searchTitle() {
    const startTime = performance.now();
    const searchInput = getTitleForSearch(document.getElementById("search-title-input").value);
    const durations = getCheckedDurations();
    if (searchInput === "") { return; }

    let titleArray = titles.filter(titleData => {
        return titleData.titleForSearch.includes(searchInput) && durations.includes(titleData.minutes);
    });

    showTitlesWithPagination(titleArray, "searched");
    const endTime = performance.now();
    console.log("searchSpeaker", (endTime - startTime).toFixed(1), "ms");
}
window.searchTitle = searchTitle;





function showTitlesWithPagination(titleArray, section) {
    const searchedTitleElement = document.getElementById(`${section}-title`);
    const paginationElement1 = document.getElementById(`${section}-pagination1`);
    const paginationElement2 = document.getElementById(`${section}-pagination2`);

    if (titleArray.length === 0) {
        searchedTitleElement.innerHTML = "見つかりません";
        paginationElement1.innerHTML = "";
        paginationElement2.innerHTML = "";
        return;
    }

    const sortOption = document.querySelector('input[name="sort-title"]:checked').value;
    titleArray.sort((a, b) => {
        if (sortOption === "title-oldest") {
            return a.unixtime - b.unixtime;
        } else if (sortOption === "title-newest") {
            return b.unixtime - a.unixtime;
        }
        else { throw new Error("Invalid sort option"); }
    });

    const itemsPerPage = 10; // 1ページあたりの件数
    const totalPages = Math.ceil(titleArray.length / itemsPerPage);
    let currentPage = 1;

    function renderPage(pageNumber) {
        const start = (pageNumber - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const titleDatas = titleArray.slice(start, end);

        searchedTitleElement.innerHTML = "";
        displayTitlesImpl(searchedTitleElement, titleDatas);

        renderPagination();
    }

    function renderPagination() {
        paginationElement1.innerHTML = "";
        paginationElement2.innerHTML = "";

        const createPaginationElements = () => {
            const paginationElement = document.createDocumentFragment();

            const paginationText = document.createElement("span");
            paginationText.textContent = `${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, titleArray.length)}`;

            const paginationTotal = document.createElement("span");
            paginationTotal.textContent = `(全${titleArray.length}番組)`;

            const prevButton = document.createElement("button");
            prevButton.textContent = "<";
            prevButton.className = `${section}-pagination-button`;
            prevButton.style.marginLeft = "5px";
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener("click", () => {
                if (currentPage > 1) {
                    currentPage--;
                    renderPage(currentPage);
                }
            });

            const nextButton = document.createElement("button");
            nextButton.textContent = ">";
            nextButton.className = `${section}-pagination-button`;
            nextButton.style.marginRight = "5px";
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener("click", () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    renderPage(currentPage);
                }
            });

            paginationElement.appendChild(paginationText);
            paginationElement.appendChild(prevButton);
            paginationElement.appendChild(nextButton);
            paginationElement.appendChild(paginationTotal);
            return paginationElement;
        };

        paginationElement1.appendChild(createPaginationElements());
        paginationElement2.appendChild(createPaginationElements());
    }

    renderPage(1); // 最初のページを表示
}

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

function handleSelectPlatformChange(event) {
    platform = event.target.value;
    localStorage.setItem('platform', platform);
    displayTitles();
    searchTitle();
}
window.handleSelectPlatformChange = handleSelectPlatformChange;







function displayReporters() {
    document.getElementById("reporter-asapoki-members").innerHTML = "";
    document.getElementById("reporter-asapoki").innerHTML = "";
    document.getElementById("reporter-others").innerHTML = "";

    let count_asapoki_members = 0;
    let count_asapoki = 0;
    let count_others = 0;
    let currentHead = "";
    for (const key in reporters) {
        const value = reporters[key];
        const element = document.createElement("a");
        element.textContent = key;
        element.href = value["url"];
        element.rel = "nofollow";
        element.target = "_blank";
        element.className = "reporter-name";

        if (asapoki_members.hasOwnProperty(key)) {
            document.getElementById("reporter-asapoki-members").appendChild(element);
            count_asapoki_members += 1;
        }
        else if (value["asapoki"]) {
            const furigana = value["furigana"] || "";
            if (furigana !== "") {
                const head = normalizeKana(furigana.charAt(0));
                if (currentHead !== head) {
                    const heading = document.createElement("span");
                    heading.className = "reporter-heading";
                    heading.textContent = head;
                    document.getElementById("reporter-asapoki").appendChild(heading);
                    currentHead = head;
                }
            }
            document.getElementById("reporter-asapoki").appendChild(element);
            count_asapoki += 1;
        }
        else {
            document.getElementById("reporter-others").appendChild(element);
            count_others += 1;
        }
        document.getElementById("reporter-num-asapoki-members").innerHTML = count_asapoki_members;
        document.getElementById("reporter-num-asapoki").innerHTML = count_asapoki;
        document.getElementById("reporter-num-others").innerHTML = count_others;
    }
}


function showScreen(screenNum) {
    localStorage.setItem('selectedScreen', screenNum);
    const splitScreen = document.getElementById('splitScreen');
    const speakerScreen = document.getElementById('speakerScreen');
    const titleScreen = document.getElementById('titleScreen');
    const reporterScreen = document.getElementById('reporterScreen');
    const buttons = document.querySelectorAll('.bottom-button');

    // 全リセット
    splitScreen.style.display = 'none';
    speakerScreen.classList.remove('hide');
    titleScreen.classList.remove('hide');
    reporterScreen.classList.remove('active');

    // ボタンのリセット
    buttons.forEach(btn => btn.classList.remove('active-button'));
    buttons[screenNum].classList.add('active-button');

    if (screenNum === 0) {
        splitScreen.style.display = 'flex';
    }
    else if (screenNum === 1) {
        splitScreen.style.display = 'flex';
        titleScreen.classList.add('hide');
    }
    else if (screenNum === 2) {
        splitScreen.style.display = 'flex';
        speakerScreen.classList.add('hide');
    }
    else if (screenNum === 3) {
        reporterScreen.classList.add('active');
    }
    const url = new URL(window.location);
    url.searchParams.set("screen", screenNum);
    window.history.replaceState({}, "", url);
}






function openSetting() {
    const modal = document.getElementById("settingModal");
    const overlay = document.getElementById("settingOverlay");
    const setWidth = 500;
    if (window.innerWidth < setWidth / 0.8 || screen.width < setWidth / 0.8) {
        modal.style.width = `80%`;
        modal.style.left = `10%`;
    }
    else {
        modal.style.width = `${setWidth / window.innerWidth * 100}%`;
        modal.style.left = `${50 - setWidth / window.innerWidth * 50}%`;
    }
    modal.style.display = "block";
    overlay.style.display = "block";
}
window.openSetting = openSetting;

function closeSetting() {
    document.getElementById("settingModal").style.display = "none";
    document.getElementById("settingOverlay").style.display = "none";
}
window.closeSetting = closeSetting;

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeSetting();
    }
});
