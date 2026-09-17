import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHL7hR8KPXLShxkny53e3Ad3PvQ8AWG2k",
  authDomain: "exam-paper-vault-v2.firebaseapp.com",
  projectId: "exam-paper-vault-v2",
  storageBucket: "exam-paper-vault-v2.firebasestorage.app",
  messagingSenderId: "351099467631",
  appId: "1:351099467631:web:9d06028de393e2737c1a9a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const $ = id => document.getElementById(id);
let currentUser = null, currentRole = null, papers = [];

function show(msg){const x=$("message");x.textContent=msg;x.style.display="block";setTimeout(()=>x.style.display="none",3500)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmt(v){if(!v)return"-";const d=v.toDate?v.toDate():new Date(v);return d.toLocaleString()}
async function sha256(file){const b=await file.arrayBuffer();const h=await crypto.subtle.digest("SHA-256",b);return[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function logAction(action,details){if(!currentUser)return;await addDoc(collection(db,"auditLogs"),{action,details,userId:currentUser.uid,email:currentUser.email,role:currentRole,createdAt:serverTimestamp()})}

$("loginBtn").onclick=async()=>{try{await signInWithEmailAndPassword(auth,$("loginEmail").value,$("loginPassword").value);show("Login successful")}catch(e){show(e.message)}};
$("registerBtn").onclick=async()=>{try{
  const email=$("regEmail").value,password=$("regPassword").value,role=$("regRole").value;
  const cred=await createUserWithEmailAndPassword(auth,email,password);
  await setDoc(doc(db,"users",cred.user.uid),{email,role,createdAt:serverTimestamp()});
  show("Account created");
}catch(e){show(e.message)}};
$("logoutBtn").onclick=()=>signOut(auth);

$("uploadBtn").onclick=async()=>{try{
  if(!["setter","admin"].includes(currentRole))return show("Only a Question Setter/Admin can upload.");
  const title=$("paperTitle").value.trim(),time=$("examTime").value,file=$("paperFile").files[0];
  if(!title||!time||!file)return show("Enter title, exam time and choose a file.");
  if(!/\.(pdf|txt)$/i.test(file.name))return show("Only PDF or TXT files are allowed.");
  const hash=await sha256(file),paperId=crypto.randomUUID();
  const path=`question-papers/${currentUser.uid}/${paperId}/${file.name}`;
  await uploadBytes(ref(storage,path),file,{contentType:file.type||"application/octet-stream"});
  await addDoc(collection(db,"papers"),{paperId,title,originalName:file.name,storagePath:path,creatorId:currentUser.uid,creatorEmail:currentUser.email,examTime:new Date(time).toISOString(),sha256:hash,status:"PENDING_APPROVAL",createdAt:serverTimestamp()});
  await logAction("PAPER_UPLOADED",`${title} uploaded to cloud storage`);
  $("paperTitle").value="";$("paperFile").value="";show("Question paper uploaded and sent for approval.");
}catch(e){show(e.message)}};

$("releaseCheckBtn").onclick=async()=>{try{
  const now=new Date(),due=papers.filter(p=>p.status==="SCHEDULED"&&new Date(p.examTime)<=now);
  if(!due.length)return show("No scheduled paper is due for release.");
  for(const p of due){await updateDoc(doc(db,"papers",p.id),{status:"RELEASED",releasedAt:serverTimestamp()});await logAction("PAPER_RELEASED",`${p.title} released at scheduled time`)}
  show(`${due.length} paper(s) released.`);
}catch(e){show(e.message)}};

async function approve(id,title){if(currentRole!=="admin")return show("Admin access required.");await updateDoc(doc(db,"papers",id),{status:"SCHEDULED",approvedAt:serverTimestamp(),approvedBy:currentUser.uid});await logAction("PAPER_APPROVED",`${title} approved by admin`);show("Paper approved and scheduled.")}
async function openPaper(p){if(p.status!=="RELEASED")return show("🔒 Paper is locked until the scheduled release time.");if(!["examiner","admin"].includes(currentRole))return show("Access denied.");const url=await getDownloadURL(ref(storage,p.storagePath));window.open(url,"_blank");await logAction("PAPER_ACCESSED",`${p.title} opened by authorized user`)}
async function verifyPaper(p){if(p.status!=="RELEASED")return show("Verification is available after release.");if(!["examiner","admin"].includes(currentRole))return show("Access denied.");const url=await getDownloadURL(ref(storage,p.storagePath));const r=await fetch(url);const blob=await r.blob();const f=new File([blob],p.originalName,{type:blob.type});const hash=await sha256(f);show(hash===p.sha256?"✅ SHA-256 verified: file matches.":"❌ SHA-256 mismatch: possible modification.")}

function renderPapers(){
  $("totalCount").textContent=papers.length;
  $("lockedCount").textContent=papers.filter(p=>p.status!=="RELEASED").length;
  $("releasedCount").textContent=papers.filter(p=>p.status==="RELEASED").length;
  const visible=papers.filter(p=>currentRole==="admin"||p.creatorId===currentUser.uid||p.status==="RELEASED");
  $("papers").innerHTML=visible.length?visible.map(p=>{
    const approve=currentRole==="admin"&&p.status==="PENDING_APPROVAL",open=p.status==="RELEASED"&&["examiner","admin"].includes(currentRole);
    return `<div class="paper"><div class="paper-top"><div><h3>${esc(p.title)}</h3><div class="muted">${esc(p.originalName)} • Setter: ${esc(p.creatorEmail)}</div></div><span class="status ${p.status}">${p.status.replace("_"," ")}</span></div><p><b>Exam:</b> ${fmt(p.examTime)}</p><p><b>SHA-256:</b> <code>${esc(p.sha256)}</code></p><div class="paper-actions">${approve?`<button data-approve="${p.id}">Approve</button>`:""}${open?`<button data-open="${p.id}">Open Paper</button><button class="secondary" data-verify="${p.id}">Verify Hash</button>`:""}</div></div>`
  }).join(""):"<p class='muted'>No papers available for this role.</p>";
  document.querySelectorAll("[data-approve]").forEach(b=>b.onclick=()=>{const p=papers.find(x=>x.id===b.dataset.approve);approve(p.id,p.title)});
  document.querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>openPaper(papers.find(x=>x.id===b.dataset.open)));
  document.querySelectorAll("[data-verify]").forEach(b=>b.onclick=()=>verifyPaper(papers.find(x=>x.id===b.dataset.verify)));
}
function subscribe(){
  onSnapshot(query(collection(db,"papers"),orderBy("createdAt","desc")),s=>{papers=s.docs.map(d=>({id:d.id,...d.data()}));renderPapers()});
  onSnapshot(query(collection(db,"auditLogs"),orderBy("createdAt","desc")),s=>{$("logs").innerHTML=s.docs.slice(0,30).map(d=>{const x=d.data();return `<div class="log"><strong>${esc(x.action)}</strong><span>${esc(x.details)} — ${esc(x.email)} — ${fmt(x.createdAt)}</span></div>`}).join("")||"<p class='muted'>No audit entries yet.</p>"});
}
onAuthStateChanged(auth,async user=>{
  currentUser=user;
  if(!user){currentRole=null;$("authSection").classList.remove("hidden");$("appSection").classList.add("hidden");$("userBox").classList.add("hidden");return}
  const s=await getDoc(doc(db,"users",user.uid));currentRole=s.exists()?s.data().role:"examiner";
  $("userEmail").textContent=user.email;$("userRole").textContent=currentRole.toUpperCase();$("userBox").classList.remove("hidden");$("authSection").classList.add("hidden");$("appSection").classList.remove("hidden");$("setterPanel").classList.toggle("hidden",!["setter","admin"].includes(currentRole));subscribe();renderPapers();
});
