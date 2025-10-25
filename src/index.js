import { openai, supabase } from "./config.js";
import movies from "./content.js";

const app = document.getElementById("app");

const template = () => `
  <div class="container">
    <!-- Start View -->
    <div id="start-view" class="view">
      <div class="card">
        <div class="logo">
          <div class="emoji"><img src="poster/popcorn.png" alt="Popcorn Icon"></div>
          <div class="brand">PopChoice</div>
        </div>
        <input type="number" id="numPeople" placeholder="How many people?" min="1" max="10"/>
        <input type="text" id="timeAvailable" placeholder="How much time do you have?"/>
        <button id="startBtn">Start</button>
      </div>
    </div>

    <!-- Person Question View -->
    <div id="person-view" class="view hidden">
      <div class="card">
        <div class="logo">
          <div class="emoji"><img src="poster/popcorn.png" alt="Popcorn Icon"></div>
          <div class="brand">PopChoice</div>
        </div>
        <div id="person-number" style="margin-bottom:10px;">Person 1</div>

        <label>What's your favorite movie and why?</label>
        <textarea id="pq1" placeholder="e.g. Interstellar – inspiring and emotional"></textarea>

        <label>Are you in the mood for something new or a classic?</label>
        <div class="button-group" id="pq2-group">
          <button type="button" class="option-btn" data-value="New">New</button>
          <button type="button" class="option-btn" data-value="Classic">Classic</button>
        </div>

        <label>What are you in the mood for?</label>
        <div class="button-group" id="pq3-group">
          <button type="button" class="option-btn" data-value="Fun">Fun</button>
          <button type="button" class="option-btn" data-value="Serious">Serious</button>
          <button type="button" class="option-btn" data-value="Inspiring">Inspiring</button>
          <button type="button" class="option-btn" data-value="Scary">Scary</button>
        </div>

        <button id="nextPersonBtn">Next Person</button>
      </div>
    </div>

    <!-- Output View -->
        <!-- Output View -->
    <div id="output-view" class="view hidden">
      <div class="card output-card">
        <div class="title-row">
          <h2 id="movie-title" class="movie-title"></h2>
          <div class="year" id="movie-year"></div>
        </div>
        <div class="poster" id="poster-wrap">
          <img id="poster-img" src="" alt="poster" />
        </div>
        <p id="movie-desc" class="movie-desc"></p>
        <div id="ai-explain" class="explain"></div>
        <button id="nextMovieBtn">Next Movie</button>
      </div>
    </div>
  </div>
`;

app.innerHTML = template();

/* ---------- DOM ---------- */
const startBtn = document.getElementById("startBtn");
const nextPersonBtn = document.getElementById("nextPersonBtn");
const nextMovieBtn = document.getElementById("nextMovieBtn");
const numPeopleInput = document.getElementById("numPeople");
const pq1 = document.getElementById("pq1");
const personNumber = document.getElementById("person-number");
const movieTitle = document.getElementById("movie-title");
const movieYear = document.getElementById("movie-year");
const movieDesc = document.getElementById("movie-desc");
const aiExplain = document.getElementById("ai-explain");
const posterImg = document.getElementById("poster-img");

let pq2Value = "New";
let pq3Value = "Fun";
let totalPeople = 1;
let currentPerson = 1;
let allAnswers = [];
let displayIndex = 0;

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

/* Button group logic */
function setupButtonGroups() {
  document.querySelectorAll(".button-group").forEach(group => {
    const buttons = group.querySelectorAll(".option-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (group.id === "pq2-group") pq2Value = btn.dataset.value;
        if (group.id === "pq3-group") pq3Value = btn.dataset.value;
      });
    });
  });
}

/* Default button active state */
function setDefaultSelections() {
  document.querySelectorAll("#pq2-group .option-btn")[0].classList.add("active");
  document.querySelectorAll("#pq3-group .option-btn")[0].classList.add("active");
  pq2Value = "New";
  pq3Value = "Fun";
}

setupButtonGroups();
setDefaultSelections();

const placeholderPoster = "https://via.placeholder.com/600x900/041431/ffffff?text=No+Poster";

/* Pick a movie for a person */
function pickMovieForAnswer(answer) {
  const a1 = answer.a1.toLowerCase();
  const isNew = answer.a2 === "New";
  const mood = answer.a3;

  let exact = movies.find(m => a1.includes(m.title.toLowerCase()));
  if (exact) return exact;

  const eraCandidates = movies.filter(m => {
    const y = Number(m.releaseYear);
    return isNew ? y >= 2010 : y < 2010;
  });

  const moodRegex =
    mood === "Fun"
      ? /(fun|comedy|adventure|animation|action)/i
      : mood === "Serious"
      ? /(drama|thriller|war|biography|history)/i
      : mood === "Inspiring"
      ? /(inspir|hope|dream|motiv)/i
      : /(scary|horror|dark|mystery|fear)/i;

  const filtered = eraCandidates.filter(
    m => moodRegex.test(m.shortDesc) || moodRegex.test(m.title)
  );

  if (filtered.length > 0) return filtered[Math.floor(Math.random() * filtered.length)];
  if (eraCandidates.length > 0) return eraCandidates[Math.floor(Math.random() * eraCandidates.length)];
  return movies[Math.floor(Math.random() * movies.length)];
}

/* ---------- Start ---------- */
startBtn.addEventListener("click", () => {
  totalPeople = parseInt(numPeopleInput.value, 10) || 1;
  if (totalPeople < 1) totalPeople = 1;
  currentPerson = 1;
  allAnswers = [];
  personNumber.textContent = `Person ${currentPerson}`;
  pq1.value = "";
  setDefaultSelections();
  showView("person-view");
});

/* ---------- Collect answers ---------- */
nextPersonBtn.addEventListener("click", () => {
  const a1 = pq1.value.trim();
  if (!a1) {
    alert("Please answer the first question.");
    return;
  }

  const answer = { a1, a2: pq2Value, a3: pq3Value };
  answer.selectedMovie = pickMovieForAnswer(answer);
  allAnswers.push(answer);

  if (currentPerson < totalPeople) {
    currentPerson++;
    personNumber.textContent = `Person ${currentPerson}`;
    pq1.value = "";
    setDefaultSelections();
  } else {
    displayIndex = 0;
    renderMovieForDisplayIndex(displayIndex);
    updateNextButtonLabel();
    showView("output-view");
  }
});

/* ---------- Show each person's movie ---------- */
function renderMovieForDisplayIndex(idx) {
  const entry = allAnswers[idx];
  const movie = entry?.selectedMovie || movies[0];

  movieTitle.textContent = movie.title;
  movieYear.textContent = `(${movie.releaseYear})`;
  movieDesc.textContent = movie.shortDesc;
  aiExplain.textContent = `Person ${idx + 1} preferences: "${entry.a1}" — this movie suits their taste.`;
  posterImg.src = movie.poster || placeholderPoster;
}

function updateNextButtonLabel() {
  nextMovieBtn.textContent = displayIndex < allAnswers.length - 1 ? "Next Movie" : "Get Movie";
}

/* ---------- Next Movie button ---------- */
nextMovieBtn.addEventListener("click", () => {
  if (displayIndex < allAnswers.length - 1) {
    displayIndex++;
    renderMovieForDisplayIndex(displayIndex);
    updateNextButtonLabel();
    return;
  }
  allAnswers = [];
  numPeopleInput.value = "";
  pq1.value = "";
  showView("start-view");
});

showView("start-view");

