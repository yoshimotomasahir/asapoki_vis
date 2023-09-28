var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', false);
// xhr.open('GET', 'echo.json', false);
xhr.onload = function () {
    if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);
        var allSpeakers = [];
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
            }

            speakers = Array.from(new Set(speakers));
            const index = speakers.indexOf("");
            speakers.splice(index, 1);
            // console.log(speakers);

            document.getElementById(category).innerHTML = speakers.join(", ");
            document.getElementById("n" + category).innerHTML = "<b>" + (speakers.length).toString() + "</b>";

            allSpeakers = allSpeakers.concat(speakers);
        }
        allSpeakers = Array.from(new Set(allSpeakers));
        document.getElementById("number").innerHTML = "<b>" + (allSpeakers.length).toString() + "</b>";
    }
    else {
        console.log('Error: ' + xhr.status);
    }
};
xhr.send();
