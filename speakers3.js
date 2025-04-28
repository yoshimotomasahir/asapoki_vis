let reporters = {};
let reporters_last_update = "";

const localStorageKey = 'jsonData';

function readData(data) {

    for (const speaker in data["reporters"]) {
        reporters[speaker] = {};
        reporters[speaker]["url"] = data["reporters"][speaker]["url"];
        reporters[speaker]["asapoki"] = speaker in data.speakers;
        reporters[speaker]["furiganaFloat"] = (data.speakers?.[speaker]?.furiganaFloat) ?? 0;
        reporters[speaker]["furigana"] = (data.speakers?.[speaker]?.furigana) ?? 0;
    }
    const sortedReportersArray = Object.entries(reporters).sort(([, a], [, b]) => a.furiganaFloat - b.furiganaFloat);
    reporters = Object.fromEntries(sortedReportersArray);
    reporters_last_update = data["reportersLastUpdate"];
}

function fetchData() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', true);
    xhr.onload = function () {
        const startTime = performance.now();
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            readData(data);
        } else {
            console.log('Error: ' + xhr.status);
        }
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

loadFromLocalStorage();
displayReporters();
fetchData();

function normalizeKana(kana) {
    return kana.normalize("NFD")
        .replace(/[\u3099\u309A]/g, "")
        .replace(/[ー～]/g, "")
        .charAt(0);
}

function displayReporters() {
    document.getElementById("reporter-asapoki").innerHTML = "";
    document.getElementById("reporter-others").innerHTML = "";
    document.getElementById("reporters_last_update").innerHTML = reporters_last_update;

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

        if (value["asapoki"]) {
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
}
window.addEventListener('DOMContentLoaded', () => {
    const savedScreen = localStorage.getItem('selectedScreen');
    if (savedScreen !== null) {
        showScreen(Number(savedScreen));
    } else {
        showScreen(0);
    }
});

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
