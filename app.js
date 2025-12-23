/* MULAFiT - beginner PWA workout app (no ads, local-only) */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "mulafit_v1";

const state = {
  planKey: "muscle",
  dayIndex: 0,
  exIndex: 0,
  weekIndex: 0,
  backPain: false,
  reps: 0,
  sets: 1,
  restSec: 60,
  restTimer: null,
  restLeft: 60,
  breathInterval: null
};

const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ---------- Splash (video only) ----------
function hideSplash(){
  const splash = $("splash");
  if (!splash) return;
  splash.classList.add("hide");
  setTimeout(() => { splash.style.display = "none"; }, 520);
}

function runSplash(){
  const splash = $("splash");
  const vid = $("splashVideo");
  const skip = $("skipSplash");
  if (!splash || !vid) return;

  // show once per tab session
  const shown = sessionStorage.getItem("mulafit_splash_shown");
  if (shown) {
    splash.style.display = "none";
    return;
  }
  sessionStorage.setItem("mulafit_splash_shown", "1");

  // If video ends, hide splash
  vid.addEventListener("ended", hideSplash);

  // Fail-safe: hide after 6 sec even if video loops/fails
  setTimeout(() => hideSplash(), 6000);

  if (skip) skip.onclick = hideSplash;
}

// ---------- Plans ----------
function ex(name, desc, imageFile, breathTip){
  return { name, desc, imageFile, breathTip };
}

const PLANS = {
  muscle: {
    name: "Muscle Build (Beginner)",
    hint: "3 days/week. Focus: form + controlled reps.",
    days: [
      { name: "Day 1 – Upper", exercises: [
        ex("Dumbbell Bench Press", "3 sets x 10 reps. Slow down on the way down.", "bench_press.png", "Exhale when pushing up, inhale when lowering."),
        ex("One-Arm Dumbbell Row", "3 sets x 10 reps each side. Keep back flat.", "db_row.png", "Exhale when pulling, inhale when lowering."),
        ex("Shoulder Press", "3 sets x 8–10 reps. Don’t over-arch.", "shoulder_press.png", "Exhale up, inhale down."),
      ]},
      { name: "Day 2 – Lower", exercises: [
        ex("Goblet Squat", "3 sets x 10 reps. Knees track toes.", "goblet_squat.png", "Inhale down, exhale up."),
        ex("Romanian Deadlift (DB)", "3 sets x 10 reps. Hinge hips, neutral spine.", "rdl.png", "Inhale down, exhale up."),
        ex("Calf Raises", "3 sets x 12 reps. Pause at top.", "calf_raise.png", "Exhale up, inhale down."),
      ]},
      { name: "Day 3 – Full Body", exercises: [
        ex("Incline Push-up", "3 sets x 8–12 reps. Tight core.", "incline_pushup.png", "Inhale down, exhale up."),
        ex("Dumbbell Split Squat", "3 sets x 8 reps each leg.", "split_squat.png", "Inhale down, exhale up."),
        ex("Plank", "3 rounds x 30–45 sec.", "plank.png", "Slow inhale through nose, slow exhale."),
      ]},
    ]
  },

  strength: {
    name: "Strength (Beginner)",
    hint: "3 days/week. Lower reps, longer rest. Focus: stability.",
    days: [
      { name: "Day 1 – Push", exercises: [
        ex("Dumbbell Floor Press", "5 sets x 5 reps. Heavy but clean form.", "floor_press.png", "Exhale press, inhale return."),
        ex("Standing Shoulder Press", "5 x 5 reps.", "shoulder_press.png", "Exhale up, inhale down."),
        ex("Triceps Dip (Bench)", "3 x 8 reps.", "bench_dip.png", "Exhale up, inhale down."),
      ]},
      { name: "Day 2 – Pull", exercises: [
        ex("One-Arm Row", "5 x 5 each side.", "db_row.png", "Exhale pull, inhale lower."),
        ex("Bicep Curl", "3 x 8 reps.", "curl.png", "Exhale curl, inhale lower."),
        ex("Dead Hang (if bar)", "3 x max time.", "dead_hang.png", "Steady breathing."),
      ]},
      { name: "Day 3 – Legs", exercises: [
        ex("Goblet Squat (heavy)", "5 x 5 reps.", "goblet_squat.png", "Inhale down, exhale up."),
        ex("RDL (heavy)", "5 x 5 reps.", "rdl.png", "Inhale down, exhale up."),
        ex("Farmer Carry", "4 x 30–60 sec walk.", "farmer_carry.png", "Brace, steady breathing."),
      ]},
    ]
  },

  hyrox: {
    name: "HYROX (Beginner)",
    hint: "2–3 days/week. Hybrid cardio + functional moves. Go easy first.",
    days: [
      { name: "Session A – Engine", exercises: [
        ex("Easy Run / Incline Walk", "10–15 min. Comfortable pace.", "run.png", "Inhale 2 steps, exhale 2 steps (easy)."),
        ex("Bodyweight Squat", "3 x 12 reps.", "bw_squat.png", "Inhale down, exhale up."),
        ex("Burpee (easy)", "3 x 6 reps. Step back if needed.", "burpee.png", "Exhale on effort, inhale reset."),
      ]},
      { name: "Session B – Hyrox Basics", exercises: [
        ex("Row (if machine) / Fast Walk", "8–10 min steady.", "row.png", "Steady breathing."),
        ex("Walking Lunges", "3 x 10 each leg.", "lunges.png", "Inhale step, exhale push."),
        ex("Sled Push/Pull (if gym) OR DB Push", "3 rounds 30–45 sec.", "sled.png", "Exhale on drive, inhale reset."),
      ]},
      { name: "Session C – Mix", exercises: [
        ex("Run / Walk Intervals", "10 min: 30s run + 60s walk.", "interval.png", "Breathe steady."),
        ex("Farmer Carry", "3 x 40 sec.", "farmer_carry.png", "Brace + steady exhale."),
        ex("Plank", "3 x 30–45 sec.", "plank.png", "Slow inhale, slow exhale."),
      ]},
    ]
  }
};

