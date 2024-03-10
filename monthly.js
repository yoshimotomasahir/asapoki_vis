dayjs.extend(dayjs_plugin_weekday);
dayjs.extend(dayjs_plugin_weekOfYear);

document.getElementById("app").innerHTML = `
<div class="calendar-month">
  <div id="top-navigation">
    <section class="calendar-month-header">
      <div
        id="selected-month"
        class="calendar-month-header-selected-month"
      ></div>
      <section class="calendar-month-header-selectors">
        <span id="previous-month-selector"><</span>
        <span id="present-month-selector">今日</span>
        <span id="next-month-selector">></span>
      </section>
    </section>

    <ol
      id="days-of-week"
      class="day-of-week"
    /></ol>
  </div>
  <ol
    id="calendar-days"
    class="days-grid"
  >
  </ol>
</div>
`;

var titles = {};

var xhr = new XMLHttpRequest();
xhr.open('GET', 'https://script.google.com/macros/s/AKfycby1G_qqb8xBJh8adQBuvLsA5wOcnqYu59W22hs1jMlj4IT2DlqnJA7uaUG16GXJHDKU/exec', false);
// xhr.open('GET', 'echo.json', false);
xhr.onload = function () {
  if (xhr.status === 200) {
    var data = JSON.parse(xhr.responseText);
    for (var cat = 0; cat < 4; cat++) {
      if (cat == 0) {
        var catData = data.genba;
        var category = "現場";
      }
      else if (cat == 1) {
        var catData = data.media;
        var category = "メディア";
      }
      else if (cat == 2) {
        var catData = data.sdgs;
        var category = "SDGs";
      }
      else if (cat == 3) {
        var catData = data.YouTube;
        var category = "YouTube";
      }
      for (var i = 0; i < catData.length; i++) {
        var title = catData[i].title;
        var link = catData[i].link;

        var date = new Date(catData[i].pubDate);
        var year = date.getFullYear();
        var month = (date.getMonth() + 1).toString().padStart(2, '0');
        var day = date.getDate().toString().padStart(2, '0');
        var date = year + '-' + month + '-' + day;

        if (!titles.hasOwnProperty(date)) {
          titles[date] = [];
        }
        titles[date].push([title, link, category]);
      }
    }
  }
  else {
    console.log('Error: ' + xhr.status);
  }
};
xhr.send();

// const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAYS = ["月(Mon)", "火(Tue)", "水(Wed)", "木(Thu)", "金(Fri)", "土(Sat)", "日(Sun)"];
const TODAY = dayjs().format("YYYY-MM-DD");

const INITIAL_YEAR = dayjs().format("YYYY");
const INITIAL_MONTH = dayjs().format("M");

let selectedMonth = dayjs(new Date(INITIAL_YEAR, INITIAL_MONTH - 1, 1));
let currentMonthDays;
let previousMonthDays;
let nextMonthDays;

const daysOfWeekElement = document.getElementById("days-of-week");

WEEKDAYS.forEach((weekday) => {
  const weekDayElement = document.createElement("li");
  daysOfWeekElement.appendChild(weekDayElement);
  weekDayElement.innerText = weekday;
});

createCalendar();
initMonthSelectors();

const targetElement = document.getElementById("calendar-day--today");
targetElement.scrollIntoView();

function createCalendar(year = INITIAL_YEAR, month = INITIAL_MONTH) {
  const calendarDaysElement = document.getElementById("calendar-days");

  document.getElementById("selected-month").innerText = dayjs(
    new Date(year, month - 1)
  ).format("YYYY年 M月");

  removeAllDayElements(calendarDaysElement);

  currentMonthDays = createDaysForCurrentMonth(
    year,
    month,
    dayjs(`${year}-${month}-01`).daysInMonth()
  );

  previousMonthDays = createDaysForPreviousMonth(year, month);

  nextMonthDays = createDaysForNextMonth(year, month);

  const days = [...previousMonthDays, ...currentMonthDays, ...nextMonthDays];

  days.forEach((day) => {
    appendDay(day, calendarDaysElement);
  });
}

