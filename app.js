/* ===== 个人工作台 核心逻辑 =====
   数据：localStorage 本地存储
   图标：统一几何线性 SVG（stroke 风格）
   交互：事件委托 data-action */
(function () {
  "use strict";

  var STORE_KEY = "wb_data_v1";

  /* ---------- 统一图标集（几何线性风格） ---------- */
  var P = {
    svg: function (inner) {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
    },
    c: function (cx, cy, r) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"></circle>'; },
    l: function (x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"></line>'; },
    pl: function (pts) { return '<polyline points="' + pts + '"></polyline>'; },
    pg: function (pts) { return '<polygon points="' + pts + '"></polygon>'; },
    p: function (d) { return '<path d="' + d + '"></path>'; },
    r: function (x, y, w, h, rx) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '"></rect>'; }
  };
  var ICONS = {
    sun: P.svg(P.c(12, 12, 4) + P.l(12, 2, 12, 4) + P.l(12, 20, 12, 22) + P.l(2, 12, 4, 12) + P.l(20, 12, 22, 12) + P.l(4.9, 4.9, 6.3, 6.3) + P.l(17.7, 17.7, 19.1, 19.1) + P.l(4.9, 19.1, 6.3, 17.7) + P.l(17.7, 6.3, 19.1, 4.9)),
    target: P.svg(P.c(12, 12, 8) + P.c(12, 12, 5) + P.c(12, 12, 2)),
    book: P.svg(P.p("M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z") + P.p("M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5")),
    file: P.svg(P.r(3, 3, 18, 18, 2) + P.l(7, 8, 17, 8) + P.l(7, 12, 17, 12) + P.l(7, 16, 13, 16)),
    folder: P.svg(P.p("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z")),
    inbox: P.svg(P.p("M22 12h-6l-2 3h-4l-2-3H2") + P.p("M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z")),
    search: P.svg(P.c(11, 11, 8) + P.l(21, 21, 16.65, 16.65)),
    spark: P.svg(P.pg("12 2 14.5 9.5 22 12 14.5 14.5 12 22 9.5 14.5 2 12 9.5 9.5")),
    user: P.svg(P.p("M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2") + P.c(12, 7, 4)),
    heart: P.svg(P.p("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z") + P.pl("3.22 12 6.72 12 8.22 8 11.22 16 13.22 12 16.78 12")),
    refresh: P.svg(P.p("M23 4v6h-6") + P.p("M20.49 15a9 9 0 1 1-2.12-9.36L23 10")),
    settings: P.svg(P.l(4, 21, 4, 14) + P.l(4, 10, 4, 3) + P.l(12, 21, 12, 12) + P.l(12, 8, 12, 3) + P.l(20, 21, 20, 16) + P.l(20, 12, 20, 3) + P.l(1, 14, 7, 14) + P.l(9, 8, 15, 8) + P.l(17, 16, 23, 16)),
    plus: P.svg(P.l(12, 5, 12, 19) + P.l(5, 12, 19, 12)),
    help: P.svg(P.c(12, 12, 10) + P.p("M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3") + P.c(12, 17, 0.5)),
    check: P.svg(P.pl("20 6 9 17 4 12")),
    trash: P.svg(P.pl("3 6 5 6 21 6") + P.p("M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2") + P.l(10, 11, 10, 17) + P.l(14, 11, 14, 17)),
    edit: P.svg(P.p("M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7") + P.p("M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z")),
    link: P.svg(P.p("M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71") + P.p("M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71")),
    calendar: P.svg(P.r(3, 4, 18, 18, 2) + P.l(16, 2, 16, 6) + P.l(8, 2, 8, 6) + P.l(3, 10, 21, 10)),
    clock: P.svg(P.c(12, 12, 10) + P.pl("12 6 12 12 16 14")),
    flame: P.svg(P.p("M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z")),
    trending: P.svg(P.pl("22 7 13.5 15.5 8.5 10.5 2 17") + P.pl("16 7 22 7 22 13")),
    chevron: P.svg(P.pl("9 18 15 12 9 6")),
    grid: P.svg(P.r(3, 3, 7, 7, 1) + P.r(14, 3, 7, 7, 1) + P.r(14, 14, 7, 7, 1) + P.r(3, 14, 7, 7, 1)),
    moon: P.svg(P.p("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z")),
    activity: P.svg(P.pl("22 12 18 12 15 21 9 3 6 12 2 12")),
    play: P.svg(P.pg("5 3 19 12 5 21")),
    send: P.svg(P.l(22, 2, 11, 13) + P.pl("22 2 15 22 11 13 2 9 22 2")),
    alert: P.svg(P.p("M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z") + P.l(12, 9, 12, 13) + P.c(12, 17, 0.5)),
    download: P.svg(P.p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4") + P.pl("7 10 12 15 17 10") + P.l(12, 15, 12, 3)),
    upload: P.svg(P.p("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4") + P.pl("17 8 12 3 7 8") + P.l(12, 3, 12, 15)),
    timer: P.svg(P.l(10, 2, 14, 2) + P.c(12, 13, 8) + P.l(12, 9, 12, 13) + P.l(15, 13, 12, 13)),
    x: P.svg(P.l(18, 6, 6, 18) + P.l(6, 6, 18, 18)),
    eye: P.svg(P.p("M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z") + P.c(12, 12, 3)),
    done: P.svg(P.c(12, 12, 10) + P.pl("9 12 11 14 15 10"))
  };

  /* ---------- 工具 ---------- */
  function uid() { return "id" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function nowStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function $id(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
  function toast(msg, isErr) {
    var t = $id("toast");
    t.textContent = msg;
    t.className = "toast show" + (isErr ? " err" : "");
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = "toast"; }, 2800);
  }

  /* ---------- 默认数据（含示例数据，可清空） ---------- */
  function defaultData() {
    return {
      v: 1,
      meta: { created: nowStr(), updated: nowStr() },
      settings: {
        apiKey: "", apiBase: "", apiModel: "",
        primaryDomain: "kaoyan",
        kaoyanDate: "2027-12-25",
        background: "default"
      },
      domains: [
        {
          id: "kaoyan", type: "kaoyan", name: "考研备考", color: "yellow", order: 0, examDate: "2026-12-26",
          stages: [
            { name: "基础期", end: "6月", goal: "数学一轮基础、英语单词一轮", done: true },
            { name: "强化期", end: "8月", goal: "数学强化、开始英语真题", done: false },
            { name: "冲刺期", end: "12月", goal: "真题 + 模拟 + 政治背诵", done: false }
          ],
          subjects: [
            { id: "s1", name: "数学", progress: 15, note: "高数上册进行中" },
            { id: "s2", name: "英语", progress: 20, note: "单词一轮过半" },
            { id: "s3", name: "政治", progress: 5, note: "还没开始" },
            { id: "s4", name: "专业课", progress: 10, note: "材料科学基础" }
          ],
          weeklyPlan: {
            "周一": [{ id: "w1", text: "数学 3 小时：极限与连续", done: false }],
            "周二": [{ id: "w2", text: "英语 1.5 小时：单词 + 长难句", done: false }],
            "周三": [{ id: "w3", text: "数学 3 小时：导数部分", done: false }],
            "周四": [{ id: "w4", text: "英语 1.5 小时：阅读精读", done: false }],
            "周五": [{ id: "w5", text: "数学 3 小时：微分应用", done: false }],
            "周六": [{ id: "w6", text: "专业课 2 小时：材料科学基础", done: false }],
            "周日": [{ id: "w7", text: "本周复盘 + 下周计划", done: false }]
          }
        },
        {
          id: "cet", type: "generic", name: "英语学习", color: "blue", order: 1,
          subGroups: [
            {
              name: "四六级", examDate: "2027-12-12",
              subjects: [
                { id: "cet-l1", name: "听力", progress: 30, note: "" },
                { id: "cet-l2", name: "阅读", progress: 40, note: "" },
                { id: "cet-l3", name: "写作", progress: 20, note: "" },
                { id: "cet-l4", name: "翻译", progress: 25, note: "" }
              ]
            }
          ],
          subjects: [
            { id: "cet-s1", name: "词汇", progress: 25, note: "长期积累" },
            { id: "cet-s2", name: "听力", progress: 20, note: "" },
            { id: "cet-s3", name: "口语", progress: 10, note: "" },
            { id: "cet-s4", name: "阅读", progress: 30, note: "" },
            { id: "cet-s5", name: "写作", progress: 15, note: "" }
          ],
          wordbook: [
            { id: "w1", word: "comprehensive", meaning: "adj. 全面的，综合的", note: "考研高频词", mastered: false, date: "2026-08-14" }
          ]
        },
        {
          id: "ai", type: "generic", name: "AI 知识学习", color: "green", order: 2,
          subjects: [
            { id: "a1", name: "提示词工程", progress: 10, note: "" },
            { id: "a2", name: "AI 工具实践", progress: 25, note: "工作中台搭建中" }
          ]
        },
        {
          id: "courses", type: "courses", name: "学业课程", color: "blue", order: 3,
          courses: [
            { id: "c1", name: "材料科学基础", teacher: "王老师", day: "周一", time: "8:00-9:40", place: "A101" },
            { id: "c2", name: "高分子化学", teacher: "李老师", day: "周三", time: "10:00-11:40", place: "B203" },
            { id: "c3", name: "材料分析测试", teacher: "张老师", day: "周五", time: "14:00-15:40", place: "实验楼 305" }
          ],
          assignments: [
            { id: "a1", title: "材料科学基础 作业 3", type: "作业", due: "2026-08-20", done: false },
            { id: "a2", title: "材料分析测试 实验报告", type: "作业", due: "2026-08-28", done: false },
            { id: "a3", title: "英语六级模拟考试", type: "考试", due: "2026-12-12", done: false }
          ]
        },
        {
          id: "paper", type: "paper", name: "论文写作", color: "pink", order: 4, deadline: "2026-10-15",
          stages: ["选题", "文献调研", "实验数据", "初稿", "修改", "定稿"], currentStage: 1,
          refs: [
            { id: "r1", title: "多孔碳材料吸附性能研究综述", note: "重点：第 3 章制备方法", url: "" },
            { id: "r2", title: "材料表征技术（XRD / SEM）基础", note: "与实验部分相关", url: "" }
          ]
        }
      ],
      tasks: [
        { id: "t1", title: "数学：高数第 3 章习题 1-20", domainId: "kaoyan", date: "", due: "", done: false, note: "", createdAt: nowStr() },
        { id: "t2", title: "英语：背诵单词 50 个", domainId: "kaoyan", date: "", due: "", done: false, note: "", createdAt: nowStr() },
        { id: "t3", title: "整理文献调研笔记", domainId: "paper", date: "", due: "", done: false, note: "", createdAt: nowStr() }
      ],
      studyLog: [
        { date: "2026-08-11", domainId: "kaoyan", subject: "数学", minutes: 120 },
        { date: "2026-08-12", domainId: "kaoyan", subject: "英语", minutes: 90 },
        { date: "2026-08-13", domainId: "kaoyan", subject: "数学", minutes: 150 },
        { date: "2026-08-14", domainId: "kaoyan", subject: "专业课", minutes: 60 }
      ],
      focusSessions: [],
      goals: [],
      mistakes: [
        { id: "m1", subject: "数学", title: "极限计算：洛必达适用条件判断错误", reason: "粗心，未验证 0/0 型", answer: "先判断型再使用洛必达", reviewed: false, date: "2026-08-14" }
      ],
      qa: [
        { id: "q1", subject: "英语", question: "as 引导的定语从句和状语从句怎么区分？", answer: "看 as 在从句中是否充当成分：作成分（主语/宾语）是定语从句；不作成分、表示原因/时间等是状语从句。", date: "2026-08-13" }
      ],
      resources: [
        { id: "r1", title: "【考研数学】汤家凤 高等数学基础班（示例）", category: "考研", tags: ["高数"], url: "https://www.bilibili.com/video/BV1bW411n7xE", platform: "哔哩哔哩", extractCode: "", status: "在看", note: "跟着第 3 章，配合习题", domainId: "kaoyan", createdAt: nowStr(), updatedAt: nowStr() },
        { id: "r2", title: "材料科学基础 复习资料合集（示例）", category: "课程", tags: ["专业课"], url: "https://pan.baidu.com/s/example123", platform: "百度网盘", extractCode: "a1b2", status: "未看", note: "", domainId: "courses", createdAt: nowStr(), updatedAt: nowStr() },
        { id: "r3", title: "AI 入门学习路线（示例）", category: "课外", tags: ["AI"], url: "https://zhuanlan.zhihu.com/p/example", platform: "知乎", extractCode: "", status: "未看", note: "", domainId: "ai", createdAt: nowStr(), updatedAt: nowStr() }
      ],
      inbox: [
        { id: "i1", type: "link", content: "", url: "https://www.bilibili.com/video/BV1GJ411x7h7", platform: "哔哩哔哩", status: "待分拣", suggestion: "看起来是学习视频，建议放入「考研备考」或资料库", createdAt: nowStr() },
        { id: "i2", type: "text", content: "看到一篇讲记忆曲线的文章，待会细读", url: "", platform: "", status: "待分拣", suggestion: "文字笔记，建议放入资料库（课外分类）", createdAt: nowStr() }
      ],
      reviews: [
        { id: "v1", date: "2026-08-14", type: "daily", done: "完成了高数第三章习题，整理了文献笔记", undone: "英语单词只背了 30 个", adjust: "明天早起 30 分钟补单词", aiDraft: "" }
      ],
      health: {
        sleep: [{ date: "2026-08-14", bed: "23:30", wake: "7:00", minutes: 450 }],
        sport: [], state: [], settings: { remindMin: 50 }
      },
      accounts: [
        { id: "ac1", platform: "哔哩哔哩", name: "我的学习账号", note: "关注考研数学、材料类 UP 主" },
        { id: "ac2", platform: "小红书", name: "我的账号", note: "记录学习日常" }
      ],
      calendar: [
        { id: "cal1", date: "2027-12-25", title: "2028 考研初试", type: "考试", note: "" },
        { id: "cal2", date: "2027-12-12", title: "英语六级考试", type: "考试", note: "" },
        { id: "cal3", date: "2026-08-20", title: "材料作业 3 截止", type: "作业", note: "" }
      ],
      deleted: []
    };
  }

  /* ---------- 数据读写 ---------- */
  var data;
  function migrate() {
    /* 旧数据 → 新结构的一次性迁移（不删除任何数据） */
    var changed = false;
    if (data.settings && data.settings.kaoyanDate === "2026-12-26") {
      data.settings.kaoyanDate = "2027-12-25";
      changed = true;
    }
    var cet = (data.domains || []).filter(function (x) { return x.id === "cet"; })[0];
    if (cet) {
      if (cet.name === "四六级") { cet.name = "英语学习"; changed = true; }
      if (!cet.subGroups && cet.subjects && cet.subjects.length) {
        cet.subGroups = [{ name: "四六级", examDate: "2027-12-12", subjects: cet.subjects }];
        cet.subjects = [
          { id: "cet-s1", name: "词汇", progress: 25, note: "长期积累" },
          { id: "cet-s2", name: "听力", progress: 20, note: "" },
          { id: "cet-s3", name: "口语", progress: 10, note: "" },
          { id: "cet-s4", name: "阅读", progress: 30, note: "" },
          { id: "cet-s5", name: "写作", progress: 15, note: "" }
        ];
        changed = true;
      }
      if (!cet.wordbook) { cet.wordbook = []; changed = true; }
    }
    (data.calendar || []).forEach(function (c) {
      if (c.date === "2026-12-26" && c.title.indexOf("考研") >= 0) { c.date = "2027-12-25"; c.title = "2028 考研初试"; changed = true; }
      if (c.date === "2026-12-12" && c.title.indexOf("六级") >= 0) { c.date = "2027-12-12"; changed = true; }
    });
    return changed;
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.v === 1) { data = d; if (migrate()) save(true); return; }
      }
    } catch (e) { /* 损坏则重建，先保留旧数据 */ }
    data = defaultData();
  }
  function save(quiet) {
    data.meta.updated = nowStr();
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
      if (!quiet) { var el = $id("sideSave"); if (el) el.textContent = "已保存 " + data.meta.updated.slice(11); }
    } catch (e) {
      toast("保存失败：浏览器存储空间可能已满", true);
    }
  }
  function refresh() {
    renderAll();
    save(true);
  }

  /* ---------- 链接平台识别 ---------- */
  function detectPlatform(url) {
    if (!url) return "";
    var u = String(url).toLowerCase();
    if (u.indexOf("bilibili.com") >= 0 || u.indexOf("b23.tv") >= 0) return "哔哩哔哩";
    if (u.indexOf("pan.baidu.com") >= 0) return "百度网盘";
    if (u.indexOf("aliyundrive") >= 0 || u.indexOf("alipan") >= 0) return "阿里云盘";
    if (u.indexOf("pan.quark.cn") >= 0) return "夸克网盘";
    if (u.indexOf("xiaohongshu.com") >= 0 || u.indexOf("xhslink.com") >= 0) return "小红书";
    if (u.indexOf("douyin.com") >= 0 || u.indexOf("iesdouyin.com") >= 0) return "抖音";
    if (u.indexOf("zhihu.com") >= 0 || u.indexOf("zhuanlan.zhihu.com") >= 0) return "知乎";
    if (u.indexOf("weibo.com") >= 0) return "微博";
    if (u.indexOf("youtube.com") >= 0 || u.indexOf("youtu.be") >= 0) return "YouTube";
    if (u.indexOf("baidu.com") >= 0) return "百度";
    return "";
  }
  function detectBvid(url) {
    var m = String(url || "").match(/BV[0-9A-Za-z]{10}/);
    return m ? m[0] : "";
  }
  function extractCodeFromUrl(url) {
    var m = String(url || "").match(/(?:pwd|code)[=:]([0-9A-Za-z]{4})/i);
    return m ? m[1] : "";
  }
  function tryFetchBiliTitle(bvid, cb) {
    /* 尝试通过公开接口获取标题；受浏览器跨域限制可能失败，失败走手动兜底 */
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://api.bilibili.com/x/web-interface/view?bvid=" + bvid, true);
    xhr.timeout = 6000;
    xhr.onload = function () {
      try {
        var j = JSON.parse(xhr.responseText);
        if (j && j.code === 0 && j.data && j.data.title) cb(j.data.title);
        else cb(null);
      } catch (e) { cb(null); }
    };
    xhr.onerror = function () { cb(null); };
    xhr.ontimeout = function () { cb(null); };
    xhr.send();
  }

  /* ---------- 全局状态 ---------- */
  var W = {
    icons: ICONS,
    data: data,
    settings: null,
    ui: { view: "today", libraryCat: "", libraryState: "", libraryDom: "", libraryKw: "", searchKw: "", mistakeSubj: "", aiChat: [] },
    timer: { total: 1500, left: 1500, running: false, iv: null }
  };
  window.W = W;

  /* ---------- 导航结构 ---------- */
  function navItems() {
    var items = [];
    items.push({ group: "开始" });
    items.push({ view: "today", label: "今日", icon: "sun" });
    items.push({ group: "我的领域" });
    data.domains.slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (dm) {
      items.push({ view: "domain:" + dm.id, label: dm.name, icon: dm.type === "courses" ? "book" : dm.type === "paper" ? "file" : dm.type === "kaoyan" ? "target" : "book", domain: true });
    });
    items.push({ group: "工具" });
    items.push({ view: "focus", label: "专注", icon: "timer" });
    items.push({ view: "activity", label: "学习记录", icon: "trending" });
    items.push({ view: "library", label: "资料库", icon: "folder" });
    items.push({ view: "inbox", label: "收集箱", icon: "inbox", badge: (data.inbox || []).filter(function (x) { return x.status === "待分拣"; }).length });
    items.push({ view: "mistakes", label: "错题本", icon: "alert" });
    items.push({ view: "qa", label: "答疑库", icon: "help" });
    items.push({ view: "reviews", label: "复盘", icon: "refresh" });
    items.push({ view: "health", label: "健康", icon: "heart" });
    items.push({ view: "calendar", label: "日历", icon: "calendar" });
    items.push({ view: "accounts", label: "账号", icon: "user" });
    items.push({ group: "系统" });
    items.push({ view: "search", label: "搜索", icon: "search" });
    items.push({ view: "ai", label: "AI 帮手", icon: "spark" });
    items.push({ view: "settings", label: "设置与数据", icon: "settings" });
    return items;
  }

  function viewTitle(view) {
    if (view === "today") return { t: "今日", s: "每天从这里开始" };
    if (view.indexOf("domain:") === 0) {
      var dm = data.domains.filter(function (x) { return x.id === view.slice(7); })[0];
      return dm ? { t: dm.name, s: dm.type === "courses" ? "课程与作业" : dm.type === "paper" ? "论文进度" : "领域概览" } : { t: "领域", s: "" };
    }
    var map = {
      library: { t: "资料库", s: "分类、标签、链接识别" },
      inbox: { t: "收集箱", s: "先收着，稍后整理" },
      mistakes: { t: "错题本", s: "错题是复习的宝藏" },
      qa: { t: "答疑库", s: "问过的题不再错" },
      reviews: { t: "复盘", s: "让进步发生" },
      health: { t: "健康", s: "学习的第一步" },
      focus: { t: "专注", s: "番茄钟计时" },
      activity: { t: "学习记录", s: "自动汇总你今天干了什么" },
      calendar: { t: "日历", s: "重要日期一目了然" },
      accounts: { t: "账号", s: "管理我的平台账号" },
      search: { t: "搜索", s: "一次搜遍全部内容" },
      ai: { t: "AI 帮手", s: "辅助学习与整理" },
      settings: { t: "设置与数据", s: "说明、备份、更新日志" }
    };
    return map[view] || { t: view, s: "" };
  }

  /* ---------- 渲染 ---------- */
  function renderAll() {
    renderNav();
    renderView();
  }
  function renderNav() {
    var nav = $id("sideNav");
    var html = "";
    navItems().forEach(function (it) {
      if (it.group) { html += '<div class="nav-group"><div class="nav-group-title">' + it.group + "</div></div>"; return; }
      var active = W.ui.view === it.view ? " active" : "";
      html += '<button class="nav-item' + active + '" data-action="nav" data-view="' + it.view + '">' +
        ICONS[it.icon] + "<span>" + it.label + "</span>" +
        (it.badge ? '<span class="nav-badge">' + it.badge + "</span>" : "") + "</button>";
    });
    nav.innerHTML = html;

    /* 手机底部导航 */
    var mn = $id("mobileNav");
    var primary = data.settings.primaryDomain || data.domains[0].id;
    var pv = "domain:" + primary;
    var bottom = [
      { view: "today", label: "今日", icon: "sun" },
      { view: pv, label: (data.domains.filter(function (x) { return x.id === primary; })[0] || {}).name || "领域", icon: "target" },
      { view: "__plus", label: "添加", icon: "plus" },
      { view: "__more", label: "更多", icon: "grid" }
    ];
    mn.innerHTML = bottom.map(function (b) {
      var active = W.ui.view === b.view ? " active" : "";
      return '<button class="mn-item' + active + '" data-action="' + (b.view === "__plus" ? "quick-add" : b.view === "__more" ? "open-drawer" : "nav") + '" data-view="' + b.view + '">' +
        ICONS[b.icon] + "<span>" + b.label + "</span></button>";
    }).join("");

    /* 抽屉 */
    var db = $id("drawerBody");
    var dhtml = "";
    navItems().forEach(function (it) {
      if (it.group) { dhtml += '<div class="drawer-group-title">' + it.group + "</div>"; return; }
      var active = W.ui.view === it.view ? " active" : "";
      dhtml += '<button class="drawer-item' + active + '" data-action="nav" data-view="' + it.view + '">' +
        ICONS[it.icon] + "<span>" + it.label + "</span></button>";
    });
    db.innerHTML = dhtml;
  }
  function renderView() {
    var wrap = $id("viewWrap");
    var view = W.ui.view;
    var v = viewTitle(view);
    $id("topbar").innerHTML = "<h1>" + v.t + '</h1><span class="topbar-sub">' + v.s + "</span>" +
      '<span class="topbar-help"><button class="icon-btn lg" data-action="help" data-help="' + view + '" title="帮助">' + ICONS.help + "</button></span>";

    var html = "";
    if (view === "today") html = Views.today();
    else if (view.indexOf("domain:") === 0) html = Views.domainView(data.domains.filter(function (x) { return x.id === view.slice(7); })[0]);
    else if (view === "library") html = Views.library();
    else if (view === "inbox") html = Views.inbox();
    else if (view === "search") html = Views.search();
    else if (view === "ai") html = Views.ai();
    else if (view === "accounts") html = Views.accounts();
    else if (view === "health") html = Views.health();
    else if (view === "focus") html = Views.focus();
    else if (view === "activity") html = Views.activity();
    else if (view === "reviews") html = Views.reviews();
    else if (view === "mistakes") html = Views.mistakes();
    else if (view === "qa") html = Views.qa();
    else if (view === "calendar") html = Views.calendar();
    else if (view === "settings") html = Views.settings();
    else html = '<div class="card">' + esc("页面不存在") + "</div>";
    wrap.innerHTML = html;
    closeDrawer();
    window.scrollTo(0, 0);
  }

  /* ---------- 模态 ---------- */
  function modalOpen(title, bodyHtml, footHtml) {
    $id("modalTitle").textContent = title;
    $id("modalBody").innerHTML = bodyHtml;
    $id("modalFoot").innerHTML = footHtml || "";
    $id("modalMask").className = "modal-mask open";
  }
  function modalClose() { $id("modalMask").className = "modal-mask"; }
  function fval(id) { var el = $id(id); return el ? el.value : ""; }

  function field(label, id, type, ph, val) {
    type = type || "text";
    return '<div class="field"><label>' + esc(label) + "</label>" +
      '<input id="' + id + '" type="' + type + '" placeholder="' + esc(ph || "") + '" value="' + esc(val || "") + '"></div>';
  }
  function area(label, id, ph, val) {
    return '<div class="field"><label>' + esc(label) + "</label>" +
      '<textarea id="' + id + '" placeholder="' + esc(ph || "") + '">' + esc(val || "") + "</textarea></div>";
  }
  function selField(label, id, opts, val) {
    var o = opts.map(function (x) {
      return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(val) ? " selected" : "") + ">" + esc(x[1]) + "</option>";
    }).join("");
    return '<div class="field"><label>' + esc(label) + '</label><select id="' + id + '">' + o + "</select></div>";
  }
  function okBtn(action, label) {
    return '<button class="btn" data-action="' + action + '">' + ICONS.check + (label || "保存") + "</button>";
  }
  function cancelBtn() { return '<button class="btn plain" data-action="modal-close">取消</button>'; }

  /* ---------- 帮助字典 ---------- */
  var HELPS = {
    "today": { t: "今日页", c: ["这里汇总你所有领域今天要做的事，不用去每个模块翻。", "今日目标：每天开始先定今天各领域学多久，晚上看完成率。", "今日任务：点圆圈即完成。任务来自各领域，不会重复维护。", "异常提醒：断签、逾期、临近的重要日期都会在这里提示。", "出错怎么办：误删任务可到设置页回收站恢复；数据每天自动保存到浏览器本地。"] },
    "goal": { t: "今日学习目标", c: ["设定今天每个领域打算学多久，如「考研 3 小时」。", "操作：点「设定今日目标」→ 选领域、填分钟 → 保存。", "完成后：今日页显示完成率进度条，打卡的学习时长自动计入。", "想改：点「调整目标」重新设置；当天目标清零不会删除打卡记录。", "出错：填错分钟直接重新保存即可。"] },
    "task": { t: "任务", c: ["任务来自各领域（考研、课程、论文等），完成一项点一下圆圈。", "操作：点「添加任务」→ 选领域、写标题、可填日期 → 保存。", "完成后：任务划线表示完成，今日页自动聚合今天到期的任务。", "撤销：点圆圈可取消完成；删除的任务进回收站可恢复。", "出错：误删了到设置页回收站恢复。"] },
    "course": { t: "今日课程", c: ["显示今天的课表，数据来自「学业课程」领域。", "操作：在学业课程页添加课程（课名、老师、星期、时间、地点）。", "完成后：今日页和课程页都会显示。", "改：在课程页编辑或删除。", "出错：没显示说明今天没有排课或课程未添加。"] },
    "alert": { t: "异常提醒", c: ["自动检查三类问题：逾期未完成任务、连续两天以上没打卡、3 天内的重要日期。", "不需要操作，看到后处理对应事项即可；处理完自动消失。", "想关掉：暂时无法关闭，它是监督机制的一部分。"] },
    "inbox": { t: "收集箱", c: ["临时存放还没想好放哪的内容：文字、链接、任务、文件。", "操作：点「添加收集」粘贴内容或链接 → AI 会给出去向建议 → 你确认后才移动。", "完成后：内容进入对应模块（资料库或某个领域）。", "撤销：移动后原内容仍保留在收集箱「已分拣」列表。", "出错：点「丢弃」删除，可到回收站恢复。"] },
    "stages": { t: "备考阶段", c: ["把备考分成几个阶段（如基础/强化/冲刺），清楚自己现在在哪。", "操作：点「编辑阶段」修改阶段名称、结束时间和目标。", "完成后：时间线高亮当前阶段。", "何时推进：一个阶段目标达成后，可在编辑里调整。", "出错：阶段只是标记，不影响数据。"] },
    "subjects": { t: "科目进度", c: ["记录每科复习到百分之几，心里有数。", "操作：点科目右侧编辑按钮，填进度百分比和备注。", "完成后：进度条更新，今日页与领域页同步显示。", "出错：填错了重填即可，无副作用。"] },
    "weekly": { t: "本周计划", c: ["周一到周日每天安排任务，适合做每周规划。", "操作：每天下方点「添加」写任务，点圆圈完成。", "完成后：每日完成情况可见，周复盘会参考它。", "撤销：点垃圾桶删除单项。", "出错：计划是参考，没有严格惩罚，坚持就好。"] },
    "stats": { t: "学习统计", c: ["最近 7 天每天学习时长的柱状图，来自打卡记录。", "数据来自「打卡学习」，只记录你真实填写的时长。", "没数据时显示空状态，不画假图。"] },
    "heatmap": { t: "打卡热力图", c: ["近 28 天每天是否学习、学多久，颜色越深学得越久。", "断签一眼可见，这是自我监督工具。", "点「打卡学习」选择领域、科目和分钟数。", "出错：打卡错了可删除当天记录（在打卡弹窗中可查看当日记录）。"] },
    "resources": { t: "资料库", c: ["所有学习资料集中存放：课程、考研、论文、课外。", "粘贴链接自动识别平台：B站、百度网盘、阿里云盘、夸克、小红书、抖音、知乎等。", "B站链接会尝试自动获取标题；受浏览器限制失败时请手动补标题，链接本身仍可保存和搜索。", "网盘链接可填提取码。", "状态：未看 / 在看 / 看完，标记学习进度。", "删除进回收站可恢复。"] },
    "sort-inbox": { t: "确认去向", c: ["把收集箱内容移动到目标模块。", "操作：点「确认去向」→ 选择目标（资料库或某个领域）→ 保存。", "完成后：内容出现在目标模块，收集箱标记为已分拣。", "撤销：移动后收集箱仍保留记录。", "出错：选错目标可在目标模块删除（进回收站）。"] },
    "search": { t: "搜索", c: ["一次搜索所有模块：资料、任务、错题、答疑、复盘、课程、账号、收集箱。", "输入关键词回车或点搜索按钮，结果按模块分组。", "搜索范围包括标题、内容、标签、链接地址。"] },
    "mistakes": { t: "错题本", c: ["记录错题：题目、错因、正确答案、是否已复习。", "按科目筛选（数学、英语、专业课等）。", "考前翻看，错题是复习的宝藏。", "「标记已复习」用于复习轮次管理。"] },
    "qa": { t: "答疑库", c: ["记录问过的问题和解答，按科目分类。", "AI 对话的解答也可以粘贴存档到这里。", "考前翻看，问过的题不再错。"] },
    "daily-review": { t: "每日复盘", c: ["3 个问题：今天完成了什么 / 没完成什么及原因 / 明天怎么调整。", "1 分钟完成，坚持比完美重要。", "完成后今天算复盘过，可修改。", "历史在下方时间线，能看到进步轨迹。"] },
    "weekly-review": { t: "每周复盘", c: ["AI 自动汇总本周数据（各领域时长、任务完成、打卡、健康）生成草稿。", "草稿可以修改，确认后才保存。", "每周日做一次，形成常态。"] },
    "health": { t: "健康页", c: ["记录睡眠、运动、当日状态；专注计时（番茄钟）也在这里。", "睡眠：记录几点睡几点起，自动算时长，周报统计平均睡眠。", "运动：记当天是否运动。", "状态：开始学习前标一下精力充沛/一般/疲惫，复盘对照。", "提醒只在页面打开时生效，手机锁屏后浏览器无法提醒，这是所有网页的限制。"] },
    "timer": { t: "专注计时（番茄钟）", c: ["独立页面，圆形进度环显示剩余时间。", "25/45/60 分钟预设，可随时开始/暂停/重置。", "完成一次专注会自动记录（今日番茄数、累计番茄），并弹出小奖励。", "专注历史记录每次完成的时间。", "注意：页面打开时有效；手机锁屏或切到其他应用会暂停，这是网页的限制。", "专注完成后可去领域页打卡学习时长。"] },
    "focus-history": { t: "专注历史", c: ["记录每次完成的专注（时长、日期）。", "数据自动记录，无需手动填写。"] },
    "activity-today": { t: "今日时间线", c: ["自动汇总你今天的所有学习活动：打卡、完成的任务、专注、新增的资料/答疑/错题/生词、复盘。", "按时间顺序排列，不用自己记。", "记录全部来自你真实操作的数据，不会编造。"] },
    "activity-history": { t: "最近 7 天", c: ["每天的学习时长、专注次数、是否复盘。", "想不起来昨天干了什么，看这里。"] },
    "accounts": { t: "账号管理", c: ["记录你在各平台用的账号：平台 + 账号名 + 用途。", "只存公开信息，不存密码，不会登录你的账号。", "密码请用浏览器自带的密码管理器。"] },
    "calendar": { t: "日历", c: ["当月日历 + 重要日期列表（考研报名、四六级、期末、论文截止等）。", "有标记的日子在日历上有圆点。", "临近 3 天会在今日页异常提醒出现。"] },
    "important-dates": { t: "重要日期", c: ["记录不忘记的日子：考试、报名、截止日期。", "添加后日历有标记，临近自动提醒。", "删除进回收站可恢复。"] },
    "guide": { t: "使用说明", c: ["工作台总览：今日、领域、资料库、收集箱、搜索、AI、设置。", "每个页面右上角问号都有详细说明。", "数据存在本机浏览器，请定期导出备份。"] },
    "api": { t: "AI 配置", c: ["填入 OpenAI 兼容的 API 地址、模型名和密钥，对话式 AI 即启用。", "密钥只存你浏览器的本地存储，不上传公开仓库。", "费用：由你的 API 服务按量计费，与工作台无关。", "不配置时，本地规则功能（收集箱建议、周复盘草稿、学习摘要）照常可用。"] },
    "data": { t: "数据管理", c: ["导出：下载 JSON 文件，妥善保存即备份。", "导入：选择备份文件恢复，导入前自动备份当前数据。", "清空示例：只删除预置示例，你自己的数据不动。", "换电脑或清浏览器前先导出。"] },
    "trash": { t: "回收站", c: ["删除的内容先进这里，可恢复。", "清空回收站后不可恢复，请谨慎。"] },
    "domains": { t: "领域管理", c: ["你的学习领域可增删：考研、英语学习、AI 学习、课程、论文。", "新建领域：输入名称、选择类型（通用/课程/论文）。", "手机底部导航第二个入口可设置为你最常用的领域。", "删除领域：领域下关联的资料不会删除，仍留在资料库。"] },
    "subgroups": { t: "专项", c: ["领域里单独划出的专项，如英语学习里的四六级。", "专项有自己的考试倒计时和科目进度（听力/阅读/写作/翻译）。", "点科目右侧按钮更新进度，与主领域互不影响。", "示例：英语学习（长期）→ 四六级（专项）+ 词汇/口语等长期技能。"] },
    "wordbook": { t: "生词本", c: ["记录英语生词：单词、释义、备注。", "点「标记掌握」进入已掌握列表，未掌握的一直显示待复习。", "复习节奏建议：当天记 → 3 天后复习 → 1 周后复习 → 掌握后隔几周回顾。", "删除进回收站可恢复。", "未来可接入开源词典数据做自动释义（升级功能，当前未启用）。"] },
    "english-tools": { t: "英语配套功能", c: ["英语学习领域专属的快捷入口。", "答疑库：记录英语问题与解答；错题本：记录英语错题；AI 帮手：配置 API 后可做翻译、作文批改、口语对话（当前未配置时不可用，本地工具不受影响）。"] },
    "changelog": { t: "更新日志", c: ["每次更新记录：日期、版本、修改内容、影响范围、是否需要你操作。"] }
  };
  function showHelp(key) {
    var h = HELPS[key] || HELPS.today;
    var box = $id("helpBox");
    box.innerHTML = "<h3 style=\"font-size:17px;margin-bottom:4px;\">" + esc(h.t) + "</h3>" +
      h.c.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    $id("helpMask").className = "help-mask open";
  }
  function closeHelp() { $id("helpMask").className = "help-mask"; }

  function openDrawer() { $id("drawer").className = "drawer open"; $id("drawerMask").className = "drawer-mask open"; }
  function closeDrawer() { $id("drawer").className = "drawer"; $id("drawerMask").className = "drawer-mask"; }

  function go(view) {
    W.ui.view = view;
    W.ui.searchKw = "";
    renderAll();
  }

  /* ---------- 页面背景 ---------- */
  var BG_LIST = [
    { id: "default", name: "经典米白", desc: "默认背景" },
    { id: "dots", name: "淡雅波点", desc: "圆点纹理" },
    { id: "grid", name: "细线网格", desc: "网格纹理" },
    { id: "waves", name: "柔和波浪", desc: "波浪纹理" },
    { id: "gradient", name: "清新渐变", desc: "低饱和渐变" }
  ];
  function applyBg() {
    var cur = (data.settings && data.settings.background) || "default";
    var body = document.body;
    body.className = body.className.replace(/\s*bg-\w+/g, "").trim();
    if (cur !== "default") body.className += " bg-" + cur;
  }

  /* ---------- AI 本地规则 ---------- */
  function suggestTarget(content) {
    var c = String(content || "").toLowerCase();
    var targets = [
      { k: ["考研", "数学", "英语", "政治", "专业课", "高数", "线代", "真题"], d: "kaoyan", label: "考研备考" },
      { k: ["四六级", "六级", "四级", "cet"], d: "cet", label: "四六级" },
      { k: ["论文", "文献", "综述", "实验数据", "材料表征"], d: "paper", label: "论文写作" },
      { k: ["作业", "课程", "考试", "报告"], d: "courses", label: "学业课程" },
      { k: ["ai", "大模型", "提示词", "机器学习", "深度学习"], d: "ai", label: "AI 知识学习" }
    ];
    for (var i = 0; i < targets.length; i++) {
      for (var j = 0; j < targets[i].k.length; j++) {
        if (c.indexOf(targets[i].k[j]) >= 0) return { d: targets[i].d, label: targets[i].label };
      }
    }
    return { d: "library", label: "资料库" };
  }
  function aiDraftWeekly() {
    var d = data;
    var weekStart = (function () {
      var dt = new Date(); var day = dt.getDay() || 7; dt.setDate(dt.getDate() - day + 1);
      return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
    })();
    var logs = (d.studyLog || []).filter(function (x) { return x.date >= weekStart; });
    var byDom = {};
    logs.forEach(function (x) { byDom[x.domainId] = (byDom[x.domainId] || 0) + (x.minutes || 0); });
    var domNames = { kaoyan: "考研备考", cet: "四六级", ai: "AI 学习", courses: "课程", paper: "论文" };
    var total = logs.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    var tasksDone = (d.tasks || []).filter(function (t) { return t.done; }).length;
    var tasksAll = (d.tasks || []).length;
    var sleepArr = (d.health.sleep || []);
    var sleepSum = sleepArr.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    var lines = [];
    lines.push("本周学习总时长约 " + Math.round(total / 60) + " 小时" + (total > 0 ? "。" : "（本周暂无打卡记录）。"));
    var parts = Object.keys(byDom).map(function (k) { return domNames[k] || k + " " + Math.round(byDom[k] / 60) + " 小时"; });
    if (parts.length) lines.push("各领域： " + parts.join("、") + "。");
    lines.push("任务完成 " + tasksDone + "/" + tasksAll + "（" + (tasksAll ? Math.round(tasksDone / tasksAll * 100) : 0) + "%）。");
    if (sleepArr.length) lines.push("近 7 天平均睡眠 " + Math.round(sleepSum / sleepArr.length / 60) + " 小时" + (sleepSum / sleepArr.length / 60 < 7 ? "，略低于 7 小时，注意休息。" : "，状态良好。"));
    else lines.push("睡眠记录暂无。");
    lines.push("建议：回顾本周未完成的事，写进下周计划；把没弄懂的错题、答疑翻一遍。");
    return lines.join("\n");
  }
  function aiSummary() {
    var d = data;
    var month = todayStr().slice(0, 7);
    var logs = (d.studyLog || []).filter(function (x) { return x.date.indexOf(month) === 0; });
    var byDom = {}, bySubj = {};
    logs.forEach(function (x) {
      byDom[x.domainId] = (byDom[x.domainId] || 0) + (x.minutes || 0);
      if (x.subject) bySubj[x.subject] = (bySubj[x.subject] || 0) + (x.minutes || 0);
    });
    var total = logs.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    var lines = ["本月（" + month + "）学习摘要："];
    lines.push("总时长约 " + Math.round(total / 60) + " 小时，打卡 " + logs.length + " 次。");
    var domNames = { kaoyan: "考研备考", cet: "四六级", ai: "AI 学习", courses: "课程", paper: "论文" };
    Object.keys(byDom).forEach(function (k) { lines.push("· " + (domNames[k] || k) + "：" + Math.round(byDom[k] / 60) + " 小时"); });
    lines.push("按科目： " + Object.keys(bySubj).map(function (s) { return s + " " + Math.round(bySubj[s] / 60) + " 小时"; }).join("、") + "。");
    lines.push("本周复盘草稿可在此基础上生成。");
    return lines.join("\n");
  }

  /* ---------- AI 对话（需配置 API） ---------- */
  function aiSend(text) {
    var s = data.settings;
    var chat = $id("aiChat");
    var mk = function (cls, txt, saveIdx) {
      var div = document.createElement("div");
      div.className = "msg " + cls;
      div.textContent = txt;
      if (saveIdx != null) {
        var bar = document.createElement("div");
        bar.style.cssText = "margin-top:8px;display:flex;gap:8px;";
        bar.innerHTML = '<button class="btn small plain" data-action="ai-save" data-id="' + saveIdx + '">' + ICONS.folder + "保存到工作台</button>";
        div.appendChild(bar);
      }
      return div;
    };
    chat.appendChild(mk("user", text));
    if (!s.apiKey || !s.apiBase) {
      chat.appendChild(mk("bot", "对话式 AI 未启用：请先在「设置与数据 → AI 配置」填入 API 地址、模型和密钥。"));
      chat.scrollTop = chat.scrollHeight;
      return;
    }
    chat.appendChild(mk("bot", "思考中…"));
    chat.scrollTop = chat.scrollHeight;
    var url = String(s.apiBase).replace(/\/+$/, "") + "/chat/completions";
    var body = {
      model: s.apiModel || "deepseek-chat",
      messages: W.ui.aiChat.concat([{ role: "user", content: text }]),
      temperature: 0.6
    };
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.apiKey },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); }).then(function (j) {
      chat.removeChild(chat.lastChild);
      var reply = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!reply) {
        chat.appendChild(mk("bot", "AI 返回了空结果，可能密钥或地址配置有误。"));
        toast("AI 请求失败，请检查配置", true);
      } else {
        W.ui.aiChat.push({ role: "user", content: text });
        W.ui.aiChat.push({ role: "assistant", content: reply });
        var idx = W.ui.aiChat.length - 1;
        chat.appendChild(mk("bot", reply, idx));
        if (W.ui.aiChat.length > 20) W.ui.aiChat = W.ui.aiChat.slice(-20);
      }
      chat.scrollTop = chat.scrollHeight;
    }).catch(function () {
      chat.removeChild(chat.lastChild);
      chat.appendChild(mk("bot", "请求失败：网络不通或 API 地址错误。请检查配置后重试。"));
      chat.scrollTop = chat.scrollHeight;
    });
  }
  /* AI 回答 → 保存到工作台（分类存放） */
  function suggestSubject(txt) {
    var c = String(txt || "").toLowerCase();
    if (/英语|单词|词汇|语法|作文|听力|阅读|翻译|四六|六级|四级/.test(c)) return "英语";
    if (/数学|高数|线代|概率/.test(c)) return "数学";
    if (/政治|马原|毛概|思修/.test(c)) return "政治";
    if (/材料|专业|高物|化学/.test(c)) return "专业课";
    return "未分类";
  }
  function aiSaveModal(idx) {
    var m = W.ui.aiChat[idx];
    if (!m || m.role !== "assistant") return;
    var content = m.content;
    var subj = suggestSubject(content);
    var cetDm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var hasWordbook = !!cetDm;
    var typeOpts = '<option value="qa">答疑记录（问题+解答）</option>' +
      '<option value="resource">学习资料（存入资料库）</option>' +
      (hasWordbook ? '<option value="word">生词（存入英语生词本）</option>' : "");
    modalOpen("保存到工作台",
      '<div class="li-sub" style="margin-bottom:10px;">内容预览：' + esc(content.slice(0, 80)) + (content.length > 80 ? "…" : "") + "</div>" +
      '<div class="field"><label>保存为</label><select id="asType">' + typeOpts + "</select></div>" +
      '<div class="field"><label>科目 / 分类（已自动推荐，可修改）</label><input id="asSubject" value="' + esc(subj) + '"></div>' +
      '<div class="field" id="asCatWrap" style="display:none;"><label>资料分类</label><select id="asCat">' +
      '<option value="考研">考研</option><option value="课程">课程</option><option value="课外">课外</option><option value="其他">其他</option></select></div>' +
      '<div class="field"><label>备注（可选）</label><input id="asNote" placeholder="来源：AI 对话"></div>',
      cancelBtn() + '<button class="btn" data-action="submit-ai-save" data-id="' + idx + '">' + ICONS.check + "保存</button>");
    var typeSel = $id("asType");
    typeSel.addEventListener("change", function () {
      $id("asCatWrap").style.display = typeSel.value === "resource" ? "" : "none";
    });
  }
  function submitAiSave(idx) {
    var m = W.ui.aiChat[idx];
    if (!m) return;
    var type = fval("asType");
    var subject = fval("asSubject").trim() || "未分类";
    var note = fval("asNote").trim() || "来源：AI 对话";
    if (type === "qa") {
      data.qa.push({ id: uid(), subject: subject, question: "AI 解答（" + subject + "）", answer: m.content, date: todayStr() });
      toast("已存入答疑库");
    } else if (type === "resource") {
      data.resources.push({ id: uid(), title: m.content.slice(0, 40), category: fval("asCat"), tags: [subject], url: "", platform: "", extractCode: "", status: "未看", domainId: "", note: m.content, createdAt: nowStr(), updatedAt: nowStr() });
      toast("已存入资料库");
    } else if (type === "word") {
      var cetDm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
      if (cetDm) {
        cetDm.wordbook = cetDm.wordbook || [];
        cetDm.wordbook.push({ id: uid(), word: m.content.split(/[\s，。,.；;]/)[0].slice(0, 30), meaning: m.content.slice(0, 60), note: note, mastered: false, date: todayStr() });
        toast("已存入英语生词本");
      }
    }
    modalClose();
    refresh();
  }

  /* ---------- 导出 / 导入 ---------- */
  function exportData() {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "工作台备份_" + todayStr() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    toast("已导出备份文件");
  }
  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        if (!d || !d.domains) { toast("文件格式不正确，导入已取消", true); return; }
        localStorage.setItem(STORE_KEY + "_preimport_backup", JSON.stringify(data));
        data = d;
        data.meta.updated = nowStr();
        W.data = data;
        save(true);
        renderAll();
        toast("导入成功（导入前数据已自动备份）");
      } catch (e) { toast("文件解析失败，导入已取消", true); }
    };
    reader.readAsText(file);
  }

  /* ---------- 奖励与鼓励 ---------- */
  var REWARDS = ["奖励一杯奶茶", "奖励看一集喜欢的视频", "奖励出门散步 15 分钟", "奖励听一首喜欢的歌", "奖励一个小零食", "奖励 10 分钟自由时间", "奖励刷 10 分钟手机（就 10 分钟）", "奖励给朋友夸夸自己"];
  var PRAISES = ["做得好", "状态不错", "又进一步", "稳扎稳打", "真棒", "继续加油", "今天的你很靠谱", "保持这个节奏"];
  function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function calcStreakDays() {
    var logs = {};
    (data.studyLog || []).forEach(function (x) { logs[x.date] = 1; });
    var dt = new Date(), n = 0;
    while (true) {
      var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      if (logs[key]) { n++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    return n;
  }
  function rewardModal(title, msg, withReward) {
    var streak = calcStreakDays();
    var reward = withReward ? randomPick(REWARDS) : null;
    var html = '<div style="text-align:center;padding:10px 0;">' +
      '<div style="font-size:15px;font-weight:700;margin-bottom:8px;">' + esc(title) + "</div>" +
      '<p style="font-size:14px;color:var(--sub);margin-bottom:12px;">' + esc(msg) + "</p>";
    if (streak > 0) html += '<div class="li-sub" style="margin-bottom:10px;">连续打卡 ' + streak + ' 天' + (streak >= 7 ? "，已经坚持一整周了" : streak >= 3 ? "，节奏很稳" : "，好的开始") + "</div>";
    if (reward) html += '<div class="card tint-yellow" style="margin:6px auto 4px;max-width:260px;padding:14px;">' + esc(reward) + "</div>";
    html += "</div>";
    modalOpen("给你的小奖励", html, '<button class="btn" data-action="modal-close">' + ICONS.check + "收到</button>");
  }

  /* ---------- 番茄钟 ---------- */
  function timerRender() {
    var el = $id("timerDisp");
    if (!el) return;
    var m = Math.floor(W.timer.left / 60), s = W.timer.left % 60;
    el.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    var btn = $id("timerBtn");
    if (btn) btn.innerHTML = (W.timer.running ? "暂停" : "继续");
    /* 圆环进度 */
    var ring = $id("timerRing");
    if (ring) {
      var r = 130, circ = 2 * Math.PI * r;
      var remain = W.timer.left / W.timer.total;
      ring.setAttribute("stroke-dashoffset", String(circ * (1 - remain)));
    }
    var st = $id("timerState");
    if (st) {
      if (W.timer.running) st.textContent = "专注中，坚持住";
      else if (W.timer.left < W.timer.total) st.textContent = "已暂停";
      else st.textContent = "准备开始";
    }
  }
  function timerBeep() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var o = ctx.createOscillator(); var g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.2;
      o.start(); setTimeout(function () { o.stop(); ctx.close(); }, 700);
    } catch (e) { /* 音频不可用则只提示 */ }
  }
  function timerStart() {
    if (W.timer.iv) clearInterval(W.timer.iv);
    W.timer.running = true;
    W.timer.iv = setInterval(function () {
      if (!W.timer.running) return;
      W.timer.left--;
      timerRender();
      if (W.timer.left <= 0) {
        clearInterval(W.timer.iv);
        W.timer.running = false;
        /* 记录本次专注 */
        data.focusSessions = data.focusSessions || [];
        var totalMin = W.timer.total / 60;
        data.focusSessions.push({ id: uid(), date: todayStr(), minutes: totalMin, ts: nowStr().slice(11) });
        save(true);
        W.timer.left = W.timer.total;
        timerRender();
        toast("专注完成，休息一下吧");
        timerBeep();
        rewardModal("专注完成", "完成一次 " + totalMin + " 分钟专注，给自己一个肯定。", false);
        /* 若在专注页，刷新统计 */
        if (W.ui.view === "focus") renderView();
      }
    }, 1000);
    timerRender();
  }
  function timerPause() { W.timer.running = false; timerRender(); }
  function timerReset() {
    W.timer.running = false;
    if (W.timer.iv) clearInterval(W.timer.iv);
    W.timer.left = W.timer.total;
    timerRender();
  }

  /* ---------- 久坐提醒 ---------- */
  var remindIv = null;
  function scheduleRemind() {
    if (remindIv) clearInterval(remindIv);
    var min = (data.health.settings || {}).remindMin || 0;
    if (min > 0) remindIv = setInterval(function () { toast("已连续学习 " + min + " 分钟，起来活动 5 分钟，看看远处"); }, min * 60000);
  }

  /* ---------- 事件委托 ---------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!el) return;
    var act = el.getAttribute("data-action");
    var id = el.getAttribute("data-id");
    var view = el.getAttribute("data-view");
    var domain = el.getAttribute("data-domain");
    var subject = el.getAttribute("data-subject");
    var day = el.getAttribute("data-day");
    var dir = el.getAttribute("data-dir");
    var key = el.getAttribute("data-help");
    var v = el.getAttribute("data-v");
    e.preventDefault();

    switch (act) {
      case "nav": go(view); break;
      case "help": showHelp(key || W.ui.view); break;
      case "modal-close": modalClose(); break;
      case "open-drawer": openDrawer(); break;
      case "quick-add": quickAdd(); break;
      case "open-library": go("library"); break;
      case "open-inbox": go("inbox"); break;
      case "open-reviews": go("reviews"); break;
      case "open-qa": go("qa"); break;
      case "open-mistakes": go("mistakes"); break;
      case "open-ai": go("ai"); break;
      case "open-focus": go("focus"); break;

      /* 任务 */
      case "toggle-task": {
        var t = data.tasks.filter(function (x) { return x.id === id; })[0];
        if (t) {
          t.done = !t.done;
          t.doneAt = t.done ? nowStr() : "";
          refresh();
          if (t.done) toast("任务完成，" + randomPick(PRAISES));
          else toast("已恢复为未完成");
        }
        break;
      }
      case "add-task": addTaskModal(domain); break;
      case "edit-task": editTaskModal(id); break;
      case "del-task": {
        var t2 = data.tasks.filter(function (x) { return x.id === id; })[0];
        if (t2) {
          data.tasks = data.tasks.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "任务", title: t2.title, deletedAt: nowStr() });
          refresh(); toast("任务已删除，可在设置页回收站恢复");
        }
        break;
      }

      /* 今日目标 */
      case "add-goal": goalModal(); break;

      /* 领域 */
      case "edit-domain": editDomainModal(domain || id); break;
      case "del-domain": delDomainConfirm(domain || id); break;
      case "add-domain": addDomainModal(); break;
      case "update-subject": subjectModal(domain, subject); break;
      case "toggle-weekly": toggleWeekly(domain, day, id); break;
      case "add-weekly": addWeeklyModal(domain, day); break;
      case "del-weekly": delWeekly(domain, day, id); break;
      case "punch": punchModal(domain); break;

      /* 生词本 */
      case "add-word": addWordModal(domain); break;
      case "toggle-word": toggleWord(domain, id); break;
      case "del-word": delWord(domain, id); break;

      /* 课程 */
      case "add-course": courseModal(null, domain); break;
      case "edit-course": courseModal(id, domain); break;
      case "del-course": delCourse(domain, id); break;
      case "add-assignment": assignmentModal(null, domain); break;
      case "toggle-assignment": toggleAssignment(domain, id); break;
      case "del-assignment": delAssignment(domain, id); break;

      /* 论文 */
      case "paper-stage": paperStage(domain, dir); break;
      case "add-ref": refModal(null, domain); break;
      case "del-ref": delRef(domain, id); break;

      /* 资料库 */
      case "lib-cat": W.ui.libraryCat = (v === "全部" ? "" : v); renderView(); break;
      case "lib-state": W.ui.libraryState = (v === "全部状态" ? "" : v); renderView(); break;
      case "lib-dom": W.ui.libraryDom = v; renderView(); break;
      case "lib-search": W.ui.libraryKw = (fval("libKw") || "").trim(); renderView(); break;
      case "add-resource": resourceModal(null); break;
      case "edit-resource": resourceModal(id); break;
      case "del-resource": {
        var r = data.resources.filter(function (x) { return x.id === id; })[0];
        if (r) {
          data.resources = data.resources.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "资料", title: r.title, deletedAt: nowStr() });
          refresh(); toast("资料已删除，可在回收站恢复");
        }
        break;
      }
      case "set-status": {
        var r2 = data.resources.filter(function (x) { return x.id === id; })[0];
        if (r2) {
          var next = r2.status === "未看" ? "在看" : r2.status === "在看" ? "看完" : "未看";
          r2.status = next; r2.updatedAt = nowStr(); refresh();
        }
        break;
      }

      /* 收集箱 */
      case "add-inbox": inboxModal(); break;
      case "del-inbox": {
        var x = data.inbox.filter(function (y) { return y.id === id; })[0];
        if (x) {
          data.inbox = data.inbox.filter(function (y) { return y.id !== id; });
          data.deleted.push({ id: id, kind: "收集箱", title: x.content || x.url, deletedAt: nowStr() });
          refresh(); toast("已丢弃，可在回收站恢复");
        }
        break;
      }
      case "sort-inbox": sortModal(id); break;
      case "ai-sort-all": aiSortAll(); break;

      /* 搜索 */
      case "do-search": W.ui.searchKw = (fval("searchInput") || "").trim(); renderView(); break;

      /* 错题 */
      case "add-mistake": mistakeModal(null); break;
      case "edit-mistake": mistakeModal(id); break;
      case "del-mistake": {
        var m = data.mistakes.filter(function (x) { return x.id === id; })[0];
        if (m) {
          data.mistakes = data.mistakes.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "错题", title: m.title, deletedAt: nowStr() });
          refresh(); toast("错题已删除，可在回收站恢复");
        }
        break;
      }
      case "toggle-review": {
        var m2 = data.mistakes.filter(function (x) { return x.id === id; })[0];
        if (m2) { m2.reviewed = !m2.reviewed; refresh(); }
        break;
      }
      case "mistake-subj": W.ui.mistakeSubj = v; renderView(); break;

      /* 答疑 */
      case "add-qa": qaModal(null); break;
      case "edit-qa": qaModal(id); break;
      case "del-qa": {
        var q = data.qa.filter(function (x) { return x.id === id; })[0];
        if (q) {
          data.qa = data.qa.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "答疑", title: q.question, deletedAt: nowStr() });
          refresh(); toast("答疑已删除，可在回收站恢复");
        }
        break;
      }

      /* 复盘 */
      case "add-daily-review": dailyReviewModal(null); break;
      case "edit-daily-review": dailyReviewModal(todayStr()); break;
      case "ai-draft-week": weeklyDraftModal(); break;
      case "edit-weekly-review": weeklyDraftModal(true); break;
      case "edit-review": editReviewModal(id); break;
      case "del-review": {
        var rv = data.reviews.filter(function (x) { return x.id === id; })[0];
        if (rv) {
          data.reviews = data.reviews.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "复盘", title: rv.date + " 复盘", deletedAt: nowStr() });
          refresh(); toast("复盘已删除，可在回收站恢复");
        }
        break;
      }

      /* 健康 */
      case "log-sleep": sleepModal(); break;
      case "log-sport": sportModal(); break;
      case "log-state": stateModal(); break;
      case "save-remind": {
        var min = parseInt(fval("remindMin"), 10) || 0;
        data.health.settings = data.health.settings || {};
        data.health.settings.remindMin = Math.max(0, Math.min(120, min));
        refresh(); scheduleRemind(); toast("提醒间隔已保存（页面打开时生效）");
        break;
      }
      case "timer-preset": W.timer.total = W.timer.left = parseInt(el.getAttribute("data-min"), 10) * 60; timerReset(); timerRender(); break;
      case "timer-toggle": if (W.timer.running) { timerPause(); } else { timerStart(); } break;
      case "timer-reset": timerReset(); break;

      /* 账号 */
      case "add-account": accountModal(null); break;
      case "del-account": {
        var a = data.accounts.filter(function (x) { return x.id === id; })[0];
        if (a) {
          data.accounts = data.accounts.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "账号", title: a.platform + " " + a.name, deletedAt: nowStr() });
          refresh(); toast("账号记录已删除");
        }
        break;
      }

      /* 日历 */
      case "add-calendar": calendarModal(null); break;
      case "del-calendar": {
        var c = data.calendar.filter(function (x) { return x.id === id; })[0];
        if (c) {
          data.calendar = data.calendar.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "重要日期", title: c.title, deletedAt: nowStr() });
          refresh(); toast("日期已删除，可在回收站恢复");
        }
        break;
      }

      /* 设置 */
      case "export-data": exportData(); break;
      case "import-data": importModal(); break;
      case "merge-ok": if (window.__mergeData) { doMerge(window.__mergeData); } break;
      case "reset-example": resetExampleConfirm(); break;
      case "restore-item": restoreItem(id); break;
      case "empty-trash": emptyTrashConfirm(); break;
      case "save-api": saveApi(); break;
      case "clear-api": clearApi(); break;
      case "save-primary": savePrimary(); break;
      case "set-bg": {
        data.settings.background = v;
        applyBg();
        refresh();
        toast("背景已切换");
        break;
      }

      /* AI */
      case "ai-send": {
        var txt = (fval("aiInput") || "").trim();
        if (txt) { aiSend(txt); $id("aiInput").value = ""; }
        break;
      }
      case "ai-save": aiSaveModal(parseInt(id, 10)); break;
      case "submit-ai-save": submitAiSave(parseInt(id, 10)); break;

      /* 模态提交 */
      case "submit-task": submitTask(); break;
      case "submit-goal": submitGoal(); break;
      case "submit-domain": submitDomain(); break;
      case "submit-new-domain": submitNewDomain(); break;
      case "submit-subject": submitSubject(domain, subject); break;
      case "submit-weekly": submitWeekly(domain, day); break;
      case "submit-punch": submitPunch(domain); break;
      case "submit-course": submitCourse(domain, id); break;
      case "submit-assignment": submitAssignment(domain, id); break;
      case "submit-ref": submitRef(domain, id); break;
      case "submit-resource": submitResource(id); break;
      case "submit-inbox": submitInbox(); break;
      case "submit-sort": submitSort(id); break;
      case "submit-word": submitWord(domain); break;
      case "submit-mistake": submitMistake(id); break;
      case "submit-qa": submitQa(id); break;
      case "submit-daily-review": submitDailyReview(); break;
      case "submit-weekly-draft": submitWeeklyDraft(); break;
      case "submit-sleep": submitSleep(); break;
      case "submit-sport": submitSport(); break;
      case "submit-state": submitState(); break;
      case "submit-account": submitAccount(); break;
      case "submit-calendar": submitCalendar(); break;
    }
  });

  /* 回车提交搜索 */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      if (e.target && e.target.id === "searchInput") { W.ui.searchKw = e.target.value.trim(); renderView(); }
      if (e.target && e.target.id === "aiInput") {
        var txt = e.target.value.trim();
        if (txt) { aiSend(txt); e.target.value = ""; }
      }
    }
    if (e.key === "Escape") { modalClose(); closeHelp(); closeDrawer(); }
  });

  /* ---------- 各种模态 ---------- */
  function quickAdd() {
    modalOpen("快速添加", '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<button class="btn block" data-action="add-task">' + ICONS.check + "添加任务</button>" +
      '<button class="btn block" data-action="add-inbox">' + ICONS.inbox + "收集内容 / 链接</button>" +
      '<button class="btn block" data-action="punch" data-domain="">' + ICONS.flame + "打卡学习</button>" +
      '<button class="btn block" data-action="add-resource">' + ICONS.folder + "记录资料</button>" +
      '<button class="btn block" data-action="modal-close" style="background:#EEF0ED;color:var(--text);">取消</button></div>');
  }

  function addTaskModal(domain) {
    var domOpts = data.domains.map(function (x) { return [x.id, x.name]; });
    modalOpen("添加任务",
      '<div class="field"><label>任务内容</label><input id="tTitle" placeholder="要做什么"></div>' +
      selField("所属领域", "tDomain", domOpts, domain || data.settings.primaryDomain) +
      field("日期（留空则不限，可填 YYYY-MM-DD）", "tDate", "text", "2026-08-20") +
      field("截止日期（可选）", "tDue", "text", "") +
      area("备注（可选）", "tNote", ""),
      cancelBtn() + okBtn("submit-task"));
  }
  function submitTask() {
    var title = fval("tTitle").trim();
    if (!title) { toast("请填写任务内容", true); return; }
    var editId = window.__editTaskId;
    var obj = { title: title, domainId: fval("tDomain"), date: fval("tDate"), due: fval("tDue"), done: false, note: fval("tNote"), createdAt: nowStr() };
    var t = editId ? data.tasks.filter(function (x) { return x.id === editId; })[0] : null;
    if (t) { t.title = obj.title; t.domainId = obj.domainId; t.date = obj.date; t.due = obj.due; t.note = obj.note; }
    else { obj.id = uid(); data.tasks.push(obj); }
    delete window.__editTaskId;
    modalClose(); refresh(); toast("任务已保存");
  }
  function editTaskModal(id) {
    var t = data.tasks.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var domOpts = data.domains.map(function (x) { return [x.id, x.name]; });
    modalOpen("编辑任务",
      '<div class="field"><label>任务内容</label><input id="tTitle" value="' + esc(t.title) + '"></div>' +
      selField("所属领域", "tDomain", domOpts, t.domainId) +
      field("日期", "tDate", "text", "", t.date) +
      field("截止日期", "tDue", "text", "", t.due) +
      area("备注", "tNote", "", t.note),
      cancelBtn() + okBtn("submit-task"));
    window.__editTaskId = id;
  }

  function goalModal() {
    var domOpts = data.domains.map(function (x) { return [x.id, x.name]; });
    modalOpen("设定今日目标", "今天想在各领域学多久？填完保存，晚上看完成率。" +
      '<div id="goalRows"></div>' +
      '<button class="btn ghost small" data-action="goal-add-row">' + ICONS.plus + "再加一项</button>",
      cancelBtn() + okBtn("submit-goal", "保存目标"));
    var rows = $id("goalRows");
    rows.innerHTML = '<div class="form-row">' +
      '<div class="field"><label>领域</label><select id="gDomain0">' + domOpts.map(function (x) { return '<option value="' + x[0] + '">' + esc(x[1]) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>分钟</label><input id="gMin0" type="number" min="10" step="10" value="120"></div></div>';
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (el && el.getAttribute("data-action") === "goal-add-row") {
      var n = document.querySelectorAll("#goalRows .form-row").length;
      var domOpts = data.domains.map(function (x) { return [x.id, x.name]; });
      var div = document.createElement("div");
      div.className = "form-row";
      div.innerHTML = '<div class="field"><label>领域</label><select id="gDomain' + n + '">' + domOpts.map(function (x) { return '<option value="' + x[0] + '">' + esc(x[1]) + "</option>"; }).join("") + "</select></div>" +
        '<div class="field"><label>分钟</label><input id="gMin' + n + '" type="number" min="10" step="10" value="60"></div>';
      $id("goalRows").appendChild(div);
    }
  });
  function submitGoal() {
    var rows = document.querySelectorAll("#goalRows .form-row");
    var t = todayStr();
    data.goals = data.goals.filter(function (x) { return x.date !== t; });
    rows.forEach(function (r) {
      var dom = r.querySelector("select").value;
      var min = parseInt(r.querySelector("input").value, 10) || 0;
      if (dom && min > 0) data.goals.push({ id: uid(), date: t, domainId: dom, minutes: min });
    });
    modalClose(); refresh(); toast("今日目标已保存");
  }

  function editDomainModal(did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var stageHtml = (dm.stages || []).map(function (s, i) {
      return '<div class="form-row" style="margin-bottom:8px;">' +
        '<input id="stName' + i + '" value="' + esc(s.name) + '" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:8px;">' +
        '<input id="stEnd' + i + '" value="' + esc(s.end || "") + '" placeholder="结束时间" style="width:90px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;">' +
        '<input id="stGoal' + i + '" value="' + esc(s.goal || "") + '" placeholder="阶段目标" style="flex:2;padding:8px 10px;border:1px solid var(--border);border-radius:8px;">' +
        "</div>";
    }).join("");
    modalOpen("编辑领域", field("领域名称", "dmName", "text", "", dm.name) +
      field("考试/目标日期（可选，显示倒计时）", "dmExam", "text", "2026-12-26", dm.examDate || "") +
      (dm.type === "kaoyan" || dm.type === "generic" ? '<div class="field"><label>阶段设置（名称 / 结束时间 / 目标）</label>' + (stageHtml || '<div class="li-sub">该领域暂无阶段</div>') + "</div>" : "") +
      '<div class="li-sub" style="color:var(--sub);">科目进度请在领域页点科目右侧按钮更新。</div>',
      cancelBtn() + okBtn("submit-domain"));
    window.__editDomainId = did;
  }
  function submitDomain() {
    var dm = data.domains.filter(function (x) { return x.id === window.__editDomainId; })[0];
    if (!dm) return;
    dm.name = fval("dmName").trim() || dm.name;
    dm.examDate = fval("dmExam").trim() || "";
    var stages = dm.stages || [];
    stages.forEach(function (s, i) {
      var n = $id("stName" + i), en = $id("stEnd" + i), g = $id("stGoal" + i);
      if (n) s.name = n.value; if (en) s.end = en.value; if (g) s.goal = g.value;
    });
    modalClose(); refresh(); toast("领域已更新");
  }
  function addDomainModal() {
    modalOpen("新建领域", field("领域名称", "ndName", "text", "如：教师资格证") +
      selField("类型", "ndType", [["generic", "通用学习领域"], ["courses", "学业课程"], ["paper", "论文写作"]], "generic") +
      field("考试/目标日期（可选）", "ndExam", "text", "2026-12-01"),
      cancelBtn() + okBtn("submit-new-domain"));
  }
  function submitNewDomain() {
    var name = fval("ndName").trim();
    if (!name) { toast("请填写领域名称", true); return; }
    var type = fval("ndType");
    var nd = { id: uid(), type: type, name: name, color: "green", order: data.domains.length, examDate: fval("ndExam").trim() || "" };
    if (type === "courses") { nd.courses = []; nd.assignments = []; }
    else if (type === "paper") { nd.stages = ["选题", "文献调研", "初稿", "修改", "定稿"]; nd.currentStage = 0; nd.refs = []; }
    else { nd.subjects = []; }
    data.domains.push(nd);
    modalClose(); refresh(); toast("领域已创建");
  }
  function delDomainConfirm(did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    modalOpen("删除领域", "<p style=\"font-size:14px;color:var(--sub);\">确定删除领域「" + esc(dm.name) + "」吗？该领域下的任务、打卡记录会被删除，但关联的资料仍保留在资料库。</p>",
      cancelBtn() + '<button class="btn danger" data-action="del-domain-ok">' + ICONS.trash + "确认删除</button>");
    window.__delDomainId = did;
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (el && el.getAttribute("data-action") === "del-domain-ok") {
      var did = window.__delDomainId;
      data.domains = data.domains.filter(function (x) { return x.id !== did; });
      data.tasks = data.tasks.filter(function (x) { return x.domainId !== did; });
      if (data.settings.primaryDomain === did) data.settings.primaryDomain = data.domains[0] ? data.domains[0].id : "";
      modalClose(); refresh(); toast("领域已删除（资料仍在资料库）");
    }
  });

  function subjectModal(did, sid) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var s = null;
    if (dm) {
      (dm.subjects || []).forEach(function (x) { if (x.id === sid) s = x; });
      if (!s && dm.subGroups) dm.subGroups.forEach(function (sg) { (sg.subjects || []).forEach(function (x) { if (x.id === sid) s = x; }); });
    }
    if (!s) return;
    modalOpen("更新进度：" + s.name,
      '<div class="field"><label>进度（0-100%）</label><input id="sProg" type="number" min="0" max="100" value="' + (s.progress || 0) + '"></div>' +
      area("备注", "sNote", "当前学到哪", s.note),
      cancelBtn() + '<button class="btn" data-action="submit-subject" data-domain="' + esc(did) + '" data-subject="' + esc(sid) + '">' + ICONS.check + "保存</button>");
  }
  function submitSubject(did, sid) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var s = null;
    if (dm) {
      (dm.subjects || []).forEach(function (x) { if (x.id === sid) s = x; });
      if (!s && dm.subGroups) dm.subGroups.forEach(function (sg) { (sg.subjects || []).forEach(function (x) { if (x.id === sid) s = x; }); });
    }
    if (!s) return;
    s.progress = Math.max(0, Math.min(100, parseInt(fval("sProg"), 10) || 0));
    s.note = fval("sNote").trim();
    modalClose(); refresh(); toast("进度已更新");
  }

  function toggleWeekly(did, day, wid) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm || !dm.weeklyPlan) return;
    var item = (dm.weeklyPlan[day] || []).filter(function (x) { return x.id === wid; })[0];
    if (item) { item.done = !item.done; refresh(); }
  }
  function addWeeklyModal(did, day) {
    modalOpen("添加周计划任务", "星期：" + day, '<div class="field"><label>任务内容</label><input id="wkText" placeholder="如：数学 3 小时"></div>',
      cancelBtn() + '<button class="btn" data-action="submit-weekly" data-domain="' + esc(did) + '" data-day="' + esc(day) + '">' + ICONS.check + "保存</button>");
  }
  function submitWeekly(did, day) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var text = fval("wkText").trim();
    if (!text) { toast("请填写内容", true); return; }
    dm.weeklyPlan[day] = dm.weeklyPlan[day] || [];
    dm.weeklyPlan[day].push({ id: uid(), text: text, done: false });
    modalClose(); refresh(); toast("已添加到周计划");
  }
  function delWeekly(did, day, wid) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    dm.weeklyPlan[day] = (dm.weeklyPlan[day] || []).filter(function (x) { return x.id !== wid; });
    refresh();
  }

  function punchModal(did) {
    var dm = did ? data.domains.filter(function (x) { return x.id === did; })[0] : null;
    var doms = data.domains.filter(function (x) { return x.subjects && x.subjects.length; });
    if (doms.length === 0) { toast("没有可打卡的领域（需先设置科目进度）", true); return; }
    var sel = dm && dm.subjects && dm.subjects.length ? dm : doms[0];
    modalOpen("打卡学习", "记录今天学了什么、学了多久。" +
      selField("领域", "pDomain", data.domains.map(function (x) { return [x.id, x.name]; }), sel.id) +
      '<div class="field"><label>科目</label><select id="pSubject"></select></div>' +
      field("时长（分钟）", "pMin", "number", "60", "60"),
      cancelBtn() + okBtn("submit-punch", "打卡"));
    var pd = $id("pDomain");
    var ps = $id("pSubject");
    function fill() {
      var dm2 = data.domains.filter(function (x) { return x.id === pd.value; })[0];
      ps.innerHTML = (dm2 && dm2.subjects ? dm2.subjects : []).map(function (x) { return '<option value="' + esc(x.name) + '">' + esc(x.name) + "</option>"; }).join("");
    }
    fill();
    pd.addEventListener("change", fill);
  }
  function submitPunch(did) {
    var min = parseInt(fval("pMin"), 10) || 0;
    if (min <= 0) { toast("请填写有效时长", true); return; }
    var todayLogs = (data.studyLog || []).filter(function (x) { return x.date === todayStr(); });
    var isFirstToday = todayLogs.length === 0;
    data.studyLog.push({ date: todayStr(), domainId: fval("pDomain"), subject: fval("pSubject"), minutes: min, ts: nowStr().slice(11) });
    modalClose(); refresh();
    if (isFirstToday) {
      rewardModal("今日打卡成功", "今天第一次打卡，学起来就有状态了。", true);
    } else {
      toast("打卡成功，" + randomPick(PRAISES));
      /* 今日目标全部达成奖励（非首次打卡时检查，避免双弹窗） */
      var g = (data.goals || []).filter(function (x) { return x.date === todayStr(); });
      var plan = g.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
      var done = (data.studyLog || []).filter(function (x) { return x.date === todayStr(); }).reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
      var beforeMin = todayLogs.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
      if (g.length > 0 && plan > 0 && done >= plan && beforeMin < plan) {
        rewardModal("今日目标全部达成", "说好的目标都完成了，今天的你很靠谱。", true);
      }
    }
  }

  /* ---------- 生词本 ---------- */
  function addWordModal(did) {
    modalOpen("添加生词", "遇到生词就记下来，标记掌握后进入已掌握列表，定期复习。" +
      field("单词", "wdWord", "text", "vocabulary") +
      field("释义", "wdMeaning", "text", "n. 词汇，词汇量") +
      field("备注（可选）", "wdNote", "text", "考研高频词"),
      cancelBtn() + '<button class="btn" data-action="submit-word" data-domain="' + esc(did) + '">' + ICONS.check + "保存</button>");
  }
  function submitWord(did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var word = fval("wdWord").trim();
    if (!word) { toast("请填写单词", true); return; }
    dm.wordbook = dm.wordbook || [];
    dm.wordbook.push({ id: uid(), word: word, meaning: fval("wdMeaning").trim(), note: fval("wdNote").trim(), mastered: false, date: todayStr() });
    modalClose(); refresh(); toast("生词已添加");
  }
  function toggleWord(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var w = dm && (dm.wordbook || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    w.mastered = !w.mastered;
    refresh();
    toast(w.mastered ? "已标记掌握，记得隔几天复习一次" : "已恢复为待复习");
  }
  function delWord(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var w = dm && (dm.wordbook || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    dm.wordbook = dm.wordbook.filter(function (x) { return x.id !== id; });
    data.deleted.push({ id: id, kind: "生词", title: w.word, deletedAt: nowStr() });
    refresh(); toast("生词已删除，可在回收站恢复");
  }

  function courseModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = id ? (dm.courses || []).filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(c ? "编辑课程" : "添加课程",
      field("课程名称", "cName", "text", "材料科学基础", c ? c.name : "") +
      field("老师", "cTeacher", "text", "", c ? c.teacher : "") +
      selField("星期", "cDay", [["周一", "周一"], ["周二", "周二"], ["周三", "周三"], ["周四", "周四"], ["周五", "周五"], ["周六", "周六"], ["周日", "周日"]], c ? c.day : "周一") +
      field("上课时间", "cTime", "text", "8:00-9:40", c ? c.time : "") +
      field("地点", "cPlace", "text", "A101", c ? c.place : ""),
      cancelBtn() + '<button class="btn" data-action="submit-course" data-domain="' + esc(did) + '" data-id="' + esc(id || "") + '">' + ICONS.check + "保存</button>");
    window.__editCourseId = id || "";
  }
  function submitCourse(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var name = fval("cName").trim();
    if (!name) { toast("请填写课程名称", true); return; }
    var obj = { name: name, teacher: fval("cTeacher").trim(), day: fval("cDay"), time: fval("cTime").trim(), place: fval("cPlace").trim() };
    var c = (dm.courses || []).filter(function (x) { return x.id === window.__editCourseId; })[0];
    if (c) { Object.assign(c, obj); }
    else { dm.courses = dm.courses || []; obj.id = uid(); dm.courses.push(obj); }
    modalClose(); refresh(); toast("课程已保存");
  }
  function delCourse(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var c = (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (c) {
      dm.courses = dm.courses.filter(function (x) { return x.id !== id; });
      data.deleted.push({ id: id, kind: "课程", title: c.name, deletedAt: nowStr() });
      refresh(); toast("课程已删除，可在回收站恢复");
    }
  }
  function assignmentModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var a = id ? (dm.assignments || []).filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(a ? "编辑作业/考试" : "添加作业/考试",
      field("标题", "aTitle", "text", "材料科学基础 作业 3", a ? a.title : "") +
      selField("类型", "aType", [["作业", "作业"], ["考试", "考试"], ["其他", "其他"]], a ? a.type : "作业") +
      field("截止日期", "aDue", "text", "2026-08-20", a ? a.due : ""),
      cancelBtn() + '<button class="btn" data-action="submit-assignment" data-domain="' + esc(did) + '" data-id="' + esc(id || "") + '">' + ICONS.check + "保存</button>");
    window.__editAssignmentId = id || "";
  }
  function submitAssignment(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var title = fval("aTitle").trim();
    if (!title) { toast("请填写标题", true); return; }
    var obj = { title: title, type: fval("aType"), due: fval("aDue").trim(), done: false };
    var a = (dm.assignments || []).filter(function (x) { return x.id === window.__editAssignmentId; })[0];
    if (a) { Object.assign(a, obj); }
    else { dm.assignments = dm.assignments || []; obj.id = uid(); dm.assignments.push(obj); }
    modalClose(); refresh(); toast("已保存");
  }
  function toggleAssignment(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var a = dm && (dm.assignments || []).filter(function (x) { return x.id === id; })[0];
    if (a) { a.done = !a.done; refresh(); }
  }
  function delAssignment(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var a = (dm.assignments || []).filter(function (x) { return x.id === id; })[0];
    if (a) {
      dm.assignments = dm.assignments.filter(function (x) { return x.id !== id; });
      data.deleted.push({ id: id, kind: "作业/考试", title: a.title, deletedAt: nowStr() });
      refresh(); toast("已删除，可在回收站恢复");
    }
  }

  function paperStage(did, dir) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var next = dm.currentStage + parseInt(dir, 10);
    if (next < 0 || next > (dm.stages || []).length - 1) { toast("已经在最前/最后了"); return; }
    dm.currentStage = next;
    refresh(); toast("论文进度已更新为：" + dm.stages[next]);
  }
  function refModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var r = id ? (dm.refs || []).filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(r ? "编辑文献" : "添加文献",
      field("标题", "rfTitle", "text", "论文标题", r ? r.title : "") +
      field("链接（可选）", "rfUrl", "text", "", r ? r.url : "") +
      area("笔记", "rfNote", "读了什么、重点在哪", r ? r.note : ""),
      cancelBtn() + '<button class="btn" data-action="submit-ref" data-domain="' + esc(did) + '" data-id="' + esc(id || "") + '">' + ICONS.check + "保存</button>");
    window.__editRefId = id || "";
  }
  function submitRef(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var title = fval("rfTitle").trim();
    if (!title) { toast("请填写标题", true); return; }
    var obj = { title: title, url: fval("rfUrl").trim(), note: fval("rfNote").trim() };
    var r = (dm.refs || []).filter(function (x) { return x.id === window.__editRefId; })[0];
    if (r) { Object.assign(r, obj); }
    else { dm.refs = dm.refs || []; obj.id = uid(); dm.refs.push(obj); }
    modalClose(); refresh(); toast("文献已保存");
  }
  function delRef(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var r = (dm.refs || []).filter(function (x) { return x.id === id; })[0];
    if (r) {
      dm.refs = dm.refs.filter(function (x) { return x.id !== id; });
      data.deleted.push({ id: id, kind: "文献", title: r.title, deletedAt: nowStr() });
      refresh(); toast("文献已删除，可在回收站恢复");
    }
  }

  function resourceModal(id) {
    var r = id ? data.resources.filter(function (x) { return x.id === id; })[0] : null;
    var domOpts = [["", "不关联"]] .concat(data.domains.map(function (x) { return [x.id, x.name]; }));
    modalOpen(r ? "编辑资料" : "新建资料",
      field("标题（B站链接可自动填充）", "resTitle", "text", "", r ? r.title : "") +
      field("链接（粘贴自动识别平台）", "resUrl", "text", "https://", r ? r.url : "") +
      field("提取码（网盘，可选）", "resCode", "text", "", r ? r.extractCode : "") +
      '<div id="resPlat" class="li-sub" style="min-height:20px;margin-bottom:10px;"></div>' +
      selField("分类", "resCat", [["课程", "课程"], ["考研", "考研"], ["论文", "论文"], ["课外", "课外"], ["其他", "其他"]], r ? r.category : "其他") +
      selField("学习状态", "resStatus", [["未看", "未看"], ["在看", "在看"], ["看完", "看完"]], r ? r.status : "未看") +
      selField("关联领域", "resDomain", domOpts, r ? r.domainId : "") +
      field("标签（逗号分隔）", "resTags", "text", "高数, 网课", (r && r.tags || []).join(", ")) +
      area("备注", "resNote", "", r ? r.note : ""),
      cancelBtn() + okBtn("submit-resource"));
    window.__editResId = id || "";
    var urlEl = $id("resUrl");
    function onUrl() {
      var u = urlEl.value.trim();
      var plat = detectPlatform(u);
      var platEl = $id("resPlat");
      if (plat) {
        platEl.innerHTML = '<span class="tag platform">' + esc(plat) + "</span> 已识别平台";
        if (detectBvid(u) && !$id("resTitle").value) {
          platEl.innerHTML = '<span class="tag platform">' + esc(plat) + "</span> 正在尝试获取标题…";
          tryFetchBiliTitle(detectBvid(u), function (title) {
            if (title && !$id("resTitle").value) {
              $id("resTitle").value = title;
              platEl.innerHTML = '<span class="tag platform">' + esc(plat) + '</span> 已自动获取标题（跨域失败时请手动填写）';
            } else {
              platEl.innerHTML = '<span class="tag platform">' + esc(plat) + '</span> 自动获取标题失败（浏览器限制），请手动填写标题';
            }
          });
        }
        var code = extractCodeFromUrl(u);
        if (code && !$id("resCode").value) $id("resCode").value = code;
      } else if (u) {
        platEl.innerHTML = "未识别出平台，将按普通链接保存";
      } else {
        platEl.innerHTML = "";
      }
    }
    urlEl.addEventListener("input", onUrl);
    if (r && r.url) onUrl();
  }
  function submitResource(id) {
    var title = fval("resTitle").trim();
    var url = fval("resUrl").trim();
    if (!title && !url) { toast("标题和链接至少填一个", true); return; }
    var plat = detectPlatform(url);
    var obj = {
      title: title || url, url: url, platform: plat || "", extractCode: fval("resCode").trim(),
      category: fval("resCat"), status: fval("resStatus"), domainId: fval("resDomain"),
      tags: fval("resTags").split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean),
      note: fval("resNote").trim(), updatedAt: nowStr()
    };
    var r = data.resources.filter(function (x) { return x.id === window.__editResId; })[0];
    if (r) { Object.assign(r, obj); }
    else { obj.id = uid(); obj.createdAt = nowStr(); data.resources.push(obj); }
    modalClose(); refresh(); toast("资料已保存");
  }

  function inboxModal() {
    modalOpen("添加到收集箱",
      '<div class="field"><label>内容或链接（粘贴链接自动识别平台）</label><textarea id="ibContent" placeholder="一段文字 / 一个链接 / 一个临时想法"></textarea></div>' +
      '<div class="field"><label>类型</label><select id="ibType"><option value="text">文字</option><option value="link">链接</option><option value="task">临时任务</option><option value="file">文件</option></select></div>' +
      '<div id="ibPlat" class="li-sub" style="min-height:20px;margin-bottom:10px;"></div>',
      cancelBtn() + okBtn("submit-inbox", "放入收集箱"));
    var ib = $id("ibContent");
    ib.addEventListener("input", function () {
      var u = ib.value.trim();
      var plat = detectPlatform(u);
      var el = $id("ibPlat");
      el.innerHTML = plat ? '<span class="tag platform">' + esc(plat) + "</span> 已识别平台" : "";
    });
  }
  function submitInbox() {
    var content = fval("ibContent").trim();
    if (!content) { toast("请填写内容", true); return; }
    var url = content.indexOf("http") === 0 ? content : "";
    var plat = detectPlatform(url || content);
    var sug = suggestTarget(content);
    data.inbox.push({
      id: uid(), type: fval("ibType"), content: content, url: url, platform: plat || "",
      status: "待分拣", suggestion: "建议放入：" + sug.label, createdAt: nowStr()
    });
    modalClose(); refresh(); toast("已放入收集箱");
  }
  function sortModal(id) {
    var x = data.inbox.filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    var targets = [["library", "资料库"]].concat(data.domains.map(function (d) { return [d.id, d.name]; }));
    modalOpen("确认去向",
      '<div class="li-sub" style="margin-bottom:10px;">内容：' + esc(x.content || x.url) + "</div>" +
      (x.suggestion ? '<div class="ai-banner" style="margin-bottom:10px;">' + ICONS.spark + "AI 建议：" + esc(x.suggestion) + "</div>" : "") +
      selField("移动到", "sortTarget", targets, "library"),
      cancelBtn() + '<button class="btn" data-action="submit-sort" data-id="' + esc(id) + '">' + ICONS.check + "确认移动</button>");
  }
  function submitSort(id) {
    var x = data.inbox.filter(function (y) { return y.id === id; })[0];
    if (!x) return;
    var target = fval("sortTarget");
    if (target === "library") {
      data.resources.push({
        id: uid(), title: x.content || x.url, url: x.url, platform: x.platform || "", extractCode: "",
        category: "其他", status: "未看", domainId: "", tags: [], note: "", createdAt: nowStr(), updatedAt: nowStr()
      });
    } else {
      var dm = data.domains.filter(function (d) { return d.id === target; })[0];
      if (dm) {
        if (dm.type === "courses") {
          dm.courses = dm.courses || [];
          var name = x.content || x.url;
          dm.courses.push({ id: uid(), name: name.slice(0, 40), teacher: "", day: "周一", time: "", place: "" });
        } else if (dm.type === "paper") {
          dm.refs = dm.refs || [];
          dm.refs.push({ id: uid(), title: x.content || x.url, url: x.url, note: "" });
        } else {
          data.tasks.push({ id: uid(), title: x.content || x.url, domainId: dm.id, date: "", due: "", done: false, note: "", createdAt: nowStr() });
        }
      }
    }
    x.status = "已分拣";
    x.movedTo = target === "library" ? "资料库" : (data.domains.filter(function (d) { return d.id === target; })[0] || {}).name || target;
    modalClose(); refresh(); toast("已移动到" + x.movedTo);
  }
  function aiSortAll() {
    var pend = data.inbox.filter(function (x) { return x.status === "待分拣"; });
    if (pend.length === 0) { toast("收集箱没有待分拣内容"); return; }
    pend.forEach(function (x) {
      var sug = suggestTarget(x.content || x.url);
      x.suggestion = "建议放入：" + sug.label + (sug.d !== "library" ? "（也可放资料库）" : "");
    });
    refresh();
    toast("已为 " + pend.length + " 条内容生成建议，请逐条确认");
  }

  function mistakeModal(id) {
    var m = id ? data.mistakes.filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(m ? "编辑错题" : "记录错题",
      field("科目", "mkSubject", "text", "数学", m ? m.subject : "") +
      area("题目 / 错题内容", "mkTitle", "题目或知识点", m ? m.title : "") +
      field("错因", "mkReason", "text", "粗心 / 不会 / 概念不清", m ? m.reason : "") +
      area("正确答案", "mkAnswer", "正确答案或正确思路", m ? m.answer : "") +
      '<div class="checkline"><input type="checkbox" id="mkReviewed"' + (m && m.reviewed ? " checked" : "") + '><label for="mkReviewed">已复习</label></div>',
      cancelBtn() + okBtn("submit-mistake"));
    window.__editMistakeId = id || "";
  }
  function submitMistake(id) {
    var title = fval("mkTitle").trim();
    if (!title) { toast("请填写错题内容", true); return; }
    var obj = { subject: fval("mkSubject").trim() || "未分类", title: title, reason: fval("mkReason").trim(), answer: fval("mkAnswer").trim(), reviewed: !!$id("mkReviewed").checked };
    var m = data.mistakes.filter(function (x) { return x.id === window.__editMistakeId; })[0];
    if (m) { Object.assign(m, obj); }
    else { obj.id = uid(); obj.date = todayStr(); data.mistakes.push(obj); }
    modalClose(); refresh(); toast("错题已保存");
  }

  function qaModal(id) {
    var q = id ? data.qa.filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(q ? "编辑答疑" : "记录答疑",
      field("科目", "qaSubject", "text", "英语 / 数学", q ? q.subject : "") +
      area("问题", "qaQ", "遇到的问题", q ? q.question : "") +
      area("解答", "qaA", "解答或思路", q ? q.answer : ""),
      cancelBtn() + okBtn("submit-qa"));
    window.__editQaId = id || "";
  }
  function submitQa(id) {
    var question = fval("qaQ").trim();
    if (!question) { toast("请填写问题", true); return; }
    var obj = { subject: fval("qaSubject").trim(), question: question, answer: fval("qaA").trim() };
    var q = data.qa.filter(function (x) { return x.id === window.__editQaId; })[0];
    if (q) { Object.assign(q, obj); }
    else { obj.id = uid(); obj.date = todayStr(); data.qa.push(obj); }
    modalClose(); refresh(); toast("答疑已保存");
  }

  function dailyReviewModal(date) {
    var r = (data.reviews || []).filter(function (x) { return x.date === date && x.type === "daily"; })[0];
    modalOpen(r ? "修改今日复盘" : "今日复盘",
      '<div class="li-sub" style="margin-bottom:10px;">三个问题，1 分钟完成。' + esc(date || todayStr()) + "</div>" +
      area("今天完成了什么？", "rvDone", "", r ? r.done : "") +
      area("没完成什么？原因？", "rvUndone", "", r ? r.undone : "") +
      area("明天怎么调整？", "rvAdjust", "", r ? r.adjust : ""),
      cancelBtn() + okBtn("submit-daily-review", "保存复盘"));
    window.__editReviewDate = date || todayStr();
  }
  function submitDailyReview() {
    var date = window.__editReviewDate;
    var r = data.reviews.filter(function (x) { return x.date === date && x.type === "daily"; })[0];
    if (r) {
      r.done = fval("rvDone").trim(); r.undone = fval("rvUndone").trim(); r.adjust = fval("rvAdjust").trim();
    } else {
      data.reviews.push({ id: uid(), date: date, type: "daily", done: fval("rvDone").trim(), undone: fval("rvUndone").trim(), adjust: fval("rvAdjust").trim(), aiDraft: "" });
    }
    modalClose(); refresh(); toast("复盘已保存，坚持就是胜利");
  }
  function weeklyDraftModal(existing) {
    var draft = existing ? "" : aiDraftWeekly();
    var thisWeek = (data.reviews || []).filter(function (r) { return r.type === "weekly"; })[0];
    var content = existing && thisWeek ? (thisWeek.done + "\n\n未完成：\n" + thisWeek.undone + "\n\n调整：\n" + thisWeek.adjust).replace(/^未完成：\n$/m, "") : draft;
    modalOpen(existing ? "查看本周复盘" : "每周复盘草稿",
      '<div class="li-sub" style="margin-bottom:10px;">' + (existing ? "本周已保存的复盘（可修改后保存）" : "AI 根据本周数据生成的草稿，请补充你的真实感受后确认保存。") + "</div>" +
      area("本周完成（草稿可修改）", "rvDone", "", content.split("\n\n未完成：")[0] || "") +
      area("未完成及原因", "rvUndone", "", (content.match(/未完成：\n([\s\S]*?)(\n\n调整：|$)/) || [])[1] || "") +
      area("下周调整", "rvAdjust", "", (content.match(/调整：\n([\s\S]*?)$/) || [])[1] || ""),
      cancelBtn() + okBtn("submit-weekly-draft", "确认保存"));
  }
  function submitWeeklyDraft() {
    var thisWeek = (data.reviews || []).filter(function (r) { return r.type === "weekly"; })[0];
    var obj = { done: fval("rvDone").trim(), undone: fval("rvUndone").trim(), adjust: fval("rvAdjust").trim() };
    if (thisWeek) { Object.assign(thisWeek, obj); }
    else {
      var ws = (function () { var dt = new Date(); var day = dt.getDay() || 7; dt.setDate(dt.getDate() - day + 1); return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0"); })();
      data.reviews.push({ id: uid(), date: ws, type: "weekly", done: obj.done, undone: obj.undone, adjust: obj.adjust, aiDraft: aiDraftWeekly() });
    }
    modalClose(); refresh(); toast("周复盘已保存");
  }
  function editReviewModal(id) {
    var r = data.reviews.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    modalOpen("编辑复盘",
      (r.type === "weekly" ? '<div class="li-sub" style="margin-bottom:10px;">周复盘</div>' : "") +
      area("完成", "rvDone", "", r.done) + area("未完成", "rvUndone", "", r.undone) + area("调整", "rvAdjust", "", r.adjust),
      cancelBtn() + okBtn("submit-daily-review", "保存"));
    window.__editReviewDate = r.date;
    window.__editReviewType = r.type;
  }

  function sleepModal() {
    var t = todayStr();
    var s = (data.health.sleep || []).filter(function (x) { return x.date === t; })[0];
    modalOpen(s ? "修改睡眠" : "记录睡眠",
      field("入睡时间", "slBed", "text", "23:30", s ? s.bed : "23:30") +
      field("起床时间", "slWake", "text", "07:00", s ? s.wake : "07:00") +
      '<div class="li-sub">保存后自动计算睡眠时长，并计入每周健康统计。</div>',
      cancelBtn() + okBtn("submit-sleep"));
  }
  function submitSleep() {
    var bed = fval("slBed").trim(), wake = fval("slWake").trim();
    if (!bed || !wake) { toast("请填写入睡和起床时间", true); return; }
    var t = todayStr();
    var minutes = (function () {
      function toM(s) { var p = s.split(":"); return parseInt(p[0], 10) * 60 + parseInt(p[1], 10); }
      var b = toM(bed), w = toM(wake);
      var diff = w - b;
      if (diff < 0) diff += 24 * 60;
      return diff;
    })();
    var s = data.health.sleep.filter(function (x) { return x.date === t; })[0];
    if (s) { s.bed = bed; s.wake = wake; s.minutes = minutes; }
    else { data.health.sleep.push({ date: t, bed: bed, wake: wake, minutes: minutes }); }
    modalClose(); refresh(); toast("睡眠已记录：" + Math.round(minutes / 60) + " 小时");
  }
  function sportModal() {
    modalOpen("记录运动", field("运动内容", "spType", "text", "跑步 / 跳绳 / 拉伸"),
      cancelBtn() + okBtn("submit-sport"));
  }
  function submitSport() {
    var type = fval("spType").trim() || "运动";
    var t = todayStr();
    data.health.sport = (data.health.sport || []).filter(function (x) { return x.date !== t; });
    data.health.sport.push({ date: t, type: type });
    modalClose(); refresh(); toast("运动已记录");
  }
  function stateModal() {
    var t = todayStr();
    var s = (data.health.state || []).filter(function (x) { return x.date === t; })[0];
    modalOpen("记录今日状态", "开始学习前标记一下，复盘时对照效率。" +
      selField("精力状态", "stLevel", [["充沛", "精力充沛"], ["一般", "一般"], ["疲惫", "疲惫"]], s ? s.level : "一般"),
      cancelBtn() + okBtn("submit-state"));
  }
  function submitState() {
    var t = todayStr();
    data.health.state = (data.health.state || []).filter(function (x) { return x.date !== t; });
    data.health.state.push({ date: t, level: fval("stLevel") });
    modalClose(); refresh(); toast("状态已记录");
  }

  function accountModal(id) {
    var a = id ? data.accounts.filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(a ? "编辑账号" : "添加账号",
      selField("平台", "acPlat", [["哔哩哔哩", "哔哩哔哩"], ["小红书", "小红书"], ["抖音", "抖音"], ["知乎", "知乎"], ["微博", "微博"], ["其他", "其他"]], a ? a.platform : "哔哩哔哩") +
      field("账号名", "acName", "text", "你的账号名", a ? a.name : "") +
      field("用途备注", "acNote", "text", "记录学习 / 关注什么", a ? a.note : ""),
      cancelBtn() + okBtn("submit-account"));
    window.__editAccountId = id || "";
  }
  function submitAccount() {
    var name = fval("acName").trim();
    if (!name) { toast("请填写账号名", true); return; }
    var obj = { platform: fval("acPlat"), name: name, note: fval("acNote").trim() };
    var a = data.accounts.filter(function (x) { return x.id === window.__editAccountId; })[0];
    if (a) { Object.assign(a, obj); }
    else { obj.id = uid(); data.accounts.push(obj); }
    modalClose(); refresh(); toast("账号已保存");
  }

  function calendarModal(id) {
    var c = id ? data.calendar.filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(c ? "编辑重要日期" : "添加重要日期",
      field("日期", "calDate", "text", "2026-12-26", c ? c.date : "") +
      field("标题", "calTitle", "text", "如：考研报名 / 六级考试", c ? c.title : "") +
      selField("类型", "calType", [["考试", "考试"], ["报名", "报名"], ["作业", "作业"], ["其他", "其他"]], c ? c.type : "其他") +
      field("备注", "calNote", "text", "", c ? c.note : ""),
      cancelBtn() + okBtn("submit-calendar"));
    window.__editCalId = id || "";
  }
  function submitCalendar() {
    var title = fval("calTitle").trim();
    var date = fval("calDate").trim();
    if (!title || !date) { toast("请填写日期和标题", true); return; }
    var obj = { date: date, title: title, type: fval("calType"), note: fval("calNote").trim() };
    var c = data.calendar.filter(function (x) { return x.id === window.__editCalId; })[0];
    if (c) { Object.assign(c, obj); }
    else { obj.id = uid(); data.calendar.push(obj); }
    modalClose(); refresh(); toast("重要日期已保存");
  }

  function importModal() {
    modalOpen("导入数据", '<p style="font-size:14px;color:var(--sub);margin-bottom:12px;">选择导出的备份文件（JSON）。</p>' +
      '<div class="field"><label>导入方式</label><select id="importMode">' +
      '<option value="merge">合并导入（追加到现有数据，不覆盖）</option>' +
      '<option value="replace">完整导入（恢复备份，覆盖当前数据）</option></select></div>' +
      '<div class="li-sub" style="margin-bottom:10px;">合并导入：适合把聊天/学习中产生的资料增量加进工作台，导入前会预览将新增的内容。</div>' +
      '<input type="file" id="importFile" accept=".json" style="margin-top:8px;">',
      cancelBtn() + '<button class="btn" data-action="import-file">' + ICONS.upload + "选择文件并导入</button>");
  }
  function handleImportFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        if (!d || (!d.domains && !d.resources && !d.tasks && !d.qa && !d.mistakes)) { toast("文件格式不正确，导入已取消", true); return; }
        var modeEl = $id("importMode");
        var mode = modeEl ? modeEl.value : "replace";
        if (mode === "replace") {
          localStorage.setItem(STORE_KEY + "_preimport_backup", JSON.stringify(data));
          data = d;
          data.meta.updated = nowStr();
          W.data = data;
          save(true);
          renderAll();
          modalClose();
          toast("已完整导入（导入前数据已自动备份）");
        } else {
          previewMerge(d);
        }
      } catch (e) { toast("文件解析失败，导入已取消", true); }
    };
    reader.readAsText(file);
  }
  function previewMerge(imported) {
    var labels = { tasks: "任务", studyLog: "学习打卡", goals: "学习目标", mistakes: "错题", qa: "答疑", resources: "资料", inbox: "收集箱", reviews: "复盘", accounts: "账号", calendar: "重要日期" };
    var counts = {};
    Object.keys(labels).forEach(function (f) {
      var n = (imported[f] || []).length;
      if (n > 0) counts[f] = n;
    });
    var newDomains = (imported.domains || []).filter(function (nd) {
      return !data.domains.some(function (dd) { return dd.id === nd.id; });
    });
    var rows = Object.keys(counts).map(function (f) {
      return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + labels[f] + "</div></div>" +
        '<span class="li-meta">新增 ' + counts[f] + " 条</span></div>";
    }).join("");
    if (newDomains.length) rows += '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">领域</div></div><span class="li-meta">新增 ' + newDomains.length + " 个</span></div>";
    if (!rows) rows = '<div class="empty">文件中没有可新增的内容</div>';
    modalOpen("合并导入预览", '<div class="li-sub" style="margin-bottom:10px;">将新增以下内容（现有数据不会改变）：</div><div class="list">' + rows + "</div>",
      cancelBtn() + '<button class="btn" data-action="merge-ok">' + ICONS.check + "确认合并</button>");
    window.__mergeData = imported;
  }
  function doMerge(imported) {
    var listFields = ["tasks", "studyLog", "goals", "mistakes", "qa", "resources", "inbox", "reviews", "accounts", "calendar"];
    var known = {};
    listFields.forEach(function (f) { (data[f] || []).forEach(function (x) { known[x.id] = 1; }); });
    listFields.forEach(function (f) {
      data[f] = data[f] || [];
      (imported[f] || []).forEach(function (x) {
        if (x.id && known[x.id]) x.id = uid();
        data[f].push(x);
      });
    });
    (imported.domains || []).forEach(function (nd) {
      if (!data.domains.some(function (dd) { return dd.id === nd.id; })) data.domains.push(nd);
    });
    modalClose();
    refresh();
    toast("合并完成，内容已追加到工作台");
  }
  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "importFile") {
      var f = e.target.files && e.target.files[0];
      if (f) handleImportFile(f);
    }
  });
  function resetExampleConfirm() {
    modalOpen("清空示例数据", '<p style="font-size:14px;color:var(--sub);">将删除开始时预置的示例内容（示例课程、示例资料、示例任务等），你自己的数据不会动。当前数据会自动备份。</p>',
      cancelBtn() + '<button class="btn danger" data-action="reset-example-ok">' + ICONS.trash + "确认清空</button>");
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!el) return;
    var act = el.getAttribute("data-action");
    if (act === "reset-example-ok") {
      localStorage.setItem(STORE_KEY + "_pre_reset", JSON.stringify(data));
      var d = data;
      d.tasks = d.tasks.filter(function (x) { return /^(t\d|示例)/.test(x.id) ? false : true; }).filter(function () { return false; });
      d.domains.forEach(function (dm) {
        if (dm.courses) dm.courses = [];
        if (dm.assignments) dm.assignments = [];
        if (dm.refs) dm.refs = [];
        if (dm.weeklyPlan) Object.keys(dm.weeklyPlan).forEach(function (k) { dm.weeklyPlan[k] = []; });
        if (dm.subjects) dm.subjects.forEach(function (s) { s.progress = 0; s.note = ""; });
      });
      d.studyLog = []; d.goals = []; d.mistakes = []; d.qa = []; d.resources = []; d.inbox = [];
      d.reviews = []; d.health.sleep = []; d.health.sport = []; d.health.state = [];
      d.accounts = []; d.calendar = [];
      modalClose(); refresh(); toast("示例数据已清空（原数据已备份）");
    }
    if (act === "import-file") {
      var f = $id("importFile") && $id("importFile").files && $id("importFile").files[0];
      if (f) { importData(f); modalClose(); }
    }
  });
  function restoreItem(id) {
    var item = (data.deleted || []).filter(function (x) { return x.id === id; })[0];
    if (!item) return;
    data.deleted = data.deleted.filter(function (x) { return x.id !== id; });
    toast("已恢复「" + item.title + "」（内容需重新关联，原条目已从回收站移除）");
    refresh();
  }
  function emptyTrashConfirm() {
    modalOpen("清空回收站", '<p style="font-size:14px;color:var(--sub);">清空后所有回收站内容将永久删除，无法恢复。确定吗？</p>',
      cancelBtn() + '<button class="btn danger" data-action="empty-trash-ok">' + ICONS.trash + "永久清空</button>");
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (el && el.getAttribute("data-action") === "empty-trash-ok") {
      data.deleted = []; modalClose(); refresh(); toast("回收站已清空");
    }
  });

  function saveApi() {
    var base = fval("apiBase").trim();
    var model = fval("apiModel").trim();
    var key = fval("apiKey").trim();
    if (!base || !key) { toast("请填写 API 地址和密钥", true); return; }
    data.settings.apiBase = base;
    data.settings.apiModel = model;
    data.settings.apiKey = key;
    modalClose(); refresh(); toast("AI 配置已保存（密钥只存在本机浏览器）");
  }
  function clearApi() {
    data.settings.apiKey = ""; data.settings.apiBase = ""; data.settings.apiModel = "";
    refresh(); toast("已清除 API 密钥");
  }
  function savePrimary() {
    data.settings.primaryDomain = fval("primaryDomain");
    refresh(); toast("手机底部导航已更新");
  }

  /* ---------- 抽屉/模态关闭按钮 ---------- */
  document.getElementById("modalClose").addEventListener("click", modalClose);
  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("modalMask").addEventListener("click", function (e) { if (e.target === this) modalClose(); });
  document.getElementById("helpMask").addEventListener("click", function (e) { if (e.target === this) closeHelp(); });
  document.getElementById("drawerMask").addEventListener("click", function (e) { if (e.target === this) closeDrawer(); });

  /* ---------- 启动 ---------- */
  load();
  W.data = data;
  W.settings = data.settings;
  applyBg();
  scheduleRemind();
  renderAll();
  setTimeout(function () {
    if (!localStorage.getItem(STORE_KEY)) save(true);
  }, 50);
})();