// ---------- Back-pain friendly swaps ----------
const LOW_IMPACT_SWAP = {
  "Burpee (easy)": ex("Step-Back Burpee (no jump)", "3 x 6 reps. Step back, no jumping. Keep core braced.", "burpee.png", "Exhale on effort, inhale reset."),
  "Run / Walk Intervals": ex("Incline Walk Intervals", "10 min: 60s brisk incline walk + 60s easy.", "interval.png", "Steady breathing."),
  "Easy Run / Incline Walk": ex("Incline Walk (low impact)", "10–15 min. Comfortable pace, short steps.", "run.png", "Steady breathing."),
  "Goblet Squat": ex("Box/Bench Goblet Squat", "3 x 10 reps. Sit to a bench/box lightly, stand up.", "goblet_squat.png", "Inhale down, exhale up."),
  "Romanian Deadlift (DB)": ex("Glute Bridge (instead of hinge)", "3 x 10 reps. Lie down, lift hips, squeeze glutes.", "rdl.png", "Exhale up, inhale down."),
  "RDL (heavy)": ex("Glute Bridge (DB optional)", "5 x 8 reps. Squeeze glutes, keep ribs down.", "rdl.png", "Exhale up, inhale down."),
  "Farmer Carry": ex("Suitcase Carry (1 DB)", "3–4 x 30–45 sec each side. Stand tall, don’t lean.", "farmer_carry.png", "Steady exhale, brace core."),
};

function applyBackPainMode(exObj){
  if (!state.backPain) return exObj;
  if (LOW_IMPACT_SWAP[exObj.name]) return LOW_IMPACT_SWAP[exObj.name];

  return {
    ...exObj,
    desc: exObj.desc + " (Back-friendly: brace core, neutral spine, stop if sharp pain.)"
  };
}

