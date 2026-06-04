var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PXTrackerPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE = "px-tracker";
var DATA_FILE = "PX Tracker/px_tracker_data.json";
var BACKUP_FILE = "PX Tracker/px_tracker_data_backup.json";
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
function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getMondayOfDate(dateStr) {
  const d = /* @__PURE__ */ new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMon);
  return localDateStr(d);
}
function getMonday(offsetWeeks = 0) {
  const d = /* @__PURE__ */ new Date();
  const dow = d.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysFromMon + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekKey(offsetWeeks = 0) {
  return localDateStr(getMonday(offsetWeeks));
}
function getTodayKey() {
  return localDateStr(/* @__PURE__ */ new Date());
}
function getWeekLabel(mondayStr) {
  const mon = /* @__PURE__ */ new Date(mondayStr + "T12:00:00");
  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(mon)} \u2013 ${fmt(fri)}`;
}
function getWeekHoursFromKey(data, wkey) {
  const entry = data[wkey];
  if (!(entry == null ? void 0 : entry.days) || Object.keys(entry.days).length === 0) return THEMES.map(() => 0);
  return THEMES.map((_, i) => Object.values(entry.days).reduce((sum, day) => sum + (day.hours[i] || 0), 0));
}
function getWeekHours(data, offsetWeeks = 0) {
  return getWeekHoursFromKey(data, getWeekKey(offsetWeeks));
}
function getDayHours(data, wkey, dkey) {
  var _a, _b, _c;
  return ((_c = (_b = (_a = data[wkey]) == null ? void 0 : _a.days) == null ? void 0 : _b[dkey]) == null ? void 0 : _c.hours) || THEMES.map(() => 0);
}
function ensureDay(data, wkey, dkey) {
  if (!data[wkey]) data[wkey] = { days: {}, note: "" };
  if (!data[wkey].days) data[wkey].days = {};
  if (!data[wkey].days[dkey]) data[wkey].days[dkey] = { hours: THEMES.map(() => 0), note: "" };
  return data;
}
var PXTrackerView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    __publicField(this, "plugin");
    __publicField(this, "data", {});
    __publicField(this, "activeTab", "today");
    __publicField(this, "weekOffset", 0);
    __publicField(this, "selectedDate", getTodayKey());
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
    const wkey = getMondayOfDate(this.selectedDate);
    await this.plugin.writeWeekNote(this.data, wkey);
  }
  render() {
    const root = this.containerEl.children[1];
    root.empty();
    root.style.cssText = "padding:0;overflow-y:auto;background:var(--background-primary)";
    const app = root.createDiv({ cls: "px-app" });
    this.injectStyles(root);
    this.renderHeader(app);
    this.renderTabs(app);
    if (this.activeTab === "today") this.renderToday(app);
    else this.renderWeek(app);
  }
  injectStyles(root) {
    const existing = root.querySelector("#px-styles");
    if (existing) existing.remove();
    const style = root.createEl("style", { attr: { id: "px-styles" } });
    style.textContent = `
      .px-app{max-width:680px;margin:0 auto;padding:28px 24px 60px;font-family:var(--font-interface)}
      .px-h1{font-family:var(--font-text);font-size:26px;font-weight:400;color:var(--text-normal);line-height:1.2;margin-bottom:4px}
      .px-sub{font-size:11px;color:var(--text-muted);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:24px}
      .px-tabs{display:flex;border-bottom:1px solid var(--background-modifier-border);margin-bottom:24px}
      .px-tab{padding:8px 16px;font-size:13px;color:var(--text-muted);background:none;border:none;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;font-family:var(--font-interface)}
      .px-tab:hover{color:var(--text-normal)}
      .px-tab.active{color:var(--text-normal);font-weight:500;border-bottom-color:var(--text-normal)}
      .px-badge{font-size:10px;color:var(--text-muted);background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:10px;padding:1px 6px;margin-left:5px;font-family:var(--font-monospace)}
      .px-tab.active .px-badge{color:var(--text-normal)}
      .px-date-row{display:flex;align-items:center;gap:10px;margin-bottom:16px}
      .px-date-label{font-size:13px;font-weight:500;color:var(--text-normal);flex:1}
      .px-date-sub{font-size:11px;color:var(--text-muted);margin-bottom:20px}
      .px-date-input{font-family:var(--font-monospace);font-size:12px;color:var(--text-normal);background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:6px;padding:4px 8px;outline:none;cursor:pointer}
      .px-date-input:focus{border-color:var(--text-muted)}
      .px-today-btn{font-size:11px;color:var(--text-accent);background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:2px;font-family:var(--font-interface)}
      .px-today-btn:hover{color:var(--text-normal)}
      .px-section{font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:10px}
      .px-themes{display:flex;flex-direction:column;gap:6px;margin-bottom:16px}
      .px-theme-row{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:1px solid var(--background-modifier-border);background:var(--background-primary);transition:border-color .15s}
      .px-theme-row:hover{border-color:var(--text-muted)}
      .px-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
      .px-name{font-size:13px;flex:1;color:var(--text-normal)}
      .px-hours{display:flex;align-items:center;gap:6px}
      .px-btn{background:none;border:1px solid var(--background-modifier-border);border-radius:5px;width:24px;height:24px;cursor:pointer;font-size:14px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;transition:all .12s;line-height:1;user-select:none}
      .px-btn:hover{border-color:var(--text-normal);color:var(--text-normal)}
      .px-hval{font-family:var(--font-monospace);font-size:13px;min-width:32px;text-align:center;color:var(--text-normal)}
      .px-bar-wrap{width:64px;height:3px;background:var(--background-modifier-border);border-radius:3px;overflow:hidden}
      .px-bar{height:100%;border-radius:3px;transition:width .3s ease}
      .px-total{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:var(--background-secondary);border:1px solid var(--background-modifier-border);margin-bottom:20px;font-size:12px;color:var(--text-muted)}
      .px-total-val{font-family:var(--font-monospace);font-size:17px;color:var(--text-normal)}
      .px-divider{height:1px;background:var(--background-modifier-border);margin:20px 0}
      .px-rollup{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:20px}
      .px-chip{display:flex;align-items:center;gap:5px;padding:4px 9px;border-radius:16px;border:1px solid var(--background-modifier-border);background:var(--background-primary);font-size:11px;color:var(--text-muted)}
      .px-chip-dot{width:5px;height:5px;border-radius:50%}
      .px-chip-val{font-family:var(--font-monospace);font-weight:500;color:var(--text-normal);margin-left:1px}
      .px-note-label{font-size:10px;font-weight:500;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px}
      .px-note{width:100%;border:1px solid var(--background-modifier-border);border-radius:8px;padding:10px 12px;font-family:var(--font-interface);font-size:12px;line-height:1.6;color:var(--text-normal);background:var(--background-primary);resize:none;height:72px;outline:none;transition:border-color .15s;margin-bottom:16px}
      .px-note:focus{border-color:var(--text-muted)}
      .px-note::placeholder{color:var(--text-faint);font-style:italic}
      .px-save{width:100%;padding:10px;background:var(--interactive-accent);color:var(--text-on-accent);border:none;border-radius:8px;font-family:var(--font-interface);font-size:13px;font-weight:500;cursor:pointer;transition:opacity .15s;margin-bottom:8px}
      .px-save:hover{opacity:0.88}
      .px-save:disabled{opacity:0.4;cursor:default}
      .px-save-msg{font-size:11px;color:var(--text-muted);text-align:center;min-height:14px}
      .px-week-nav{display:flex;align-items:center;gap:10px;margin-bottom:20px}
      .px-week-label{font-size:13px;font-weight:500;color:var(--text-normal);flex:1}
      .px-week-pill{font-size:11px;color:var(--text-muted);background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:16px;padding:2px 9px}
      .px-nav-btn{background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:6px;width:28px;height:28px;cursor:pointer;font-size:14px;color:var(--text-muted);display:flex;align-items:center;justify-content:center;transition:all .15s}
      .px-nav-btn:hover{border-color:var(--text-normal);color:var(--text-normal)}
      .px-nav-btn:disabled{opacity:0.3;cursor:default}
      .px-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
      .px-panel{background:var(--background-secondary);border:1px solid var(--background-modifier-border);border-radius:10px;padding:16px}
      .px-donut-wrap{position:relative;display:flex;justify-content:center;margin-bottom:12px}
      .px-donut-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center}
      .px-donut-big{font-family:var(--font-monospace);font-size:20px;font-weight:500;color:var(--text-normal);line-height:1}
      .px-donut-small{font-size:10px;color:var(--text-muted);margin-top:2px}
      .px-legend{display:flex;flex-direction:column;gap:4px}
      .px-legend-item{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text-muted)}
      .px-legend-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
      .px-legend-name{flex:1}
      .px-legend-pct{font-family:var(--font-monospace);font-weight:500;color:var(--text-normal)}
      .px-hist{display:flex;gap:4px;align-items:flex-end;height:72px}
      .px-hist-col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;cursor:pointer}
      .px-hist-stack{width:100%;border-radius:2px 2px 0 0;overflow:hidden;display:flex;flex-direction:column-reverse;transition:opacity .15s;min-height:2px}
      .px-hist-col:hover .px-hist-stack{opacity:0.75}
      .px-hist-seg{width:100%}
      .px-hist-lbl{font-size:8px;color:var(--text-muted);text-align:center;margin-top:4px;opacity:0.5;white-space:nowrap;overflow:hidden}
      .px-hist-col.current .px-hist-lbl{opacity:1;font-weight:500;color:var(--text-normal)}
      .px-hist-empty{background:var(--background-modifier-border);border-radius:2px}
      .px-note-link{font-size:11px;color:var(--text-accent);cursor:pointer;text-align:center;display:block;margin-top:8px;text-decoration:underline;text-underline-offset:2px}
      .px-note-link:hover{color:var(--text-normal)}
    `;
  }
  renderHeader(app) {
    app.createEl("h2", { cls: "px-h1", text: "Where my time goes" });
    app.createDiv({ cls: "px-sub", text: "Weekly focus tracker \xB7 Product Experience" });
  }
  renderTabs(app) {
    const todayHours = getDayHours(this.data, getMondayOfDate(getTodayKey()), getTodayKey());
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
    const wkey = getMondayOfDate(this.selectedDate);
    const hours = getDayHours(this.data, wkey, this.selectedDate);
    const total = hours.reduce((a, b) => a + b, 0);
    const weekHours = getWeekHoursFromKey(this.data, wkey);
    const weekTotal = weekHours.reduce((a, b) => a + b, 0);
    const isToday = this.selectedDate === getTodayKey();
    const dateRow = app.createDiv({ cls: "px-date-row" });
    const d = /* @__PURE__ */ new Date(this.selectedDate + "T12:00:00");
    const dateLabel = d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    dateRow.createDiv({ cls: "px-date-label", text: dateLabel });
    if (!isToday) {
      const todayBtn = dateRow.createEl("button", { cls: "px-today-btn", text: "\u2190 today" });
      todayBtn.onclick = () => {
        this.selectedDate = getTodayKey();
        this.render();
      };
    }
    const dateInput = dateRow.createEl("input", { cls: "px-date-input", attr: { type: "date", value: this.selectedDate } });
    dateInput.onchange = (e) => {
      const val = e.target.value;
      if (val) {
        this.selectedDate = val;
        this.render();
      }
    };
    app.createDiv({ cls: "px-date-sub", text: isToday ? "Log hours for today \u2014 they roll up into your weekly total" : "Logging for a past day \u2014 hours roll into that week" });
    app.createDiv({ cls: "px-section", text: "Hours by theme" });
    const list = app.createDiv({ cls: "px-themes" });
    THEMES.forEach((t, i) => {
      const pct = total > 0 ? Math.round(hours[i] / total * 100) : 0;
      const row = list.createDiv({ cls: "px-theme-row" });
      row.createDiv({ cls: "px-dot", attr: { style: `background:${t.col}` } });
      row.createSpan({ cls: "px-name", text: t.name });
      const hh = row.createDiv({ cls: "px-hours" });
      const minusBtn = hh.createEl("button", { cls: "px-btn", text: "\u2212" });
      hh.createSpan({ cls: "px-hval", text: fmtH(hours[i]) });
      const plusBtn = hh.createEl("button", { cls: "px-btn", text: "+" });
      const bw = row.createDiv({ cls: "px-bar-wrap" });
      bw.createDiv({ cls: "px-bar", attr: { style: `width:${pct}%;background:${t.col}` } });
      minusBtn.onclick = () => {
        this.data = ensureDay(this.data, wkey, this.selectedDate);
        this.data[wkey].days[this.selectedDate].hours[i] = Math.max(0, +(this.data[wkey].days[this.selectedDate].hours[i] - 0.5).toFixed(1));
        this.render();
      };
      plusBtn.onclick = () => {
        this.data = ensureDay(this.data, wkey, this.selectedDate);
        this.data[wkey].days[this.selectedDate].hours[i] = +(this.data[wkey].days[this.selectedDate].hours[i] + 0.5).toFixed(1);
        this.render();
      };
    });
    const totalRow = app.createDiv({ cls: "px-total" });
    totalRow.createSpan({ text: isToday ? "Today's total" : `Total for ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` });
    totalRow.createSpan({ cls: "px-total-val", text: fmtH(total) });
    app.createDiv({ cls: "px-divider" });
    app.createDiv({ cls: "px-section", text: `Week of ${getWeekLabel(wkey)}` });
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
    app.createDiv({ cls: "px-note-label", text: isToday ? "Today's note" : "Note for this day" });
    const noteEl = app.createEl("textarea", { cls: "px-note", attr: { placeholder: "What did I actually spend my energy on today \u2014 and what's stirring?" } });
    noteEl.value = ((_c = (_b = (_a = this.data[wkey]) == null ? void 0 : _a.days) == null ? void 0 : _b[this.selectedDate]) == null ? void 0 : _c.note) || "";
    const saveBtn = app.createEl("button", { cls: "px-save", text: isToday ? "Save today" : `Save ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` });
    const saveMsg = app.createDiv({ cls: "px-save-msg" });
    saveBtn.onclick = async () => {
      this.data = ensureDay(this.data, wkey, this.selectedDate);
      this.data[wkey].days[this.selectedDate].note = noteEl.value;
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
      await this.plugin.openWeekNote(wkey);
    };
  }
  renderWeek(app) {
    var _a;
    const nav = app.createDiv({ cls: "px-week-nav" });
    const prevBtn = nav.createEl("button", { cls: "px-nav-btn", text: "\u2039" });
    const wkey = getWeekKey(this.weekOffset);
    nav.createSpan({ cls: "px-week-label", text: getWeekLabel(wkey) });
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
    const list = app.createDiv({ cls: "px-themes" });
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
    noteEl.value = ((_a = this.data[wkey]) == null ? void 0 : _a.note) || "";
    const saveBtn = app.createEl("button", { cls: "px-save", text: "Save this week" });
    const saveMsg = app.createDiv({ cls: "px-save-msg" });
    saveBtn.onclick = async () => {
      if (!this.data[wkey]) this.data[wkey] = { days: {}, note: "" };
      this.data[wkey].note = noteEl.value;
      saveBtn.disabled = true;
      await this.plugin.saveData_(this.data);
      await this.plugin.writeWeekNote(this.data, wkey);
      saveBtn.disabled = false;
      saveMsg.textContent = "Saved \u2713";
      setTimeout(() => {
        saveMsg.textContent = "";
      }, 2e3);
    };
    app.createEl("a", { cls: "px-note-link", text: "\u2192 Open this week's note in vault", attr: { href: "#" } }).onclick = async (e) => {
      e.preventDefault();
      await this.plugin.openWeekNote(wkey);
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
      const pct = h / total, dash = pct * circ, gap = circ - dash;
      svg.createSvg("circle", { attr: { cx: String(cx), cy: String(cy), r: String(r), fill: "none", stroke: THEMES[i].col, "stroke-width": String(sw), "stroke-dasharray": `${dash.toFixed(2)} ${gap.toFixed(2)}`, "stroke-dashoffset": `${(-(offset * circ) + circ / 4).toFixed(2)}` } });
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
    weeks.forEach((w) => {
      const hours = getWeekHours(this.data, w.offset);
      const total = totals[w.offset + 7];
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
      const d = /* @__PURE__ */ new Date(w.key + "T12:00:00");
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
    this.addCommand({ id: "open-px-tracker", name: "Open PX Tracker", callback: () => this.activateView() });
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
    if (!this.app.vault.getAbstractFileByPath(path)) await this.app.vault.createFolder(path);
  }
  async loadData_() {
    const file = this.app.vault.getAbstractFileByPath(DATA_FILE);
    if (file instanceof import_obsidian.TFile) {
      try {
        return JSON.parse(await this.app.vault.read(file));
      } catch (e) {
        return {};
      }
    }
    return {};
  }
  async saveData_(data) {
    const existing = await this.loadData_();
    const merged = { ...existing };
    for (const wkey of Object.keys(data)) {
      if (!merged[wkey]) {
        merged[wkey] = data[wkey];
      } else {
        merged[wkey].note = data[wkey].note || merged[wkey].note;
        merged[wkey].days = { ...merged[wkey].days, ...data[wkey].days };
      }
    }
    const json = JSON.stringify(merged, null, 2);
    const backup = this.app.vault.getAbstractFileByPath(BACKUP_FILE);
    const mainFile = this.app.vault.getAbstractFileByPath(DATA_FILE);
    if (mainFile instanceof import_obsidian.TFile) {
      const current = await this.app.vault.read(mainFile);
      if (backup instanceof import_obsidian.TFile) await this.app.vault.modify(backup, current);
      else await this.app.vault.create(BACKUP_FILE, current);
    }
    if (mainFile instanceof import_obsidian.TFile) await this.app.vault.modify(mainFile, json);
    else await this.app.vault.create(DATA_FILE, json);
  }
  async writeWeekNote(data, wkey) {
    const entry = data[wkey];
    if (!entry) return;
    const hours = getWeekHoursFromKey(data, wkey);
    const total = hours.reduce((a, b) => a + b, 0);
    let content = `# Week of ${getWeekLabel(wkey)}

