const { createClient } = supabase;
const db = createClient(window.SUPABASE_URL, window.SUPABASE_KEY);

const CATEGORIES=["School/LGU & Local Culture","Places & Landmarks","Animals & Nature","General Knowledge"];
let questions=[], settings={seconds:20,lives:3}, sessionUser=null, game=null, timerId=null;

const $=id=>document.getElementById(id);
const show=id=>{document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");scrollTo(0,0)};
const toast=msg=>{const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),2200)};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const norm=s=>String(s||"").toLowerCase().trim().replace(/[.,!?'"’“”()\-_/]/g," ").replace(/\s+/g," ");
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

function populateCategories(){
  ["category","qCategory"].forEach(id=>{CATEGORIES.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;$(id).appendChild(o)})});
}
async function loadData(){
  const q=await db.from("picture_questions").select("*").eq("is_active",true).order("created_at",{ascending:false});
  if(q.error){console.error(q.error);$("availability").textContent="Supabase error: "+q.error.message;return}
  questions=q.data||[];
  const s=await db.from("game_settings").select("*").limit(1).maybeSingle();
  if(s.data)settings={seconds:s.data.seconds_per_question,lives:s.data.starting_lives};
  updateAvailability();
}
function updateAvailability(){
  const c=$("category").value,d=$("difficulty").value;
  const n=questions.filter(q=>(c==="all"||q.category===c)&&(d==="all"||q.difficulty===d)).length;
  $("availability").textContent=`${n} picture question${n===1?"":"s"} available`;
}
["category","difficulty"].forEach(id=>$(id).addEventListener("change",updateAvailability));

$("startBtn").onclick=()=>{
  const c=$("category").value,d=$("difficulty").value,n=Number($("questionCount").value);
  const pool=shuffle(questions.filter(q=>(c==="all"||q.category===c)&&(d==="all"||q.difficulty===d))).slice(0,n);
  if(!pool.length){toast("No questions match this selection.");return}
  game={player:$("playerName").value.trim()||"Player",pool,index:0,score:0,lives:settings.lives,correct:0,wrong:0,results:[],hint:false,locked:false};
  show("gameScreen");loadQuestion();
};
function loadQuestion(){
  clearInterval(timerId);game.locked=false;game.hint=false;
  const q=game.pool[game.index];
  $("playerLabel").textContent=game.player;$("progressLabel").textContent=`Question ${game.index+1} / ${game.pool.length}`;
  $("score").textContent=game.score;$("lives").innerHTML="❤️ ".repeat(Math.max(game.lives,0))||"💔";
  $("progressBar").style.width=`${game.index/game.pool.length*100}%`;
  $("categoryBadge").textContent=q.category;$("difficultyBadge").textContent=q.difficulty;
  $("questionImage").src=q.image_url;$("answer").value="";$("hint").textContent="";$("feedback").textContent="";
  let t=settings.seconds;$("timer").textContent=t;
  timerId=setInterval(()=>{t--;$("timer").textContent=t;if(t<=0){clearInterval(timerId);finish("timeout")}},1000);
  $("answer").focus();
}
function submit(){if(game.locked)return;const val=$("answer").value.trim();if(!val)return;
  const q=game.pool[game.index], accepted=[q.answer,...(q.aliases||[])].map(norm);
  finish(accepted.includes(norm(val))?"correct":"wrong",val);
}
function finish(reason,given=""){
  if(game.locked)return;game.locked=true;clearInterval(timerId);
  const q=game.pool[game.index],correct=reason==="correct",points=correct?(game.hint?50:100):0;
  game.score+=points;if(correct)game.correct++;else{game.wrong++;game.lives=Math.max(0,game.lives-1)}
  game.results.push({answer:q.answer,given:given||reason,correct});
  $("score").textContent=game.score;$("lives").innerHTML="❤️ ".repeat(game.lives)||"💔";
  $("feedback").textContent=correct?`✅ Correct! +${points}`:`${reason==="timeout"?"⏰ Time's up!":reason==="skipped"?"⏭ Skipped!":"❌ Incorrect!"} Answer: ${q.answer}`;
  setTimeout(()=>{if(game.lives<=0||game.index>=game.pool.length-1)showResults();else{game.index++;loadQuestion()}},850);
}
function showResults(){
  $("finalScore").textContent=game.score;$("resultPlayer").textContent=`Great job, ${game.player}!`;
  $("correctCount").textContent=game.correct;$("wrongCount").textContent=game.wrong;
  $("accuracy").textContent=(game.results.length?Math.round(game.correct/game.results.length*100):0)+"%";
  $("resultTitle").textContent=game.score>=800?"Outstanding!":game.score>=500?"Great Job!":"Nice Try!";
  $("resultIcon").textContent=game.score>=800?"🏆":game.score>=500?"🎉":"💪";
  $("review").innerHTML=game.results.map((r,i)=>`<div class="review-item ${r.correct?"correct":"wrong"}"><b>${i+1}. ${esc(r.answer)}</b><span>${r.correct?"Correct":"Your answer: "+esc(r.given)}</span></div>`).join("");
  show("resultScreen");
}
$("submitBtn").onclick=submit;$("answer").onkeydown=e=>e.key==="Enter"&&submit();
$("hintBtn").onclick=()=>{if(!game.locked){game.hint=true;$("hint").textContent="💡 "+(game.pool[game.index].hint||"No hint available.");toast("Hint used: maximum points reduced.")}};
$("skipBtn").onclick=()=>finish("skipped");
$("againBtn").onclick=()=>show("homeScreen");$("homeBtn").onclick=()=>show("homeScreen");

