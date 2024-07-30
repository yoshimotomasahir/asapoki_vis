let allTitles = { "genba": [], "media": [], "sdgs": [] }
let allSpeakers = [];
let allSpeakerDurations = {};
let categories = ["genba", "media", "sdgs"];
let speakerQ = "";
let titleQ = "";
let selectedSpeaker = null;
let scatterChart = null;
const startMonths = 2020 * 12 + 7; // 2020年8月
let startMonth = 0;
let endMonth = 0;
let maxDuration = 230;
let minDurationRange = 0;
let maxDurationRange = 230;

let xhr = new XMLHttpRequest();
xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', false);
// xhr.open('GET', 'echo.json', false);
xhr.onload = function () {
    if (xhr.status === 200) {
        let data = JSON.parse(xhr.responseText);
        for (let cat = 0; cat < 3; cat++) {
            let catData = data[categories[cat]];
            let category = categories[cat];
            let catSpeakerDurations = {};
            for (let i = 0; i < catData.length; i++) {
                const combined = catData[i].mc.concat(catData[i].speakers);
                const duration = catData[i].duration;
                const title = catData[i].title;
                let actualDuration = duration;
                if (duration / 60 > maxDuration){
                    maxDuration = Math.ceil(duration / 10 / 60) * 10;
                }
                if (title.length >= 3 && title.substring(0, 3) === "（再）") {
                    actualDuration = 0;
                }
                combined.forEach(function (speaker) {
                    if (!(speaker in catSpeakerDurations)) {
                        catSpeakerDurations[speaker] = actualDuration;
                    } else {
                        catSpeakerDurations[speaker] += actualDuration;
                    }
                    if (!(speaker in allSpeakerDurations)) {
                        allSpeakerDurations[speaker] = actualDuration;
                    } else {
                        allSpeakerDurations[speaker] += actualDuration;
                    }
                });
                const date = new Date(catData[i].pubDate);
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const day = date.getDate().toString().padStart(2, '0');
                const titleData = {};
                titleData.link = catData[i].link;
                titleData.year = year;
                titleData.month = month;
                titleData.months = date.getFullYear() * 12 + date.getMonth() - startMonths;
                titleData.day = day;
                titleData.title = catData[i].title;
                titleData.titleForSearch = getTitleForSearch(catData[i].title);
                titleData.date = year + '/' + month + '/' + day;
                titleData.speakers = combined;
                titleData.duration = duration;
                titleData.minutes = Math.round(duration / 60);
                titleData.html = '<a href="' + titleData.link + '" rel="nofollow" target="_blank"><span class="article-title">' + titleData.title + '</span> <span class="article-date">' + titleData.minutes + '分  ' + titleData.date + '</span></a>&nbsp;&nbsp;<span class="article-speaker" style="display:none;"><span class="name">' + combined.join('</span>, <span class="name">') + '</span></span>';
                allTitles[category].push(titleData);
            }

            // 番組別の出演者一覧
            let catSpeakers = sortSpeakersByDuration(catSpeakerDurations);
            document.getElementById("n" + category).innerHTML = "<b>" + (catSpeakers.length).toString() + "</b>";
            document.getElementById(category).innerHTML = '<span class="name">' + catSpeakers.join('</span>, <span class="name">') + '</span>';

        }
        // 3番組の出演者一覧
        allSpeakers = sortSpeakersByDuration(allSpeakerDurations);
        document.getElementById("number").innerHTML = "<b>" + (allSpeakers.length).toString() + "</b>";
        document.getElementById("all").innerHTML = '<span class="name">' + allSpeakers.join('</span>, <span class="name">') + '</span>';
    }
    else {
        console.log('Error: ' + xhr.status);
    }
};
xhr.send();

const today = new Date();
const totalMonths = today.getFullYear() * 12 + today.getMonth() - startMonths;

const startSlider = document.getElementById('start-slider');
const endSlider = document.getElementById('end-slider');
const startValue = document.getElementById('start-value');
const endValue = document.getElementById('end-value');

startSlider.max = totalMonths;
endSlider.max = totalMonths;
endSlider.value = totalMonths;

function getFormattedDate(value) {
    const months = startMonths + parseInt(value);
    const year = Math.floor(months / 12);
    const month = String(months % 12 + 1).padStart(2, '0');
    return `${year}年${month}月`;
}

function updateMonthsValues() {
    startValue.textContent = getFormattedDate(startSlider.value);
    endValue.textContent = getFormattedDate(endSlider.value);
    startMonth = parseInt(startSlider.value);
    endMonth = parseInt(endSlider.value);
    searchTitleImpl();
}

function updateStartMonthsValues() {
    if (parseInt(startSlider.value) > parseInt(endSlider.value)) {
        endSlider.value = parseInt(startSlider.value);
    }
    updateMonthsValues();
}

function updateEndMonthsValues() {
    if (parseInt(startSlider.value) > parseInt(endSlider.value)) {
        startSlider.value = parseInt(endSlider.value);
    }
    updateMonthsValues();
}

startSlider.addEventListener('input', updateStartMonthsValues);
endSlider.addEventListener('input', updateEndMonthsValues);

updateMonthsValues();

const minDurationSlider = document.getElementById('min-duration-slider');
const maxDurationSlider = document.getElementById('max-duration-slider');
const minDurationValue = document.getElementById('min-duration-value');
const maxDurationValue = document.getElementById('max-duration-value');

minDurationSlider.max = maxDuration - 10;
maxDurationSlider.max = maxDuration;
maxDurationSlider.value = maxDuration;

