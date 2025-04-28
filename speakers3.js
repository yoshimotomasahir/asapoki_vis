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
