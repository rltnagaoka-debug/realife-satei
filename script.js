// リアライフ 売却査定フォーム
// 入力内容を整形し、LINE公式アカウントのトーク画面へ本文入りで遷移させる。
const LINE_ID = "@071luwzd"; // リアライフ LINE公式アカウント (lin.ee/W5oG8Or)

const form = document.getElementById("sateiForm");
const steps = [...form.querySelectorAll(".step")];
const progress = [...document.querySelectorAll(".progress li")];
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const summaryEl = document.getElementById("summary");
const lineSend = document.getElementById("lineSend");
let current = 0;

const val = (name) => {
  const el = form.elements[name];
  if (!el) return "";
  if (el instanceof RadioNodeList) return el.value || "";
  return (el.value || "").trim();
};

// 物件種別に応じて入力項目を出し分ける
function applyType() {
  const type = val("type");
  form.querySelectorAll("[data-show]").forEach((el) => {
    const visible = !type || el.dataset.show.split(" ").includes(type);
    el.classList.toggle("is-hidden", !visible);
    if (!visible) el.querySelectorAll("input, select").forEach((i) => {
      if (i.type === "radio" || i.type === "checkbox") i.checked = false;
      else i.value = "";
    });
  });
}
form.querySelectorAll('input[name="type"]').forEach((r) =>
  r.addEventListener("change", () => {
    applyType();
    setError("type", "");
    // 種別選択はワンタップで次へ
    setTimeout(() => go(1), 180);
  })
);

function setError(name, msg) {
  const p = form.querySelector(`[data-error="${name}"]`);
  if (p) p.textContent = msg;
  const el = form.elements[name];
  if (el && !(el instanceof RadioNodeList)) el.classList.toggle("is-invalid", !!msg);
}

function validate(stepNo) {
  let ok = true;
  const req = (name, msg, test = (v) => v !== "") => {
    const good = test(val(name));
    setError(name, good ? "" : msg);
    if (!good) ok = false;
  };
  if (stepNo === 1) req("type", "物件種別を選択してください");
  if (stepNo === 2) req("city", "市区町村を入力してください");
  if (stepNo === 4) {
    req("name", "お名前を入力してください");
    req("tel", "電話番号を正しく入力してください", (v) => v.replace(/[^\d]/g, "").length >= 10);
    const agreed = form.elements.agree.checked;
    setError("agree", agreed ? "" : "個人情報の取り扱いへの同意が必要です");
    if (!agreed) ok = false;
  }
  if (!ok) {
    const first = steps[current].querySelector(".is-invalid, .error:not(:empty)");
    first?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return ok;
}

function buildMessage() {
  const lines = ["【無料売却査定のご依頼】", ""];
  const add = (label, v, unit = "") => { if (v) lines.push(`${label}：${v}${unit}`); };
  add("物件種別", val("type"));
  add("所在地", [val("pref"), val("city"), val("town")].filter(Boolean).join(""));
  add("物件名", val("bname"));
  add("土地面積", val("land"), "㎡");
  add("延床面積", val("floor"), "㎡");
  add("専有面積", val("area"), "㎡");
  add("間取り", val("madori"));
  add("総戸数", val("units"), "戸");
  add("構造", val("structure"));
  add("築年", val("built"), "年");
  add("家賃収入", val("rent"), "万円/月");
  add("現況", val("status"));
  add("売却希望時期", val("timing"));
  lines.push("");
  add("お名前", val("name"));
  add("電話番号", val("tel"));
  add("物件との関係", val("relation"));
  if (val("note")) lines.push("", "ご要望：", val("note"));
  return lines.join("\n");
}

function render() {
  steps.forEach((s, i) => s.classList.toggle("is-active", i === current));
  progress.forEach((p, i) => {
    p.classList.toggle("is-active", i === current);
    p.classList.toggle("is-done", i < current);
  });
  prevBtn.hidden = current === 0;
  nextBtn.hidden = current === steps.length - 1;
  nextBtn.textContent = current === steps.length - 2 ? "入力内容を確認する" : "次へ進む";

  if (current === steps.length - 1) {
    const msg = buildMessage();
    summaryEl.textContent = msg;
    lineSend.href = `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(msg)}`;
  }
}

function go(delta) {
  if (delta > 0 && !validate(current + 1)) return;
  current = Math.max(0, Math.min(steps.length - 1, current + delta));
  render();
  document.getElementById("satei").scrollIntoView({ behavior: "smooth" });
}
nextBtn.addEventListener("click", () => go(1));
prevBtn.addEventListener("click", () => go(-1));
form.addEventListener("submit", (e) => e.preventDefault());

// 入力中にエラー表示を消す
form.addEventListener("input", (e) => { if (e.target.name) setError(e.target.name, ""); });

// LINEが開けない環境向け：コピー
document.getElementById("copyBtn").addEventListener("click", async () => {
  const msg = buildMessage();
  try {
    await navigator.clipboard.writeText(msg);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = msg; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
  }
  const c = document.getElementById("copied");
  c.hidden = false;
  setTimeout(() => (c.hidden = true), 2500);
});

// フォーム表示中は追従ボタンを隠す
const floatCta = document.querySelector(".float-cta");
new IntersectionObserver(([e]) => floatCta.classList.toggle("is-hidden", e.isIntersecting), { threshold: 0.1 })
  .observe(document.getElementById("satei"));

applyType();
render();