function updateDurationValues() {
    minDurationValue.textContent = `${minDurationSlider.value.padStart(3, ' ')}`;
    maxDurationValue.textContent = `${maxDurationSlider.value.padStart(3, ' ')}`;
    minDurationRange = parseInt(minDurationSlider.value);
    maxDurationRange = parseInt(maxDurationSlider.value);
    searchTitleImpl();
}

function updateMinDurationValues() {
    if (parseInt(minDurationSlider.value) >= parseInt(maxDurationSlider.value)) {
        maxDurationSlider.value = parseInt(minDurationSlider.value) + 10;
    }
    updateDurationValues();
}
function updateMaxDurationValues() {
    if (parseInt(minDurationSlider.value) >= parseInt(maxDurationSlider.value)) {
        minDurationSlider.value = parseInt(maxDurationSlider.value) - 10;
    }
    updateDurationValues();
}

minDurationSlider.addEventListener('input', updateMinDurationValues);
maxDurationSlider.addEventListener('input', updateMaxDurationValues);

updateDurationValues();

function changeSliderValue(sliderId, change) {
    const slider = document.getElementById(sliderId);
    let newValue = parseInt(slider.value) + change;
    if (newValue >= parseInt(slider.min) && newValue <= parseInt(slider.max)) {
        slider.value = newValue;
        if (sliderId === 'start-slider') {
            updateStartMonthsValues();
        } else if (sliderId === 'end-slider') {
            updateEndMonthsValues();
        } else if (sliderId === 'min-duration-slider') {
            updateMinDurationValues();
        } else if (sliderId === 'max-duration-slider') {
            updateMaxDurationValues();
        }
    }
}
window.changeSliderValue = changeSliderValue;

addSelectNameListener(".name");
getQuerySpeaker();
searchTitleImpl(true);

function sortSpeakersByDuration(speakerDurations) {
    let sortedSpeakerDurations = Object.keys(speakerDurations).map(function (key) {
        return [key, speakerDurations[key]];
    });
    sortedSpeakerDurations.sort(function (first, second) {
        return second[1] - first[1];
    });
    let speakers = sortedSpeakerDurations.map(function (item) {
        return item[0];
    });
    return speakers;
}

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
            document.getElementById("selected-speaker").textContent = speakerQ + " (" + (allSpeakerDurations[speakerQ] / 60.0).toFixed(0) + "分)";
            document.getElementById("check-selected-speaker").checked = true;
            // タイトルの検索設定をリセット
            document.getElementById("search-title-input").value = "";
            titleQ = document.getElementById("search-title-input").value;
            document.getElementById("selected-title").innerHTML = '<span class="not-selected">未選択</span>';
            document.getElementById("check-selected-title").checked = true;
            searchTitleImpl(true);
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

function searchTitleImpl(updateScatter = false) {
    // console.log([titleQ, speakerQ]);
    let dateList = [];
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
        let dates = [];
        for (var i = 0; i < filteredTitles.length; i++) {
            dates.push(new Date(filteredTitles[i].date));
        }
        dateList.push(dates);

        filteredTitles = filteredTitles.filter(function (titleData) {
            return startMonth <= titleData.months && titleData.months <= endMonth;
        });

        filteredTitles = filteredTitles.filter(function (titleData) {
            return minDurationRange <= titleData.minutes && titleData.minutes <= maxDurationRange;
        });

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
    if (updateScatter) {
        drawScatter(dateList);
    }
    handleCheckDisplaySpeakerChange();
}

function checkEnter(event) {
    //エンターキーイベント
    if (event.key === "Enter") {
        if (event.target.id === "search-speaker-input") { searchSpeaker(); }
        else if (event.target.id === "search-title-input") { searchTitle(); }
    }
}
window.checkEnter = checkEnter;

function handleCheckSelectedSpeakerChange() {
    searchTitleImpl(true);
}
window.handleCheckSelectedSpeakerChange = handleCheckSelectedSpeakerChange;

function handleCheckSelectedTitleChange() {
    searchTitleImpl();
}
window.handleCheckSelectedTitleChange = handleCheckSelectedTitleChange;

function getTitleForSearch(str) {
    str = katakanaToHiragana(str);
    str = fullToHalf(str);
    return str.toLowerCase();
}

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

function handleCheckDisplaySpeakerChange() {
    var displayValue = document.getElementById("check-display-speaker").checked ? 'inline' : 'none';
    var toggleContents = document.querySelectorAll('.article-speaker');
    toggleContents.forEach(function (content) {
        content.style.display = displayValue;
    });
}
window.handleCheckDisplaySpeakerChange = handleCheckDisplaySpeakerChange;

function drawScatter(dateList) {
    let ctx = document.getElementById('scatter').getContext('2d');
    let datasets = [];
    for (let i = 0; i < 3; i++) {
        let dataset = [];
        for (let j = 0; j < dateList[i].length; j++) {
            dataset.push({ x: dateList[i][j], y: (1 - i) * 0.4 })
        }
        datasets.push({ data: dataset });
    }
    if (scatterChart) {
        scatterChart.destroy();
    }
    scatterChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    time: {
                        unit: 'year',
                        displayFormats: { year: 'YYYY年' }
                    },
                    ticks: {
                        min: new Date('2020-08-01T00:00:00'),
                        max: new Date(),
                    }
                }],
                yAxes: [{
                    display: false,
                    ticks: {
                        min: -1,
                        max: 1,
                    }
                }]
            },
            tooltips: { enabled: false },
            legend: { display: false, },
            plugins: {
                colorschemes: {
                    scheme: 'brewer.DarkTwo3'
                }
            }
        },
    });
}