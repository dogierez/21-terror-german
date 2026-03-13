const splash = document.getElementById('splash-screen'), instr = document.getElementById('instructions-screen'),
      app = document.getElementById('main-app'), grid = document.getElementById('stations-grid'),
      playerZone = document.getElementById('player-zone'), audio = document.getElementById('audio-player'),
      transcript = document.getElementById('transcript-box'), popup = document.getElementById('translation-popup'),
      gameZone = document.getElementById('game-zone'), gameBoard = document.getElementById('game-board'),
      feedbackArea = document.getElementById('quiz-feedback-area'), ptsVal = document.getElementById('points-val');

let lifetimeScore = parseInt(localStorage.getItem('tragediesScoreDE')) || 0;
let completedLessons = JSON.parse(localStorage.getItem('completedTragediesLessonsDE')) || [];
if(ptsVal) ptsVal.innerText = lifetimeScore;

let wordBucket = []; let currentQ = 0; let attempts = 0; let totalScore = 0; let firstCard = null;

let availableVoices = [];
window.speechSynthesis.onvoiceschanged = () => {
    availableVoices = window.speechSynthesis.getVoices();
};

const stations = [
    {file:"01_September11.mp3", title:"1. Die Anschläge vom 11. September"},
    {file:"02_AirIndia182.mp3", title:"2. Air-India-Flug 182"},
    {file:"03_Bali.mp3", title:"3. Die Bali-Anschläge"},
    {file:"04_Beslan.mp3", title:"4. Die Schule von Beslan"},
    {file:"05_Entebbe.mp3", title:"5. Die Entführung von Entebbe"},
    {file:"06_Garissa.mp3", title:"6. Garissa-Universität"},
    {file:"07_Mekka.mp3", title:"7. Die Große Moschee"},
    {file:"08_Jonestown.mp3", title:"8. Massaker von Jonestown"},
    {file:"09_Lockerbie.mp3", title:"9. Der Lockerbie-Anschlag"},
    {file:"10_London77.mp3", title:"10. Londoner Anschläge (7/7)"},
    {file:"11_Madrid.mp3", title:"11. Zuganschläge von Madrid"},
    {file:"12_MoskauTheater.mp3", title:"12. Moskauer Theater"},
    {file:"13_Mumbai.mp3", title:"13. Die Anschläge von Mumbai"},
    {file:"14_Muenchen72.mp3", title:"14. Olympia München 1972"},
    {file:"15_Nairobi.mp3", title:"15. US-Botschaft Nairobi"},
    {file:"16_Norwegen.mp3", title:"16. Anschläge in Norwegen"},
    {file:"17_OklahomaCity.mp3", title:"17. Oklahoma City"},
    {file:"18_Paris2015.mp3", title:"18. Anschläge in Paris"},
    {file:"19_Peshawar.mp3", title:"19. Schule in Peshawar"},
    {file:"20_TokioSarin.mp3", title:"20. Tokio Sarin-Anschlag"},
    {file:"21_Westgate.mp3", title:"21. Westgate Einkaufszentrum"}
];

function renderGrid() {
    grid.innerHTML = "";
    stations.forEach((s, i) => {
        const btn = document.createElement('div'); btn.className = 'station-tile';
        if(completedLessons.includes(s.file)) btn.classList.add('completed');
        btn.innerHTML = `<b>${i + 1}</b> ${s.title.replace(/^\d+\.\s*/, "")}`;
        btn.onclick = () => { 
            grid.classList.add('hidden'); playerZone.classList.remove('hidden'); 
            document.getElementById('now-playing-title').innerText = s.title; 
            audio.src = s.file; wordBucket = []; 
        };
        grid.appendChild(btn);
    });
}
renderGrid();

document.getElementById('btn-back').onclick = () => {
    audio.pause(); audio.currentTime = 0;
    playerZone.classList.add('hidden');
    transcript.classList.add('hidden');
    gameZone.classList.add('hidden');
    grid.classList.remove('hidden');
    currentQ = 0; attempts = 0;
};

document.getElementById('btn-start').onclick = () => { 
    splash.classList.add('hidden'); 
    instr.classList.remove('hidden'); 
    const unlockSpeech = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(unlockSpeech);
};

document.getElementById('btn-enter').onclick = () => { instr.classList.add('hidden'); app.classList.remove('hidden'); };

