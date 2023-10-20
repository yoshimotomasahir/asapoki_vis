var speakers2title = { "genba": {}, "media": {}, "sdgs": {} }
var allTitles = { "genba": [], "media": [], "sdgs": [] }
var allSpeakers = [];

var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', false);
// xhr.open('GET', 'echo.json', false);
xhr.onload = function () {
    if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        for (var cat = 0; cat < 3; cat++) {
            if (cat == 0) {
                var catdata = data.genba;
                var category = "genba";
            }
            else if (cat == 1) {
                var catdata = data.media;
                var category = "media";
            }
            else if (cat == 2) {
                var catdata = data.sdgs;
                var category = "sdgs";
            }
            var speakers = [];
            for (var i = 0; i < catdata.length; i++) {
                speakers = speakers.concat(catdata[i].mc);
                speakers = speakers.concat(catdata[i].speakers);
                var combined = catdata[i].mc.concat(catdata[i].speakers);
                for (var j = 0; j < combined.length; j++) {
                    if (typeof speakers2title[category][combined[j]] === "undefined") {
                        speakers2title[category][combined[j]] = [];
                    }
                    speakers2title[category][combined[j]].push('<a href="' + catdata[i].link + '">' + catdata[i].title + '</a>');
                }
                allTitles[category].push('<a href="' + catdata[i].link + '">' + catdata[i].title + '</a>')
            }

            speakers = Array.from(new Set(speakers));
            const index = speakers.indexOf("");
            speakers.splice(index, 1);
            // console.log(speakers);

            document.getElementById("n" + category).innerHTML = "<b>" + (speakers.length).toString() + "</b>";
            document.getElementById(category).innerHTML = '<span class="name">' + speakers.join('</span>, <span class="name">') + '</span>';

            allSpeakers = allSpeakers.concat(speakers);
        }
        allSpeakers = Array.from(new Set(allSpeakers));
        document.getElementById("number").innerHTML = "<b>" + (allSpeakers.length).toString() + "</b>";
        document.getElementById("all").innerHTML = '<span class="name">' + allSpeakers.join('</span>, <span class="name">') + '</span>';
    }
    else {
        console.log('Error: ' + xhr.status);
    }
};
xhr.send();

var selectedName = null;
addSelectNameListener(".name");
getQuerySpeaker();

function addSelectNameListener(classname) {
    var nameElements = document.querySelectorAll(classname);
    //名前をクリックしたときのイベントリスナーを付与
    nameElements.forEach(function (element) {
        element.addEventListener("click", function () {
            if (selectedName !== null) {
                selectedName.classList.remove("clicked");
            }
            selectedName = this;
            this.classList.add("clicked");
            for (var cat = 0; cat < 3; cat++) {
                if (cat == 0) {
                    var category = "genba";
                }
                else if (cat == 1) {
                    var category = "media";
                }
                else if (cat == 2) {
                    var category = "sdgs";
                }
                var titleDisplay = document.getElementById(category + "_title");
                if (typeof speakers2title[category][selectedName.textContent] === "undefined") {
                    titleDisplay.innerHTML = "";
                    document.getElementById("n" + category + "_title").innerHTML = "<b>0</b>";
                }
                else {
                    titleDisplay.innerHTML = speakers2title[category][selectedName.textContent].join("<br>");
                    var n = speakers2title[category][selectedName.textContent].length;
                    document.getElementById("n" + category + "_title").innerHTML = "<b>" + n + "</b>";
                }
            }
            var newQueryString = 'speaker=' + selectedName.textContent;
            var newState = { page: 'newPage' };
            window.history.pushState(newState, '', '?' + newQueryString);
        });
    });
}

function getQuerySpeaker() {
    var queryString = window.location.search;
    var params = new URLSearchParams(queryString);
    var queryParameters = {};
    params.forEach(function (value, key) {
        queryParameters[key] = value;
    });
    if (queryParameters.hasOwnProperty("speaker")) {
        document.getElementById("search-speaker-input").value = queryParameters.speaker;
        searchSpeaker();
        document.querySelectorAll(".name-search")[0].click();
    }
}

function search(searchString, text) {
    //ワード検索
    searchString = searchString.replace(/\u3000/g, " ");
    var searchStrings = searchString.split(" ");
    for (var i = 0; i < searchStrings.length; i++) {
        if (!text.includes(searchStrings[i])) {
            return false;
        }
    }
    return true;
}

function searchSpeaker() {
    var searchInput = document.getElementById("search-speaker-input").value;
    if (searchInput === "") { }
    else {
        var filteredSpeakers = allSpeakers.filter(function (speaker) {
            return search(searchInput, speaker);
        });
        document.getElementById("searched").innerHTML = filteredSpeakers.length + ' 名: ' + '<span class="name-search">' + filteredSpeakers.join('</span>, <span class="name-search">') + '</span>';
        addSelectNameListener(".name-search");
    }
}
window.searchSpeaker = searchSpeaker;

function searchTitle() {
    var searchInput = document.getElementById("search-title-input").value;
    if (searchInput === "") { }
    else {
        for (var cat = 0; cat < 3; cat++) {
            if (cat == 0) {
                var category = "genba";
            }
            else if (cat == 1) {
                var category = "media";
            }
            else if (cat == 2) {
                var category = "sdgs";
            }
            var filteredTitles = allTitles[category].filter(function (title) {
                return search(searchInput, title);
            });
            var titleDisplay = document.getElementById(category + "_title");
            if (filteredTitles.length === 0) {
                titleDisplay.innerHTML = "";
                document.getElementById("n" + category + "_title").innerHTML = "<b>0</b>";
            }
            else {
                titleDisplay.innerHTML = filteredTitles.join("<br>");
                var n = filteredTitles.length;
                document.getElementById("n" + category + "_title").innerHTML = "<b>" + n + "</b>";
            }
        }
        var nameElements = document.querySelectorAll(".name");
        for (var i = 0; i < nameElements.length; i++) {
            nameElements[i].classList.remove("clicked");
        }
    }
}
window.searchTitle = searchTitle;

function checkEnter(event) {
    //エンターキーイベント
    if (event.key === "Enter") {
        if (event.target.id === "search-speaker-input") {
            searchSpeaker();
        }
        else if (event.target.id === "search-title-input") {
            searchTitle();
        }
    }
}
window.checkEnter = checkEnter;