## Hours

`;
    THEMES.forEach((t, i) => {
      if (hours[i] > 0) content += `- **${t.name}**: ${fmtH(hours[i])}
`;
    });
    content += `
**Total**: ${fmtH(total)}

`;
    if (entry.note) content += `## Week reflection

${entry.note}

`;
    const dayKeys = Object.keys(entry.days || {}).sort();
    if (dayKeys.length > 0) {
      content += `## Daily notes

`;
      dayKeys.forEach((dkey) => {
        const day = entry.days[dkey];
        if (day.note) {
          const d = /* @__PURE__ */ new Date(dkey + "T12:00:00");
          content += `### ${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}

${day.note}

`;
        }
      });
    }
    const notePath = `${NOTES_FOLDER}/${wkey}.md`;
    const existing = this.app.vault.getAbstractFileByPath(notePath);
    if (existing instanceof import_obsidian.TFile) await this.app.vault.modify(existing, content);
    else await this.app.vault.create(notePath, content);
  }
  async openWeekNote(wkey) {
    const notePath = `${NOTES_FOLDER}/${wkey}.md`;
    let file = this.app.vault.getAbstractFileByPath(notePath);
    if (!file) {
      const data = await this.loadData_();
      await this.writeWeekNote(data, wkey);
      file = this.app.vault.getAbstractFileByPath(notePath);
    }
    if (file instanceof import_obsidian.TFile) {
      const leaf = this.app.workspace.getLeaf(true);
      await leaf.openFile(file);
    }
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFwcCwgSXRlbVZpZXcsIFBsdWdpbiwgV29ya3NwYWNlTGVhZiwgVEZpbGUgfSBmcm9tICdvYnNpZGlhbic7XG5cbmNvbnN0IFZJRVdfVFlQRSA9ICdweC10cmFja2VyJztcbmNvbnN0IERBVEFfRklMRSA9ICdQWCBUcmFja2VyL3B4X3RyYWNrZXJfZGF0YS5qc29uJztcbmNvbnN0IEJBQ0tVUF9GSUxFID0gJ1BYIFRyYWNrZXIvcHhfdHJhY2tlcl9kYXRhX2JhY2t1cC5qc29uJztcbmNvbnN0IE5PVEVTX0ZPTERFUiA9ICdQWCBUcmFja2VyL05vdGVzJztcblxuY29uc3QgVEhFTUVTID0gW1xuICB7IGlkOiAndDEnLCBuYW1lOiAnUFggU3RyYXRlZ3knLCAgICAgICAgIGNvbDogJyMwMDM4YjgnIH0sXG4gIHsgaWQ6ICd0MicsIG5hbWU6ICdQZW9wbGUgJiBMZWFkZXJzaGlwJywgIGNvbDogJyNjMDAwNmEnIH0sXG4gIHsgaWQ6ICd0MycsIG5hbWU6ICdEZXNpZ24gT3BzICYgQUknLCAgICAgIGNvbDogJyNjOTQwNDAnIH0sXG4gIHsgaWQ6ICd0NCcsIG5hbWU6ICdDcmFmdCAmIERlbGl2ZXJ5JywgICAgIGNvbDogJyMzZDQ0NzAnIH0sXG4gIHsgaWQ6ICd0NScsIG5hbWU6ICdEaXNjb3ZlcnkgJiBSZXNlYXJjaCcsIGNvbDogJyM1YTZhYjUnIH0sXG4gIHsgaWQ6ICd0NicsIG5hbWU6ICdPdmVyaGVhZCcsICAgICAgICAgICAgIGNvbDogJyM4YThmYTgnIH0sXG5dO1xuXG5pbnRlcmZhY2UgRGF5RW50cnkgeyBob3VyczogbnVtYmVyW107IG5vdGU6IHN0cmluZzsgfVxuaW50ZXJmYWNlIFdlZWtFbnRyeSB7IGRheXM6IFJlY29yZDxzdHJpbmcsIERheUVudHJ5Pjsgbm90ZTogc3RyaW5nOyB9XG5pbnRlcmZhY2UgVHJhY2tlckRhdGEgeyBbd2Vla0tleTogc3RyaW5nXTogV2Vla0VudHJ5OyB9XG5cbmZ1bmN0aW9uIGZtdEgoaDogbnVtYmVyKTogc3RyaW5nIHtcbiAgcmV0dXJuIGggJSAxID09PSAwID8gYCR7aH1oYCA6IGAke2gudG9GaXhlZCgxKX1oYDtcbn1cblxuZnVuY3Rpb24gbG9jYWxEYXRlU3RyKGQ6IERhdGUpOiBzdHJpbmcge1xuICBjb25zdCB5ID0gZC5nZXRGdWxsWWVhcigpO1xuICBjb25zdCBtID0gU3RyaW5nKGQuZ2V0TW9udGgoKSArIDEpLnBhZFN0YXJ0KDIsICcwJyk7XG4gIGNvbnN0IGRheSA9IFN0cmluZyhkLmdldERhdGUoKSkucGFkU3RhcnQoMiwgJzAnKTtcbiAgcmV0dXJuIGAke3l9LSR7bX0tJHtkYXl9YDtcbn1cblxuZnVuY3Rpb24gZ2V0TW9uZGF5T2ZEYXRlKGRhdGVTdHI6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGQgPSBuZXcgRGF0ZShkYXRlU3RyICsgJ1QxMjowMDowMCcpO1xuICBjb25zdCBkb3cgPSBkLmdldERheSgpO1xuICBjb25zdCBkYXlzRnJvbU1vbiA9IGRvdyA9PT0gMCA/IDYgOiBkb3cgLSAxO1xuICBkLnNldERhdGUoZC5nZXREYXRlKCkgLSBkYXlzRnJvbU1vbik7XG4gIHJldHVybiBsb2NhbERhdGVTdHIoZCk7XG59XG5cbmZ1bmN0aW9uIGdldE1vbmRheShvZmZzZXRXZWVrcyA9IDApOiBEYXRlIHtcbiAgY29uc3QgZCA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGRvdyA9IGQuZ2V0RGF5KCk7XG4gIGNvbnN0IGRheXNGcm9tTW9uID0gZG93ID09PSAwID8gNiA6IGRvdyAtIDE7XG4gIGQuc2V0RGF0ZShkLmdldERhdGUoKSAtIGRheXNGcm9tTW9uICsgb2Zmc2V0V2Vla3MgKiA3KTtcbiAgZC5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgcmV0dXJuIGQ7XG59XG5cbmZ1bmN0aW9uIGdldFdlZWtLZXkob2Zmc2V0V2Vla3MgPSAwKTogc3RyaW5nIHsgcmV0dXJuIGxvY2FsRGF0ZVN0cihnZXRNb25kYXkob2Zmc2V0V2Vla3MpKTsgfVxuZnVuY3Rpb24gZ2V0VG9kYXlLZXkoKTogc3RyaW5nIHsgcmV0dXJuIGxvY2FsRGF0ZVN0cihuZXcgRGF0ZSgpKTsgfVxuXG5mdW5jdGlvbiBnZXRXZWVrTGFiZWwobW9uZGF5U3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCBtb24gPSBuZXcgRGF0ZShtb25kYXlTdHIgKyAnVDEyOjAwOjAwJyk7XG4gIGNvbnN0IGZyaSA9IG5ldyBEYXRlKG1vbik7IGZyaS5zZXREYXRlKG1vbi5nZXREYXRlKCkgKyA0KTtcbiAgY29uc3QgZm10ID0gKGQ6IERhdGUpID0+IGQudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1HQicsIHsgZGF5OiAnbnVtZXJpYycsIG1vbnRoOiAnc2hvcnQnIH0pO1xuICByZXR1cm4gYCR7Zm10KG1vbil9IFx1MjAxMyAke2ZtdChmcmkpfWA7XG59XG5cbmZ1bmN0aW9uIGdldFdlZWtIb3Vyc0Zyb21LZXkoZGF0YTogVHJhY2tlckRhdGEsIHdrZXk6IHN0cmluZyk6IG51bWJlcltdIHtcbiAgY29uc3QgZW50cnkgPSBkYXRhW3drZXldO1xuICBpZiAoIWVudHJ5Py5kYXlzIHx8IE9iamVjdC5rZXlzKGVudHJ5LmRheXMpLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFRIRU1FUy5tYXAoKCkgPT4gMCk7XG4gIHJldHVybiBUSEVNRVMubWFwKChfLCBpKSA9PiBPYmplY3QudmFsdWVzKGVudHJ5LmRheXMpLnJlZHVjZSgoc3VtLCBkYXkpID0+IHN1bSArIChkYXkuaG91cnNbaV0gfHwgMCksIDApKTtcbn1cblxuZnVuY3Rpb24gZ2V0V2Vla0hvdXJzKGRhdGE6IFRyYWNrZXJEYXRhLCBvZmZzZXRXZWVrcyA9IDApOiBudW1iZXJbXSB7XG4gIHJldHVybiBnZXRXZWVrSG91cnNGcm9tS2V5KGRhdGEsIGdldFdlZWtLZXkob2Zmc2V0V2Vla3MpKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGF5SG91cnMoZGF0YTogVHJhY2tlckRhdGEsIHdrZXk6IHN0cmluZywgZGtleTogc3RyaW5nKTogbnVtYmVyW10ge1xuICByZXR1cm4gZGF0YVt3a2V5XT8uZGF5cz8uW2RrZXldPy5ob3VycyB8fCBUSEVNRVMubWFwKCgpID0+IDApO1xufVxuXG5mdW5jdGlvbiBlbnN1cmVEYXkoZGF0YTogVHJhY2tlckRhdGEsIHdrZXk6IHN0cmluZywgZGtleTogc3RyaW5nKTogVHJhY2tlckRhdGEge1xuICBpZiAoIWRhdGFbd2tleV0pIGRhdGFbd2tleV0gPSB7IGRheXM6IHt9LCBub3RlOiAnJyB9O1xuICBpZiAoIWRhdGFbd2tleV0uZGF5cykgZGF0YVt3a2V5XS5kYXlzID0ge307XG4gIGlmICghZGF0YVt3a2V5XS5kYXlzW2RrZXldKSBkYXRhW3drZXldLmRheXNbZGtleV0gPSB7IGhvdXJzOiBUSEVNRVMubWFwKCgpID0+IDApLCBub3RlOiAnJyB9O1xuICByZXR1cm4gZGF0YTtcbn1cblxuY2xhc3MgUFhUcmFja2VyVmlldyBleHRlbmRzIEl0ZW1WaWV3IHtcbiAgcGx1Z2luOiBQWFRyYWNrZXJQbHVnaW47XG4gIGRhdGE6IFRyYWNrZXJEYXRhID0ge307XG4gIGFjdGl2ZVRhYjogJ3RvZGF5JyB8ICd3ZWVrJyA9ICd0b2RheSc7XG4gIHdlZWtPZmZzZXQgPSAwO1xuICBzZWxlY3RlZERhdGU6IHN0cmluZyA9IGdldFRvZGF5S2V5KCk7XG5cbiAgY29uc3RydWN0b3IobGVhZjogV29ya3NwYWNlTGVhZiwgcGx1Z2luOiBQWFRyYWNrZXJQbHVnaW4pIHtcbiAgICBzdXBlcihsZWFmKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGdldFZpZXdUeXBlKCkgeyByZXR1cm4gVklFV19UWVBFOyB9XG4gIGdldERpc3BsYXlUZXh0KCkgeyByZXR1cm4gJ1BYIFRyYWNrZXInOyB9XG4gIGdldEljb24oKSB7IHJldHVybiAndGltZXInOyB9XG5cbiAgYXN5bmMgb25PcGVuKCkge1xuICAgIHRoaXMuZGF0YSA9IGF3YWl0IHRoaXMucGx1Z2luLmxvYWREYXRhXygpIHx8IHt9O1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBhc3luYyBvbkNsb3NlKCkge31cblxuICBhc3luYyBzYXZlKCkge1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVEYXRhXyh0aGlzLmRhdGEpO1xuICAgIGNvbnN0IHdrZXkgPSBnZXRNb25kYXlPZkRhdGUodGhpcy5zZWxlY3RlZERhdGUpO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLndyaXRlV2Vla05vdGUodGhpcy5kYXRhLCB3a2V5KTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBjb25zdCByb290ID0gdGhpcy5jb250YWluZXJFbC5jaGlsZHJlblsxXSBhcyBIVE1MRWxlbWVudDtcbiAgICByb290LmVtcHR5KCk7XG4gICAgcm9vdC5zdHlsZS5jc3NUZXh0ID0gJ3BhZGRpbmc6MDtvdmVyZmxvdy15OmF1dG87YmFja2dyb3VuZDp2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpJztcbiAgICBjb25zdCBhcHAgPSByb290LmNyZWF0ZURpdih7IGNsczogJ3B4LWFwcCcgfSk7XG4gICAgdGhpcy5pbmplY3RTdHlsZXMocm9vdCk7XG4gICAgdGhpcy5yZW5kZXJIZWFkZXIoYXBwKTtcbiAgICB0aGlzLnJlbmRlclRhYnMoYXBwKTtcbiAgICBpZiAodGhpcy5hY3RpdmVUYWIgPT09ICd0b2RheScpIHRoaXMucmVuZGVyVG9kYXkoYXBwKTtcbiAgICBlbHNlIHRoaXMucmVuZGVyV2VlayhhcHApO1xuICB9XG5cbiAgaW5qZWN0U3R5bGVzKHJvb3Q6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSByb290LnF1ZXJ5U2VsZWN0b3IoJyNweC1zdHlsZXMnKTtcbiAgICBpZiAoZXhpc3RpbmcpIGV4aXN0aW5nLnJlbW92ZSgpO1xuICAgIGNvbnN0IHN0eWxlID0gcm9vdC5jcmVhdGVFbCgnc3R5bGUnLCB7IGF0dHI6IHsgaWQ6ICdweC1zdHlsZXMnIH0gfSk7XG4gICAgc3R5bGUudGV4dENvbnRlbnQgPSBgXG4gICAgICAucHgtYXBwe21heC13aWR0aDo2ODBweDttYXJnaW46MCBhdXRvO3BhZGRpbmc6MjhweCAyNHB4IDYwcHg7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1pbnRlcmZhY2UpfVxuICAgICAgLnB4LWgxe2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtdGV4dCk7Zm9udC1zaXplOjI2cHg7Zm9udC13ZWlnaHQ6NDAwO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKTtsaW5lLWhlaWdodDoxLjI7bWFyZ2luLWJvdHRvbTo0cHh9XG4gICAgICAucHgtc3Vie2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO2xldHRlci1zcGFjaW5nOjAuMDVlbTt0ZXh0LXRyYW5zZm9ybTp1cHBlcmNhc2U7bWFyZ2luLWJvdHRvbToyNHB4fVxuICAgICAgLnB4LXRhYnN7ZGlzcGxheTpmbGV4O2JvcmRlci1ib3R0b206MXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTttYXJnaW4tYm90dG9tOjI0cHh9XG4gICAgICAucHgtdGFie3BhZGRpbmc6OHB4IDE2cHg7Zm9udC1zaXplOjEzcHg7Y29sb3I6dmFyKC0tdGV4dC1tdXRlZCk7YmFja2dyb3VuZDpub25lO2JvcmRlcjpub25lO2N1cnNvcjpwb2ludGVyO2JvcmRlci1ib3R0b206MnB4IHNvbGlkIHRyYW5zcGFyZW50O21hcmdpbi1ib3R0b206LTFweDt0cmFuc2l0aW9uOmNvbG9yIC4xNXMsYm9yZGVyLWNvbG9yIC4xNXM7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1pbnRlcmZhY2UpfVxuICAgICAgLnB4LXRhYjpob3Zlcntjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCl9XG4gICAgICAucHgtdGFiLmFjdGl2ZXtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCk7Zm9udC13ZWlnaHQ6NTAwO2JvcmRlci1ib3R0b20tY29sb3I6dmFyKC0tdGV4dC1ub3JtYWwpfVxuICAgICAgLnB4LWJhZGdle2ZvbnQtc2l6ZToxMHB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjFweCA2cHg7bWFyZ2luLWxlZnQ6NXB4O2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtbW9ub3NwYWNlKX1cbiAgICAgIC5weC10YWIuYWN0aXZlIC5weC1iYWRnZXtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCl9XG4gICAgICAucHgtZGF0ZS1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDttYXJnaW4tYm90dG9tOjE2cHh9XG4gICAgICAucHgtZGF0ZS1sYWJlbHtmb250LXNpemU6MTNweDtmb250LXdlaWdodDo1MDA7Y29sb3I6dmFyKC0tdGV4dC1ub3JtYWwpO2ZsZXg6MX1cbiAgICAgIC5weC1kYXRlLXN1Yntmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKTttYXJnaW4tYm90dG9tOjIwcHh9XG4gICAgICAucHgtZGF0ZS1pbnB1dHtmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm9zcGFjZSk7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tdGV4dC1ub3JtYWwpO2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO2JvcmRlci1yYWRpdXM6NnB4O3BhZGRpbmc6NHB4IDhweDtvdXRsaW5lOm5vbmU7Y3Vyc29yOnBvaW50ZXJ9XG4gICAgICAucHgtZGF0ZS1pbnB1dDpmb2N1c3tib3JkZXItY29sb3I6dmFyKC0tdGV4dC1tdXRlZCl9XG4gICAgICAucHgtdG9kYXktYnRue2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLXRleHQtYWNjZW50KTtiYWNrZ3JvdW5kOm5vbmU7Ym9yZGVyOm5vbmU7Y3Vyc29yOnBvaW50ZXI7cGFkZGluZzowO3RleHQtZGVjb3JhdGlvbjp1bmRlcmxpbmU7dGV4dC11bmRlcmxpbmUtb2Zmc2V0OjJweDtmb250LWZhbWlseTp2YXIoLS1mb250LWludGVyZmFjZSl9XG4gICAgICAucHgtdG9kYXktYnRuOmhvdmVye2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKX1cbiAgICAgIC5weC1zZWN0aW9ue2ZvbnQtc2l6ZToxMHB4O2ZvbnQtd2VpZ2h0OjUwMDtsZXR0ZXItc3BhY2luZzowLjA4ZW07dGV4dC10cmFuc2Zvcm06dXBwZXJjYXNlO2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO21hcmdpbi1ib3R0b206MTBweH1cbiAgICAgIC5weC10aGVtZXN7ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbjtnYXA6NnB4O21hcmdpbi1ib3R0b206MTZweH1cbiAgICAgIC5weC10aGVtZS1yb3d7ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6MTBweDtwYWRkaW5nOjEwcHggMTJweDtib3JkZXItcmFkaXVzOjhweDtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtiYWNrZ3JvdW5kOnZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7dHJhbnNpdGlvbjpib3JkZXItY29sb3IgLjE1c31cbiAgICAgIC5weC10aGVtZS1yb3c6aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLXRleHQtbXV0ZWQpfVxuICAgICAgLnB4LWRvdHt3aWR0aDo5cHg7aGVpZ2h0OjlweDtib3JkZXItcmFkaXVzOjUwJTtmbGV4LXNocmluazowfVxuICAgICAgLnB4LW5hbWV7Zm9udC1zaXplOjEzcHg7ZmxleDoxO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKX1cbiAgICAgIC5weC1ob3Vyc3tkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDo2cHh9XG4gICAgICAucHgtYnRue2JhY2tncm91bmQ6bm9uZTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtib3JkZXItcmFkaXVzOjVweDt3aWR0aDoyNHB4O2hlaWdodDoyNHB4O2N1cnNvcjpwb2ludGVyO2ZvbnQtc2l6ZToxNHB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7anVzdGlmeS1jb250ZW50OmNlbnRlcjt0cmFuc2l0aW9uOmFsbCAuMTJzO2xpbmUtaGVpZ2h0OjE7dXNlci1zZWxlY3Q6bm9uZX1cbiAgICAgIC5weC1idG46aG92ZXJ7Ym9yZGVyLWNvbG9yOnZhcigtLXRleHQtbm9ybWFsKTtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCl9XG4gICAgICAucHgtaHZhbHtmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm9zcGFjZSk7Zm9udC1zaXplOjEzcHg7bWluLXdpZHRoOjMycHg7dGV4dC1hbGlnbjpjZW50ZXI7Y29sb3I6dmFyKC0tdGV4dC1ub3JtYWwpfVxuICAgICAgLnB4LWJhci13cmFwe3dpZHRoOjY0cHg7aGVpZ2h0OjNweDtiYWNrZ3JvdW5kOnZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtib3JkZXItcmFkaXVzOjNweDtvdmVyZmxvdzpoaWRkZW59XG4gICAgICAucHgtYmFye2hlaWdodDoxMDAlO2JvcmRlci1yYWRpdXM6M3B4O3RyYW5zaXRpb246d2lkdGggLjNzIGVhc2V9XG4gICAgICAucHgtdG90YWx7ZGlzcGxheTpmbGV4O2p1c3RpZnktY29udGVudDpzcGFjZS1iZXR3ZWVuO2FsaWduLWl0ZW1zOmNlbnRlcjtwYWRkaW5nOjEwcHggMTJweDtib3JkZXItcmFkaXVzOjhweDtiYWNrZ3JvdW5kOnZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTttYXJnaW4tYm90dG9tOjIwcHg7Zm9udC1zaXplOjEycHg7Y29sb3I6dmFyKC0tdGV4dC1tdXRlZCl9XG4gICAgICAucHgtdG90YWwtdmFse2ZvbnQtZmFtaWx5OnZhcigtLWZvbnQtbW9ub3NwYWNlKTtmb250LXNpemU6MTdweDtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCl9XG4gICAgICAucHgtZGl2aWRlcntoZWlnaHQ6MXB4O2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO21hcmdpbjoyMHB4IDB9XG4gICAgICAucHgtcm9sbHVwe2Rpc3BsYXk6ZmxleDtnYXA6NnB4O2ZsZXgtd3JhcDp3cmFwO21hcmdpbi1ib3R0b206MjBweH1cbiAgICAgIC5weC1jaGlwe2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjVweDtwYWRkaW5nOjRweCA5cHg7Ym9yZGVyLXJhZGl1czoxNnB4O2JvcmRlcjoxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKX1cbiAgICAgIC5weC1jaGlwLWRvdHt3aWR0aDo1cHg7aGVpZ2h0OjVweDtib3JkZXItcmFkaXVzOjUwJX1cbiAgICAgIC5weC1jaGlwLXZhbHtmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm9zcGFjZSk7Zm9udC13ZWlnaHQ6NTAwO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKTttYXJnaW4tbGVmdDoxcHh9XG4gICAgICAucHgtbm90ZS1sYWJlbHtmb250LXNpemU6MTBweDtmb250LXdlaWdodDo1MDA7bGV0dGVyLXNwYWNpbmc6MC4wOGVtO3RleHQtdHJhbnNmb3JtOnVwcGVyY2FzZTtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKTttYXJnaW4tYm90dG9tOjZweH1cbiAgICAgIC5weC1ub3Rle3dpZHRoOjEwMCU7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7Ym9yZGVyLXJhZGl1czo4cHg7cGFkZGluZzoxMHB4IDEycHg7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1pbnRlcmZhY2UpO2ZvbnQtc2l6ZToxMnB4O2xpbmUtaGVpZ2h0OjEuNjtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCk7YmFja2dyb3VuZDp2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO3Jlc2l6ZTpub25lO2hlaWdodDo3MnB4O291dGxpbmU6bm9uZTt0cmFuc2l0aW9uOmJvcmRlci1jb2xvciAuMTVzO21hcmdpbi1ib3R0b206MTZweH1cbiAgICAgIC5weC1ub3RlOmZvY3Vze2JvcmRlci1jb2xvcjp2YXIoLS10ZXh0LW11dGVkKX1cbiAgICAgIC5weC1ub3RlOjpwbGFjZWhvbGRlcntjb2xvcjp2YXIoLS10ZXh0LWZhaW50KTtmb250LXN0eWxlOml0YWxpY31cbiAgICAgIC5weC1zYXZle3dpZHRoOjEwMCU7cGFkZGluZzoxMHB4O2JhY2tncm91bmQ6dmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtjb2xvcjp2YXIoLS10ZXh0LW9uLWFjY2VudCk7Ym9yZGVyOm5vbmU7Ym9yZGVyLXJhZGl1czo4cHg7Zm9udC1mYW1pbHk6dmFyKC0tZm9udC1pbnRlcmZhY2UpO2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjUwMDtjdXJzb3I6cG9pbnRlcjt0cmFuc2l0aW9uOm9wYWNpdHkgLjE1czttYXJnaW4tYm90dG9tOjhweH1cbiAgICAgIC5weC1zYXZlOmhvdmVye29wYWNpdHk6MC44OH1cbiAgICAgIC5weC1zYXZlOmRpc2FibGVke29wYWNpdHk6MC40O2N1cnNvcjpkZWZhdWx0fVxuICAgICAgLnB4LXNhdmUtbXNne2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO3RleHQtYWxpZ246Y2VudGVyO21pbi1oZWlnaHQ6MTRweH1cbiAgICAgIC5weC13ZWVrLW5hdntkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2dhcDoxMHB4O21hcmdpbi1ib3R0b206MjBweH1cbiAgICAgIC5weC13ZWVrLWxhYmVse2ZvbnQtc2l6ZToxM3B4O2ZvbnQtd2VpZ2h0OjUwMDtjb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCk7ZmxleDoxfVxuICAgICAgLnB4LXdlZWstcGlsbHtmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKTtiYWNrZ3JvdW5kOnZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtib3JkZXI6MXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtib3JkZXItcmFkaXVzOjE2cHg7cGFkZGluZzoycHggOXB4fVxuICAgICAgLnB4LW5hdi1idG57YmFja2dyb3VuZDp2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7Ym9yZGVyOjFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7Ym9yZGVyLXJhZGl1czo2cHg7d2lkdGg6MjhweDtoZWlnaHQ6MjhweDtjdXJzb3I6cG9pbnRlcjtmb250LXNpemU6MTRweDtjb2xvcjp2YXIoLS10ZXh0LW11dGVkKTtkaXNwbGF5OmZsZXg7YWxpZ24taXRlbXM6Y2VudGVyO2p1c3RpZnktY29udGVudDpjZW50ZXI7dHJhbnNpdGlvbjphbGwgLjE1c31cbiAgICAgIC5weC1uYXYtYnRuOmhvdmVye2JvcmRlci1jb2xvcjp2YXIoLS10ZXh0LW5vcm1hbCk7Y29sb3I6dmFyKC0tdGV4dC1ub3JtYWwpfVxuICAgICAgLnB4LW5hdi1idG46ZGlzYWJsZWR7b3BhY2l0eTowLjM7Y3Vyc29yOmRlZmF1bHR9XG4gICAgICAucHgtdHdvLWNvbHtkaXNwbGF5OmdyaWQ7Z3JpZC10ZW1wbGF0ZS1jb2x1bW5zOjFmciAxZnI7Z2FwOjE2cHg7bWFyZ2luLWJvdHRvbToyNHB4fVxuICAgICAgLnB4LXBhbmVse2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO2JvcmRlcjoxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO2JvcmRlci1yYWRpdXM6MTBweDtwYWRkaW5nOjE2cHh9XG4gICAgICAucHgtZG9udXQtd3JhcHtwb3NpdGlvbjpyZWxhdGl2ZTtkaXNwbGF5OmZsZXg7anVzdGlmeS1jb250ZW50OmNlbnRlcjttYXJnaW4tYm90dG9tOjEycHh9XG4gICAgICAucHgtZG9udXQtY2VudGVye3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7bGVmdDo1MCU7dHJhbnNmb3JtOnRyYW5zbGF0ZSgtNTAlLC01MCUpO3RleHQtYWxpZ246Y2VudGVyfVxuICAgICAgLnB4LWRvbnV0LWJpZ3tmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm9zcGFjZSk7Zm9udC1zaXplOjIwcHg7Zm9udC13ZWlnaHQ6NTAwO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKTtsaW5lLWhlaWdodDoxfVxuICAgICAgLnB4LWRvbnV0LXNtYWxse2ZvbnQtc2l6ZToxMHB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpO21hcmdpbi10b3A6MnB4fVxuICAgICAgLnB4LWxlZ2VuZHtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2dhcDo0cHh9XG4gICAgICAucHgtbGVnZW5kLWl0ZW17ZGlzcGxheTpmbGV4O2FsaWduLWl0ZW1zOmNlbnRlcjtnYXA6NnB4O2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpfVxuICAgICAgLnB4LWxlZ2VuZC1kb3R7d2lkdGg6NnB4O2hlaWdodDo2cHg7Ym9yZGVyLXJhZGl1czo1MCU7ZmxleC1zaHJpbms6MH1cbiAgICAgIC5weC1sZWdlbmQtbmFtZXtmbGV4OjF9XG4gICAgICAucHgtbGVnZW5kLXBjdHtmb250LWZhbWlseTp2YXIoLS1mb250LW1vbm9zcGFjZSk7Zm9udC13ZWlnaHQ6NTAwO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKX1cbiAgICAgIC5weC1oaXN0e2Rpc3BsYXk6ZmxleDtnYXA6NHB4O2FsaWduLWl0ZW1zOmZsZXgtZW5kO2hlaWdodDo3MnB4fVxuICAgICAgLnB4LWhpc3QtY29se2ZsZXg6MTtkaXNwbGF5OmZsZXg7ZmxleC1kaXJlY3Rpb246Y29sdW1uO2p1c3RpZnktY29udGVudDpmbGV4LWVuZDtjdXJzb3I6cG9pbnRlcn1cbiAgICAgIC5weC1oaXN0LXN0YWNre3dpZHRoOjEwMCU7Ym9yZGVyLXJhZGl1czoycHggMnB4IDAgMDtvdmVyZmxvdzpoaWRkZW47ZGlzcGxheTpmbGV4O2ZsZXgtZGlyZWN0aW9uOmNvbHVtbi1yZXZlcnNlO3RyYW5zaXRpb246b3BhY2l0eSAuMTVzO21pbi1oZWlnaHQ6MnB4fVxuICAgICAgLnB4LWhpc3QtY29sOmhvdmVyIC5weC1oaXN0LXN0YWNre29wYWNpdHk6MC43NX1cbiAgICAgIC5weC1oaXN0LXNlZ3t3aWR0aDoxMDAlfVxuICAgICAgLnB4LWhpc3QtbGJse2ZvbnQtc2l6ZTo4cHg7Y29sb3I6dmFyKC0tdGV4dC1tdXRlZCk7dGV4dC1hbGlnbjpjZW50ZXI7bWFyZ2luLXRvcDo0cHg7b3BhY2l0eTowLjU7d2hpdGUtc3BhY2U6bm93cmFwO292ZXJmbG93OmhpZGRlbn1cbiAgICAgIC5weC1oaXN0LWNvbC5jdXJyZW50IC5weC1oaXN0LWxibHtvcGFjaXR5OjE7Zm9udC13ZWlnaHQ6NTAwO2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKX1cbiAgICAgIC5weC1oaXN0LWVtcHR5e2JhY2tncm91bmQ6dmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO2JvcmRlci1yYWRpdXM6MnB4fVxuICAgICAgLnB4LW5vdGUtbGlua3tmb250LXNpemU6MTFweDtjb2xvcjp2YXIoLS10ZXh0LWFjY2VudCk7Y3Vyc29yOnBvaW50ZXI7dGV4dC1hbGlnbjpjZW50ZXI7ZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjhweDt0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO3RleHQtdW5kZXJsaW5lLW9mZnNldDoycHh9XG4gICAgICAucHgtbm90ZS1saW5rOmhvdmVye2NvbG9yOnZhcigtLXRleHQtbm9ybWFsKX1cbiAgICBgO1xuICB9XG5cbiAgcmVuZGVySGVhZGVyKGFwcDogSFRNTEVsZW1lbnQpIHtcbiAgICBhcHAuY3JlYXRlRWwoJ2gyJywgeyBjbHM6ICdweC1oMScsIHRleHQ6ICdXaGVyZSBteSB0aW1lIGdvZXMnIH0pO1xuICAgIGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1zdWInLCB0ZXh0OiAnV2Vla2x5IGZvY3VzIHRyYWNrZXIgXHUwMEI3IFByb2R1Y3QgRXhwZXJpZW5jZScgfSk7XG4gIH1cblxuICByZW5kZXJUYWJzKGFwcDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCB0b2RheUhvdXJzID0gZ2V0RGF5SG91cnModGhpcy5kYXRhLCBnZXRNb25kYXlPZkRhdGUoZ2V0VG9kYXlLZXkoKSksIGdldFRvZGF5S2V5KCkpO1xuICAgIGNvbnN0IHRvZGF5VG90YWwgPSB0b2RheUhvdXJzLnJlZHVjZSgoYSxiKSA9PiBhK2IsIDApO1xuICAgIGNvbnN0IHdlZWtIb3VycyA9IGdldFdlZWtIb3Vycyh0aGlzLmRhdGEsIDApO1xuICAgIGNvbnN0IHdlZWtUb3RhbCA9IHdlZWtIb3Vycy5yZWR1Y2UoKGEsYikgPT4gYStiLCAwKTtcblxuICAgIGNvbnN0IHRhYnMgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtdGFicycgfSk7XG4gICAgY29uc3QgdG9kYXlUYWIgPSB0YWJzLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogYHB4LXRhYiR7dGhpcy5hY3RpdmVUYWI9PT0ndG9kYXknPycgYWN0aXZlJzonJ31gLCB0ZXh0OiAnVG9kYXknIH0pO1xuICAgIHRvZGF5VGFiLmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1iYWRnZScsIHRleHQ6IGZtdEgodG9kYXlUb3RhbCkgfSk7XG4gICAgdG9kYXlUYWIub25jbGljayA9ICgpID0+IHsgdGhpcy5hY3RpdmVUYWIgPSAndG9kYXknOyB0aGlzLnJlbmRlcigpOyB9O1xuXG4gICAgY29uc3Qgd2Vla1RhYiA9IHRhYnMuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiBgcHgtdGFiJHt0aGlzLmFjdGl2ZVRhYj09PSd3ZWVrJz8nIGFjdGl2ZSc6Jyd9YCwgdGV4dDogJ1RoaXMgd2VlaycgfSk7XG4gICAgd2Vla1RhYi5jcmVhdGVTcGFuKHsgY2xzOiAncHgtYmFkZ2UnLCB0ZXh0OiBmbXRIKHdlZWtUb3RhbCkgfSk7XG4gICAgd2Vla1RhYi5vbmNsaWNrID0gKCkgPT4geyB0aGlzLmFjdGl2ZVRhYiA9ICd3ZWVrJzsgdGhpcy5yZW5kZXIoKTsgfTtcbiAgfVxuXG4gIHJlbmRlclRvZGF5KGFwcDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCB3a2V5ID0gZ2V0TW9uZGF5T2ZEYXRlKHRoaXMuc2VsZWN0ZWREYXRlKTtcbiAgICBjb25zdCBob3VycyA9IGdldERheUhvdXJzKHRoaXMuZGF0YSwgd2tleSwgdGhpcy5zZWxlY3RlZERhdGUpO1xuICAgIGNvbnN0IHRvdGFsID0gaG91cnMucmVkdWNlKChhLGIpID0+IGErYiwgMCk7XG4gICAgY29uc3Qgd2Vla0hvdXJzID0gZ2V0V2Vla0hvdXJzRnJvbUtleSh0aGlzLmRhdGEsIHdrZXkpO1xuICAgIGNvbnN0IHdlZWtUb3RhbCA9IHdlZWtIb3Vycy5yZWR1Y2UoKGEsYikgPT4gYStiLCAwKTtcbiAgICBjb25zdCBpc1RvZGF5ID0gdGhpcy5zZWxlY3RlZERhdGUgPT09IGdldFRvZGF5S2V5KCk7XG5cbiAgICAvLyBEYXRlIHBpY2tlciByb3dcbiAgICBjb25zdCBkYXRlUm93ID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LWRhdGUtcm93JyB9KTtcbiAgICBjb25zdCBkID0gbmV3IERhdGUodGhpcy5zZWxlY3RlZERhdGUgKyAnVDEyOjAwOjAwJyk7XG4gICAgY29uc3QgZGF0ZUxhYmVsID0gZC50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUdCJywgeyB3ZWVrZGF5OiAnbG9uZycsIGRheTogJ251bWVyaWMnLCBtb250aDogJ2xvbmcnIH0pO1xuICAgIGRhdGVSb3cuY3JlYXRlRGl2KHsgY2xzOiAncHgtZGF0ZS1sYWJlbCcsIHRleHQ6IGRhdGVMYWJlbCB9KTtcbiAgICBpZiAoIWlzVG9kYXkpIHtcbiAgICAgIGNvbnN0IHRvZGF5QnRuID0gZGF0ZVJvdy5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdweC10b2RheS1idG4nLCB0ZXh0OiAnXHUyMTkwIHRvZGF5JyB9KTtcbiAgICAgIHRvZGF5QnRuLm9uY2xpY2sgPSAoKSA9PiB7IHRoaXMuc2VsZWN0ZWREYXRlID0gZ2V0VG9kYXlLZXkoKTsgdGhpcy5yZW5kZXIoKTsgfTtcbiAgICB9XG4gICAgY29uc3QgZGF0ZUlucHV0ID0gZGF0ZVJvdy5jcmVhdGVFbCgnaW5wdXQnLCB7IGNsczogJ3B4LWRhdGUtaW5wdXQnLCBhdHRyOiB7IHR5cGU6ICdkYXRlJywgdmFsdWU6IHRoaXMuc2VsZWN0ZWREYXRlIH0gfSk7XG4gICAgZGF0ZUlucHV0Lm9uY2hhbmdlID0gKGUpID0+IHtcbiAgICAgIGNvbnN0IHZhbCA9IChlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcbiAgICAgIGlmICh2YWwpIHsgdGhpcy5zZWxlY3RlZERhdGUgPSB2YWw7IHRoaXMucmVuZGVyKCk7IH1cbiAgICB9O1xuXG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LWRhdGUtc3ViJywgdGV4dDogaXNUb2RheSA/ICdMb2cgaG91cnMgZm9yIHRvZGF5IFx1MjAxNCB0aGV5IHJvbGwgdXAgaW50byB5b3VyIHdlZWtseSB0b3RhbCcgOiAnTG9nZ2luZyBmb3IgYSBwYXN0IGRheSBcdTIwMTQgaG91cnMgcm9sbCBpbnRvIHRoYXQgd2VlaycgfSk7XG5cbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2VjdGlvbicsIHRleHQ6ICdIb3VycyBieSB0aGVtZScgfSk7XG4gICAgY29uc3QgbGlzdCA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC10aGVtZXMnIH0pO1xuXG4gICAgVEhFTUVTLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICAgIGNvbnN0IHBjdCA9IHRvdGFsID4gMCA/IE1hdGgucm91bmQoaG91cnNbaV0gLyB0b3RhbCAqIDEwMCkgOiAwO1xuICAgICAgY29uc3Qgcm93ID0gbGlzdC5jcmVhdGVEaXYoeyBjbHM6ICdweC10aGVtZS1yb3cnIH0pO1xuICAgICAgcm93LmNyZWF0ZURpdih7IGNsczogJ3B4LWRvdCcsIGF0dHI6IHsgc3R5bGU6IGBiYWNrZ3JvdW5kOiR7dC5jb2x9YCB9IH0pO1xuICAgICAgcm93LmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1uYW1lJywgdGV4dDogdC5uYW1lIH0pO1xuICAgICAgY29uc3QgaGggPSByb3cuY3JlYXRlRGl2KHsgY2xzOiAncHgtaG91cnMnIH0pO1xuICAgICAgY29uc3QgbWludXNCdG4gPSBoaC5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdweC1idG4nLCB0ZXh0OiAnXHUyMjEyJyB9KTtcbiAgICAgIGhoLmNyZWF0ZVNwYW4oeyBjbHM6ICdweC1odmFsJywgdGV4dDogZm10SChob3Vyc1tpXSkgfSk7XG4gICAgICBjb25zdCBwbHVzQnRuID0gaGguY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncHgtYnRuJywgdGV4dDogJysnIH0pO1xuICAgICAgY29uc3QgYncgPSByb3cuY3JlYXRlRGl2KHsgY2xzOiAncHgtYmFyLXdyYXAnIH0pO1xuICAgICAgYncuY3JlYXRlRGl2KHsgY2xzOiAncHgtYmFyJywgYXR0cjogeyBzdHlsZTogYHdpZHRoOiR7cGN0fSU7YmFja2dyb3VuZDoke3QuY29sfWAgfSB9KTtcblxuICAgICAgbWludXNCdG4ub25jbGljayA9ICgpID0+IHtcbiAgICAgICAgdGhpcy5kYXRhID0gZW5zdXJlRGF5KHRoaXMuZGF0YSwgd2tleSwgdGhpcy5zZWxlY3RlZERhdGUpO1xuICAgICAgICB0aGlzLmRhdGFbd2tleV0uZGF5c1t0aGlzLnNlbGVjdGVkRGF0ZV0uaG91cnNbaV0gPSBNYXRoLm1heCgwLCArKHRoaXMuZGF0YVt3a2V5XS5kYXlzW3RoaXMuc2VsZWN0ZWREYXRlXS5ob3Vyc1tpXSAtIDAuNSkudG9GaXhlZCgxKSk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICB9O1xuICAgICAgcGx1c0J0bi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICB0aGlzLmRhdGEgPSBlbnN1cmVEYXkodGhpcy5kYXRhLCB3a2V5LCB0aGlzLnNlbGVjdGVkRGF0ZSk7XG4gICAgICAgIHRoaXMuZGF0YVt3a2V5XS5kYXlzW3RoaXMuc2VsZWN0ZWREYXRlXS5ob3Vyc1tpXSA9ICsodGhpcy5kYXRhW3drZXldLmRheXNbdGhpcy5zZWxlY3RlZERhdGVdLmhvdXJzW2ldICsgMC41KS50b0ZpeGVkKDEpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRvdGFsUm93ID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXRvdGFsJyB9KTtcbiAgICB0b3RhbFJvdy5jcmVhdGVTcGFuKHsgdGV4dDogaXNUb2RheSA/IFwiVG9kYXkncyB0b3RhbFwiIDogYFRvdGFsIGZvciAke2QudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1HQicsIHsgZGF5OidudW1lcmljJywgbW9udGg6J3Nob3J0JyB9KX1gIH0pO1xuICAgIHRvdGFsUm93LmNyZWF0ZVNwYW4oeyBjbHM6ICdweC10b3RhbC12YWwnLCB0ZXh0OiBmbXRIKHRvdGFsKSB9KTtcblxuICAgIGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1kaXZpZGVyJyB9KTtcbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2VjdGlvbicsIHRleHQ6IGBXZWVrIG9mICR7Z2V0V2Vla0xhYmVsKHdrZXkpfWAgfSk7XG5cbiAgICBjb25zdCByb2xsdXAgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtcm9sbHVwJyB9KTtcbiAgICBsZXQgYW55ID0gZmFsc2U7XG4gICAgVEhFTUVTLmZvckVhY2goKHQsIGkpID0+IHtcbiAgICAgIGlmICh3ZWVrSG91cnNbaV0gPT09IDApIHJldHVybjtcbiAgICAgIGFueSA9IHRydWU7XG4gICAgICBjb25zdCBjaGlwID0gcm9sbHVwLmNyZWF0ZURpdih7IGNsczogJ3B4LWNoaXAnIH0pO1xuICAgICAgY2hpcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1jaGlwLWRvdCcsIGF0dHI6IHsgc3R5bGU6IGBiYWNrZ3JvdW5kOiR7dC5jb2x9YCB9IH0pO1xuICAgICAgY2hpcC5jcmVhdGVTcGFuKHsgdGV4dDogdC5uYW1lIH0pO1xuICAgICAgY2hpcC5jcmVhdGVTcGFuKHsgY2xzOiAncHgtY2hpcC12YWwnLCB0ZXh0OiBmbXRIKHdlZWtIb3Vyc1tpXSkgfSk7XG4gICAgfSk7XG4gICAgaWYgKCFhbnkpIHJvbGx1cC5jcmVhdGVTcGFuKHsgYXR0cjogeyBzdHlsZTogJ2ZvbnQtc2l6ZToxMnB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpJyB9LCB0ZXh0OiAnTm8gaG91cnMgbG9nZ2VkIHRoaXMgd2VlayB5ZXQnIH0pO1xuXG4gICAgYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LW5vdGUtbGFiZWwnLCB0ZXh0OiBpc1RvZGF5ID8gXCJUb2RheSdzIG5vdGVcIiA6IFwiTm90ZSBmb3IgdGhpcyBkYXlcIiB9KTtcbiAgICBjb25zdCBub3RlRWwgPSBhcHAuY3JlYXRlRWwoJ3RleHRhcmVhJywgeyBjbHM6ICdweC1ub3RlJywgYXR0cjogeyBwbGFjZWhvbGRlcjogXCJXaGF0IGRpZCBJIGFjdHVhbGx5IHNwZW5kIG15IGVuZXJneSBvbiB0b2RheSBcdTIwMTQgYW5kIHdoYXQncyBzdGlycmluZz9cIiB9IH0pO1xuICAgIG5vdGVFbC52YWx1ZSA9IHRoaXMuZGF0YVt3a2V5XT8uZGF5cz8uW3RoaXMuc2VsZWN0ZWREYXRlXT8ubm90ZSB8fCAnJztcblxuICAgIGNvbnN0IHNhdmVCdG4gPSBhcHAuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAncHgtc2F2ZScsIHRleHQ6IGlzVG9kYXkgPyAnU2F2ZSB0b2RheScgOiBgU2F2ZSAke2QudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1HQicsIHsgZGF5OidudW1lcmljJywgbW9udGg6J3Nob3J0JyB9KX1gIH0pO1xuICAgIGNvbnN0IHNhdmVNc2cgPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2F2ZS1tc2cnIH0pO1xuXG4gICAgc2F2ZUJ0bi5vbmNsaWNrID0gYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5kYXRhID0gZW5zdXJlRGF5KHRoaXMuZGF0YSwgd2tleSwgdGhpcy5zZWxlY3RlZERhdGUpO1xuICAgICAgdGhpcy5kYXRhW3drZXldLmRheXNbdGhpcy5zZWxlY3RlZERhdGVdLm5vdGUgPSBub3RlRWwudmFsdWU7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgICAgc2F2ZUJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgc2F2ZU1zZy50ZXh0Q29udGVudCA9ICdTYXZlZCBcdTI3MTMnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHNhdmVNc2cudGV4dENvbnRlbnQgPSAnJzsgfSwgMjAwMCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBhcHAuY3JlYXRlRWwoJ2EnLCB7IGNsczogJ3B4LW5vdGUtbGluaycsIHRleHQ6IFwiXHUyMTkyIE9wZW4gdGhpcyB3ZWVrJ3Mgbm90ZSBpbiB2YXVsdFwiLCBhdHRyOiB7IGhyZWY6ICcjJyB9IH0pXG4gICAgICAub25jbGljayA9IGFzeW5jIChlKSA9PiB7IGUucHJldmVudERlZmF1bHQoKTsgYXdhaXQgdGhpcy5wbHVnaW4ub3BlbldlZWtOb3RlKHdrZXkpOyB9O1xuICB9XG5cbiAgcmVuZGVyV2VlayhhcHA6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgbmF2ID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXdlZWstbmF2JyB9KTtcbiAgICBjb25zdCBwcmV2QnRuID0gbmF2LmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3B4LW5hdi1idG4nLCB0ZXh0OiAnXHUyMDM5JyB9KTtcbiAgICBjb25zdCB3a2V5ID0gZ2V0V2Vla0tleSh0aGlzLndlZWtPZmZzZXQpO1xuICAgIG5hdi5jcmVhdGVTcGFuKHsgY2xzOiAncHgtd2Vlay1sYWJlbCcsIHRleHQ6IGdldFdlZWtMYWJlbCh3a2V5KSB9KTtcbiAgICBjb25zdCBwaWxsID0gdGhpcy53ZWVrT2Zmc2V0ID09PSAwID8gJ3RoaXMgd2VlaycgOiB0aGlzLndlZWtPZmZzZXQgPT09IC0xID8gJ2xhc3Qgd2VlaycgOiBgJHtNYXRoLmFicyh0aGlzLndlZWtPZmZzZXQpfSB3ZWVrcyBhZ29gO1xuICAgIG5hdi5jcmVhdGVTcGFuKHsgY2xzOiAncHgtd2Vlay1waWxsJywgdGV4dDogcGlsbCB9KTtcbiAgICBjb25zdCBuZXh0QnRuID0gbmF2LmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3B4LW5hdi1idG4nLCB0ZXh0OiAnXHUyMDNBJyB9KTtcbiAgICBpZiAodGhpcy53ZWVrT2Zmc2V0ID49IDApIG5leHRCdG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgIHByZXZCdG4ub25jbGljayA9ICgpID0+IHsgdGhpcy53ZWVrT2Zmc2V0LS07IHRoaXMucmVuZGVyKCk7IH07XG4gICAgbmV4dEJ0bi5vbmNsaWNrID0gKCkgPT4geyBpZiAodGhpcy53ZWVrT2Zmc2V0IDwgMCkgeyB0aGlzLndlZWtPZmZzZXQrKzsgdGhpcy5yZW5kZXIoKTsgfSB9O1xuXG4gICAgY29uc3QgaG91cnMgPSBnZXRXZWVrSG91cnModGhpcy5kYXRhLCB0aGlzLndlZWtPZmZzZXQpO1xuICAgIGNvbnN0IHRvdGFsID0gaG91cnMucmVkdWNlKChhLGIpID0+IGErYiwgMCk7XG5cbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2VjdGlvbicsIHRleHQ6ICdIb3VycyBieSB0aGVtZScgfSk7XG4gICAgY29uc3QgbGlzdCA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC10aGVtZXMnIH0pO1xuICAgIFRIRU1FUy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgICBjb25zdCBwY3QgPSB0b3RhbCA+IDAgPyBNYXRoLnJvdW5kKGhvdXJzW2ldIC8gdG90YWwgKiAxMDApIDogMDtcbiAgICAgIGNvbnN0IHJvdyA9IGxpc3QuY3JlYXRlRGl2KHsgY2xzOiAncHgtdGhlbWUtcm93JyB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoeyBjbHM6ICdweC1kb3QnLCBhdHRyOiB7IHN0eWxlOiBgYmFja2dyb3VuZDoke3QuY29sfWAgfSB9KTtcbiAgICAgIHJvdy5jcmVhdGVTcGFuKHsgY2xzOiAncHgtbmFtZScsIHRleHQ6IHQubmFtZSB9KTtcbiAgICAgIHJvdy5jcmVhdGVEaXYoeyBjbHM6ICdweC1ob3VycycgfSkuY3JlYXRlU3Bhbih7IGNsczogJ3B4LWh2YWwnLCB0ZXh0OiBmbXRIKGhvdXJzW2ldKSB9KTtcbiAgICAgIGNvbnN0IGJ3ID0gcm93LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhci13cmFwJyB9KTtcbiAgICAgIGJ3LmNyZWF0ZURpdih7IGNsczogJ3B4LWJhcicsIGF0dHI6IHsgc3R5bGU6IGB3aWR0aDoke3BjdH0lO2JhY2tncm91bmQ6JHt0LmNvbH1gIH0gfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b3RhbFJvdyA9IGFwcC5jcmVhdGVEaXYoeyBjbHM6ICdweC10b3RhbCcgfSk7XG4gICAgdG90YWxSb3cuY3JlYXRlU3Bhbih7IHRleHQ6ICdUb3RhbCBsb2dnZWQgdGhpcyB3ZWVrJyB9KTtcbiAgICB0b3RhbFJvdy5jcmVhdGVTcGFuKHsgY2xzOiAncHgtdG90YWwtdmFsJywgdGV4dDogZm10SCh0b3RhbCkgfSk7XG5cbiAgICBjb25zdCB0d28gPSBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtdHdvLWNvbCcgfSk7XG4gICAgdGhpcy5yZW5kZXJEb251dCh0d28sIGhvdXJzLCB0b3RhbCk7XG4gICAgdGhpcy5yZW5kZXJIaXN0b3J5KHR3byk7XG5cbiAgICBhcHAuY3JlYXRlRGl2KHsgY2xzOiAncHgtbm90ZS1sYWJlbCcsIHRleHQ6ICdXZWVrIG5vdGUnIH0pO1xuICAgIGNvbnN0IG5vdGVFbCA9IGFwcC5jcmVhdGVFbCgndGV4dGFyZWEnLCB7IGNsczogJ3B4LW5vdGUnLCBhdHRyOiB7IHBsYWNlaG9sZGVyOiBcIldoYXQgbW92ZWQgdGhpcyB3ZWVrPyBXaGF0IGFtIEkgZGlzdGlsbGluZz8gV2hhdCBkbyBJIHdhbnQgSW1pciB0byBrbm93P1wiIH0gfSk7XG4gICAgbm90ZUVsLnZhbHVlID0gdGhpcy5kYXRhW3drZXldPy5ub3RlIHx8ICcnO1xuXG4gICAgY29uc3Qgc2F2ZUJ0biA9IGFwcC5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdweC1zYXZlJywgdGV4dDogJ1NhdmUgdGhpcyB3ZWVrJyB9KTtcbiAgICBjb25zdCBzYXZlTXNnID0gYXBwLmNyZWF0ZURpdih7IGNsczogJ3B4LXNhdmUtbXNnJyB9KTtcblxuICAgIHNhdmVCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghdGhpcy5kYXRhW3drZXldKSB0aGlzLmRhdGFbd2tleV0gPSB7IGRheXM6IHt9LCBub3RlOiAnJyB9O1xuICAgICAgdGhpcy5kYXRhW3drZXldLm5vdGUgPSBub3RlRWwudmFsdWU7XG4gICAgICBzYXZlQnRuLmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVEYXRhXyh0aGlzLmRhdGEpO1xuICAgICAgYXdhaXQgdGhpcy5wbHVnaW4ud3JpdGVXZWVrTm90ZSh0aGlzLmRhdGEsIHdrZXkpO1xuICAgICAgc2F2ZUJ0bi5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgc2F2ZU1zZy50ZXh0Q29udGVudCA9ICdTYXZlZCBcdTI3MTMnO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHNhdmVNc2cudGV4dENvbnRlbnQgPSAnJzsgfSwgMjAwMCk7XG4gICAgfTtcblxuICAgIGFwcC5jcmVhdGVFbCgnYScsIHsgY2xzOiAncHgtbm90ZS1saW5rJywgdGV4dDogXCJcdTIxOTIgT3BlbiB0aGlzIHdlZWsncyBub3RlIGluIHZhdWx0XCIsIGF0dHI6IHsgaHJlZjogJyMnIH0gfSlcbiAgICAgIC5vbmNsaWNrID0gYXN5bmMgKGUpID0+IHsgZS5wcmV2ZW50RGVmYXVsdCgpOyBhd2FpdCB0aGlzLnBsdWdpbi5vcGVuV2Vla05vdGUod2tleSk7IH07XG4gIH1cblxuICByZW5kZXJEb251dChjb250YWluZXI6IEhUTUxFbGVtZW50LCBob3VyczogbnVtYmVyW10sIHRvdGFsOiBudW1iZXIpIHtcbiAgICBjb25zdCBwYW5lbCA9IGNvbnRhaW5lci5jcmVhdGVEaXYoeyBjbHM6ICdweC1wYW5lbCcgfSk7XG4gICAgcGFuZWwuY3JlYXRlRGl2KHsgY2xzOiAncHgtc2VjdGlvbicsIHRleHQ6ICdEaXN0cmlidXRpb24nIH0pO1xuICAgIGNvbnN0IHdyYXAgPSBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6ICdweC1kb251dC13cmFwJyB9KTtcbiAgICBjb25zdCBzdmcgPSB3cmFwLmNyZWF0ZVN2Zygnc3ZnJywgeyBhdHRyOiB7IHdpZHRoOiAnOTAnLCBoZWlnaHQ6ICc5MCcsIHZpZXdCb3g6ICcwIDAgOTAgOTAnIH0gfSk7XG4gICAgY29uc3QgY2VudGVyID0gd3JhcC5jcmVhdGVEaXYoeyBjbHM6ICdweC1kb251dC1jZW50ZXInIH0pO1xuXG4gICAgaWYgKHRvdGFsID09PSAwKSB7XG4gICAgICBzdmcuY3JlYXRlU3ZnKCdjaXJjbGUnLCB7IGF0dHI6IHsgY3g6JzQ1JywgY3k6JzQ1JywgcjonMzQnLCBmaWxsOidub25lJywgc3Ryb2tlOid2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlciknLCAnc3Ryb2tlLXdpZHRoJzonMTEnIH0gfSk7XG4gICAgICBjZW50ZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtYmlnJywgdGV4dDogJ1x1MjAxNCcgfSk7XG4gICAgICBjZW50ZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtc21hbGwnLCB0ZXh0OiAnbG9nIGhvdXJzJyB9KTtcbiAgICAgIHBhbmVsLmNyZWF0ZURpdih7IGNsczogJ3B4LWxlZ2VuZCcgfSkuY3JlYXRlRGl2KHsgYXR0cjogeyBzdHlsZTogJ2ZvbnQtc2l6ZToxMXB4O2NvbG9yOnZhcigtLXRleHQtbXV0ZWQpJyB9LCB0ZXh0OiAnTm8gZGF0YSB5ZXQnIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN4PTQ1LCBjeT00NSwgcj0zNCwgc3c9MTE7XG4gICAgY29uc3QgY2lyYyA9IDIgKiBNYXRoLlBJICogcjtcbiAgICBsZXQgb2Zmc2V0ID0gMDtcbiAgICBjb25zdCBtYXhJZHggPSBob3Vycy5pbmRleE9mKE1hdGgubWF4KC4uLmhvdXJzKSk7XG4gICAgaG91cnMuZm9yRWFjaCgoaCwgaSkgPT4ge1xuICAgICAgaWYgKGggPT09IDApIHJldHVybjtcbiAgICAgIGNvbnN0IHBjdCA9IGgvdG90YWwsIGRhc2ggPSBwY3QqY2lyYywgZ2FwID0gY2lyYy1kYXNoO1xuICAgICAgc3ZnLmNyZWF0ZVN2ZygnY2lyY2xlJywgeyBhdHRyOiB7IGN4OlN0cmluZyhjeCksIGN5OlN0cmluZyhjeSksIHI6U3RyaW5nKHIpLCBmaWxsOidub25lJywgc3Ryb2tlOlRIRU1FU1tpXS5jb2wsICdzdHJva2Utd2lkdGgnOlN0cmluZyhzdyksICdzdHJva2UtZGFzaGFycmF5JzpgJHtkYXNoLnRvRml4ZWQoMil9ICR7Z2FwLnRvRml4ZWQoMil9YCwgJ3N0cm9rZS1kYXNob2Zmc2V0JzpgJHsoLShvZmZzZXQqY2lyYykrY2lyYy80KS50b0ZpeGVkKDIpfWAgfX0pO1xuICAgICAgb2Zmc2V0ICs9IHBjdDtcbiAgICB9KTtcbiAgICBjZW50ZXIuY3JlYXRlRGl2KHsgY2xzOiAncHgtZG9udXQtYmlnJywgdGV4dDogYCR7TWF0aC5yb3VuZChob3Vyc1ttYXhJZHhdL3RvdGFsKjEwMCl9JWAgfSk7XG4gICAgY2VudGVyLmNyZWF0ZURpdih7IGNsczogJ3B4LWRvbnV0LXNtYWxsJywgdGV4dDogVEhFTUVTW21heElkeF0ubmFtZS5zcGxpdCgnICcpWzBdLnRvTG93ZXJDYXNlKCkgfSk7XG5cbiAgICBjb25zdCBsZWdlbmQgPSBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6ICdweC1sZWdlbmQnIH0pO1xuICAgIFRIRU1FUy5mb3JFYWNoKCh0LCBpKSA9PiB7XG4gICAgICBjb25zdCBwY3QgPSB0b3RhbCA+IDAgPyBNYXRoLnJvdW5kKGhvdXJzW2ldL3RvdGFsKjEwMCkgOiAwO1xuICAgICAgaWYgKHBjdCA9PT0gMCkgcmV0dXJuO1xuICAgICAgY29uc3QgaXRlbSA9IGxlZ2VuZC5jcmVhdGVEaXYoeyBjbHM6ICdweC1sZWdlbmQtaXRlbScgfSk7XG4gICAgICBpdGVtLmNyZWF0ZURpdih7IGNsczogJ3B4LWxlZ2VuZC1kb3QnLCBhdHRyOiB7IHN0eWxlOiBgYmFja2dyb3VuZDoke3QuY29sfWAgfSB9KTtcbiAgICAgIGl0ZW0uY3JlYXRlU3Bhbih7IGNsczogJ3B4LWxlZ2VuZC1uYW1lJywgdGV4dDogdC5uYW1lIH0pO1xuICAgICAgaXRlbS5jcmVhdGVTcGFuKHsgY2xzOiAncHgtbGVnZW5kLXBjdCcsIHRleHQ6IGAke3BjdH0lYCB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlckhpc3RvcnkoY29udGFpbmVyOiBIVE1MRWxlbWVudCkge1xuICAgIGNvbnN0IHBhbmVsID0gY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3B4LXBhbmVsJyB9KTtcbiAgICBwYW5lbC5jcmVhdGVEaXYoeyBjbHM6ICdweC1zZWN0aW9uJywgdGV4dDogJ1Bhc3QgOCB3ZWVrcycgfSk7XG4gICAgY29uc3Qgd3JhcCA9IHBhbmVsLmNyZWF0ZURpdih7IGNsczogJ3B4LWhpc3QnIH0pO1xuXG4gICAgY29uc3Qgd2Vla3MgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gLTc7IGkgPD0gMDsgaSsrKSB3ZWVrcy5wdXNoKHsga2V5OiBnZXRXZWVrS2V5KGkpLCBvZmZzZXQ6IGkgfSk7XG4gICAgY29uc3QgdG90YWxzID0gd2Vla3MubWFwKHcgPT4gZ2V0V2Vla0hvdXJzKHRoaXMuZGF0YSwgdy5vZmZzZXQpLnJlZHVjZSgoYSxiKSA9PiBhK2IsIDApKTtcbiAgICBjb25zdCBtYXhUb3RhbCA9IE1hdGgubWF4KC4uLnRvdGFscywgMSk7XG5cbiAgICB3ZWVrcy5mb3JFYWNoKCh3KSA9PiB7XG4gICAgICBjb25zdCBob3VycyA9IGdldFdlZWtIb3Vycyh0aGlzLmRhdGEsIHcub2Zmc2V0KTtcbiAgICAgIGNvbnN0IHRvdGFsID0gdG90YWxzW3cub2Zmc2V0ICsgN107XG4gICAgICBjb25zdCBoZWlnaHRQeCA9IHRvdGFsID4gMCA/IE1hdGgubWF4KE1hdGgucm91bmQodG90YWwvbWF4VG90YWwqNjQpLCA0KSA6IDM7XG4gICAgICBjb25zdCBpc0N1cnJlbnQgPSB3Lm9mZnNldCA9PT0gdGhpcy53ZWVrT2Zmc2V0O1xuXG4gICAgICBjb25zdCBjb2wgPSB3cmFwLmNyZWF0ZURpdih7IGNsczogYHB4LWhpc3QtY29sJHtpc0N1cnJlbnQ/JyBjdXJyZW50JzonJ31gIH0pO1xuICAgICAgY29uc3Qgc3RhY2sgPSBjb2wuY3JlYXRlRGl2KHsgY2xzOiBgcHgtaGlzdC1zdGFjayR7dG90YWw9PT0wPycgcHgtaGlzdC1lbXB0eSc6Jyd9YCB9KTtcbiAgICAgIHN0YWNrLnN0eWxlLmhlaWdodCA9IGAke2hlaWdodFB4fXB4YDtcblxuICAgICAgaWYgKHRvdGFsID4gMCkge1xuICAgICAgICBUSEVNRVMuZm9yRWFjaCgodCwgaSkgPT4ge1xuICAgICAgICAgIGlmIChob3Vyc1tpXSA9PT0gMCkgcmV0dXJuO1xuICAgICAgICAgIGNvbnN0IHNlZyA9IHN0YWNrLmNyZWF0ZURpdih7IGNsczogJ3B4LWhpc3Qtc2VnJyB9KTtcbiAgICAgICAgICBzZWcuc3R5bGUuYmFja2dyb3VuZCA9IHQuY29sO1xuICAgICAgICAgIHNlZy5zdHlsZS5oZWlnaHQgPSBgJHtNYXRoLm1heChNYXRoLnJvdW5kKGhvdXJzW2ldL3RvdGFsKmhlaWdodFB4KSwgMSl9cHhgO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKHcua2V5ICsgJ1QxMjowMDowMCcpO1xuICAgICAgY29sLmNyZWF0ZURpdih7IGNsczogJ3B4LWhpc3QtbGJsJywgdGV4dDogZC50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUdCJywgeyBkYXk6J251bWVyaWMnLCBtb250aDonc2hvcnQnIH0pIH0pO1xuICAgICAgY29sLm9uY2xpY2sgPSAoKSA9PiB7IHRoaXMud2Vla09mZnNldCA9IHcub2Zmc2V0OyB0aGlzLmFjdGl2ZVRhYiA9ICd3ZWVrJzsgdGhpcy5yZW5kZXIoKTsgfTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQWFRyYWNrZXJQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgdGhpcy5yZWdpc3RlclZpZXcoVklFV19UWVBFLCAobGVhZikgPT4gbmV3IFBYVHJhY2tlclZpZXcobGVhZiwgdGhpcykpO1xuICAgIHRoaXMuYWRkUmliYm9uSWNvbigndGltZXInLCAnUFggVHJhY2tlcicsICgpID0+IHRoaXMuYWN0aXZhdGVWaWV3KCkpO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7IGlkOiAnb3Blbi1weC10cmFja2VyJywgbmFtZTogJ09wZW4gUFggVHJhY2tlcicsIGNhbGxiYWNrOiAoKSA9PiB0aGlzLmFjdGl2YXRlVmlldygpIH0pO1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKCdQWCBUcmFja2VyJyk7XG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoTk9URVNfRk9MREVSKTtcbiAgfVxuXG4gIG9udW5sb2FkKCkgeyB0aGlzLmFwcC53b3Jrc3BhY2UuZGV0YWNoTGVhdmVzT2ZUeXBlKFZJRVdfVFlQRSk7IH1cblxuICBhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLmRldGFjaExlYXZlc09mVHlwZShWSUVXX1RZUEUpO1xuICAgIGNvbnN0IGxlYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0UmlnaHRMZWFmKGZhbHNlKTtcbiAgICBpZiAobGVhZikgeyBhd2FpdCBsZWFmLnNldFZpZXdTdGF0ZSh7IHR5cGU6IFZJRVdfVFlQRSwgYWN0aXZlOiB0cnVlIH0pOyB0aGlzLmFwcC53b3Jrc3BhY2UucmV2ZWFsTGVhZihsZWFmKTsgfVxuICB9XG5cbiAgYXN5bmMgZW5zdXJlRm9sZGVyKHBhdGg6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGVGb2xkZXIocGF0aCk7XG4gIH1cblxuICBhc3luYyBsb2FkRGF0YV8oKTogUHJvbWlzZTxUcmFja2VyRGF0YT4ge1xuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoREFUQV9GSUxFKTtcbiAgICBpZiAoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZShhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKGZpbGUpKTsgfSBjYXRjaCB7IHJldHVybiB7fTsgfVxuICAgIH1cbiAgICByZXR1cm4ge307XG4gIH1cblxuICBhc3luYyBzYXZlRGF0YV8oZGF0YTogVHJhY2tlckRhdGEpIHtcbiAgICAvLyBNZXJnZSB3aXRoIGV4aXN0aW5nIHRvIG5ldmVyIGxvc2UgZGF0YVxuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5sb2FkRGF0YV8oKTtcbiAgICBjb25zdCBtZXJnZWQ6IFRyYWNrZXJEYXRhID0geyAuLi5leGlzdGluZyB9O1xuICAgIGZvciAoY29uc3Qgd2tleSBvZiBPYmplY3Qua2V5cyhkYXRhKSkge1xuICAgICAgaWYgKCFtZXJnZWRbd2tleV0pIHsgbWVyZ2VkW3drZXldID0gZGF0YVt3a2V5XTsgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIG1lcmdlZFt3a2V5XS5ub3RlID0gZGF0YVt3a2V5XS5ub3RlIHx8IG1lcmdlZFt3a2V5XS5ub3RlO1xuICAgICAgICBtZXJnZWRbd2tleV0uZGF5cyA9IHsgLi4ubWVyZ2VkW3drZXldLmRheXMsIC4uLmRhdGFbd2tleV0uZGF5cyB9O1xuICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkobWVyZ2VkLCBudWxsLCAyKTtcbiAgICAvLyBXcml0ZSBiYWNrdXAgZmlyc3RcbiAgICBjb25zdCBiYWNrdXAgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoQkFDS1VQX0ZJTEUpO1xuICAgIGNvbnN0IG1haW5GaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKERBVEFfRklMRSk7XG4gICAgaWYgKG1haW5GaWxlIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkKG1haW5GaWxlKTtcbiAgICAgIGlmIChiYWNrdXAgaW5zdGFuY2VvZiBURmlsZSkgYXdhaXQgdGhpcy5hcHAudmF1bHQubW9kaWZ5KGJhY2t1cCwgY3VycmVudCk7XG4gICAgICBlbHNlIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZShCQUNLVVBfRklMRSwgY3VycmVudCk7XG4gICAgfVxuICAgIC8vIFdyaXRlIG1haW4gZmlsZVxuICAgIGlmIChtYWluRmlsZSBpbnN0YW5jZW9mIFRGaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkobWFpbkZpbGUsIGpzb24pO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKERBVEFfRklMRSwganNvbik7XG4gIH1cblxuICBhc3luYyB3cml0ZVdlZWtOb3RlKGRhdGE6IFRyYWNrZXJEYXRhLCB3a2V5OiBzdHJpbmcpIHtcbiAgICBjb25zdCBlbnRyeSA9IGRhdGFbd2tleV07XG4gICAgaWYgKCFlbnRyeSkgcmV0dXJuO1xuICAgIGNvbnN0IGhvdXJzID0gZ2V0V2Vla0hvdXJzRnJvbUtleShkYXRhLCB3a2V5KTtcbiAgICBjb25zdCB0b3RhbCA9IGhvdXJzLnJlZHVjZSgoYSxiKSA9PiBhK2IsIDApO1xuICAgIGxldCBjb250ZW50ID0gYCMgV2VlayBvZiAke2dldFdlZWtMYWJlbCh3a2V5KX1cXG5cXG4jIyBIb3Vyc1xcblxcbmA7XG4gICAgVEhFTUVTLmZvckVhY2goKHQsIGkpID0+IHsgaWYgKGhvdXJzW2ldID4gMCkgY29udGVudCArPSBgLSAqKiR7dC5uYW1lfSoqOiAke2ZtdEgoaG91cnNbaV0pfVxcbmA7IH0pO1xuICAgIGNvbnRlbnQgKz0gYFxcbioqVG90YWwqKjogJHtmbXRIKHRvdGFsKX1cXG5cXG5gO1xuICAgIGlmIChlbnRyeS5ub3RlKSBjb250ZW50ICs9IGAjIyBXZWVrIHJlZmxlY3Rpb25cXG5cXG4ke2VudHJ5Lm5vdGV9XFxuXFxuYDtcbiAgICBjb25zdCBkYXlLZXlzID0gT2JqZWN0LmtleXMoZW50cnkuZGF5cyB8fCB7fSkuc29ydCgpO1xuICAgIGlmIChkYXlLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnRlbnQgKz0gYCMjIERhaWx5IG5vdGVzXFxuXFxuYDtcbiAgICAgIGRheUtleXMuZm9yRWFjaChka2V5ID0+IHtcbiAgICAgICAgY29uc3QgZGF5ID0gZW50cnkuZGF5c1tka2V5XTtcbiAgICAgICAgaWYgKGRheS5ub3RlKSB7XG4gICAgICAgICAgY29uc3QgZCA9IG5ldyBEYXRlKGRrZXkgKyAnVDEyOjAwOjAwJyk7XG4gICAgICAgICAgY29udGVudCArPSBgIyMjICR7ZC50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLUdCJywgeyB3ZWVrZGF5Oidsb25nJywgZGF5OidudW1lcmljJywgbW9udGg6J3Nob3J0JyB9KX1cXG5cXG4ke2RheS5ub3RlfVxcblxcbmA7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBjb25zdCBub3RlUGF0aCA9IGAke05PVEVTX0ZPTERFUn0vJHt3a2V5fS5tZGA7XG4gICAgY29uc3QgZXhpc3RpbmcgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm90ZVBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSBhd2FpdCB0aGlzLmFwcC52YXVsdC5tb2RpZnkoZXhpc3RpbmcsIGNvbnRlbnQpO1xuICAgIGVsc2UgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKG5vdGVQYXRoLCBjb250ZW50KTtcbiAgfVxuXG4gIGFzeW5jIG9wZW5XZWVrTm90ZSh3a2V5OiBzdHJpbmcpIHtcbiAgICBjb25zdCBub3RlUGF0aCA9IGAke05PVEVTX0ZPTERFUn0vJHt3a2V5fS5tZGA7XG4gICAgbGV0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgobm90ZVBhdGgpO1xuICAgIGlmICghZmlsZSkgeyBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5sb2FkRGF0YV8oKTsgYXdhaXQgdGhpcy53cml0ZVdlZWtOb3RlKGRhdGEsIHdrZXkpOyBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKG5vdGVQYXRoKTsgfVxuICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUpIHsgY29uc3QgbGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpOyBhd2FpdCBsZWFmLm9wZW5GaWxlKGZpbGUpOyB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFBNEQ7QUFFNUQsSUFBTSxZQUFZO0FBQ2xCLElBQU0sWUFBWTtBQUNsQixJQUFNLGNBQWM7QUFDcEIsSUFBTSxlQUFlO0FBRXJCLElBQU0sU0FBUztBQUFBLEVBQ2IsRUFBRSxJQUFJLE1BQU0sTUFBTSxlQUF1QixLQUFLLFVBQVU7QUFBQSxFQUN4RCxFQUFFLElBQUksTUFBTSxNQUFNLHVCQUF3QixLQUFLLFVBQVU7QUFBQSxFQUN6RCxFQUFFLElBQUksTUFBTSxNQUFNLG1CQUF3QixLQUFLLFVBQVU7QUFBQSxFQUN6RCxFQUFFLElBQUksTUFBTSxNQUFNLG9CQUF3QixLQUFLLFVBQVU7QUFBQSxFQUN6RCxFQUFFLElBQUksTUFBTSxNQUFNLHdCQUF3QixLQUFLLFVBQVU7QUFBQSxFQUN6RCxFQUFFLElBQUksTUFBTSxNQUFNLFlBQXdCLEtBQUssVUFBVTtBQUMzRDtBQU1BLFNBQVMsS0FBSyxHQUFtQjtBQUMvQixTQUFPLElBQUksTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNoRDtBQUVBLFNBQVMsYUFBYSxHQUFpQjtBQUNyQyxRQUFNLElBQUksRUFBRSxZQUFZO0FBQ3hCLFFBQU0sSUFBSSxPQUFPLEVBQUUsU0FBUyxJQUFJLENBQUMsRUFBRSxTQUFTLEdBQUcsR0FBRztBQUNsRCxRQUFNLE1BQU0sT0FBTyxFQUFFLFFBQVEsQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQy9DLFNBQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUc7QUFDekI7QUFFQSxTQUFTLGdCQUFnQixTQUF5QjtBQUNoRCxRQUFNLElBQUksb0JBQUksS0FBSyxVQUFVLFdBQVc7QUFDeEMsUUFBTSxNQUFNLEVBQUUsT0FBTztBQUNyQixRQUFNLGNBQWMsUUFBUSxJQUFJLElBQUksTUFBTTtBQUMxQyxJQUFFLFFBQVEsRUFBRSxRQUFRLElBQUksV0FBVztBQUNuQyxTQUFPLGFBQWEsQ0FBQztBQUN2QjtBQUVBLFNBQVMsVUFBVSxjQUFjLEdBQVM7QUFDeEMsUUFBTSxJQUFJLG9CQUFJLEtBQUs7QUFDbkIsUUFBTSxNQUFNLEVBQUUsT0FBTztBQUNyQixRQUFNLGNBQWMsUUFBUSxJQUFJLElBQUksTUFBTTtBQUMxQyxJQUFFLFFBQVEsRUFBRSxRQUFRLElBQUksY0FBYyxjQUFjLENBQUM7QUFDckQsSUFBRSxTQUFTLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDckIsU0FBTztBQUNUO0FBRUEsU0FBUyxXQUFXLGNBQWMsR0FBVztBQUFFLFNBQU8sYUFBYSxVQUFVLFdBQVcsQ0FBQztBQUFHO0FBQzVGLFNBQVMsY0FBc0I7QUFBRSxTQUFPLGFBQWEsb0JBQUksS0FBSyxDQUFDO0FBQUc7QUFFbEUsU0FBUyxhQUFhLFdBQTJCO0FBQy9DLFFBQU0sTUFBTSxvQkFBSSxLQUFLLFlBQVksV0FBVztBQUM1QyxRQUFNLE1BQU0sSUFBSSxLQUFLLEdBQUc7QUFBRyxNQUFJLFFBQVEsSUFBSSxRQUFRLElBQUksQ0FBQztBQUN4RCxRQUFNLE1BQU0sQ0FBQyxNQUFZLEVBQUUsbUJBQW1CLFNBQVMsRUFBRSxLQUFLLFdBQVcsT0FBTyxRQUFRLENBQUM7QUFDekYsU0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLFdBQU0sSUFBSSxHQUFHLENBQUM7QUFDbEM7QUFFQSxTQUFTLG9CQUFvQixNQUFtQixNQUF3QjtBQUN0RSxRQUFNLFFBQVEsS0FBSyxJQUFJO0FBQ3ZCLE1BQUksRUFBQywrQkFBTyxTQUFRLE9BQU8sS0FBSyxNQUFNLElBQUksRUFBRSxXQUFXLEVBQUcsUUFBTyxPQUFPLElBQUksTUFBTSxDQUFDO0FBQ25GLFNBQU8sT0FBTyxJQUFJLENBQUMsR0FBRyxNQUFNLE9BQU8sT0FBTyxNQUFNLElBQUksRUFBRSxPQUFPLENBQUMsS0FBSyxRQUFRLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQztBQUMxRztBQUVBLFNBQVMsYUFBYSxNQUFtQixjQUFjLEdBQWE7QUFDbEUsU0FBTyxvQkFBb0IsTUFBTSxXQUFXLFdBQVcsQ0FBQztBQUMxRDtBQUVBLFNBQVMsWUFBWSxNQUFtQixNQUFjLE1BQXdCO0FBcEU5RTtBQXFFRSxXQUFPLHNCQUFLLElBQUksTUFBVCxtQkFBWSxTQUFaLG1CQUFtQixVQUFuQixtQkFBMEIsVUFBUyxPQUFPLElBQUksTUFBTSxDQUFDO0FBQzlEO0FBRUEsU0FBUyxVQUFVLE1BQW1CLE1BQWMsTUFBMkI7QUFDN0UsTUFBSSxDQUFDLEtBQUssSUFBSSxFQUFHLE1BQUssSUFBSSxJQUFJLEVBQUUsTUFBTSxDQUFDLEdBQUcsTUFBTSxHQUFHO0FBQ25ELE1BQUksQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFNLE1BQUssSUFBSSxFQUFFLE9BQU8sQ0FBQztBQUN6QyxNQUFJLENBQUMsS0FBSyxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUcsTUFBSyxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxPQUFPLE9BQU8sSUFBSSxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUc7QUFDM0YsU0FBTztBQUNUO0FBRUEsSUFBTSxnQkFBTixjQUE0Qix5QkFBUztBQUFBLEVBT25DLFlBQVksTUFBcUIsUUFBeUI7QUFDeEQsVUFBTSxJQUFJO0FBUFo7QUFDQSxnQ0FBb0IsQ0FBQztBQUNyQixxQ0FBOEI7QUFDOUIsc0NBQWE7QUFDYix3Q0FBdUIsWUFBWTtBQUlqQyxTQUFLLFNBQVM7QUFBQSxFQUNoQjtBQUFBLEVBRUEsY0FBYztBQUFFLFdBQU87QUFBQSxFQUFXO0FBQUEsRUFDbEMsaUJBQWlCO0FBQUUsV0FBTztBQUFBLEVBQWM7QUFBQSxFQUN4QyxVQUFVO0FBQUUsV0FBTztBQUFBLEVBQVM7QUFBQSxFQUU1QixNQUFNLFNBQVM7QUFDYixTQUFLLE9BQU8sTUFBTSxLQUFLLE9BQU8sVUFBVSxLQUFLLENBQUM7QUFDOUMsU0FBSyxPQUFPO0FBQUEsRUFDZDtBQUFBLEVBRUEsTUFBTSxVQUFVO0FBQUEsRUFBQztBQUFBLEVBRWpCLE1BQU0sT0FBTztBQUNYLFVBQU0sS0FBSyxPQUFPLFVBQVUsS0FBSyxJQUFJO0FBQ3JDLFVBQU0sT0FBTyxnQkFBZ0IsS0FBSyxZQUFZO0FBQzlDLFVBQU0sS0FBSyxPQUFPLGNBQWMsS0FBSyxNQUFNLElBQUk7QUFBQSxFQUNqRDtBQUFBLEVBRUEsU0FBUztBQUNQLFVBQU0sT0FBTyxLQUFLLFlBQVksU0FBUyxDQUFDO0FBQ3hDLFNBQUssTUFBTTtBQUNYLFNBQUssTUFBTSxVQUFVO0FBQ3JCLFVBQU0sTUFBTSxLQUFLLFVBQVUsRUFBRSxLQUFLLFNBQVMsQ0FBQztBQUM1QyxTQUFLLGFBQWEsSUFBSTtBQUN0QixTQUFLLGFBQWEsR0FBRztBQUNyQixTQUFLLFdBQVcsR0FBRztBQUNuQixRQUFJLEtBQUssY0FBYyxRQUFTLE1BQUssWUFBWSxHQUFHO0FBQUEsUUFDL0MsTUFBSyxXQUFXLEdBQUc7QUFBQSxFQUMxQjtBQUFBLEVBRUEsYUFBYSxNQUFtQjtBQUM5QixVQUFNLFdBQVcsS0FBSyxjQUFjLFlBQVk7QUFDaEQsUUFBSSxTQUFVLFVBQVMsT0FBTztBQUM5QixVQUFNLFFBQVEsS0FBSyxTQUFTLFNBQVMsRUFBRSxNQUFNLEVBQUUsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUNsRSxVQUFNLGNBQWM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUF3RXRCO0FBQUEsRUFFQSxhQUFhLEtBQWtCO0FBQzdCLFFBQUksU0FBUyxNQUFNLEVBQUUsS0FBSyxTQUFTLE1BQU0scUJBQXFCLENBQUM7QUFDL0QsUUFBSSxVQUFVLEVBQUUsS0FBSyxVQUFVLE1BQU0sK0NBQTRDLENBQUM7QUFBQSxFQUNwRjtBQUFBLEVBRUEsV0FBVyxLQUFrQjtBQUMzQixVQUFNLGFBQWEsWUFBWSxLQUFLLE1BQU0sZ0JBQWdCLFlBQVksQ0FBQyxHQUFHLFlBQVksQ0FBQztBQUN2RixVQUFNLGFBQWEsV0FBVyxPQUFPLENBQUMsR0FBRSxNQUFNLElBQUUsR0FBRyxDQUFDO0FBQ3BELFVBQU0sWUFBWSxhQUFhLEtBQUssTUFBTSxDQUFDO0FBQzNDLFVBQU0sWUFBWSxVQUFVLE9BQU8sQ0FBQyxHQUFFLE1BQU0sSUFBRSxHQUFHLENBQUM7QUFFbEQsVUFBTSxPQUFPLElBQUksVUFBVSxFQUFFLEtBQUssVUFBVSxDQUFDO0FBQzdDLFVBQU0sV0FBVyxLQUFLLFNBQVMsVUFBVSxFQUFFLEtBQUssU0FBUyxLQUFLLGNBQVksVUFBUSxZQUFVLEVBQUUsSUFBSSxNQUFNLFFBQVEsQ0FBQztBQUNqSCxhQUFTLFdBQVcsRUFBRSxLQUFLLFlBQVksTUFBTSxLQUFLLFVBQVUsRUFBRSxDQUFDO0FBQy9ELGFBQVMsVUFBVSxNQUFNO0FBQUUsV0FBSyxZQUFZO0FBQVMsV0FBSyxPQUFPO0FBQUEsSUFBRztBQUVwRSxVQUFNLFVBQVUsS0FBSyxTQUFTLFVBQVUsRUFBRSxLQUFLLFNBQVMsS0FBSyxjQUFZLFNBQU8sWUFBVSxFQUFFLElBQUksTUFBTSxZQUFZLENBQUM7QUFDbkgsWUFBUSxXQUFXLEVBQUUsS0FBSyxZQUFZLE1BQU0sS0FBSyxTQUFTLEVBQUUsQ0FBQztBQUM3RCxZQUFRLFVBQVUsTUFBTTtBQUFFLFdBQUssWUFBWTtBQUFRLFdBQUssT0FBTztBQUFBLElBQUc7QUFBQSxFQUNwRTtBQUFBLEVBRUEsWUFBWSxLQUFrQjtBQTNOaEM7QUE0TkksVUFBTSxPQUFPLGdCQUFnQixLQUFLLFlBQVk7QUFDOUMsVUFBTSxRQUFRLFlBQVksS0FBSyxNQUFNLE1BQU0sS0FBSyxZQUFZO0FBQzVELFVBQU0sUUFBUSxNQUFNLE9BQU8sQ0FBQyxHQUFFLE1BQU0sSUFBRSxHQUFHLENBQUM7QUFDMUMsVUFBTSxZQUFZLG9CQUFvQixLQUFLLE1BQU0sSUFBSTtBQUNyRCxVQUFNLFlBQVksVUFBVSxPQUFPLENBQUMsR0FBRSxNQUFNLElBQUUsR0FBRyxDQUFDO0FBQ2xELFVBQU0sVUFBVSxLQUFLLGlCQUFpQixZQUFZO0FBR2xELFVBQU0sVUFBVSxJQUFJLFVBQVUsRUFBRSxLQUFLLGNBQWMsQ0FBQztBQUNwRCxVQUFNLElBQUksb0JBQUksS0FBSyxLQUFLLGVBQWUsV0FBVztBQUNsRCxVQUFNLFlBQVksRUFBRSxtQkFBbUIsU0FBUyxFQUFFLFNBQVMsUUFBUSxLQUFLLFdBQVcsT0FBTyxPQUFPLENBQUM7QUFDbEcsWUFBUSxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsTUFBTSxVQUFVLENBQUM7QUFDM0QsUUFBSSxDQUFDLFNBQVM7QUFDWixZQUFNLFdBQVcsUUFBUSxTQUFTLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixNQUFNLGVBQVUsQ0FBQztBQUNwRixlQUFTLFVBQVUsTUFBTTtBQUFFLGFBQUssZUFBZSxZQUFZO0FBQUcsYUFBSyxPQUFPO0FBQUEsTUFBRztBQUFBLElBQy9FO0FBQ0EsVUFBTSxZQUFZLFFBQVEsU0FBUyxTQUFTLEVBQUUsS0FBSyxpQkFBaUIsTUFBTSxFQUFFLE1BQU0sUUFBUSxPQUFPLEtBQUssYUFBYSxFQUFFLENBQUM7QUFDdEgsY0FBVSxXQUFXLENBQUMsTUFBTTtBQUMxQixZQUFNLE1BQU8sRUFBRSxPQUE0QjtBQUMzQyxVQUFJLEtBQUs7QUFBRSxhQUFLLGVBQWU7QUFBSyxhQUFLLE9BQU87QUFBQSxNQUFHO0FBQUEsSUFDckQ7QUFFQSxRQUFJLFVBQVUsRUFBRSxLQUFLLGVBQWUsTUFBTSxVQUFVLG1FQUE4RCwwREFBcUQsQ0FBQztBQUV4SyxRQUFJLFVBQVUsRUFBRSxLQUFLLGNBQWMsTUFBTSxpQkFBaUIsQ0FBQztBQUMzRCxVQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFFL0MsV0FBTyxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQ3ZCLFlBQU0sTUFBTSxRQUFRLElBQUksS0FBSyxNQUFNLE1BQU0sQ0FBQyxJQUFJLFFBQVEsR0FBRyxJQUFJO0FBQzdELFlBQU0sTUFBTSxLQUFLLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUNsRCxVQUFJLFVBQVUsRUFBRSxLQUFLLFVBQVUsTUFBTSxFQUFFLE9BQU8sY0FBYyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDdkUsVUFBSSxXQUFXLEVBQUUsS0FBSyxXQUFXLE1BQU0sRUFBRSxLQUFLLENBQUM7QUFDL0MsWUFBTSxLQUFLLElBQUksVUFBVSxFQUFFLEtBQUssV0FBVyxDQUFDO0FBQzVDLFlBQU0sV0FBVyxHQUFHLFNBQVMsVUFBVSxFQUFFLEtBQUssVUFBVSxNQUFNLFNBQUksQ0FBQztBQUNuRSxTQUFHLFdBQVcsRUFBRSxLQUFLLFdBQVcsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUN0RCxZQUFNLFVBQVUsR0FBRyxTQUFTLFVBQVUsRUFBRSxLQUFLLFVBQVUsTUFBTSxJQUFJLENBQUM7QUFDbEUsWUFBTSxLQUFLLElBQUksVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQy9DLFNBQUcsVUFBVSxFQUFFLEtBQUssVUFBVSxNQUFNLEVBQUUsT0FBTyxTQUFTLEdBQUcsZ0JBQWdCLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUVwRixlQUFTLFVBQVUsTUFBTTtBQUN2QixhQUFLLE9BQU8sVUFBVSxLQUFLLE1BQU0sTUFBTSxLQUFLLFlBQVk7QUFDeEQsYUFBSyxLQUFLLElBQUksRUFBRSxLQUFLLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSxHQUFHLEVBQUUsS0FBSyxLQUFLLElBQUksRUFBRSxLQUFLLEtBQUssWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUM7QUFDbkksYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUNBLGNBQVEsVUFBVSxNQUFNO0FBQ3RCLGFBQUssT0FBTyxVQUFVLEtBQUssTUFBTSxNQUFNLEtBQUssWUFBWTtBQUN4RCxhQUFLLEtBQUssSUFBSSxFQUFFLEtBQUssS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBRSxLQUFLLEtBQUssSUFBSSxFQUFFLEtBQUssS0FBSyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksS0FBSyxRQUFRLENBQUM7QUFDdEgsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLElBQ0YsQ0FBQztBQUVELFVBQU0sV0FBVyxJQUFJLFVBQVUsRUFBRSxLQUFLLFdBQVcsQ0FBQztBQUNsRCxhQUFTLFdBQVcsRUFBRSxNQUFNLFVBQVUsa0JBQWtCLGFBQWEsRUFBRSxtQkFBbUIsU0FBUyxFQUFFLEtBQUksV0FBVyxPQUFNLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUN4SSxhQUFTLFdBQVcsRUFBRSxLQUFLLGdCQUFnQixNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7QUFFOUQsUUFBSSxVQUFVLEVBQUUsS0FBSyxhQUFhLENBQUM7QUFDbkMsUUFBSSxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sV0FBVyxhQUFhLElBQUksQ0FBQyxHQUFHLENBQUM7QUFFMUUsVUFBTSxTQUFTLElBQUksVUFBVSxFQUFFLEtBQUssWUFBWSxDQUFDO0FBQ2pELFFBQUksTUFBTTtBQUNWLFdBQU8sUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUN2QixVQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUc7QUFDeEIsWUFBTTtBQUNOLFlBQU0sT0FBTyxPQUFPLFVBQVUsRUFBRSxLQUFLLFVBQVUsQ0FBQztBQUNoRCxXQUFLLFVBQVUsRUFBRSxLQUFLLGVBQWUsTUFBTSxFQUFFLE9BQU8sY0FBYyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDN0UsV0FBSyxXQUFXLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQztBQUNoQyxXQUFLLFdBQVcsRUFBRSxLQUFLLGVBQWUsTUFBTSxLQUFLLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUFBLElBQ2xFLENBQUM7QUFDRCxRQUFJLENBQUMsSUFBSyxRQUFPLFdBQVcsRUFBRSxNQUFNLEVBQUUsT0FBTyx5Q0FBeUMsR0FBRyxNQUFNLGdDQUFnQyxDQUFDO0FBRWhJLFFBQUksVUFBVSxFQUFFLEtBQUssaUJBQWlCLE1BQU0sVUFBVSxpQkFBaUIsb0JBQW9CLENBQUM7QUFDNUYsVUFBTSxTQUFTLElBQUksU0FBUyxZQUFZLEVBQUUsS0FBSyxXQUFXLE1BQU0sRUFBRSxhQUFhLDJFQUFzRSxFQUFFLENBQUM7QUFDeEosV0FBTyxVQUFRLHNCQUFLLEtBQUssSUFBSSxNQUFkLG1CQUFpQixTQUFqQixtQkFBd0IsS0FBSyxrQkFBN0IsbUJBQTRDLFNBQVE7QUFFbkUsVUFBTSxVQUFVLElBQUksU0FBUyxVQUFVLEVBQUUsS0FBSyxXQUFXLE1BQU0sVUFBVSxlQUFlLFFBQVEsRUFBRSxtQkFBbUIsU0FBUyxFQUFFLEtBQUksV0FBVyxPQUFNLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUNuSyxVQUFNLFVBQVUsSUFBSSxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFFcEQsWUFBUSxVQUFVLFlBQVk7QUFDNUIsV0FBSyxPQUFPLFVBQVUsS0FBSyxNQUFNLE1BQU0sS0FBSyxZQUFZO0FBQ3hELFdBQUssS0FBSyxJQUFJLEVBQUUsS0FBSyxLQUFLLFlBQVksRUFBRSxPQUFPLE9BQU87QUFDdEQsY0FBUSxXQUFXO0FBQ25CLFlBQU0sS0FBSyxLQUFLO0FBQ2hCLGNBQVEsV0FBVztBQUNuQixjQUFRLGNBQWM7QUFDdEIsaUJBQVcsTUFBTTtBQUFFLGdCQUFRLGNBQWM7QUFBQSxNQUFJLEdBQUcsR0FBSTtBQUNwRCxXQUFLLE9BQU87QUFBQSxJQUNkO0FBRUEsUUFBSSxTQUFTLEtBQUssRUFBRSxLQUFLLGdCQUFnQixNQUFNLHlDQUFvQyxNQUFNLEVBQUUsTUFBTSxJQUFJLEVBQUUsQ0FBQyxFQUNyRyxVQUFVLE9BQU8sTUFBTTtBQUFFLFFBQUUsZUFBZTtBQUFHLFlBQU0sS0FBSyxPQUFPLGFBQWEsSUFBSTtBQUFBLElBQUc7QUFBQSxFQUN4RjtBQUFBLEVBRUEsV0FBVyxLQUFrQjtBQXhUL0I7QUF5VEksVUFBTSxNQUFNLElBQUksVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ2hELFVBQU0sVUFBVSxJQUFJLFNBQVMsVUFBVSxFQUFFLEtBQUssY0FBYyxNQUFNLFNBQUksQ0FBQztBQUN2RSxVQUFNLE9BQU8sV0FBVyxLQUFLLFVBQVU7QUFDdkMsUUFBSSxXQUFXLEVBQUUsS0FBSyxpQkFBaUIsTUFBTSxhQUFhLElBQUksRUFBRSxDQUFDO0FBQ2pFLFVBQU0sT0FBTyxLQUFLLGVBQWUsSUFBSSxjQUFjLEtBQUssZUFBZSxLQUFLLGNBQWMsR0FBRyxLQUFLLElBQUksS0FBSyxVQUFVLENBQUM7QUFDdEgsUUFBSSxXQUFXLEVBQUUsS0FBSyxnQkFBZ0IsTUFBTSxLQUFLLENBQUM7QUFDbEQsVUFBTSxVQUFVLElBQUksU0FBUyxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sU0FBSSxDQUFDO0FBQ3ZFLFFBQUksS0FBSyxjQUFjLEVBQUcsU0FBUSxXQUFXO0FBQzdDLFlBQVEsVUFBVSxNQUFNO0FBQUUsV0FBSztBQUFjLFdBQUssT0FBTztBQUFBLElBQUc7QUFDNUQsWUFBUSxVQUFVLE1BQU07QUFBRSxVQUFJLEtBQUssYUFBYSxHQUFHO0FBQUUsYUFBSztBQUFjLGFBQUssT0FBTztBQUFBLE1BQUc7QUFBQSxJQUFFO0FBRXpGLFVBQU0sUUFBUSxhQUFhLEtBQUssTUFBTSxLQUFLLFVBQVU7QUFDckQsVUFBTSxRQUFRLE1BQU0sT0FBTyxDQUFDLEdBQUUsTUFBTSxJQUFFLEdBQUcsQ0FBQztBQUUxQyxRQUFJLFVBQVUsRUFBRSxLQUFLLGNBQWMsTUFBTSxpQkFBaUIsQ0FBQztBQUMzRCxVQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFDL0MsV0FBTyxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQ3ZCLFlBQU0sTUFBTSxRQUFRLElBQUksS0FBSyxNQUFNLE1BQU0sQ0FBQyxJQUFJLFFBQVEsR0FBRyxJQUFJO0FBQzdELFlBQU0sTUFBTSxLQUFLLFVBQVUsRUFBRSxLQUFLLGVBQWUsQ0FBQztBQUNsRCxVQUFJLFVBQVUsRUFBRSxLQUFLLFVBQVUsTUFBTSxFQUFFLE9BQU8sY0FBYyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDdkUsVUFBSSxXQUFXLEVBQUUsS0FBSyxXQUFXLE1BQU0sRUFBRSxLQUFLLENBQUM7QUFDL0MsVUFBSSxVQUFVLEVBQUUsS0FBSyxXQUFXLENBQUMsRUFBRSxXQUFXLEVBQUUsS0FBSyxXQUFXLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDdEYsWUFBTSxLQUFLLElBQUksVUFBVSxFQUFFLEtBQUssY0FBYyxDQUFDO0FBQy9DLFNBQUcsVUFBVSxFQUFFLEtBQUssVUFBVSxNQUFNLEVBQUUsT0FBTyxTQUFTLEdBQUcsZ0JBQWdCLEVBQUUsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUFBLElBQ3RGLENBQUM7QUFFRCxVQUFNLFdBQVcsSUFBSSxVQUFVLEVBQUUsS0FBSyxXQUFXLENBQUM7QUFDbEQsYUFBUyxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN0RCxhQUFTLFdBQVcsRUFBRSxLQUFLLGdCQUFnQixNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7QUFFOUQsVUFBTSxNQUFNLElBQUksVUFBVSxFQUFFLEtBQUssYUFBYSxDQUFDO0FBQy9DLFNBQUssWUFBWSxLQUFLLE9BQU8sS0FBSztBQUNsQyxTQUFLLGNBQWMsR0FBRztBQUV0QixRQUFJLFVBQVUsRUFBRSxLQUFLLGlCQUFpQixNQUFNLFlBQVksQ0FBQztBQUN6RCxVQUFNLFNBQVMsSUFBSSxTQUFTLFlBQVksRUFBRSxLQUFLLFdBQVcsTUFBTSxFQUFFLGFBQWEsMkVBQTJFLEVBQUUsQ0FBQztBQUM3SixXQUFPLFVBQVEsVUFBSyxLQUFLLElBQUksTUFBZCxtQkFBaUIsU0FBUTtBQUV4QyxVQUFNLFVBQVUsSUFBSSxTQUFTLFVBQVUsRUFBRSxLQUFLLFdBQVcsTUFBTSxpQkFBaUIsQ0FBQztBQUNqRixVQUFNLFVBQVUsSUFBSSxVQUFVLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFFcEQsWUFBUSxVQUFVLFlBQVk7QUFDNUIsVUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUcsTUFBSyxLQUFLLElBQUksSUFBSSxFQUFFLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUM3RCxXQUFLLEtBQUssSUFBSSxFQUFFLE9BQU8sT0FBTztBQUM5QixjQUFRLFdBQVc7QUFDbkIsWUFBTSxLQUFLLE9BQU8sVUFBVSxLQUFLLElBQUk7QUFDckMsWUFBTSxLQUFLLE9BQU8sY0FBYyxLQUFLLE1BQU0sSUFBSTtBQUMvQyxjQUFRLFdBQVc7QUFDbkIsY0FBUSxjQUFjO0FBQ3RCLGlCQUFXLE1BQU07QUFBRSxnQkFBUSxjQUFjO0FBQUEsTUFBSSxHQUFHLEdBQUk7QUFBQSxJQUN0RDtBQUVBLFFBQUksU0FBUyxLQUFLLEVBQUUsS0FBSyxnQkFBZ0IsTUFBTSx5Q0FBb0MsTUFBTSxFQUFFLE1BQU0sSUFBSSxFQUFFLENBQUMsRUFDckcsVUFBVSxPQUFPLE1BQU07QUFBRSxRQUFFLGVBQWU7QUFBRyxZQUFNLEtBQUssT0FBTyxhQUFhLElBQUk7QUFBQSxJQUFHO0FBQUEsRUFDeEY7QUFBQSxFQUVBLFlBQVksV0FBd0IsT0FBaUIsT0FBZTtBQUNsRSxVQUFNLFFBQVEsVUFBVSxVQUFVLEVBQUUsS0FBSyxXQUFXLENBQUM7QUFDckQsVUFBTSxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sZUFBZSxDQUFDO0FBQzNELFVBQU0sT0FBTyxNQUFNLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixDQUFDO0FBQ3JELFVBQU0sTUFBTSxLQUFLLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLE1BQU0sUUFBUSxNQUFNLFNBQVMsWUFBWSxFQUFFLENBQUM7QUFDL0YsVUFBTSxTQUFTLEtBQUssVUFBVSxFQUFFLEtBQUssa0JBQWtCLENBQUM7QUFFeEQsUUFBSSxVQUFVLEdBQUc7QUFDZixVQUFJLFVBQVUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFHLE1BQU0sSUFBRyxNQUFNLEdBQUUsTUFBTSxNQUFLLFFBQVEsUUFBTyxxQ0FBcUMsZ0JBQWUsS0FBSyxFQUFFLENBQUM7QUFDNUksYUFBTyxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsTUFBTSxTQUFJLENBQUM7QUFDbkQsYUFBTyxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsTUFBTSxZQUFZLENBQUM7QUFDN0QsWUFBTSxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE9BQU8seUNBQXlDLEdBQUcsTUFBTSxjQUFjLENBQUM7QUFDbEk7QUFBQSxJQUNGO0FBRUEsVUFBTSxLQUFHLElBQUksS0FBRyxJQUFJLElBQUUsSUFBSSxLQUFHO0FBQzdCLFVBQU0sT0FBTyxJQUFJLEtBQUssS0FBSztBQUMzQixRQUFJLFNBQVM7QUFDYixVQUFNLFNBQVMsTUFBTSxRQUFRLEtBQUssSUFBSSxHQUFHLEtBQUssQ0FBQztBQUMvQyxVQUFNLFFBQVEsQ0FBQyxHQUFHLE1BQU07QUFDdEIsVUFBSSxNQUFNLEVBQUc7QUFDYixZQUFNLE1BQU0sSUFBRSxPQUFPLE9BQU8sTUFBSSxNQUFNLE1BQU0sT0FBSztBQUNqRCxVQUFJLFVBQVUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFHLE9BQU8sRUFBRSxHQUFHLElBQUcsT0FBTyxFQUFFLEdBQUcsR0FBRSxPQUFPLENBQUMsR0FBRyxNQUFLLFFBQVEsUUFBTyxPQUFPLENBQUMsRUFBRSxLQUFLLGdCQUFlLE9BQU8sRUFBRSxHQUFHLG9CQUFtQixHQUFHLEtBQUssUUFBUSxDQUFDLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxDQUFDLElBQUkscUJBQW9CLElBQUksRUFBRSxTQUFPLFFBQU0sT0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEdBQUcsRUFBQyxDQUFDO0FBQ3BRLGdCQUFVO0FBQUEsSUFDWixDQUFDO0FBQ0QsV0FBTyxVQUFVLEVBQUUsS0FBSyxnQkFBZ0IsTUFBTSxHQUFHLEtBQUssTUFBTSxNQUFNLE1BQU0sSUFBRSxRQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUM7QUFDekYsV0FBTyxVQUFVLEVBQUUsS0FBSyxrQkFBa0IsTUFBTSxPQUFPLE1BQU0sRUFBRSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUVqRyxVQUFNLFNBQVMsTUFBTSxVQUFVLEVBQUUsS0FBSyxZQUFZLENBQUM7QUFDbkQsV0FBTyxRQUFRLENBQUMsR0FBRyxNQUFNO0FBQ3ZCLFlBQU0sTUFBTSxRQUFRLElBQUksS0FBSyxNQUFNLE1BQU0sQ0FBQyxJQUFFLFFBQU0sR0FBRyxJQUFJO0FBQ3pELFVBQUksUUFBUSxFQUFHO0FBQ2YsWUFBTSxPQUFPLE9BQU8sVUFBVSxFQUFFLEtBQUssaUJBQWlCLENBQUM7QUFDdkQsV0FBSyxVQUFVLEVBQUUsS0FBSyxpQkFBaUIsTUFBTSxFQUFFLE9BQU8sY0FBYyxFQUFFLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDL0UsV0FBSyxXQUFXLEVBQUUsS0FBSyxrQkFBa0IsTUFBTSxFQUFFLEtBQUssQ0FBQztBQUN2RCxXQUFLLFdBQVcsRUFBRSxLQUFLLGlCQUFpQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFBQSxJQUMzRCxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBRUEsY0FBYyxXQUF3QjtBQUNwQyxVQUFNLFFBQVEsVUFBVSxVQUFVLEVBQUUsS0FBSyxXQUFXLENBQUM7QUFDckQsVUFBTSxVQUFVLEVBQUUsS0FBSyxjQUFjLE1BQU0sZUFBZSxDQUFDO0FBQzNELFVBQU0sT0FBTyxNQUFNLFVBQVUsRUFBRSxLQUFLLFVBQVUsQ0FBQztBQUUvQyxVQUFNLFFBQVEsQ0FBQztBQUNmLGFBQVMsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFLLE9BQU0sS0FBSyxFQUFFLEtBQUssV0FBVyxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUM7QUFDMUUsVUFBTSxTQUFTLE1BQU0sSUFBSSxPQUFLLGFBQWEsS0FBSyxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFFLE1BQU0sSUFBRSxHQUFHLENBQUMsQ0FBQztBQUN2RixVQUFNLFdBQVcsS0FBSyxJQUFJLEdBQUcsUUFBUSxDQUFDO0FBRXRDLFVBQU0sUUFBUSxDQUFDLE1BQU07QUFDbkIsWUFBTSxRQUFRLGFBQWEsS0FBSyxNQUFNLEVBQUUsTUFBTTtBQUM5QyxZQUFNLFFBQVEsT0FBTyxFQUFFLFNBQVMsQ0FBQztBQUNqQyxZQUFNLFdBQVcsUUFBUSxJQUFJLEtBQUssSUFBSSxLQUFLLE1BQU0sUUFBTSxXQUFTLEVBQUUsR0FBRyxDQUFDLElBQUk7QUFDMUUsWUFBTSxZQUFZLEVBQUUsV0FBVyxLQUFLO0FBRXBDLFlBQU0sTUFBTSxLQUFLLFVBQVUsRUFBRSxLQUFLLGNBQWMsWUFBVSxhQUFXLEVBQUUsR0FBRyxDQUFDO0FBQzNFLFlBQU0sUUFBUSxJQUFJLFVBQVUsRUFBRSxLQUFLLGdCQUFnQixVQUFRLElBQUUsbUJBQWlCLEVBQUUsR0FBRyxDQUFDO0FBQ3BGLFlBQU0sTUFBTSxTQUFTLEdBQUcsUUFBUTtBQUVoQyxVQUFJLFFBQVEsR0FBRztBQUNiLGVBQU8sUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUN2QixjQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUc7QUFDcEIsZ0JBQU0sTUFBTSxNQUFNLFVBQVUsRUFBRSxLQUFLLGNBQWMsQ0FBQztBQUNsRCxjQUFJLE1BQU0sYUFBYSxFQUFFO0FBQ3pCLGNBQUksTUFBTSxTQUFTLEdBQUcsS0FBSyxJQUFJLEtBQUssTUFBTSxNQUFNLENBQUMsSUFBRSxRQUFNLFFBQVEsR0FBRyxDQUFDLENBQUM7QUFBQSxRQUN4RSxDQUFDO0FBQUEsTUFDSDtBQUVBLFlBQU0sSUFBSSxvQkFBSSxLQUFLLEVBQUUsTUFBTSxXQUFXO0FBQ3RDLFVBQUksVUFBVSxFQUFFLEtBQUssZUFBZSxNQUFNLEVBQUUsbUJBQW1CLFNBQVMsRUFBRSxLQUFJLFdBQVcsT0FBTSxRQUFRLENBQUMsRUFBRSxDQUFDO0FBQzNHLFVBQUksVUFBVSxNQUFNO0FBQUUsYUFBSyxhQUFhLEVBQUU7QUFBUSxhQUFLLFlBQVk7QUFBUSxhQUFLLE9BQU87QUFBQSxNQUFHO0FBQUEsSUFDNUYsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQUVBLElBQXFCLGtCQUFyQixjQUE2Qyx1QkFBTztBQUFBLEVBQ2xELE1BQU0sU0FBUztBQUNiLFNBQUssYUFBYSxXQUFXLENBQUMsU0FBUyxJQUFJLGNBQWMsTUFBTSxJQUFJLENBQUM7QUFDcEUsU0FBSyxjQUFjLFNBQVMsY0FBYyxNQUFNLEtBQUssYUFBYSxDQUFDO0FBQ25FLFNBQUssV0FBVyxFQUFFLElBQUksbUJBQW1CLE1BQU0sbUJBQW1CLFVBQVUsTUFBTSxLQUFLLGFBQWEsRUFBRSxDQUFDO0FBQ3ZHLFVBQU0sS0FBSyxhQUFhLFlBQVk7QUFDcEMsVUFBTSxLQUFLLGFBQWEsWUFBWTtBQUFBLEVBQ3RDO0FBQUEsRUFFQSxXQUFXO0FBQUUsU0FBSyxJQUFJLFVBQVUsbUJBQW1CLFNBQVM7QUFBQSxFQUFHO0FBQUEsRUFFL0QsTUFBTSxlQUFlO0FBQ25CLFNBQUssSUFBSSxVQUFVLG1CQUFtQixTQUFTO0FBQy9DLFVBQU0sT0FBTyxLQUFLLElBQUksVUFBVSxhQUFhLEtBQUs7QUFDbEQsUUFBSSxNQUFNO0FBQUUsWUFBTSxLQUFLLGFBQWEsRUFBRSxNQUFNLFdBQVcsUUFBUSxLQUFLLENBQUM7QUFBRyxXQUFLLElBQUksVUFBVSxXQUFXLElBQUk7QUFBQSxJQUFHO0FBQUEsRUFDL0c7QUFBQSxFQUVBLE1BQU0sYUFBYSxNQUFjO0FBQy9CLFFBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxzQkFBc0IsSUFBSSxFQUFHLE9BQU0sS0FBSyxJQUFJLE1BQU0sYUFBYSxJQUFJO0FBQUEsRUFDekY7QUFBQSxFQUVBLE1BQU0sWUFBa0M7QUFDdEMsVUFBTSxPQUFPLEtBQUssSUFBSSxNQUFNLHNCQUFzQixTQUFTO0FBQzNELFFBQUksZ0JBQWdCLHVCQUFPO0FBQ3pCLFVBQUk7QUFBRSxlQUFPLEtBQUssTUFBTSxNQUFNLEtBQUssSUFBSSxNQUFNLEtBQUssSUFBSSxDQUFDO0FBQUEsTUFBRyxTQUFRO0FBQUUsZUFBTyxDQUFDO0FBQUEsTUFBRztBQUFBLElBQ2pGO0FBQ0EsV0FBTyxDQUFDO0FBQUEsRUFDVjtBQUFBLEVBRUEsTUFBTSxVQUFVLE1BQW1CO0FBRWpDLFVBQU0sV0FBVyxNQUFNLEtBQUssVUFBVTtBQUN0QyxVQUFNLFNBQXNCLEVBQUUsR0FBRyxTQUFTO0FBQzFDLGVBQVcsUUFBUSxPQUFPLEtBQUssSUFBSSxHQUFHO0FBQ3BDLFVBQUksQ0FBQyxPQUFPLElBQUksR0FBRztBQUFFLGVBQU8sSUFBSSxJQUFJLEtBQUssSUFBSTtBQUFBLE1BQUcsT0FDM0M7QUFDSCxlQUFPLElBQUksRUFBRSxPQUFPLEtBQUssSUFBSSxFQUFFLFFBQVEsT0FBTyxJQUFJLEVBQUU7QUFDcEQsZUFBTyxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsT0FBTyxJQUFJLEVBQUUsTUFBTSxHQUFHLEtBQUssSUFBSSxFQUFFLEtBQUs7QUFBQSxNQUNqRTtBQUFBLElBQ0Y7QUFDQSxVQUFNLE9BQU8sS0FBSyxVQUFVLFFBQVEsTUFBTSxDQUFDO0FBRTNDLFVBQU0sU0FBUyxLQUFLLElBQUksTUFBTSxzQkFBc0IsV0FBVztBQUMvRCxVQUFNLFdBQVcsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFNBQVM7QUFDL0QsUUFBSSxvQkFBb0IsdUJBQU87QUFDN0IsWUFBTSxVQUFVLE1BQU0sS0FBSyxJQUFJLE1BQU0sS0FBSyxRQUFRO0FBQ2xELFVBQUksa0JBQWtCLHNCQUFPLE9BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxRQUFRLE9BQU87QUFBQSxVQUNuRSxPQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sYUFBYSxPQUFPO0FBQUEsSUFDdkQ7QUFFQSxRQUFJLG9CQUFvQixzQkFBTyxPQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sVUFBVSxJQUFJO0FBQUEsUUFDcEUsT0FBTSxLQUFLLElBQUksTUFBTSxPQUFPLFdBQVcsSUFBSTtBQUFBLEVBQ2xEO0FBQUEsRUFFQSxNQUFNLGNBQWMsTUFBbUIsTUFBYztBQUNuRCxVQUFNLFFBQVEsS0FBSyxJQUFJO0FBQ3ZCLFFBQUksQ0FBQyxNQUFPO0FBQ1osVUFBTSxRQUFRLG9CQUFvQixNQUFNLElBQUk7QUFDNUMsVUFBTSxRQUFRLE1BQU0sT0FBTyxDQUFDLEdBQUUsTUFBTSxJQUFFLEdBQUcsQ0FBQztBQUMxQyxRQUFJLFVBQVUsYUFBYSxhQUFhLElBQUksQ0FBQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQzdDLFdBQU8sUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUFFLFVBQUksTUFBTSxDQUFDLElBQUksRUFBRyxZQUFXLE9BQU8sRUFBRSxJQUFJLE9BQU8sS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO0FBQUE7QUFBQSxJQUFNLENBQUM7QUFDakcsZUFBVztBQUFBLGFBQWdCLEtBQUssS0FBSyxDQUFDO0FBQUE7QUFBQTtBQUN0QyxRQUFJLE1BQU0sS0FBTSxZQUFXO0FBQUE7QUFBQSxFQUF5QixNQUFNLElBQUk7QUFBQTtBQUFBO0FBQzlELFVBQU0sVUFBVSxPQUFPLEtBQUssTUFBTSxRQUFRLENBQUMsQ0FBQyxFQUFFLEtBQUs7QUFDbkQsUUFBSSxRQUFRLFNBQVMsR0FBRztBQUN0QixpQkFBVztBQUFBO0FBQUE7QUFDWCxjQUFRLFFBQVEsVUFBUTtBQUN0QixjQUFNLE1BQU0sTUFBTSxLQUFLLElBQUk7QUFDM0IsWUFBSSxJQUFJLE1BQU07QUFDWixnQkFBTSxJQUFJLG9CQUFJLEtBQUssT0FBTyxXQUFXO0FBQ3JDLHFCQUFXLE9BQU8sRUFBRSxtQkFBbUIsU0FBUyxFQUFFLFNBQVEsUUFBUSxLQUFJLFdBQVcsT0FBTSxRQUFRLENBQUMsQ0FBQztBQUFBO0FBQUEsRUFBTyxJQUFJLElBQUk7QUFBQTtBQUFBO0FBQUEsUUFDbEg7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQ0EsVUFBTSxXQUFXLEdBQUcsWUFBWSxJQUFJLElBQUk7QUFDeEMsVUFBTSxXQUFXLEtBQUssSUFBSSxNQUFNLHNCQUFzQixRQUFRO0FBQzlELFFBQUksb0JBQW9CLHNCQUFPLE9BQU0sS0FBSyxJQUFJLE1BQU0sT0FBTyxVQUFVLE9BQU87QUFBQSxRQUN2RSxPQUFNLEtBQUssSUFBSSxNQUFNLE9BQU8sVUFBVSxPQUFPO0FBQUEsRUFDcEQ7QUFBQSxFQUVBLE1BQU0sYUFBYSxNQUFjO0FBQy9CLFVBQU0sV0FBVyxHQUFHLFlBQVksSUFBSSxJQUFJO0FBQ3hDLFFBQUksT0FBTyxLQUFLLElBQUksTUFBTSxzQkFBc0IsUUFBUTtBQUN4RCxRQUFJLENBQUMsTUFBTTtBQUFFLFlBQU0sT0FBTyxNQUFNLEtBQUssVUFBVTtBQUFHLFlBQU0sS0FBSyxjQUFjLE1BQU0sSUFBSTtBQUFHLGFBQU8sS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFFBQVE7QUFBQSxJQUFHO0FBQy9JLFFBQUksZ0JBQWdCLHVCQUFPO0FBQUUsWUFBTSxPQUFPLEtBQUssSUFBSSxVQUFVLFFBQVEsSUFBSTtBQUFHLFlBQU0sS0FBSyxTQUFTLElBQUk7QUFBQSxJQUFHO0FBQUEsRUFDekc7QUFDRjsiLAogICJuYW1lcyI6IFtdCn0K
