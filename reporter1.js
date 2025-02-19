var reporters = {};

const localStorageKey = 'jsonData';

function readData(data) {

    for (const key in data["reporters"]) {
        reporters[key] = {};
        reporters[key]["url"] = data["reporters"][key]["url"];
        reporters[key]["asapoki"] = key in data.speakers;
    }
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

    for (const key in reporters) {
        const value = reporters[key];
        const element = document.createElement("a");
        element.textContent = key;
        element.href = value["url"];
        element.rel = "nofollow";
        element.target = "_blank";
        element.className = "name";

        const parentElement = value["asapoki"]
            ? document.getElementById("reporter_asapoki")
            : document.getElementById("reporter_others");

        parentElement.appendChild(element);
    }
}
