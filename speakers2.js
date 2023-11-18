let allTitles = { "genba": [], "media": [], "sdgs": [] }
let allSpeakers = [];
let categories = ["genba", "media", "sdgs"];
let speakerQ = "";
let titleQ = "";
let selectedMonth = "";
let selectedYear = "2023";
let selectedSpeaker = null;

let xhr = new XMLHttpRequest();
xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', false);
// xhr.open('GET', 'echo.json', false);
xhr.onload = function () {
    if (xhr.status === 200) {
        let data = JSON.parse(xhr.responseText);
        for (let cat = 0; cat < 3; cat++) {
            let catdata = data[categories[cat]];
            let category = categories[cat];
            let speakers = [];
            for (let i = 0; i < catdata.length; i++) {
                speakers = speakers.concat(catdata[i].mc);
                speakers = speakers.concat(catdata[i].speakers);
                const combined = catdata[i].mc.concat(catdata[i].speakers);
                const date = new Date(catdata[i].pubDate);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const titleData = {};
                titleData.link = catdata[i].link;
                titleData.year = year;
                titleData.month = month;
                titleData.day = day;
                titleData.title = catdata[i].title;
                titleData.titleForSearch = getTitleForSearch(catdata[i].title);
                titleData.date = year + '/' + month + '/' + day;
                titleData.speakers = combined;
                titleData.html = '<a href="' + titleData.link + '" rel="nofollow" target="_blank"><span class="article-title">' + titleData.title + '</span> <span class="article-date">' + titleData.date + '</span></a>';
                allTitles[category].push(titleData);
            }

            speakers = Array.from(new Set(speakers));
            const index = speakers.indexOf("");
            speakers.splice(index, 1);

            // 番組別の出演者一覧
            document.getElementById("n" + category).innerHTML = "<b>" + (speakers.length).toString() + "</b>";
            document.getElementById(category).innerHTML = '<span class="name">' + speakers.join('</span>, <span class="name">') + '</span>';

            allSpeakers = allSpeakers.concat(speakers);
        }
        // 3番組の出演者一覧
        allSpeakers = Array.from(new Set(allSpeakers));
        document.getElementById("number").innerHTML = "<b>" + (allSpeakers.length).toString() + "</b>";
        document.getElementById("all").innerHTML = '<span class="name">' + allSpeakers.join('</span>, <span class="name">') + '</span>';
    }
    else {
        console.log('Error: ' + xhr.status);
    }
};
xhr.send();

addSelectNameListener(".name");
getQuerySpeaker();
searchTitleImpl();

function addSelectNameListener(className) {
    let nameElements = document.querySelectorAll(className);
    //名前をクリックしたときのイベントリスナーを付与
    nameElements.forEach(function (element) {
        element.addEventListener("click", function () {
            // 選択済みスピーカーがいれば選択を外す
            if (selectedSpeaker !== null) {
                selectedSpeaker.classList.remove("clicked");
            }
            selectedSpeaker = this;
            this.classList.add("clicked");
            speakerQ = selectedSpeaker.textContent;
            document.getElementById("selected-speaker").textContent = speakerQ;
            document.getElementById("check-selected-speaker").checked = true;
            // タイトルの検索設定をリセット
            document.getElementById("search-title-input").value = "";
            titleQ = document.getElementById("search-title-input").value;
            document.getElementById("selected-title").innerHTML = '<span class="not-selected">未選択</span>';
            document.getElementById("check-selected-title").checked = true;
            searchTitleImpl();
            // URLクエリをセット
            setQuerySpeaker();
        });
    });
}

function getQuerySpeaker() {
    let queryString = window.location.search;
    let params = new URLSearchParams(queryString);
    let queryParameters = {};
    params.forEach(function (value, key) {
        queryParameters[key] = value;
    });
    if (queryParameters.hasOwnProperty("speaker")) {
        document.getElementById("search-speaker-input").value = queryParameters.speaker;
        searchSpeaker();
    }
}

