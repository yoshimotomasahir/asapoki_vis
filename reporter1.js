let reporters = {};
let reporters_last_update = "";

const localStorageKey = 'jsonData';

function readData(data) {

    for (const speaker in data["reporters"]) {
        reporters[speaker] = {};
        reporters[speaker]["url"] = data["reporters"][speaker]["url"];
        reporters[speaker]["asapoki"] = speaker in data.speakers;
        reporters[speaker]["furiganaFloat"] = (data.speakers?.[speaker]?.furiganaFloat) ?? 0;
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

function displayReporters() {
    document.getElementById("reporter_asapoki").innerHTML = "";
    document.getElementById("reporter_others").innerHTML = "";
    document.getElementById("reporters_last_update").innerHTML = reporters_last_update;

    let count_asapoki = 0;
    let count_others = 0;
    for (const key in reporters) {
        const value = reporters[key];
        const element = document.createElement("a");
        element.textContent = key;
        element.href = value["url"];
        element.rel = "nofollow";
        element.target = "_blank";
        element.className = "name";

        if (value["asapoki"]) {
            document.getElementById("reporter_asapoki").appendChild(element);
            count_asapoki += 1;
        }
        else {
            document.getElementById("reporter_others").appendChild(element);
            count_others += 1;
        }
        document.getElementById("num_reporter_asapoki").innerHTML = count_asapoki;
        document.getElementById("num_reporter_others").innerHTML = count_others;
    }
}
