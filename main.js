var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PXTrackerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE = "px-tracker";
var DATA_FILE = "PX Tracker/px_tracker_data.json";
var NOTES_FOLDER = "PX Tracker/Notes";
var THEMES = [
  { id: "t1", name: "PX Strategy", col: "#0038b8" },
  { id: "t2", name: "People & Leadership", col: "#c0006a" },
  { id: "t3", name: "Design Ops & AI", col: "#c94040" },
  { id: "t4", name: "Craft & Delivery", col: "#3d4470" },
  { id: "t5", name: "Discovery & Research", col: "#5a6ab5" },
  { id: "t6", name: "Overhead", col: "#8a8fa8" }
];
function fmtH(h) {
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`;
}
function getMonday(offsetWeeks = 0) {
  const d = /* @__PURE__ */ new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1 + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekKey(offsetWeeks = 0) {
  return getMonday(offsetWeeks).toISOString().slice(0, 10);
}
function getTodayKey() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function getWeekLabel(offsetWeeks = 0) {
  const mon = getMonday(offsetWeeks);
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} \u2013 ${fmt(fri)}`;
}
function getWeekHours(data, offsetWeeks = 0) {
  const wkey = getWeekKey(offsetWeeks);
  const entry = data[wkey];
  if (!entry) return THEMES.map(() => 0);
  if (entry.days && Object.keys(entry.days).length > 0) {
    return THEMES.map(
      (_, i) => Object.values(entry.days).reduce((sum, day) => sum + (day.hours[i] || 0), 0)
    );
  }
  return THEMES.map(() => 0);
}
function getTodayHours(data) {
  var _a, _b, _c;
  const wkey = getWeekKey(0);
  const dkey = getTodayKey();
  return ((_c = (_b = (_a = data[wkey]) == null ? void 0 : _a.days) == null ? void 0 : _b[dkey]) == null ? void 0 : _c.hours) || THEMES.map(() => 0);
}
function ensureToday(data) {
  const wkey = getWeekKey(0);
  const dkey = getTodayKey();
  if (!data[wkey]) data[wkey] = { days: {}, note: "" };
  if (!data[wkey].days) data[wkey].days = {};
  if (!data[wkey].days[dkey]) data[wkey].days[dkey] = { hours: THEMES.map(() => 0), note: "" };
  return data;
}
var PXTrackerView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.data = {};
    this.activeTab = "today";
    this.weekOffset = 0;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "PX Tracker";
  }
  getIcon() {
    return "timer";
  }
  async onOpen() {
    this.data = await this.plugin.loadData_() || {};
    this.render();
  }
  async onClose() {
  }
  async save() {
    await this.plugin.saveData_(this.data);
    await this.plugin.writeWeekNote(this.data, this.weekOffset);
  }
  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.style.cssText = "padding:0;overflow-y:auto;background:var(--background-primary)";
    const app = root.createDiv({ cls: "px-app" });
    this.injectStyles(root);
    this.renderHeader(app);
    this.renderTabs(app);
    if (this.activeTab === "today") {
      this.renderToday(app);
    } else {
      this.renderWeek(app);
    }
  }
  injectStyles(root) {
    const existing = root.querySelector("#px-styles");
    if (existing) existing.remove();
    const style = root.createEl("style", { attr: { id: "px-styles" } });
    style.textContent = `
      .px-app { max-width: 680px; margin: 0 auto; padding: 28px 24px 60px; font-family: var(--font-interface); }
      .px-h1 { font-family: var(--font-text); font-size: 26px; font-weight: 400; color: var(--text-normal); line-height: 1.2; margin-bottom: 4px; }
      .px-sub { font-size: 11px; color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 24px; }
      .px-tabs { display: flex; border-bottom: 1px solid var(--background-modifier-border); margin-bottom: 24px; }
      .px-tab { padding: 8px 16px; font-size: 13px; color: var(--text-muted); background: none; border: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color .15s, border-color .15s; font-family: var(--font-interface); }
      .px-tab:hover { color: var(--text-normal); }
      .px-tab.active { color: var(--text-normal); font-weight: 500; border-bottom-color: var(--text-normal); }
      .px-badge { font-size: 10px; color: var(--text-muted); background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 1px 6px; margin-left: 5px; font-family: var(--font-monospace); }
      .px-tab.active .px-badge { color: var(--text-normal); }
      .px-date { font-size: 13px; font-weight: 500; color: var(--text-normal); margin-bottom: 3px; }
      .px-date-sub { font-size: 11px; color: var(--text-muted); margin-bottom: 20px; }
      .px-section { font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
      .px-themes { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
      .px-theme-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); transition: border-color .15s; }
      .px-theme-row:hover { border-color: var(--text-muted); }
      .px-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
      .px-name { font-size: 13px; flex: 1; color: var(--text-normal); }
      .px-hours { display: flex; align-items: center; gap: 6px; }
      .px-btn { background: none; border: 1px solid var(--background-modifier-border); border-radius: 5px; width: 24px; height: 24px; cursor: pointer; font-size: 14px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all .12s; line-height: 1; user-select: none; }
      .px-btn:hover { border-color: var(--text-normal); color: var(--text-normal); }
      .px-hval { font-family: var(--font-monospace); font-size: 13px; min-width: 32px; text-align: center; color: var(--text-normal); }
      .px-bar-wrap { width: 64px; height: 3px; background: var(--background-modifier-border); border-radius: 3px; overflow: hidden; }
      .px-bar { height: 100%; border-radius: 3px; transition: width .3s ease; }
      .px-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 8px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); margin-bottom: 20px; font-size: 12px; color: var(--text-muted); }
      .px-total-val { font-family: var(--font-monospace); font-size: 17px; color: var(--text-normal); }
      .px-divider { height: 1px; background: var(--background-modifier-border); margin: 20px 0; }
      .px-rollup { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
      .px-chip { display: flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 16px; border: 1px solid var(--background-modifier-border); background: var(--background-primary); font-size: 11px; color: var(--text-muted); }
      .px-chip-dot { width: 5px; height: 5px; border-radius: 50%; }
      .px-chip-val { font-family: var(--font-monospace); font-weight: 500; color: var(--text-normal); margin-left: 1px; }
      .px-note-label { font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; }
      .px-note { width: 100%; border: 1px solid var(--background-modifier-border); border-radius: 8px; padding: 10px 12px; font-family: var(--font-interface); font-size: 12px; line-height: 1.6; color: var(--text-normal); background: var(--background-primary); resize: none; height: 72px; outline: none; transition: border-color .15s; margin-bottom: 16px; }
      .px-note:focus { border-color: var(--text-muted); }
      .px-note::placeholder { color: var(--text-faint); font-style: italic; }
      .px-save { width: 100%; padding: 10px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 8px; font-family: var(--font-interface); font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity .15s; margin-bottom: 8px; }
      .px-save:hover { opacity: 0.88; }
      .px-save:disabled { opacity: 0.4; cursor: default; }
      .px-save-msg { font-size: 11px; color: var(--text-muted); text-align: center; min-height: 14px; }
      .px-week-nav { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
      .px-week-label { font-size: 13px; font-weight: 500; color: var(--text-normal); flex: 1; }
      .px-week-pill { font-size: 11px; color: var(--text-muted); background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 16px; padding: 2px 9px; }
      .px-nav-btn { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 14px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all .15s; }
      .px-nav-btn:hover { border-color: var(--text-normal); color: var(--text-normal); }
      .px-nav-btn:disabled { opacity: 0.3; cursor: default; }
      .px-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
      .px-panel { background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 10px; padding: 16px; }
      .px-donut-wrap { position: relative; display: flex; justify-content: center; margin-bottom: 12px; }
      .px-donut-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
      .px-donut-big { font-family: var(--font-monospace); font-size: 20px; font-weight: 500; color: var(--text-normal); line-height: 1; }
      .px-donut-small { font-size: 10px; color: var(--text-muted); margin-top: 2px; }
      .px-legend { display: flex; flex-direction: column; gap: 4px; }
      .px-legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
      .px-legend-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
      .px-legend-name { flex: 1; }
      .px-legend-pct { font-family: var(--font-monospace); font-weight: 500; color: var(--text-normal); }
      .px-hist { display: flex; gap: 4px; align-items: flex-end; height: 72px; }
      .px-hist-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; cursor: pointer; }
      .px-hist-stack { width: 100%; border-radius: 2px 2px 0 0; overflow: hidden; display: flex; flex-direction: column-reverse; transition: opacity .15s; min-height: 2px; }
      .px-hist-col:hover .px-hist-stack { opacity: 0.75; }
      .px-hist-seg { width: 100%; }
      .px-hist-lbl { font-size: 8px; color: var(--text-muted); text-align: center; margin-top: 4px; opacity: 0.5; white-space: nowrap; overflow: hidden; }
      .px-hist-col.current .px-hist-lbl { opacity: 1; font-weight: 500; color: var(--text-normal); }
      .px-hist-empty { background: var(--background-modifier-border); border-radius: 2px; }
      .px-week-readonly .px-hval { color: var(--text-muted); }
      .px-note-link { font-size: 11px; color: var(--text-accent); cursor: pointer; text-align: center; display: block; margin-top: 8px; text-decoration: underline; text-underline-offset: 2px; }
      .px-note-link:hover { color: var(--text-normal); }
    `;
  }
  renderHeader(app) {
    const h = app.createDiv();
    h.createEl("h2", { cls: "px-h1", text: "Where my time goes" });
    h.createDiv({ cls: "px-sub", text: "Weekly focus tracker \xB7 Product Experience" });
  }
  renderTabs(app) {
    const todayHours = getTodayHours(this.data);
    const todayTotal = todayHours.reduce((a, b) => a + b, 0);
    const weekHours = getWeekHours(this.data, 0);
    const weekTotal = weekHours.reduce((a, b) => a + b, 0);
    const tabs = app.createDiv({ cls: "px-tabs" });
    const todayTab = tabs.createEl("button", { cls: `px-tab${this.activeTab === "today" ? " active" : ""}`, text: "Today" });
    todayTab.createSpan({ cls: "px-badge", text: fmtH(todayTotal) });
    todayTab.onclick = () => {
      this.activeTab = "today";
      this.render();
    };
    const weekTab = tabs.createEl("button", { cls: `px-tab${this.activeTab === "week" ? " active" : ""}`, text: "This week" });
    weekTab.createSpan({ cls: "px-badge", text: fmtH(weekTotal) });
    weekTab.onclick = () => {
      this.activeTab = "week";
      this.render();
    };
  }
  renderToday(app) {
    var _a, _b, _c;
    const hours = getTodayHours(this.data);
    const total = hours.reduce((a, b) => a + b, 0);
    const weekHours = getWeekHours(this.data, 0);
    const weekTotal = weekHours.reduce((a, b) => a + b, 0);
    const now = /* @__PURE__ */ new Date();
    app.createDiv({ cls: "px-date", text: now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) });
    app.createDiv({ cls: "px-date-sub", text: "Log hours for today \u2014 they roll up into your weekly total" });
    app.createDiv({ cls: "px-section", text: "Hours by theme" });
    const list = app.createDiv({ cls: "px-themes" });
    THEMES.forEach((t, i) => {
      const pct = total > 0 ? Math.round(hours[i] / total * 100) : 0;
      const row = list.createDiv({ cls: "px-theme-row" });
      row.createDiv({ cls: "px-dot", attr: { style: `background:${t.col}` } });
      row.createSpan({ cls: "px-name", text: t.name });
      const hh = row.createDiv({ cls: "px-hours" });
      const minusBtn = hh.createEl("button", { cls: "px-btn", text: "\u2212" });
      const valEl = hh.createSpan({ cls: "px-hval", text: fmtH(hours[i]) });
      const plusBtn = hh.createEl("button", { cls: "px-btn", text: "+" });
      const bw = row.createDiv({ cls: "px-bar-wrap" });
      const bar = bw.createDiv({ cls: "px-bar", attr: { style: `width:${pct}%;background:${t.col}` } });
      minusBtn.onclick = () => {
        this.data = ensureToday(this.data);
        const wkey = getWeekKey(0);
        const dkey2 = getTodayKey();
        this.data[wkey].days[dkey2].hours[i] = Math.max(0, +(this.data[wkey].days[dkey2].hours[i] - 0.5).toFixed(1));
        this.render();
      };
      plusBtn.onclick = () => {
        this.data = ensureToday(this.data);
        const wkey = getWeekKey(0);
        const dkey2 = getTodayKey();
        this.data[wkey].days[dkey2].hours[i] = +(this.data[wkey].days[dkey2].hours[i] + 0.5).toFixed(1);
        this.render();
      };
    });
    const totalRow = app.createDiv({ cls: "px-total" });
    totalRow.createSpan({ text: "Today's total" });
    totalRow.createSpan({ cls: "px-total-val", text: fmtH(total) });
    app.createDiv({ cls: "px-divider" });
    app.createDiv({ cls: "px-section", text: "Week so far" });
    const rollup = app.createDiv({ cls: "px-rollup" });
    let any = false;
    THEMES.forEach((t, i) => {
      if (weekHours[i] === 0) return;
      any = true;
      const chip = rollup.createDiv({ cls: "px-chip" });
      chip.createDiv({ cls: "px-chip-dot", attr: { style: `background:${t.col}` } });
      chip.createSpan({ text: t.name });
      chip.createSpan({ cls: "px-chip-val", text: fmtH(weekHours[i]) });
    });
    if (!any) rollup.createSpan({ attr: { style: "font-size:12px;color:var(--text-muted)" }, text: "No hours logged this week yet" });
    app.createDiv({ cls: "px-note-label", text: "Today's note" });
    const noteEl = app.createEl("textarea", { cls: "px-note", attr: { placeholder: "What did I actually spend my energy on today \u2014 and what's stirring?" } });
    const wkey0 = getWeekKey(0);
    const dkey = getTodayKey();
    noteEl.value = ((_c = (_b = (_a = this.data[wkey0]) == null ? void 0 : _a.days) == null ? void 0 : _b[dkey]) == null ? void 0 : _c.note) || "";
    const saveBtn = app.createEl("button", { cls: "px-save", text: "Save today" });
    const saveMsg = app.createDiv({ cls: "px-save-msg" });
    saveBtn.onclick = async () => {
      this.data = ensureToday(this.data);
      const wk = getWeekKey(0);
      const dk = getTodayKey();
      this.data[wk].days[dk].note = noteEl.value;
      saveBtn.disabled = true;
      await this.save();
      saveBtn.disabled = false;
      saveMsg.textContent = "Saved \u2713";
      setTimeout(() => {
        saveMsg.textContent = "";
      }, 2e3);
      this.render();
    };
    app.createEl("a", { cls: "px-note-link", text: "\u2192 Open this week's note in vault", attr: { href: "#" } }).onclick = async (e) => {
      e.preventDefault();
      await this.plugin.openWeekNote(this.weekOffset);
    };
  }
  renderWeek(app) {
    var _a;
    const nav = app.createDiv({ cls: "px-week-nav" });
    const prevBtn = nav.createEl("button", { cls: "px-nav-btn", text: "\u2039" });
    nav.createSpan({ cls: "px-week-label", text: getWeekLabel(this.weekOffset) });
    const pill = this.weekOffset === 0 ? "this week" : this.weekOffset === -1 ? "last week" : `${Math.abs(this.weekOffset)} weeks ago`;
    nav.createSpan({ cls: "px-week-pill", text: pill });
    const nextBtn = nav.createEl("button", { cls: "px-nav-btn", text: "\u203A" });
    if (this.weekOffset >= 0) nextBtn.disabled = true;
    prevBtn.onclick = () => {
      this.weekOffset--;
      this.render();
    };
    nextBtn.onclick = () => {
      if (this.weekOffset < 0) {
        this.weekOffset++;
        this.render();
      }
    };
    const hours = getWeekHours(this.data, this.weekOffset);
    const total = hours.reduce((a, b) => a + b, 0);
    app.createDiv({ cls: "px-section", text: "Hours by theme" });
    const list = app.createDiv({ cls: "px-themes px-week-readonly" });
    THEMES.forEach((t, i) => {
      const pct = total > 0 ? Math.round(hours[i] / total * 100) : 0;
      const row = list.createDiv({ cls: "px-theme-row" });
      row.createDiv({ cls: "px-dot", attr: { style: `background:${t.col}` } });
      row.createSpan({ cls: "px-name", text: t.name });
      row.createDiv({ cls: "px-hours" }).createSpan({ cls: "px-hval", text: fmtH(hours[i]) });
      const bw = row.createDiv({ cls: "px-bar-wrap" });
      bw.createDiv({ cls: "px-bar", attr: { style: `width:${pct}%;background:${t.col}` } });
    });
    const totalRow = app.createDiv({ cls: "px-total" });
    totalRow.createSpan({ text: "Total logged this week" });
    totalRow.createSpan({ cls: "px-total-val", text: fmtH(total) });
    const two = app.createDiv({ cls: "px-two-col" });
    this.renderDonut(two, hours, total);
    this.renderHistory(two);
    app.createDiv({ cls: "px-note-label", text: "Week note" });
    const noteEl = app.createEl("textarea", { cls: "px-note", attr: { placeholder: "What moved this week? What am I distilling? What do I want Imir to know?" } });
    const wkey = getWeekKey(this.weekOffset);
    noteEl.value = ((_a = this.data[wkey]) == null ? void 0 : _a.note) || "";
    const saveBtn = app.createEl("button", { cls: "px-save", text: "Save this week" });
    const saveMsg = app.createDiv({ cls: "px-save-msg" });
    saveBtn.onclick = async () => {
      if (!this.data[wkey]) this.data[wkey] = { days: {}, note: "" };
      this.data[wkey].note = noteEl.value;
      saveBtn.disabled = true;
      await this.save();
      saveBtn.disabled = false;
      saveMsg.textContent = "Saved \u2713";
      setTimeout(() => {
        saveMsg.textContent = "";
      }, 2e3);
    };
    app.createEl("a", { cls: "px-note-link", text: "\u2192 Open this week's note in vault", attr: { href: "#" } }).onclick = async (e) => {
      e.preventDefault();
      await this.plugin.openWeekNote(this.weekOffset);
    };
  }
  renderDonut(container, hours, total) {
    const panel = container.createDiv({ cls: "px-panel" });
    panel.createDiv({ cls: "px-section", text: "Distribution" });
    const wrap = panel.createDiv({ cls: "px-donut-wrap" });
    const svg = wrap.createSvg("svg", { attr: { width: "90", height: "90", viewBox: "0 0 90 90" } });
    const center = wrap.createDiv({ cls: "px-donut-center" });
    if (total === 0) {
      svg.createSvg("circle", { attr: { cx: "45", cy: "45", r: "34", fill: "none", stroke: "var(--background-modifier-border)", "stroke-width": "11" } });
      center.createDiv({ cls: "px-donut-big", text: "\u2014" });
      center.createDiv({ cls: "px-donut-small", text: "log hours" });
      panel.createDiv({ cls: "px-legend" }).createDiv({ attr: { style: "font-size:11px;color:var(--text-muted)" }, text: "No data yet" });
      return;
    }
    const cx = 45, cy = 45, r = 34, sw = 11;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const maxIdx = hours.indexOf(Math.max(...hours));
    hours.forEach((h, i) => {
      if (h === 0) return;
      const pct = h / total;
      const dash = pct * circ;
      const gap = circ - dash;
      svg.createSvg("circle", { attr: {
        cx: String(cx),
        cy: String(cy),
        r: String(r),
        fill: "none",
        stroke: THEMES[i].col,
        "stroke-width": String(sw),
        "stroke-dasharray": `${dash.toFixed(2)} ${gap.toFixed(2)}`,
        "stroke-dashoffset": `${(-(offset * circ) + circ / 4).toFixed(2)}`
      } });
      offset += pct;
    });
    center.createDiv({ cls: "px-donut-big", text: `${Math.round(hours[maxIdx] / total * 100)}%` });
    center.createDiv({ cls: "px-donut-small", text: THEMES[maxIdx].name.split(" ")[0].toLowerCase() });
    const legend = panel.createDiv({ cls: "px-legend" });
    THEMES.forEach((t, i) => {
      const pct = total > 0 ? Math.round(hours[i] / total * 100) : 0;
      if (pct === 0) return;
      const item = legend.createDiv({ cls: "px-legend-item" });
      item.createDiv({ cls: "px-legend-dot", attr: { style: `background:${t.col}` } });
      item.createSpan({ cls: "px-legend-name", text: t.name });
      item.createSpan({ cls: "px-legend-pct", text: `${pct}%` });
    });
  }
  renderHistory(container) {
    const panel = container.createDiv({ cls: "px-panel" });
    panel.createDiv({ cls: "px-section", text: "Past 8 weeks" });
    const wrap = panel.createDiv({ cls: "px-hist" });
    const weeks = [];
    for (let i = -7; i <= 0; i++) weeks.push({ key: getWeekKey(i), offset: i });
    const totals = weeks.map((w) => getWeekHours(this.data, w.offset).reduce((a, b) => a + b, 0));
    const maxTotal = Math.max(...totals, 1);
    weeks.forEach((w, wi) => {
      const hours = getWeekHours(this.data, w.offset);
      const total = totals[wi];
      const heightPx = total > 0 ? Math.max(Math.round(total / maxTotal * 64), 4) : 3;
      const isCurrent = w.offset === this.weekOffset;
      const col = wrap.createDiv({ cls: `px-hist-col${isCurrent ? " current" : ""}` });
      const stack = col.createDiv({ cls: `px-hist-stack${total === 0 ? " px-hist-empty" : ""}` });
      stack.style.height = `${heightPx}px`;
      if (total > 0) {
        THEMES.forEach((t, i) => {
          if (hours[i] === 0) return;
          const seg = stack.createDiv({ cls: "px-hist-seg" });
          seg.style.background = t.col;
          seg.style.height = `${Math.max(Math.round(hours[i] / total * heightPx), 1)}px`;
        });
      }
      const d = new Date(w.key);
      col.createDiv({ cls: "px-hist-lbl", text: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) });
      col.onclick = () => {
        this.weekOffset = w.offset;
        this.activeTab = "week";
        this.render();
      };
    });
  }
};
var PXTrackerPlugin = class extends import_obsidian.Plugin {
  async onload() {
    this.registerView(VIEW_TYPE, (leaf) => new PXTrackerView(leaf, this));
    this.addRibbonIcon("timer", "PX Tracker", () => this.activateView());
    this.addCommand({
      id: "open-px-tracker",
      name: "Open PX Tracker",
      callback: () => this.activateView()
    });
    await this.ensureFolder("PX Tracker");
    await this.ensureFolder(NOTES_FOLDER);
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
      this.app.workspace.revealLeaf(leaf);
    }
  }
  async ensureFolder(path) {
    if (!this.app.vault.getAbstractFileByPath(path)) {
      await this.app.vault.createFolder(path);
    }
  }
  async loadData_() {
    const file = this.app.vault.getAbstractFileByPath(DATA_FILE);
    if (file instanceof import_obsidian.TFile) {
      const raw = await this.app.vault.read(file);
      try {
        return JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    return {};
  }
  async saveData_(data) {
    const file = this.app.vault.getAbstractFileByPath(DATA_FILE);
    const json = JSON.stringify(data, null, 2);
    if (file instanceof import_obsidian.TFile) {
      await this.app.vault.modify(file, json);
    } else {
      await this.app.vault.create(DATA_FILE, json);
    }
  }
  async writeWeekNote(data, weekOffset) {
    const wkey = getWeekKey(weekOffset);
    const entry = data[wkey];
    if (!entry) return;
    const hours = getWeekHours(data, weekOffset);
    const total = hours.reduce((a, b) => a + b, 0);
    const label = getWeekLabel(weekOffset);
    let content = `# Week of ${label}

`;
    content += `## Hours

`;
    THEMES.forEach((t, i) => {
      if (hours[i] > 0) content += `- **${t.name}**: ${fmtH(hours[i])}
`;
    });
    content += `
**Total**: ${fmtH(total)}

`;
    if (entry.note) {
      content += `## Week reflection

${entry.note}

`;
    }
    const days = entry.days || {};
    const dayKeys = Object.keys(days).sort();
    if (dayKeys.length > 0) {
      content += `## Daily notes

`;
      dayKeys.forEach((dkey) => {
        const day = days[dkey];
        if (day.note) {
          const d = new Date(dkey);
          const dayLabel = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
          content += `### ${dayLabel}

${day.note}

`;
        }
      });
    }
    const notePath = `${NOTES_FOLDER}/${wkey}.md`;
    const existing = this.app.vault.getAbstractFileByPath(notePath);
    if (existing instanceof import_obsidian.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(notePath, content);
    }
  }
  async openWeekNote(weekOffset) {
    const wkey = getWeekKey(weekOffset);
    const notePath = `${NOTES_FOLDER}/${wkey}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    if (!file) {
      const data = await this.loadData_();
      await this.writeWeekNote(data, weekOffset);
      file = this.app.vault.getAbstractFileByPath(notePath);
    }
    if (file instanceof import_obsidian.TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
    }
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFwcCwgSXRlbVZpZXcsIFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgVEZpbGUsIG1vbWVudCB9IGZyb20gJ29ic2lkaWFuJztcblxuY29uc3QgVklFV19UWVBFID0gJ3B4LXRyYWNrZXInO1xuY29uc3QgREFUQV9GSUxFID0gJ1BYIFRyYWNrZXIvcHhfdHJhY2tlcl9kYXRhLmpzb24nO1xuY29uc3QgTk9URVNfRk9MREVSID0gJ1BYIFRyYWNrZXIvTm90ZXMnO1xuXG5jb25zdCBUSEVNRVMgPSBbXG4gIHsgaWQ6ICd0MScsIG5hbWU6ICdQWCBTdHJhdGVneScsICAgICAgICAgY29sOiAnIzAwMzhiOCcgfSxcbiAgeyBpZDogJ3QyJywgbmFtZTogJ1Blb3BsZSAmIExlYWRlcnNoaXAnLCAgY29sOiAnI2MwMDA2YScgfSxcbiAgeyBpZDogJ3QzJywgbmFtZTogJ0Rlc2lnbiBPcHMgJiBBSScsICAgICAgY29sOiAnI2M5NDA0MCcgfSxcbiAgeyBpZDogJ3Q0JywgbmFtZTogJ0NyYWZ0ICYgRGVsaXZlcnknLCAgICAgY29sOiAnIzNkNDQ3MCcgfSxcbiAgeyBpZDogJ3Q1JywgbmFtZTogJ0Rpc2NvdmVyeSAmIFJlc2VhcmNoJywgY29sOiAnIzVhNmFiNScgfSxcbiAgeyBpZDogJ3Q2JywgbmFtZTogJ092ZXJoZWFkJywgICAgICAgICAgICAgY29sOiAnIzhhOGZhOCcgfSxcbl07XG5cbmludGVyZmFjZSBEYXlFbnRyeSB7XG4gIGhvdXJzOiBudW1iZXJbXTtcbiAgbm90ZTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgV2Vla0VudHJ5IHtcbiAgZGF5czogUmVjb3JkPHN0cmluZywgRGF5RW50cnk+O1xuICBub3RlOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBUcmFja2VyRGF0YSB7XG4gIFt3ZWVrS2V5OiBzdHJpbmddOiBXZWVrRW50cnk7XG59XG5cbmZ1bmN0aW9uIGZtdEgoaDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGggJSAxID09PSAwID8gYCR7aH1oYCA6IGAke2gudG9GaXhlZCgxKX1oYDtcbn1cblxuZnVuY3Rpb24gZ2V0TW9uZGF5KG9mZnNldFdlZWtzID0gMCk6IERhdGUge1xuICBjb25zdCBkID0gbmV3IERhdGUoKTtcbiAgY29uc3QgZGF5ID0gZC5nZXREYXkoKSB8fCA3O1xuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkYXkgKyAxICsgb2Zmc2V0V2Vla3MgKiA3KTtcbiAgZC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgcmV0dXJuIGQ7XG59XG5cbmZ1bmN0aW9uIGdldFdlZWtLZXkob2Zmc2V0V2Vla3MgPSAwKTogc3RyaW5nIHtcbiAgcmV0dXJuIGdldE1vbmRheShvZmZzZXRXZWVrcykudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7XG59XG5cbmZ1bmN0aW9uIGdldFRvZGF5S2V5KCk6IHN0cmluZyB7XG4gIHJldHVybiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc2xpY2UoMCwgMTApO1xufVxuXG5mdW5jdGlvbiBnZXRXZWVrTGFiZWwob2Zmc2V0V2Vla3MgPSAwKTogc3RyaW5nIHtcbiAgY29uc3QgbW9uID0gZ2V0TW9uZGF5KG9mZnNldFdlZWtzKTtcbiAgY29uc3QgZnJpID0gbmV3IERhdGUobW9uKTtcbiAgZnJpLnNldERhdGUobW9uLmdldERhdGUoKSArIDQpO1xuICBjb25zdCBmbXQgPSAoZDogRGF0ZSkgPT4gZC50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUdCJywgeyBkYXk6ICdudW1lcmljJywgbW9udGg6ICdzaG9ydCcgfSk7XG4gIHJldHVybiBgJHtmbXQobW9uKX0gXHUyMDEzICR7Zm10KGZyaSl9YDtcbn1cblxuZnVuY3Rpb24gZ2V0V2Vla0hvdXJzKGRhdGE6IFRyYWNrZXJEYXRhLCBvZmZzZXRXZWVrcyA9IDApOiBudW1iZXJbXSB7XG4gIGNvbnN0IHdrZXkgPSBnZXRXZWVrS2V5KG9mZnNldFdlZWtzKTtcbiAgY29uc3QgZW50cnkgPSBkYXRhW3drZXldO1xuICBpZiAoIWVudHJ5KSByZXR1cm4gVEhFTUVTLm1hcCgoKSA9PiAwKTtcbiAgaWYgKGVudHJ5LmRheXMgJiYgT2JqZWN0LmtleXMoZW50cnkuZGF5cykubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBUSEVNRVMubWFwKChfLCBpKSA9PlxuICAgICAgT2JqZWN0LnZhbHVlcyhlbnRyeS5kYXlzKS5yZWR1Y2UoKHN1bSwgZGF5KSA9PiBzdW0gKyAoZGF5LmhvdXJzW2ldIHx8IDApLCAwKVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIFRIRU1FUy5tYXAoKCkgPT4gMCk7XG59XG5cbmZ1bmN0aW9uIGdldFRvZGF5SG91cnMoZGF0YTogVHJhY2tlckRhdGEpOiBudW1iZXJbXSB7XG4gIGNvbnN0IHdrZXkgPSBnZXRXZWVrS2V5KDApO1xuICBjb25zdCBka2V5ID0gZ2V0VG9kYXlLZXkoKTtcbiAgcmV0dXJuIGRhdGFbd2tleV0/LmRheXM/Lltka2V5XT8uaG91cnMgfHwgVEhFTUVTLm1hcCgoKSA9PiAwKTtcbn1cblxuZnVuY3Rpb24gZW5zdXJlVG9kYXkoZGF0YTogVHJhY2tlckRhdGEpOiBUcmFja2VyRGF0YSB7XG4gIGNvbnN0IHdrZXkgPSBnZXRXZWVrS2V5KDApO1xuICBjb25zdCBka2V5ID0gZ2V0VG9kYXlLZXkoKTtcbiAgaWYgKCFkYXRhW3drZXldKSBkYXRhW3drZXldID0geyBkYXlzOiB7fSwgbm90ZTogJycgfTtcbiAgaWYgKCFkYXRhW3drZXldLmRheXMpIGRhdGFbd2tleV0uZGF5cyA9IHt9O1xuICBpZiAoIWRhdGFbd2tleV0uZGF5c1tka2V5XSkgZGF0YVt3a2V5XS5kYXlzW2RrZXldID0geyBob3VyczogVEhFTUVTLm1hcCgoKSA9PiAwKSwgbm90ZTogJycgfTtcbiAgcmV0dXJuIGRhdGE7XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBWaWV3IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuY2xhc3MgUFhUcmFja2VyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcGx1Z2luOiBQWFRyYWNrZXJQbHVnaW47XG4gIGRhdGE6IFRyYWNrZXJEYXRhID0ge307XG4gIGFjdGl2ZVRhYjogJ3RvZGF5JyB8ICd3ZWVrJyA9ICd0b2RheSc7XG4gIHdlZWtPZmZzZXQgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKGxlYWY6IFdvcmtzcGFjZUxlYWYsIHBsdWdpbjogUFhUcmFja2VyUGx1Z2luKSB7XG4gICAgc3VwZXIobGVhZik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBnZXRWaWV3VHlwZSgpIHsgcmV0dXJuIFZJRVdfVFlQRTsgfVxuICBnZXREaXNwbGF5VGV4dCgpIHsgcmV0dXJuICdQWCBUcmFja2VyJzsgfVxuICBnZXRJY29uKCkgeyByZXR1cm4gJ3RpbWVyJzsgfVxuXG4gIGFzeW5jIG9uT3BlbigpIHtcbiAgICB0aGlzLmRhdGEgPSBhd2FpdCB0aGlzLnBsdWdpbi5sb2FkRGF0YV8oKSB8fCB7fTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgYXN5bmMgb25DbG9zZSgpIHt9XG5cbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlRGF0YV8odGhpcy5kYXRhKTtcbiAgICAvLyBXcml0ZSB3ZWVrbHkgbm90ZSB0byB2YXVsdCBhcyBhIGxpbmtlZCAubWQgZmlsZVxuICAgIGF3YWl0IHRoaXMucGx1Z2luLndyaXRlV2Vla05vdGUodGhpcy5kYXRhLCB0aGlzLndlZWtPZmZzZXQpO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGNvbnN0IHJvb3QgPSB0aGlzLmNvbnRhaW5lckVsLmNoaWxkcmVuWzFdIGFzIEhUTUxFbGVtZW50O1xuICAgIHJvb3QuZW1wdHkoKTtcbiAgICByb290LnN0eWxlLmNzc1RleHQgPSAncGFkZGluZzowO292ZXJmbG93LXk6YXV0bztiYWNrZ3JvdW5kOnZhcigtLWJhY2tncm91bmQtcHJpbWFyeSknO1xuXG4gICAgY29uc3QgYXBwID0gcm9vdC5jcmVhdGVEaXYoeyBjbHM6ICdweC1hcHAnIH0pO1xuICAgIHRoaXMuaW5qZWN0U3R5bGVzKHJvb3QpO1xuICAgIHRoaXMucmVuZGVySGVhZGVyKGFwcCk7XG4gICAgdGhpcy5yZW5kZXJUYWJzKGFwcCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlVGFiID09PSAndG9kYXknKSB7XG4gICAgICB0aGlzLnJlbmRlclRvZGF5KGFwcCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucmVuZGVyV2VlayhhcHApO1xuICAgIH1cbiAgfVxuXG4gIGluamVjdFN0eWxlcyhyb290OiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IGV4aXN0aW5nID0gcm9vdC5xdWVyeVNlbGVjdG9yKCcjcHgtc3R5bGVzJyk7XG4gICAgaWYgKGV4aXN0aW5nKSBleGlzdGluZy5yZW1vdmUoKTtcbiAgICBjb25zdCBzdHlsZSA9IHJvb3QuY3JlYXRlRWwoJ3N0eWxlJywgeyBhdHRyOiB7IGlkOiAncHgtc3R5bGVzJyB9IH0pO1xuICAgIHN0eWxlLnRleHRDb250ZW50ID0gYFxuICAgICAgLnB4LWFwcCB7IG1heC13aWR0aDogNjgwcHg7IG1hcmdpbjogMCBhdXRvOyBwYWRkaW5nOiAyOHB4IDI0cHggNjBweDsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtaW50ZXJmYWNlKTsgfVxuICAgICAgLnB4LWgxIHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtdGV4dCk7IGZvbnQtc2l6ZTogMjZweDsgZm9udC13ZWlnaHQ6IDQwMDsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgbGluZS1oZWlnaHQ6IDEuMjsgbWFyZ2luLWJvdHRvbTogNHB4OyB9XG4gICAgICAucHgtc3ViIHsgZm9udC1zaXplOiAxMXB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IGxldHRlci1zcGFjaW5nOiAwLjA1ZW07IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7IG1hcmdpbi1ib3R0b206IDI0cHg7IH1cbiAgICAgIC5weC10YWJzIHsgZGlzcGxheTogZmxleDsgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTsgbWFyZ2luLWJvdHRvbTogMjRweDsgfVxuICAgICAgLnB4LXRhYiB7IHBhZGRpbmc6IDhweCAxNnB4OyBmb250LXNpemU6IDEzcHg7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgYmFja2dyb3VuZDogbm9uZTsgYm9yZGVyOiBub25lOyBjdXJzb3I6IHBvaW50ZXI7IGJvcmRlci1ib3R0b206IDJweCBzb2xpZCB0cmFuc3BhcmVudDsgbWFyZ2luLWJvdHRvbTogLTFweDsgdHJhbnNpdGlvbjogY29sb3IgLjE1cywgYm9yZGVyLWNvbG9yIC4xNXM7IGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LWludGVyZmFjZSk7IH1cbiAgICAgIC5weC10YWI6aG92ZXIgeyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyB9XG4gICAgICAucHgtdGFiLmFjdGl2ZSB7IGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IGZvbnQtd2VpZ2h0OiA1MDA7IGJvcmRlci1ib3R0b20tY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgfVxuICAgICAgLnB4LWJhZGdlIHsgZm9udC1zaXplOiAxMHB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBib3JkZXItcmFkaXVzOiAxMHB4OyBwYWRkaW5nOiAxcHggNnB4OyBtYXJnaW4tbGVmdDogNXB4OyBmb250LWZhbWlseTogdmFyKC0tZm9udC1tb25vc3BhY2UpOyB9XG4gICAgICAucHgtdGFiLmFjdGl2ZSAucHgtYmFkZ2UgeyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyB9XG4gICAgICAucHgtZGF0ZSB7IGZvbnQtc2l6ZTogMTNweDsgZm9udC13ZWlnaHQ6IDUwMDsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgbWFyZ2luLWJvdHRvbTogM3B4OyB9XG4gICAgICAucHgtZGF0ZS1zdWIgeyBmb250LXNpemU6IDExcHg7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgbWFyZ2luLWJvdHRvbTogMjBweDsgfVxuICAgICAgLnB4LXNlY3Rpb24geyBmb250LXNpemU6IDEwcHg7IGZvbnQtd2VpZ2h0OiA1MDA7IGxldHRlci1zcGFjaW5nOiAwLjA4ZW07IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgbWFyZ2luLWJvdHRvbTogMTBweDsgfVxuICAgICAgLnB4LXRoZW1lcyB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogNnB4OyBtYXJnaW4tYm90dG9tOiAxNnB4OyB9XG4gICAgICAucHgtdGhlbWUtcm93IHsgZGlzcGxheTogZmxleDsgYWxpZ24taXRlbXM6IGNlbnRlcjsgZ2FwOiAxMHB4OyBwYWRkaW5nOiAxMHB4IDEycHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpOyB0cmFuc2l0aW9uOiBib3JkZXItY29sb3IgLjE1czsgfVxuICAgICAgLnB4LXRoZW1lLXJvdzpob3ZlciB7IGJvcmRlci1jb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IH1cbiAgICAgIC5weC1kb3QgeyB3aWR0aDogOXB4OyBoZWlnaHQ6IDlweDsgYm9yZGVyLXJhZGl1czogNTAlOyBmbGV4LXNocmluazogMDsgfVxuICAgICAgLnB4LW5hbWUgeyBmb250LXNpemU6IDEzcHg7IGZsZXg6IDE7IGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IH1cbiAgICAgIC5weC1ob3VycyB7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGdhcDogNnB4OyB9XG4gICAgICAucHgtYnRuIHsgYmFja2dyb3VuZDogbm9uZTsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBib3JkZXItcmFkaXVzOiA1cHg7IHdpZHRoOiAyNHB4OyBoZWlnaHQ6IDI0cHg7IGN1cnNvcjogcG9pbnRlcjsgZm9udC1zaXplOiAxNHB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB0cmFuc2l0aW9uOiBhbGwgLjEyczsgbGluZS1oZWlnaHQ6IDE7IHVzZXItc2VsZWN0OiBub25lOyB9XG4gICAgICAucHgtYnRuOmhvdmVyIHsgYm9yZGVyLWNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IH1cbiAgICAgIC5weC1odmFsIHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ub3NwYWNlKTsgZm9udC1zaXplOiAxM3B4OyBtaW4td2lkdGg6IDMycHg7IHRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgfVxuICAgICAgLnB4LWJhci13cmFwIHsgd2lkdGg6IDY0cHg7IGhlaWdodDogM3B4OyBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7IGJvcmRlci1yYWRpdXM6IDNweDsgb3ZlcmZsb3c6IGhpZGRlbjsgfVxuICAgICAgLnB4LWJhciB7IGhlaWdodDogMTAwJTsgYm9yZGVyLXJhZGl1czogM3B4OyB0cmFuc2l0aW9uOiB3aWR0aCAuM3MgZWFzZTsgfVxuICAgICAgLnB4LXRvdGFsIHsgZGlzcGxheTogZmxleDsganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuOyBhbGlnbi1pdGVtczogY2VudGVyOyBwYWRkaW5nOiAxMHB4IDEycHg7IGJvcmRlci1yYWRpdXM6IDhweDsgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpOyBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7IG1hcmdpbi1ib3R0b206IDIwcHg7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpOyB9XG4gICAgICAucHgtdG90YWwtdmFsIHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ub3NwYWNlKTsgZm9udC1zaXplOiAxN3B4OyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyB9XG4gICAgICAucHgtZGl2aWRlciB7IGhlaWdodDogMXB4OyBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7IG1hcmdpbjogMjBweCAwOyB9XG4gICAgICAucHgtcm9sbHVwIHsgZGlzcGxheTogZmxleDsgZ2FwOiA2cHg7IGZsZXgtd3JhcDogd3JhcDsgbWFyZ2luLWJvdHRvbTogMjBweDsgfVxuICAgICAgLnB4LWNoaXAgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDVweDsgcGFkZGluZzogNHB4IDlweDsgYm9yZGVyLXJhZGl1czogMTZweDsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpOyBmb250LXNpemU6IDExcHg7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgfVxuICAgICAgLnB4LWNoaXAtZG90IHsgd2lkdGg6IDVweDsgaGVpZ2h0OiA1cHg7IGJvcmRlci1yYWRpdXM6IDUwJTsgfVxuICAgICAgLnB4LWNoaXAtdmFsIHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ub3NwYWNlKTsgZm9udC13ZWlnaHQ6IDUwMDsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgbWFyZ2luLWxlZnQ6IDFweDsgfVxuICAgICAgLnB4LW5vdGUtbGFiZWwgeyBmb250LXNpemU6IDEwcHg7IGZvbnQtd2VpZ2h0OiA1MDA7IGxldHRlci1zcGFjaW5nOiAwLjA4ZW07IHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgbWFyZ2luLWJvdHRvbTogNnB4OyB9XG4gICAgICAucHgtbm90ZSB7IHdpZHRoOiAxMDAlOyBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7IGJvcmRlci1yYWRpdXM6IDhweDsgcGFkZGluZzogMTBweCAxMnB4OyBmb250LWZhbWlseTogdmFyKC0tZm9udC1pbnRlcmZhY2UpOyBmb250LXNpemU6IDEycHg7IGxpbmUtaGVpZ2h0OiAxLjY7IGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7IHJlc2l6ZTogbm9uZTsgaGVpZ2h0OiA3MnB4OyBvdXRsaW5lOiBub25lOyB0cmFuc2l0aW9uOiBib3JkZXItY29sb3IgLjE1czsgbWFyZ2luLWJvdHRvbTogMTZweDsgfVxuICAgICAgLnB4LW5vdGU6Zm9jdXMgeyBib3JkZXItY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpOyB9XG4gICAgICAucHgtbm90ZTo6cGxhY2Vob2xkZXIgeyBjb2xvcjogdmFyKC0tdGV4dC1mYWludCk7IGZvbnQtc3R5bGU6IGl0YWxpYzsgfVxuICAgICAgLnB4LXNhdmUgeyB3aWR0aDogMTAwJTsgcGFkZGluZzogMTBweDsgYmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTsgY29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTsgYm9yZGVyOiBub25lOyBib3JkZXItcmFkaXVzOiA4cHg7IGZvbnQtZmFtaWx5OiB2YXIoLS1mb250LWludGVyZmFjZSk7IGZvbnQtc2l6ZTogMTNweDsgZm9udC13ZWlnaHQ6IDUwMDsgY3Vyc29yOiBwb2ludGVyOyB0cmFuc2l0aW9uOiBvcGFjaXR5IC4xNXM7IG1hcmdpbi1ib3R0b206IDhweDsgfVxuICAgICAgLnB4LXNhdmU6aG92ZXIgeyBvcGFjaXR5OiAwLjg4OyB9XG4gICAgICAucHgtc2F2ZTpkaXNhYmxlZCB7IG9wYWNpdHk6IDAuNDsgY3Vyc29yOiBkZWZhdWx0OyB9XG4gICAgICAucHgtc2F2ZS1tc2cgeyBmb250LXNpemU6IDExcHg7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgdGV4dC1hbGlnbjogY2VudGVyOyBtaW4taGVpZ2h0OiAxNHB4OyB9XG4gICAgICAucHgtd2Vlay1uYXYgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDEwcHg7IG1hcmdpbi1ib3R0b206IDIwcHg7IH1cbiAgICAgIC5weC13ZWVrLWxhYmVsIHsgZm9udC1zaXplOiAxM3B4OyBmb250LXdlaWdodDogNTAwOyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyBmbGV4OiAxOyB9XG4gICAgICAucHgtd2Vlay1waWxsIHsgZm9udC1zaXplOiAxMXB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBib3JkZXItcmFkaXVzOiAxNnB4OyBwYWRkaW5nOiAycHggOXB4OyB9XG4gICAgICAucHgtbmF2LWJ0biB7IGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTsgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpOyBib3JkZXItcmFkaXVzOiA2cHg7IHdpZHRoOiAyOHB4OyBoZWlnaHQ6IDI4cHg7IGN1cnNvcjogcG9pbnRlcjsgZm9udC1zaXplOiAxNHB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IGRpc3BsYXk6IGZsZXg7IGFsaWduLWl0ZW1zOiBjZW50ZXI7IGp1c3RpZnktY29udGVudDogY2VudGVyOyB0cmFuc2l0aW9uOiBhbGwgLjE1czsgfVxuICAgICAgLnB4LW5hdi1idG46aG92ZXIgeyBib3JkZXItY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgfVxuICAgICAgLnB4LW5hdi1idG46ZGlzYWJsZWQgeyBvcGFjaXR5OiAwLjM7IGN1cnNvcjogZGVmYXVsdDsgfVxuICAgICAgLnB4LXR3by1jb2wgeyBkaXNwbGF5OiBncmlkOyBncmlkLXRlbXBsYXRlLWNvbHVtbnM6IDFmciAxZnI7IGdhcDogMTZweDsgbWFyZ2luLWJvdHRvbTogMjRweDsgfVxuICAgICAgLnB4LXBhbmVsIHsgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpOyBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7IGJvcmRlci1yYWRpdXM6IDEwcHg7IHBhZGRpbmc6IDE2cHg7IH1cbiAgICAgIC5weC1kb251dC13cmFwIHsgcG9zaXRpb246IHJlbGF0aXZlOyBkaXNwbGF5OiBmbGV4OyBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjsgbWFyZ2luLWJvdHRvbTogMTJweDsgfVxuICAgICAgLnB4LWRvbnV0LWNlbnRlciB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgdG9wOiA1MCU7IGxlZnQ6IDUwJTsgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwtNTAlKTsgdGV4dC1hbGlnbjogY2VudGVyOyB9XG4gICAgICAucHgtZG9udXQtYmlnIHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ub3NwYWNlKTsgZm9udC1zaXplOiAyMHB4OyBmb250LXdlaWdodDogNTAwOyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyBsaW5lLWhlaWdodDogMTsgfVxuICAgICAgLnB4LWRvbnV0LXNtYWxsIHsgZm9udC1zaXplOiAxMHB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IG1hcmdpbi10b3A6IDJweDsgfVxuICAgICAgLnB4LWxlZ2VuZCB7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGdhcDogNHB4OyB9XG4gICAgICAucHgtbGVnZW5kLWl0ZW0geyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDZweDsgZm9udC1zaXplOiAxMXB4OyBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7IH1cbiAgICAgIC5weC1sZWdlbmQtZG90IHsgd2lkdGg6IDZweDsgaGVpZ2h0OiA2cHg7IGJvcmRlci1yYWRpdXM6IDUwJTsgZmxleC1zaHJpbms6IDA7IH1cbiAgICAgIC5weC1sZWdlbmQtbmFtZSB7IGZsZXg6IDE7IH1cbiAgICAgIC5weC1sZWdlbmQtcGN0IHsgZm9udC1mYW1pbHk6IHZhcigtLWZvbnQtbW9ub3NwYWNlKTsgZm9udC13ZWlnaHQ6IDUwMDsgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTsgfVxuICAgICAgLnB4LWhpc3QgeyBkaXNwbGF5OiBmbGV4OyBnYXA6IDRweDsgYWxpZ24taXRlbXM6IGZsZXgtZW5kOyBoZWlnaHQ6IDcycHg7IH1cbiAgICAgIC5weC1oaXN0LWNvbCB7IGZsZXg6IDE7IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47IGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7IGN1cnNvcjogcG9pbnRlcjsgfVxuICAgICAgLnB4LWhpc3Qtc3RhY2sgeyB3aWR0aDogMTAwJTsgYm9yZGVyLXJhZGl1czogMnB4IDJweCAwIDA7IG92ZXJmbG93OiBoaWRkZW47IGRpc3BsYXk6IGZsZXg7IGZsZXgtZGlyZWN0aW9uOiBjb2x1bW4tcmV2ZXJzZTsgdHJhbnNpdGlvbjogb3BhY2l0eSAuMTVzOyBtaW4taGVpZ2h0OiAycHg7IH1cbiAgICAgIC5weC1oaXN0LWNvbDpob3ZlciAucHgtaGlzdC1zdGFjayB7IG9wYWNpdHk6IDAuNzU7IH1cbiAgICAgIC5weC1oaXN0LXNlZyB7IHdpZHRoOiAxMDAlOyB9XG4gICAgICAucHgtaGlzdC1sYmwgeyBmb250LXNpemU6IDhweDsgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpOyB0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi10b3A6IDRweDsgb3BhY2l0eTogMC41OyB3aGl0ZS1zcGFjZTogbm93cmFwOyBvdmVyZmxvdzogaGlkZGVuOyB9XG4gICAgICAucHgtaGlzdC1jb2wuY3VycmVudCAucHgtaGlzdC1sYmwgeyBvcGFjaXR5OiAxOyBmb250LXdlaWdodDogNTAwOyBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpOyB9XG4gICAgICAucHgtaGlzdC1lbXB0eSB7IGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTsgYm9yZGVyLXJhZGl1czogMnB4OyB9XG4gICAgICAucHgtd2Vlay1yZWFkb25seSAucHgtaHZhbCB7IGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTsgfVxuICAgICAgLnB4LW5vdGUtbGluayB7IGZvbnQtc2l6ZTogMTFweDsgY29sb3I6IHZhcigtLXRleHQtYWNjZW50KTsgY3Vyc29yOiBwb2ludGVyOyB0ZXh0LWFsaWduOiBjZW50ZXI7IGRpc3BsYXk6IGJsb2NrOyBtYXJnaW4tdG9wOiA4cHg7IHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lOyB0ZXh0LXVuZGVybGluZS1vZmZzZXQ6IDJweDsgfVxuICAgICAgLnB4LW5vdGUtbGluazpob3ZlciB7IGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7IH1cbiAgICBgO1xuICB9XG5cbiAgcmVuZGVySGVhZGVyKGFwcDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBoID0gYXBwLmNyZWF0ZURpdigpO1xuICAgIGguY3JlYXRlRWwoJ2gyJywgeyBjbHM6ICdweC1oMScsIHRleHQ6ICdXaGVyZSBteSB0aW1lIGdvZXMnIH0pO1xuICAgIGguY3JlYXRlRGl2KHsgY2xzOiAncHgtc3ViJywgdGV4dDogJ1dlZWtseSBmb2N1cyB0cmFja2VyIFx1MDBCNyBQcm9kdWN0IEV4cGVyaWVuY2UnIH0pO1xuICB9XG5cbiAgcmVuZGVyVGFicyhhcHA6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgdG9kYXlIb3VycyA9IGdldFRvZGF5SG91cnModGhpcy5kYXRhKTtcbiAgICBjb25zdCB0b2RheVRvdGFsID0gdG9kYXlIb3Vycy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICBjb25zdCB3ZWVrSG91cnMgPSBnZXRXZWVrSG91cnModGhpcy5kYXRhLCAwKTtcbiAgICBjb25zdCB3ZWVrVG90YWwgPSB3ZWVrSG91cnMucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCk7XG5cbiAgICBjb25zdCB0YWJzID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXRhYnMnIH0pO1xuXG4gICAgY29uc3QgdG9kYXlUYWIgPSB0YWJzLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogYHB4LXRhYiR7dGhpcy5hY3RpdmVUYWIgPT09ICd0b2RheScgPyAnIGFjdGl2ZScgOiAnJ31gLCB0ZXh0OiAnVG9kYXknIH0pO1xuICAgIHRvZGF5VGFiLmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1iYWRnZScsIHRleHQ6IGZtdEgodG9kYXlUb3RhbCkgfSk7XG4gICAgdG9kYXlUYWIub25jbGljayA9ICgpID0+IHsgdGhpcy5hY3RpdmVUYWIgPSAndG9kYXknOyB0aGlzLnJlbmRlcigpOyB9O1xuXG4gICAgY29uc3Qgd2Vla1RhYiA9IHRhYnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiBgcHgtdGFiJHt0aGlzLmFjdGl2ZVRhYiA9PT0gJ3dlZWsnID8gJyBhY3RpdmUnIDogJyd9YCwgdGV4dDogJ1RoaXMgd2VlaycgfSk7XG4gICAgd2Vla1RhYi5jcmVhdGVTcGFuKHsgY2xzOiAncHgtYmFkZ2UnLCB0ZXh0OiBmbXRIKHdlZWtUb3RhbCkgfSk7XG4gICAgd2Vla1RhYi5vbmNsaWNrID0gKCkgPT4geyB0aGlzLmFjdGl2ZVRhYiA9ICd3ZWVrJzsgdGhpcy5yZW5kZXIoKTsgfTtcbiAgfVxuXG4gIHJlbmRlclRvZGF5KGFwcDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBob3VycyA9IGdldFRvZGF5SG91cnModGhpcy5kYXRhKTtcbiAgICBjb25zdCB0b3RhbCA9IGhvdXJzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuICAgIGNvbnN0IHdlZWtIb3VycyA9IGdldFdlZWtIb3Vycyh0aGlzLmRhdGEsIDApO1xuICAgIGNvbnN0IHdlZWtUb3RhbCA9IHdlZWtIb3Vycy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcblxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LWRhdGUnLCB0ZXh0OiBub3cudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1HQicsIHsgd2Vla2RheTogJ2xvbmcnLCBkYXk6ICdudW1lcmljJywgbW9udGg6ICdsb25nJyB9KSB9KTtcbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtZGF0ZS1zdWInLCB0ZXh0OiAnTG9nIGhvdXJzIGZvciB0b2RheSBcdTIwMTQgdGhleSByb2xsIHVwIGludG8geW91ciB3ZWVrbHkgdG90YWwnIH0pO1xuXG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXNlY3Rpb24nLCB0ZXh0OiAnSG91cnMgYnkgdGhlbWUnIH0pO1xuICAgIGNvbnN0IGxpc3QgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtdGhlbWVzJyB9KTtcbiAgICBUSEVNRVMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgICAgY29uc3QgcGN0ID0gdG90YWwgPiAwID8gTWF0aC5yb3VuZChob3Vyc1tpXSAvIHRvdGFsICogMTAwKSA6IDA7XG4gICAgICBjb25zdCByb3cgPSBsaXN0LmNyZWF0ZURpdih7IGNsczogJ3B4LXRoZW1lLXJvdycgfSk7XG4gICAgICByb3cuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG90JywgYXR0cjogeyBzdHlsZTogYGJhY2tncm91bmQ6JHt0LmNvbH1gIH0gfSk7XG4gICAgICByb3cuY3JlYXRlU3Bhbih7IGNsczogJ3B4LW5hbWUnLCB0ZXh0OiB0Lm5hbWUgfSk7XG4gICAgICBjb25zdCBoaCA9IHJvdy5jcmVhdGVEaXYoeyBjbHM6ICdweC1ob3VycycgfSk7XG4gICAgICBjb25zdCBtaW51c0J0biA9IGhoLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3B4LWJ0bicsIHRleHQ6ICdcdTIyMTInIH0pO1xuICAgICAgY29uc3QgdmFsRWwgPSBoaC5jcmVhdGVTcGFuKHsgY2xzOiAncHgtaHZhbCcsIHRleHQ6IGZtdEgoaG91cnNbaV0pIH0pO1xuICAgICAgY29uc3QgcGx1c0J0biA9IGhoLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3B4LWJ0bicsIHRleHQ6ICcrJyB9KTtcbiAgICAgIGNvbnN0IGJ3ID0gcm93LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhci13cmFwJyB9KTtcbiAgICAgIGNvbnN0IGJhciA9IGJ3LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhcicsIGF0dHI6IHsgc3R5bGU6IGB3aWR0aDoke3BjdH0lO2JhY2tncm91bmQ6JHt0LmNvbH1gIH0gfSk7XG5cbiAgICAgIG1pbnVzQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGVuc3VyZVRvZGF5KHRoaXMuZGF0YSk7XG4gICAgICAgIGNvbnN0IHdrZXkgPSBnZXRXZWVrS2V5KDApOyBjb25zdCBka2V5ID0gZ2V0VG9kYXlLZXkoKTtcbiAgICAgICAgdGhpcy5kYXRhW3drZXldLmRheXNbZGtleV0uaG91cnNbaV0gPSBNYXRoLm1heCgwLCArKHRoaXMuZGF0YVt3a2V5XS5kYXlzW2RrZXldLmhvdXJzW2ldIC0gMC41KS50b0ZpeGVkKDEpKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgIH07XG4gICAgICBwbHVzQnRuLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGF0YSA9IGVuc3VyZVRvZGF5KHRoaXMuZGF0YSk7XG4gICAgICAgIGNvbnN0IHdrZXkgPSBnZXRXZWVrS2V5KDApOyBjb25zdCBka2V5ID0gZ2V0VG9kYXlLZXkoKTtcbiAgICAgICAgdGhpcy5kYXRhW3drZXldLmRheXNbZGtleV0uaG91cnNbaV0gPSArKHRoaXMuZGF0YVt3a2V5XS5kYXlzW2RrZXldLmhvdXJzW2ldICsgMC41KS50b0ZpeGVkKDEpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRvdGFsUm93ID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXRvdGFsJyB9KTtcbiAgICB0b3RhbFJvdy5jcmVhdGVTcGFuKHsgdGV4dDogXCJUb2RheSdzIHRvdGFsXCIgfSk7XG4gICAgdG90YWxSb3cuY3JlYXRlU3Bhbih7IGNsczogJ3B4LXRvdGFsLXZhbCcsIHRleHQ6IGZtdEgodG90YWwpIH0pO1xuXG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LWRpdmlkZXInIH0pO1xuICAgIGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1zZWN0aW9uJywgdGV4dDogJ1dlZWsgc28gZmFyJyB9KTtcblxuICAgIGNvbnN0IHJvbGx1cCA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1yb2xsdXAnIH0pO1xuICAgIGxldCBhbnkgPSBmYWxzZTtcbiAgICBUSEVNRVMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgICAgaWYgKHdlZWtIb3Vyc1tpXSA9PT0gMCkgcmV0dXJuO1xuICAgICAgYW55ID0gdHJ1ZTtcbiAgICAgIGNvbnN0IGNoaXAgPSByb2xsdXAuY3JlYXRlRGl2KHsgY2xzOiAncHgtY2hpcCcgfSk7XG4gICAgICBjaGlwLmNyZWF0ZURpdih7IGNsczogJ3B4LWNoaXAtZG90JywgYXR0cjogeyBzdHlsZTogYGJhY2tncm91bmQ6JHt0LmNvbH1gIH0gfSk7XG4gICAgICBjaGlwLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0Lm5hbWUgfSk7XG4gICAgICBjaGlwLmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1jaGlwLXZhbCcsIHRleHQ6IGZtdEgod2Vla0hvdXJzW2ldKSB9KTtcbiAgICB9KTtcbiAgICBpZiAoIWFueSkgcm9sbHVwLmNyZWF0ZVNwYW4oeyBhdHRyOiB7IHN0eWxlOiAnZm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tdGV4dC1tdXRlZCknIH0sIHRleHQ6ICdObyBob3VycyBsb2dnZWQgdGhpcyB3ZWVrIHlldCcgfSk7XG5cbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtbm90ZS1sYWJlbCcsIHRleHQ6IFwiVG9kYXkncyBub3RlXCIgfSk7XG4gICAgY29uc3Qgbm90ZUVsID0gYXBwLmNyZWF0ZUVsKCd0ZXh0YXJlYScsIHsgY2xzOiAncHgtbm90ZScsIGF0dHI6IHsgcGxhY2Vob2xkZXI6IFwiV2hhdCBkaWQgSSBhY3R1YWxseSBzcGVuZCBteSBlbmVyZ3kgb24gdG9kYXkgXHUyMDE0IGFuZCB3aGF0J3Mgc3RpcnJpbmc/XCIgfSB9KTtcbiAgICBjb25zdCB3a2V5MCA9IGdldFdlZWtLZXkoMCk7IGNvbnN0IGRrZXkgPSBnZXRUb2RheUtleSgpO1xuICAgIG5vdGVFbC52YWx1ZSA9IHRoaXMuZGF0YVt3a2V5MF0/LmRheXM/Lltka2V5XT8ubm90ZSB8fCAnJztcblxuICAgIGNvbnN0IHNhdmVCdG4gPSBhcHAuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncHgtc2F2ZScsIHRleHQ6ICdTYXZlIHRvZGF5JyB9KTtcbiAgICBjb25zdCBzYXZlTXNnID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXNhdmUtbXNnJyB9KTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuZGF0YSA9IGVuc3VyZVRvZGF5KHRoaXMuZGF0YSk7XG4gICAgICBjb25zdCB3ayA9IGdldFdlZWtLZXkoMCk7IGNvbnN0IGRrID0gZ2V0VG9kYXlLZXkoKTtcbiAgICAgIHRoaXMuZGF0YVt3a10uZGF5c1tka10ubm90ZSA9IG5vdGVFbC52YWx1ZTtcbiAgICAgIHNhdmVCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICBzYXZlTXNnLnRleHRDb250ZW50ID0gJ1NhdmVkIFx1MjcxMyc7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgc2F2ZU1zZy50ZXh0Q29udGVudCA9ICcnOyB9LCAyMDAwKTtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIGFwcC5jcmVhdGVFbCgnYScsIHsgY2xzOiAncHgtbm90ZS1saW5rJywgdGV4dDogJ1x1MjE5MiBPcGVuIHRoaXMgd2Vla1xcJ3Mgbm90ZSBpbiB2YXVsdCcsIGF0dHI6IHsgaHJlZjogJyMnIH0gfSlcbiAgICAgIC5vbmNsaWNrID0gYXN5bmMgKGUpID0+IHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBhd2FpdCB0aGlzLnBsdWdpbi5vcGVuV2Vla05vdGUodGhpcy53ZWVrT2Zmc2V0KTsgfTtcbiAgfVxuXG4gIHJlbmRlcldlZWsoYXBwOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IG5hdiA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC13ZWVrLW5hdicgfSk7XG4gICAgY29uc3QgcHJldkJ0biA9IG5hdi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdweC1uYXYtYnRuJywgdGV4dDogJ1x1MjAzOScgfSk7XG4gICAgbmF2LmNyZWF0ZVNwYW4oeyBjbHM6ICdweC13ZWVrLWxhYmVsJywgdGV4dDogZ2V0V2Vla0xhYmVsKHRoaXMud2Vla09mZnNldCkgfSk7XG4gICAgY29uc3QgcGlsbCA9IHRoaXMud2Vla09mZnNldCA9PT0gMCA/ICd0aGlzIHdlZWsnIDogdGhpcy53ZWVrT2Zmc2V0ID09PSAtMSA/ICdsYXN0IHdlZWsnIDogYCR7TWF0aC5hYnModGhpcy53ZWVrT2Zmc2V0KX0gd2Vla3MgYWdvYDtcbiAgICBuYXYuY3JlYXRlU3Bhbih7IGNsczogJ3B4LXdlZWstcGlsbCcsIHRleHQ6IHBpbGwgfSk7XG4gICAgY29uc3QgbmV4dEJ0biA9IG5hdi5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdweC1uYXYtYnRuJywgdGV4dDogJ1x1MjAzQScgfSk7XG4gICAgaWYgKHRoaXMud2Vla09mZnNldCA+PSAwKSBuZXh0QnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICBwcmV2QnRuLm9uY2xpY2sgPSAoKSA9PiB7IHRoaXMud2Vla09mZnNldC0tOyB0aGlzLnJlbmRlcigpOyB9O1xuICAgIG5leHRCdG4ub25jbGljayA9ICgpID0+IHsgaWYgKHRoaXMud2Vla09mZnNldCA8IDApIHsgdGhpcy53ZWVrT2Zmc2V0Kys7IHRoaXMucmVuZGVyKCk7IH0gfTtcblxuICAgIGNvbnN0IGhvdXJzID0gZ2V0V2Vla0hvdXJzKHRoaXMuZGF0YSwgdGhpcy53ZWVrT2Zmc2V0KTtcbiAgICBjb25zdCB0b3RhbCA9IGhvdXJzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIsIDApO1xuXG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXNlY3Rpb24nLCB0ZXh0OiAnSG91cnMgYnkgdGhlbWUnIH0pO1xuICAgIGNvbnN0IGxpc3QgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtdGhlbWVzIHB4LXdlZWstcmVhZG9ubHknIH0pO1xuICAgIFRIRU1FUy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgICBjb25zdCBwY3QgPSB0b3RhbCA+IDAgPyBNYXRoLnJvdW5kKGhvdXJzW2ldIC8gdG90YWwgKiAxMDApIDogMDtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3QuY3JlYXRlRGl2KHsgY2xzOiAncHgtdGhlbWUtcm93JyB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoeyBjbHM6ICdweC1kb3QnLCBhdHRyOiB7IHN0eWxlOiBgYmFja2dyb3VuZDoke3QuY29sfWAgfSB9KTtcbiAgICAgIHJvdy5jcmVhdGVTcGFuKHsgY2xzOiAncHgtbmFtZScsIHRleHQ6IHQubmFtZSB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoeyBjbHM6ICdweC1ob3VycycgfSkuY3JlYXRlU3Bhbih7IGNsczogJ3B4LWh2YWwnLCB0ZXh0OiBmbXRIKGhvdXJzW2ldKSB9KTtcbiAgICAgIGNvbnN0IGJ3ID0gcm93LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhci13cmFwJyB9KTtcbiAgICAgIGJ3LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhcicsIGF0dHI6IHsgc3R5bGU6IGB3aWR0aDoke3BjdH0lO2JhY2tncm91bmQ6JHt0LmNvbH1gIH0gfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b3RhbFJvdyA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC10b3RhbCcgfSk7XG4gICAgdG90YWxSb3cuY3JlYXRlU3Bhbih7IHRleHQ6ICdUb3RhbCBsb2dnZWQgdGhpcyB3ZWVrJyB9KTtcbiAgICB0b3RhbFJvdy5jcmVhdGVTcGFuKHsgY2xzOiAncHgtdG90YWwtdmFsJywgdGV4dDogZm10SCh0b3RhbCkgfSk7XG5cbiAgICBjb25zdCB0d28gPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtdHdvLWNvbCcgfSk7XG4gICAgdGhpcy5yZW5kZXJEb251dCh0d28sIGhvdXJzLCB0b3RhbCk7XG4gICAgdGhpcy5yZW5kZXJIaXN0b3J5KHR3byk7XG5cbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtbm90ZS1sYWJlbCcsIHRleHQ6ICdXZWVrIG5vdGUnIH0pO1xuICAgIGNvbnN0IG5vdGVFbCA9IGFwcC5jcmVhdGVFbCgndGV4dGFyZWEnLCB7IGNsczogJ3B4LW5vdGUnLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIldoYXQgbW92ZWQgdGhpcyB3ZWVrPyBXaGF0IGFtIEkgZGlzdGlsbGluZz8gV2hhdCBkbyBJIHdhbnQgSW1pciB0byBrbm93P1wiIH0gfSk7XG4gICAgY29uc3Qgd2tleSA9IGdldFdlZWtLZXkodGhpcy53ZWVrT2Zmc2V0KTtcbiAgICBub3RlRWwudmFsdWUgPSB0aGlzLmRhdGFbd2tleV0/Lm5vdGUgfHwgJyc7XG5cbiAgICBjb25zdCBzYXZlQnRuID0gYXBwLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3B4LXNhdmUnLCB0ZXh0OiAnU2F2ZSB0aGlzIHdlZWsnIH0pO1xuICAgIGNvbnN0IHNhdmVNc2cgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2F2ZS1tc2cnIH0pO1xuXG4gICAgc2F2ZUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmRhdGFbd2tleV0pIHRoaXMuZGF0YVt3a2V5XSA9IHsgZGF5czoge30sIG5vdGU6ICcnIH07XG4gICAgICB0aGlzLmRhdGFbd2tleV0ubm90ZSA9IG5vdGVFbC52YWx1ZTtcbiAgICAgIHNhdmVCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICBzYXZlTXNnLnRleHRDb250ZW50ID0gJ1NhdmVkIFx1MjcxMyc7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgc2F2ZU1zZy50ZXh0Q29udGVudCA9ICcnOyB9LCAyMDAwKTtcbiAgICB9O1xuXG4gICAgYXBwLmNyZWF0ZUVsKCdhJywgeyBjbHM6ICdweC1ub3RlLWxpbmsnLCB0ZXh0OiAnXHUyMTkyIE9wZW4gdGhpcyB3ZWVrXFwncyBub3RlIGluIHZhdWx0JywgYXR0cjogeyBocmVmOiAnIycgfSB9KVxuICAgICAgLm9uY2xpY2sgPSBhc3luYyAoZSkgPT4geyBlLnByZXZlbnREZWZhdWx0KCk7IGF3YWl0IHRoaXMucGx1Z2luLm9wZW5XZWVrTm90ZSh0aGlzLndlZWtPZmZzZXQpOyB9O1xuICB9XG5cbiAgcmVuZGVyRG9udXQoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgaG91cnM6IG51bWJlcltdLCB0b3RhbDogbnVtYmVyKSB7XG4gICAgY29uc3QgcGFuZWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtcGFuZWwnIH0pO1xuICAgIHBhbmVsLmNyZWF0ZURpdih7IGNsczogJ3B4LXNlY3Rpb24nLCB0ZXh0OiAnRGlzdHJpYnV0aW9uJyB9KTtcbiAgICBjb25zdCB3cmFwID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtd3JhcCcgfSk7XG4gICAgY29uc3Qgc3ZnID0gd3JhcC5jcmVhdGVTdmcoJ3N2ZycsIHsgYXR0cjogeyB3aWR0aDogJzkwJywgaGVpZ2h0OiAnOTAnLCB2aWV3Qm94OiAnMCAwIDkwIDkwJyB9IH0pO1xuICAgIGNvbnN0IGNlbnRlciA9IHdyYXAuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtY2VudGVyJyB9KTtcblxuICAgIGlmICh0b3RhbCA9PT0gMCkge1xuICAgICAgc3ZnLmNyZWF0ZVN2ZygnY2lyY2xlJywgeyBhdHRyOiB7IGN4OiAnNDUnLCBjeTogJzQ1JywgcjogJzM0JywgZmlsbDogJ25vbmUnLCBzdHJva2U6ICd2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknLCAnc3Ryb2tlLXdpZHRoJzogJzExJyB9IH0pO1xuICAgICAgY2VudGVyLmNyZWF0ZURpdih7IGNsczogJ3B4LWRvbnV0LWJpZycsIHRleHQ6ICdcdTIwMTQnIH0pO1xuICAgICAgY2VudGVyLmNyZWF0ZURpdih7IGNsczogJ3B4LWRvbnV0LXNtYWxsJywgdGV4dDogJ2xvZyBob3VycycgfSk7XG4gICAgICBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6ICdweC1sZWdlbmQnIH0pLmNyZWF0ZURpdih7IGF0dHI6IHsgc3R5bGU6ICdmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKScgfSwgdGV4dDogJ05vIGRhdGEgeWV0JyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjeCA9IDQ1LCBjeSA9IDQ1LCByID0gMzQsIHN3ID0gMTE7XG4gICAgY29uc3QgY2lyYyA9IDIgKiBNYXRoLlBJICogcjtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBjb25zdCBtYXhJZHggPSBob3Vycy5pbmRleE9mKE1hdGgubWF4KC4uLmhvdXJzKSk7XG5cbiAgICBob3Vycy5mb3JFYWNoKChoLCBpKSA9PiB7XG4gICAgICBpZiAoaCA9PT0gMCkgcmV0dXJuO1xuICAgICAgY29uc3QgcGN0ID0gaCAvIHRvdGFsO1xuICAgICAgY29uc3QgZGFzaCA9IHBjdCAqIGNpcmM7XG4gICAgICBjb25zdCBnYXAgPSBjaXJjIC0gZGFzaDtcbiAgICAgIHN2Zy5jcmVhdGVTdmcoJ2NpcmNsZScsIHsgYXR0cjoge1xuICAgICAgICBjeDogU3RyaW5nKGN4KSwgY3k6IFN0cmluZyhjeSksIHI6IFN0cmluZyhyKSwgZmlsbDogJ25vbmUnLFxuICAgICAgICBzdHJva2U6IFRIRU1FU1tpXS5jb2wsICdzdHJva2Utd2lkdGgnOiBTdHJpbmcoc3cpLFxuICAgICAgICAnc3Ryb2tlLWRhc2hhcnJheSc6IGAke2Rhc2gudG9GaXhlZCgyKX0gJHtnYXAudG9GaXhlZCgyKX1gLFxuICAgICAgICAnc3Ryb2tlLWRhc2hvZmZzZXQnOiBgJHsoLShvZmZzZXQgKiBjaXJjKSArIGNpcmMgLyA0KS50b0ZpeGVkKDIpfWBcbiAgICAgIH19KTtcbiAgICAgIG9mZnNldCArPSBwY3Q7XG4gICAgfSk7XG5cbiAgICBjZW50ZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtYmlnJywgdGV4dDogYCR7TWF0aC5yb3VuZChob3Vyc1ttYXhJZHhdIC8gdG90YWwgKiAxMDApfSVgIH0pO1xuICAgIGNlbnRlci5jcmVhdGVEaXYoeyBjbHM6ICdweC1kb251dC1zbWFsbCcsIHRleHQ6IFRIRU1FU1ttYXhJZHhdLm5hbWUuc3BsaXQoJyAnKVswXS50b0xvd2VyQ2FzZSgpIH0pO1xuXG4gICAgY29uc3QgbGVnZW5kID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiAncHgtbGVnZW5kJyB9KTtcbiAgICBUSEVNRVMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgICAgY29uc3QgcGN0ID0gdG90YWwgPiAwID8gTWF0aC5yb3VuZChob3Vyc1tpXSAvIHRvdGFsICogMTAwKSA6IDA7XG4gICAgICBpZiAocGN0ID09PSAwKSByZXR1cm47XG4gICAgICBjb25zdCBpdGVtID0gbGVnZW5kLmNyZWF0ZURpdih7IGNsczogJ3B4LWxlZ2VuZC1pdGVtJyB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlRGl2KHsgY2xzOiAncHgtbGVnZW5kLWRvdCcsIGF0dHI6IHsgc3R5bGU6IGBiYWNrZ3JvdW5kOiR7dC5jb2x9YCB9IH0pO1xuICAgICAgaXRlbS5jcmVhdGVTcGFuKHsgY2xzOiAncHgtbGVnZW5kLW5hbWUnLCB0ZXh0OiB0Lm5hbWUgfSk7XG4gICAgICBpdGVtLmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1sZWdlbmQtcGN0JywgdGV4dDogYCR7cGN0fSVgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVySGlzdG9yeShjb250YWluZXI6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgcGFuZWwgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtcGFuZWwnIH0pO1xuICAgIHBhbmVsLmNyZWF0ZURpdih7IGNsczogJ3B4LXNlY3Rpb24nLCB0ZXh0OiAnUGFzdCA4IHdlZWtzJyB9KTtcbiAgICBjb25zdCB3cmFwID0gcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiAncHgtaGlzdCcgfSk7XG5cbiAgICBjb25zdCB3ZWVrcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAtNzsgaSA8PSAwOyBpKyspIHdlZWtzLnB1c2goeyBrZXk6IGdldFdlZWtLZXkoaSksIG9mZnNldDogaSB9KTtcbiAgICBjb25zdCB0b3RhbHMgPSB3ZWVrcy5tYXAodyA9PiBnZXRXZWVrSG91cnModGhpcy5kYXRhLCB3Lm9mZnNldCkucmVkdWNlKChhLCBiKSA9PiBhICsgYiwgMCkpO1xuICAgIGNvbnN0IG1heFRvdGFsID0gTWF0aC5tYXgoLi4udG90YWxzLCAxKTtcblxuICAgIHdlZWtzLmZvckVhY2goKHcsIHdpKSA9PiB7XG4gICAgICBjb25zdCBob3VycyA9IGdldFdlZWtIb3Vycyh0aGlzLmRhdGEsIHcub2Zmc2V0KTtcbiAgICAgIGNvbnN0IHRvdGFsID0gdG90YWxzW3dpXTtcbiAgICAgIGNvbnN0IGhlaWdodFB4ID0gdG90YWwgPiAwID8gTWF0aC5tYXgoTWF0aC5yb3VuZCh0b3RhbCAvIG1heFRvdGFsICogNjQpLCA0KSA6IDM7XG4gICAgICBjb25zdCBpc0N1cnJlbnQgPSB3Lm9mZnNldCA9PT0gdGhpcy53ZWVrT2Zmc2V0O1xuXG4gICAgICBjb25zdCBjb2wgPSB3cmFwLmNyZWF0ZURpdih7IGNsczogYHB4LWhpc3QtY29sJHtpc0N1cnJlbnQgPyAnIGN1cnJlbnQnIDogJyd9YCB9KTtcbiAgICAgIGNvbnN0IHN0YWNrID0gY29sLmNyZWF0ZURpdih7IGNsczogYHB4LWhpc3Qtc3RhY2ske3RvdGFsID09PSAwID8gJyBweC1oaXN0LWVtcHR5JyA6ICcnfWAgfSk7XG4gICAgICBzdGFjay5zdHlsZS5oZWlnaHQgPSBgJHtoZWlnaHRQeH1weGA7XG5cbiAgICAgIGlmICh0b3RhbCA+IDApIHtcbiAgICAgICAgVEhFTUVTLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICAgICAgICBpZiAoaG91cnNbaV0gPT09IDApIHJldHVybjtcbiAgICAgICAgICBjb25zdCBzZWcgPSBzdGFjay5jcmVhdGVEaXYoeyBjbHM6ICdweC1oaXN0LXNlZycgfSk7XG4gICAgICAgICAgc2VnLnN0eWxlLmJhY2tncm91bmQgPSB0LmNvbDtcbiAgICAgICAgICBzZWcuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5tYXgoTWF0aC5yb3VuZChob3Vyc1tpXSAvIHRvdGFsICogaGVpZ2h0UHgpLCAxKX1weGA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkID0gbmV3IERhdGUody5rZXkpO1xuICAgICAgY29sLmNyZWF0ZURpdih7IGNsczogJ3B4LWhpc3QtbGJsJywgdGV4dDogZC50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUdCJywgeyBkYXk6ICdudW1lcmljJywgbW9udGg6ICdzaG9ydCcgfSkgfSk7XG4gICAgICBjb2wub25jbGljayA9ICgpID0+IHsgdGhpcy53ZWVrT2Zmc2V0ID0gdy5vZmZzZXQ7IHRoaXMuYWN0aXZlVGFiID0gJ3dlZWsnOyB0aGlzLnJlbmRlcigpOyB9O1xuICAgIH0pO1xuICB9XG59XG5cbi8vIFx1MjUwMFx1MjUwMCBQbHVnaW4gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQWFRyYWNrZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFLCAobGVhZikgPT4gbmV3IFBYVHJhY2tlclZpZXcobGVhZiwgdGhpcykpO1xuXG4gICAgdGhpcy5hZGRSaWJib25JY29uKCd0aW1lcicsICdQWCBUcmFja2VyJywgKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSk7XG5cbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6ICdvcGVuLXB4LXRyYWNrZXInLFxuICAgICAgbmFtZTogJ09wZW4gUFggVHJhY2tlcicsXG4gICAgICBjYWxsYmFjazogKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSxcbiAgICB9KTtcblxuICAgIC8vIEVuc3VyZSBkYXRhIGZvbGRlciBleGlzdHNcbiAgICBhd2FpdCB0aGlzLmVuc3VyZUZvbGRlcignUFggVHJhY2tlcicpO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKE5PVEVTX0ZPTERFUik7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRSk7XG4gIH1cblxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEUpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAobGVhZikge1xuICAgICAgYXdhaXQgbGVhZi5zZXRWaWV3U3RhdGUoeyB0eXBlOiBWSUVXX1RZUEUsIGFjdGl2ZTogdHJ1ZSB9KTtcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5yZXZlYWxMZWFmKGxlYWYpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGVuc3VyZUZvbGRlcihwYXRoOiBzdHJpbmcpIHtcbiAgICBpZiAoIXRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChwYXRoKSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKHBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGxvYWREYXRhXygpOiBQcm9taXNlPFRyYWNrZXJEYXRhPiB7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChEQVRBX0ZJTEUpO1xuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IHJhdyA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQoZmlsZSk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShyYXcpOyB9IGNhdGNoIHsgcmV0dXJuIHt9OyB9XG4gICAgfVxuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVEYXRhXyhkYXRhOiBUcmFja2VyRGF0YSkge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoREFUQV9GSUxFKTtcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMik7XG4gICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGZpbGUsIGpzb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUoREFUQV9GSUxFLCBqc29uKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB3cml0ZVdlZWtOb3RlKGRhdGE6IFRyYWNrZXJEYXRhLCB3ZWVrT2Zmc2V0OiBudW1iZXIpIHtcbiAgICBjb25zdCB3a2V5ID0gZ2V0V2Vla0tleSh3ZWVrT2Zmc2V0KTtcbiAgICBjb25zdCBlbnRyeSA9IGRhdGFbd2tleV07XG4gICAgaWYgKCFlbnRyeSkgcmV0dXJuO1xuXG4gICAgY29uc3QgaG91cnMgPSBnZXRXZWVrSG91cnMoZGF0YSwgd2Vla09mZnNldCk7XG4gICAgY29uc3QgdG90YWwgPSBob3Vycy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiLCAwKTtcbiAgICBjb25zdCBsYWJlbCA9IGdldFdlZWtMYWJlbCh3ZWVrT2Zmc2V0KTtcblxuICAgIGxldCBjb250ZW50ID0gYCMgV2VlayBvZiAke2xhYmVsfVxcblxcbmA7XG4gICAgY29udGVudCArPSBgIyMgSG91cnNcXG5cXG5gO1xuICAgIFRIRU1FUy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgICBpZiAoaG91cnNbaV0gPiAwKSBjb250ZW50ICs9IGAtICoqJHt0Lm5hbWV9Kio6ICR7Zm10SChob3Vyc1tpXSl9XFxuYDtcbiAgICB9KTtcbiAgICBjb250ZW50ICs9IGBcXG4qKlRvdGFsKio6ICR7Zm10SCh0b3RhbCl9XFxuXFxuYDtcblxuICAgIGlmIChlbnRyeS5ub3RlKSB7XG4gICAgICBjb250ZW50ICs9IGAjIyBXZWVrIHJlZmxlY3Rpb25cXG5cXG4ke2VudHJ5Lm5vdGV9XFxuXFxuYDtcbiAgICB9XG5cbiAgICAvLyBEYWlseSBub3Rlc1xuICAgIGNvbnN0IGRheXMgPSBlbnRyeS5kYXlzIHx8IHt9O1xuICAgIGNvbnN0IGRheUtleXMgPSBPYmplY3Qua2V5cyhkYXlzKS5zb3J0KCk7XG4gICAgaWYgKGRheUtleXMubGVuZ3RoID4gMCkge1xuICAgICAgY29udGVudCArPSBgIyMgRGFpbHkgbm90ZXNcXG5cXG5gO1xuICAgICAgZGF5S2V5cy5mb3JFYWNoKGRrZXkgPT4ge1xuICAgICAgICBjb25zdCBkYXkgPSBkYXlzW2RrZXldO1xuICAgICAgICBpZiAoZGF5Lm5vdGUpIHtcbiAgICAgICAgICBjb25zdCBkID0gbmV3IERhdGUoZGtleSk7XG4gICAgICAgICAgY29uc3QgZGF5TGFiZWwgPSBkLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tR0InLCB7IHdlZWtkYXk6ICdsb25nJywgZGF5OiAnbnVtZXJpYycsIG1vbnRoOiAnc2hvcnQnIH0pO1xuICAgICAgICAgIGNvbnRlbnQgKz0gYCMjIyAke2RheUxhYmVsfVxcblxcbiR7ZGF5Lm5vdGV9XFxuXFxuYDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3Qgbm90ZVBhdGggPSBgJHtOT1RFU19GT0xERVJ9LyR7d2tleX0ubWRgO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vdGVQYXRoKTtcbiAgICBpZiAoZXhpc3RpbmcgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGV4aXN0aW5nLCBjb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vdGVQYXRoLCBjb250ZW50KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBvcGVuV2Vla05vdGUod2Vla09mZnNldDogbnVtYmVyKSB7XG4gICAgY29uc3Qgd2tleSA9IGdldFdlZWtLZXkod2Vla09mZnNldCk7XG4gICAgY29uc3Qgbm90ZVBhdGggPSBgJHtOT1RFU19GT0xERVJ9LyR7d2tleX0ubWRgO1xuICAgIGxldCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vdGVQYXRoKTtcbiAgICBpZiAoIWZpbGUpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmxvYWREYXRhXygpO1xuICAgICAgYXdhaXQgdGhpcy53cml0ZVdlZWtOb3RlKGRhdGEsIHdlZWtPZmZzZXQpO1xuICAgICAgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChub3RlUGF0aCk7XG4gICAgfVxuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKTtcbiAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSk7XG4gICAgfVxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQUFvRTtBQUVwRSxJQUFNLFlBQVk7QUFDbEIsSUFBTSxZQUFZO0FBQ2xCLElBQU0sZUFBZTtBQUVyQixJQUFNLFNBQVM7QUFBQSxFQUNiLEVBQUUsSUFBSSxNQUFNLE1BQU0sZUFBdUIsS0FBSyxVQUFVO0FBQUEsRUFDeEQsRUFBRSxJQUFJLE1BQU0sTUFBTSx1QkFBd0IsS0FBSyxVQUFVO0FBQUEsRUFDekQsRUFBRSxJQUFJLE1BQU0sTUFBTSxtQkFBd0IsS0FBSyxVQUFVO0FBQUEsRUFDekQsRUFBRSxJQUFJLE1BQU0sTUFBTSxvQkFBd0IsS0FBSyxVQUFVO0FBQUEsRUFDekQsRUFBRSxJQUFJLE1BQU0sTUFBTSx3QkFBd0Is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