function setQuerySpeaker() {
    let newQueryString = 'speaker=' + speakerQ;
    let newState = { page: 'newPage' };
    window.history.pushState(newState, '', '?' + newQueryString);
}

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
    let searchInput = document.getElementById("search-speaker-input").value;
    if (searchInput === "") { }
    else {
        // 選択済みスピーカーがいれば選択を外す
        if (selectedSpeaker !== null) {
            selectedSpeaker.classList.remove("clicked");
            selectedSpeaker = null;
        }
        let filteredSpeakers = allSpeakers.filter(function (speaker) {
            return searchWords(searchInput.split('').join(" "), speaker);
        });
        document.getElementById("searched").innerHTML = filteredSpeakers.length + ' 名: ' + '<span class="name-search">' + filteredSpeakers.join('</span>, <span class="name-search">') + '</span>';
        addSelectNameListener(".name-search");
        if (document.querySelectorAll(".name-search").length == 1) {
            document.querySelectorAll(".name-search")[0].click();
            selectedSpeaker = document.querySelectorAll(".name-search")[0];
        }
        document.getElementById("check-selected-speaker").checked = true;
    }
}
window.searchSpeaker = searchSpeaker;

function searchTitle() {
    titleQ = document.getElementById("search-title-input").value;
    if (titleQ == "") {
        document.getElementById("selected-title").innerHTML = '<span class="not-selected">未選択</span>';
    }
    else {
        document.getElementById("selected-title").textContent = titleQ;
    }
    document.getElementById("check-selected-title").checked = true;
    searchTitleImpl();
}
window.searchTitle = searchTitle;

function searchTitleImpl() {
    // console.log([titleQ, speakerQ, selectedYear, selectedMonth]);
    for (let cat = 0; cat < 3; cat++) {
        let category = categories[cat];

        let filteredTitles = allTitles[category];

        let checkboxTitle = document.getElementById("check-selected-title");
        if (titleQ != "" && checkboxTitle.checked) {
            let titleQForSearch = getTitleForSearch(titleQ);
            filteredTitles = filteredTitles.filter(function (titleData) {
                return searchWords(titleQForSearch, titleData.titleForSearch);
            });
        }
        let checkboxSpeaker = document.getElementById("check-selected-speaker");
        if (speakerQ != "" && checkboxSpeaker.checked) {
            filteredTitles = filteredTitles.filter(function (titleData) {
                return titleData.speakers.includes(speakerQ);
            });
        }
        if (selectedYear != "") {
            filteredTitles = filteredTitles.filter(function (titleData) {
                return selectedYear == titleData.year;
            });
        }
        if (selectedMonth != "") {
            filteredTitles = filteredTitles.filter(function (titleData) {
                return selectedMonth == titleData.month;
            });
        }

        let titleDisplay = document.getElementById(category + "_title");
        let n = filteredTitles.length;
        if (n === 0) {
            titleDisplay.innerHTML = "";
            document.getElementById("n" + category + "_title").innerHTML = "0";
        }
        else {
            titleDisplay.innerHTML = filteredTitles.map(item => item.html).join("<br>");
            document.getElementById("n" + category + "_title").innerHTML = "<b>" + n + "</b>";
        }
    }
}

function checkEnter(event) {
    //エンターキーイベント
    if (event.key === "Enter") {
        if (event.target.id === "search-speaker-input") { searchSpeaker(); }
        else if (event.target.id === "search-title-input") { searchTitle(); }
    }
}
window.checkEnter = checkEnter;

function handleYearSelection(radio) {
    if (radio.checked) {
        if (radio.value == "all") { selectedYear = ""; }
        else { selectedYear = radio.value; }
        searchTitleImpl();
    }
}
window.handleYearSelection = handleYearSelection;

function handleMonthSelection(radio) {
    if (radio.checked) {
        if (radio.value == "all") { selectedMonth = ""; }
        else { selectedMonth = radio.value; }
        searchTitleImpl();
    }
}
window.handleMonthSelection = handleMonthSelection;

function handleCheckSelectedSpeakerChange() {
    searchTitleImpl();
}
window.handleCheckSelectedSpeakerChange = handleCheckSelectedSpeakerChange;

function handleCheckSelectedTitleChange() {
    searchTitleImpl();
}
window.handleCheckSelectedTitleChange = handleCheckSelectedTitleChange;

function getTitleForSearch(str){
    str = katakanaToHiragana(str);
    str = fullToHalf(str);
    return str.toLowerCase();
}

function katakanaToHiragana(str) {
    return str.replace(/[\u30a1-\u30f6]/g, function(match) {
        return String.fromCharCode( match.charCodeAt(0) - 0x60);
    });
}

function fullToHalf(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (match) {
      return String.fromCharCode(match.charCodeAt(0) - 0xFEE0);
    });
}