document.getElementById('ctrl-play').onclick = () => audio.play();
document.getElementById('ctrl-pause').onclick = () => audio.pause();
document.getElementById('ctrl-stop').onclick = () => { audio.pause(); audio.currentTime = 0; };
document.getElementById('btn-blind').onclick = () => { transcript.classList.add('hidden'); gameZone.classList.add('hidden'); audio.play(); };

document.getElementById('btn-read').onclick = () => {
    if (typeof lessonData === 'undefined') { alert("🚨 Fehler: data.js fehlgeschlagen!"); return; }
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const data = lessonData[fn][0];
    transcript.classList.remove('hidden'); gameZone.classList.add('hidden'); transcript.innerHTML = "";
    data.text.split(" ").forEach(w => {
        const span = document.createElement('span'); 
        const clean = w.toLowerCase().replace(/[^a-z0-9äöüßğüşöçı-]/gi, "");
        span.innerText = w + " "; span.className = "clickable-word";
        span.onclick = (e) => {
            const tr = data.dict[clean];
            if(tr) {
                if (!wordBucket.some(p => p.de === clean)) wordBucket.push({de: clean, tr: tr});
                popup.innerText = tr; popup.style.left = `${e.clientX}px`; popup.style.top = `${e.clientY - 50}px`;
                popup.classList.remove('hidden'); setTimeout(() => popup.classList.add('hidden'), 2000);
            }
        };
        transcript.appendChild(span);
    });
    audio.play();
};

document.getElementById('btn-game').onclick = () => {
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); feedbackArea.innerHTML = "";
    gameBoard.innerHTML = ""; firstCard = null; gameBoard.style.display = "grid";
    let set = [...wordBucket];
    for (let k in lesson.dict) { if (set.length >= 8) break; if (!set.some(p => p.de === k)) set.push({de: k, tr: lesson.dict[k]}); }
    let deck = [];
    
    set.forEach(p => { 
        deck.push({text: p.de, match: p.tr, lang: "de"}); 
        deck.push({text: p.tr, match: p.de, lang: "tr"}); 
    });
    
    deck.sort(() => Math.random() - 0.5);
    deck.forEach(card => {
        const div = document.createElement('div'); 
        div.className = 'game-card'; 
        div.innerText = card.text;
        
        // NUCLEAR OPTION COLORS
        if (card.lang === "de") {
            div.style.setProperty('color', '#ffaa00', 'important'); 
            div.style.setProperty('text-shadow', '0 0 8px #ffaa0088', 'important');
        } else {
            div.style.setProperty('color', '#39ff14', 'important'); 
            div.style.setProperty('text-shadow', '0 0 8px #39ff1488', 'important');
        }
        
        div.onclick = () => {
            if (div.classList.contains('correct') || div.classList.contains('selected')) return;
            if (firstCard) {
                if (firstCard.innerText === card.match) {
                    div.classList.add('correct'); firstCard.classList.add('correct'); firstCard = null;
                } else {
                    div.classList.add('wrong'); setTimeout(() => { div.classList.remove('wrong'); firstCard.classList.remove('selected'); firstCard = null; }, 500);
                }
            } else { firstCard = div; div.classList.add('selected'); }
        };
        gameBoard.appendChild(div);
    });
};

document.getElementById('btn-bowling').onclick = () => {
    audio.pause(); 
    let fn = decodeURIComponent(audio.src.split('/').pop()); 
    const lesson = lessonData[fn][0];
    transcript.classList.add('hidden'); gameZone.classList.remove('hidden'); gameBoard.style.display = "none";
    currentQ = 0; totalScore = 0; attempts = 0;
    runQuiz(lesson);
};