$("adminBtn").onclick=async()=>{
  const {data}=await db.auth.getSession();sessionUser=data.session?.user||null;
  show(sessionUser?"adminScreen":"loginScreen");
};
$("loginForm").onsubmit=async e=>{
  e.preventDefault();$("loginError").textContent="";
  const {data,error}=await db.auth.signInWithPassword({email:$("adminEmail").value,password:$("adminPassword").value});
  if(error){$("loginError").textContent=error.message;return}sessionUser=data.user;show("adminScreen");loadAdmin();
};
$("loginBack").onclick=()=>show("homeScreen");
$("logoutBtn").onclick=async()=>{await db.auth.signOut();sessionUser=null;show("homeScreen")};
$("adminGameBtn").onclick=()=>show("homeScreen");

document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-content").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active");if(b.dataset.tab==="manageTab")renderQuestions();if(b.dataset.tab==="settingsTab")fillSettings()});
$("refreshBtn").onclick=loadAdmin;$("search").oninput=renderQuestions;

let selectedFile=null;
$("qImage").onchange=e=>{selectedFile=e.target.files[0];if(!selectedFile)return;if(selectedFile.size>6*1024*1024){$("formError").textContent="Maximum image size is 6 MB.";return} $("preview").classList.remove("hidden");$("preview").innerHTML=`<img src="${URL.createObjectURL(selectedFile)}">`};
$("questionForm").onsubmit=async e=>{
  e.preventDefault();$("formError").textContent="";$("saveQuestionBtn").disabled=true;
  try{
    const edit=$("editId").value;let image_url="",image_path="";
    if(edit){const old=questions.find(q=>q.id===edit);image_url=old.image_url;image_path=old.image_path}
    if(selectedFile){
      const ext=selectedFile.name.split(".").pop().toLowerCase(),path=`questions/${crypto.randomUUID()}.${ext}`;
      const up=await db.storage.from("game-images").upload(path,selectedFile,{contentType:selectedFile.type,cacheControl:"3600"});
      if(up.error)throw up.error;
      image_path=path;image_url=db.storage.from("game-images").getPublicUrl(path).data.publicUrl;
    }
    if(!image_url)throw new Error("Please upload a picture.");
    const payload={answer:$("qAnswer").value.trim(),category:$("qCategory").value,difficulty:$("qDifficulty").value,hint:$("qHint").value.trim(),aliases:$("qAliases").value.split(",").map(x=>x.trim()).filter(Boolean),image_url,image_path,is_active:true};
    const r=edit?await db.from("picture_questions").update(payload).eq("id",edit):await db.from("picture_questions").insert(payload);
    if(r.error)throw r.error;
    toast(edit?"Question updated":"Question added");resetQuestionForm();await loadAdmin();activateTab("manageTab");
  }catch(err){$("formError").textContent=err.message}
  finally{$("saveQuestionBtn").disabled=false}
};
$("cancelEditBtn").onclick=resetQuestionForm;
function resetQuestionForm(){ $("questionForm").reset();$("editId").value="";selectedFile=null;$("preview").classList.add("hidden");$("cancelEditBtn").classList.add("hidden");$("saveQuestionBtn").textContent="Upload & Add Question";$("formError").textContent="" }
function activateTab(id){document.querySelector(`[data-tab="${id}"]`).click()}
function loadAdmin(){loadData();renderQuestions();fillSettings()}
function renderQuestions(){
  const term=($("search").value||"").toLowerCase();
  const list=questions.filter(q=>q.answer.toLowerCase().includes(term)||q.category.toLowerCase().includes(term));
  $("questionList").innerHTML=list.length?list.map(q=>`<div class="question-row"><img src="${q.image_url}"><div><h4>${esc(q.answer)}</h4><p>${esc(q.category)} • ${q.difficulty}</p></div><div class="row-actions"><button class="secondary icon" onclick="editQuestion('${q.id}')">✏️</button><button class="danger icon" onclick="deleteQuestion('${q.id}')">🗑️</button></div></div>`).join(""):`<div class="empty">No questions found.</div>`;
}
window.editQuestion=id=>{const q=questions.find(x=>x.id===id);if(!q)return;$("editId").value=q.id;$("qAnswer").value=q.answer;$("qCategory").value=q.category;$("qDifficulty").value=q.difficulty;$("qHint").value=q.hint||"";$("qAliases").value=(q.aliases||[]).join(", ");$("preview").classList.remove("hidden");$("preview").innerHTML=`<img src="${q.image_url}">`;$("cancelEditBtn").classList.remove("hidden");$("saveQuestionBtn").textContent="Save Changes";activateTab("addTab")};
window.deleteQuestion=async id=>{const q=questions.find(x=>x.id===id);if(!confirm(`Delete "${q.answer}"?`))return;if(q.image_path)await db.storage.from("game-images").remove([q.image_path]);const r=await db.from("picture_questions").delete().eq("id",id);if(r.error)toast(r.error.message);else{toast("Question deleted");await loadAdmin();renderQuestions()}};

function fillSettings(){const s=JSON.parse(localStorage.getItem("fallbackSettings")||"null")||settings;$("settingTime").value=s.seconds;$("settingLives").value=s.lives}
$("saveSettings").onclick=async()=>{
  const payload={seconds_per_question:Math.max(5,Math.min(120,Number($("settingTime").value)||20)),starting_lives:Math.max(1,Math.min(10,Number($("settingLives").value)||3))};
  const existing=await db.from("game_settings").select("id").limit(1).maybeSingle();
  const r=existing.data?await db.from("game_settings").update(payload).eq("id",existing.data.id):await db.from("game_settings").insert(payload);
  if(r.error)toast(r.error.message);else{settings={seconds:payload.seconds_per_question,lives:payload.starting_lives};toast("Settings saved")}
};

populateCategories();
loadData();
