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
        background: "default",
        fontSize: "normal"
      },
      domains: [
        {
          id: "kaoyan", type: "kaoyan", name: "考研备考", color: "yellow", order: 0,
          schemes: {
            activeId: "ky1",
            list: [
              {
                id: "ky1", name: "2027 专硕考研", examDate: "", stage: "base", archived: false,
                subjects: [
                  { id: "m1", name: "数学", custom: false },
                  { id: "m2", name: "英语", custom: false },
                  { id: "m3", name: "政治", custom: false },
                  { id: "m4", name: "专业课", custom: false }
                ],
                tasks: [
                  { id: "kt1", name: "数学：高数第 3 章习题 1-20", subjectId: "m1", type: "daily", done: false, costMinutes: 60, date: "", createTime: nowStr(), finishTime: "" },
                  { id: "kt2", name: "英语：单词 50 个", subjectId: "m2", type: "daily", done: false, costMinutes: 30, date: "", createTime: nowStr(), finishTime: "" },
                  { id: "kt3", name: "政治：马原基础学习", subjectId: "m3", type: "weekly", done: false, costMinutes: 60, date: "", createTime: nowStr(), finishTime: "" },
                  { id: "kt4", name: "专业课：材料科学基础第 1 章", subjectId: "m4", type: "longterm", done: false, costMinutes: 60, date: "", createTime: nowStr(), finishTime: "" }
                ],
                files: [],
                gen: {
                  targetEnglish: 70, targetMath: 70, targetPolitics: 70, targetMajor: 100,
                  stageStart: todayStr(), stars: 0, coupon10: false,
                  readingLog: [], noteLog: [], reviewLog: [],
                  chapterIndex: 1, wordProgress: { date: "", done: 0 },
                  dailyDone: { date: "", count: 0, subjects: [] }, backlog: 0
                }
              }
            ]
          }
        },
        {
          id: "cet", type: "english", name: "英语学习", color: "blue", order: 1,
          activeExam: "考研英语",
          exams: {
            "考研英语": {
              auto: "kaoyan", examDate: "", archived: false,
              wordbook: [
                { id: "w1", word: "comprehensive", meaning: "adj. 全面的，综合的", note: "考研高频词", mastered: false, date: "2026-08-14" }
              ],
              subjects: {
                "词汇": { progress: 25, note: "考研核心词汇，配合艾宾浩斯复习" },
                "听力": { progress: 20, note: "" },
                "阅读": { progress: 30, note: "" },
                "写作": { progress: 15, note: "" },
                "翻译": { progress: 10, note: "" },
                "口语": { progress: 5, note: "" }
              }
            },
            "大学英语六级": {
              auto: "cet6", examDate: "", archived: false, wordbook: [],
              subjects: {
                "词汇": { progress: 30, note: "" },
                "听力": { progress: 30, note: "" },
                "阅读": { progress: 40, note: "" },
                "写作": { progress: 20, note: "" },
                "翻译": { progress: 25, note: "" },
                "口语": { progress: 10, note: "" }
              }
            },
            "大学英语四级": {
              auto: "cet4", examDate: "", archived: false, wordbook: [],
              subjects: {
                "词汇": { progress: 40, note: "" },
                "听力": { progress: 35, note: "" },
                "阅读": { progress: 45, note: "" },
                "写作": { progress: 25, note: "" },
                "翻译": { progress: 30, note: "" },
                "口语": { progress: 15, note: "" }
              }
            }
          }
        },
        {
          id: "ai", type: "ailearn", name: "AI 知识学习", color: "green", order: 2,
          aiLearn: {
            today: null,
            history: []
          }
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
    /* 论文写作板块已移除（界面隐藏，历史数据保留在本机） */
    (data.domains || []).forEach(function (dm) { if (dm.id === "paper" && !dm.hidden) { dm.hidden = true; changed = true; } });
    /* 错题本升级：补全复习字段（原因/答案 → 错因/解法/来源/复习次数/下次复习/掌握） */
    (data.mistakes || []).forEach(function (m) {
      if (m.cause === undefined) {
        m.cause = m.reason || "";
        m.solution = m.answer || "";
        m.source = "";
        m.reviewCount = m.reviewed ? 1 : 0;
        m.nextReview = "";
        m.mastered = false;
        m.topic = m.topic || "";
        changed = true;
      } else if (m.topic === undefined) {
        m.topic = "";
        changed = true;
      }
      if (m.type === undefined) { m.type = ""; changed = true; }
    });
    /* 答疑库升级：状态/收藏/掌握/来源/标签 */
    (data.qa || []).forEach(function (q) {
      if (q.status === undefined) {
        q.status = "待解决";
        q.starred = false;
        q.mastered = false;
        q.source = "";
        q.tags = "";
        changed = true;
      }
    });
    if (data.settings && data.settings.kaoyanDate === "2026-12-26") {
      data.settings.kaoyanDate = "2027-12-25";
      changed = true;
    }
    var cet = (data.domains || []).filter(function (x) { return x.id === "cet"; })[0];
    if (cet) {
      if (cet.name === "四六级") { cet.name = "英语学习"; changed = true; }
      /* 旧结构（subjects 数组 + subGroups）→ 新结构（exams 多套数据） */
      if (cet.type !== "english" && cet.subjects) {
        var newExams = { "考研英语": { examDate: "2027-12-25", subjects: {} } };
        (cet.subjects || []).forEach(function (s) {
          newExams["考研英语"].subjects[s.name] = { progress: s.progress || 0, note: s.note || "" };
        });
        if (cet.subGroups && cet.subGroups[0]) {
          var sg = cet.subGroups[0];
          newExams["六级"] = { examDate: sg.examDate || "2027-12-12", subjects: {} };
          (sg.subjects || []).forEach(function (s) {
            newExams["六级"].subjects[s.name] = { progress: s.progress || 0, note: s.note || "" };
          });
        }
        newExams["四级"] = { examDate: "2027-06-12", subjects: { "词汇": { progress: 0, note: "" }, "听力": { progress: 0, note: "" }, "阅读": { progress: 0, note: "" }, "写作": { progress: 0, note: "" }, "翻译": { progress: 0, note: "" }, "口语": { progress: 0, note: "" } } };
        cet.exams = newExams;
        cet.activeExam = "考研英语";
        cet.type = "english";
        delete cet.subjects;
        delete cet.subGroups;
        changed = true;
      }
      if (!cet.exams) { cet.exams = { "考研英语": { examDate: "2027-12-25", subjects: { "词汇": { progress: 0, note: "" }, "听力": { progress: 0, note: "" }, "阅读": { progress: 0, note: "" }, "写作": { progress: 0, note: "" }, "翻译": { progress: 0, note: "" }, "口语": { progress: 0, note: "" } } } }; cet.activeExam = "考研英语"; changed = true; }
      if (!cet.wordbook) { cet.wordbook = []; changed = true; }
      /* 迁移：旧固定日期 → 自动规则；顶层 wordbook → 当前考试独立生词本 */
      Object.keys(cet.exams).forEach(function (k) {
        var ex = cet.exams[k];
        if (!ex.auto) {
          if (k.indexOf("六级") >= 0 || k.indexOf("四级") >= 0) ex.auto = k.indexOf("六级") >= 0 ? "cet6" : "cet4";
          else if (k.indexOf("考研") >= 0) ex.auto = "kaoyan";
          else ex.auto = "custom";
          changed = true;
        }
        if (!ex.wordbook) { ex.wordbook = []; changed = true; }
        if (ex.archived === undefined) { ex.archived = false; changed = true; }
        if (ex.examDate === "2027-12-25" || ex.examDate === "2027-12-12" || ex.examDate === "2027-06-12") { ex.examDate = ""; changed = true; }
        if (!ex.subjects) { ex.subjects = { "词汇": { progress: 0, note: "" }, "听力": { progress: 0, note: "" }, "阅读": { progress: 0, note: "" }, "写作": { progress: 0, note: "" }, "翻译": { progress: 0, note: "" }, "口语": { progress: 0, note: "" } }; changed = true; }
      });
      if (cet.wordbook && cet.wordbook.length && cet.exams["考研英语"]) {
        cet.exams["考研英语"].wordbook = cet.wordbook.concat(cet.exams["考研英语"].wordbook || []);
        cet.wordbook = [];
        changed = true;
      }
    }
    var aiDom = (data.domains || []).filter(function (x) { return x.id === "ai"; })[0];
    if (aiDom && aiDom.type !== "ailearn") {
      aiDom.type = "ailearn";
      aiDom.aiLearn = { today: null, history: [] };
      delete aiDom.subjects;
      changed = true;
    }
    var ky = (data.domains || []).filter(function (x) { return x.id === "kaoyan"; })[0];
    if (ky && (!ky.schemes || !ky.schemes.list || !ky.schemes.list.length)) {
      var oldSubs = ky.subjects || [{ id: "s1", name: "数学" }, { id: "s2", name: "英语" }, { id: "s3", name: "政治" }, { id: "s4", name: "专业课" }];
      var subs = oldSubs.map(function (s, i) { return { id: "k" + (i + 1), name: s.name, custom: false }; });
      var ktasks = [];
      var wp = ky.weeklyPlan || {};
      Object.keys(wp).forEach(function (day) {
        (wp[day] || []).forEach(function (w) {
          ktasks.push({ id: w.id || uid(), name: w.text || w.name, subjectId: "k1", type: "weekly", done: !!w.done, costMinutes: 0, date: "", createTime: nowStr(), finishTime: "" });
        });
      });
      (data.tasks || []).forEach(function (t) {
        if (t.domainId === "kaoyan") {
          ktasks.push({ id: t.id, name: t.title, subjectId: "k1", type: "daily", done: !!t.done, costMinutes: 0, date: t.date || "", createTime: t.createdAt || nowStr(), finishTime: "" });
        }
      });
      var stage = "base";
      if (ky.stages && ky.stages.length) {
        var sIdx = -1;
        for (var si = 0; si < ky.stages.length; si++) { if (!ky.stages[si].done) { sIdx = si; break; } }
        stage = sIdx <= 0 ? "base" : sIdx === 1 ? "enhance" : "sprint";
      }
      ky.schemes = {
        activeId: "ky1",
        list: [{
          id: "ky1", name: "2027 专硕考研",
          examDate: (ky.examDate && ky.examDate !== "2026-12-26") ? ky.examDate : "",
          stage: stage, archived: false, subjects: subs, tasks: ktasks, files: [],
          gen: {
            targetEnglish: 70, targetMath: 70, targetPolitics: 70, targetMajor: 100,
            stageStart: todayStr(), stars: 0, coupon10: false,
            readingLog: [], noteLog: [], reviewLog: [],
            chapterIndex: 1, wordProgress: { date: "", done: 0 },
            dailyDone: { date: "", count: 0, subjects: [] }, backlog: 0
          }
        }]
      };
      delete ky.examDate; delete ky.stages; delete ky.subjects; delete ky.weeklyPlan;
      changed = true;
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
    data.domains.filter(function (x) { return !x.hidden; }).slice().sort(function (a, b) { return a.order - b.order; }).forEach(function (dm) {
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
      "mk-topics": { t: "错题 · 专题", s: "科目下的专题" },
      "mk-types": { t: "错题 · 考点类型", s: "专题下的考点" },
      "mk-list": { t: "错题 · 列表", s: "该考点下的错题" },
      qa: { t: "答疑库", s: "问过的题不再错" },
      reviews: { t: "复盘", s: "让进步发生" },
      health: { t: "健康", s: "学习的第一步" },
      focus: { t: "专注", s: "番茄钟计时" },
      activity: { t: "学习记录", s: "自动汇总你今天干了什么" },
      calendar: { t: "日历", s: "重要日期一目了然" },
      accounts: { t: "账号", s: "管理我的平台账号" },
      search: { t: "搜索", s: "一次搜遍全部内容" },
      ai: { t: "AI 帮手", s: "辅助学习与整理" },
      settings: { t: "设置与数据", s: "说明、备份、更新日志" },
      "ky-subjects": { t: "科目详情", s: "科目任务统计" },
      "ky-tasks": { t: "全部领域任务", s: "三类任务管理" },
      "ky-weekly": { t: "本周计划", s: "周计划管理" },
      "ky-files": { t: "备考资料库", s: "关联资料" },
      "ky-english": { t: "英语学科页", s: "精读/作文/翻译" },
      "ky-math": { t: "数学学科页", s: "公式/套卷/粗心账本" },
      "ky-politics": { t: "政治学科页", s: "知识点/帽子题/时政" },
      "ky-major": { t: "专业课学科页", s: "笔记/挖空/大纲" },
      "ky-word": { t: "单词学科页", s: "真题生词/僻义/替换词" },
      "ky-stats": { t: "统计仪表盘", s: "所有图表与进度" },
      "tasks-all": { t: "任务管理专区", s: "全部任务" },
      "cet-vocab": { t: "词汇专区", s: "生词本与记忆复习" },
      "cet-listening": { t: "听力专区", s: "真题听力与精听" },
      "cet-reading": { t: "阅读专区", s: "真题阅读与长难句" },
      "cet-writing": { t: "写作专区", s: "范文模板与 AI 批改" },
      "cet-translation": { t: "翻译专区", s: "翻译练习与句式积累" },
      "cet-speaking": { t: "口语专区", s: "AI 口语对话练习" },
      "cet-wordbook": { t: "生词本", s: "完整生词管理" },
      "cet-exams": { t: "考试管理", s: "新增/归档/删除考试" },
      "cet-stats": { t: "英语统计", s: "学习数据" },
      "ai-history": { t: "AI 学习历史", s: "历史学习资料库" }
    };
    return map[view] || { t: view, s: "" };
  }

  /* ---------- 渲染 ---------- */
  function applyFont() {
    var fs = (data.settings && data.settings.fontSize) || "normal";
    var body = document.body;
    body.className = body.className.replace(/\s*font-(small|normal|large)/g, "").trim();
    if (fs !== "normal") body.className += (body.className ? " " : "") + "font-" + fs;
  }
  function renderAll() {
    ensureBrief();
    renderNav();
    renderView();
    applyTheme();
    applyBg();
    applyFont();
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
    else if (view === "mk-topics") html = Views.mkTopics();
    else if (view === "mk-types") html = Views.mkTypes();
    else if (view === "mk-list") html = Views.mkList();
    else if (view === "qa") html = Views.qa();
    else if (view === "calendar") html = Views.calendar();
    else if (view === "settings") html = Views.settings();
    else if (view === "ky-subjects") html = Views.kySubjects(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-tasks") html = Views.kyTasks(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-weekly") html = Views.kyWeekly(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-files") html = Views.kyFiles(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-english") html = Views.kyEnglishPage(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-math") html = Views.kyMathPage(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-politics") html = Views.kyPoliticsPage(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-major") html = Views.kyMajorPage(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-word") html = Views.kyWordPage(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "ky-stats") html = Views.kyStats(data.domains.filter(function (x) { return x.id === "kaoyan"; })[0]);
    else if (view === "tasks-all") html = Views.tasksAll();
    else if (view === "cet-vocab") html = Views.cetVocab(data.domains.filter(function (x) { return x.id === "cet"; })[0]);
    else if (view === "cet-wordbook") html = Views.cetWordbook(data.domains.filter(function (x) { return x.id === "cet"; })[0]);
    else if (view === "cet-exams") html = Views.cetExams(data.domains.filter(function (x) { return x.id === "cet"; })[0]);
    else if (view === "cet-stats") html = Views.cetStats(data.domains.filter(function (x) { return x.id === "cet"; })[0]);
    else if (view === "ai-history") html = Views.aiHistory(data.domains.filter(function (x) { return x.id === "ai"; })[0]);
    else if (view === "cet-listening" || view === "cet-reading" || view === "cet-writing" || view === "cet-translation" || view === "cet-speaking") {
      var zm = { "cet-listening": "听力", "cet-reading": "阅读", "cet-writing": "写作", "cet-translation": "翻译", "cet-speaking": "口语" }[view];
      html = Views.englishZone(data.domains.filter(function (x) { return x.id === "cet"; })[0], zm);
    }
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
  /* 板块主题色 */
  function themeOf(view) {
    var map = {
      "focus": "theme-focus", "activity": "theme-activity", "library": "theme-library",
      "inbox": "theme-inbox", "mistakes": "theme-mistakes", "mk-topics": "theme-mistakes", "mk-types": "theme-mistakes", "mk-list": "theme-mistakes", "qa": "theme-qa", "reviews": "theme-reviews",
      "health": "theme-health", "calendar": "theme-calendar", "accounts": "theme-accounts",
      "search": "theme-search", "ai": "theme-ai", "settings": "theme-settings",
      "domain:kaoyan": "theme-kaoyan", "domain:cet": "theme-cet", "domain:ai": "theme-ai",
      "domain:paper": "theme-paper", "domain:courses": "theme-courses",
      "ky-subjects": "theme-kaoyan", "ky-tasks": "theme-kaoyan", "ky-weekly": "theme-kaoyan", "ky-files": "theme-kaoyan", "ky-stats": "theme-kaoyan",
      "ky-english": "theme-cet", "ky-math": "theme-kaoyan", "ky-politics": "theme-kaoyan", "ky-major": "theme-kaoyan", "ky-word": "theme-kaoyan",
      "cet-vocab": "theme-cet", "cet-listening": "theme-cet", "cet-reading": "theme-cet", "cet-writing": "theme-cet",
      "cet-translation": "theme-cet", "cet-speaking": "theme-cet", "cet-wordbook": "theme-cet", "cet-stats": "theme-cet", "cet-exams": "theme-cet",
      "ai-history": "theme-ai"
    };
    return map[view] || "";
  }
  function applyTheme() {
    var t = themeOf(W.ui.view);
    document.body.className = document.body.className.replace(/\s*theme-\w+/g, "").trim();
    if (t) document.body.className += " " + t;
  }

  /* ---------- AI 学习内置学习包（每日 30 分钟） ---------- */
  var AI_PACKS = [
    {
      topic: "提示词工程入门：让 AI 听懂你的话",
      goals: ["理解提示词的基本结构：角色、任务、格式、示例", "掌握 3 个立刻能用的提示技巧", "知道答非所问时第一步该检查什么"],
      body: "提示词（Prompt）是你和 AI 之间的「说明书」。一份好提示词通常包含四层：\n1. 角色：告诉 AI 它是什么。例：「你是一名考研英语老师」。\n2. 任务：说明要做什么，尽量具体。例：「帮我批改这篇作文，指出语法错误」。\n3. 格式：规定输出形式。例：「先给评分，再列 3 条修改建议，最后给润色版」。\n4. 示例：给一个范例，AI 会模仿它的结构。这是最容易被忽略但最有效的一层。\n\n三个立刻能用的技巧：\n技巧一：给 AI 戴「帽子」（角色设定）——回答质量显著提升。\n技巧二：把大任务拆小——「先列大纲」比「写一篇论文」更容易得到好结果。\n技巧三：不满意就追问——「太笼统了，请举具体例子」比重新提问更高效。\n\n常见误区：只说要求不给上下文；一次塞太多任务；期望一次到位。记住：AI 不是读心者，它只能依据你写出来的内容行动。",
      questions: ["如果 AI 答非所问，第一步应该检查什么？", "把「写一篇关于猫的文章」改写成包含角色、任务、格式的提示词。"]
    },
    {
      topic: "大模型是怎么工作的（零基础版）",
      goals: ["理解大模型「预测下一个词」的基本原理", "知道为什么 AI 会一本正经地胡说八道", "学会判断什么时候该相信 AI、什么时候该核实"],
      body: "大语言模型（如 ChatGPT、DeepSeek）本质上是一个超大型的「接龙游戏选手」：它根据你已经输入的所有文字，预测接下来最可能出现的词。\n\n它读过的文本量极大（相当于整个互联网的公开内容），所以它的「预测」往往非常符合人类的表达习惯——这就是它看起来聪明的来源。\n\n但它有三个天生的局限：\n1. 它是概率预测，不是数据库查询——它可能把没见过的知识编得像真的一样（专业说法叫「幻觉」）。\n2. 它的知识有截止时间——新发生的事情它不知道。\n3. 它不会真正「算数」或「推理」，只是模仿推理的模式。\n\n对你的启示：\n- 学知识、梳理框架、写初稿：可以放心用。\n- 具体数字、引用、法律/医疗建议：必须核实。\n- 把 AI 当「聪明的同学」，不把它当「绝对正确的老师」。",
      questions: ["为什么 AI 会一本正经地胡说八道？", "「背单词」「问考试时间」这两个场景，哪个更适合直接相信 AI？"]
    },
    {
      topic: "把 AI 用进日常学习：10 个真实场景",
      goals: ["看到 AI 在背单词、作文、专业课上的具体用法", "学会「先让 AI 出题，再自己作答」的主动学习法", "建立一个可用一整周的小习惯：每天 30 分钟 AI 学习"],
      body: "场景清单（挑一个今天就用起来）：\n1. 背单词：让 AI 用当天生词编一篇小短文，上下文记忆比死记硬背牢得多。\n2. 作文批改：写完让 AI 打分、找语法错误、给润色版，再对比自己的原文。\n3. 专业课答疑：把不懂的概念讲给 AI 听，让它纠正你理解错的地方（费曼学习法）。\n4. 出题自测：学完一章，让 AI 出 5 道题，先自己做再对照。\n5. 整理笔记：把零散笔记扔给 AI，让它整理成结构化提纲。\n6. 长难句分析：遇到读不懂的句子，让 AI 拆解主干和修饰。\n7. 错题复盘：把错题发给 AI，让它解释错因并出同类题。\n8. 计划生成：告诉 AI 你的目标和时间，让它给一份周计划你再调整。\n9. 模拟面试/复试：让 AI 扮演面试官提问。\n10. 翻译对照：先自己翻，再对比 AI 译文，积累句式。\n\n主动学习法核心：让 AI 出题、你作答、AI 批改——比单纯看 AI 给的答案有效得多。",
      questions: ["今天你打算用哪个场景？为什么选它？", "「让 AI 出题自己作答」为什么比直接看答案更有效？"]
    }
  ];
  function genAiToday() {
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    if (!dm) return;
    dm.aiLearn = dm.aiLearn || { today: null, history: [] };
    var t = todayStr();
    if (dm.aiLearn.today && dm.aiLearn.today.date === t && dm.aiLearn.today.done) {
      toast("今日学习已完成，不能重新生成");
      return;
    }
    var prev = dm.aiLearn.today && dm.aiLearn.today.date === t ? dm.aiLearn.today.topic : "";
    var pack = AI_PACKS[Math.floor(Math.random() * AI_PACKS.length)];
    var guard = 0;
    while (pack.topic === prev && guard < 5) { pack = AI_PACKS[Math.floor(Math.random() * AI_PACKS.length)]; guard++; }
    dm.aiLearn.today = { date: t, topic: pack.topic, goals: pack.goals, body: pack.body, questions: pack.questions, note: (dm.aiLearn.today && dm.aiLearn.today.date === t) ? dm.aiLearn.today.note : "", done: false };
    refresh();
    toast("今日学习包已生成");
  }
  function aiNoteSave() {
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    var t = todayStr();
    if (dm && dm.aiLearn && dm.aiLearn.today && dm.aiLearn.today.date === t) {
      dm.aiLearn.today.note = fval("aiNote").trim();
      refresh();
      toast("笔记已保存");
    }
  }
  function aiDone() {
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    var t = todayStr();
    if (!dm || !dm.aiLearn || !dm.aiLearn.today || dm.aiLearn.today.date !== t) { toast("请先生成今日学习包", true); return; }
    if (dm.aiLearn.today.done) { toast("今日学习已完成"); return; }
    var td = dm.aiLearn.today;
    td.done = true;
    td.doneAt = nowStr();
    data.studyLog.push({ date: t, domainId: "ai", subject: "AI知识学习", minutes: 30, ts: nowStr().slice(11) });
    dm.aiLearn.history = dm.aiLearn.history || [];
    dm.aiLearn.history.push({ _id: uid(), date: t, topic: td.topic, goals: td.goals, body: td.body, questions: td.questions, note: td.note, doneAt: td.doneAt });
    refresh();
    rewardModal("今日 AI 学习完成", "完成 30 分钟「" + td.topic + "」，已记录打卡。", true);
  }
  function aiAppendNoteModal() {
    modalOpen("📝 追加学习笔记", "不完成今日课程，也可以随手记录 AI 学习的零散感悟。" +
      area("笔记内容", "aiAppend", "今天的感悟、想法、学到的小技巧…"),
      cancelBtn() + '<button class="btn" data-action="submit-ai-append">' + ICONS.check + "保存到历史</button>");
  }
  function submitAiAppend() {
    var txt = fval("aiAppend").trim();
    if (!txt) { toast("请填写笔记内容", true); return; }
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    dm.aiLearn = dm.aiLearn || { today: null, history: [] };
    dm.aiLearn.history = dm.aiLearn.history || [];
    dm.aiLearn.history.push({ _id: uid(), date: todayStr(), topic: "随笔笔记", goals: [], body: "", questions: [], note: txt, doneAt: nowStr(), kind: "note" });
    modalClose(); refresh(); toast("笔记已存入历史");
  }
  function aiHistEditModal(hid) {
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    var h = dm && dm.aiLearn && (dm.aiLearn.history || []).filter(function (x) { return x._id === hid; })[0];
    if (!h) return;
    modalOpen("编辑历史笔记", area("笔记内容", "aiHistNote", "", h.note || ""),
      cancelBtn() + '<button class="btn" data-action="submit-ai-hist-edit" data-id="' + esc(hid) + '">' + ICONS.check + "保存</button>");
  }
  function submitAiHistEdit(hid) {
    var dm = data.domains.filter(function (x) { return x.id === "ai"; })[0];
    var h = dm && dm.aiLearn && (dm.aiLearn.history || []).filter(function (x) { return x._id === hid; })[0];
    if (!h) return;
    h.note = fval("aiHistNote").trim();
    modalClose(); refresh(); toast("历史笔记已更新");
  }

  /* ---------- 考研阶段任务模板 ---------- */
  var KY_STAGES = [
    { id: "base", name: "基础期", days: 60 },
    { id: "enhance", name: "强化期", days: 60 },
    { id: "zhenti", name: "真题期", days: 70 },
    { id: "sprint", name: "冲刺期", days: 30 }
  ];
  var KY_TEMPLATES = {
    base: { name: "基础期", tasks: [
      { name: "数学：教材一章精读 + 例题", subject: "数学", type: "longterm", cost: 90 },
      { name: "数学：基础习题 20 道", subject: "数学", type: "daily", cost: 60 },
      { name: "英语：单词 100 个（一轮）", subject: "英语", type: "daily", cost: 30 },
      { name: "英语：长难句 3 句", subject: "英语", type: "daily", cost: 20 },
      { name: "政治：基础课一讲", subject: "政治", type: "weekly", cost: 60 },
      { name: "专业课：教材章节阅读", subject: "专业课", type: "longterm", cost: 60 }
    ] },
    enhance: { name: "强化期", tasks: [
      { name: "数学：刷题 20 道（专题）", subject: "数学", type: "daily", cost: 120 },
      { name: "英语：真题阅读 2 篇精读", subject: "英语", type: "daily", cost: 60 },
      { name: "英语：单词 100 个（二轮）", subject: "英语", type: "daily", cost: 30 },
      { name: "政治：选择题刷题一组", subject: "政治", type: "daily", cost: 40 },
      { name: "专业课：专题训练", subject: "专业课", type: "weekly", cost: 90 }
    ] },
    zhenti: { name: "真题期", tasks: [
      { name: "数学：真题套卷 1 套 + 订正", subject: "数学", type: "daily", cost: 150 },
      { name: "英语：真题套卷 + 作文 1 篇", subject: "英语", type: "daily", cost: 90 },
      { name: "政治：真题选择题一套", subject: "政治", type: "daily", cost: 60 },
      { name: "专业课：真题模拟 + 背诵", subject: "专业课", type: "weekly", cost: 120 }
    ] },
    sprint: { name: "冲刺期", tasks: [
      { name: "数学：模拟卷 1 套 + 错题复盘", subject: "数学", type: "daily", cost: 150 },
      { name: "英语：模拟 + 作文背诵", subject: "英语", type: "daily", cost: 90 },
      { name: "政治：冲刺背诵 + 押题", subject: "政治", type: "daily", cost: 60 },
      { name: "专业课：重点背诵 + 真题重做", subject: "专业课", type: "weekly", cost: 120 }
    ] }
  };
  function kyActiveScheme() {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    if (!dm || !dm.schemes) return null;
    var list = dm.schemes.list || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === dm.schemes.activeId) return list[i]; }
    return list[0] || null;
  }
  function kySubjName(sc, sid) {
    var s = (sc.subjects || []).filter(function (x) { return x.id === sid; })[0];
    return s ? s.name : "";
  }
  function kyStageNameLocal(id) {
    var map = { base: "基础期", enhance: "强化期", zhenti: "真题期", sprint: "冲刺期" };
    return map[id] || "未知阶段";
  }
  function examDateOfLocal(ex) {
    if (!ex) return null;
    if (ex.examDate) return ex.examDate;
    if (!ex.auto || ex.auto === "custom") return null;
    var now = new Date();
    var y = now.getFullYear();
    var cands = [];
    var thirdSat = function (yy, mm) { var d = new Date(yy, mm, 1); var fs = 1 + (6 - d.getDay() + 7) % 7; return new Date(yy, mm, fs + 14); };
    var lbSat = function (yy, mm) { var d = new Date(yy, mm + 1, 0); var ld = d.getDate(); var dow = d.getDay(); return new Date(yy, mm, ld - ((dow + 1) % 7) - 7); };
    if (ex.auto === "cet4" || ex.auto === "cet6") {
      cands.push(thirdSat(y, 5));
      cands.push(thirdSat(y, 11));
    } else if (ex.auto === "kaoyan") {
      cands.push(lbSat(y, 11));
    }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var future = cands.filter(function (c) { return c >= today; }).sort(function (a, b) { return a - b; });
    var chosen = future[0] || (cands.length ? new Date(cands[0].getFullYear() + 1, cands[0].getMonth(), cands[0].getDate()) : null);
    if (!chosen) return null;
    return chosen.getFullYear() + "-" + String(chosen.getMonth() + 1).padStart(2, "0") + "-" + String(chosen.getDate()).padStart(2, "0");
  }
  function kyExamDateLocal(sc) {
    if (sc && sc.examDate) return sc.examDate;
    if (data.settings && data.settings.kaoyanDate) return data.settings.kaoyanDate;
    return "";
  }
  function kySetId(sid, name) {
    var sc = kyActiveScheme();
    if (!sc) return sid;
    for (var i = 0; i < (sc.subjects || []).length; i++) { if (sc.subjects[i].name === name) return sc.subjects[i].id; }
    return sid;
  }
  /* 方案管理 */
  function kySchemeCreateModal() {
    modalOpen("新建备考方案",
      field("方案名称", "kySchemeName", "text", "例如：2027 专硕考研") +
      '<div class="field"><label>考试类型</label><select id="kyExamType"><option value="kaoyan">考研（自动填充官方时间）</option><option value="custom">自定义</option></select></div>' +
      '<div class="field"><label>初始备考阶段</label><select id="kyStageSel">' + KY_STAGES.map(function (s) { return '<option value="' + s.id + '">' + s.name + "</option>"; }).join("") + "</select></div>" +
      '<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-top:10px;"><input type="checkbox" id="kyImportTpl" checked> 导入该阶段默认任务模板</label>',
      cancelBtn() + '<button class="btn" data-action="submit-ky-scheme">' + ICONS.check + "创建方案</button>");
  }
  function submitKyScheme() {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var name = fval("kySchemeName").trim();
    if (!name) { toast("请填写方案名称", true); return; }
    var sid = uid();
    var sc = {
      id: sid, name: name, examDate: "", stage: fval("kyStageSel") || "base", archived: false,
      subjects: [
        { id: "m1", name: "数学", custom: false }, { id: "m2", name: "英语", custom: false },
        { id: "m3", name: "政治", custom: false }, { id: "m4", name: "专业课", custom: false }
      ],
      tasks: [], files: [],
      gen: {
        targetEnglish: 70, targetMath: 70, targetPolitics: 70, targetMajor: 100,
        stageStart: todayStr(), stars: 0, coupon10: false,
        readingLog: [], noteLog: [], reviewLog: [],
        chapterIndex: 1, wordProgress: { date: "", done: 0 },
        dailyDone: { date: "", count: 0, subjects: [] }, backlog: 0
      }
    };
    if ($id("kyImportTpl") && $id("kyImportTpl").checked) {
      (KY_TEMPLATES[sc.stage] ? KY_TEMPLATES[sc.stage].tasks : []).forEach(function (t) {
        sc.tasks.push({ id: uid(), name: t.name, subjectId: kySetId("m1", t.subject), type: t.type, done: false, costMinutes: t.cost || 30, date: "", createTime: nowStr(), finishTime: "" });
      });
    }
    dm.schemes.list.push(sc);
    dm.schemes.activeId = sid;
    modalClose(); refresh(); toast("已创建方案「" + name + "」");
  }
  function kySchemeSwitchModal() {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var act = dm.schemes.list.filter(function (s) { return !s.archived; });
    var arc = dm.schemes.list.filter(function (s) { return s.archived; });
    modalOpen("切换备考方案",
      '<div class="li-sub" style="margin-bottom:8px;font-weight:600;">启用中的方案</div>' +
      '<div class="list" style="max-height:280px;overflow-y:auto;">' + act.map(function (s) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(s.name) + (dm.schemes.activeId === s.id ? ' <span class="tag state-doing">当前</span>' : "") + "</div>" +
          '<div class="li-sub">' + esc(kyStageNameLocal(s.stage)) + "</div></div>" +
          (dm.schemes.activeId !== s.id ? '<button class="btn small plain" data-action="ky-scheme-select" data-v="' + esc(s.id) + '">切换</button>' : "") +
          '<button class="btn small plain" data-action="ky-scheme-archive" data-v="' + esc(s.id) + '">归档</button>' +
          '<button class="btn small danger plain" data-action="ky-scheme-delete" data-v="' + esc(s.id) + '">删除</button></div>';
      }).join("") + "</div>" +
      (arc.length ? '<div class="li-sub" style="margin:10px 0 8px;font-weight:600;">已归档（可恢复查看历史）</div>' +
        '<div class="list">' + arc.map(function (s) {
          return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(s.name) + "</div>" +
            '<div class="li-sub">已归档</div>' +
            '<button class="btn small plain" data-action="ky-scheme-restore" data-v="' + esc(s.id) + '">恢复</button></div>';
        }).join("") + "</div>" : "") +
      '<button class="btn block" data-action="ky-scheme-create" style="margin-top:12px;">＋ 新建备考方案</button>',
      cancelBtn());
  }
  function kySchemeSelect(id) {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    if (dm && dm.schemes) { dm.schemes.activeId = id; modalClose(); refresh(); toast("已切换备考方案"); }
  }
  function kySchemeArchive(id) {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var sc = dm.schemes.list.filter(function (s) { return s.id === id; })[0];
    if (sc) { sc.archived = true; if (dm.schemes.activeId === id) { dm.schemes.activeId = (dm.schemes.list.filter(function (s2) { return !s2.archived; })[0] || {}).id || ""; } modalClose(); refresh(); toast("已归档方案"); }
  }
  function kySchemeRestore(id) {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var sc = dm.schemes.list.filter(function (s) { return s.id === id; })[0];
    if (sc) { sc.archived = false; modalClose(); refresh(); toast("已恢复方案"); }
  }
  function kySchemeDeleteConfirm(id) {
    window.__delSchemeId = id;
    modalOpen("删除备考方案", "将删除该方案的全部数据（任务、资料、进度），且不可恢复。确定要删除吗？",
      cancelBtn() + '<button class="btn danger" data-action="ky-scheme-delete-ok">' + ICONS.trash + "确认删除</button>");
  }
  function kySchemeDeleteOk() {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var id = window.__delSchemeId;
    dm.schemes.list = dm.schemes.list.filter(function (s) { return s.id !== id; });
    if (dm.schemes.activeId === id) { dm.schemes.activeId = (dm.schemes.list[0] || {}).id || ""; }
    modalClose(); refresh(); toast("方案已删除");
  }
  /* 考试时间 */
  function kySetDateModal() {
    var sc = kyActiveScheme();
    if (!sc) return;
    modalOpen("设置「" + sc.name + "」考试时间",
      '<div class="li-sub" style="margin-bottom:10px;">考研官方时间为 12 月倒数第二个周末（自动计算）。手动设置的日期优先，考试结束后可在这里调整。</div>' +
      '<div class="field"><label>考试日期</label><input id="kyDate" type="date" value="' + esc(sc.examDate || kyExamDateLocal(sc) || "") + '"></div>' +
      '<div class="li-sub" style="margin-top:-4px;margin-bottom:10px;">手机端如无法弹出日期选择器，可手动输入，格式：2026-12-20</div>' +
      '<button class="btn small plain" data-action="reset-ky-date">恢复官方自动时间</button>',
      cancelBtn() + '<button class="btn" data-action="submit-ky-date">' + ICONS.check + "保存</button>");
  }
  function submitKyDate() {
    var sc = kyActiveScheme();
    if (!sc) return;
    var dv = fval("kyDate") || "";
    if (dv && !/^\d{4}-\d{2}-\d{2}$/.test(dv)) { toast("日期格式应为 年-月-日", true); return; }
    sc.examDate = dv;
    modalClose(); refresh(); toast(sc.examDate ? "已手动设置考试时间" : "已恢复官方自动时间");
  }
  function resetKyDate() {
    var sc = kyActiveScheme();
    if (!sc) return;
    sc.examDate = "";
    modalClose(); refresh(); toast("已恢复官方自动时间");
  }
  /* 阶段切换 + 模板导入 */
  function kyStageSwitchModal() {
    var sc = kyActiveScheme();
    if (!sc) return;
    modalOpen("切换备考阶段",
      '<div class="field"><label>选择阶段</label><select id="kyStageSel2">' + KY_STAGES.map(function (s) {
        return '<option value="' + s.id + '"' + (sc.stage === s.id ? " selected" : "") + ">" + s.name + "</option>";
      }).join("") + "</select></div>" +
      '<label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-top:10px;"><input type="checkbox" id="kyImportTpl2"> 一键导入本阶段预设任务模板</label>' +
      '<div class="li-sub" style="margin-top:8px;">导入模板只会新增任务，不会清除现有任务</div>',
      cancelBtn() + '<button class="btn" data-action="submit-ky-stage">' + ICONS.check + "保存</button>");
  }
  function submitKyStage() {
    var sc = kyActiveScheme();
    if (!sc) return;
    sc.stage = fval("kyStageSel2") || "base";
    var needImport = $id("kyImportTpl2") && $id("kyImportTpl2").checked;
    modalClose(); refresh();
    if (needImport) kyImportTemplateConfirm();
    else toast("已切换为" + kyStageNameLocal(sc.stage));
  }
  function kyImportTemplateConfirm() {
    var sc = kyActiveScheme();
    if (!sc) return;
    var tpl = KY_TEMPLATES[sc.stage];
    modalOpen("导入「" + tpl.name + "」任务模板", "导入模板会新增 " + tpl.tasks.length + " 条任务，<b>不会清空你现有的任务</b>。是否确认导入？",
      cancelBtn() + '<button class="btn" data-action="ky-import-template-ok">' + ICONS.check + "确认导入</button>");
  }
  function kyImportTemplateOk() {
    var sc = kyActiveScheme();
    if (!sc) return;
    var tpl = KY_TEMPLATES[sc.stage];
    (tpl.tasks || []).forEach(function (t) {
      sc.tasks.push({ id: uid(), name: t.name, subjectId: kySetId("m1", t.subject), type: t.type, done: false, costMinutes: t.cost || 30, date: "", createTime: nowStr(), finishTime: "" });
    });
    modalClose(); refresh(); toast("已导入 " + tpl.tasks.length + " 条模板任务");
  }
  /* 任务 */
  function kyTaskAddModal(preType) {
    var sc = kyActiveScheme();
    if (!sc || sc.archived) { toast("方案已归档，无法新增任务", true); return; }
    modalOpen("新增任务",
      field("任务名称", "kyTaskName", "text", "例如：数学真题 2 道") +
      '<div class="field"><label>所属科目</label><select id="kyTaskSubject">' + (sc.subjects || []).map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>任务类型</label><select id="kyTaskType">' +
      '<option value="daily"' + (preType === "daily" ? " selected" : "") + '>每日必做</option>' +
      '<option value="weekly"' + (preType === "weekly" ? " selected" : "") + '>周计划任务</option>' +
      '<option value="longterm"' + (preType === "longterm" ? " selected" : "") + '>长期领域任务</option></select></div>' +
      field("预计耗时（分钟）", "kyTaskCost", "number", "30") +
      field("截止时间（可选）", "kyTaskDate", "date", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-task">' + ICONS.check + "保存</button>");
  }
  function submitKyTask() {
    var sc = kyActiveScheme();
    if (!sc || sc.archived) return;
    var name = fval("kyTaskName").trim();
    if (!name) { toast("请填写任务名称", true); return; }
    var editId = window.__editKyTaskId;
    if (editId) {
      var t = sc.tasks.filter(function (x) { return x.id === editId; })[0];
      if (t) { t.name = name; t.subjectId = fval("kyTaskSubject"); t.type = fval("kyTaskType"); t.costMinutes = parseInt(fval("kyTaskCost"), 10) || 0; t.date = fval("kyTaskDate") || ""; }
      window.__editKyTaskId = null;
    } else {
      sc.tasks.push({ id: uid(), name: name, subjectId: fval("kyTaskSubject"), type: fval("kyTaskType"), done: false, costMinutes: parseInt(fval("kyTaskCost"), 10) || 0, date: fval("kyTaskDate") || "", createTime: nowStr(), finishTime: "" });
    }
    modalClose(); refresh(); toast("任务已保存");
  }
  function kyTaskEditModal(id) {
    var sc = kyActiveScheme();
    var t = sc.tasks.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    window.__editKyTaskId = id;
    modalOpen("编辑任务",
      field("任务名称", "kyTaskName", "text", "", t.name) +
      '<div class="field"><label>所属科目</label><select id="kyTaskSubject">' + (sc.subjects || []).map(function (s) { return '<option value="' + esc(s.id) + '"' + (s.id === t.subjectId ? " selected" : "") + ">" + esc(s.name) + "</option>"; }).join("") + "</select></div>" +
      '<div class="field"><label>任务类型</label><select id="kyTaskType">' +
      '<option value="daily"' + (t.type === "daily" ? " selected" : "") + '>每日必做</option>' +
      '<option value="weekly"' + (t.type === "weekly" ? " selected" : "") + '>周计划任务</option>' +
      '<option value="longterm"' + (t.type === "longterm" ? " selected" : "") + '>长期领域任务</option></select></div>' +
      field("预计耗时（分钟）", "kyTaskCost", "number", "30", t.costMinutes || "") +
      field("截止时间（可选）", "kyTaskDate", "date", "", t.date || ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-task">' + ICONS.check + "保存</button>");
  }
  function kyTaskToggle(id) {
    var sc = kyActiveScheme();
    var t = sc.tasks.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (t.done) {
      t.done = false; t.finishTime = ""; refresh(); toast("已恢复为未完成");
    } else {
      /* 完成 → 弹耗时输入，自动记录学习时长 */
      window.__finishTaskId = id;
      modalOpen("完成「" + t.name + "」", '<div class="li-sub" style="margin-bottom:10px;">记录本次任务耗时，将自动计入学习打卡。</div>' +
        field("本次耗时（分钟）", "kyCostInput", "number", "30", t.costMinutes || 30),
        cancelBtn() + '<button class="btn" data-action="submit-ky-task-cost">' + ICONS.check + "完成并记录</button>");
    }
  }
  function submitKyTaskCost() {
    var sc = kyActiveScheme();
    var id = window.__finishTaskId;
    var t = sc.tasks.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    var min = parseInt(fval("kyCostInput"), 10) || 0;
    t.done = true;
    t.finishTime = nowStr();
    if (min > 0) {
      data.studyLog.push({ date: todayStr(), domainId: "kaoyan", subject: kySubjName(sc, t.subjectId), minutes: min, ts: nowStr() });
    }
    modalClose(); refresh(); toast("任务完成" + (min > 0 ? "，已记录 " + min + " 分钟学习时长" : ""));
  }
  function kyTaskDel(id) {
    var sc = kyActiveScheme();
    sc.tasks = sc.tasks.filter(function (x) { return x.id !== id; });
    refresh(); toast("任务已删除");
  }
  function kyBatchDone() {
    var sc = kyActiveScheme();
    var left = (sc.tasks || []).filter(function (t) { return !t.done; }).length;
    modalOpen("批量完成", "将标记 " + left + " 条未完成任务为已完成（不记录时长）。确定吗？",
      cancelBtn() + '<button class="btn" data-action="ky-batch-done-ok">' + ICONS.check + "确认</button>");
  }
  function kyBatchDoneOk() {
    var sc = kyActiveScheme();
    (sc.tasks || []).forEach(function (t) { if (!t.done) { t.done = true; t.finishTime = nowStr(); } });
    modalClose(); refresh(); toast("已批量完成");
  }
  function kyBatchDel() {
    var sc = kyActiveScheme();
    modalOpen("批量删除", "将删除当前方案全部 " + (sc.tasks || []).length + " 条任务，且不可恢复。确定吗？",
      cancelBtn() + '<button class="btn danger" data-action="ky-batch-del-ok">' + ICONS.trash + "确认删除</button>");
  }
  function kyBatchDelOk() {
    var sc = kyActiveScheme();
    sc.tasks = [];
    modalClose(); refresh(); toast("已清空任务");
  }
  function kyWeeklyGen() {
    var sc = kyActiveScheme();
    var tpl = KY_TEMPLATES[sc.stage];
    var added = 0;
    (tpl.tasks || []).forEach(function (t) {
      if (t.type !== "weekly") return;
      var dup = (sc.tasks || []).some(function (x) { return x.name === t.name; });
      if (!dup) {
        sc.tasks.push({ id: uid(), name: t.name, subjectId: kySetId("m1", t.subject), type: "weekly", done: false, costMinutes: t.cost || 60, date: "", createTime: nowStr(), finishTime: "" });
        added++;
      }
    });
    refresh(); toast(added ? "已生成 " + added + " 条本周计划任务（按" + tpl.name + "）" : "本周计划任务已齐全，无需重复生成");
  }
  /* 科目 */
  function kySubjectAddModal() {
    modalOpen("新增科目", field("科目名称", "kySubjName", "text", "例如：物理"),
      cancelBtn() + '<button class="btn" data-action="submit-ky-subject">' + ICONS.check + "保存</button>");
  }
  function submitKySubject() {
    var sc = kyActiveScheme();
    var name = fval("kySubjName").trim();
    if (!name) { toast("请填写科目名称", true); return; }
    if ((sc.subjects || []).some(function (s) { return s.name === name; })) { toast("该科目已存在", true); return; }
    sc.subjects.push({ id: uid(), name: name, custom: true });
    modalClose(); refresh(); toast("已新增科目");
  }
  function kySubjectDelConfirm(id) {
    window.__delSubjId = id;
    modalOpen("删除科目", "将删除该自定义科目（已有任务保留，显示为未分类）。确定吗？",
      cancelBtn() + '<button class="btn danger" data-action="ky-subject-del-ok">' + ICONS.trash + "确认删除</button>");
  }
  function kySubjectDelOk() {
    var sc = kyActiveScheme();
    var id = window.__delSubjId;
    sc.subjects = sc.subjects.filter(function (s) { return s.id !== id; });
    modalClose(); refresh(); toast("科目已删除");
  }
  /* 文件 */
  function kyFileAddModal() {
    var sc = kyActiveScheme();
    modalOpen("关联备考资料",
      field("标题", "kyFileTitle", "text", "例如：考研数学真题集") +
      field("链接（可选）", "kyFileUrl", "text", "https://…") +
      '<div class="field"><label>关联科目</label><select id="kyFileSubj"><option value="">未分类</option>' + (sc.subjects || []).map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>"; }).join("") + "</select></div>" +
      field("标签（可选）", "kyFileLabel", "text", "真题 / 笔记 / 讲义"),
      cancelBtn() + '<button class="btn" data-action="submit-ky-file">' + ICONS.check + "保存</button>");
  }
  function submitKyFile() {
    var sc = kyActiveScheme();
    var title = fval("kyFileTitle").trim();
    if (!title) { toast("请填写标题", true); return; }
    sc.files.push({ id: uid(), title: title, url: fval("kyFileUrl").trim(), subjectId: fval("kyFileSubj"), label: fval("kyFileLabel").trim(), addTime: nowStr() });
    modalClose(); refresh(); toast("已关联资料");
  }
  function kyFileDel(id) {
    var sc = kyActiveScheme();
    sc.files = sc.files.filter(function (f) { return f.id !== id; });
    refresh(); toast("资料已移除");
  }
  /* 统计报告导出 */
  function kyExportReport() {
    var sc = kyActiveScheme();
    var lines = ["考研备考统计报告", "方案：" + sc.name, "阶段：" + kyStageNameLocal(sc.stage), "考试时间：" + (kyExamDateLocal(sc) || "未设置"), "生成时间：" + nowStr(), ""];
    lines.push("科目完成情况：");
    (sc.subjects || []).forEach(function (s) {
      var st = (sc.tasks || []).filter(function (t) { return t.subjectId === s.id; });
      var done = st.filter(function (t) { return t.done; }).length;
      lines.push("  " + s.name + "：" + done + " / " + st.length + " 项");
    });
    lines.push("");
    lines.push("任务统计：共 " + (sc.tasks || []).length + " 条，已完成 " + (sc.tasks || []).filter(function (t) { return t.done; }).length + " 条");
    var logs = (data.studyLog || []).filter(function (x) { return x.domainId === "kaoyan"; });
    var totalMin = logs.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    lines.push("累计学习时长：" + Math.round(totalMin / 60 * 10) / 10 + " 小时（" + logs.length + " 次打卡）");
    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "考研备考统计报告-" + todayStr() + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast("统计报告已导出");
  }

  /* ---------- 考研今日行动：点击链路闭环 ---------- */
  var KY_POL_POINTS = {
    "马原": ["实践是认识的来源、动力、检验标准和目的", "矛盾分析法：对立统一规律是唯物辩证法的核心", "物质决定意识，意识对物质有能动反作用", "社会存在决定社会意识，社会意识具有相对独立性"],
    "毛中特": ["新时代主要矛盾：人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾", "两个一百年：建党百年全面建成小康社会，建国百年建成社会主义现代化强国", "新发展理念：创新、协调、绿色、开放、共享", "全过程人民民主是社会主义民主政治的本质属性"],
    "史纲": ["中国近代史的开端：鸦片战争（1840）", "新民主主义革命的开端：五四运动（1919）", "遵义会议：党的历史上生死攸关的转折点", "七届二中全会：工作重心由乡村转移到城市"],
    "思修": ["理想信念是精神之钙", "社会主义核心价值观：富强民主文明和谐、自由平等公正法治、爱国敬业诚信友善", "道德的本质：由经济基础决定的社会意识形态", "法治思维的基本内容：法律至上、权力制约、公平正义、权利保障、程序正当"]
  };
  var KY_WORDS = ["abandon", "abide", "absorb", "abstract", "abundant", "academic", "accelerate", "accommodate", "accompany", "accomplish", "accumulate", "accurate"];
  var kyTimer = { iv: null, sec: 0, label: "", cb: null };
  function kyTimerStart(label, cb) {
    if (kyTimer.iv) clearInterval(kyTimer.iv);
    kyTimer.sec = 0; kyTimer.label = label; kyTimer.cb = cb;
    var box = $id("kyTimerBox");
    if (!box) { box = document.createElement("div"); box.id = "kyTimerBox"; box.className = "ky-timer-box"; document.body.appendChild(box); }
    box.innerHTML = '<div class="ky-timer-label">' + esc(label) + '</div><div class="ky-timer-time" id="kyTimerTime">00:00</div>' +
      '<button class="btn small" data-action="ky-timer-stop">结束并记录</button>';
    box.style.display = "block";
    kyTimer.iv = setInterval(function () {
      kyTimer.sec++;
      var el = $id("kyTimerTime");
      if (el) el.textContent = String(Math.floor(kyTimer.sec / 60)).padStart(2, "0") + ":" + String(kyTimer.sec % 60).padStart(2, "0");
    }, 1000);
  }
  function kyTimerStopAction() {
    if (kyTimer.iv) clearInterval(kyTimer.iv);
    kyTimer.iv = null;
    var box = $id("kyTimerBox"); if (box) box.style.display = "none";
    var cb = kyTimer.cb; var sec = kyTimer.sec; kyTimer.cb = null;
    if (cb) cb(sec);
  }
  function kyMarkDone(sc, key) {
    var gen = sc.gen || {};
    gen.dailyDone = gen.dailyDone || { date: "", count: 0, subjects: [] };
    var t = todayStr();
    if (gen.dailyDone.date !== t) gen.dailyDone = { date: t, count: 0, subjects: [] };
    if (gen.dailyDone.subjects.indexOf(key) < 0) gen.dailyDone.subjects.push(key);
    gen.dailyDone.count = gen.dailyDone.subjects.length;
    if (gen.dailyDone.count >= 5) gen.stars = (gen.stars || 0) + 3;
    save();
  }
  function kyStartEnglish() {
    var papers = [];
    for (var y = 2010; y <= 2019; y++) for (var i = 1; i <= 4; i++) papers.push(y + " Text" + i);
    modalOpen("今日英语任务",
      '<div class="li-sub" style="margin-bottom:10px;">选择今天精读的篇目，确认后自动开始计时（悬浮显示用时）。</div>' +
      '<div class="field"><label>选择篇目</label><select id="kyPaper">' + papers.map(function (p) { return "<option>" + p + "</option>"; }).join("") + "</select></div>" +
      '<div class="li-sub" style="margin-top:8px;">完成阅读后记录正确率与错题类型，自动存入历史复盘。正确率 ≥60% 得 1 颗 ⭐。</div>',
      cancelBtn() + '<button class="btn" data-action="ky-paper-ok">开始计时阅读</button>');
  }
  function kyPaperOk() {
    var paper = fval("kyPaper") || "2010 Text1";
    modalClose();
    kyTimerStart("英语精读 " + paper, function (sec) { kyReadingSave(paper, sec); });
  }
  function kyFmtSec(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m > 0 ? m + " 分 " + s + " 秒" : s + " 秒";
  }
  function kyReadingSave(paper, sec) {
    modalOpen("记录「" + paper + "」结果",
      field("正确率（%）", "kyCorrect", "number", "70", "") +
      '<div class="field"><label>错题类型（多选）</label>' +
      '<label class="checkline"><input type="checkbox" value="主旨"> 主旨</label>' +
      '<label class="checkline"><input type="checkbox" value="细节"> 细节</label>' +
      '<label class="checkline"><input type="checkbox" value="推理"> 推理</label>' +
      '<label class="checkline"><input type="checkbox" value="词汇"> 词汇</label></div>' +
      '<div class="field"><label>定位句分析（错因）</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc" value="没看懂句子"> 没看懂句子</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc" value="逻辑替换没识别"> 逻辑替换没识别</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc" value="两者都有"> 两者都有</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc" value="没有错题"> 没有错题</label></div>' +
      '<div class="li-sub" style="margin-top:4px;">用时 ' + kyFmtSec(sec) + "。正确率 ≥60% 得 1 颗 ⭐</div>",
      cancelBtn() + '<button class="btn" data-action="ky-reading-save">保存</button>');
    window.__kyPaper = paper; window.__kySec = sec;
  }
  function kyReadingSaveOk() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var correct = parseInt(fval("kyCorrect"), 10) || 0;
    var wrongTypes = [];
    var cbs = document.querySelectorAll('#modalBody input[type="checkbox"]:checked');
    for (var i = 0; i < cbs.length; i++) wrongTypes.push(cbs[i].value);
    var loc = document.querySelector('input[name="kyLoc"]:checked');
    gen.readingLog = gen.readingLog || [];
    gen.readingLog.push({ date: todayStr(), paper: window.__kyPaper || "", correct: correct, wrongTypes: wrongTypes, locate: loc ? loc.value : "", minutes: Math.max(1, Math.round((window.__kySec || 0) / 60)) });
    gen.stars = (gen.stars || 0) + (correct >= 60 ? 1 : 0);
    kyMarkDone(sc, "english");
    modalClose(); refresh();
    toast(correct >= 60 ? "正确率 " + correct + "% +1 ⭐" : "已记录（正确率 <60%，未得星，明天继续）");
  }
  function kyStartMath() {
    var sc = kyActiveScheme();
    var items = ({ base: "教材精读 + 基础习题 20 道", enhance: "专题刷题 20 道（限时）", zhenti: "真题套卷 1 套 + 订正", sprint: "模拟卷 1 套 + 错题复盘" })[sc.stage] || "基础复习";
    modalOpen("今日数学任务",
      '<div class="li-sub" style="margin-bottom:10px;">' + esc(items) + "</div>" +
      '<div class="li-sub">点击开始计时，结束后自动记录时长打卡。</div>',
      cancelBtn() + '<button class="btn" data-action="ky-math-go">开始计时</button>');
  }
  function kyMathGo() {
    modalClose();
    kyTimerStart("数学学习", function (sec) {
      var sc = kyActiveScheme();
      var min = Math.max(1, Math.round(sec / 60));
      data.studyLog.push({ date: todayStr(), domainId: "kaoyan", subject: "数学", minutes: min, ts: nowStr() });
      kyMarkDone(sc, "math");
      refresh(); toast("数学完成，已记录 " + min + " 分钟");
    });
  }
  function kyStartPolitics() {
    var gen = kyActiveScheme().gen || {};
    var t = todayStr();
    var polSubj = ["马原", "毛中特", "史纲", "思修"][Math.floor(Date.parse(t + "T00:00:00") / 86400000) % 4];
    var points = KY_POL_POINTS[polSubj] || [];
    modalOpen("今日政治任务（" + polSubj + " 轮播）",
      '<div class="li-sub" style="margin-bottom:8px;">今日知识点 4 条：</div>' +
      '<div class="list">' + points.map(function (p) {
        return '<div class="list-item"><div class="li-title" style="font-weight:400;font-size:14px;">· ' + esc(p) + "</div></div>";
      }).join("") + "</div>" +
      '<div class="li-sub" style="margin:8px 0;">配套：1000 题 20 道（自行刷题后回来标记完成）</div>',
      cancelBtn() + '<button class="btn" data-action="ky-politics-done">标记掌握并完成</button>');
  }
  function kyPoliticsDone() {
    kyMarkDone(kyActiveScheme(), "politics");
    modalClose(); refresh(); toast("政治完成，知识点已掌握");
  }
  function kyStartMajor() {
    var gen = kyActiveScheme().gen || {};
    modalOpen("今日专业课（第 " + (gen.chapterIndex || 1) + " 章）",
      '<div class="field"><label>标签（必选，避免无效笔记）</label>' +
      '<label class="checkline"><input type="radio" name="mjTag" value="教材页码"> 教材页码：<input id="mjPage" placeholder="如 P120-135" style="width:120px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;"></label>' +
      '<label class="checkline"><input type="radio" name="mjTag" value="真题年份"> 真题年份：<input id="mjYear" placeholder="如 2019" style="width:90px;padding:4px 6px;border:1px solid var(--border);border-radius:6px;"></label></div>' +
      '<div class="field"><label>本章笔记</label><textarea id="mjNote" placeholder="写下本章核心内容、公式、易错点…" style="min-height:100px;width:100%;box-sizing:border-box;padding:8px;border:1px solid var(--border);border-radius:8px;"></textarea></div>',
      cancelBtn() + '<button class="btn" data-action="ky-major-save">保存笔记并完成</button>');
  }
  function kyMajorSave() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var tagType = document.querySelector('input[name="mjTag"]:checked');
    if (!tagType) { toast("请先选择标签（教材页码或真题年份）", true); return; }
    var tagVal = (tagType.value === "教材页码" ? fval("mjPage") : fval("mjYear") || "").trim();
    if (!tagVal) { toast("请填写" + tagType.value, true); return; }
    var note = fval("mjNote").trim();
    if (!note) { toast("请写下本章笔记内容", true); return; }
    gen.noteLog = gen.noteLog || [];
    gen.noteLog.push({ date: todayStr(), chapter: gen.chapterIndex || 1, tagType: tagType.value, tag: tagVal, note: note });
    gen.chapterIndex = (gen.chapterIndex || 1) + 1;
    kyMarkDone(sc, "major");
    modalClose(); refresh(); toast("笔记已保存，下一章：第 " + (gen.chapterIndex || 1) + " 章");
  }
  function kyStartWord() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var t = todayStr();
    gen.wordProgress = gen.wordProgress || {};
    if (gen.wordProgress.date !== t) { gen.wordProgress.date = t; gen.wordProgress.done = 0; }
    modalOpen("今日单词（新词 80 + 复习 120）",
      '<div class="li-sub" style="margin-bottom:8px;">点击已记住的词划掉（每 10 个自动保存）。当前进度：' + gen.wordProgress.done + " / 200</div>" +
      '<div class="ky-words">' + KY_WORDS.map(function (w, i) {
        return '<div class="ky-word' + (gen.wordProgress.done > i ? " done" : "") + '" data-action="ky-word-toggle" data-idx="' + i + '">' +
          "<span class=\"kw-w\">" + w + "</span></div>";
      }).join("") + "</div>" +
      '<div class="li-sub" style="margin-top:8px;">这是示例词组（12 词一组），完整 200 词进度由学习记录累计。</div>',
      cancelBtn() + '<button class="btn block" data-action="ky-word-done">今日单词完成</button>');
  }
  function kyWordToggle(idx) {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var t = todayStr(); gen.wordProgress = gen.wordProgress || {};
    if (gen.wordProgress.date !== t) { gen.wordProgress.date = t; gen.wordProgress.done = 0; }
    var el = document.querySelector('[data-action="ky-word-toggle"][data-idx="' + idx + '"]');
    if (!el) return;
    var nowDone = el.classList.contains("done");
    el.classList.toggle("done");
    gen.wordProgress.done = Math.max(0, (gen.wordProgress.done || 0) + (nowDone ? -1 : 1));
    save();
    if (gen.wordProgress.done > 0 && gen.wordProgress.done % 10 === 0) toast("已划掉 " + gen.wordProgress.done + " 个，进度已自动保存");
  }
  function kyWordDone() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    gen.wordProgress = gen.wordProgress || {}; gen.wordProgress.done = 200;
    kyMarkDone(sc, "word");
    modalClose(); refresh(); toast("今日单词完成");
  }
  /* 快捷复盘 3 问 + 目标分数 */
  function kyReviewToday() {
    modalOpen("今日快捷复盘（3 问）",
      '<div class="field"><label>1. 今日最大干扰源？</label>' +
      '<label class="checkline"><input type="radio" name="rv1" value="手机"> 手机</label>' +
      '<label class="checkline"><input type="radio" name="rv1" value="困倦"> 困倦</label>' +
      '<label class="checkline"><input type="radio" name="rv1" value="题目太难"> 题目太难</label>' +
      '<label class="checkline"><input type="radio" name="rv1" value="其他"> 其他</label></div>' +
      '<div class="field"><label>2. 今日最有收获的科目？</label>' +
      '<label class="checkline"><input type="radio" name="rv2" value="英语"> 英语</label>' +
      '<label class="checkline"><input type="radio" name="rv2" value="政治"> 政治</label>' +
      '<label class="checkline"><input type="radio" name="rv2" value="专业课"> 专业课</label>' +
      '<label class="checkline"><input type="radio" name="rv2" value="单词"> 单词</label></div>' +
      '<div class="field"><label>3. 明天是否维持今日任务量？</label>' +
      '<label class="checkline"><input type="radio" name="rv3" value="维持"> 维持</label>' +
      '<label class="checkline"><input type="radio" name="rv3" value="减少10%"> 减少 10%</label>' +
      '<label class="checkline"><input type="radio" name="rv3" value="增加10%"> 增加 10%</label></div>',
      cancelBtn() + '<button class="btn" data-action="ky-review-save">保存复盘</button>');
  }
  function kyReviewSave() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var q1 = document.querySelector('input[name="rv1"]:checked');
    var q2 = document.querySelector('input[name="rv2"]:checked');
    var q3 = document.querySelector('input[name="rv3"]:checked');
    if (!q1 || !q2 || !q3) { toast("请完成 3 个选择题", true); return; }
    gen.reviewLog = gen.reviewLog || [];
    gen.reviewLog.push({ date: todayStr(), disturb: q1.value, gain: q2.value, adjust: q3.value });
    modalClose(); refresh(); toast("复盘已保存，周日生成拦路虎周报");
  }
  function kyGoalModal() {
    var gen = kyActiveScheme().gen || {};
    modalOpen("目标分数（推荐任务据此自动生成）",
      field("英语目标分", "kyGoalEn", "number", "70", gen.targetEnglish || 70) +
      field("数学目标分", "kyGoalMath", "number", "70", gen.targetMath || 70) +
      field("政治目标分", "kyGoalPol", "number", "70", gen.targetPolitics || 70) +
      field("专业课目标分", "kyGoalMajor", "number", "100", gen.targetMajor || 100) +
      '<div class="li-sub" style="margin-top:4px;">英语 ≥70 分 → 每日精读 2 篇 + 长难句 5 句；<60 分 → 精读 1 篇 + 单词 150 个。</div>',
      cancelBtn() + '<button class="btn" data-action="submit-ky-goal">' + ICONS.check + "保存</button>");
  }
  function submitKyGoal() {
    var gen = kyActiveScheme().gen || {};
    gen.targetEnglish = parseInt(fval("kyGoalEn"), 10) || 70;
    gen.targetMath = parseInt(fval("kyGoalMath"), 10) || 70;
    gen.targetPolitics = parseInt(fval("kyGoalPol"), 10) || 70;
    gen.targetMajor = parseInt(fval("kyGoalMajor"), 10) || 100;
    modalClose(); refresh(); toast("目标已保存，今日推荐任务已重新生成");
  }

  /* ---------- 学科页工具交互 ---------- */
  var KY_FORMULAS = {
    "高数·极限": ["lim(x→0) sinx/x = 1", "lim(x→∞) (1+1/x)^x = e", "等价无穷小：sinx~x, tanx~x, ln(1+x)~x, e^x-1~x, 1-cosx~x²/2"],
    "高数·导数": ["(xⁿ)' = nxⁿ⁻¹", "(sinx)' = cosx, (cosx)' = -sinx", "(eˣ)' = eˣ, (lnx)' = 1/x", "链式法则：d/dx f(g(x)) = f'(g(x))·g'(x)"],
    "高数·积分": ["∫xⁿdx = xⁿ⁺¹/(n+1) + C", "∫1/x dx = ln|x| + C", "∫sinx dx = -cosx + C, ∫cosx dx = sinx + C", "分部积分：∫udv = uv - ∫vdu"],
    "线代·矩阵": ["|AB| = |A||B|", "A⁻¹ = A*/|A|（伴随矩阵法）", "初等行变换不改变秩", "|kA| = kⁿ|A|（n 阶）"],
    "线代·特征值": ["特征值之和 = 迹，之积 = 行列式", "相似矩阵有相同特征值", "实对称矩阵必可正交对角化"],
    "概率·常用": ["P(A∪B) = P(A)+P(B)-P(AB)", "全概率公式、贝叶斯公式", "E(aX+b) = aE(X)+b，D(aX+b) = a²D(X)", "正态分布标准化：Z = (X-μ)/σ"]
  };
  var KY_SENTENCES = [
    { s: "The difference between what you have and what you want is what you do.", t: "拆解：主语 the difference...is what you do（表语从句）。结构：A is B，用 what 引导从句作表语。" },
    { s: "Only when we face our fears can we truly grow.", t: "倒装：Only + 状语从句置句首，主句部分倒装（can we）。正常语序：We can truly grow only when..." },
    { s: "What matters most is not how much we know, but how well we use it.", t: "主语从句 What matters most + not...but... 并列结构。" },
    { s: "He who learns but does not think is lost.", t: "定语从句 who learns but does not think 修饰 He。出自《论语》英译。" },
    { s: "It is not the strongest that survives, but the most adaptable.", t: "强调句型 It is...that... + not...but... 转折。" }
  ];
  var KY_ESSAY_TEMPLATES = {
    "小作文·建议信": ["开头：I am writing to offer some suggestions on...", "主体：First and foremost, ... / Moreover, ... / Last but not least, ...", "结尾：I hope my suggestions will be of help.  Yours sincerely, Li Ming"],
    "小作文·感谢信": ["开头：I am writing to express my sincere gratitude for...", "主体：Thanks to your help, I ...", "结尾：I would be grateful if you could...  Yours, Li Ming"],
    "大作文·开头段": ["As is vividly depicted in the picture, ...", "The picture is intended to convey the message that...", "Obviously, the drawing symbolically reveals a prevalent phenomenon that..."],
    "大作文·论证段": ["A case in point is ...", "According to a recent survey, ...", "What's more, it is of great significance to note that..."],
    "大作文·结尾段": ["In conclusion, it is high time that we took effective measures to...", "Only in this way can we ...", "To sum up, ..."]
  };
  var KY_HAT_QUESTIONS = [
    { q: "实践是认识的（ ）", a: "来源、动力、检验标准和目的" },
    { q: "马克思主义最鲜明的特征", a: "科学性 + 革命性（实践性、人民性）" },
    { q: "新时代坚持和发展中国特色社会主义的根本立场", a: "以人民为中心" },
    { q: "全面深化改革的总目标", a: "完善和发展中国特色社会主义制度，推进国家治理体系和治理能力现代化" },
    { q: "全面建成小康社会的底线任务", a: "打赢脱贫攻坚战" },
    { q: "中国式现代化的本质要求（首条）", a: "坚持中国共产党领导" }
  ];
  var KY_SUBJ_FRAMES = {
    "马原": "点：写出原理名称（如：矛盾的对立统一规律）→ 默：默写原理内容（内涵+方法论）→ 析：结合材料分析（材料中…体现了…）",
    "毛中特": "点：理论要点（如：新发展理念）→ 默：理论内涵（创新/协调/绿色/开放/共享）→ 析：联系现实与材料",
    "史纲": "点：历史事件或结论 → 默：背景-过程-意义 → 析：结合材料谈启示",
    "思修": "点：道德/法律规范要点 → 默：规范内涵 → 析：结合材料与自身",
    "当代": "点：时政主题 → 默：我国立场与主张 → 析：材料印证"
  };
  function kyFormulaModal() {
    var gen = kyActiveScheme().gen || {};
    var custom = gen.customFormulas || {};
    var cats = Object.keys(KY_FORMULAS).concat(Object.keys(custom));
    modalOpen("📐 数学公式卡", '<div class="li-sub" style="margin-bottom:10px;">考研数学常用公式（内置 + 自定义）</div>' +
      cats.map(function (k) {
        var items = (KY_FORMULAS[k] || []).concat(custom[k] || []);
        return '<div class="formula-block"><div class="formula-title">' + esc(k) + (custom[k] && custom[k].length ? ' <span class="tag">自定义</span>' : "") + "</div>" +
          items.map(function (f) { return '<div class="formula-line">' + esc(f) + "</div>"; }).join("") + "</div>";
      }).join(""),
      cancelBtn() + '<button class="btn" data-action="ky-formula-add">＋ 添加公式</button>');
  }
  function kyPaperModal() {
    modalOpen("📋 真题套卷记录", '<div class="li-sub" style="margin-bottom:10px;">记录每套真题各板块得分（百分制），薄弱章节一目了然</div>' +
      field("套卷编号", "kyPaperNo", "text", "如 2010 / 2013", "") +
      field("选填得分", "kyPaperX", "number", "0-50", "") +
      field("高数得分", "kyPaperG", "number", "0-35", "") +
      field("线代得分", "kyPaperX2", "number", "0-20", "") +
      field("概率得分", "kyPaperP", "number", "0-20", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-paper">' + ICONS.check + "保存记录</button>");
  }
  function submitKyPaper() {
    var gen = kyActiveScheme().gen || {};
    var paper = fval("kyPaperNo").trim();
    if (!paper) { toast("请填写套卷编号", true); return; }
    var x = parseInt(fval("kyPaperX"), 10) || 0, g = parseInt(fval("kyPaperG"), 10) || 0, x2 = parseInt(fval("kyPaperX2"), 10) || 0, p = parseInt(fval("kyPaperP"), 10) || 0;
    gen.paperRecords = gen.paperRecords || [];
    gen.paperRecords.push({ date: todayStr(), paper: paper, xuan: x, gs: g, xd: x2, gl: p, total: x + g + x2 + p });
    modalClose(); refresh(); toast("套卷「" + paper + "」已记录");
  }
  function kyCarelessModal() {
    modalOpen("⚠️ 粗心账本", '<div class="li-sub" style="margin-bottom:10px;">专门记录跳步/正负号等计算失误，考前专项盯防</div>' +
      '<div class="field"><label>失误类型</label>' +
      '<label class="checkline"><input type="radio" name="clType" value="跳步"> 跳步</label>' +
      '<label class="checkline"><input type="radio" name="clType" value="正负号"> 正负号</label>' +
      '<label class="checkline"><input type="radio" name="clType" value="抄错"> 抄错</label>' +
      '<label class="checkline"><input type="radio" name="clType" value="公式记错"> 公式记错</label>' +
      '<label class="checkline"><input type="radio" name="clType" value="其他"> 其他</label></div>' +
      field("具体说明", "clNote", "text", "如：第 3 题第二行符号写反", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-careless">' + ICONS.check + "记一笔</button>");
  }
  function submitKyCareless() {
    var gen = kyActiveScheme().gen || {};
    var tp = document.querySelector('input[name="clType"]:checked');
    if (!tp) { toast("请选择失误类型", true); return; }
    gen.carelessness = gen.carelessness || [];
    gen.carelessness.push({ date: todayStr(), type: tp.value, note: fval("clNote").trim() });
    modalClose(); refresh(); toast("已记入粗心账本");
  }
  function kySentenceModal() {
    modalOpen("📝 长难句练习（每日 5 句）", '<div class="li-sub" style="margin-bottom:10px;">先自己拆解，再点看解析</div>' +
      KY_SENTENCES.map(function (s, i) {
        return '<div class="sentence-block"><div class="sentence-en">' + (i + 1) + ". " + esc(s.s) + "</div>" +
          '<button class="btn small ghost" data-action="ky-sentence-ans" data-idx="' + i + '" style="margin-top:6px;">看解析</button>' +
          '<div class="sentence-ans" id="sAns' + i + '" style="display:none;">' + esc(s.t) + "</div></div>";
      }).join(""),
      cancelBtn() + '<button class="btn" data-action="ky-sentence-done">今日长难句完成</button>');
  }
  function kySentenceAns(idx) {
    var el = $id("sAns" + idx);
    if (el) el.style.display = el.style.display === "none" ? "block" : "none";
  }
  function kySentenceDone() {
    kyMarkDone(kyActiveScheme(), "english");
    modalClose(); refresh(); toast("长难句完成，英语今日任务已标记");
  }
  function kyEssayModal() {
    var gen = kyActiveScheme().gen || {};
    var notes = gen.essayNotes || [];
    modalOpen("✍️ 作文模板库", '<div class="li-sub" style="margin-bottom:8px;">高分句式 + 手动批注</div>' +
      Object.keys(KY_ESSAY_TEMPLATES).map(function (k) {
        return '<div class="formula-block"><div class="formula-title">' + esc(k) + "</div>" +
          KY_ESSAY_TEMPLATES[k].map(function (f) { return '<div class="formula-line">' + esc(f) + "</div>"; }).join("") + "</div>";
      }).join("") +
      (notes.length ? '<div class="li-sub" style="margin:10px 0 6px;">我的批注：</div><div class="list">' + notes.slice().reverse().slice(0, 5).map(function (n) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(n.type) + "</div>" +
          '<div class="li-sub">' + esc(n.text) + " · " + esc(n.date) + "</div></div></div>";
      }).join("") + "</div>" : ""),
      cancelBtn() + '<button class="btn" data-action="ky-essay-note">＋ 记录作文批注</button>');
  }
  function kyEssayNoteModal() {
    modalOpen("✍️ 记录作文批注", '<div class="li-sub" style="margin-bottom:10px;">记下你写作时用到的靓句 / 老师批改意见</div>' +
      selField("类型", "esType", [["小作文", "小作文"], ["大作文", "大作文"]], "大作文") +
      field("批注内容", "esNote", "text", "如：用到了 It is high time that 句型", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-essay-note">' + ICONS.check + "保存批注</button>");
  }
  function submitKyEssayNote() {
    var gen = kyActiveScheme().gen || {};
    var text = fval("esNote").trim();
    if (!text) { toast("请填写批注内容", true); return; }
    gen.essayNotes = gen.essayNotes || [];
    gen.essayNotes.push({ date: todayStr(), type: fval("esType"), text: text });
    modalClose(); refresh(); toast("批注已保存");
  }
  function kyTransModal() {
    modalOpen("🌐 翻译每日一句", '<div class="li-sub" style="margin-bottom:10px;">今日翻译练习：先翻，再记录生词与语序反思</div>' +
      '<div style="background:#F7F7F5;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:14px;line-height:1.7;">The progress of science depends not only on new ideas, but also on new instruments that make those ideas possible.</div>' +
      field("生词记录", "trWords", "text", "如：instrument 仪器", "") +
      field("语序调整反思", "trNote", "text", "如：not only...but also 译作 不仅…而且…", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-trans">' + ICONS.check + "保存反思</button>");
  }
  function submitKyTrans() {
    var gen = kyActiveScheme().gen || {};
    var note = fval("trNote").trim();
    if (!note) { toast("请填写语序反思", true); return; }
    gen.translationLog = gen.translationLog || [];
    gen.translationLog.push({ date: todayStr(), words: fval("trWords").trim(), orderNote: note });
    modalClose(); refresh(); toast("翻译反思已保存");
  }
  function kyPointsModal() {
    var gen = kyActiveScheme().gen || {};
    var custom = gen.customPoints || {};
    var cats = Object.keys(KY_POL_POINTS).concat(Object.keys(custom));
    modalOpen("🗂 政治知识点库", '<div class="li-sub" style="margin-bottom:10px;">按章浏览（内置 + 自定义）</div>' +
      cats.map(function (k) {
        var items = (KY_POL_POINTS[k] || []).concat(custom[k] || []);
        return '<div class="formula-block"><div class="formula-title">' + esc(k) + (custom[k] && custom[k].length ? ' <span class="tag">自定义</span>' : "") + "</div>" +
          items.map(function (p) { return '<div class="formula-line">· ' + esc(p) + "</div>"; }).join("") + "</div>";
      }).join(""),
      cancelBtn() + '<button class="btn" data-action="ky-point-add">＋ 添加知识点</button>');
  }
  function kyHatModal() {
    var gen = kyActiveScheme().gen || {};
    var hats = KY_HAT_QUESTIONS.concat(gen.customHats || []);
    modalOpen("🎩 帽子题专项", '<div class="li-sub" style="margin-bottom:10px;">先答再看答案，记录对错</div>' +
      hats.map(function (h, i) {
        return '<div class="formula-block"><div class="formula-title">' + (i + 1) + ". " + esc(h.q) + "</div>" +
          '<div class="li-sub">答案：' + esc(h.a) + "</div>" +
          '<div style="display:flex;gap:8px;margin-top:6px;">' +
          '<button class="btn small" data-action="ky-hat-ok" data-idx="' + i + '">答对了</button>' +
          '<button class="btn small ghost" data-action="ky-hat-no" data-idx="' + i + '">答错了</button></div></div>';
      }).join(""),
      cancelBtn() + '<button class="btn" data-action="ky-hat-add">＋ 添加帽子题</button>');
  }
  function kyHatRecord(idx, correct) {
    var gen = kyActiveScheme().gen || {};
    var hats = KY_HAT_QUESTIONS.concat(gen.customHats || []);
    var h = hats[idx];
    if (!h) return;
    gen.hatQuestions = gen.hatQuestions || [];
    gen.hatQuestions.push({ date: todayStr(), q: h.q, ans: h.a, correct: correct });
    save(); modalClose(); toast(correct ? "✓ 答对，已记录" : "✗ 答错，已记录（建议复习）");
  }
  function kyFrameModal() {
    modalOpen("📋 主观题答题框架（点-默-析）", '<div class="li-sub" style="margin-bottom:10px;">比对自己的答案框架</div>' +
      Object.keys(KY_SUBJ_FRAMES).map(function (k) {
        return '<div class="formula-block"><div class="formula-title">' + esc(k) + "</div>" +
          '<div class="formula-line">' + esc(KY_SUBJ_FRAMES[k]) + "</div></div>";
      }).join(""), okBtn("ky-close"));
  }
  function kyAffairModal() {
    modalOpen("📰 时政收藏夹", '<div class="li-sub" style="margin-bottom:10px;">粘贴本月重要时政词条，标注可联系考点</div>' +
      field("时政词条/事件", "afTitle", "text", "如：中央经济工作会议提出…", "") +
      field("可联系考点", "afPoint", "text", "如：新发展理念 / 高质量发展", "") +
      field("详细内容", "afText", "text", "（可选）粘贴要点", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-affair">' + ICONS.check + "收藏</button>");
  }
  function submitKyAffair() {
    var gen = kyActiveScheme().gen || {};
    var title = fval("afTitle").trim();
    if (!title) { toast("请填写时政词条", true); return; }
    gen.currentAffairs = gen.currentAffairs || [];
    gen.currentAffairs.push({ date: todayStr(), title: title, examPoint: fval("afPoint").trim(), text: fval("afText").trim() });
    modalClose(); refresh(); toast("时政已收藏");
  }

  function kyNotesModal() {
    var gen = kyActiveScheme().gen || {};
    var nl = gen.noteLog || [];
    modalOpen("📒 章节笔记库", '<div class="li-sub" style="margin-bottom:10px;">共 ' + nl.length + " 章笔记 · 每章带标签</div>" +
      (nl.length ? '<div class="list" style="max-height:340px;overflow-y:auto;">' + nl.slice().reverse().map(function (n) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">第 ' + n.chapter + " 章 ｜ " + esc(n.tagType) + "：" + esc(n.tag) + "</div>" +
          '<div class="li-sub">' + esc(n.note) + " · " + esc(n.date) + "</div></div></div>";
      }).join("") + "</div>" : '<div class="li-sub">暂无笔记</div>'), okBtn("ky-close"));
  }
  function kyFillModal() {
    modalOpen("✏️ 关键词挖空（背诵/默写）", '<div class="li-sub" style="margin-bottom:10px;">把重点词替换成 ____，自测背诵。例如：<b>实践是认识的 ____（来源）</b></div>' +
      field("章节", "fbCh", "text", "如 第 3 章", "") +
      field("挖空内容", "fbText", "text", "如：晶体的结构取决于 ____（键合方式）", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-fill">' + ICONS.check + "保存挖空</button>");
  }
  function submitKyFill() {
    var gen = kyActiveScheme().gen || {};
    var text = fval("fbText").trim();
    if (!text) { toast("请填写挖空内容", true); return; }
    gen.fillBlankNotes = gen.fillBlankNotes || [];
    gen.fillBlankNotes.push({ date: todayStr(), chapter: fval("fbCh").trim() || "第 " + (gen.chapterIndex || 1) + " 章", text: text });
    modalClose(); refresh(); toast("挖空已保存，明天可以自测");
  }
  function kyBreakdownModal() {
    modalOpen("📋 真题题型拆解", '<div class="li-sub" style="margin-bottom:10px;">按题型记录错因，精准打击弱点</div>' +
      field("真题编号", "bdYear", "text", "如 2019", "") +
      field("选择题错因", "bdChoose", "text", "如：概念混淆/计算错误", "") +
      field("名词解释默写", "bdTerm", "text", "如：基本掌握/记不全", "") +
      field("大题思路", "bdEssay", "text", "如：论述不完整，缺结论", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-breakdown">' + ICONS.check + "保存拆解</button>");
  }
  function submitKyBreakdown() {
    var gen = kyActiveScheme().gen || {};
    var year = fval("bdYear").trim();
    if (!year) { toast("请填写真题编号", true); return; }
    gen.examBreakdown = gen.examBreakdown || [];
    gen.examBreakdown.push({ date: todayStr(), year: year, choose: fval("bdChoose").trim(), term: fval("bdTerm").trim(), essay: fval("bdEssay").trim() });
    modalClose(); refresh(); toast("题型拆解已保存");
  }
  function kyOutlineModal() {
    var gen = kyActiveScheme().gen || {};
    var oc = gen.outlineCompare || {};
    var keys = Object.keys(oc);
    modalOpen("📊 大纲对比（考纲要求 vs 掌握度）",
      '<div class="li-sub" style="margin-bottom:10px;">为每个章节设定 考纲要求 与 实际掌握度（0-100%）</div>' +
      (keys.length ? '<div class="list" style="max-height:220px;overflow-y:auto;margin-bottom:10px;">' + keys.map(function (k) {
        var v = oc[k];
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(k) + "</div>" +
          '<div class="li-sub">要求 ' + v.required + "% · 掌握 " + v.mastered + "%" + (v.mastered >= v.required ? " ✓" : "") + "</div></div></div>";
      }).join("") + "</div>" : '<div class="li-sub" style="margin-bottom:10px;">暂无对比数据</div>') +
      field("章节名", "ocName", "text", "如 第 3 章 晶体结构", "") +
      field("考纲要求（%）", "ocReq", "number", "如 80", "") +
      field("实际掌握度（%）", "ocMas", "number", "如 60", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-outline">' + ICONS.check + "保存/更新</button>");
  }
  function submitKyOutline() {
    var gen = kyActiveScheme().gen || {};
    var name = fval("ocName").trim();
    if (!name) { toast("请填写章节名", true); return; }
    gen.outlineCompare = gen.outlineCompare || {};
    gen.outlineCompare[name] = { required: parseInt(fval("ocReq"), 10) || 80, mastered: parseInt(fval("ocMas"), 10) || 0 };
    modalClose(); refresh(); toast("大纲对比已保存");
  }
  function kyExamwordModal() {
    modalOpen("📚 真题生词本", '<div class="li-sub" style="margin-bottom:10px;">阅读/翻译中遇到的生词，考前集中复习</div>' +
      field("单词", "ewWord", "text", "如 comprehensive", "") +
      field("真题年份", "ewYear", "text", "如 2011", "") +
      field("所在短句", "ewSent", "text", "如 A comprehensive study shows...", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-examword">' + ICONS.check + "加入生词本</button>");
  }
  function submitKyExamword() {
    var gen = kyActiveScheme().gen || {};
    var word = fval("ewWord").trim();
    if (!word) { toast("请填写单词", true); return; }
    gen.examWords = gen.examWords || [];
    gen.examWords.push({ word: word, year: fval("ewYear").trim(), sentence: fval("ewSent").trim(), mastered: false, date: todayStr() });
    modalClose(); refresh(); toast("已加入真题生词本");
  }
  function kyOddwordModal() {
    modalOpen("🎭 熟词僻义专项", '<div class="li-sub" style="margin-bottom:10px;">考研常考熟词僻义，如 address → 处理/演讲</div>' +
      field("单词", "owWord", "text", "如 address", "") +
      field("僻义", "owMean", "text", "如 处理（v.）", "") +
      field("例句", "owEx", "text", "如 The meeting addressed the issue.", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-oddword">' + ICONS.check + "保存</button>");
  }
  function submitKyOddword() {
    var gen = kyActiveScheme().gen || {};
    var word = fval("owWord").trim();
    if (!word) { toast("请填写单词", true); return; }
    gen.oddMeanings = gen.oddMeanings || [];
    gen.oddMeanings.push({ word: word, meaning: fval("owMean").trim(), example: fval("owEx").trim(), mastered: false, date: todayStr() });
    modalClose(); refresh(); toast("已加入熟词僻义专项");
  }
  function kyReplaceModal() {
    modalOpen("🖊 写作替换词库", '<div class="li-sub" style="margin-bottom:10px;">记录作文想用的高级词汇，如 important → crucial</div>' +
      field("原词（低阶）", "rpFrom", "text", "如 important", "") +
      field("替换词（高阶）", "rpTo", "text", "如 crucial / vital", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-replace">' + ICONS.check + "保存</button>");
  }
  function submitKyReplace() {
    var gen = kyActiveScheme().gen || {};
    var from = fval("rpFrom").trim(), to = fval("rpTo").trim();
    if (!from || !to) { toast("请填写原词和替换词", true); return; }
    gen.writingReplacements = gen.writingReplacements || [];
    gen.writingReplacements.push({ from: from, to: to, mastered: false, date: todayStr() });
    modalClose(); refresh(); toast("已加入替换词库");
  }
  function kyWordAddModal() {
    modalOpen("＋ 添加生词（选类型）", '<div class="li-sub" style="margin-bottom:10px;">选择要添加的类型</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;">' +
      '<button class="btn ghost" data-action="ky-examword-modal">📚 真题生词本（单词+年份+短句）</button>' +
      '<button class="btn ghost" data-action="ky-oddword-modal">🎭 熟词僻义（单词+僻义+例句）</button>' +
      '<button class="btn ghost" data-action="ky-replace-modal">🖊 写作替换词（原词→替换词）</button></div>',
      cancelBtn() + '<button class="btn" data-action="ky-close">取消</button>');
  }
  function kyWordMaster(idx) {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var ew = gen.examWords || [], om = gen.oddMeanings || [], wr = gen.writingReplacements || [];
    var all = ew.concat(om).concat(wr);
    var x = all[idx];
    if (!x) return;
    x.mastered = !x.mastered;
    save(); refresh(); toast(x.mastered ? "标记为已掌握" : "改回待复习");
  }
  /* AI 每日简报（本地规则生成，诚实标注） */
  function kyGenBrief(sc) {
    var gen = sc.gen || {};
    var texts = [];
    var rl = gen.readingLog || [];
    if (rl.length) {
      var last = rl[rl.length - 1];
      if (last.correct < 60) texts.push("英语阅读正确率 " + last.correct + "%，建议回看「" + last.paper + "」错题，优先补 " + ((last.wrongTypes && last.wrongTypes[0]) || "细节") + " 题套路");
      else texts.push("英语阅读稳定在 " + last.correct + "%，保持节奏");
    }
    var cl = gen.carelessness || [];
    if (cl.length && cl[cl.length - 1].date === todayStr()) texts.push("昨天记了 " + cl.length + " 次粗心失误，今天做题后记得检查跳步与正负号");
    var ht = gen.hatQuestions || [];
    var wrongHat = ht.filter(function (h) { return !h.correct; });
    if (wrongHat.length) texts.push("帽子题错了 " + wrongHat.length + " 道，今日先复习「" + wrongHat[wrongHat.length - 1].q + "」");
    var fb = gen.fillBlankNotes || [];
    if (fb.length) texts.push("有 " + fb.length + " 条挖空笔记，今天挑一章默写自测");
    gen.aiBrief = { date: todayStr(), text: texts.length ? texts[0] : "昨日没有学习记录，今天从 30 分钟开始吧" };
  }
  function ensureBrief() {
    var dm = data.domains.filter(function (x) { return x.id === "kaoyan"; })[0];
    var sc = dm && dm.schemes ? (dm.schemes.list.filter(function (s) { return s.id === dm.schemes.activeId; })[0] || dm.schemes.list[0]) : null;
    if (!sc) return;
    var gen = sc.gen || {};
    if (!gen.aiBrief || gen.aiBrief.date !== todayStr()) {
      kyGenBrief(sc);
      save();
    }
  }

  /* 直接记录阅读（不经计时器） */
  function kyReadingRecordModal() {
    var papers = [];
    for (var y = 2010; y <= 2019; y++) for (var i = 1; i <= 4; i++) papers.push(y + " Text" + i);
    modalOpen("＋ 记录阅读",
      '<div class="field"><label>篇目</label><select id="kyRRPaper">' + papers.map(function (p) { return "<option>" + p + "</option>"; }).join("") + "</select></div>" +
      field("正确率（%）", "kyRRC", "number", "70", "") +
      field("用时（分钟）", "kyRRM", "number", "30", "") +
      '<div class="field"><label>错题类型（多选）</label>' +
      '<label class="checkline"><input type="checkbox" value="主旨"> 主旨</label>' +
      '<label class="checkline"><input type="checkbox" value="细节"> 细节</label>' +
      '<label class="checkline"><input type="checkbox" value="推理"> 推理</label>' +
      '<label class="checkline"><input type="checkbox" value="词汇"> 词汇</label></div>' +
      '<div class="field"><label>定位句分析（错因）</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc2" value="没看懂句子"> 没看懂句子</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc2" value="逻辑替换没识别"> 逻辑替换没识别</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc2" value="两者都有"> 两者都有</label>' +
      '<label class="checkline"><input type="radio" name="kyLoc2" value="没有错题"> 没有错题</label></div>' +
      '<div class="li-sub">正确率 ≥60% 得 1 颗 ⭐</div>',
      cancelBtn() + '<button class="btn" data-action="submit-ky-reading-record">' + ICONS.check + "保存记录</button>");
  }
  function submitKyReadingRecord() {
    var sc = kyActiveScheme(); var gen = sc.gen || {};
    var correct = parseInt(fval("kyRRC"), 10) || 0;
    var wrongTypes = [];
    var cbs = document.querySelectorAll('#modalBody input[type="checkbox"]:checked');
    for (var i = 0; i < cbs.length; i++) wrongTypes.push(cbs[i].value);
    var loc = document.querySelector('input[name="kyLoc2"]:checked');
    gen.readingLog = gen.readingLog || [];
    gen.readingLog.push({ date: todayStr(), paper: fval("kyRRPaper") || "2010 Text1", correct: correct, wrongTypes: wrongTypes, locate: loc ? loc.value : "", minutes: parseInt(fval("kyRRM"), 10) || 30 });
    gen.stars = (gen.stars || 0) + (correct >= 60 ? 1 : 0);
    kyMarkDone(sc, "english");
    modalClose(); refresh();
    toast(correct >= 60 ? "已记录，正确率 " + correct + "% +1 ⭐" : "已记录（正确率 <60%，未得星）");
  }
  /* 素材自定义（用户自己上传/添加） */
  function kyPointAddModal() {
    modalOpen("＋ 添加自定义知识点", '<div class="li-sub" style="margin-bottom:10px;">添加你自己的知识点（按科目）</div>' +
      selField("科目", "cpCat", [["马原", "马原"], ["毛中特", "毛中特"], ["史纲", "史纲"], ["思修", "思修"], ["其他", "其他"]], "其他") +
      area("知识点内容", "cpText", "每条一行，如：\n实践是认识的来源\n矛盾分析法：…"),
      cancelBtn() + '<button class="btn" data-action="submit-ky-point">' + ICONS.check + "保存</button>");
  }
  function submitKyPoint() {
    var gen = kyActiveScheme().gen || {};
    var text = fval("cpText").trim();
    if (!text) { toast("请填写知识点内容", true); return; }
    gen.customPoints = gen.customPoints || {};
    var cat = fval("cpCat");
    gen.customPoints[cat] = gen.customPoints[cat] || [];
    text.split(/\r?\n/).forEach(function (l) { if (l.trim()) gen.customPoints[cat].push(l.trim()); });
    modalClose(); refresh(); toast("自定义知识点已保存");
  }
  function kyFormulaAddModal() {
    modalOpen("＋ 添加自定义公式", '<div class="li-sub" style="margin-bottom:10px;">添加你自己的公式/结论</div>' +
      field("分类", "cfCat", "text", "如 高数·极限 / 线代·矩阵", "") +
      area("公式内容", "cfText", "每条一行，如：\nlim(x→0) sinx/x = 1", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-formula">' + ICONS.check + "保存</button>");
  }
  function submitKyFormula() {
    var gen = kyActiveScheme().gen || {};
    var cat = fval("cfCat").trim();
    var text = fval("cfText").trim();
    if (!cat || !text) { toast("请填写分类和内容", true); return; }
    gen.customFormulas = gen.customFormulas || {};
    gen.customFormulas[cat] = gen.customFormulas[cat] || [];
    text.split(/\r?\n/).forEach(function (l) { if (l.trim()) gen.customFormulas[cat].push(l.trim()); });
    modalClose(); refresh(); toast("自定义公式已保存");
  }
  function kyHatAddModal() {
    modalOpen("＋ 添加自定义帽子题", '<div class="li-sub" style="margin-bottom:10px;">添加你自己的对应关系题</div>' +
      field("题目", "chQ", "text", "如 新时代的社会主要矛盾是（ ）", "") +
      field("答案", "chA", "text", "如 人民日益增长的美好生活需要和不平衡不充分的发展之间的矛盾", ""),
      cancelBtn() + '<button class="btn" data-action="submit-ky-hat">' + ICONS.check + "保存</button>");
  }
  function submitKyHat() {
    var gen = kyActiveScheme().gen || {};
    var q = fval("chQ").trim(), a = fval("chA").trim();
    if (!q || !a) { toast("请填写题目和答案", true); return; }
    gen.customHats = gen.customHats || [];
    gen.customHats.push({ q: q, a: a });
    modalClose(); refresh(); toast("自定义帽子题已保存");
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
  function callAI(messages, cb) {
    var s = data.settings;
    if (!s.apiKey || !s.apiBase) { cb("对话式 AI 未启用：请先在「设置与数据 → AI 配置」填入 API 地址、模型和密钥。"); return; }
    var url = String(s.apiBase).replace(/\/+$/, "") + "/chat/completions";
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + s.apiKey },
      body: JSON.stringify({ model: s.apiModel || "deepseek-chat", messages: messages, temperature: 0.6 })
    }).then(function (r) { return r.json(); }).then(function (j) {
      var reply = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      cb(reply || "AI 返回了空结果，可能密钥或地址配置有误。");
    }).catch(function () {
      cb("请求失败：网络不通或 API 地址错误。请检查配置后重试。");
    });
  }
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
    callAI(W.ui.aiChat.concat([{ role: "user", content: text }]), function (reply) {
      chat.removeChild(chat.lastChild);
      W.ui.aiChat.push({ role: "user", content: text });
      W.ui.aiChat.push({ role: "assistant", content: reply });
      var idx = W.ui.aiChat.length - 1;
      chat.appendChild(mk("bot", reply, idx));
      if (W.ui.aiChat.length > 20) W.ui.aiChat = W.ui.aiChat.slice(-20);
      chat.scrollTop = chat.scrollHeight;
    });
  }
  /* AI 英语专区功能 */
  function aiEssay() {
    var txt = fval("aiEssay").trim();
    if (!txt) { toast("请先粘贴作文", true); return; }
    var box = $id("essayResult");
    var m = document.createElement("div");
    m.className = "msg bot";
    m.textContent = "批改中…";
    box.appendChild(m);
    callAI([
      { role: "system", content: "你是英语作文批改老师。请用中文回复，给出：1. 总体评价（2-3句）2. 评分（满分100）3. 3-5条具体修改建议 4. 润色后的完整版本。" },
      { role: "user", content: txt }
    ], function (reply) {
      box.innerHTML = "";
      var d = document.createElement("div");
      d.className = "msg bot";
      d.style.whiteSpace = "pre-wrap";
      d.textContent = reply;
      box.appendChild(d);
      var bar = document.createElement("div");
      bar.style.cssText = "margin-top:8px;";
      bar.innerHTML = '<button class="btn small plain" data-action="ai-save-qa" data-txt="' + esc(reply.slice(0, 120)) + '">' + ICONS.folder + "保存批改到答疑库</button>";
      box.appendChild(bar);
    });
  }
  function aiSpeak() {
    var txt = fval("speakInput").trim();
    if (!txt) { return; }
    var box = $id("speakChat");
    var mk = function (cls, t) {
      var d = document.createElement("div");
      d.className = "msg " + cls;
      d.textContent = t;
      box.appendChild(d);
      box.scrollTop = box.scrollHeight;
    };
    mk("user", txt);
    $id("speakInput").value = "";
    W.ui.speakChat = W.ui.speakChat || [];
    W.ui.speakChat.push({ role: "user", content: txt });
    callAI([{ role: "system", content: "你是英语口语陪练。请用英文与你对话，句子简短自然；每次对话后用简短中文指出 1-2 处表达可以改进的地方。" }].concat(W.ui.speakChat.slice(-10)), function (reply) {
      mk("bot", reply);
      W.ui.speakChat.push({ role: "assistant", content: reply });
    });
  }
  function aiTranslate() {
    var txt = fval("trText").trim();
    if (!txt) { toast("请输入要翻译的文本", true); return; }
    var box = $id("trResult");
    box.innerHTML = '<div class="msg bot">翻译中…</div>';
    callAI([
      { role: "system", content: "你是专业翻译。根据源语言自动判断，提供准确自然的中英互译。回复格式：译文（另起一行）+ 关键句式解析 1-2 条。" },
      { role: "user", content: txt }
    ], function (reply) {
      box.innerHTML = "";
      var d = document.createElement("div");
      d.className = "msg bot";
      d.style.whiteSpace = "pre-wrap";
      d.textContent = reply;
      box.appendChild(d);
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
  /* AI 接管：意图识别 + 字段提取（本地规则，不耗 API） */
  function aiStoreSuggest(question, reply) {
    var t = (question || "") + " " + (reply || "");
    var subject = "数学";
    if (/英语|单词|作文|阅读|翻译|听力|语法|四六|考研英语|长难句/.test(t)) subject = "英语";
    else if (/政治|马原|毛中特|史纲|思修|时政|帽子题/.test(t)) subject = "政治";
    else if (/材料|晶体|相图|专业课|物理化学|金属学|热处理/.test(t)) subject = "专业课";
    var type = "";
    var typeMap = [["洛必达", "洛必达法则"], ["泰勒", "泰勒公式"], ["极限", "极限计算"], ["导数", "导数"], ["积分", "积分"], ["矩阵", "矩阵"], ["概率", "概率"], ["定语从句", "定语从句"], ["虚拟语气", "虚拟语气"], ["长难句", "长难句"]];
    for (var i = 0; i < typeMap.length; i++) if (t.indexOf(typeMap[i][0]) >= 0) { type = typeMap[i][1]; break; }
    var target = "qa";
    if (/错|错了|不会做|算错|求导错|做错|算不出来|卡住了/.test(t)) target = "mistakes";
    else if (/收藏|备忘|先记|链接|保存起来|待办/.test(t)) target = "inbox";
    else if (/资料|文档|整理成|笔记内容/.test(t)) target = "resource";
    return { target: target, subject: subject, type: type };
  }
  function aiSaveModal(idx) {
    var m = W.ui.aiChat[idx];
    if (!m || m.role !== "assistant") return;
    var content = m.content;
    var question = "";
    for (var i = idx - 1; i >= 0; i--) { if (W.ui.aiChat[i].role === "user") { question = W.ui.aiChat[i].content; break; } }
    var sug = aiStoreSuggest(question, content);
    var subj = sug.subject;
    var cetDm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var hasWordbook = !!cetDm;
    var typeOpts = '<option value="mistake">错题本（自动归类）</option>' +
      '<option value="qa">答疑记录（问题+解答）</option>' +
      '<option value="task">今日任务（AI 建议要做的事）</option>' +
      '<option value="review">复盘记录（AI 帮做的复盘）</option>' +
      '<option value="calendar">日历事件（AI 安排的日程）</option>' +
      '<option value="inbox">收集箱（先收着）</option>' +
      '<option value="resource">学习资料（存入资料库）</option>' +
      (hasWordbook ? '<option value="word">生词（存入英语生词本）</option>' : "");
    var sugTip = sug.target === "mistakes" ? "🤖 识别为一道错题，将自动填入科目/类型/题目/解法" :
      sug.target === "inbox" ? "🤖 识别为待整理内容，适合先收进收集箱" :
      sug.target === "resource" ? "🤖 识别为学习资料，适合存入资料库" :
      "🤖 识别为答疑记录，适合存进答疑库";
    modalOpen("保存到工作台（AI 接管）",
      '<div class="ai-banner" style="margin-bottom:10px;">' + ICONS.spark + esc(sugTip) + "</div>" +
      '<div class="field"><label>保存为（可改）</label><select id="asType">' + typeOpts + "</select></div>" +
      '<div class="field"><label>科目 / 分类（已自动推荐，可修改）</label><input id="asSubject" value="' + esc(subj) + '"></div>' +
      '<div id="asMistakeWrap">' +
      '<div class="field"><label>专题（如 高数·极限）</label><input id="asTopic" placeholder="可留空" value=""></div>' +
      '<div class="field"><label>类型 / 考点（已自动识别）</label><input id="asTypeField" value="' + esc(sug.type) + '" placeholder="如 洛必达法则"></div>' +
      '<div class="field"><label>题目</label><input id="asTitle" value="' + esc((question || content).slice(0, 60)) + '"></div>' +
      '<div class="field"><label>正确解法（AI 回复自动带入）</label><textarea id="asSolution" style="min-height:80px;width:100%;box-sizing:border-box;">' + esc(content.slice(0, 400)) + "</textarea></div>" +
      "</div>" +
      '<div class="field" id="asCatWrap" style="display:none;"><label>资料分类</label><select id="asCat">' +
      '<option value="考研">考研</option><option value="课程">课程</option><option value="课外">课外</option><option value="其他">其他</option></select></div>' +
      '<div class="field" id="asCalWrap" style="display:none;"><label>日期（日历事件）</label><input id="asCalDate" value="' + todayStr() + '" placeholder="年-月-日">' +
      '<div class="li-sub" style="margin-top:4px;">AI 安排的日程存到日历，可改日期。</div></div>' +
      '<div class="field"><label>备注（可选）</label><input id="asNote" placeholder="来源：AI 对话"></div>',
      cancelBtn() + '<button class="btn" data-action="submit-ai-save" data-id="' + idx + '">' + ICONS.check + "确认存入</button>");
    var typeSel = $id("asType");
    typeSel.addEventListener("change", function () {
      var v = typeSel.value;
      $id("asMistakeWrap").style.display = v === "mistake" ? "" : "none";
      $id("asCatWrap").style.display = v === "resource" ? "" : "none";
      $id("asCalWrap").style.display = v === "calendar" ? "" : "none";
    });
  }
  function submitAiSave(idx) {
    var m = W.ui.aiChat[idx];
    if (!m) return;
    var type = fval("asType");
    var subject = fval("asSubject").trim() || "未分类";
    var note = fval("asNote").trim() || "来源：AI 对话";
    if (type === "mistake") {
      data.mistakes.push({
        id: uid(), subject: fval("asSubject").trim() || "未分类",
        topic: fval("asTopic").trim(), type: fval("asTypeField").trim(),
        title: fval("asTitle").trim() || "AI 错题", cause: "概念不清",
        solution: fval("asSolution").trim(), source: "AI 对话", aiMarked: true,
        reviewed: false, reason: "概念不清", answer: fval("asSolution").trim(),
        reviewCount: 0, nextReview: todayStr(), mastered: false, date: todayStr()
      });
      toast("已存入错题本（按科目/专题/类型自动归类）");
    } else if (type === "inbox") {
      data.inbox.push({ id: uid(), content: m.content, status: "待分拣", date: todayStr(), source: "AI 对话", suggestion: "来源：AI 对话" });
      toast("已存入收集箱（待分拣）");
    } else if (type === "task") {
      data.tasks.push({ id: uid(), title: m.content.slice(0, 50), domainId: data.settings.primaryDomain || "kaoyan", date: todayStr(), due: "", done: false, note: "AI 生成", createdAt: nowStr() });
      toast("已存入今日任务");
    } else if (type === "review") {
      data.reviews.push({ id: uid(), date: todayStr(), type: "daily", done: m.content.slice(0, 200), undone: "", adjust: "（AI 生成）" });
      toast("已存入今日复盘");
    } else if (type === "calendar") {
      var cdate = fval("asCalDate").trim() || todayStr();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cdate)) { toast("日期格式应为 年-月-日", true); return; }
      data.calendar.push({ id: uid(), date: cdate, title: m.content.slice(0, 30), type: "其他", note: m.content.slice(0, 100), source: "AI 对话" });
      toast("已存入日历");
    } else if (type === "qa") {
      data.qa.push({ id: uid(), subject: subject, question: "AI 解答（" + subject + "）", answer: m.content, date: todayStr(), status: "待解决", starred: false, mastered: false, source: "AI 对话", tags: "", aiMarked: true });
      toast("已存入答疑库（标记为 AI 回答）");
    } else if (type === "resource") {
      data.resources.push({ id: uid(), title: m.content.slice(0, 40), category: fval("asCat"), tags: [subject], url: "", platform: "", extractCode: "", status: "未看", domainId: "", note: m.content, createdAt: nowStr(), updatedAt: nowStr() });
      toast("已存入资料库");
    } else if (type === "word") {
      var cetDm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
      var cetEx = cetDm && cetDm.exams && cetDm.exams[cetDm.activeExam];
      if (cetEx) {
        cetEx.wordbook = cetEx.wordbook || [];
        cetEx.wordbook.push({ id: uid(), word: m.content.split(/[\s，。,.；;]/)[0].slice(0, 30), meaning: m.content.slice(0, 60), note: note, mastered: false, date: todayStr() });
        toast("已存入「" + cetDm.activeExam + "」生词本");
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
      case "go-view": go(view); break;
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
      case "open-course-detail": courseDetailModal(id, domain); break;
      case "edit-course-note": courseNoteModal(id, domain); break;
      case "submit-course-note": submitCourseNote(id, domain); break;
      case "edit-course-url": courseUrlModal(id, domain); break;
      case "submit-course-url": submitCourseUrl(id, domain); break;
      case "pick-course-photo": { var pfi = $id("coursePhotoInput"); if (pfi) pfi.click(); break; }
      case "view-course-photo": coursePhotoView(id, domain, parseInt(el ? el.getAttribute("data-idx") : "0", 10)); break;
      case "del-course-photo": {
        var pdm = data.domains.filter(function (x) { return x.id === domain; })[0];
        var pc = pdm && (pdm.courses || []).filter(function (x) { return x.id === id; })[0];
        var idx = parseInt(el ? el.getAttribute("data-idx") : "-1", 10);
        if (pc && (pc.photos || []).length > idx && idx >= 0) {
          pc.photos.splice(idx, 1);
          save(); toast("照片已删除"); courseDetailModal(id, domain);
        }
        break;
      }
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
        var tr = data.mistakes.filter(function (x) { return x.id === id; })[0];
        if (tr) { tr.reviewed = !tr.reviewed; if (tr.reviewed) { tr.reviewCount = (tr.reviewCount || 0) + 1; tr.nextReview = mkNextReview(tr.reviewCount); } else { tr.nextReview = todayStr(); } save(); renderView(); }
        break;
      }
      case "mistake-review": mistakeReviewModal(id); break;
      case "mistake-review-ok": mistakeReviewOk(id); break;
      case "mistake-review-no": mistakeReviewNo(id); break;
      case "toggle-master": {
        var tm = data.mistakes.filter(function (x) { return x.id === id; })[0];
        if (tm) { tm.mastered = !tm.mastered; save(); renderView(); toast(tm.mastered ? "已标记掌握，移出复习队列" : "改回待复习"); }
        break;
      }
      case "mistake-subj": W.ui.mistakeSubj = v; W.ui.mistakeTopic = ""; W.ui.mistakeType = ""; go("mk-topics"); break;
      case "mk-topic": W.ui.mistakeTopic = v; W.ui.mistakeType = ""; go("mk-types"); break;
      case "mk-type": W.ui.mistakeType = v; go("mk-list"); break;
      case "mistake-state": W.ui.mistakeState = v; renderView(); break;
      case "mistake-cause": W.ui.mistakeCause = v; renderView(); break;

      /* 答疑 */
      case "add-qa": qaModal(null); break;
      case "edit-qa": qaModal(id); break;
      case "del-qa": {
        var qa1 = data.qa.filter(function (x) { return x.id === id; })[0];
        if (qa1) {
          data.qa = data.qa.filter(function (x) { return x.id !== id; });
          data.deleted.push({ id: id, kind: "答疑", title: qa1.question, deletedAt: nowStr() });
          save(); refresh(); toast("答疑已删除，可在回收站恢复");
        }
        break;
      }
      case "toggle-qa-star": {
        var qs = data.qa.filter(function (x) { return x.id === id; })[0];
        if (qs) { qs.starred = !qs.starred; save(); renderView(); toast(qs.starred ? "已收藏（考前必看）" : "已取消收藏"); }
        break;
      }
      case "toggle-qa-status": {
        var qt = data.qa.filter(function (x) { return x.id === id; })[0];
        if (qt) { qt.status = qt.status === "已解决" ? "待解决" : "已解决"; save(); renderView(); }
        break;
      }
      case "toggle-qa-master": {
        var qm = data.qa.filter(function (x) { return x.id === id; })[0];
        if (qm) { qm.mastered = !qm.mastered; save(); renderView(); }
        break;
      }
      case "qa-subj": W.ui.qaSubj = v; renderView(); break;
      case "qa-status": W.ui.qaStatus = v; renderView(); break;

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
      case "set-font": {
        data.settings.fontSize = v;
        applyFont();
        refresh();
        toast("字体大小已调整");
        break;
      }
      case "set-exam": {
        var examName = v || el.getAttribute("data-exam");
        var cdm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
        if (cdm && cdm.exams && examName && cdm.exams[examName] && !cdm.exams[examName].archived) {
          cdm.activeExam = examName;
          refresh();
          toast("已切换为" + examName + "（各考试进度与生词本相互独立）");
        }
        break;
      }
      case "set-exam-date": {
        var exName = el.getAttribute("data-exam");
        if (exName) {
          var cdm2 = data.domains.filter(function (x) { return x.id === "cet"; })[0];
          if (cdm2 && cdm2.exams && cdm2.exams[exName]) cdm2.activeExam = exName;
        }
        setExamDateModal();
        break;
      }
      case "export-words": exportWords(); break;
      case "import-words": importWordsModal(); break;
      case "submit-import-words": submitImportWords(); break;
      case "import-words-ok": importWordsOk(); break;

      /* AI */
      case "ai-send": {
        var txt = (fval("aiInput") || "").trim();
        if (txt) { aiSend(txt); $id("aiInput").value = ""; }
        break;
      }
      case "ai-save": aiSaveModal(parseInt(id, 10)); break;
      case "submit-ai-save": submitAiSave(parseInt(id, 10)); break;
      case "ai-essay": aiEssay(); break;
      case "ai-speak": aiSpeak(); break;
      case "ai-translate": aiTranslate(); break;
      case "ai-save-qa": {
        var txt = el.getAttribute("data-txt");
        if (txt) {
          data.qa.push({ id: uid(), subject: "英语", question: "AI 作文批改", answer: txt, date: todayStr() });
          refresh();
          toast("已存入答疑库");
        }
        break;
      }
      /* AI 学习 */
      case "gen-ai-today": genAiToday(); break;
      case "ai-note-save": aiNoteSave(); break;
      case "ai-done": aiDone(); break;
      case "ai-append-note": aiAppendNoteModal(); break;
      case "submit-ai-append": submitAiAppend(); break;
      case "ai-hist-edit": aiHistEditModal(id); break;
      case "submit-ai-hist-edit": submitAiHistEdit(id); break;

      /* 英语考试管理 */
      case "add-exam": addExamModal(); break;
      case "submit-exam": submitExam(); break;
      case "set-exam-date": setExamDateModal(); break;
      case "submit-exam-date": submitExamDate(); break;
      case "reset-exam-date": resetExamDate(); break;
      case "archive-exam": archiveExam(v); break;
      case "restore-exam": restoreExam(v); break;
      case "del-exam": delExamConfirm(v); break;
      case "del-exam-ok": delExamOk(); break;

      /* 模态提交 */

      /* 考研方案 */
      case "ky-scheme-create": kySchemeCreateModal(); break;
      case "submit-ky-scheme": submitKyScheme(); break;
      case "ky-scheme-switch": kySchemeSwitchModal(); break;
      case "ky-scheme-select": kySchemeSelect(v); break;
      case "ky-scheme-archive": kySchemeArchive(v); break;
      case "ky-scheme-restore": kySchemeRestore(v); break;
      case "ky-scheme-delete": kySchemeDeleteConfirm(v); break;
      case "ky-scheme-delete-ok": kySchemeDeleteOk(); break;
      case "ky-set-date": kySetDateModal(); break;
      case "submit-ky-date": submitKyDate(); break;
      case "reset-ky-date": resetKyDate(); break;
      case "ky-stage-switch": kyStageSwitchModal(); break;
      case "submit-ky-stage": submitKyStage(); break;
      case "ky-import-template": kyImportTemplateConfirm(); break;
      case "ky-import-template-ok": kyImportTemplateOk(); break;
      /* 考研任务 */
      case "ky-task-add": kyTaskAddModal(el ? el.getAttribute("data-type") : ""); break;
      case "submit-ky-task": submitKyTask(); break;
      case "ky-task-toggle": kyTaskToggle(id); break;
      case "submit-ky-task-cost": submitKyTaskCost(); break;
      case "ky-task-edit": kyTaskEditModal(id); break;
      case "ky-task-del": kyTaskDel(id); break;
      case "ky-batch-done": kyBatchDone(); break;
      case "ky-batch-done-ok": kyBatchDoneOk(); break;
      case "ky-batch-del": kyBatchDel(); break;
      case "ky-batch-del-ok": kyBatchDelOk(); break;
      case "ky-weekly-gen": kyWeeklyGen(); break;
      /* 考研科目 */
      case "ky-subject-add": kySubjectAddModal(); break;
      case "submit-ky-subject": submitKySubject(); break;
      case "ky-subject-del": kySubjectDelConfirm(v); break;
      case "ky-subject-del-ok": kySubjectDelOk(); break;
      /* 考研资料 */
      case "ky-file-add": kyFileAddModal(); break;
      case "submit-ky-file": submitKyFile(); break;
      case "ky-file-del": kyFileDel(id); break;
      case "ky-export-report": kyExportReport(); break;
      /* 今日行动链路 */
      case "ky-start-english": kyStartEnglish(); break;
      case "ky-paper-ok": kyPaperOk(); break;
      case "ky-timer-stop": kyTimerStopAction(); break;
      case "ky-reading-save": kyReadingSaveOk(); break;
      case "ky-start-math": kyStartMath(); break;
      case "ky-math-go": kyMathGo(); break;
      case "ky-start-politics": kyStartPolitics(); break;
      case "ky-politics-done": kyPoliticsDone(); break;
      case "ky-start-major": kyStartMajor(); break;
      case "ky-major-save": kyMajorSave(); break;
      case "ky-start-word": kyStartWord(); break;
      case "ky-word-toggle": kyWordToggle(parseInt(el ? el.getAttribute("data-idx") : "", 10)); break;
      case "ky-word-done": kyWordDone(); break;
      case "ky-review-today": kyReviewToday(); break;
      case "ky-review-save": kyReviewSave(); break;
      case "ky-goal-modal": kyGoalModal(); break;
      case "submit-ky-goal": submitKyGoal(); break;
      /* 学科工具 */
      case "ky-formula-modal": kyFormulaModal(); break;
      case "ky-paper-modal": kyPaperModal(); break;
      case "submit-ky-paper": submitKyPaper(); break;
      case "ky-careless-modal": kyCarelessModal(); break;
      case "submit-ky-careless": submitKyCareless(); break;
      case "ky-sentence-modal": kySentenceModal(); break;
      case "ky-sentence-ans": kySentenceAns(parseInt(el.getAttribute("data-idx"), 10)); break;
      case "ky-sentence-done": kySentenceDone(); break;
      case "ky-essay-modal": kyEssayModal(); break;
      case "ky-essay-note": kyEssayNoteModal(); break;
      case "submit-ky-essay-note": submitKyEssayNote(); break;
      case "ky-trans-modal": kyTransModal(); break;
      case "submit-ky-trans": submitKyTrans(); break;
      case "ky-points-modal": kyPointsModal(); break;
      case "ky-hat-modal": kyHatModal(); break;
      case "ky-hat-ok": kyHatRecord(parseInt(el.getAttribute("data-idx"), 10), true); break;
      case "ky-hat-no": kyHatRecord(parseInt(el.getAttribute("data-idx"), 10), false); break;
      case "ky-frame-modal": kyFrameModal(); break;
      case "ky-affair-modal": kyAffairModal(); break;
      case "submit-ky-affair": submitKyAffair(); break;
      case "ky-notes-modal": kyNotesModal(); break;
      case "ky-fill-modal": kyFillModal(); break;
      case "submit-ky-fill": submitKyFill(); break;
      case "ky-breakdown-modal": kyBreakdownModal(); break;
      case "submit-ky-breakdown": submitKyBreakdown(); break;
      case "ky-outline-modal": kyOutlineModal(); break;
      case "submit-ky-outline": submitKyOutline(); break;
      case "ky-examword-modal": kyExamwordModal(); break;
      case "submit-ky-examword": submitKyExamword(); break;
      case "ky-oddword-modal": kyOddwordModal(); break;
      case "submit-ky-oddword": submitKyOddword(); break;
      case "ky-replace-modal": kyReplaceModal(); break;
      case "submit-ky-replace": submitKyReplace(); break;
      case "ky-word-add": kyWordAddModal(); break;
      case "ky-word-master": kyWordMaster(parseInt(el.getAttribute("data-idx"), 10)); break;
      case "ky-reading-record": kyReadingRecordModal(); break;
      case "submit-ky-reading-record": submitKyReadingRecord(); break;
      case "ky-point-add": kyPointAddModal(); break;
      case "submit-ky-point": submitKyPoint(); break;
      case "ky-formula-add": kyFormulaAddModal(); break;
      case "submit-ky-formula": submitKyFormula(); break;
      case "ky-hat-add": kyHatAddModal(); break;
      case "submit-ky-hat": submitKyHat(); break;

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
      if (e.target && e.target.id === "speakInput") {
        var st = e.target.value.trim();
        if (st) { aiSpeak(); }
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
    var domOpts = data.domains.filter(function (x) { return !x.hidden; }).map(function (x) { return [x.id, x.name]; });
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
    var domOpts = data.domains.filter(function (x) { return !x.hidden; }).map(function (x) { return [x.id, x.name]; });
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
    var domOpts = data.domains.filter(function (x) { return !x.hidden; }).map(function (x) { return [x.id, x.name]; });
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
      var domOpts = data.domains.filter(function (x) { return !x.hidden; }).map(function (x) { return [x.id, x.name]; });
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
      if (dm.type === "english" && dm.exams) {
        var ex = dm.exams[dm.activeExam];
        if (ex && ex.subjects && ex.subjects[sid]) s = { name: sid, progress: ex.subjects[sid].progress, note: ex.subjects[sid].note };
      } else {
        (dm.subjects || []).forEach(function (x) { if (x.id === sid || x.name === sid) s = x; });
        if (!s && dm.subGroups) dm.subGroups.forEach(function (sg) { (sg.subjects || []).forEach(function (x) { if (x.id === sid) s = x; }); });
      }
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
      if (dm.type === "english" && dm.exams) {
        var ex = dm.exams[dm.activeExam];
        if (ex && ex.subjects && ex.subjects[sid]) s = ex.subjects[sid];
      } else {
        (dm.subjects || []).forEach(function (x) { if (x.id === sid || x.name === sid) s = x; });
        if (!s && dm.subGroups) dm.subGroups.forEach(function (sg) { (sg.subjects || []).forEach(function (x) { if (x.id === sid) s = x; }); });
      }
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

  function punchSubjects(dm) {
    if (!dm) return [];
    if (dm.type === "kaoyan") {
      var kySc = dm.schemes ? (dm.schemes.list.filter(function (s) { return s.id === dm.schemes.activeId; })[0] || dm.schemes.list[0]) : null;
      return (kySc && kySc.subjects ? kySc.subjects : []).map(function (x) { return x.name; });
    }
    if (dm.type === "english") {
      var ex = dm.exams && dm.exams[dm.activeExam];
      return ex && ex.subjects ? Object.keys(ex.subjects) : [];
    }
    if (dm.type === "ailearn") return ["AI 学习"];
    return ["通用"];
  }
  function punchModal(did) {
    var dm = did ? data.domains.filter(function (x) { return x.id === did; })[0] : null;
    var doms = data.domains.filter(function (x) { return !x.hidden && punchSubjects(x).length > 0; });
    if (doms.length === 0) { toast("没有可打卡的领域", true); return; }
    var sel = dm && punchSubjects(dm).length ? dm : doms[0];
    modalOpen("打卡学习", "记录今天学了什么、学了多久。" +
      selField("领域", "pDomain", data.domains.map(function (x) { return [x.id, x.name]; }), sel.id) +
      '<div class="field"><label>科目</label><select id="pSubject"></select></div>' +
      field("时长（分钟）", "pMin", "number", "60", "60"),
      cancelBtn() + okBtn("submit-punch", "打卡"));
    var pd = $id("pDomain");
    var ps = $id("pSubject");
    function fill() {
      var dm2 = data.domains.filter(function (x) { return x.id === pd.value; })[0];
      ps.innerHTML = punchSubjects(dm2).map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + "</option>"; }).join("");
    }
    fill();
    pd.addEventListener("change", fill);
  }
  function submitPunch(did) {
    var min = parseInt(fval("pMin"), 10) || 0;
    if (min <= 0) { toast("请填写有效时长", true); return; }
    var todayLogs = (data.studyLog || []).filter(function (x) { return x.date === todayStr(); });
    var isFirstToday = todayLogs.length === 0;
    var pDomain = fval("pDomain");
    var pSubject = fval("pSubject");
    data.studyLog.push({ date: todayStr(), domainId: pDomain, subject: pSubject, minutes: min, ts: nowStr().slice(11) });
    /* 半自动累加进度：英语学习打卡时，对应考试下该科目进度 +1（封顶 100） */
    if (pDomain === "cet") {
      var cdm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
      if (cdm && cdm.exams && cdm.exams[cdm.activeExam] && cdm.exams[cdm.activeExam].subjects && cdm.exams[cdm.activeExam].subjects[pSubject]) {
        var sub = cdm.exams[cdm.activeExam].subjects[pSubject];
        sub.progress = Math.min(100, (sub.progress || 0) + 1);
      }
    }
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
  function activeExamObj() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    return (dm && dm.exams && dm.exams[dm.activeExam]) || null;
  }
  function submitWord(did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var word = fval("wdWord").trim();
    if (!word) { toast("请填写单词", true); return; }
    var ex = dm.exams && dm.exams[dm.activeExam];
    ex.wordbook = ex.wordbook || [];
    ex.wordbook.push({ id: uid(), word: word, meaning: fval("wdMeaning").trim(), note: fval("wdNote").trim(), mastered: false, date: todayStr() });
    modalClose(); refresh(); toast("生词已加入「" + dm.activeExam + "」生词本");
  }
  function toggleWord(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    var w = ex && (ex.wordbook || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    w.mastered = !w.mastered;
    refresh();
    toast(w.mastered ? "已标记掌握，记得隔几天复习一次" : "已恢复为待复习");
  }
  function delWord(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    var w = ex && (ex.wordbook || []).filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    ex.wordbook = ex.wordbook.filter(function (x) { return x.id !== id; });
    data.deleted.push({ id: id, kind: "生词", title: w.word, deletedAt: nowStr() });
    refresh(); toast("生词已删除，可在回收站恢复");
  }
  function exportWords() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    var wb = (ex && ex.wordbook) || [];
    if (wb.length === 0) { toast("当前考试生词本是空的", true); return; }
    var lines = ["单词\t释义\t状态\t日期"];
    wb.forEach(function (w) { lines.push([w.word, (w.meaning || "").replace(/\t/g, " "), w.mastered ? "已掌握" : "待复习", w.date || ""].join("\t")); });
    var blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "生词本-" + dm.activeExam + "-" + todayStr() + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast("已导出「" + dm.activeExam + "」生词本");
  }
  /* 批量导入生词（支持"单词 释义"每行一个，缺释义自动查内置词库，去重） */
  function importWordsModal() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    modalOpen("批量导入生词", '<div class="li-sub" style="margin-bottom:10px;">导入到「<b>' + esc(dm.activeExam) + "</b>」生词本。每行一个单词，格式：<b>单词 释义</b>（释义可选，缺省自动从内置词库补充；已有单词自动跳过）。</div>" +
      '<textarea id="iwText" placeholder="abandon&#10;abandoned 被抛弃的&#10;abide 遵守" style="min-height:150px;width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--border);border-radius:8px;font-size:14px;"></textarea>',
      cancelBtn() + '<button class="btn" data-action="submit-import-words">' + ICONS.check + "预览并导入</button>");
  }
  function submitImportWords() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    if (!ex) return;
    ex.wordbook = ex.wordbook || [];
    var raw = fval("iwText") || "";
    var lines = raw.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    var dict = {};
    var parsed = [], skipped = 0;
    lines.forEach(function (line) {
      line = line.trim();
      if (!line) return;
      var parts = line.split(/\s{2,}|[\t,，;；]/).map(function (p) { return p.trim(); }).filter(Boolean);
      var word, meaning;
      if (parts.length >= 2) { word = parts[0]; meaning = parts.slice(1).join(" "); }
      else {
        var sp = line.indexOf(" ");
        if (sp > 0) { word = line.slice(0, sp); meaning = line.slice(sp + 1).trim(); }
        else { word = line; meaning = ""; }
      }
      word = String(word).toLowerCase();
      if (!word || word.length > 40) return;
      if (ex.wordbook.some(function (w) { return String(w.word).toLowerCase() === word; })) { skipped++; return; }
      var m2 = meaning || (dict[word] ? dict[word].t : "") || "";
      parsed.push({ word: word, meaning: m2 });
    });
    if (!parsed.length) { modalClose(); toast(skipped ? "全部已存在（跳过 " + skipped + " 个）" : "没有可导入的单词", true); return; }
    window.__importWords = parsed;
    modalOpen("确认导入",
      '将导入 <b>' + parsed.length + "</b> 个新单词到「" + esc(dm.activeExam) + "」生词本" + (skipped ? "（跳过已存在 " + skipped + " 个）" : "") + "。缺释义的已自动从内置词库补充。" +
      '<div class="list" style="max-height:200px;overflow-y:auto;margin-top:10px;">' + parsed.slice(0, 8).map(function (w) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;font-size:14px;">' + esc(w.word) + "</div>" +
          '<div class="li-sub">' + esc((w.meaning || "无释义").slice(0, 40)) + "</div></div></div>";
      }).join("") + (parsed.length > 8 ? '<div class="li-sub" style="padding:6px 0;">…共 ' + parsed.length + " 个</div>" : "") + "</div>",
      cancelBtn() + '<button class="btn" data-action="import-words-ok">' + ICONS.check + "确认导入</button>");
  }
  function importWordsOk() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    if (!ex) return;
    (window.__importWords || []).forEach(function (w) {
      ex.wordbook.push({ id: uid(), word: w.word, meaning: w.meaning, note: "批量导入", mastered: false, date: todayStr() });
    });
    var n = (window.__importWords || []).length;
    window.__importWords = null;
    modalClose(); refresh(); toast("已导入 " + n + " 个生词");
  }
  /* 考试管理 */
  function addExamModal() {
    modalOpen("新增考试", "输入考试名称即可创建（如专四、专八、雅思、托福…）。每套考试的生词本、模块记录、打卡进度完全独立。" +
      field("考试名称", "newExamName", "text", "例如：专八"),
      cancelBtn() + '<button class="btn" data-action="submit-exam">' + ICONS.check + "创建</button>");
  }
  function submitExam() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var name = fval("newExamName").trim();
    if (!name) { toast("请填写考试名称", true); return; }
    if (dm.exams[name]) { toast("该考试已存在", true); return; }
    dm.exams[name] = {
      auto: "custom", examDate: "", archived: false, wordbook: [],
      subjects: { "词汇": { progress: 0, note: "" }, "听力": { progress: 0, note: "" }, "阅读": { progress: 0, note: "" }, "写作": { progress: 0, note: "" }, "翻译": { progress: 0, note: "" }, "口语": { progress: 0, note: "" } }
    };
    dm.activeExam = name;
    modalClose(); refresh(); toast("已创建「" + name + "」，请设置考试时间");
  }
  function setExamDateModal() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    if (!ex) return;
    modalOpen("设置「" + dm.activeExam + "」考试时间",
      '<div class="li-sub" style="margin-bottom:10px;">内置考试默认按官方规则自动计算（四六级：每年 6 月/12 月第三个周六；考研：12 月倒数第二个周末）。手动设置的日期优先，考试结束后可在这里调整。</div>' +
      '<div class="field"><label>考试日期</label><input id="exDate" type="date" value="' + esc(ex.examDate || examDateOfLocal(ex) || "") + '"></div>' +
      '<div class="li-sub" style="margin-top:-4px;margin-bottom:10px;">手机端如无法弹出日期选择器，可手动输入，格式：2026-12-20</div>' +
      (ex.auto && ex.auto !== "custom" ? '<button class="btn small plain" data-action="reset-exam-date">恢复自动计算</button>' : ""),
      cancelBtn() + '<button class="btn" data-action="submit-exam-date">' + ICONS.check + "保存</button>");
  }
  function submitExamDate() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    if (!ex) return;
    var dv = fval("exDate") || "";
    if (dv && !/^\d{4}-\d{2}-\d{2}$/.test(dv)) { toast("日期格式应为 年-月-日", true); return; }
    ex.examDate = dv;
    modalClose(); refresh(); toast(ex.examDate ? "已手动设置考试时间" : "已清空，使用自动计算");
  }
  function resetExamDate() {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm && dm.exams && dm.exams[dm.activeExam];
    if (!ex) return;
    ex.examDate = "";
    modalClose(); refresh(); toast("已恢复自动计算考试时间");
  }
  function archiveExam(name) {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    var ex = dm.exams && dm.exams[name];
    if (!ex) return;
    ex.archived = true;
    if (dm.activeExam === name) {
      var first = Object.keys(dm.exams).filter(function (k) { return !dm.exams[k].archived; })[0];
      dm.activeExam = first || "";
    }
    refresh(); toast("已归档「" + name + "」，可在考试管理回看");
  }
  function restoreExam(name) {
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    if (dm.exams[name]) { dm.exams[name].archived = false; refresh(); toast("已恢复「" + name + "」"); }
  }
  function delExamConfirm(name) {
    window.__delExamName = name;
    modalOpen("删除考试", '将删除「' + esc(name) + '」的全部数据（进度、生词本），且不可恢复。仅自定义考试可删除。确定要删除吗？',
      cancelBtn() + '<button class="btn danger" data-action="del-exam-ok">' + ICONS.trash + "确认删除</button>");
  }
  function delExamOk() {
    var name = window.__delExamName;
    var dm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
    if (dm && name && dm.exams[name]) {
      delete dm.exams[name];
      if (dm.activeExam === name) {
        var first = Object.keys(dm.exams).filter(function (k) { return !dm.exams[k].archived; })[0];
        dm.activeExam = first || "";
      }
    }
    modalClose(); refresh(); toast("已删除");
  }

  function courseModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = id ? (dm.courses || []).filter(function (x) { return x.id === id; })[0] : null;
    modalOpen(c ? "编辑课程" : "添加课程",
      field("课程名称", "cName", "text", "材料科学基础", c ? c.name : "") +
      field("老师", "cTeacher", "text", "", c ? c.teacher : "") +
      selField("星期", "cDay", [["周一", "周一"], ["周二", "周二"], ["周三", "周三"], ["周四", "周四"], ["周五", "周五"], ["周六", "周六"], ["周日", "周日"]], c ? c.day : "周一") +
      field("上课时间（节次或时间都行）", "cTime", "text", "8:00-9:40 或 1-2节", c ? c.time : "") +
      field("地点", "cPlace", "text", "A101", c ? c.place : "") +
      field("资料链接（课件/网盘/PDF，可选）", "cUrl", "text", "https://", c ? (c.url || "") : "") +
      area("课程笔记（期末复习用，可选）", "cNote", "重点、进度、疑惑…", c ? (c.note || "") : ""),
      cancelBtn() + '<button class="btn" data-action="submit-course" data-domain="' + esc(did) + '" data-id="' + esc(id || "") + '">' + ICONS.check + "保存</button>");
    window.__editCourseId = id || "";
  }
  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var maxW = 900;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL("image/jpeg", 0.72), w, h);
      };
      img.onerror = function () { toast("图片读取失败，请换一张", true); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  function courseDetailModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    var photos = c.photos || [];
    modalOpen(esc(c.name),
      '<div class="li-sub" style="margin-bottom:8px;">' + esc(c.day || "") + (c.time ? " · " + esc(c.time) : "") + (c.place ? " · " + esc(c.place) : "") + (c.teacher ? " · " + esc(c.teacher) : "") + "</div>" +
      (c.note ? '<div class="formula-block"><div class="formula-title">📝 课程笔记</div><div class="formula-line" style="white-space:pre-wrap;">' + esc(c.note) + "</div></div>" : "") +
      '<div class="formula-block"><div class="formula-title">📷 课程照片（' + photos.length + '）</div>' +
      (photos.length ? '<div class="course-photos">' + photos.map(function (ph, i) {
        return '<div class="cp-item" data-action="view-course-photo" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '" data-idx="' + i + '">' +
          '<img src="' + ph.data + '" alt="课程照片">' +
          (ph.note ? '<div class="cp-note">' + esc(ph.note) + "</div>" : "") +
          '<span class="cp-del" data-action="del-course-photo" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '" data-idx="' + i + '">×</span></div>';
      }).join("") + "</div>" : '<div class="li-sub">还没有照片，上课拍课件可以存这里。</div>') +
      '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">' +
      '<button class="btn small plain" data-action="pick-course-photo" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '">＋ 添加照片</button>' +
      '<input type="file" id="coursePhotoInput" accept="image/*" style="display:none;"></div></div>' +
      '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
      '<button class="btn small plain" data-action="edit-course-note" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '">' + (c.note ? "✏️ 修改笔记" : "＋ 添加笔记") + "</button>" +
      '<button class="btn small plain" data-action="edit-course-url" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '">' + (c.url ? "🔗 修改资料" : "＋ 添加资料") + "</button>" +
      (c.url ? '<a class="btn small" href="' + esc(c.url) + '" target="_blank" rel="noopener">' + ICONS.link + "打开资料</a>" : "") +
      '<button class="btn small plain" data-action="edit-course" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '">编辑课程</button>' +
      '<button class="btn small plain" data-action="del-course" data-domain="' + esc(did) + '" data-id="' + esc(c.id) + '">删除</button>' +
      "</div>");
    var fi = $id("coursePhotoInput");
    if (fi) {
      fi.value = "";
      fi.addEventListener("change", function () {
        var f = fi.files && fi.files[0];
        if (!f) return;
        compressImage(f, function (imgData) {
          var cc = data.domains.filter(function (x) { return x.id === did; })[0];
          var cc2 = cc && (cc.courses || []).filter(function (x) { return x.id === id; })[0];
          if (!cc2) return;
          cc2.photos = cc2.photos || [];
          cc2.photos.push({ id: uid(), data: imgData, date: todayStr(), note: "" });
          save();
          toast("照片已保存（压缩后约 " + Math.round(imgData.length / 1024) + " KB）");
          courseDetailModal(id, did);
        });
      });
    }
  }
  function coursePhotoView(id, did, idx) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    var ph = c && (c.photos || [])[idx];
    if (!ph) return;
    modalOpen("课程照片",
      '<img src="' + ph.data + '" style="width:100%;border-radius:10px;display:block;">' +
      '<div class="li-sub" style="margin-top:8px;">' + esc(c.name) + " · " + esc(ph.date || "") + "</div>",
      '<button class="btn" data-action="modal-close">关闭</button>');
  }
  function courseNoteModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    modalOpen("课程笔记：" + esc(c.name),
      area("笔记内容（期末复习用）", "cnNote", "重点、进度、疑惑…", c.note || ""),
      cancelBtn() + '<button class="btn" data-action="submit-course-note" data-domain="' + esc(did) + '" data-id="' + esc(id) + '">保存笔记</button>');
  }
  function submitCourseNote(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    c.note = fval("cnNote").trim();
    save(); modalClose(); toast("笔记已保存");
    courseDetailModal(id, did);
  }
  function courseUrlModal(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    modalOpen("资料链接：" + esc(c.name),
      field("课件/网盘/PDF 链接", "cuUrl", "text", "https://", c.url || ""),
      cancelBtn() + '<button class="btn" data-action="submit-course-url" data-domain="' + esc(did) + '" data-id="' + esc(id) + '">保存</button>');
  }
  function submitCourseUrl(id, did) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    var c = dm && (dm.courses || []).filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    c.url = fval("cuUrl").trim();
    save(); modalClose(); toast("资料链接已保存");
    courseDetailModal(id, did);
  }
  function submitCourse(did, id) {
    var dm = data.domains.filter(function (x) { return x.id === did; })[0];
    if (!dm) return;
    var name = fval("cName").trim();
    if (!name) { toast("请填写课程名称", true); return; }
    var obj = { name: name, teacher: fval("cTeacher").trim(), day: fval("cDay"), time: fval("cTime").trim(), place: fval("cPlace").trim(), url: fval("cUrl").trim(), note: fval("cNote").trim() };
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
    var domOpts = [["", "不关联"]].concat(data.domains.filter(function (x) { return !x.hidden; }).map(function (x) { return [x.id, x.name]; }));
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
    var targets = [["library", "资料库"]].concat(data.domains.filter(function (x) { return !x.hidden; }).map(function (d) { return [d.id, d.name]; }));
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

  var MK_CAUSES = ["概念不清", "计算失误", "审题失误", "知识点遗忘", "粗心"];
  var MK_SUBJECTS = ["数学", "英语", "政治", "专业课", "其他"];
  var MK_TOPICS = {
    "数学": ["高数·极限", "高数·导数", "高数·积分", "线代·矩阵", "概率·统计"],
    "英语": ["词汇", "阅读", "写作", "翻译"],
    "政治": ["马原", "毛中特", "史纲", "思修"],
    "专业课": [],
    "其他": []
  };
  var MK_TOPIC_LIST = [];
  Object.keys(MK_TOPICS).forEach(function (k) { MK_TOPICS[k].forEach(function (t) { if (MK_TOPIC_LIST.indexOf(t) < 0) MK_TOPIC_LIST.push(t); }); });
  function mistakeModal(id) {
    var m = id ? data.mistakes.filter(function (x) { return x.id === id; })[0] : null;
    var mSubj = m ? m.subject : (W.ui.mistakeSubj || "数学");
    var mTopic = m ? (m.topic || "") : (W.ui.mistakeTopic || "");
    var mType = m ? (m.type || "") : (W.ui.mistakeType || "");
    modalOpen(m ? "编辑错题" : "记录错题",
      selField("科目（错题进对应科目板块）", "mkSubject", MK_SUBJECTS.map(function (s) { return [s, s]; }), mSubj) +
      '<div class="field"><label>专题（可选，进入科目后按专题分组；可自由填写）</label>' +
      '<input id="mkTopic" list="mkTopicsList" value="' + esc(mTopic) + '" placeholder="如 高数·极限 / 阅读" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;">' +
      '<datalist id="mkTopicsList">' + MK_TOPIC_LIST.map(function (t) { return "<option value=\"" + esc(t) + "\">"; }).join("") + "</datalist></div>" +
      field("类型 / 考点（第三级分类，如具体题型）", "mkType", "text", "如 洛必达法则 / 泰勒公式 / 定语从句", mType) +
      area("题目 / 错题内容", "mkTitle", "如：2010 高数第 3 题，极限计算", m ? m.title : "") +
      '<div class="field"><label>错因（选择最符合的一项）</label>' +
      MK_CAUSES.map(function (c) {
        return '<label class="checkline"><input type="radio" name="mkCause" value="' + c + '"' + ((m ? m.cause : "") === c || (!m && c === "概念不清") ? " checked" : "") + "> " + c + "</label>";
      }).join("") + "</div>" +
      field("来源（真题编号，可回溯）", "mkSource", "text", "如 2010 T1 / 习题 3-2", m ? m.source : "") +
      area("正确解法 / 订正", "mkSolution", "正确思路或订正过程", m ? (m.solution || m.answer || "") : ""),
      cancelBtn() + okBtn("submit-mistake"));
    window.__editMistakeId = id || "";
    var ms = $id("mkSubject");
    if (ms) ms.addEventListener("change", function () {
      var topic = $id("mkTopic");
      if (topic && MK_TOPICS[ms.value] && MK_TOPICS[ms.value].length && !topic.value) topic.placeholder = "如 " + MK_TOPICS[ms.value][0];
    });
  }
  function submitMistake(id) {
    var title = fval("mkTitle").trim();
    if (!title) { toast("请填写错题内容", true); return; }
    var causeEl = document.querySelector('input[name="mkCause"]:checked');
    var obj = {
      subject: fval("mkSubject").trim() || "未分类",
      topic: fval("mkTopic").trim(),
      type: fval("mkType").trim(),
      title: title,
      cause: causeEl ? causeEl.value : "概念不清",
      solution: fval("mkSolution").trim(),
      source: fval("mkSource").trim(),
      reviewed: false, reason: causeEl ? causeEl.value : "", answer: fval("mkSolution").trim()
    };
    var m = data.mistakes.filter(function (x) { return x.id === window.__editMistakeId; })[0];
    if (m) {
      Object.assign(m, obj);
      if (m.mastered && !m.reviewed) m.mastered = false;
    } else {
      obj.id = uid();
      obj.date = todayStr();
      obj.reviewCount = 0;
      obj.nextReview = todayStr();
      obj.mastered = false;
      data.mistakes.push(obj);
      toast("已记录，今天开始第一次复习");
    }
    modalClose(); refresh(); toast("错题已保存");
  }
  /* 遗忘曲线间隔：复习次数 → 下次间隔天数 */
  function mkNextReview(count) {
    var d = new Date();
    var gap = count <= 0 ? 1 : count === 1 ? 3 : count === 2 ? 7 : count === 3 ? 14 : 30;
    d.setDate(d.getDate() + gap);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function mistakeReviewModal(id) {
    var m = data.mistakes.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    modalOpen("复习这道错题",
      '<div class="li-sub" style="margin-bottom:8px;">第 ' + ((m.reviewCount || 0) + 1) + " 次复习 · 下次按间隔排期</div>" +
      '<div class="formula-block"><div class="formula-title">' + esc(m.title) + "</div>" +
      (m.solution ? '<div class="formula-line">解法：' + esc(m.solution) + "</div>" : "") + "</div>" +
      '<div class="li-sub" style="margin:8px 0;">现在能独立做对吗？</div>',
      cancelBtn() +
      '<button class="btn plain" data-action="mistake-review-no" data-id="' + esc(m.id) + '" style="margin-right:8px;">还不会</button>' +
      '<button class="btn" data-action="mistake-review-ok" data-id="' + esc(m.id) + '">答对了</button>');
  }
  function mistakeReviewOk(id) {
    var m = data.mistakes.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    m.reviewCount = (m.reviewCount || 0) + 1;
    m.nextReview = mkNextReview(m.reviewCount);
    m.reviewed = true;
    m.lastReview = todayStr();
    modalClose(); refresh();
    toast("已复习 " + m.reviewCount + " 次，下次 " + m.nextReview + "（" + (m.reviewCount >= 4 ? "30 天后" : m.reviewCount === 3 ? "14 天后" : m.reviewCount === 2 ? "7 天后" : m.reviewCount === 1 ? "3 天后" : "1 天后") + "）");
  }
  function mistakeReviewNo(id) {
    var m = data.mistakes.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    m.nextReview = mkNextReview(0);
    m.reviewed = false;
    m.lastReview = todayStr();
    modalClose(); refresh();
    toast("没关系，明天再复习一次");
  }

  function qaModal(id) {
    var q = id ? data.qa.filter(function (x) { return x.id === id; })[0] : null;
    var qSubj = q ? q.subject : (W.ui.qaSubj || "");
    modalOpen(q ? "编辑答疑" : "记录答疑",
      selField("科目", "qaSubject", MK_SUBJECTS.map(function (s) { return [s, s]; }), qSubj || "数学") +
      area("问题", "qaQ", "遇到的问题（不懂就问，弄懂就记）", q ? q.question : "") +
      area("解答", "qaA", "解答或思路", q ? q.answer : "") +
      field("来源 / 出处", "qaSource", "text", "如 教材 P120 / 老师课上 / AI 对话", q ? (q.source || "") : "") +
      field("知识点标签", "qaTags", "text", "如 极限 / 定语从句", q ? (q.tags || "") : "") +
      '<div class="field"><label>状态</label>' +
      '<label class="checkline"><input type="radio" name="qaStatus" value="待解决"' + ((q ? q.status : "待解决") === "待解决" ? " checked" : "") + "> 待解决（还没弄懂）</label>" +
      '<label class="checkline"><input type="radio" name="qaStatus" value="已解决"' + ((q ? q.status : "") === "已解决" ? " checked" : "") + "> 已解决</label></div>" +
      '<label class="checkline"><input type="checkbox" id="qaStar"' + (q && q.starred ? " checked" : "") + "><label for=\"qaStar\">⭐ 收藏（考前必看）</label>",
      cancelBtn() + okBtn("submit-qa"));
    window.__editQaId = id || "";
  }
  function submitQa(id) {
    var question = fval("qaQ").trim();
    if (!question) { toast("请填写问题", true); return; }
    var stEl = document.querySelector('input[name="qaStatus"]:checked');
    var obj = {
      subject: fval("qaSubject").trim() || "未分类",
      question: question,
      answer: fval("qaA").trim(),
      source: fval("qaSource").trim(),
      tags: fval("qaTags").trim(),
      status: stEl ? stEl.value : "待解决",
      starred: !!(document.getElementById("qaStar") && document.getElementById("qaStar").checked)
    };
    var q = data.qa.filter(function (x) { return x.id === window.__editQaId; })[0];
    if (q) { Object.assign(q, obj); }
    else { obj.id = uid(); obj.mastered = false; obj.date = todayStr(); data.qa.push(obj); toast("已记录到答疑库"); }
    modalClose(); refresh();
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
      '<div class="li-sub" style="margin-top:-4px;margin-bottom:10px;">格式：年-月-日（手机端直接手动输入即可）</div>' +
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { toast("日期格式应为 年-月-日，如 2026-12-26", true); return; }
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
    var el = e.target;
    if (el && el.getAttribute && el.getAttribute("data-action") === "set-exam") {
      var v = el.value;
      var cdm = data.domains.filter(function (x) { return x.id === "cet"; })[0];
      if (cdm && cdm.exams && cdm.exams[v]) {
        cdm.activeExam = v;
        refresh();
        toast("已切换为" + v + "（各考试进度相互独立）");
      }
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