// ---------- Weekly plan ----------
function isoWeekString(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}

function escapeHtml(s){
  return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function getWeeklyPlan(planKey){
  const sessions = PLANS[planKey].days;
  const week = Array.from({ length: 7 }, () => ({
    type: "Rest",
    title: "Rest / Mobility",
    sessionIndex: null
  }));

  if (planKey === "hyrox"){
    [1,3,5].forEach((dayIdx, i) => {
      week[dayIdx] = { type: "Workout", title: sessions[i]?.name || "Session", sessionIndex: i };
    });
    week[0] = { type: "Optional", title: "Mobility + Easy Walk", sessionIndex: null };
  } else {
    [0,2,4].forEach((dayIdx, i) => {
      week[dayIdx] = { type: "Workout", title: sessions[i]?.name || "Day", sessionIndex: i };
    });
    week[5] = { type: "Optional", title: "Easy Walk + Core", sessionIndex: null };
  }

  return week;
}

// ---------- Storage ----------
function loadData(){
  try {
    return JSON.parse(localStorage.getItem("mulafit_v1")) || { weights: {}, bodyWeights: [] };
  } catch {
    return { weights: {}, bodyWeights: [] };
  }
}
function saveData(data){
  localStorage.setItem("mulafit_v1", JSON.stringify(data));
}

// ---------- Sound ----------
function beep(freq=880, durationMs=120){
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  g.gain.value = 0.12;
  o.start();
  setTimeout(() => { o.stop(); ctx.close(); }, durationMs);
}

// ---------- Voice ----------
function speak(text){
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.0;
  u.pitch = 1.0;
  u.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

// ---------- Render ----------
function renderPlanSelect(){
  const sel = $("planSelect");
  sel.innerHTML = "";
  Object.entries(PLANS).forEach(([key, p]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = state.planKey;
  $("planHint").textContent = PLANS[state.planKey].hint;
}

function renderWeekStrip(){
  const week = getWeeklyPlan(state.planKey);
  $("weekMeta").textContent = `Week: ${isoWeekString(new Date())}`;

  const wrap = $("weekStrip");
  wrap.innerHTML = "";

  week.forEach((d, idx) => {
    const card = document.createElement("button");
    card.className = "dayCard" + (idx === state.weekIndex ? " active" : "");
    card.type = "button";
    card.innerHTML = `
      <div class="dTop">
        <div class="dName">${WEEK_DAYS[idx]}</div>
        <div class="dType">${d.type}</div>
      </div>
      <div class="dTitle">${escapeHtml(d.title)}</div>
    `;
    card.onclick = () => {
      state.weekIndex = idx;
      if (d.sessionIndex !== null) {
        state.dayIndex = d.sessionIndex;
        state.exIndex = 0;
        state.reps = 0;
      }
      renderAll();
    };
    wrap.appendChild(card);
  });

  $("weekHint").textContent = state.backPain
    ? "Back-pain friendly mode ON: low impact substitutions will be used."
    : "Tap a day to jump into a workout session. Rest days: light walk + mobility.";
}

function renderDays(){
  const wrap = $("dayPills");
  wrap.innerHTML = "";
  const days = PLANS[state.planKey].days;

  days.forEach((d, idx) => {
    const b = document.createElement("button");
    b.className = "pill" + (idx === state.dayIndex ? " active" : "");
    b.textContent = d.name;
    b.onclick = () => {
      state.dayIndex = idx;
      state.exIndex = 0;
      renderAll();
    };
    wrap.appendChild(b);
  });
}

function currentExercise(){
  const plan = PLANS[state.planKey];
  const day = plan.days[state.dayIndex];
  return day.exercises[state.exIndex];
}

function exerciseKey(){
  const planName = PLANS[state.planKey].name;
  const dayName = PLANS[state.planKey].days[state.dayIndex].name;
  const exObj = applyBackPainMode(currentExercise());
  return `${planName} :: ${dayName} :: ${exObj.name}`;
}

function renderExercise(){
  const plan = PLANS[state.planKey];
  const day = plan.days[state.dayIndex];
  const exObj = applyBackPainMode(currentExercise());

  $("workoutTitle").textContent = plan.name + (state.backPain ? " • Back-friendly" : "");
  $("workoutMeta").textContent = `${day.name} • Exercise ${state.exIndex + 1}/${day.exercises.length}`;

  $("exName").textContent = exObj.name;
  $("exDesc").textContent = exObj.desc;

  const img = $("workoutImg");
  const fallback = $("mediaFallback");
  const path = `assets/images/${exObj.imageFile}`;

  img.onload = () => { img.style.display = "block"; fallback.style.display = "none"; };
  img.onerror = () => { img.style.display = "none"; fallback.style.display = "block"; };
  img.src = path;

  const data = loadData();
  const saved = data.weights[exerciseKey()];
  $("savedWeightText").textContent = saved ? `Saved: ${saved} kg` : "No saved dumbbell weight yet.";
  $("weightInput").value = saved || "";
}

function renderCounters(){
  $("repCount").textContent = String(state.reps);
  $("setCount").textContent = String(state.sets);
  $("restTime").textContent = String(state.restLeft ?? state.restSec);
}

function renderLogs(){
  const data = loadData();

  const weightsEl = $("weightsList");
  const entries = Object.entries(data.weights || {});
  if (!entries.length) {
    weightsEl.textContent = "No weights saved yet.";
  } else {
    weightsEl.innerHTML = entries
      .slice(-20)
      .reverse()
      .map(([k,v]) => `<div>• <span style="color:#a8b3cc">${escapeHtml(k)}</span><br><b>${escapeHtml(v)} kg</b></div>`)
      .join("<hr style='border:0;border-top:1px solid rgba(255,255,255,.06);margin:10px 0'/>");
  }

  const bwEl = $("bodyWeightList");
  const bw = data.bodyWeights || [];
  if (!bw.length) {
    bwEl.textContent = "No body weight entries yet.";
  } else {
    bwEl.innerHTML = bw.slice(-10).reverse()
      .map(x => `• Week of <b>${escapeHtml(x.week)}</b>: <b>${escapeHtml(x.weight)}</b> kg`)
      .join("<br/>");
  }
}

function renderAll(){
  $("planHint").textContent = PLANS[state.planKey].hint;
  $("backPainToggle").checked = state.backPain;

  renderWeekStrip();
  renderDays();
  renderExercise();
  renderCounters();
  renderLogs();
}

// ---------- Rest timer ----------
function startRest(){
  stopRest();
  state.restLeft = state.restSec;
  beep(900, 100);
  renderCounters();

  state.restTimer = setInterval(() => {
    state.restLeft -= 1;
    $("restTime").textContent = String(state.restLeft);
    if (state.restLeft <= 0){
      stopRest();
      beep(480, 180);
    }
  }, 1000);
}
function stopRest(){
  if (state.restTimer){
    clearInterval(state.restTimer);
    state.restTimer = null;
  }
}

// ---------- Breathing coach ----------
function startBreathingCoach(){
  stopBreathingCoach();
  if (!$("breathToggle").checked){
    alert("Turn ON the breathing toggle first.");
    return;
  }

  const inhale = Math.max(1, parseInt($("inhaleSec").value || "2", 10));
  const exhale = Math.max(1, parseInt($("exhaleSec").value || "2", 10));
  const cycleMs = (inhale + exhale) * 1000;

  let phase = "inhale";
  speak("Inhale");

  state.breathInterval = setInterval(() => {
    if (!$("breathToggle").checked){
      stopBreathingCoach();
      return;
    }
    phase = (phase === "inhale") ? "exhale" : "inhale";
    speak(phase === "inhale" ? "Inhale" : "Exhale");
  }, cycleMs);
}

function stopBreathingCoach(){
  if (state.breathInterval){
    clearInterval(state.breathInterval);
    state.breathInterval = null;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// ---------- Export ----------
function exportData(){
  const data = loadData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mulafit-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Exit ----------
function setupExit(){
  $("exitBtn").onclick = () => {
    // In a browser this may be blocked; fallback: go back or close splash
    history.back();
    setTimeout(() => {
      // if still here, just scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 150);
  };
}

// ---------- Events ----------
function setupEvents(){
  $("planSelect").addEventListener("change", (e) => {
    state.planKey = e.target.value;
    state.dayIndex = 0;
    state.exIndex = 0;
    state.reps = 0;
    state.weekIndex = 0;
    renderAll();
  });

  $("backPainToggle").addEventListener("change", (e) => {
    state.backPain = e.target.checked;
    state.exIndex = 0;
    state.reps = 0;
    renderAll();
  });

  $("prevEx").onclick = () => {
    state.exIndex = Math.max(0, state.exIndex - 1);
    state.reps = 0;
    renderAll();
  };
  $("nextEx").onclick = () => {
    const len = PLANS[state.planKey].days[state.dayIndex].exercises.length;
    state.exIndex = Math.min(len - 1, state.exIndex + 1);
    state.reps = 0;
    renderAll();
  };

  $("repMinus").onclick = () => { state.reps = Math.max(0, state.reps - 1); renderCounters(); };
  $("repPlus").onclick = () => { state.reps += 1; renderCounters(); };

  $("setMinus").onclick = () => { state.sets = Math.max(1, state.sets - 1); beep(500,120); renderCounters(); };
  $("setPlus").onclick = () => { state.sets += 1; beep(500,120); renderCounters(); };

  $("restMinus").onclick = () => { state.restSec = Math.max(10, state.restSec - 10); state.restLeft = state.restSec; renderCounters(); };
  $("restPlus").onclick = () => { state.restSec = Math.min(600, state.restSec + 10); state.restLeft = state.restSec; renderCounters(); };

  $("repBeep").onclick = () => beep(880, 80);
  $("setBeep").onclick = () => beep(520, 130);

  $("startRest").onclick = startRest;
  $("stopRest").onclick = stopRest;

  $("saveWeightBtn").onclick = () => {
    const val = $("weightInput").value.trim();
    if (!val) return;

    const data = loadData();
    data.weights[exerciseKey()] = val;
    saveData(data);
    beep(740,120);
    renderExercise();
    renderLogs();
  };

  $("saveBodyWeightBtn").onclick = () => {
    const val = $("bodyWeightInput").value.trim();
    if (!val) return;

    const data = loadData();
    const week = isoWeekString(new Date());
    data.bodyWeights = data.bodyWeights || [];

    const idx = data.bodyWeights.findIndex(x => x.week === week);
    if (idx >= 0) data.bodyWeights[idx] = { week, weight: val };
    else data.bodyWeights.push({ week, weight: val });

    saveData(data);
    $("bodyWeightInput").value = "";
    beep(660,120);
    renderLogs();
  };

  $("startBreath").onclick = startBreathingCoach;
  $("stopBreath").onclick = stopBreathingCoach;
  $("testVoice").onclick = () => speak("Inhale… and exhale…");

  $("exportBtn").onclick = exportData;
  $("resetBtn").onclick = () => {
    if (confirm("Reset all saved data?")){
      localStorage.removeItem(STORAGE_KEY);
      renderLogs();
      renderExercise();
    }
  };
}

// ---------- Init ----------
function init(){
  runSplash();
  setupExit();
  renderPlanSelect();
  state.restLeft = state.restSec;
  setupEvents();
  renderAll();
}

init();
