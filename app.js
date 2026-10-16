import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPEmYLSzMRdGHLvpwlListl2HeBIyck6U",
  authDomain: "emaa-9be5e.firebaseapp.com",
  projectId: "emaa-9be5e",
  storageBucket: "emaa-9be5e.firebasestorage.app",
  messagingSenderId: "375343717390",
  appId: "1:375343717390:web:c9f7418d128ff1e5a6f05f",
};

const $ = (id) => document.getElementById(id);
let current = [];

if (firebaseConfig.apiKey.startsWith("PASTE")) {
  $("err").textContent = "Firebase config is missing. Paste it into app.js.";
  throw new Error("Missing Firebase config");
}

const db = getFirestore(initializeApp(firebaseConfig));
const links = collection(db, "links");

function normalizeUrl(raw) {
  let v = raw.trim();
  if (!v) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.href;
  } catch (e) { return null; }
}

function render(list) {
  const box = $("list");
  box.textContent = "";
  if (!list.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No links yet. Add the first one below.";
    box.appendChild(p);
    return;
  }
  for (const item of list) {
    const row = document.createElement("div");
    row.className = "row";

    const a = document.createElement("a");
    a.className = "link";
    a.href = item.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";

    const ico = document.createElement("div");
    ico.className = "ico";
    ico.textContent = "\u{1F517}";

    const txt = document.createElement("div");
    txt.className = "txt";
    const strong = document.createElement("strong");
    strong.textContent = item.title;
    const span = document.createElement("span");
    try { span.textContent = new URL(item.url).hostname; } catch (e) { span.textContent = item.url; }
    txt.append(strong, span);
    a.append(ico, txt);

    const del = document.createElement("button");
    del.className = "del";
    del.type = "button";
    del.title = "Remove";
    del.textContent = "\u00D7";
    del.addEventListener("click", async () => {
      if (!confirm('Remove "' + item.title + '"?')) return;
      try { await deleteDoc(doc(db, "links", item.id)); }
      catch (e) { $("err").textContent = "Could not remove the link. Try again."; }
    });

    row.append(a, del);
    box.appendChild(row);
  }
}

// live updates: every teammate sees changes instantly
onSnapshot(
  query(links, orderBy("createdAt")),
  (snap) => {
    current = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    render(current);
  },
  () => { $("err").textContent = "Could not load links. Check your connection."; }
);

$("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("err").textContent = "";
  const title = $("title").value.trim();
  const url = normalizeUrl($("url").value);
  if (!title) { $("err").textContent = "Add a title."; return; }
  if (!url) { $("err").textContent = "That doesn't look like a valid link."; return; }
  if (current.some((l) => l.url === url)) { $("err").textContent = "That link is already in the list."; return; }

  const btn = e.submitter || $("addForm").querySelector("button");
  btn.disabled = true;
  try {
    await addDoc(links, { title, url, createdAt: serverTimestamp() });
    $("title").value = "";
    $("url").value = "";
  } catch (err) {
    $("err").textContent = "Could not add the link. Try again.";
  } finally {
    btn.disabled = false;
  }
});
