const { useEffect, useMemo, useState } = React;

const icon = (name, size = 18) => <i data-lucide={name} style={{width:size,height:size}} className="icon"></i>;
const api = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "Something went wrong. Please try again.");
  return data;
};

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("skillsphere-user")); } catch { return null; }
  });
  const [page, setPage] = useState("dashboard");
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState({attempts:0,totalScore:0,totalQuestions:0,averagePercentage:0});
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState("login");

  const refresh = async () => {
    try {
      const [q, board] = await Promise.all([api("/quizzes"), api("/leaderboard")]);
      setQuizzes(q); setLeaderboard(board);
      if (user) {
        const [a, s] = await Promise.all([
          api(`/users/${user.id}/attempts`), api(`/users/${user.id}/stats`)
        ]);
        setAttempts(a); setStats(s);
      }
    } catch (e) { setNotice(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, [user?.id]);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  const login = async (form, mode) => {
    try {
      const endpoint = mode === "register" ? "/auth/register" : "/auth/login";
      const payload = mode === "register"
        ? {name:form.name.value, email:form.email.value, password:form.password.value}
        : {email:form.email.value, password:form.password.value};
      const loggedIn = await api(endpoint, {method:"POST", body:JSON.stringify(payload)});
      localStorage.setItem("skillsphere-user", JSON.stringify(loggedIn));
      setUser(loggedIn); setPage("dashboard"); setNotice(`Welcome ${loggedIn.name.split(" ")[0]}!`);
    } catch (e) { setNotice(e.message); }
  };

  const logout = () => {
    localStorage.removeItem("skillsphere-user");
    setUser(null); setPage("dashboard"); setActiveQuiz(null); setNotice("You have been signed out.");
  };

  const openQuiz = async (id) => {
    try {
      const data = await api(`/quizzes/${id}`);
      setActiveQuiz(data); setAnswers({}); setResult(null); setPage("take-quiz");
    } catch (e) { setNotice(e.message); }
  };

  const submitQuiz = async () => {
    if (!user) return setNotice("Please sign in to save your attempt.");
    try {
      const data = await api("/attempts", {method:"POST", body:JSON.stringify({
        userId:user.id, quizId:activeQuiz.quiz.id, answers
      })});
      setResult(data); setPage("result"); await refresh();
    } catch (e) { setNotice(e.message); }
  };

  const nav = [
    ["dashboard","LayoutDashboard","Overview"],
    ["explore","Compass","Explore quizzes"],
    ["leaderboard","Trophy","Leaderboard"],
    ["profile","UserRound","My profile"],
    ["admin","ShieldCheck","Manage questions"]
  ];

  if (loading) return <div className="boot-screen"><div className="brand-mark">S</div><p>Preparing your learning space...</p></div>;
  if (!user) return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={login} notice={notice} />;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><span>skill<span className="brand-light">sphere</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(([id,ic,label]) => <button key={id} className={`nav-link ${page===id?"active":""}`} onClick={()=>setPage(id)}>{icon(ic)}<span>{label}</span>{id==="explore" && <span className="nav-count">{quizzes.length}</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="upgrade-card"><div className="sparkle">{icon("sparkles",17)}</div><strong>Keep your streak alive!</strong><p>A little practice every day makes a big difference.</p><button onClick={()=>setPage("explore")}>Explore challenges <span>→</span></button></div>
        <button className="nav-link signout" onClick={logout}>{icon("log-out")}<span>Sign out</span></button>
        <div className="sidebar-user"><div className="avatar">{user.name.charAt(0).toUpperCase()}</div><div><strong>{user.name}</strong><small>Student account</small></div><span className="online-dot"></span></div>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb">Workspace <span>/</span> <strong>{nav.find(n=>n[0]===page)?.[2] || (page==="take-quiz"?"Quiz session":page==="result"?"Quiz result":"My learning")}</strong></div>
        <div className="top-actions"><div className="date-chip">{icon("calendar-days",15)} <span>{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span></div><div className="top-avatar">{user.name.charAt(0).toUpperCase()}</div></div>
      </header>
      {notice && <div className="toast">{icon("info",17)} {notice}<button onClick={()=>setNotice("")}>×</button></div>}
      {page==="dashboard" && <Dashboard user={user} quizzes={quizzes} stats={stats} attempts={attempts} openQuiz={openQuiz} setPage={setPage} />}
      {page==="explore" && <Explore quizzes={quizzes} openQuiz={openQuiz} />}
      {page==="leaderboard" && <Leaderboard data={leaderboard} user={user} />}
      {page==="profile" && <Profile user={user} stats={stats} attempts={attempts} />}
      {page==="admin" && <AdminQuestionPanel quizzes={quizzes} onChanged={refresh} setNotice={setNotice} />}
      {page==="take-quiz" && activeQuiz && <QuizPage data={activeQuiz} answers={answers} setAnswers={setAnswers} onSubmit={submitQuiz} onBack={()=>setPage("explore")} />}
      {page==="result" && result && <Result result={result} onExplore={()=>setPage("explore")} onDashboard={()=>setPage("dashboard")} />}
      <footer className="footer">© 2026 SkillSphere <span>Built to make learning feel like progress.</span></footer>
    </main>
  </div>;
}


function AdminQuestionPanel({quizzes,onChanged,setNotice}) {
  const [adminKey,setAdminKey]=useState(()=>localStorage.getItem("skillsphere-admin-key")||"");
  const [selectedQuiz,setSelectedQuiz]=useState(quizzes[0]?.id?String(quizzes[0].id):"");
  const [items,setItems]=useState([]);
  const [editing,setEditing]=useState(null);
  const [busy,setBusy]=useState(false);
  const blank={questionText:"",optionA:"",optionB:"",optionC:"",optionD:"",correctOption:"A",explanation:"",displayOrder:""};
  const [form,setForm]=useState(blank);
  useEffect(()=>{if(!selectedQuiz&&quizzes.length)setSelectedQuiz(String(quizzes[0].id));},[quizzes]);
  const adminApi=async(path,options={})=>api(path,{...options,headers:{...(options.headers||{}),"X-Admin-Key":adminKey}});
  const loadQuestions=async()=>{
    if(!adminKey||!selectedQuiz){setItems([]);return;}
    setBusy(true);
    try {const data=await adminApi(`/admin/quizzes/${selectedQuiz}/questions`);setItems(data);localStorage.setItem("skillsphere-admin-key",adminKey);}
    catch(e){setItems([]);setNotice(e.message);}
    finally{setBusy(false);}
  };
  useEffect(()=>{loadQuestions();},[selectedQuiz]);
  const startEdit=q=>{setEditing(q.id);setForm({questionText:q.questionText,optionA:q.optionA,optionB:q.optionB,optionC:q.optionC,optionD:q.optionD,correctOption:q.correctOption,explanation:q.explanation||"",displayOrder:String(q.displayOrder)});window.scrollTo({top:0,behavior:"smooth"});};
  const reset=()=>{setEditing(null);setForm({...blank,displayOrder:String(items.length)});};
  const save=async e=>{
    e.preventDefault();
    try{
      const payload={...form,quizId:Number(selectedQuiz),displayOrder:form.displayOrder===""?items.length:Number(form.displayOrder)};
      await adminApi(editing?`/admin/questions/${editing}`:"/admin/questions",{method:editing?"PUT":"POST",body:JSON.stringify(payload)});
      setNotice(editing?"Question updated successfully.":"Question added successfully.");reset();await loadQuestions();await onChanged();
    }catch(err){setNotice(err.message);}
  };
  const remove=async id=>{
    if(!window.confirm("Delete this question permanently?"))return;
    try{await adminApi(`/admin/questions/${id}`,{method:"DELETE"});setNotice("Question deleted.");await loadQuestions();await onChanged();}
    catch(err){setNotice(err.message);}
  };
  const update=(key,value)=>setForm(old=>({...old,[key]:value}));
  return <div className="page-content admin-page">
    <PageHeading eyebrow="ADMIN WORKSPACE" title="Question management" subtitle="Create, edit, organise and remove quiz questions."/>
    <section className="panel admin-access"><div><strong>{icon("shield-check",18)} Admin access</strong><p>Enter the admin key configured by the project owner.</p></div><div className="admin-key-row"><input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)} placeholder="Enter admin key"/><button className="primary-btn" onClick={loadQuestions}>Connect</button></div></section>
    <div className="admin-layout">
      <section className="panel admin-form-panel"><div className="panel-heading"><div><h2>{editing?"Edit question":"Add a question"}</h2><p>Choose a quiz and complete the question details.</p></div>{icon(editing?"pencil":"plus-circle",20)}</div>
        <form className="admin-form" onSubmit={save}>
          <label>Quiz<select value={selectedQuiz} onChange={e=>{setSelectedQuiz(e.target.value);reset();}} required><option value="">Select a quiz</option>{quizzes.map(q=><option key={q.id} value={q.id}>{q.title}</option>)}</select></label>
          <label>Question text<textarea value={form.questionText} onChange={e=>update("questionText",e.target.value)} required rows="3" placeholder="Type your question..."/></label>
          <div className="admin-options-grid">{["A","B","C","D"].map(letter=><label key={letter}>Option {letter}<input value={form[`option${letter}`]} onChange={e=>update(`option${letter}`,e.target.value)} required placeholder={`Enter option ${letter}`}/></label>)}</div>
          <div className="admin-form-two"><label>Correct answer<select value={form.correctOption} onChange={e=>update("correctOption",e.target.value)}><option>A</option><option>B</option><option>C</option><option>D</option></select></label><label>Display order<input type="number" min="0" value={form.displayOrder} onChange={e=>update("displayOrder",e.target.value)} placeholder="0"/></label></div>
          <label>Explanation (optional)<textarea rows="2" value={form.explanation} onChange={e=>update("explanation",e.target.value)} placeholder="Explain why this answer is correct..."/></label>
          <div className="admin-form-actions"><button className="primary-btn" type="submit" disabled={!adminKey||!selectedQuiz}>{editing?"Save changes":"Add question"} →</button>{editing&&<button className="secondary-btn" type="button" onClick={reset}>Cancel</button>}</div>
        </form>
      </section>
      <section className="panel admin-list-panel"><div className="panel-heading"><div><h2>Quiz questions</h2><p>{items.length} questions · ordered by display order</p></div>{icon("list-ordered",20)}</div>
        {!adminKey?<div className="empty-state"><strong>Admin key required</strong><p>Enter your admin key above to load questions.</p></div>:busy?<div className="empty-state">Loading questions...</div>:items.length===0?<div className="empty-state"><strong>No questions found</strong><p>Select a quiz or add the first question.</p></div>:<div className="admin-question-list">{items.map((q,i)=><article className="admin-question" key={q.id}><div className="admin-question-top"><span className="admin-order">{String(q.displayOrder).padStart(2,"0")}</span><span className="admin-answer">Answer: {q.correctOption}</span><div className="admin-question-actions"><button title="Edit question" onClick={()=>startEdit(q)}>{icon("pencil",15)}</button><button title="Delete question" onClick={()=>remove(q.id)}>{icon("trash-2",15)}</button></div></div><strong>{q.questionText}</strong><div className="admin-question-options"><span>A. {q.optionA}</span><span>B. {q.optionB}</span><span>C. {q.optionC}</span><span>D. {q.optionD}</span></div>{q.explanation&&<small>{q.explanation}</small>}</article>)}</div>}
      </section>
    </div>
    <p className="admin-warning">Academic demo: this panel uses a shared admin key. Do not use this simple key-based access control for a public production system; implement Spring Security roles before deployment.</p>
  </div>;
}

function AuthScreen({mode,setMode,onSubmit,notice}) {
  return <div className="auth-layout">
    <section className="auth-art">
      <div className="brand auth-brand"><div className="brand-mark">S</div><span>skill<span className="brand-light">sphere</span></span></div>
      <div className="art-content"><div className="eyebrow"><span className="eyebrow-dot"></span> YOUR NEXT CHAPTER STARTS HERE</div><h1>Make learning<br/>your <span>superpower.</span></h1><p>Build skills, take on challenges, and see how far you can go. Your growth journey starts with one step.</p>
        <div className="art-stats"><div><strong>01</strong><small>Learn something new</small></div><div><strong>02</strong><small>Put it into practice</small></div><div><strong>03</strong><small>Celebrate progress</small></div></div>
      </div>
      <div className="art-orbit orbit-one"></div><div className="art-orbit orbit-two"></div><div className="art-glow"></div>
      <div className="art-footer">LEARN. PRACTICE. GROW.</div>
    </section>
    <section className="auth-panel">
      <div className="auth-form-wrap">
        <div className="mobile-brand brand"><div className="brand-mark">S</div><span>skill<span className="brand-light">sphere</span></span></div>
        <div className="form-kicker">{mode==="login"?"WELCOME BACK":"GET STARTED"}</div>
        <h2>{mode==="login"?"Sign in to your space":"Create your account"}</h2>
        <p className="form-sub">{mode==="login"?"Pick up where you left off. Your next achievement is waiting.":"Join the community and start building your skills today."}</p>
        {notice && <div className="form-error">{notice}</div>}
        <form onSubmit={e=>{e.preventDefault();onSubmit(e.currentTarget,mode);}}>
          {mode==="register" && <label>Full name<input name="name" placeholder="e.g. Alex Morgan" required minLength="2"/></label>}
          <label>Email address<input name="email" type="email" placeholder="you@example.com" required/></label>
          <label>Password<input name="password" type="password" placeholder="At least 6 characters" required minLength="6"/></label>
          <button className="primary-btn full-btn" type="submit">{mode==="login"?"Sign in":"Create account"} <span>→</span></button>
        </form>
        <div className="auth-switch">{mode==="login"?"New to SkillSphere?":"Already have an account?"} <button onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Create an account":"Sign in"}</button></div>
        <div className="secure-note">{icon("shield-check",15)} Your learning journey is yours. Your password is securely hashed.</div>
      </div>
    </section>
  </div>;
}

function PageHeading({eyebrow,title,subtitle,action}) {
  return <div className="page-heading"><div><div className="eyebrow muted">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action}</div>;
}
function StatCard({label,value,sub,iconName,tone}) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}>{icon(iconName,20)}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-sub">{sub}</div></div>;
}
function Dashboard({user,quizzes,stats,attempts,openQuiz,setPage}) {
  const firstName=user.name.split(" ")[0];
  return <div className="page-content">
    <div className="welcome-banner"><div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> YOUR LEARNING SPACE</div><h1>Good to see you, {firstName}<span className="wave">✦</span></h1><p>Small steps every day lead to big achievements. Ready to learn something new?</p><button className="banner-btn" onClick={()=>setPage("explore")}>Find your next challenge {icon("arrow-up-right",16)}</button></div><div className="banner-art"><div className="floating-card card-one"><span>✦</span><b>Keep growing</b><small>One quiz at a time</small></div><div className="planet"><div className="planet-core">S</div><div className="planet-ring"></div></div><div className="floating-card card-two"><span className="mini-check">✓</span><b>Progress unlocked</b><small>You’re doing great!</small></div></div></div>
    <div className="section-title-row"><div><h2>Your progress</h2><p>A snapshot of your learning activity</p></div><button className="text-btn" onClick={()=>setPage("profile")}>View details →</button></div>
    <div className="stats-grid">
      <StatCard label="Quizzes completed" value={stats.attempts} sub="Total attempts" iconName="clipboard-check" tone="violet"/>
      <StatCard label="Average score" value={`${Math.round(stats.averagePercentage||0)}%`} sub="Across all attempts" iconName="target" tone="blue"/>
      <StatCard label="Points earned" value={stats.totalScore} sub="Correct answers" iconName="zap" tone="amber"/>
      <StatCard label="Available quizzes" value={quizzes.length} sub="Ready when you are" iconName="book-open" tone="green"/>
    </div>
    <div className="content-grid">
      <section className="panel featured-panel"><div className="panel-heading"><div><h2>Pick up a new skill</h2><p>Curated challenges to keep you moving</p></div><button className="icon-btn" onClick={()=>setPage("explore")}>{icon("arrow-up-right")}</button></div>
        <div className="mini-quiz-list">{quizzes.slice(0,3).map((q,i)=><QuizRow key={q.id} quiz={q} index={i} onClick={()=>openQuiz(q.id)}/>)}</div>
      </section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest quiz attempts</p></div>{icon("activity",19)}</div>
        {attempts.length===0?<div className="empty-state"><div className="empty-icon">{icon("notebook-pen",24)}</div><strong>Your story starts here</strong><p>Complete your first quiz and your activity will show up here.</p><button className="text-btn" onClick={()=>setPage("explore")}>Explore quizzes →</button></div>:<div className="activity-list">{attempts.slice(0,4).map(a=><div className="activity-item" key={a.id}><div className="activity-check">{icon("check",16)}</div><div className="activity-info"><strong>{a.quizTitle}</strong><small>{new Date(a.completedAt).toLocaleDateString()}</small></div><b>{Math.round(a.percentage)}%</b></div>)}</div>}
      </section>
    </div>
  </div>;
}
function QuizRow({quiz,index,onClick}) {
  const colors=["violet","blue","amber"];
  return <button className="quiz-row" onClick={onClick}><div className={`quiz-symbol ${colors[index%3]}`}>{icon(index===0?"code-2":index===1?"braces":"coffee",21)}</div><div className="quiz-row-info"><strong>{quiz.title}</strong><small>{quiz.category} <span>·</span> {quiz.questionCount} questions</small></div><span className="difficulty">{quiz.difficulty}</span><span className="row-arrow">↗</span></button>;
}
function Explore({quizzes,openQuiz}) {
  const [filter,setFilter]=useState("All");
  const categories=["All",...new Set(quizzes.map(q=>q.category))];
  const shown=filter==="All"?quizzes:quizzes.filter(q=>q.category===filter);
  return <div className="page-content"><PageHeading eyebrow="DISCOVER & PRACTICE" title="Explore quizzes" subtitle="Choose a challenge, test your knowledge, and level up your skills."/>
    <div className="filter-row">{categories.map(c=><button key={c} className={`filter-chip ${filter===c?"selected":""}`} onClick={()=>setFilter(c)}>{c}</button>)}</div>
    <div className="quiz-grid">{shown.map((q,i)=><article className="quiz-card" key={q.id}><div className={`quiz-card-top tone-${i%3}`}><div className="quiz-card-icon">{icon(i%3===0?"code-2":i%3===1?"braces":"coffee",25)}</div><span className="difficulty">{q.difficulty}</span><div className="card-decoration">✳</div></div><div className="quiz-card-body"><div className="category-label">{q.category}</div><h3>{q.title}</h3><p>{q.description}</p><div className="quiz-meta"><span>{icon("list-checks",15)} {q.questionCount} questions</span><span>{icon("clock-3",15)} {q.durationMinutes} min</span></div><button className="primary-btn card-btn" onClick={()=>openQuiz(q.id)}>Start quiz <span>→</span></button></div></article>)}</div>
    {shown.length===0&&<div className="empty-state"><strong>No quizzes in this category yet.</strong></div>}
  </div>;
}
function Leaderboard({data,user}) {
  return <div className="page-content"><PageHeading eyebrow="COMMUNITY" title="Leaderboard" subtitle="A little friendly competition makes learning more fun."/>
    <div className="leaderboard-layout"><div className="panel leaderboard-panel"><div className="panel-heading"><div><h2>Top learners</h2><p>Ranked by total correct answers</p></div>{icon("trophy",20)}</div>
      {data.length===0?<div className="empty-state"><div className="empty-icon">{icon("trophy",24)}</div><strong>The leaderboard is waiting</strong><p>Be the first to complete a quiz and claim the top spot.</p></div>:<div className="leader-table"><div className="leader-head"><span>RANK / LEARNER</span><span>QUIZZES</span><span>POINTS</span></div>{data.map((r,i)=><div className={`leader-row ${r.userId===user.id?"current-user":""}`} key={r.userId}><div className="leader-person"><span className={`rank rank-${i+1}`}>{i===0?"♛":i+1}</span><div className="avatar small-avatar">{r.name.charAt(0).toUpperCase()}</div><div><strong>{r.name}{r.userId===user.id&&<em>YOU</em>}</strong><small>{r.questionsAnswered} questions answered</small></div></div><span>{r.attempts}</span><strong className="points">{r.points} pts</strong></div>)}</div>}
    </div><aside className="panel leaderboard-tip"><div className="tip-icon">{icon("medal",23)}</div><h3>Every expert was once a beginner.</h3><p>Keep showing up, keep practicing, and your name could be at the top next time.</p><div className="tip-line"></div><strong>Today's reminder</strong><small>Progress over perfection.</small></aside></div>
  </div>;
}
function Profile({user,stats,attempts}) {
  return <div className="page-content"><PageHeading eyebrow="YOUR ACCOUNT" title="My profile" subtitle="Your learning journey, all in one place."/>
    <div className="profile-card panel"><div className="profile-cover"></div><div className="profile-details"><div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div><div className="profile-name"><h2>{user.name}</h2><p>{user.email}</p><span className="member-pill">{icon("graduation-cap",14)} SkillSphere learner</span></div></div></div>
    <div className="stats-grid profile-stats"><StatCard label="Quizzes completed" value={stats.attempts} sub="Total attempts" iconName="clipboard-check" tone="violet"/><StatCard label="Average score" value={`${Math.round(stats.averagePercentage||0)}%`} sub="Across all attempts" iconName="target" tone="blue"/><StatCard label="Correct answers" value={stats.totalScore} sub={`Out of ${stats.totalQuestions}`} iconName="check-circle" tone="green"/></div>
    <section className="panel history-panel"><div className="panel-heading"><div><h2>Attempt history</h2><p>Your most recent quiz results</p></div>{icon("history",19)}</div>{attempts.length===0?<div className="empty-state"><p>You haven't completed a quiz yet.</p></div>:attempts.map(a=><div className="history-row" key={a.id}><div className="history-icon">{icon("file-check",18)}</div><div className="history-info"><strong>{a.quizTitle}</strong><small>{new Date(a.completedAt).toLocaleString()}</small></div><div className="history-score"><strong>{a.score}/{a.totalQuestions}</strong><small>{Math.round(a.percentage)}%</small></div></div>)}</section>
  </div>;
}
function QuizPage({data,answers,setAnswers,onSubmit,onBack}) {
  const {quiz,questions}=data;
  const [index,setIndex]=useState(0);
  const [seconds,setSeconds]=useState(quiz.durationMinutes*60);
  const [confirm,setConfirm]=useState(false);
  useEffect(()=>{const t=setInterval(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{if(seconds===0)onSubmit();},[seconds]);
  const q=questions[index], selected=answers[q.id];
  const opts=[["A",q.optionA],["B",q.optionB],["C",q.optionC],["D",q.optionD]];
  const mm=String(Math.floor(seconds/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");
  return <div className="page-content quiz-session"><button className="back-btn" onClick={onBack}>← Back to quizzes</button><div className="quiz-session-head"><div><div className="eyebrow muted">{quiz.category.toUpperCase()} · {quiz.difficulty.toUpperCase()}</div><h1>{quiz.title}</h1><p>Take your time and choose the best answer.</p></div><div className={`timer ${seconds<60?"timer-low":""}`}>{icon("clock-3",17)} {mm}:{ss}</div></div>
    <div className="quiz-progress"><div><span>QUESTION {index+1} OF {questions.length}</span><strong>{Math.round(((index+1)/questions.length)*100)}%</strong></div><div className="progress-track"><span style={{width:`${((index+1)/questions.length)*100}%`}}></span></div></div>
    <div className="question-card panel"><div className="question-number">QUESTION {String(index+1).padStart(2,"0")}</div><h2>{q.questionText}</h2><div className="answer-options">{opts.map(([key,value])=><button key={key} className={`answer-option ${selected===key?"chosen":""}`} onClick={()=>setAnswers({...answers,[q.id]:key})}><span className="option-key">{key}</span><span>{value}</span>{selected===key&&<span className="option-check">✓</span>}</button>)}</div><div className="question-footer"><span>{Object.keys(answers).length} of {questions.length} answered</span><div>{index>0&&<button className="secondary-btn" onClick={()=>setIndex(index-1)}>Previous</button>}{index<questions.length-1?<button className="primary-btn" onClick={()=>setIndex(index+1)}>Next question →</button>:<button className="primary-btn" onClick={()=>setConfirm(true)}>Finish quiz →</button>}</div></div></div>
    {confirm&&<div className="modal-backdrop"><div className="confirm-modal"><div className="modal-icon">{icon("flag",23)}</div><h2>Ready to submit?</h2><p>You answered {Object.keys(answers).length} out of {questions.length} questions. You can submit now and see your result.</p><div className="modal-actions"><button className="secondary-btn" onClick={()=>setConfirm(false)}>Keep reviewing</button><button className="primary-btn" onClick={onSubmit}>Submit answers</button></div></div></div>}
  </div>;
}
function Result({result,onExplore,onDashboard}) {
  const good=result.percentage>=70;
  return <div className="page-content result-page"><div className="result-card panel"><div className="result-confetti">{good?"✦":"✧"}</div><div className="eyebrow muted">QUIZ COMPLETED</div><h1>{good?"Look at you go!":"Every attempt is progress."}</h1><p className="result-sub">You completed <strong>{result.quizTitle}</strong>. Here's how you did.</p><div className="score-circle" style={{"--score":`${result.percentage}%`}}><div><strong>{Math.round(result.percentage)}%</strong><small>YOUR SCORE</small></div></div><div className="result-breakdown"><div><strong>{result.score}</strong><small>Correct answers</small></div><div><strong>{result.totalQuestions-result.score}</strong><small>Incorrect answers</small></div><div><strong>{result.totalQuestions}</strong><small>Total questions</small></div></div><div className="result-message">{good?"Great work! Keep the momentum going.":"Keep practicing. You'll get stronger with every attempt."}</div><div className="result-actions"><button className="secondary-btn" onClick={onDashboard}>Back to dashboard</button><button className="primary-btn" onClick={onExplore}>Try another quiz →</button></div></div></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