function appendDay(day, calendarDaysElement) {
  const dayElement = document.createElement("li");
  const dayElementClassList = dayElement.classList;
  dayElementClassList.add("calendar-day");
  const dayOfMonthElement = document.createElement("span");
  dayOfMonthElement.innerText = day.dayOfMonth;
  dayElement.appendChild(dayOfMonthElement);

  {
    const SpaceElement = document.createElement("div");
    const SpaceClassList = SpaceElement.classList;
    SpaceClassList.add("day-space");
    dayElement.appendChild(SpaceElement);
  }
  if (titles.hasOwnProperty(day["date"])) {
    for (var i = 0; i < titles[day["date"]].length; i++) {
      const podcastElement = document.createElement("div");
      const linkElement = document.createElement("a");
      linkElement.setAttribute("rel", "nofollow");
      linkElement.setAttribute("target", "_blank");
      var title = titles[day["date"]][i][0];
      var link = titles[day["date"]][i][1];
      var category = titles[day["date"]][i][2];
      //   var minutes = titles[day["date"]][i][3];
      //   linkElement.textContent = "【"+category+"】"+title+" ("+minutes+"分)";
      linkElement.innerHTML = "<b>【" + category + "】</b>" + title;
      linkElement.href = link;
      podcastElement.appendChild(linkElement);
      const podcastElementClassList = podcastElement.classList;
      podcastElementClassList.add("titles");
      dayElement.appendChild(podcastElement);
    }
  }
  calendarDaysElement.appendChild(dayElement);

  if (!day.isCurrentMonth) {
    dayElementClassList.add("calendar-day--not-current");
  }

  if (day.date === TODAY) {
    dayElementClassList.add("calendar-day--today");
    dayElement.id = "calendar-day--today"
  }
}

function removeAllDayElements(calendarDaysElement) {
  let first = calendarDaysElement.firstElementChild;

  while (first) {
    first.remove();
    first = calendarDaysElement.firstElementChild;
  }
}

function getNumberOfDaysInMonth(year, month) {
  return dayjs(`${year}-${month}-01`).daysInMonth();
}

function createDaysForCurrentMonth(year, month) {
  return [...Array(getNumberOfDaysInMonth(year, month))].map((day, index) => {
    return {
      date: dayjs(`${year}-${month}-${index + 1}`).format("YYYY-MM-DD"),
      dayOfMonth: index + 1,
      isCurrentMonth: true
    };
  });
}

function createDaysForPreviousMonth(year, month) {
  const firstDayOfTheMonthWeekday = getWeekday(currentMonthDays[0].date);

  const previousMonth = dayjs(`${year}-${month}-01`).subtract(1, "month");

  // Cover first day of the month being sunday (firstDayOfTheMonthWeekday === 0)
  const visibleNumberOfDaysFromPreviousMonth = firstDayOfTheMonthWeekday
    ? firstDayOfTheMonthWeekday - 1
    : 6;

  const previousMonthLastMondayDayOfMonth = dayjs(currentMonthDays[0].date)
    .subtract(visibleNumberOfDaysFromPreviousMonth, "day")
    .date();

  return [...Array(visibleNumberOfDaysFromPreviousMonth)].map((day, index) => {
    return {
      date: dayjs(
        `${previousMonth.year()}-${previousMonth.month() + 1}-${previousMonthLastMondayDayOfMonth + index
        }`
      ).format("YYYY-MM-DD"),
      dayOfMonth: previousMonthLastMondayDayOfMonth + index,
      isCurrentMonth: false
    };
  });
}

function createDaysForNextMonth(year, month) {
  const lastDayOfTheMonthWeekday = getWeekday(
    `${year}-${month}-${currentMonthDays.length}`
  );

  const nextMonth = dayjs(`${year}-${month}-01`).add(1, "month");

  const visibleNumberOfDaysFromNextMonth = lastDayOfTheMonthWeekday
    ? 7 - lastDayOfTheMonthWeekday
    : lastDayOfTheMonthWeekday;

  return [...Array(visibleNumberOfDaysFromNextMonth)].map((day, index) => {
    return {
      date: dayjs(
        `${nextMonth.year()}-${nextMonth.month() + 1}-${index + 1}`
      ).format("YYYY-MM-DD"),
      dayOfMonth: index + 1,
      isCurrentMonth: false
    };
  });
}

function getWeekday(date) {
  return dayjs(date).weekday();
}

function initMonthSelectors() {
  document
    .getElementById("previous-month-selector")
    .addEventListener("click", function () {
      selectedMonth = dayjs(selectedMonth).subtract(1, "month");
      createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
    });

  document
    .getElementById("present-month-selector")
    .addEventListener("click", function () {
      selectedMonth = dayjs(new Date(INITIAL_YEAR, INITIAL_MONTH - 1, 1));
      createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
    });

  document
    .getElementById("next-month-selector")
    .addEventListener("click", function () {
      selectedMonth = dayjs(selectedMonth).add(1, "month");
      createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
    });
}

//スワイプ動作
let startX, currentX;

document.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

document.addEventListener('touchmove', (e) => {
  if (!startX) return;
  currentX = e.touches[0].clientX;
});

document.addEventListener('touchend', () => {
  if (!startX || !currentX) return;
  const diffX = currentX - startX;
  if (diffX > window.innerWidth * 0.2) {
    selectedMonth = dayjs(selectedMonth).subtract(1, "month");
    createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
  }
  else if (diffX < window.innerWidth * -0.2) {
    selectedMonth = dayjs(selectedMonth).add(1, "month");
    createCalendar(selectedMonth.format("YYYY"), selectedMonth.format("M"));
  }
  startX = null;
  currentX = null;
});