function runQuiz(lesson) {
    if (currentQ >= 7) { finishQuiz(); return; }
    const qData = lesson.questions[currentQ];
    feedbackArea.innerHTML = `
        <div id="quiz-container">
            <div class="score-badge">SCORE: ${totalScore} | Q: ${currentQ+1}/7</div>
            <button id="btn-hear-q" class="mode-btn neon-green">👂 FRAGE HÖREN</button>
            <div id="mic-box" style="margin-top:20px;">
                <button id="btn-speak" class="mic-btn">🎤</button>
                <p id="mic-status" style="color:#aaa; font-weight:bold;">Tippe auf das Mikrofon zum Sprechen</p>
            </div>
            <div id="res-area"></div>
        </div>`;
    
    document.getElementById('btn-hear-q').onclick = () => {
        audio.pause(); 
        window.speechSynthesis.cancel(); 
        
        setTimeout(() => {
            const utter = new SpeechSynthesisUtterance(qData.q);
            window.currentUtter = utter; 
            utter.lang = 'de-DE';
            utter.volume = 1.0; 
            utter.rate = 0.9; 
            
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                let deVoice = voices.find(v => v.lang.toLowerCase().includes('de'));
                if (deVoice) {
                    utter.voice = deVoice;
                }
            }
            window.speechSynthesis.speak(utter);
        }, 100);
    };
    
    document.getElementById('btn-speak').onclick = function() {
        const btn = this; const status = document.getElementById('mic-status');
        const SpeechRec = window.webkitSpeechRecognition || window.SpeechRecognition;
        
        if (!SpeechRec) {
            status.innerHTML = "⚠️ Browser blockiert das Mikrofon.";
            status.style.color = "#ff4444";
            return;
        }
        
        window.currentRec = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
        window.currentRec.lang = 'de-DE';
        window.currentRec.onstart = () => { btn.classList.add('active'); status.innerText = "Hört zu..."; };
        
        window.currentRec.onerror = (e) => {
            btn.classList.remove('active');
            status.innerHTML = `Fehler: ${e.error}. Versuche es erneut.`;
            status.style.color = "#ff4444";
        };
        
        window.currentRec.onend = () => { btn.classList.remove('active'); };
        
        window.currentRec.onresult = (e) => {
            const rawTranscript = e.results[0][0].transcript;
            const res = rawTranscript.toLowerCase().trim().replace(/[^a-z0-9äöüß]/g, "");
            const rawAns = qData.a_de || qData.a_en || ""; 
            const ans = rawAns.toLowerCase().trim().replace(/[^a-z0-9äöüß]/g, "");
            
            document.getElementById('mic-box').style.display = 'none';
            
            if (res === ans) {
                let pts = (attempts === 0) ? 20 : 15; totalScore += pts;
                showResult(true, pts === 20 ? "STRIKE! (+20)" : "SPARE! (+15)", qData, lesson);
            } else {
                attempts++;
                let failMsg = attempts === 1 ? `FALSCH! Gehört: "${rawTranscript}"` : `MISS! (0 pts)`;
                showResult(false, failMsg, qData, lesson, attempts === 1);
            }
        };
        window.currentRec.start();
    };
}

function showResult(isCorrect, msg, qData, lesson, canRetry = false) {
    const area = document.getElementById('res-area');
    area.innerHTML = `<h1 style="color:${isCorrect?'#39ff14':'#f44'}; font-size: 40px;">${msg}</h1>`;
    if (isCorrect || !canRetry) {
        const ansText = qData.a_de || qData.a_en || "";
        area.innerHTML += `<p class="quiz-q-text">Q: ${qData.q}</p><p class="quiz-a-text">DE: ${ansText}</p><p style="color:#888; font-size:30px; font-weight: bold;">TR: ${qData.a_tr}</p><button id="btn-nxt" class="action-btn-large">NÄCHSTE FRAGE ⮕</button>`;
        document.getElementById('btn-nxt').onclick = () => { currentQ++; attempts = 0; runQuiz(lesson); };
    } else {
        area.innerHTML += `<button id="btn-retry" class="action-btn-large">NOCHMAL VERSUCHEN</button>`;
        document.getElementById('btn-retry').onclick = () => { 
            area.innerHTML = ""; 
            document.getElementById('mic-box').style.display = 'block'; 
            document.getElementById('btn-speak').classList.remove('active'); 
            document.getElementById('mic-status').innerText = "Tippe auf das Mikrofon zum Sprechen";
            document.getElementById('mic-status').style.color = "#aaa";
        };
    }
}

function finishQuiz() {
    lifetimeScore += totalScore; localStorage.setItem('tragediesScoreDE', lifetimeScore);
    const fn = decodeURIComponent(audio.src.split('/').pop());
    if(!completedLessons.includes(fn)) { 
        completedLessons.push(fn); 
        localStorage.setItem('completedTragediesLessonsDE', JSON.stringify(completedLessons)); 
    }
    renderGrid(); 
    feedbackArea.innerHTML = `<h1 style="color:#ccff00; font-size: 60px;">FERTIG!</h1><h2 style="font-size: 40px;">PUNKTE: ${totalScore}</h2><button id="btn-done" class="action-btn-large">SPEICHERN & ZURÜCK</button>`;
    document.getElementById('btn-done').onclick = () => {
        playerZone.classList.add('hidden');
        grid.classList.remove('hidden');
    };
}
