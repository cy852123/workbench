/* ===== 视图渲染层：所有页面 HTML 生成 =====
   交互事件全部通过 data-action 委托给 app.js 处理 */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function ic(name) {
    var W = window.W;
    return W && W.icons && W.icons[name] ? W.icons[name] : "";
  }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function weekCN() {
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][new Date().getDay()];
  }
  function dateCN(s) {
    if (!s) return "";
    var p = s.split("-");
    return p[0] + "年" + parseInt(p[1], 10) + "月" + parseInt(p[2], 10) + "日";
  }
  function daysDiff(s) {
    if (!s) return null;
    var t = new Date(s + "T00:00:00").getTime();
    return Math.ceil((t - Date.now()) / 86400000);
  }
  function fmtMin(m) {
    if (m == null) return "0 分钟";
    if (m < 60) return m + " 分钟";
    var h = Math.floor(m / 60), mm = m % 60;
    return h + " 小时" + (mm ? " " + mm + " 分" : "");
  }
  function stateTag(s) {
    if (s === "看完") return '<span class="tag state-done">看完</span>';
    if (s === "在看") return '<span class="tag state-doing">在看</span>';
    return '<span class="tag state-todo">未看</span>';
  }
  function priTag(p) {
    if (p === "高") return '<span class="tag pri-hi">高</span>';
    if (p === "中") return '<span class="tag pri-mid">中</span>';
    return '<span class="tag pri-lo">低</span>';
  }
  function helpDot(key) {
    return '<button class="help-dot" data-action="help" data-help="' + esc(key) + '" title="帮助">?</button>';
  }
  function card(head, body, cls) {
    return '<div class="card ' + (cls || "") + '"><div class="card-head">' + head + '</div>' + body + '</div>';
  }
  function cardHead(title, hint, helpKey) {
    return '<h3>' + esc(title) + '</h3>' + (hint ? '<span class="hint">' + hint + "</span>" : "") + (helpKey ? helpDot(helpKey) : "");
  }
  function empty(text, tip) {
    return '<div class="empty">' + esc(text || "这里还没有内容") + (tip ? '<div class="empty-tip">' + esc(tip) + "</div>" : "") + "</div>";
  }
  function domainName(id) {
    var W = window.W, d = W && W.data && W.data.domains ? W.data.domains.filter(function (x) { return x.id === id; })[0] : null;
    return d ? d.name : (id === "library" ? "资料库" : "");
  }
  function tasksOfDomain(domainId) {
    var W = window.W;
    return (W.data.tasks || []).filter(function (t) { return t.domainId === domainId; });
  }
  function taskItem(t) {
    return '<div class="task-item' + (t.done ? " done" : "") + '" data-action="toggle-task" data-id="' + esc(t.id) + '">' +
      '<span class="task-check">' + ic("check") + "</span>" +
      '<span class="task-title">' + esc(t.title) + "</span>" +
      '<span class="task-domain">' + esc(domainName(t.domainId)) + "</span>" +
      (t.due ? '<span class="li-meta">' + esc(t.due) + "</span>" : "") +
      '<button class="icon-btn" data-action="edit-task" data-id="' + esc(t.id) + '">' + ic("edit") + "</button>" +
      '<button class="icon-btn" data-action="del-task" data-id="' + esc(t.id) + '">' + ic("trash") + "</button></div>";
  }

  /* ==================== 今日（一级首页） ==================== */
  function today() {
    var W = window.W, d = W.data;
    var t = todayStr();
    var html = "";
    var greeting = "你好";
    var hh = new Date().getHours();
    var emoji = "🌙";
    if (hh < 6) { greeting = "夜深了，注意休息"; emoji = "🌙"; }
    else if (hh < 12) { greeting = "早上好"; emoji = "🌤"; }
    else if (hh < 14) { greeting = "中午好"; emoji = "☀"; }
    else if (hh < 19) { greeting = "下午好"; emoji = "☀"; }
    else { greeting = "晚上好"; emoji = "🌙"; }

    /* 区块1：问候横幅 */
    html += '<div class="card tint-green">' +
      '<div style="font-size:20px;font-weight:800;">' + emoji + greeting + "，今天也要加油</div>" +
      '<div style="color:var(--sub);font-size:13px;margin-top:4px;">' + dateCN(t) + " " + weekCN() + " · 距 2028 考研还有 " +
      '<b style="color:var(--accent-dark);">' + daysDiff(W.settings.kaoyanDate) + "</b> 天</div></div>";

    /* 区块2：今日目标（固定首页） */
    var g = (d.goals || []).filter(function (x) { return x.date === t; });
    var doneMin = 0, planMin = 0;
    g.forEach(function (x) { planMin += (x.minutes || 0); });
    (d.studyLog || []).filter(function (x) { return x.date === t; }).forEach(function (x) { doneMin += (x.minutes || 0); });
    var goalHtml;
    if (g.length === 0) {
      goalHtml = '<div class="empty">尚未设置今日小目标' +
        '<div class="empty-tip">先定个小目标，晚上看完成率</div></div>' +
        '<button class="btn block" data-action="add-goal">🎯 设定今日目标</button>';
    } else {
      var pct = planMin > 0 ? Math.min(100, Math.round(doneMin / planMin * 100)) : 0;
      goalHtml = '<div style="display:flex;align-items:center;gap:16px;">' +
        '<div class="countdown"><span class="cd-num">' + pct + '%</span><span class="cd-label">完成率</span></div>' +
        '<div style="flex:1"><div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="li-sub" style="margin-top:6px;">已学 ' + fmtMin(doneMin) + " / 目标 " + fmtMin(planMin) + "</div></div></div>" +
        '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">' + g.map(function (x) {
          return '<span class="tag">' + esc(domainName(x.domainId)) + " " + esc(x.minutes) + " 分钟</span>";
        }).join("") + "</div>" +
        '<button class="btn ghost small" data-action="add-goal" style="margin-top:10px;">' + ic("edit") + "调整目标</button>";
    }
    html += card(cardHead("🎯 今日目标", "每天从目标开始", "goal"), goalHtml);

    /* 区块3：今日待办（最多 3 条） */
    var todayTasks = (d.tasks || []).filter(function (x) { return x.date === t ? !x.done : (!x.date && !x.done); });
    var overDue = (d.tasks || []).filter(function (x) { return !x.done && x.date && x.date < t; });
    var shown = todayTasks.slice(0, 3);
    var todoHtml = shown.length === 0
      ? empty("今日没有待办任务", "点下方按钮添加")
      : '<div class="list">' + shown.map(function (tt) {
        return '<div class="task-item" data-action="toggle-task" data-id="' + esc(tt.id) + '">' +
          '<span class="task-check">' + ic("check") + "</span>" +
          '<span class="task-title">' + esc(tt.title) + "</span>" +
          '<span class="task-domain">' + esc(domainName(tt.domainId)) + "</span>" +
          (tt.date && tt.date < t ? '<span class="tag pri-hi">已逾期</span>' : "") + "</div>";
      }).join("") + "</div>";
    if (todayTasks.length > 3) todoHtml += '<button class="btn ghost small" data-action="go-view" data-view="tasks-all" style="margin-top:8px;">查看全部 ' + todayTasks.length + " 条任务</button>";
    if (overDue.length > 0) todoHtml += '<div class="li-sub" style="color:var(--danger);margin-top:8px;">另有 ' + overDue.length + ' 条任务已逾期，可在任务专区处理。</div>';
    todoHtml += '<button class="btn ghost small" data-action="add-task" style="margin-top:8px;">' + ic("plus") + "添加任务</button>";
    html += card(cardHead("✅ 今日待办", "最多显示 3 条", "task"), todoHtml);

    /* 区块4：领域入口卡片组 */
    html += '<div class="card"><div class="card-head"><h3>📚 我的学习领域</h3></div>' +
      '<div class="grid grid-3">' + d.domains.slice().sort(function (a, b) { return a.order - b.order; }).map(domainEntryCard).join("") + "</div></div>";

    /* 区块5：快捷工具卡片组 */
    var pendingInbox = (d.inbox || []).filter(function (x) { return x.status === "待分拣"; }).length;
    var weekLog = (d.studyLog || []).filter(function (x) { var dd = daysDiff(x.date); return dd != null && dd >= 0 && dd <= 6; });
    var weekMin = weekLog.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    var recent = [];
    (d.resources || []).slice().sort(function (a, b) { return b.updatedAt > a.updatedAt ? 1 : -1; }).slice(0, 2).forEach(function (r) { recent.push({ t: "📎 资料", title: r.title, v: "library" }); });
    (d.reviews || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; }).slice(0, 2).forEach(function (r) { recent.push({ t: "📝 复盘", title: r.date + " 复盘", v: "reviews" }); });
    var quickHtml = '<div class="grid grid-3">' +
      '<div class="card tint-blue"><div class="card-head"><h3 style="font-size:15px;">📥 收集箱</h3></div>' +
      '<div class="li-sub" style="margin-bottom:10px;">待确认 ' + pendingInbox + " 项</div>" +
      '<button class="btn small block" data-action="open-inbox">打开收集箱</button></div>' +
      '<div class="card tint-yellow"><div class="card-head"><h3 style="font-size:15px;">⏱ 快速打卡</h3></div>' +
      '<div class="li-sub" style="margin-bottom:10px;">本周累计 ' + fmtMin(weekMin) + "</div>" +
      '<button class="btn small block" data-action="punch" data-domain="">打卡学习</button></div>' +
      '<div class="card tint-green"><div class="card-head"><h3 style="font-size:15px;">📂 最近继续</h3></div>' +
      (recent.length === 0 ? '<div class="li-sub" style="margin-bottom:10px;">暂无记录</div>' :
        recent.slice(0, 2).map(function (r) { return '<div class="li-sub" style="margin-bottom:6px;">' + r.t + " " + esc(r.title.slice(0, 20)) + "</div>"; }).join("")) +
      '<button class="btn small block" data-action="nav" data-view="activity">查看更多</button></div></div>';
    html += quickHtml;

    return html;
  }
  function domainEntryCard(dm) {
    var d = window.W.data;
    var t = todayStr();
    var body = "", emoji = "📗", btn = "进入板块";
    if (dm.type === "kaoyan") {
      emoji = "🎓";
      var sc = kyActive(dm);
      if (sc) {
        var kd = kyExamDate(sc);
        var kdd = kd ? daysDiff(kd) : null;
        var stName = kyStageName(sc.stage);
        var badges = (sc.subjects || []).slice(0, 4).map(function (s) {
          var st = (sc.tasks || []).filter(function (x) { return x.subjectId === s.id; });
          var done = st.filter(function (x) { return x.done; }).length;
          return '<span class="tag">' + esc(s.name) + " " + done + "/" + st.length + "</span>";
        }).join("");
        body = '<div class="li-sub" style="margin-bottom:8px;">当前方案：' + esc(sc.name) + (kdd != null && kdd >= 0 ? " ｜ 距离考试：" + kdd + " 天" : "") + " ｜ 当前阶段：" + esc(stName) + "</div><div>" + badges + "</div>";
      } else {
        body = '<div class="li-sub" style="margin-bottom:8px;">暂未创建备考方案</div>';
      }
      btn = "进入备考";
    } else if (dm.type === "english") {
      emoji = "📖";
      var ex = dm.exams && dm.exams[dm.activeExam];
      var exd = ex ? daysDiff(examDateOf(ex)) : null;
      var bd = ex && ex.subjects ? ["词汇", "阅读", "听力", "写作"].map(function (k) {
        var s = ex.subjects[k]; return s ? '<span class="tag">' + k + " " + (s.progress || 0) + "%</span>" : "";
      }).join("") : "";
      body = '<div class="li-sub" style="margin-bottom:8px;">' + esc(dm.activeExam || "考研英语") + (exd != null ? " · 距考试 " + exd + " 天" : "") + "</div><div>" + bd + "</div>";
      btn = "进入英语板块";
    } else if (dm.type === "paper") {
      emoji = "📝";
      var st = dm.stages && dm.stages[dm.currentStage || 0] ? dm.stages[dm.currentStage || 0] : "";
      var pt = (d.tasks || []).filter(function (x) { return x.domainId === dm.id && !x.done; }).length;
      body = '<div class="li-sub" style="margin-bottom:8px;">进行到：' + esc(st || "选题") + (pt ? " · 待办 " + pt + " 条" : "") + "</div>";
      btn = "进入论文板块";
    } else if (dm.type === "courses") {
      emoji = "📘";
      var as = (dm.assignments || []).filter(function (x) { return !x.done; }).length;
      body = '<div class="li-sub" style="margin-bottom:8px;">' + (dm.courses || []).length + " 门课程 · 待办作业/考试 " + as + " 项</div>";
      btn = "进入课程板块";
    } else if (dm.type === "ailearn") {
      emoji = "🤖";
      var doneCount = (d.studyLog || []).filter(function (x) { return x.domainId === "ai"; }).length;
      body = '<div class="li-sub" style="margin-bottom:8px;">每日 30 分钟专题学习 · 已学习 ' + doneCount + " 次</div>";
      btn = "进入 AI 学习板块";
    } else {
      emoji = "📗";
      var sc = (dm.subjects || []).length;
      body = '<div class="li-sub" style="margin-bottom:8px;">' + (sc ? sc + " 个科目" : "通用学习领域") + "</div>";
      btn = "进入板块";
    }
    return '<div class="card"><div class="card-head"><h3 style="font-size:15px;">' + emoji + " " + esc(dm.name) + '</h3></div>' + body +
      '<button class="btn small block" data-action="nav" data-view="domain:' + esc(dm.id) + '">' + btn + "</button></div>";
  }

  /* ==================== 领域 ==================== */
  function domain(dm) {
    var W = window.W, d = W.data;
    if (!dm) return empty("领域不存在");
    var html = "";
    var tint = dm.color || "green";

    /* 倒计时 */
    if (dm.examDate) {
      var dd = daysDiff(dm.examDate);
      html += '<div class="card tint-' + tint + '"><div class="card-head"><h3>' + esc(dm.name) + "倒计时</h3></div>" +
        '<div class="countdown"><span class="cd-num">' + (dd != null ? dd : "?") + "</span><span class=\"cd-label\">天 · " + esc(dm.examDate) + "（" + dateCN(dm.examDate) + "）</span></div></div>";
    }

    /* 阶段时间线 */
    if (dm.stages && dm.stages.length) {
      var curIdx = -1;
      dm.stages.forEach(function (s, i) { if (!s.done && curIdx < 0) curIdx = i; });
      if (curIdx < 0) curIdx = dm.stages.length - 1;
      html += card(cardHead("备考阶段", "当前所处阶段", "stages"),
        '<div class="timeline">' + dm.stages.map(function (s, i) {
          var cls = s.done ? "done" : (i === curIdx ? "current" : "");
          return '<div class="tl-step ' + cls + '"><div class="tl-dot">' + (s.done ? ic("check") : "") + "</div>" +
            '<div class="tl-label">' + esc(s.name) + (s.end ? "<br>" + esc(s.end) : "") + "</div></div>";
        }).join("") + "</div>" +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
        (curIdx >= 0 && dm.stages[curIdx].goal ? '<span class="tag">本阶段目标：' + esc(dm.stages[curIdx].goal) + "</span>" : "") +
        '<button class="btn small plain" data-action="edit-domain" data-id="' + esc(dm.id) + '">' + ic("edit") + "编辑阶段</button></div>");
    }

    /* 专项（如英语学习里的四六级） */
    if (dm.subGroups && dm.subGroups.length) {
      html += dm.subGroups.map(function (sg) {
        var sd = sg.examDate ? daysDiff(sg.examDate) : null;
        return card(cardHead(sg.name + " 专项", sd != null ? "还有 " + sd + " 天 · " + sg.examDate : "专项进度", "subgroups"),
          (sd != null ? '<div class="countdown" style="margin-bottom:12px;"><span class="cd-num">' + sd + '</span><span class="cd-label">天 · 考试日期 ' + esc(sg.examDate) + "</span></div>" : "") +
          '<div class="list">' + (sg.subjects || []).map(function (s) {
            return '<div class="list-item"><div class="li-main">' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div class="li-title" style="flex:1;">' + esc(s.name) + "</div>" +
              '<span style="font-size:13px;color:var(--sub);">' + (s.progress || 0) + "%</span></div>" +
              '<div class="progress-track" style="margin-top:6px;"><div class="progress-fill" style="width:' + (s.progress || 0) + '%;"></div></div>' +
              (s.note ? '<div class="li-sub" style="margin-top:4px;">' + esc(s.note) + "</div>" : "") + "</div>" +
              '<button class="btn small plain" data-action="update-subject" data-domain="' + esc(dm.id) + '" data-subject="' + esc(s.id) + '">' + ic("edit") + "</button></div>";
          }).join("") + "</div>");
      }).join("");
    }

    /* 科目进度 */
    if (dm.subjects && dm.subjects.length) {
      html += card(cardHead("科目进度", "点击可更新", "subjects"),
        '<div class="list">' + dm.subjects.map(function (s) {
          return '<div class="list-item"><div class="li-main">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div class="li-title" style="flex:1;">' + esc(s.name) + "</div>" +
            '<span style="font-size:13px;color:var(--sub);">' + (s.progress || 0) + "%</span></div>" +
            '<div class="progress-track" style="margin-top:6px;"><div class="progress-fill" style="width:' + (s.progress || 0) + '%;"></div></div>' +
            (s.note ? '<div class="li-sub" style="margin-top:4px;">' + esc(s.note) + "</div>" : "") + "</div>" +
            '<button class="btn small plain" data-action="update-subject" data-domain="' + esc(dm.id) + '" data-subject="' + esc(s.id) + '">' + ic("edit") + "</button></div>";
        }).join("") + "</div>");
    }

    /* 周计划（考研） */
    if (dm.weeklyPlan) {
      var days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
      html += card(cardHead("本周计划", "按天安排，点圆圈完成", "weekly"),
        '<div class="list">' + days.map(function (day) {
          var items = dm.weeklyPlan[day] || [];
          var done = items.filter(function (i) { return i.done; }).length;
          return '<div class="list-item" style="align-items:flex-start;">' +
            '<div style="width:40px;font-size:13px;color:var(--sub);padding-top:2px;">' + day + (items.length ? ' <span style="color:var(--accent);">' + done + "/" + items.length + "</span>" : "") + "</div>" +
            '<div style="flex:1;">' + (items.length === 0 ? '<span style="color:#C4C7C4;font-size:13px;">未安排</span>' : items.map(function (i) {
              return '<div class="task-item' + (i.done ? " done" : "") + '" data-action="toggle-weekly" data-domain="' + esc(dm.id) + '" data-day="' + day + '" data-id="' + esc(i.id) + '" style="padding:6px 0;">' +
                '<span class="task-check">' + ic("check") + "</span>" +
                '<span class="task-title" style="font-weight:400;">' + esc(i.text) + "</span>" +
                '<button class="icon-btn" data-action="del-weekly" data-domain="' + esc(dm.id) + '" data-day="' + day + '" data-id="' + esc(i.id) + '">' + ic("trash") + "</button></div>";
            }).join("")) +
            '<button class="btn ghost small" data-action="add-weekly" data-domain="' + esc(dm.id) + '" data-day="' + day + '">' + ic("plus") + "添加</button></div></div>";
        }).join("") + "</div>");
    }

    /* 领域任务 */
    var domTasks = tasksOfDomain(dm.id);
    if (domTasks.length) {
      html += card(cardHead("领域任务", "未完成任务", "task"),
        '<div class="list">' + domTasks.filter(function (t) { return !t.done; }).map(taskItem).join("") + "</div>" +
        '<button class="btn ghost small" data-action="add-task" data-domain="' + esc(dm.id) + '">' + ic("plus") + "添加任务</button>");
    }

    /* 本周学习统计（考研/通用领域） */
    if (dm.subjects && dm.subjects.length) {
      var weekLog = (d.studyLog || []).filter(function (x) { return x.domainId === dm.id; });
      if (weekLog.length) {
        var byDay = {};
        weekLog.forEach(function (x) { var k = x.date; byDay[k] = (byDay[k] || 0) + (x.minutes || 0); });
        var days7 = [];
        for (var i = 6; i >= 0; i--) {
          var dt = new Date(); dt.setDate(dt.getDate() - i);
          var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
          days7.push({ key: key, m: byDay[key] || 0, label: ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()] });
        }
        var max = Math.max.apply(null, days7.map(function (x) { return x.m; })) || 1;
        html += card(cardHead("本周学习时长", "最近 7 天", "stats"),
          '<div class="bar-chart">' + days7.map(function (x) {
            return '<div class="bar-col' + (x.key === todayStr() ? " today" : "") + '">' +
              '<div class="bar-val">' + (x.m > 0 ? x.m : "") + "</div>" +
              '<div class="bar" style="height:' + Math.max(4, Math.round(x.m / max * 100)) + '%;"></div>' +
              '<div class="bar-label">' + x.label + "</div></div>";
          }).join("") + "</div>" +
          '<div style="font-size:12.5px;color:var(--sub);margin-top:10px;">本周累计 ' + fmtMin(weekLog.reduce(function (s, x) { return s + (x.minutes || 0); }, 0)) + "</div>");
      } else {
        html += card(cardHead("本周学习时长", "打卡后显示图表", "stats"), empty("本周还没有打卡", "在今日页或这里点「打卡学习」记录时长"));
      }
    }

    /* 打卡按钮 + 打卡热力 */
    if (dm.subjects && dm.subjects.length) {
      var hm = (d.studyLog || []).filter(function (x) { return x.domainId === dm.id; }).reduce(function (o, x) { o[x.date] = (o[x.date] || 0) + (x.minutes || 0); return o; }, {});
      var hmDays = [];
      var start = new Date(); start.setDate(start.getDate() - 27);
      for (var j = 0; j < 28; j++) {
        var dt2 = new Date(start); dt2.setDate(start.getDate() + j);
        var k2 = dt2.getFullYear() + "-" + String(dt2.getMonth() + 1).padStart(2, "0") + "-" + String(dt2.getDate()).padStart(2, "0");
        var m2 = hm[k2] || 0;
        var lv = m2 === 0 ? "" : (m2 < 30 ? "l1" : m2 < 60 ? "l2" : m2 < 120 ? "l3" : "l4");
        hmDays.push('<div class="hm-cell ' + lv + (k2 === todayStr() ? " today" : "") + '" title="' + k2 + " " + m2 + '分钟"></div>');
      }
      html += card(cardHead("打卡热力图", "近 28 天，颜色越深学得越久", "heatmap"),
        '<div class="heatmap">' + hmDays.join("") + "</div>" +
        '<div class="hm-legend"><span>少</span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span><span>多</span></div>' +
        '<button class="btn block" data-action="punch" data-domain="' + esc(dm.id) + '" style="margin-top:12px;">' + ic("plus") + "打卡学习</button>");
    }

    /* 生词本（英语学习等领域） */
    if (dm.wordbook) {
      var wb = dm.wordbook || [];
      var wPending = wb.filter(function (w) { return !w.mastered; });
      var wMastered = wb.filter(function (w) { return w.mastered; });
      html += card(cardHead("生词本", wPending.length + " 待复习 · " + wMastered.length + " 已掌握", "wordbook"),
        '<button class="btn ghost small" data-action="add-word" data-domain="' + esc(dm.id) + '" style="margin-bottom:10px;">' + ic("plus") + "添加生词</button>" +
        (wb.length === 0 ? empty("还没有生词", "遇到生词就记下来，定期复习才会变成自己的词") :
        '<div class="list">' + wb.slice().sort(function (a, b) { return (a.mastered ? 1 : 0) - (b.mastered ? 1 : 0); }).map(function (w) {
          return '<div class="list-item" style="align-items:flex-start;">' +
            '<div class="li-main"><div class="li-title">' + esc(w.word) +
            (w.mastered ? ' <span class="tag state-done">已掌握</span>' : ' <span class="tag state-todo">待复习</span>') + "</div>" +
            '<div class="li-sub">' + esc(w.meaning || "") + (w.note ? " · " + esc(w.note) : "") + "</div></div>" +
            '<button class="btn small ' + (w.mastered ? "plain" : "") + '" data-action="toggle-word" data-domain="' + esc(dm.id) + '" data-id="' + esc(w.id) + '">' + ic("check") + (w.mastered ? "已掌握" : "标记掌握") + "</button>" +
            '<button class="icon-btn" data-action="del-word" data-domain="' + esc(dm.id) + '" data-id="' + esc(w.id) + '">' + ic("trash") + "</button></div>";
        }).join("") + "</div>") +
        '<div class="li-sub" style="margin-top:10px;">复习建议：当天记住 → 3 天后复习 → 1 周后再复习 → 掌握后隔几周回顾，比一次记很多更有效。</div>');
    }

    /* 英语学习相关功能快捷入口 */
    if (dm.id === "cet") {
      html += card(cardHead("英语配套功能", "搭配使用效果更好", "english-tools"),
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn plain small" data-action="open-qa">' + ic("help") + "答疑库</button>" +
        '<button class="btn plain small" data-action="open-mistakes">' + ic("alert") + "错题本</button>" +
        '<button class="btn plain small" data-action="open-ai">' + ic("spark") + "AI 英语帮手</button></div>" +
        '<div class="li-sub" style="margin-top:10px;">提示：AI 帮手配置 API 密钥后可以做英语答疑、翻译、作文批改、口语对话练习。未配置时（当前未启用），本地工具照常可用。生词本、打卡、错题、答疑都可以配合英语学习使用。</div>');
    }

    /* 领域资料 */
    var domRes = (d.resources || []).filter(function (r) { return r.domainId === dm.id; });
    html += card(cardHead("领域资料", "关联到此领域的资料", "resources"),
      domRes.length === 0 ? empty("还没有关联资料", "在资料库里新建并选择此领域") :
      '<div class="list">' + domRes.slice(0, 6).map(function (r) {
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(r.title) + "</div>" +
          '<div class="li-sub">' + (r.platform ? esc(r.platform) + " · " : "") + stateTag(r.status) + "</div></div>" +
          '<button class="btn small plain" data-action="open-library">查看</button></div>';
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 二级概览页：AI 知识学习 ==================== */
  function aiOverview(dm) {
    var W = window.W, d = W.data;
    var t = todayStr();
    var al = dm.aiLearn || { today: null, history: [] };
    var td = al.today && al.today.date === t ? al.today : null;
    var html = "";

    /* 横幅 */
    html += '<div class="card tint-green"><div class="card-head"><h3>🤖 AI 知识学习</h3></div>' +
      '<div class="li-sub">每日自动 30 分钟专题学习，页面内闭环完成，不跳转外部网站。</div></div>';

    /* 区块1：今日学习（核心） */
    if (!td) {
      html += card(cardHead("📅 今日学习", "还没生成今日学习包", "ai-today"),
        empty("今日学习包未生成", "点击下方按钮，生成今天 30 分钟的 AI 学习内容（内置学习包；每日自动推送将在云端升级后由 Hermes 定时提供）") +
        '<button class="btn block" data-action="gen-ai-today">🔄 生成今日学习包</button>');
    } else {
      html += '<div class="card"><div class="card-head"><h3>📅 今日学习</h3>' + (td.done ? '<span class="tag state-done">已完成</span>' : '<span class="tag state-doing">进行中</span>') + '</div>' +
        '<div style="font-size:17px;font-weight:800;margin-bottom:10px;">' + esc(td.topic) + "</div>" +
        '<div class="li-sub" style="font-weight:600;margin-bottom:4px;">✨ 学习目标</div>' +
        '<ul style="padding-left:20px;margin-bottom:12px;">' + (td.goals || []).map(function (g) { return "<li style=\"font-size:14px;margin-bottom:3px;\">" + esc(g) + "</li>"; }).join("") + "</ul>" +
        '<div class="li-sub" style="font-weight:600;margin-bottom:4px;">📖 学习正文</div>' +
        '<div style="font-size:14.5px;line-height:1.9;white-space:pre-wrap;margin-bottom:14px;color:var(--text);">' + esc(td.body) + "</div>" +
        '<div class="li-sub" style="font-weight:600;margin-bottom:4px;">💡 课后小思考</div>' +
        '<ul style="padding-left:20px;margin-bottom:14px;">' + (td.questions || []).map(function (q) { return "<li style=\"font-size:14px;margin-bottom:3px;\">" + esc(q) + "</li>"; }).join("") + "</ul>" +
        '<div class="field" style="margin-bottom:12px;"><label>我的学习笔记</label>' +
        '<textarea id="aiNote" placeholder="写几句今天的感悟…" style="min-height:70px;">' + esc(td.note || "") + "</textarea></div>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        (td.done ? '<button class="btn plain" disabled style="opacity:0.5;cursor:not-allowed;">🔄 已完成后不可重新生成</button>'
          : '<button class="btn plain" data-action="gen-ai-today">🔄 重新生成今日内容</button>') +
        '<button class="btn plain" data-action="ai-note-save">💾 保存笔记</button>' +
        (td.done ? "" : '<button class="btn" data-action="ai-done">✅ 完成今日学习（记录 30 分钟）</button>') +
        "</div></div>";
    }

    /* 区块2：学习状态摘要 */
    var aiLogs = (d.studyLog || []).filter(function (x) { return x.domainId === "ai"; });
    var streak = 0;
    (function () {
      var logs = {};
      aiLogs.forEach(function (x) { logs[x.date] = 1; });
      var dt = new Date(), n = 0;
      while (true) {
        var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
        if (logs[key]) { n++; dt.setDate(dt.getDate() - 1); } else break;
      }
      streak = n;
    })();
    var weekCount = aiLogs.filter(function (x) { var dd = daysDiff(x.date); return dd != null && dd >= 0 && dd <= 6; }).length;
    var histCount = (al.history || []).length;
    html += card(cardHead("📊 学习状态", "极简摘要，无进度条", "ai-status"),
      '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">' +
      '<div><div class="stat-num">' + streak + '</div><div class="stat-label">连续学习（天）</div></div>' +
      '<div><div class="stat-num">' + weekCount + '</div><div class="stat-label">本周已完成学习（次）</div></div>' +
      '<div><div class="stat-num">' + histCount + '</div><div class="stat-label">历史记录（条）</div></div></div>' +
      '<button class="btn ghost small" data-action="go-view" data-view="ai-history" style="margin-top:12px;">📚 查看全部历史记录</button>');

    /* 区块3：追加笔记 */
    html += card(cardHead("📝 辅助快捷", "随手记录", "ai-append"),
      '<p style="font-size:14px;color:var(--sub);margin-bottom:10px;">不完成今日课程，也可以随时记录 AI 学习的零散感悟，会存入历史记录。</p>' +
      '<button class="btn block plain" data-action="ai-append-note">📝 追加学习笔记</button>');

    return html;
  }
  /* ==================== 三级页：AI 历史学习资料库 ==================== */
  function aiHistory(dm) {
    var W = window.W, d = W.data;
    var al = dm.aiLearn || { history: [] };
    var hist = (al.history || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
    var html = backBar("domain:ai", "AI 知识学习");
    html += card(cardHead("📚 历史学习资料库", hist.length + " 条记录，可回看复习", "ai-history"),
      hist.length === 0 ? empty("还没有历史记录", "完成今日学习或追加笔记后，会保存在这里") :
        '<div>' + hist.map(function (h) {
          return '<div class="review-item"><div class="ri-head"><span class="ri-date">' + esc(h.date) + "</span>" +
            '<span class="ri-type">' + (h.kind === "note" ? "笔记" : "学习") + "</span>" +
            '<span style="margin-left:auto;"><button class="icon-btn" data-action="ai-hist-edit" data-id="' + esc(h._id) + '">' + ic("edit") + "</button></span></div>" +
            (h.topic ? '<div style="font-weight:700;margin-top:6px;">' + esc(h.topic) + "</div>" : "") +
            (h.goals && h.goals.length ? '<div class="li-sub" style="margin-top:4px;">目标：' + esc(h.goals.join("；")) + "</div>" : "") +
            (h.body ? '<p style="font-size:13.5px;white-space:pre-wrap;margin-top:6px;color:var(--sub);">' + esc(h.body.length > 200 ? h.body.slice(0, 200) + "…" : h.body) + "</p>" : "") +
            (h.questions && h.questions.length ? '<div class="li-sub" style="margin-top:4px;">思考题：' + esc(h.questions.join(" / ")) + "</div>" : "") +
            (h.note ? '<p style="font-size:13.5px;margin-top:6px;color:var(--accent);">我的笔记：' + esc(h.note) + "</p>" : "") +
            "</div>";
        }).join("") + "</div>");
    html += '<div class="grid grid-2">' +
      card(cardHead("📈 本周学习时长", "AI 学习打卡", "stats"), weekBars(function (x) { return x.domainId === "ai"; })) +
      card(cardHead("🔥 28 天打卡热力图", "颜色越深学得越久", "heatmap"), heatmap28(function (x) { return x.domainId === "ai"; })) +
      "</div>";
    return html;
  }

  /* ==================== 二级概览页：英语学习 ==================== */
  function backBar(target, label) {
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
      '<button class="btn plain small" data-action="go-view" data-view="' + esc(target) + '">← 返回' + (label ? " " + esc(label) : "") + "</button></div>";
  }
  function examSubj(dm, name) {
    var ex = dm.exams && dm.exams[dm.activeExam];
    var s = ex && ex.subjects && ex.subjects[name];
    return s ? s : null;
  }
  /* 考试日期：手动设置优先；否则按官方规则自动计算 */
  function thirdSaturday(y, m) {
    var d = new Date(y, m, 1);
    var firstSat = 1 + (6 - d.getDay() + 7) % 7;
    return new Date(y, m, firstSat + 14);
  }
  function lastButOneSaturday(y, m) {
    var d = new Date(y, m + 1, 0);
    var lastDay = d.getDate();
    var dow = d.getDay();
    var lastSat = lastDay - ((dow + 1) % 7);
    return new Date(y, m, lastSat - 7);
  }
  function examDateOf(ex) {
    if (!ex) return null;
    if (ex.examDate) return ex.examDate;
    if (!ex.auto || ex.auto === "custom") return null;
    var now = new Date();
    var y = now.getFullYear();
    var cands = [];
    if (ex.auto === "cet4" || ex.auto === "cet6") {
      cands.push(thirdSaturday(y, 5));
      cands.push(thirdSaturday(y, 11));
    } else if (ex.auto === "kaoyan") {
      cands.push(lastButOneSaturday(y, 11));
    }
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var future = cands.filter(function (c) { return c >= today; }).sort(function (a, b) { return a - b; });
    var chosen = future[0] || (cands.length ? new Date(cands[0].getFullYear() + 1, cands[0].getMonth(), cands[0].getDate()) : null);
    if (!chosen) return null;
    return chosen.getFullYear() + "-" + String(chosen.getMonth() + 1).padStart(2, "0") + "-" + String(chosen.getDate()).padStart(2, "0");
  }
  function examWordbook(dm) {
    var ex = dm.exams && dm.exams[dm.activeExam];
    return (ex && ex.wordbook) || [];
  }
  /* 进度 → 文字摘要（概览页不用进度条/百分比） */
  function progressText(p) {
    p = p || 0;
    if (p <= 0) return "尚未开始";
    if (p < 30) return "刚开始";
    if (p < 60) return "进行中";
    if (p < 90) return "已过大半";
    if (p < 100) return "接近完成";
    return "已完成";
  }
  function heatmap28(filterFn) {
    var W = window.W, d = W.data;
    var hm = (d.studyLog || []).filter(filterFn).reduce(function (o, x) { o[x.date] = (o[x.date] || 0) + (x.minutes || 0); return o; }, {});
    var cells = [];
    var start = new Date(); start.setDate(start.getDate() - 27);
    for (var j = 0; j < 28; j++) {
      var dt2 = new Date(start); dt2.setDate(start.getDate() + j);
      var k2 = dt2.getFullYear() + "-" + String(dt2.getMonth() + 1).padStart(2, "0") + "-" + String(dt2.getDate()).padStart(2, "0");
      var m2 = hm[k2] || 0;
      var lv = m2 === 0 ? "" : (m2 < 30 ? "l1" : m2 < 60 ? "l2" : m2 < 120 ? "l3" : "l4");
      cells.push('<div class="hm-cell ' + lv + (k2 === todayStr() ? " today" : "") + '" title="' + k2 + " 学习 " + m2 + " 分钟\"></div>");
    }
    return '<div class="heatmap">' + cells.join("") + "</div>" +
      '<div class="hm-legend"><span>少</span><span class="hm-cell l1"></span><span class="hm-cell l2"></span><span class="hm-cell l3"></span><span class="hm-cell l4"></span><span>多</span></div>';
  }
  function weekBars(filterFn) {
    var W = window.W, d = W.data;
    var logs = (d.studyLog || []).filter(filterFn);
    var byDay = {};
    logs.forEach(function (x) { byDay[x.date] = (byDay[x.date] || 0) + (x.minutes || 0); });
    var days7 = [];
    for (var i = 6; i >= 0; i--) {
      var dt = new Date(); dt.setDate(dt.getDate() - i);
      var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      days7.push({ key: key, m: byDay[key] || 0, label: ["日", "一", "二", "三", "四", "五", "六"][dt.getDay()] });
    }
    var max = Math.max.apply(null, days7.map(function (x) { return x.m; })) || 1;
    return '<div class="bar-chart">' + days7.map(function (x) {
      return '<div class="bar-col' + (x.key === todayStr() ? " today" : "") + '">' +
        '<div class="bar-val">' + (x.m > 0 ? x.m : "") + "</div>" +
        '<div class="bar" style="height:' + Math.max(4, Math.round(x.m / max * 100)) + '%;"></div>' +
        '<div class="bar-label">' + x.label + "</div></div>";
    }).join("") + "</div>";
  }
  function englishOverview(dm) {
    var W = window.W, d = W.data;
    var html = "";
    var ex = dm.exams && dm.exams[dm.activeExam];
    var exdStr = examDateOf(ex);
    var exd = exdStr ? daysDiff(exdStr) : null;
    var exNames = Object.keys(dm.exams || {}).filter(function (k) { return !dm.exams[k].archived; });

    /* 区块1：顶部总览栏（倒计时卡可点击改时间 + 考试切换/新增） */
    var countdownHtml;
    if (exd == null) {
      countdownHtml = '<div class="li-sub">未设置考试时间</div><button class="btn small plain" data-action="set-exam-date" style="margin-top:8px;">设置考试时间</button>';
    } else if (exd < 0) {
      countdownHtml = '<div class="li-sub" style="color:var(--danger);">该考试已结束</div><button class="btn small plain" data-action="set-exam-date" style="margin-top:8px;">修改时间</button>';
    } else {
      countdownHtml = '<div class="countdown"><span class="cd-num">' + exd + '</span><span class="cd-label">天 · ' + esc(exdStr) + "</span></div>" +
        (exd <= 30 ? '<div class="li-sub" style="color:var(--danger);margin-top:6px;">距离考试不足 30 天，进入冲刺阶段</div>' : "") +
        '<button class="btn small plain" data-action="set-exam-date" style="margin-top:8px;">修改考试时间</button>';
    }
    html += '<div class="grid grid-2" style="grid-template-columns:1.4fr 1fr;align-items:stretch;">' +
      '<div class="card tint-blue"><div class="card-head"><h3>📅 ' + esc(dm.activeExam || "考研英语") + ' 倒计时</h3></div>' + countdownHtml + "</div>" +
      '<div class="card"><div class="card-head"><h3>🎯 切换考试</h3></div>' +
      '<select id="examSwitch" data-action="set-exam" style="width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;background:#fff;">' +
      exNames.map(function (k) { return '<option value="' + esc(k) + '"' + ((dm.activeExam || "") === k ? " selected" : "") + ">" + esc(k) + "</option>"; }).join("") +
      '</select>' +
      '<button class="btn small plain" data-action="add-exam" style="margin-top:8px;width:100%;">＋ 新增考试（专四/专八/雅思…）</button>' +
      '<button class="btn small ghost" data-action="go-view" data-view="cet-exams" style="margin-top:6px;width:100%;">🗂 考试管理（归档/删除）</button>' +
      '<div class="li-sub" style="margin-top:6px;">切换不会删除历史数据，各考试进度与生词本独立</div></div></div>';

    /* 区块2：专项导航面板（文字状态，无进度条） */
    var zones = [
      { id: "cet-vocab", emoji: "📖", name: "词汇", desc: "考研核心词汇、遗忘复习、生词本" },
      { id: "cet-listening", emoji: "🎧", name: "听力", desc: "真题听力、精听训练、听力素材" },
      { id: "cet-reading", emoji: "📝", name: "阅读", desc: "真题阅读、长难句、错题记录" },
      { id: "cet-writing", emoji: "✍️", name: "写作", desc: "范文、模板、AI 批改、作文素材" },
      { id: "cet-translation", emoji: "🌐", name: "翻译", desc: "真题翻译练习、句式积累" },
      { id: "cet-speaking", emoji: "🗣️", name: "口语", desc: "AI 口语对话练习" }
    ];
    html += '<div class="card"><div class="card-head"><h3>🧩 专项导航</h3><span class="hint">点击卡片进入对应专区</span></div>' +
      '<div class="grid grid-3">' + zones.map(function (z) {
        var s = examSubj(dm, z.name);
        return '<div class="card" style="margin-bottom:0;border-left:3px solid var(--accent);"><div class="card-head"><h3 style="font-size:15px;">' + z.emoji + " " + esc(z.name) + ' 模块</h3></div>' +
          '<div class="li-sub" style="margin-bottom:8px;">' + esc(z.desc) + "</div>" +
          '<div class="li-sub" style="margin-bottom:10px;">状态：<span class="tag">' + esc(progressText(s ? s.progress : 0)) + "</span></div>" +
          '<button class="btn small block" data-action="go-view" data-view="' + z.id + '">打开' + esc(z.name) + "专区</button></div>";
      }).join("") + "</div></div>";

    /* 区块3：学习状态（极简文字摘要，无图表） */
    var weekLog = (d.studyLog || []).filter(function (x) { var dd = daysDiff(x.date); return dd != null && dd >= 0 && dd <= 6 && x.domainId === "cet"; });
    var weekMin = weekLog.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    html += '<div class="grid grid-2">' +
      card(cardHead("⏱ 本周学习", "文字摘要", "stats"),
        '<div class="li-sub" style="margin-bottom:8px;">本周累计学习 ' + fmtMin(weekMin) + "，打卡 " + weekLog.length + " 天</div>" +
        '<button class="btn small block" data-action="punch" data-domain="cet">⏱ 打卡学习</button>' +
        '<div class="li-sub" style="margin-top:8px;">打卡时选择学习内容标签，对应科目进度自动小幅累加。</div>' +
        '<button class="btn small ghost" data-action="go-view" data-view="cet-stats" style="margin-top:8px;">📈 查看统计回顾（热力图/图表）</button>') +
      card(cardHead("📒 生词本", "与当前考试独立存储", "wordbook"),
        (function () {
          var wb = examWordbook(dm);
          var wP = wb.filter(function (w) { return !w.mastered; }).length;
          var wM = wb.filter(function (w) { return w.mastered; }).length;
          var wRecent = wb.slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; }).slice(0, 3);
          return '<div class="li-sub" style="margin-bottom:8px;">待复习 ' + wP + " ｜ 已掌握 " + wM + "</div>" +
            (wRecent.length === 0 ? '<div class="li-sub" style="margin-bottom:8px;">还没有生词</div>' :
              '<div class="list" style="margin-bottom:8px;">' + wRecent.map(function (w) {
                return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(w.word) + "</div>" +
                  '<div class="li-sub">' + esc((w.meaning || "").slice(0, 30)) + "</div></div></div>";
              }).join("") + "</div>") +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
            '<button class="btn small" data-action="go-view" data-view="cet-wordbook">前往完整生词本</button>' +
            '<button class="btn small plain" data-action="add-word" data-domain="cet">快速添加生词</button></div>';
        })()) +
      "</div>";

    /* 区块4：内置查词插件 */
    html += card(cardHead("🔍 单词查询", "内置词库，离线可用，可一键加入生词本", "dict"),
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
      '<input id="dictInput" placeholder="输入英文单词或短语…" style="flex:1;min-width:180px;padding:9px 12px;border:1px solid var(--border);border-radius:8px;">' +
      '<button class="btn" data-action="lookup-word">查询</button></div>' +
      '<div id="dictResult" style="margin-top:10px;"></div>' +
      '<div class="li-sub" style="margin-top:8px;">词库来源：ECDICT 开源词典（GitHub 免费项目）高频词精简版；查询后可将单词一键加入当前考试的独立生词本。</div>');

    /* 区块5：AI 英语工具箱 */
    var hasKey = !!(d.settings.apiKey);
    var tools = [
      { id: "ai", emoji: "🧠", name: "AI 答疑", desc: "英语题目答疑" },
      { id: "cet-writing", emoji: "✍️", name: "作文批改", desc: "粘贴作文，AI 修改打分润色" },
      { id: "cet-speaking", emoji: "💬", name: "口语对话", desc: "AI 口语练习会话" },
      { id: "cet-translation", emoji: "🌐", name: "翻译工具", desc: "文本翻译" }
    ];
    html += card(cardHead("🧰 AI 英语工具箱", hasKey ? "AI 已启用" : "配置 AI 密钥后启用", "ai-tools"),
      '<div class="grid grid-4">' + tools.map(function (t) {
        return '<div class="card" style="margin-bottom:0;' + (hasKey ? "" : "opacity:0.55;") + '"><div class="card-head"><h3 style="font-size:15px;">' + t.emoji + " " + esc(t.name) + '</h3></div>' +
          '<div class="li-sub" style="margin-bottom:10px;">' + esc(t.desc) + "</div>" +
          (hasKey ? '<button class="btn small block" data-action="go-view" data-view="' + t.id + '">使用</button>'
            : '<button class="btn small block plain" data-action="go-view" data-view="' + t.id + '">查看（未启用）</button>') + "</div>";
      }).join("") + "</div>" +
      (!hasKey ? '<div class="li-sub" style="margin-top:10px;">未配置 API 密钥，AI 功能置灰。到「设置与数据 → AI 配置」填入密钥后启用；基础打卡、生词、查词功能不受影响。</div>' : ""));

    /* 区块6：关联资料 */
    var cetRes = (d.resources || []).filter(function (r) { return r.domainId === "cet"; });
    html += card(cardHead("📎 关联学习资料", cetRes.length + " 份", "resources"),
      cetRes.length === 0 ? empty("还没有关联资料", "点下方新增，或到资料库选择关联到英语学习") :
        '<div class="list">' + cetRes.slice(0, 6).map(function (r) {
          return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(r.title) + "</div>" +
            '<div class="li-sub">' + (r.platform ? esc(r.platform) + " · " : "") + (r.status || "未看") + "</div></div>" +
            (r.url ? '<a class="btn small plain" href="' + esc(r.url) + '" target="_blank" rel="noopener">打开</a>' : "") + "</div>";
        }).join("") + "</div>") +
      '<button class="btn ghost small" data-action="add-resource" style="margin-top:10px;">新增资料</button>';

    return html;
  }

  /* ==================== 二级概览页：考研备考 ==================== */
  function kyActive(dm) {
    if (!dm || !dm.schemes) return null;
    var list = dm.schemes.list || [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === dm.schemes.activeId) return list[i]; }
    return list[0] || null;
  }
  function kyExamDate(sc) {
    if (sc && sc.examDate) return sc.examDate;
    var W = window.W;
    if (W && W.settings && W.settings.kaoyanDate) return W.settings.kaoyanDate;
    var y = new Date().getFullYear();
    var d = lastButOneSaturday(y, 11);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    if (d < today) d = lastButOneSaturday(y + 1, 11);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function kySubjectName(sc, sid) {
    var s = (sc.subjects || []).filter(function (x) { return x.id === sid; })[0];
    return s ? s.name : "";
  }
  function kyStageName(id) {
    var map = { base: "基础阶段", enhance: "强化阶段", sprint: "冲刺阶段", replay: "复试阶段" };
    return map[id] || "未知阶段";
  }
  function kaoyanOverview(dm) {
    var W = window.W, d = W.data;
    var html = "";
    var sc = kyActive(dm);
    if (!sc) {
      html += card(cardHead("🎓 考研备考", "暂未创建备考方案", "empty"),
        '<div class="li-sub" style="margin-bottom:12px;">创建一套备考方案，开始你的考研旅程。</div>' +
        '<button class="btn" data-action="ky-scheme-create">新建备考方案</button>');
      return html;
    }
    var exdStr = kyExamDate(sc);
    var exd = exdStr ? daysDiff(exdStr) : null;
    var archived = !!sc.archived;

    /* 区块1：方案 + 倒计时（浅金黄主题，复用全局倒计时逻辑） */
    html += '<div class="card tint-gold"><div class="card-head"><h3>🎓 ' + esc(sc.name) + (archived ? ' <span class="tag">已归档</span>' : "") + '</h3><span class="hint">' + esc(kyStageName(sc.stage)) + "</span></div>" +
      '<div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;">' +
      '<span class="cd-num" style="font-size:30px;color:#F5B041;">' + (exd != null && exd >= 0 ? exd : "--") + '</span><span class="cd-label">天 · ' + esc(exdStr || "未设置") + "</span>" +
      '<span class="tag" style="background:#FCF5E5;color:#B07D0E;">当前阶段：' + esc(kyStageName(sc.stage)) + "</span></div>" +
      (exd != null && exd < 0 ? '<div class="li-sub" style="margin-top:8px;color:var(--danger);">✅ 本套备考考试已结束，可以归档本方案</div>' +
        (archived ? "" : '<button class="btn small" data-action="ky-archive-scheme" style="margin-top:8px;">归档方案</button>') : "") +
      (exd != null && exd >= 0 && exd <= 30 ? '<div class="li-sub" style="margin-top:8px;color:var(--danger);">距离考试不足 30 天，进入冲刺阶段</div>' : "") +
      '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">' +
      '<button class="btn small plain" data-action="ky-scheme-switch">切换备考方案</button>' +
      '<button class="btn small plain" data-action="ky-set-date">修改考试时间</button>' +
      '<button class="btn small plain" data-action="ky-stage-switch">切换备考阶段</button></div></div>';

    /* 区块2：今日优先任务（最高优先级） */
    var dailyTasks = (sc.tasks || []).filter(function (t) { return t.type === "daily" && !t.done; });
    html += card(cardHead("📌 今日优先任务", "今日必做（最多展示 5 条）", "daily"),
      dailyTasks.length === 0
        ? '<div class="li-sub" style="margin-bottom:10px;">🎉 今日暂无待完成任务，可以去任务页面添加任务</div>' +
          '<button class="btn small" data-action="go-view" data-view="ky-tasks">去添加任务</button>'
        : '<div class="list">' + dailyTasks.slice(0, 5).map(function (t) {
            var sn = kySubjectName(sc, t.subjectId);
            return '<div class="task-item" data-action="ky-task-toggle" data-id="' + esc(t.id) + '">' +
              '<span class="task-check">' + ic("check") + "</span>" +
              '<span class="task-title" style="font-weight:400;">' + esc(t.name) + "</span>" +
              '<span class="tag">' + esc(sn) + (t.costMinutes ? " · " + t.costMinutes + " 分钟" : "") + "</span></div>";
          }).join("") + "</div>" +
          '<button class="btn small ghost" data-action="go-view" data-view="ky-tasks" style="margin-top:10px;">查看全部领域任务</button>');

    /* 区块3：科目概览（纯文字） */
    var subjSummary = (sc.subjects || []).map(function (s) {
      var st = (sc.tasks || []).filter(function (t) { return t.subjectId === s.id; });
      var done = st.filter(function (t) { return t.done; }).length;
      return '<div class="li-sub">' + esc(s.name) + "：已完成 " + done + " / " + st.length + " 项任务</div>";
    }).join("");
    html += card(cardHead("📘 科目概览", "纯文字摘要", "subjects"),
      (subjSummary || '<div class="li-sub">暂无科目</div>') +
      '<button class="btn small ghost" data-action="go-view" data-view="ky-subjects" style="margin-top:10px;">查看科目详情</button>');

    /* 区块4：本周计划摘要 */
    var wk = (sc.tasks || []).filter(function (t) { return t.type === "weekly"; });
    var wkDone = wk.filter(function (t) { return t.done; }).length;
    var weekLog = (d.studyLog || []).filter(function (x) { var dd = daysDiff(x.date); return dd != null && dd >= 0 && dd <= 6 && x.domainId === "kaoyan"; });
    var weekMin = weekLog.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    html += card(cardHead("📅 本周计划", "周任务与时长", "weekly"),
      '<div class="li-sub" style="margin-bottom:10px;">本周共 ' + wk.length + " 项任务 ｜ 已完成 " + wkDone + " / " + wk.length + "；本周累计学习：" + fmtMin(weekMin) + "</div>" +
      '<button class="btn small ghost" data-action="go-view" data-view="ky-weekly">打开本周计划</button>');

    /* 区块5：备考资料库摘要 */
    var files = sc.files || [];
    html += card(cardHead("📂 备考资料库", "关联文件与笔记", "files"),
      '<div class="li-sub" style="margin-bottom:10px;">已关联 ' + files.length + " 份备考资料" + (files.length ? " ｜ 最近资料：" + esc(files[files.length - 1].title) : "") + "</div>" +
      '<button class="btn small ghost" data-action="go-view" data-view="ky-files">管理备考资料</button>');

    /* 区块6：学习数据摘要（仅文字） */
    var monthLog = (d.studyLog || []).filter(function (x) { return x.domainId === "kaoyan" && x.date.indexOf(todayStr().slice(0, 7)) === 0; });
    var monthH = Math.round(monthLog.reduce(function (s, x) { return s + (x.minutes || 0); }, 0) / 60 * 10) / 10;
    html += card(cardHead("📊 学习统计", "仅文字摘要，图表在仪表盘", "stats"),
      '<div class="li-sub" style="margin-bottom:10px;">本周打卡 ' + weekLog.length + " 天；本月累计学习：" + monthH + " 小时</div>" +
      '<button class="btn small ghost" data-action="go-view" data-view="ky-stats">进入统计仪表盘</button>');
    return html;
  }

  /* ==================== 三级专区 ==================== */
  function kySubjects(dm) {
    var sc = kyActive(dm);
    var html = backBar("domain:kaoyan", "考研备考");
    html += card(cardHead("📊 科目详情总览", "任务完成统计", "subjects"),
      '<button class="btn ghost small" data-action="ky-subject-add" style="margin-bottom:10px;">＋ 新增科目</button>' +
      '<div class="list">' + (sc.subjects || []).map(function (s) {
        var st = (sc.tasks || []).filter(function (t) { return t.subjectId === s.id; });
        var done = st.filter(function (t) { return t.done; }).length;
        var em = s.name.indexOf("数学") >= 0 ? "📐" : s.name.indexOf("英语") >= 0 ? "📖" : s.name.indexOf("政治") >= 0 ? "📜" : (s.custom ? "📁" : "🔬");
        return '<div class="list-item" style="align-items:flex-start;">' +
          '<div class="li-main"><div class="li-title">' + em + " " + esc(s.name) + "</div>" +
          '<div class="li-sub">总任务 ' + st.length + " 项 ｜ 已完成 " + done + " 项" + (s.custom ? " ｜ 自定义科目" : "") + "</div></div>" +
          (s.custom ? '<button class="btn small danger plain" data-action="ky-subject-del" data-id="' + esc(s.id) + '">删除</button>' : "") + "</div>";
      }).join("") + "</div>" +
      '<button class="btn small plain" data-action="ky-import-template" style="margin-top:10px;">导入当前阶段任务模板</button>');
    return html;
  }
  function kyTasks(dm) {
    var sc = kyActive(dm);
    var html = backBar("domain:kaoyan", "考研备考");
    var archived = !!sc.archived;
    var types = { daily: "每日必做", weekly: "周计划任务", longterm: "长期领域任务" };
    html += card(cardHead("✅ 全部领域任务", "三类任务管理", "tasks"),
      (!archived ? '<button class="btn ghost small" data-action="ky-task-add" style="margin-bottom:10px;">＋ 新增任务</button>'
        : '<div class="li-sub" style="margin-bottom:10px;">方案已归档，仅可查看历史（新增按钮已置灰）</div>') +
      '<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' +
      '<button class="btn small plain" data-action="ky-import-template">导入阶段模板</button>' +
      (!archived ? '<button class="btn small plain" data-action="ky-batch-done">批量完成</button>' +
        '<button class="btn small plain danger" data-action="ky-batch-del">批量删除</button>' : "") + "</div>" +
      '<div class="list">' + (sc.tasks || []).slice().sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); }).map(function (t) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' +
          (t.done ? '<span style="text-decoration:line-through;color:var(--sub);">' : "") + esc(t.name) + (t.done ? "</span>" : "") + "</div>" +
          '<div class="li-sub">' + esc(kySubjectName(sc, t.subjectId)) + " · " + esc(types[t.type] || t.type) + (t.costMinutes ? " · " + t.costMinutes + " 分钟" : "") + "</div></div>" +
          (!archived ? '<button class="btn small plain" data-action="ky-task-toggle" data-id="' + esc(t.id) + '">' + (t.done ? "恢复" : "完成") + "</button>" +
            '<button class="btn small plain" data-action="ky-task-edit" data-id="' + esc(t.id) + '">' + ic("edit") + "</button>" +
            '<button class="icon-btn" data-action="ky-task-del" data-id="' + esc(t.id) + '">' + ic("trash") + "</button>" : "") + "</div>";
      }).join("") + "</div>");
    return html;
  }
  function kyWeekly(dm) {
    var sc = kyActive(dm);
    var html = backBar("domain:kaoyan", "考研备考");
    var wk = (sc.tasks || []).filter(function (t) { return t.type === "weekly"; });
    html += card(cardHead("🗓 本周计划管理", "周计划任务", "weekly"),
      (!sc.archived ? '<button class="btn ghost small" data-action="ky-task-add" data-type="weekly" style="margin-bottom:10px;">＋ 新增周任务</button>' : "") +
      '<button class="btn small plain" data-action="ky-weekly-gen" style="margin-bottom:10px;">一键生成本周计划（按当前阶段）</button>' +
      (wk.length === 0 ? empty("本周还没有周计划任务", "点上方新增，或一键生成") :
        '<div class="list">' + wk.map(function (t) {
          return '<div class="task-item' + (t.done ? " done" : "") + '" data-action="ky-task-toggle" data-id="' + esc(t.id) + '">' +
            '<span class="task-check">' + ic("check") + "</span>" +
            '<span class="task-title" style="font-weight:400;">' + esc(t.name) + "</span>" +
            '<span class="tag">' + esc(kySubjectName(sc, t.subjectId)) + "</span></div>";
        }).join("") + "</div>"));
    return html;
  }
  function kyFiles(dm) {
    var sc = kyActive(dm);
    var html = backBar("domain:kaoyan", "考研备考");
    var files = sc.files || [];
    html += card(cardHead("📂 备考资料库", files.length + " 份资料", "files"),
      '<button class="btn ghost small" data-action="ky-file-add" style="margin-bottom:10px;">＋ 关联资料</button>' +
      (files.length === 0 ? empty("还没有备考资料", "关联 PDF、笔记、链接到备考方案") :
        '<div class="list">' + files.map(function (f) {
          return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(f.title) + "</div>" +
            '<div class="li-sub">' + esc(kySubjectName(sc, f.subjectId) || "未分类") + (f.label ? " · " + esc(f.label) : "") + "</div></div>" +
            (f.url ? '<a class="btn small plain" href="' + esc(f.url) + '" target="_blank" rel="noopener">打开</a>' : "") +
            '<button class="icon-btn" data-action="ky-file-del" data-id="' + esc(f.id) + '">' + ic("trash") + "</button></div>";
        }).join("") + "</div>"));
    return html;
  }
  function kyStats(dm) {
    var sc = kyActive(dm);
    var html = backBar("domain:kaoyan", "考研备考");
    html += '<div class="grid grid-2">' +
      card(cardHead("🔥 28 天打卡热力图", "颜色越深学得越久", "heatmap"), heatmap28(function (x) { return x.domainId === "kaoyan"; })) +
      card(cardHead("📈 每周学习时长", "最近 7 天柱状图", "bars"), weekBars(function (x) { return x.domainId === "kaoyan"; })) +
      "</div>";
    html += card(cardHead("📚 各科目任务完成进度", "唯一允许进度条的页面", "subjects"),
      '<div class="list">' + (sc.subjects || []).map(function (s) {
        var st = (sc.tasks || []).filter(function (t) { return t.subjectId === s.id; });
        var done = st.filter(function (t) { return t.done; }).length;
        var pct = st.length ? Math.round(done / st.length * 100) : 0;
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(s.name) + "</div>" +
          '<div class="progress-track" style="margin-top:6px;"><div class="progress-fill" style="width:' + pct + '%;"></div></div>' +
          '<div class="li-sub">' + done + " / " + st.length + " 项（" + pct + "%）</div></div></div>";
      }).join("") + "</div>" +
      '<button class="btn small plain" data-action="ky-export-report" style="margin-top:10px;">导出统计报告（txt）</button>');
    return html;
  }
  function tasksAll() {
    var W = window.W, d = W.data;
    var html = backBar("today", "首页");
    var list = (d.tasks || []).slice().sort(function (a, b) { return (a.done ? 1 : 0) - (b.done ? 1 : 0); });
    html += card(cardHead("✅ 任务管理专区", list.length + " 条任务", "task"),
      '<button class="btn ghost small" data-action="add-task" style="margin-bottom:10px;">' + ic("plus") + "添加任务</button>" +
      (list.length === 0 ? empty("暂无任务") :
        '<div class="list">' + list.map(function (t) {
          return '<div class="task-item' + (t.done ? " done" : "") + '" data-action="toggle-task" data-id="' + esc(t.id) + '">' +
            '<span class="task-check">' + ic("check") + "</span>" +
            '<span class="task-title">' + esc(t.title) + "</span>" +
            '<span class="task-domain">' + esc(domainName(t.domainId)) + "</span>" +
            (t.date ? '<span class="li-meta">' + esc(t.date) + "</span>" : "") +
            (t.date && t.date < todayStr() && !t.done ? '<span class="tag pri-hi">已逾期</span>' : "") +
            '<button class="icon-btn" data-action="edit-task" data-id="' + esc(t.id) + '">' + ic("edit") + "</button>" +
            '<button class="icon-btn" data-action="del-task" data-id="' + esc(t.id) + '">' + ic("trash") + "</button></div>";
        }).join("") + "</div>"));
    return html;
  }
  function cetVocab(dm) {
    var html = backBar("domain:cet", "英语学习");
    var s = examSubj(dm, "词汇");
    html += '<div class="card tint-blue"><div class="card-head"><h3>📖 词汇专区</h3></div>' +
      '<div class="li-sub" style="margin-bottom:8px;">状态：<span class="tag">' + esc(progressText(s ? s.progress : 0)) + "</span> ｜ " + esc(dm.activeExam) + "</div>" +
      '<button class="btn small plain" data-action="update-subject" data-domain="cet" data-subject="词汇">' + ic("edit") + "手动更新进度</button></div>";
    html += card(cardHead("📒 生词浏览", "当前考试：<b>" + esc(dm.activeExam) + "</b> 生词本", "wordbook"),
      '<button class="btn ghost small" data-action="add-word" data-domain="cet" style="margin-bottom:10px;">' + ic("plus") + "添加生词</button>" +
      (examWordbook(dm).length === 0 ? empty("还没有生词") :
        '<div class="list">' + examWordbook(dm).slice().sort(function (a, b) { return (a.mastered ? 1 : 0) - (b.mastered ? 1 : 0); }).map(function (w) {
          return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(w.word) + (w.mastered ? ' <span class="tag state-done">已掌握</span>' : ' <span class="tag state-todo">待复习</span>') + "</div>" +
            '<div class="li-sub">' + esc(w.meaning || "") + (w.note ? " · " + esc(w.note) : "") + "</div></div>" +
            '<button class="btn small ' + (w.mastered ? "plain" : "") + '" data-action="toggle-word" data-domain="cet" data-id="' + esc(w.id) + '">' + ic("check") + (w.mastered ? "已掌握" : "标记掌握") + "</button>" +
            '<button class="icon-btn" data-action="del-word" data-domain="cet" data-id="' + esc(w.id) + '">' + ic("trash") + "</button></div>";
        }).join("") + "</div>"));
    html += card(cardHead("🧠 艾宾浩斯复习", "对抗遗忘的节奏", "eibinghaus"),
      '<p style="font-size:14px;color:var(--sub);line-height:1.8;">按记忆曲线安排复习：当天记住 → 第 1 天复习 → 第 2 天复习 → 第 4 天复习 → 第 7 天复习 → 第 15 天复习 → 第 30 天复习。</p>' +
      '<p style="font-size:14px;color:var(--sub);line-height:1.8;">生词本的「待复习/已掌握」标记配合这个节奏使用：掌握后隔几天回来点一下，确认还记得。</p>' +
      '<button class="btn small plain" data-action="add-word" data-domain="cet">导入 / 记录生词</button>');
    return html;
  }
  function cetGenericZone(dm, zone) {
    var W = window.W, d = W.data;
    var html = backBar("domain:cet", "英语学习");
    var s = examSubj(dm, zone.name);
    var tag = zone.tag || zone.name;
    var relRes = (d.resources || []).filter(function (r) { return r.domainId === "cet" && ((r.tags || []).join(" ") + r.category + r.title).indexOf(tag) >= 0; });
    html += '<div class="card tint-blue"><div class="card-head"><h3>' + zone.emoji + " " + esc(zone.name) + " 专区</h3></div>" +
      '<div class="li-sub" style="margin-bottom:8px;">' + esc(zone.desc) + "</div>" +
      '进度：<span class="tag">' + (s ? (s.progress || 0) : 0) + "%</span> ｜ " + esc(dm.activeExam) + "</div>";
    html += card(cardHead("📚 " + zone.name + "学习素材", relRes.length + " 份", "resources"),
      relRes.length === 0 ? empty("还没有" + zone.name + "相关素材", "在资料库添加素材并打上「" + tag + "」标签，或关联到英语学习") :
        '<div class="list">' + relRes.slice(0, 10).map(function (r) {
          return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(r.title) + "</div>" +
            '<div class="li-sub">' + (r.platform ? esc(r.platform) + " · " : "") + (r.status || "未看") + "</div></div>" +
            (r.url ? '<a class="btn small plain" href="' + esc(r.url) + '" target="_blank" rel="noopener">打开</a>' : "") + "</div>";
        }).join("") + "</div>") +
      '<button class="btn ghost small" data-action="add-resource" style="margin-top:10px;">新增资料</button>';
    html += card(cardHead("⏱ 快速打卡", "打卡自动累加" + zone.name + "进度", "punch"),
      '<button class="btn block" data-action="punch" data-domain="cet">打卡学习（选' + esc(zone.name) + "）</button>" +
      '<div class="li-sub" style="margin-top:8px;">打卡时在弹窗中选择科目「' + esc(zone.name) + "」，对应考试下该科目进度自动 +1%。</div>");
    if (zone.extra) html += zone.extra(dm);
    return html;
  }
  function cetWordbook(dm) {
    var html = backBar("domain:cet", "英语学习");
    var wb = examWordbook(dm);
    html += card(cardHead("📒 完整生词本", "当前考试：<b>" + esc(dm.activeExam) + "</b> ｜ 待复习 " + wb.filter(function (w) { return !w.mastered; }).length + " ｜ 已掌握 " + wb.filter(function (w) { return w.mastered; }).length, "wordbook"),
      '<button class="btn ghost small" data-action="add-word" data-domain="cet" style="margin-bottom:10px;">' + ic("plus") + "添加生词</button>" +
      (wb.length === 0 ? empty("还没有生词", "遇到生词就记下来") :
        '<div class="list">' + wb.slice().sort(function (a, b) { return (a.mastered ? 1 : 0) - (b.mastered ? 1 : 0); }).map(function (w) {
          return '<div class="list-item" style="align-items:flex-start;"><div class="li-main"><div class="li-title">' + esc(w.word) + (w.mastered ? ' <span class="tag state-done">已掌握</span>' : ' <span class="tag state-todo">待复习</span>') + "</div>" +
            '<div class="li-sub">' + esc(w.meaning || "") + (w.note ? " · " + esc(w.note) : "") + "</div></div>" +
            '<button class="btn small ' + (w.mastered ? "plain" : "") + '" data-action="toggle-word" data-domain="cet" data-id="' + esc(w.id) + '">' + ic("check") + (w.mastered ? "已掌握" : "标记掌握") + "</button>" +
            '<button class="icon-btn" data-action="del-word" data-domain="cet" data-id="' + esc(w.id) + '">' + ic("trash") + "</button></div>";
        }).join("") + "</div>") +
      '<button class="btn small plain" data-action="export-words" style="margin-top:10px;">导出当前考试生词本（txt）</button>');
    return html;
  }
  /* 考试管理（归档/删除/设时间） */
  function cetExams(dm) {
    var html = backBar("domain:cet", "英语学习");
    var names = Object.keys(dm.exams || {});
    var act = names.filter(function (k) { return !dm.exams[k].archived; });
    var arc = names.filter(function (k) { return dm.exams[k].archived; });
    html += card(cardHead("🗂 考试管理", "活跃 " + act.length + " ｜ 已归档 " + arc.length, "exams"),
      '<button class="btn ghost small" data-action="add-exam" style="margin-bottom:10px;">＋ 新增考试</button>' +
      '<div class="li-sub" style="margin-bottom:6px;font-weight:600;">活跃考试</div>' +
      (act.length === 0 ? '<div class="li-sub" style="margin-bottom:10px;">暂无活跃考试</div>' :
        '<div class="list">' + act.map(function (k) {
          var ex = dm.exams[k];
          var ed = examDateOf(ex);
          var dd = ed ? daysDiff(ed) : null;
          var builtin = ex.auto && ex.auto !== "custom";
          return '<div class="list-item"><div class="li-main">' +
            '<div class="li-title">' + esc(k) + (dm.activeExam === k ? ' <span class="tag state-doing">当前</span>' : "") + "</div>" +
            '<div class="li-sub">' + (dd == null ? "未设置日期" : dd < 0 ? "已结束" : "剩 " + dd + " 天 · " + esc(ed)) + " ｜ 生词 " + (ex.wordbook || []).length + " 个</div></div>" +
            '<button class="btn small plain" data-action="set-exam-date" data-exam="' + esc(k) + '">时间</button>' +
            (dm.activeExam !== k ? '<button class="btn small plain" data-action="set-exam" data-exam="' + esc(k) + '">设为当前</button>' : "") +
            '<button class="btn small plain" data-action="archive-exam" data-v="' + esc(k) + '">归档</button>' +
            (!builtin ? '<button class="btn small danger plain" data-action="del-exam" data-v="' + esc(k) + '">删除</button>' : "") + "</div>";
        }).join("") + "</div>") +
      (arc.length ? '<div class="li-sub" style="margin:12px 0 6px;font-weight:600;">已归档（回看旧数据）</div>' +
        '<div class="list">' + arc.map(function (k) {
          var ex = dm.exams[k];
          return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(k) + "</div>" +
            '<div class="li-sub">生词 ' + (ex.wordbook || []).length + " 个</div></div>" +
            '<button class="btn small plain" data-action="restore-exam" data-v="' + esc(k) + '">恢复</button></div>';
        }).join("") + "</div>" : ""));
    return html;
  }
  function cetStats(dm) {
    var html = backBar("domain:cet", "英语学习");
    html += '<div class="grid grid-2">' +
      card(cardHead("📈 本周学习时长", "最近 7 天（英语学习）", "stats"), weekBars(function (x) { return x.domainId === "cet"; })) +
      card(cardHead("🔥 28 天打卡热力图", "颜色越深学得越久", "heatmap"), heatmap28(function (x) { return x.domainId === "cet"; })) +
      "</div>";
    return html;
  }
  function zoneWriting(dm) {
    var W = window.W, d = W.data;
    var hasKey = !!(d.settings.apiKey);
    return card(cardHead("✍️ AI 作文批改", hasKey ? "AI 已启用" : "当前未启用（需配置 AI 密钥）", "ai-writing"),
      '<div class="field"><label>粘贴你的作文</label><textarea id="aiEssay" placeholder="把作文粘贴到这里…" style="min-height:120px;"></textarea></div>' +
      (hasKey ? '<button class="btn block" data-action="ai-essay">提交批改（AI 修改、打分、润色）</button>'
        : '<div class="li-sub">配置 AI 密钥后，这里会调用模型做修改、打分、润色。到「设置与数据 → AI 配置」启用。</div>') +
      '<div class="ai-chat" id="essayResult" style="margin-top:12px;"></div>');
  }
  /* 阅读专区：内置查词快捷框 */
  function zoneReading(dm) {
    return card(cardHead("🔍 阅读查词", "内置词库，遇到生词随时查", "dict"),
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
      '<input id="dictInput2" placeholder="输入单词，回车查询…" style="flex:1;min-width:160px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;">' +
      '<button class="btn small" data-action="lookup-word2">查询</button></div>' +
      '<div id="dictResult2" style="margin-top:10px;"></div>' +
      '<div class="li-sub" style="margin-top:8px;">查到的单词可一键加入「' + esc(dm.activeExam) + '」生词本。</div>');
  }
  function zoneSpeaking(dm) {
    var W = window.W, d = W.data;
    var hasKey = !!(d.settings.apiKey);
    return card(cardHead("🗣️ AI 口语对话", hasKey ? "AI 已启用" : "当前未启用（需配置 AI 密钥）", "ai-speaking"),
      hasKey ? '<div class="ai-chat" id="speakChat"><div class="msg bot">开始口语练习吧，用英文和我对话，我会帮你纠正表达。</div></div>' +
        '<div class="ai-input"><input id="speakInput" placeholder="用英语说点什么…"><button class="btn" data-action="ai-speak">' + ic("send") + "发送</button></div>"
        : '<div class="li-sub">配置 AI 密钥后可开启口语对话练习。到「设置与数据 → AI 配置」启用。</div>');
  }
  function zoneTranslation(dm) {
    var W = window.W, d = W.data;
    var hasKey = !!(d.settings.apiKey);
    return card(cardHead("🌐 翻译工具", hasKey ? "AI 已启用" : "当前未启用（需配置 AI 密钥）", "ai-translate"),
      '<div class="field"><label>输入要翻译的文本</label><textarea id="trText" placeholder="中译英 / 英译中…" style="min-height:80px;"></textarea></div>' +
      (hasKey ? '<button class="btn block" data-action="ai-translate">翻译</button><div class="ai-chat" id="trResult" style="margin-top:12px;"></div>'
        : '<div class="li-sub">配置 AI 密钥后可用。到「设置与数据 → AI 配置」启用。</div>') +
      '<div class="li-sub" style="margin-top:10px;">翻译练习建议：先自己翻，再对比 AI 译文，把好句式记到答疑库。</div>');
  }

  /* ==================== 学业课程 ==================== */
  function coursesView(dm) {
    var W = window.W, d = W.data;
    var days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    var html = "";
    html += card(cardHead("本学期课程", "点击添加课程", "courses"),
      '<button class="btn ghost small" data-action="add-course" data-domain="' + esc(dm.id) + '" style="margin-bottom:10px;">' + ic("plus") + "添加课程</button>" +
      '<div class="list">' + days.map(function (day) {
        var list = (dm.courses || []).filter(function (c) { return c.day === day; });
        if (list.length === 0) return "";
        return '<div style="padding:8px 2px 2px;font-size:13px;color:var(--sub);font-weight:600;">' + day + "</div>" +
          list.map(function (c) {
            return '<div class="list-item"><div style="width:8px;height:8px;border-radius:50%;background:var(--blue);flex-shrink:0;"></div>' +
              '<div class="li-main"><div class="li-title">' + esc(c.name) + "</div>" +
              '<div class="li-sub">' + (c.teacher ? esc(c.teacher) + " · " : "") + (c.place || "") + "</div></div>" +
              '<span class="li-meta">' + esc(c.time || "") + "</span>" +
              '<button class="icon-btn" data-action="edit-course" data-domain="' + esc(dm.id) + '" data-id="' + esc(c.id) + '">' + ic("edit") + "</button>" +
              '<button class="icon-btn" data-action="del-course" data-domain="' + esc(dm.id) + '" data-id="' + esc(c.id) + '">' + ic("trash") + "</button></div>";
          }).join("");
      }).join("") + "</div>");

    var as = (dm.assignments || []).slice().sort(function (a, b) { return a.due > b.due ? 1 : -1; });
    html += card(cardHead("作业与考试", "按截止日期排序", "assignments"),
      '<button class="btn ghost small" data-action="add-assignment" data-domain="' + esc(dm.id) + '" style="margin-bottom:10px;">' + ic("plus") + "添加作业/考试</button>" +
      (as.length === 0 ? empty("还没有作业或考试") :
      '<div class="list">' + as.map(function (a) {
        var dd = daysDiff(a.due);
        var dueTxt = dd == null ? "" : (dd < 0 ? "已逾期 " + (-dd) + " 天" : dd === 0 ? "今天截止" : "还剩 " + dd + " 天");
        return '<div class="list-item' + (a.done ? " done" : "") + '" data-action="toggle-assignment" data-domain="' + esc(dm.id) + '" data-id="' + esc(a.id) + '">' +
          '<span class="task-check">' + ic("check") + "</span>" +
          '<div class="li-main"><div class="li-title' + (a.done ? ' style="text-decoration:line-through;color:var(--sub);"' : "") + '">' + esc(a.title) + "</div>" +
          '<div class="li-sub">' + (a.type || "作业") + (dueTxt ? " · " + dueTxt : "") + "</div></div>" +
          '<span class="li-meta">' + esc(a.due || "") + "</span>" +
          '<button class="icon-btn" data-action="del-assignment" data-domain="' + esc(dm.id) + '" data-id="' + esc(a.id) + '">' + ic("trash") + "</button></div>";
      }).join("") + "</div>"));

    return html;
  }

  /* ==================== 论文写作 ==================== */
  function paperView(dm) {
    var W = window.W, d = W.data;
    var html = "";
    var stages = dm.stages || [];
    var cur = dm.currentStage || 0;
    if (stages.length) {
      html += card(cardHead("论文进度", "当前：" + esc(stages[cur] || ""), "paper-stages"),
        '<div class="timeline">' + stages.map(function (s, i) {
          var cls = i < cur ? "done" : (i === cur ? "current" : "");
          return '<div class="tl-step ' + cls + '"><div class="tl-dot">' + (i < cur ? ic("check") : "") + "</div>" +
            '<div class="tl-label">' + esc(s) + "</div></div>";
        }).join("") + "</div>" +
        '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
        '<button class="btn small plain" data-action="paper-stage" data-domain="' + esc(dm.id) + '" data-dir="-1">' + ic("chevron") + "上一步</button>" +
        '<button class="btn small plain" data-action="paper-stage" data-domain="' + esc(dm.id) + '" data-dir="1">下一步</button>' +
        (dm.deadline ? '<span class="tag" style="margin-left:auto;">截止 ' + esc(dm.deadline) + "</span>" : "") + "</div>");
    }
    var pt = tasksOfDomain(dm.id).filter(function (t) { return !t.done; });
    html += card(cardHead("当前阶段任务", "论文相关待办", "task"),
      pt.length === 0 ? empty("当前没有待办任务") :
      '<div class="list">' + pt.map(taskItem).join("") + "</div>" +
      '<button class="btn ghost small" data-action="add-task" data-domain="' + esc(dm.id) + '">' + ic("plus") + "添加任务</button>");
    html += card(cardHead("参考文献", "论文引用的资料", "refs"),
      '<button class="btn ghost small" data-action="add-ref" data-domain="' + esc(dm.id) + '" style="margin-bottom:10px;">' + ic("plus") + "添加文献</button>" +
      ((dm.refs || []).length === 0 ? empty("还没有文献") :
      '<div class="list">' + dm.refs.map(function (r, i) {
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(r.title) + "</div>" +
          (r.note ? '<div class="li-sub">' + esc(r.note) + "</div>" : "") + "</div>" +
          (r.url ? '<a class="btn small plain" href="' + esc(r.url) + '" target="_blank" rel="noopener">打开</a>' : "") +
          '<button class="icon-btn" data-action="del-ref" data-domain="' + esc(dm.id) + '" data-id="' + esc(r.id) + '">' + ic("trash") + "</button></div>";
      }).join("") + "</div>"));
    return html;
  }

  /* ==================== 资料库 ==================== */
  function library() {
    var W = window.W, d = W.data;
    var filterCat = W.ui.libraryCat || "";
    var filterState = W.ui.libraryState || "";
    var filterDom = W.ui.libraryDom || "";
    var kw = (W.ui.libraryKw || "").toLowerCase();
    var list = (d.resources || []).filter(function (r) {
      if (filterCat && r.category !== filterCat) return false;
      if (filterState && r.status !== filterState) return false;
      if (filterDom && r.domainId !== filterDom) return false;
      if (kw) {
        var hay = (r.title + " " + (r.note || "") + " " + (r.tags || []).join(" ") + " " + (r.url || "") + " " + (r.platform || "")).toLowerCase();
        if (hay.indexOf(kw) < 0) return false;
      }
      return true;
    }).slice().sort(function (a, b) { return b.updatedAt > a.updatedAt ? 1 : -1; });

    var cats = ["全部", "课程", "考研", "论文", "课外", "其他"];
    var states = ["全部状态", "未看", "在看", "看完"];
    var html = "";
    html += card("", '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">' +
      '<div class="search-input-wrap" style="margin-bottom:0;flex:1;min-width:200px;">' +
      '<input id="libKw" placeholder="搜索资料…" value="' + esc(kw) + '">' +
      '<button class="btn" data-action="lib-search">' + ic("search") + "</button></div></div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;">' +
      cats.map(function (c) { return '<button class="btn ' + (filterCat === (c === "全部" ? "" : c) ? "" : "plain") + ' small" data-action="lib-cat" data-v="' + esc(c) + '">' + c + "</button>"; }).join("") + "</div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
      states.map(function (s) { return '<button class="btn ' + (filterState === (s === "全部状态" ? "" : s) ? "" : "plain") + ' small" data-action="lib-state" data-v="' + esc(s) + '">' + s + "</button>"; }).join("") + "</div>" +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">' +
      '<button class="btn ' + (filterDom === "" ? "" : "plain") + ' small" data-action="lib-dom" data-v="">全部领域</button>' +
      d.domains.map(function (dm) { return '<button class="btn ' + (filterDom === dm.id ? "" : "plain") + ' small" data-action="lib-dom" data-v="' + esc(dm.id) + '">' + esc(dm.name) + "</button>"; }).join("") + "</div>" +
      '<button class="btn block" data-action="add-resource" style="margin-top:14px;">' + ic("plus") + "新建资料（粘贴链接自动识别平台）</button>");

    html += card(cardHead("全部资料", list.length + " 条", "resources"),
      list.length === 0 ? empty("没有符合条件的资料", "点「新建资料」添加，支持粘贴 B站/网盘/小红书/抖音等链接") :
      '<div class="list">' + list.map(function (r) {
        return '<div class="list-item" style="align-items:flex-start;">' +
          '<div class="li-main"><div class="li-title">' + esc(r.title) + "</div>" +
          '<div class="li-sub">' +
          (r.platform ? '<span class="tag platform">' + esc(r.platform) + "</span>" : "") +
          stateTag(r.status) +
          '<span class="tag">' + esc(r.category || "其他") + "</span>" +
          (r.domainId ? '<span class="tag">' + esc(domainName(r.domainId)) + "</span>" : "") +
          (r.tags || []).map(function (t) { return '<span class="tag">#' + esc(t) + "</span>"; }).join("") +
          (r.extractCode ? '<span class="tag">提取码 ' + esc(r.extractCode) + "</span>" : "") +
          "</div>" +
          (r.note ? '<div class="li-sub">' + esc(r.note) + "</div>" : "") +
          "</div>" +
          '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' +
          (r.url ? '<a class="btn small plain" href="' + esc(r.url) + '" target="_blank" rel="noopener">' + ic("link") + "打开</a>" : "") +
          '<button class="btn small plain" data-action="set-status" data-id="' + esc(r.id) + '">' + ic("refresh") + "状态</button>" +
          '<div style="display:flex;gap:2px;">' +
          '<button class="icon-btn" data-action="edit-resource" data-id="' + esc(r.id) + '">' + ic("edit") + "</button>" +
          '<button class="icon-btn" data-action="del-resource" data-id="' + esc(r.id) + '">' + ic("trash") + "</button></div></div></div>";
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 收集箱 ==================== */
  function inbox() {
    var W = window.W, d = W.data;
    var pending = (d.inbox || []).filter(function (x) { return x.status === "待分拣"; });
    var done = (d.inbox || []).filter(function (x) { return x.status === "已分拣"; });
    var html = "";
    html += card("", '<button class="btn block" data-action="add-inbox">' + ic("plus") + "添加收集（文字 / 链接 / 任务 / 文件）</button>" +
      '<div class="ai-banner" style="margin-top:14px;">' + ic("spark") +
      '<span>粘贴 B站 / 网盘 / 小红书 / 抖音等链接会自动识别平台。AI 会给出去向建议，<b>确认后才会移动</b>，不会擅自搬走内容。</span></div>');

    html += card(cardHead("待分拣", pending.length + " 条，决定放哪", "inbox"),
      pending.length === 0 ? empty("收集箱是空的", "想到什么先扔进来，稍后统一整理") :
      '<div class="list">' + pending.map(function (x) {
        return '<div class="list-item" style="align-items:flex-start;">' +
          '<div class="li-main"><div class="li-title">' + esc(x.content || x.url || "无标题") + "</div>" +
          '<div class="li-sub">' +
          (x.platform ? '<span class="tag platform">' + esc(x.platform) + "</span>" : "") +
          '<span class="tag">' + esc(x.type || "文字") + "</span>" +
          '<span class="tag">' + esc(x.createdAt || "") + "</span></div>" +
          (x.suggestion ? '<div class="li-sub" style="color:var(--accent);">AI 建议：' + esc(x.suggestion) + "</div>" : "") +
          "</div>" +
          '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' +
          '<button class="btn small" data-action="sort-inbox" data-id="' + esc(x.id) + '">' + ic("check") + "确认去向</button>" +
          '<button class="btn small plain" data-action="del-inbox" data-id="' + esc(x.id) + '">' + ic("trash") + "丢弃</button></div></div>";
      }).join("") + "</div>" +
      (pending.length === 0 ? "" : '<button class="btn ghost small" data-action="ai-sort-all" style="margin-top:10px;">' + ic("spark") + "让 AI 批量建议去向</button>"));

    html += card(cardHead("已分拣", done.length + " 条", "inbox-done"),
      done.length === 0 ? empty("还没有已分拣的内容") :
      '<div class="list">' + done.slice(0, 10).map(function (x) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(x.content || x.url || "无标题") + "</div>" +
          '<div class="li-sub">已移动到 ' + esc(x.movedTo || "资料库") + "</div></div></div>";
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 搜索 ==================== */
  function search() {
    var W = window.W, d = W.data;
    var kw = (W.ui.searchKw || "").trim().toLowerCase();
    if (!kw) {
      return '<div class="card"><div class="search-input-wrap"><input id="searchInput" placeholder="输入关键词，搜索全部内容…">' +
        '<button class="btn" data-action="do-search">' + ic("search") + "</button></div>" +
        empty("输入关键词开始搜索", "资料、任务、错题、答疑、复盘、课程、账号、收集箱都能搜到") + "</div>";
    }
    var out = "";
    function push(group, items, fn) {
      if (!items.length) return;
      out += '<div class="search-group-title">' + group + "（" + items.length + "）</div><div class=\"list\">" + items.map(fn).join("") + "</div>";
    }
    push("资料", (d.resources || []).filter(function (r) {
      return (r.title + " " + (r.note || "") + " " + (r.tags || []).join(" ") + " " + (r.url || "") + " " + (r.platform || "")).toLowerCase().indexOf(kw) >= 0;
    }), function (r) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(r.title) + "</div><div class=\"li-sub\">" + (r.platform || "") + " · " + esc(r.category || "") + "</div></div>" +
        '<button class="btn small plain" data-action="open-library">查看</button></div>';
    });
    push("任务", (d.tasks || []).filter(function (t) { return (t.title + " " + (t.note || "")).toLowerCase().indexOf(kw) >= 0; }), function (t) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(t.title) + "</div><div class=\"li-sub\">" + esc(domainName(t.domainId)) + " · " + esc(t.date || "未定日期") + "</div></div></div>";
    });
    push("错题", (d.mistakes || []).filter(function (m) { return (m.title + " " + (m.answer || "") + " " + (m.reason || "") + " " + (m.subject || "")).toLowerCase().indexOf(kw) >= 0; }), function (m) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(m.title) + "</div><div class=\"li-sub\">" + esc(m.subject || "") + " · " + esc(m.reason || "") + "</div></div>" +
        '<button class="btn small plain" data-action="open-mistakes">查看</button></div>';
    });
    push("答疑", (d.qa || []).filter(function (q) { return (q.question + " " + (q.answer || "") + " " + (q.subject || "")).toLowerCase().indexOf(kw) >= 0; }), function (q) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(q.question) + "</div><div class=\"li-sub\">" + esc(q.subject || "") + "</div></div>" +
        '<button class="btn small plain" data-action="open-qa">查看</button></div>';
    });
    push("复盘", (d.reviews || []).filter(function (r) { return (r.date + " " + (r.done || "") + " " + (r.undone || "") + " " + (r.adjust || "")).toLowerCase().indexOf(kw) >= 0; }), function (r) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(r.date) + " " + (r.type === "weekly" ? "周复盘" : "日复盘") + "</div></div>" +
        '<button class="btn small plain" data-action="open-reviews">查看</button></div>';
    });
    push("课程与作业", (function () {
      var arr = [];
      d.domains.forEach(function (dm) {
        (dm.courses || []).forEach(function (c) { if ((c.name + " " + (c.teacher || "")).toLowerCase().indexOf(kw) >= 0) arr.push({ t: c.name + "（课程）", sub: c.day + " " + (c.time || "") }); });
        (dm.assignments || []).forEach(function (a) { if ((a.title + " " + (a.type || "")).toLowerCase().indexOf(kw) >= 0) arr.push({ t: a.title + "（" + (a.type || "作业") + "）", sub: a.due || "" }); });
      });
      return arr;
    })(), function (x) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(x.t) + "</div><div class=\"li-sub\">" + esc(x.sub) + "</div></div></div>";
    });
    push("账号", (d.accounts || []).filter(function (a) { return (a.platform + " " + a.name + " " + (a.note || "")).toLowerCase().indexOf(kw) >= 0; }), function (a) {
      return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(a.platform) + " · " + esc(a.name) + "</div><div class=\"li-sub\">" + esc(a.note || "") + "</div></div></div>";
    });
    push("收集箱", (d.inbox || []).filter(function (x) { return (x.content + " " + (x.url || "")).toLowerCase().indexOf(kw) >= 0; }), function (x) {
      return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(x.content || x.url) + "</div><div class=\"li-sub\">" + esc(x.status) + "</div></div></div>";
    });

    return '<div class="card"><div class="search-input-wrap"><input id="searchInput" value="' + esc(kw) + '" placeholder="继续搜索…">' +
      '<button class="btn" data-action="do-search">' + ic("search") + "</button></div>" +
      (out ? out : empty("没有找到「" + esc(kw) + "」相关的内容", "换个关键词试试")) + "</div>";
  }

  /* ==================== AI 帮手 ==================== */
  function ai() {
    var W = window.W, d = W.data;
    var hasKey = !!(d.settings.apiKey);
    var html = "";
    html += '<div class="ai-banner">' + ic("spark") +
      "<span><b>AI 帮手状态</b>：本地规则能力（收集箱建议 / 周复盘草稿 / 学习摘要）已启用，免费。<br>" +
      (hasKey ? "对话式 AI：已配置 API，可以答疑和生成复习资料。" : "对话式 AI：<b>当前未启用</b>——在「设置」中配置 API 密钥后启用（密钥只存本机浏览器）。") + "</span></div>";

    /* 本地工具 */
    html += card(cardHead("本地工具", "免费可用，不依赖外部 API", "ai-local"), '<div style="display:flex;flex-direction:column;gap:10px;">' +
      '<button class="btn plain block" data-action="ai-sort-all">' + ic("inbox") + "给收集箱待分拣内容批量建议去向</button>" +
      '<button class="btn plain block" data-action="ai-draft-week">' + ic("refresh") + "生成本周复盘草稿（汇总学习数据）</button>" +
      '<button class="btn plain block" data-action="ai-summary">' + ic("trending") + "生成学习情况摘要（本月各领域时长）</button></div>");

    /* 对话 */
    html += card(cardHead("对话式 AI", hasKey ? "已启用" : "当前未启用", "ai-chat"),
      '<div class="ai-chat" id="aiChat">' +
      (hasKey ? '<div class="msg bot">你好，我是你的 AI 帮手。可以问我学习问题、让我帮你安排任务、生成复习提纲。注意：我只会修改你确认过的内容。</div>' :
        '<div class="msg bot">对话式 AI 当前未启用。启用方法：设置与数据 → AI 配置 → 填入 API 地址、模型和密钥。未配置时，上方本地工具仍可正常使用。</div>') +
      "</div>" +
      (hasKey ? '<div class="ai-input"><input id="aiInput" placeholder="输入问题…"><button class="btn" data-action="ai-send">' + ic("send") + "</button></div>" : ""));

    return html;
  }

  /* ==================== 账号管理 ==================== */
  function accounts() {
    var W = window.W, d = W.data;
    var list = d.accounts || [];
    var html = "";
    html += card(cardHead("我的平台账号", "只记录公开信息，不存密码", "accounts"),
      '<button class="btn ghost small" data-action="add-account" style="margin-bottom:10px;">' + ic("plus") + "添加账号</button>" +
      (list.length === 0 ? empty("还没有记录账号", "把你在用的 B站 / 小红书 / 抖音等账号记下来") :
      '<div class="list">' + list.map(function (a) {
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(a.platform) + " · " + esc(a.name) + "</div>" +
          (a.note ? '<div class="li-sub">' + esc(a.note) + "</div>" : "") + "</div>" +
          '<button class="icon-btn" data-action="del-account" data-id="' + esc(a.id) + '">' + ic("trash") + "</button></div>";
      }).join("") + "</div>") +
      '<div class="li-sub" style="margin-top:12px;color:var(--danger);">安全提醒：这里只存平台和账号名这类公开信息。密码请使用浏览器自带密码管理器，不要写在网页里。</div>');

    return html;
  }

  /* ==================== 健康 ==================== */
  function health() {
    var W = window.W, d = W.data;
    var h = d.health || {};
    var t = todayStr();
    var sleep = (h.sleep || []).filter(function (x) { return x.date === t; })[0];
    var sport = (h.sport || []).filter(function (x) { return x.date === t; })[0];
    var state = (h.state || []).filter(function (x) { return x.date === t; })[0];
    var html = "";

    html += '<div class="today-grid">';

    html += card(cardHead("今日健康", "记录当天状态", "health"),
      '<div class="list">' +
      '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">睡眠</div>' +
      '<div class="li-sub">' + (sleep ? "睡了 " + fmtMin(sleep.minutes) + "（" + sleep.bed + " → " + sleep.wake + "）" : "还没记录") + "</div></div>" +
      '<button class="btn small plain" data-action="log-sleep">' + ic("moon") + (sleep ? "修改" : "记录") + "</button></div>" +
      '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">运动</div>' +
      '<div class="li-sub">' + (sport ? "已运动：" + esc(sport.type) : "还没记录") + "</div></div>" +
      '<button class="btn small plain" data-action="log-sport">' + ic("activity") + (sport ? "修改" : "记录") + "</button></div>" +
      '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">今日状态</div>' +
      '<div class="li-sub">' + (state ? "精力：" + esc(state.level) : "还没记录") + "</div></div>" +
      '<button class="btn small plain" data-action="log-state">' + ic("sun") + (state ? "修改" : "记录") + "</button></div>" +
      "</div>" +
      '<div class="li-sub" style="margin-top:10px;">记录睡眠和状态后，每周复盘会自动统计健康情况。</div>');

    /* 番茄钟入口（已独立为"专注"页面） */
    html += card(cardHead("专注计时", "已独立为单独页面", "timer"),
      '<p style="font-size:14px;color:var(--sub);margin-bottom:12px;">番茄钟已搬到独立的「专注」页面，那里有更大的计时器和专注统计。</p>' +
      '<button class="btn block" data-action="open-focus">' + ic("timer") + "打开专注页</button>");

    html += "</div>";

    /* 本周统计 */
    var weekSleep = (h.sleep || []).slice(-7);
    var weekSport = (h.sport || []).slice(-7);
    var sleepAvg = weekSleep.length ? Math.round(weekSleep.reduce(function (s, x) { return s + (x.minutes || 0); }, 0) / weekSleep.length) : 0;
    html += card(cardHead("本周健康概览", "最近 7 天记录", "health-stats"),
      '<div class="grid grid-3">' +
      '<div><div class="stat-num">' + (sleepAvg > 0 ? fmtMin(sleepAvg) : "暂无") + "</div><div class=\"stat-label\">平均睡眠（近 " + (weekSleep.length ? weekSleep.length + " 条" : "无记录") + "）</div></div>" +
      '<div><div class="stat-num">' + weekSport.length + "</div><div class=\"stat-label\">近 7 天运动天数</div></div>" +
      '<div><div class="stat-num">' + (h.state || []).length + "</div><div class=\"stat-label\">状态记录总次数</div></div>" +
      "</div>" +
      '<div class="li-sub" style="margin-top:10px;">健康建议：睡眠不足会影响记忆巩固，长期备考请优先保证睡眠；久坐每小时起来活动 5 分钟。</div>');

    /* 久坐提醒设置 */
    html += card(cardHead("提醒设置", "页面打开时生效", "remind"),
      '<div class="field"><label>久坐提醒间隔（分钟，0 为关闭）</label>' +
      '<input id="remindMin" type="number" min="0" max="120" value="' + (h.settings ? (h.settings.remindMin || 50) : 50) + '"></div>' +
      '<button class="btn" data-action="save-remind">' + ic("check") + "保存设置</button>" +
      '<div class="li-sub" style="margin-top:8px;">说明：提醒只在工作台页面打开时生效；手机锁屏或关闭页面后浏览器无法继续提醒，这是所有网页的共同限制。</div>');

    return html;
  }

  /* ==================== 专注（番茄钟独立页） ==================== */
  function focus() {
    var W = window.W, d = W.data;
    var t = todayStr();
    var sessions = (d.focusSessions || []).filter(function (x) { return x.date === t; });
    var todayMin = sessions.reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
    var totalSessions = (d.focusSessions || []).length;
    var html = "";

    /* 圆环计时器 */
    var r = 130, circ = 2 * Math.PI * r;
    html += '<div class="card" style="text-align:center;">' +
      '<div style="position:relative;width:300px;max-width:78vw;margin:0 auto;">' +
      '<svg viewBox="0 0 300 300" style="transform:rotate(-90deg);">' +
      '<circle cx="150" cy="150" r="' + r + '" fill="none" stroke="#EDEFEC" stroke-width="14"></circle>' +
      '<circle id="timerRing" cx="150" cy="150" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="0"></circle>' +
      "</svg>" +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
      '<div class="timer-display" id="timerDisp" style="font-size:52px;">25:00</div>' +
      '<div class="li-sub" id="timerState" style="margin-top:6px;">准备开始</div>' +
      "</div></div>" +
      '<div class="timer-controls">' +
      '<button class="btn small plain" data-action="timer-preset" data-min="25">25 分</button>' +
      '<button class="btn small plain" data-action="timer-preset" data-min="45">45 分</button>' +
      '<button class="btn small plain" data-action="timer-preset" data-min="60">60 分</button></div>' +
      '<div class="timer-controls" style="margin-top:14px;">' +
      '<button class="btn" data-action="timer-toggle" id="timerBtn" style="min-width:120px;">' + ic("play") + "开始</button>" +
      '<button class="btn plain" data-action="timer-reset">' + ic("refresh") + "重置</button></div>" +
      '<div class="li-sub" style="margin-top:12px;">说明：专注完成会自动记录一个番茄；页面打开时有效，手机锁屏会暂停（所有网页的共同限制）。</div></div>';

    /* 今日统计 */
    html += '<div class="grid grid-3">' +
      '<div class="card tint-blue"><div class="stat-num">' + sessions.length + '</div><div class="stat-label">今日番茄</div></div>' +
      '<div class="card tint-yellow"><div class="stat-num">' + Math.round(todayMin / 60) + '<span style="font-size:14px;"> 小时</span></div><div class="stat-label">今日专注</div></div>' +
      '<div class="card tint-green"><div class="stat-num">' + totalSessions + '</div><div class="stat-label">累计番茄</div></div>' +
      "</div>";

    /* 历史 */
    var recent = (d.focusSessions || []).slice().sort(function (a, b) { return b.ts > a.ts ? 1 : -1; }).slice(0, 8);
    html += card(cardHead("专注历史", "最近完成的番茄", "focus-history"),
      recent.length === 0 ? empty("还没有完成的专注", "从第一个 25 分钟开始") :
      '<div class="list">' + recent.map(function (s) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">完成一次 ' + s.minutes + ' 分钟专注</div></div>' +
          '<span class="li-meta">' + esc(s.date) + "</span></div>";
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 学习记录（今日日报） ==================== */
  function activity() {
    var W = window.W, d = W.data;
    var t = todayStr();
    var html = "";
    var entries = [];
    var todayMin = 0;

    /* 聚合今日活动 */
    (d.studyLog || []).forEach(function (x) {
      if (x.date === t) { todayMin += (x.minutes || 0); entries.push({ ts: t + "T" + (x.ts || "12:00"), icon: "flame", text: "学习了 " + domainName(x.domainId) + "：" + (x.subject || "") + " " + fmtMin(x.minutes), type: "打卡" }); }
    });
    (d.tasks || []).forEach(function (x) {
      if (x.done && x.doneAt && String(x.doneAt).indexOf(t) === 0) entries.push({ ts: x.doneAt, icon: "check", text: "完成任务：" + x.title, type: "任务" });
    });
    (d.focusSessions || []).forEach(function (x) {
      if (x.date === t) entries.push({ ts: t + "T" + (x.ts || "12:00"), icon: "timer", text: "完成 " + x.minutes + " 分钟专注", type: "专注" });
    });
    (d.resources || []).forEach(function (x) {
      if (x.createdAt && String(x.createdAt).indexOf(t) === 0) entries.push({ ts: x.createdAt, icon: "folder", text: "新增资料：" + x.title, type: "资料" });
    });
    (d.qa || []).forEach(function (x) {
      if (x.date === t) entries.push({ ts: t + "T12:00", icon: "help", text: "记录答疑：" + x.question, type: "答疑" });
    });
    (d.mistakes || []).forEach(function (x) {
      if (x.date === t) entries.push({ ts: t + "T12:00", icon: "alert", text: "记录错题：" + x.title, type: "错题" });
    });
    (d.reviews || []).forEach(function (x) {
      if (x.date === t) entries.push({ ts: t + "T23:00", icon: "refresh", text: "完成" + (x.type === "weekly" ? "每周" : "每日") + "复盘", type: "复盘" });
    });
    var cetDm = d.domains.filter(function (x) { return x.id === "cet"; })[0];
    if (cetDm && cetDm.exams) {
      Object.keys(cetDm.exams).forEach(function (ek) {
        (cetDm.exams[ek].wordbook || []).forEach(function (x) {
          if (x.date === t) entries.push({ ts: t + "T12:00", icon: "book", text: "记生词：" + x.word, type: "生词" });
        });
      });
    }

    entries.sort(function (a, b) { return a.ts > b.ts ? 1 : -1; });
    var taskDone = entries.filter(function (e) { return e.type === "任务"; }).length;
    var addCount = entries.filter(function (e) { return ["资料", "答疑", "错题", "生词"].indexOf(e.type) >= 0; }).length;

    /* 统计卡 */
    html += '<div class="grid grid-4">' +
      '<div class="card tint-green"><div class="stat-num">' + Math.round(todayMin / 60) + '<span style="font-size:13px;"> 小时</span></div><div class="stat-label">今日学习时长</div></div>' +
      '<div class="card tint-blue"><div class="stat-num">' + taskDone + '</div><div class="stat-label">完成任务</div></div>' +
      '<div class="card tint-yellow"><div class="stat-num">' + entries.filter(function (e) { return e.type === "专注"; }).length + '</div><div class="stat-label">专注番茄</div></div>' +
      '<div class="card tint-pink"><div class="stat-num">' + addCount + '</div><div class="stat-label">新增记录</div></div>' +
      "</div>";

    /* 鼓励语 */
    var streak = calcStreak();
    var praise = "";
    if (todayMin > 0 && taskDone > 0) praise = "今天学得扎实，既有投入又有产出，继续保持这个节奏。";
    else if (todayMin > 0) praise = "今天学习了 " + fmtMin(todayMin) + "，每一步都算数，明天继续。";
    else if (entries.length > 0) praise = "今天有记录就有进步，慢慢来，比较快。";
    else praise = "今天还没开始，现在开始也来得及，打开今日页定个小目标吧。";
    if (streak >= 2) praise += " 连续打卡 " + streak + " 天，这是你自己的节奏。";
    html += '<div class="card tint-yellow"><div class="card-head"><h3>今天小结</h3></div>' +
      '<p style="font-size:15px;line-height:1.8;">' + praise + "</p></div>";

    /* 今日时间线 */
    html += card(cardHead("今日时间线", entries.length + " 条记录", "activity-today"),
      entries.length === 0 ? empty("今天还没有记录", "去打卡、学一会儿，这里会自动汇总你干了什么") :
      '<div class="list">' + entries.map(function (e) {
        return '<div class="list-item"><span class="tag">' + e.type + "</span>" +
          '<div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(e.text) + "</div></div>" +
          '<span class="li-meta">' + (String(e.ts).indexOf("T") >= 0 ? String(e.ts).split("T")[1].slice(0, 5) : "") + "</span></div>";
      }).join("") + "</div>");

    /* 历史（近 7 天） */
    var days = [];
    for (var i = 0; i < 7; i++) {
      var dt = new Date(); dt.setDate(dt.getDate() - i);
      var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      if (key === t) continue;
      var m = (d.studyLog || []).filter(function (x) { return x.date === key; }).reduce(function (s, x) { return s + (x.minutes || 0); }, 0);
      var fs = (d.focusSessions || []).filter(function (x) { return x.date === key; }).length;
      var rev = (d.reviews || []).filter(function (x) { return x.date === key; }).length;
      days.push({ key: key, m: m, fs: fs, rev: rev });
    }
    html += card(cardHead("最近 7 天", "每天的学习情况", "activity-history"),
      '<div class="list">' + days.map(function (x) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(x.key) + "</div></div>" +
          '<span class="li-meta">' + fmtMin(x.m) + (x.fs ? " · " + x.fs + " 番茄" : "") + (x.rev ? " · 有复盘" : "") + "</span></div>";
      }).join("") + "</div>" +
      '<div class="li-sub" style="margin-top:10px;">想不起来昨天干了什么？看这里。记录来自你的打卡、任务、资料、答疑、错题、生词和复盘，不会编造。</div>');

    return html;
  }
  function calcStreak() {
    var W = window.W, d = W.data;
    var logs = {};
    (d.studyLog || []).forEach(function (x) { logs[x.date] = 1; });
    var dt = new Date();
    var n = 0;
    while (true) {
      var key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      if (logs[key]) { n++; dt.setDate(dt.getDate() - 1); }
      else break;
    }
    return n;
  }

  /* ==================== 复盘 ==================== */
  function reviews() {
    var W = window.W, d = W.data;
    var t = todayStr();
    var todayReview = (d.reviews || []).filter(function (r) { return r.date === t && r.type === "daily"; })[0];
    var weekStart = (function () {
      var dt = new Date(); var day = dt.getDay() || 7; dt.setDate(dt.getDate() - day + 1);
      return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
    })();
    var thisWeek = (d.reviews || []).filter(function (r) { return r.date >= weekStart && r.type === "weekly"; })[0];
    var html = "";

    html += card(cardHead("每日复盘", "1 分钟，3 个问题", "daily-review"),
      todayReview ? '<div class="ai-banner">' + ic("check") + "今天已复盘，做得很好。明天继续保持。</div>" +
      '<button class="btn ghost small" data-action="edit-daily-review">查看 / 修改今天的复盘</button>'
      : '<button class="btn block" data-action="add-daily-review">' + ic("edit") + "开始今天的复盘（3 个问题）</button>" +
      '<div class="li-sub" style="margin-top:10px;">复盘是让进步发生的习惯：完成了什么 / 没完成什么及原因 / 明天怎么调整。每天 1 分钟，坚持比完美重要。</div>');

    html += card(cardHead("每周复盘", "AI 汇总数据生成草稿，确认后保存", "weekly-review"),
      thisWeek ? '<div class="ai-banner">' + ic("check") + "本周已复盘：" + esc(thisWeek.date) + "</div>" +
      '<button class="btn ghost small" data-action="edit-weekly-review">查看本周复盘</button>'
      : '<button class="btn block" data-action="ai-draft-week">' + ic("spark") + "用本周数据生成复盘草稿</button>" +
      '<div class="li-sub" style="margin-top:10px;">草稿会汇总：本周各领域学习时长、任务完成情况、打卡天数、健康情况。生成后你可以修改，确认才保存。</div>');

    var list = (d.reviews || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
    html += card(cardHead("复盘历史", list.length + " 次记录", "review-history"),
      list.length === 0 ? empty("还没有复盘记录", "从今天的每日复盘开始") :
      '<div>' + list.map(function (r) {
        return '<div class="review-item"><div class="ri-head"><span class="ri-date">' + esc(r.date) + "</span>" +
          '<span class="ri-type">' + (r.type === "weekly" ? "周复盘" : "日复盘") + "</span>" +
          '<span style="margin-left:auto;">' +
          '<button class="icon-btn" data-action="edit-review" data-id="' + esc(r.id) + '">' + ic("edit") + "</button>" +
          '<button class="icon-btn" data-action="del-review" data-id="' + esc(r.id) + '">' + ic("trash") + "</button></span></div>" +
          (r.done ? '<p style="font-size:13.5px;margin-top:6px;">完成：' + esc(r.done) + "</p>" : "") +
          (r.undone ? '<p style="font-size:13.5px;">未完成：' + esc(r.undone) + "</p>" : "") +
          (r.adjust ? '<p style="font-size:13.5px;color:var(--accent);">调整：' + esc(r.adjust) + "</p>" : "") +
          "</div>";
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 错题本 ==================== */
  function mistakes() {
    var W = window.W, d = W.data;
    var subj = W.ui.mistakeSubj || "";
    var list = (d.mistakes || []).filter(function (m) { return !subj || m.subject === subj; }).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
    var subjects = [];
    (d.mistakes || []).forEach(function (m) { if (m.subject && subjects.indexOf(m.subject) < 0) subjects.push(m.subject); });
    var html = "";
    html += card("", '<button class="btn block" data-action="add-mistake">' + ic("plus") + "记录一道错题</button>" +
      (subjects.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">' +
      '<button class="btn ' + (subj === "" ? "" : "plain") + ' small" data-action="mistake-subj" data-v="">全部</button>' +
      subjects.map(function (s) { return '<button class="btn ' + (subj === s ? "" : "plain") + ' small" data-action="mistake-subj" data-v="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>" : ""));

    html += card(cardHead("错题列表", list.length + " 道 · 已复习 " + list.filter(function (m) { return m.reviewed; }).length + " 道", "mistakes"),
      list.length === 0 ? empty("还没有错题", "错题是复习的宝藏，看到就记下来") :
      '<div class="list">' + list.map(function (m) {
        return '<div class="list-item" style="align-items:flex-start;">' +
          '<div class="li-main"><div class="li-title">' + esc(m.title) + "</div>" +
          '<div class="li-sub">' +
          '<span class="tag">' + esc(m.subject || "未分类") + "</span>" +
          '<span class="tag">' + esc(m.reason || "未填错因") + "</span>" +
          (m.reviewed ? '<span class="tag state-done">已复习</span>' : '<span class="tag state-todo">待复习</span>') +
          "</div>" +
          (m.answer ? '<div class="li-sub" style="color:var(--accent);">答案：' + esc(m.answer) + "</div>" : "") +
          "</div>" +
          '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;">' +
          '<button class="btn small ' + (m.reviewed ? "plain" : "") + '" data-action="toggle-review" data-id="' + esc(m.id) + '">' + ic("check") + (m.reviewed ? "已复习" : "标记已复习") + "</button>" +
          '<div style="display:flex;gap:2px;">' +
          '<button class="icon-btn" data-action="edit-mistake" data-id="' + esc(m.id) + '">' + ic("edit") + "</button>" +
          '<button class="icon-btn" data-action="del-mistake" data-id="' + esc(m.id) + '">' + ic("trash") + "</button></div></div></div>";
      }).join("") + "</div>");

    return html;
  }

  /* ==================== 答疑库 ==================== */
  function qa() {
    var W = window.W, d = W.data;
    var list = (d.qa || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; });
    var html = "";
    html += card("", '<button class="btn block" data-action="add-qa">' + ic("plus") + "记录一个问题与解答</button>" +
      '<div class="li-sub" style="margin-top:10px;">问过的问题记下来，考前翻看，避免问过的题再错。AI 对话的解答也可以存档到这里。</div>');
    html += card(cardHead("答疑记录", list.length + " 条", "qa"),
      list.length === 0 ? empty("还没有答疑记录", "学习时遇到不懂的，得到解答后记到这里") :
      '<div class="list">' + list.map(function (q) {
        return '<div class="list-item" style="align-items:flex-start;">' +
          '<div class="li-main"><div class="li-title">' + esc(q.question) + "</div>" +
          '<div class="li-sub">' +
          (q.subject ? '<span class="tag">' + esc(q.subject) + "</span>" : "") +
          '<span class="tag">' + esc(q.date || "") + "</span></div>" +
          (q.answer ? '<div class="li-sub" style="white-space:pre-wrap;margin-top:4px;">' + esc(q.answer) + "</div>" : "") +
          "</div>" +
          '<div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;">' +
          '<button class="icon-btn" data-action="edit-qa" data-id="' + esc(q.id) + '">' + ic("edit") + "</button>" +
          '<button class="icon-btn" data-action="del-qa" data-id="' + esc(q.id) + '">' + ic("trash") + "</button></div></div>";
      }).join("") + "</div>");
    return html;
  }

  /* ==================== 日历 ==================== */
  function calendar() {
    var W = window.W, d = W.data;
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1);
    var startDow = first.getDay();
    var dim = new Date(y, m + 1, 0).getDate();
    var events = (d.calendar || []).filter(function (c) { return c.date && c.date.indexOf(y + "-" + String(m + 1).padStart(2, "0")) === 0; })
      .reduce(function (o, c) { var k = parseInt(c.date.split("-")[2], 10); (o[k] = o[k] || []).push(c); return o; }, {});
    var cells = [];
    for (var i = 0; i < startDow; i++) cells.push('<div class="cal-cell other"></div>');
    for (var day = 1; day <= dim; day++) {
      var isToday = day === now.getDate();
      cells.push('<div class="cal-cell' + (isToday ? " today" : "") + (events[day] ? " has-event" : "") + '">' + day +
        (events[day] ? '<span class="cal-dot"></span>' : "") + "</div>");
    }
    var html = "";
    html += card(cardHead(y + " 年 " + (m + 1) + " 月", "有标记的日子有重要事项", "calendar"),
      '<div class="cal-grid">' +
      ["日", "一", "二", "三", "四", "五", "六"].map(function (w) { return '<div class="cal-head">' + w + "</div>"; }).join("") +
      cells.join("") + "</div>");

    var upcoming = (d.calendar || []).filter(function (c) { var dd = daysDiff(c.date); return dd != null && dd >= -1; })
      .sort(function (a, b) { return a.date > b.date ? 1 : -1; });
    html += card(cardHead("重要日期", "考研报名、四六级、期末、论文截止等", "important-dates"),
      '<button class="btn ghost small" data-action="add-calendar" style="margin-bottom:10px;">' + ic("plus") + "添加重要日期</button>" +
      (upcoming.length === 0 ? empty("还没有重要日期") :
      '<div class="list">' + upcoming.slice(0, 12).map(function (c) {
        var dd = daysDiff(c.date);
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(c.title) + "</div>" +
          '<div class="li-sub">' + esc(c.date) + (c.note ? " · " + esc(c.note) : "") + "</div></div>" +
          '<span class="li-meta">' + (dd === 0 ? "今天" : dd < 0 ? "已过 " + (-dd) + " 天" : "还有 " + dd + " 天") + "</span>" +
          '<button class="icon-btn" data-action="del-calendar" data-id="' + esc(c.id) + '">' + ic("trash") + "</button></div>";
      }).join("") + "</div>"));

    return html;
  }

  /* ==================== 设置 ==================== */
  function settings() {
    var W = window.W, d = W.data;
    var html = "";

    html += card(cardHead("使用说明", "怎么看这个工作台", "guide"),
      '<div style="font-size:14px;color:var(--sub);line-height:1.9;">' +
      "<b style=\"color:var(--text);\">这是什么</b>：你的个人工作台，一个网页，电脑和手机打开同一个地址。它帮你管学习、任务、资料、复盘和健康。<br>" +
      "<b style=\"color:var(--text);\">数据存在哪</b>：目前存在<b>你使用的那台设备的浏览器本地</b>（localStorage）。电脑上记的，手机浏览器里看不到——跨设备同步将在升级版本提供，当前未启用。<br>" +
      "<b style=\"color:var(--text);\">怎么备份</b>：本页下方「导出数据」会下载一个 JSON 文件，存好它=备份。换设备或清浏览器前先导出。<br>" +
      "<b style=\"color:var(--text);\">各模块怎么用</b>：每个页面右上角有圆圈问号「?」，鼠标悬停（电脑）或点击（手机）看该页说明。<br>" +
      "<b style=\"color:var(--text);\">删除的东西</b>：删除的内容先进回收站，可在本页恢复，不会直接消失。<br>" +
      "<b style=\"color:var(--text);\">AI</b>：本地规则功能（收集箱建议、周复盘草稿、学习摘要）免费可用；对话式 AI 需要在「AI 配置」填入你自己的 API 密钥才启用。<br>" +
      "<b style=\"color:var(--text);\">费用</b>：工作台本身免费。对话式 AI 用你的 API 按量计费，密钥由你自己提供。</div>");

    html += card(cardHead("AI 配置", "对话式 AI 的密钥只存本机浏览器", "api"),
      '<div class="field"><label>API 地址（OpenAI 兼容格式）</label>' +
      '<input id="apiBase" placeholder="如 https://api.deepseek.com/v1" value="' + esc(d.settings.apiBase || "") + '"></div>' +
      '<div class="field"><label>模型名称</label>' +
      '<input id="apiModel" placeholder="如 deepseek-chat" value="' + esc(d.settings.apiModel || "") + '"></div>' +
      '<div class="field"><label>API 密钥（' + (d.settings.apiKey ? "已配置（" + String(d.settings.apiKey).slice(0, 6) + "…）" : "未配置") + "）</label>" +
      '<input id="apiKey" type="password" placeholder="粘贴你的密钥"><div class="li-sub" style="margin-top:4px;">密钥只保存在你浏览器的本地存储里，不会上传到任何公开仓库或服务器。配置后对话式 AI 才启用。</div></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button class="btn" data-action="save-api">' + ic("check") + "保存配置</button>" +
      (d.settings.apiKey ? '<button class="btn danger" data-action="clear-api">清除密钥</button>' : "") + "</div>");

    html += card(cardHead("数据管理", "导出 / 导入 / 备份", "data"),
      '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
      '<button class="btn" data-action="export-data">' + ic("download") + "导出全部数据（备份）</button>" +
      '<button class="btn plain" data-action="import-data">' + ic("upload") + "导入数据（恢复）</button>" +
      '<button class="btn plain" data-action="reset-example">' + ic("refresh") + "清空示例数据</button></div>" +
      '<div class="li-sub" style="margin-top:10px;">导出 = 下载一个 JSON 文件，请妥善保存。导入 = 选择之前导出的文件恢复。导入前会自动备份当前数据。清空示例数据只删除开始时预置的示例内容，你自己的数据不动。</div>');

    var deleted = d.deleted || [];
    html += card(cardHead("回收站", deleted.length + " 项，可恢复", "trash"),
      deleted.length === 0 ? empty("回收站是空的") :
      '<div class="list">' + deleted.slice(0, 20).map(function (x) {
        return '<div class="list-item"><div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(x.title || x.content || x.date) + "</div>" +
          '<div class="li-sub">' + esc(x.kind || "") + " · " + esc(x.deletedAt || "") + "</div></div>" +
          '<button class="btn small" data-action="restore-item" data-id="' + esc(x.id) + '">' + ic("refresh") + "恢复</button></div>";
      }).join("") + "</div>" +
      '<button class="btn danger small" data-action="empty-trash" style="margin-top:10px;">清空回收站（不可恢复）</button>');

    html += card(cardHead("领域管理", "你的学习领域，可增删排序", "domains"),
      '<div class="list">' + d.domains.map(function (dm) {
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(dm.name) + "</div>" +
          '<div class="li-sub">' + esc(dm.type === "courses" ? "课程管理" : dm.type === "paper" ? "论文写作" : dm.type === "kaoyan" ? "考研备考" : "通用领域") + "</div></div>" +
          '<button class="btn small plain" data-action="edit-domain" data-id="' + esc(dm.id) + '">' + ic("edit") + "</button>" +
          '<button class="icon-btn" data-action="del-domain" data-id="' + esc(dm.id) + '">' + ic("trash") + "</button></div>";
      }).join("") + "</div>" +
      '<button class="btn ghost small" data-action="add-domain" style="margin-top:10px;">' + ic("plus") + "新建领域</button>" +
      '<div class="field" style="margin-top:14px;"><label>手机底部导航第二个入口（默认第一个领域）</label>' +
      '<select id="primaryDomain">' + d.domains.map(function (dm) {
        return '<option value="' + esc(dm.id) + '"' + (d.settings.primaryDomain === dm.id ? " selected" : "") + ">" + esc(dm.name) + "</option>";
      }).join("") + "</select></div>" +
      '<button class="btn" data-action="save-primary">' + ic("check") + "保存</button>");

    /* 页面背景 */
    var bgs = [
      { id: "default", name: "经典米白", desc: "默认背景", css: "#F7F7F5" },
      { id: "dots", name: "淡雅波点", desc: "圆点纹理", css: "radial-gradient(rgba(47,107,87,0.12) 1.4px, transparent 1.4px) 0 0 / 22px 22px, #F7F7F5" },
      { id: "grid", name: "细线网格", desc: "网格纹理", css: "linear-gradient(rgba(47,107,87,0.07) 1px, transparent 1px) 0 0 / 26px 26px, linear-gradient(90deg, rgba(47,107,87,0.07) 1px, transparent 1px) 0 0 / 26px 26px, #F9FAF8" },
      { id: "waves", name: "柔和波浪", desc: "波浪纹理", css: "linear-gradient(180deg, #FAF7F9, #F3E7F0)" },
      { id: "gradient", name: "清新渐变", desc: "低饱和渐变", css: "linear-gradient(165deg, #F7F7F5, #EFF4EE 45%, #F4F0E8)" }
    ];
    var curBg = (d.settings && d.settings.background) || "default";
    html += card(cardHead("页面背景", "点击预览切换，卡片与文字不受影响", "bg"),
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">' +
      bgs.map(function (b) {
        return '<div class="bg-preview' + (curBg === b.id ? " selected" : "") + '" data-action="set-bg" data-v="' + esc(b.id) + '" title="' + esc(b.desc) + '" style="background:' + b.css + ';">' +
          (curBg === b.id ? '<span class="bp-check">' + ic("check") + "</span>" : "") +
          '<span class="bp-name">' + esc(b.name) + "</span></div>";
      }).join("") + "</div>" +
      '<div class="li-sub" style="margin-top:12px;">背景为开源 CSS/SVG 图案方案（参考 GitHub：patternbolt、CSS-Pattern），零图片文件、离线可用。默认保持经典米白。若你有自己拍的背景图，可在本地替换 styles.css 中的对应样式（暂不支持上传图片）。</div>');

    html += card(cardHead("关于", "版本与运行信息", "about"),
      '<div style="font-size:14px;color:var(--sub);line-height:1.9;">' +
      "版本：v0.1.0（第一版，本地存储）<br>" +
      "运行方式：静态网页，无需安装，浏览器打开即可<br>" +
      "数据保存：本机浏览器 localStorage<br>" +
      "同步：<b>当前未启用</b>（升级版本提供）<br>" +
      "账号：无需注册即可使用本工作台<br>" +
      "图标：统一线性 SVG 图标（自绘几何风格）<br>" +
      "部署：GitHub Pages / Cloudflare Pages 静态托管</div>");

    html += card(cardHead("更新日志", "每次更新都会记录在这里", "changelog"),
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.7 考研备考模块重构<span class="log-tag">重构</span></div>' +
      '<p>按 PRD 终稿重构：三级分层（首页入口卡 → 二级概览 → 5 个三级页：科目详情/任务管理/周计划/备考资料库/统计仪表盘）。</p>' +
      '<p>多套备考方案：新建/切换/归档/删除（二次确认），数据完全隔离；四阶段切换（基础/强化/冲刺/复试）＋ 一键导入阶段任务模板（只新增不清空，二次确认）。</p>' +
      '<p>三类任务：每日必做（概览页最高优先级展示）／周计划／长期领域；完成任务自动记录学习时长打卡；批量完成/删除；周计划一键生成。</p>' +
      '<p>考试倒计时复用全局组件：官方时间自动计算（12 月倒数第二个周末，跟随 28 考研设置 2027-12-25），可手动修改，考试结束提示归档。</p>' +
      '<p>科目体系：数学/英语/政治/专业课＋自定义科目（删除二次确认）；备考资料库关联文件；统计仪表盘（唯一图表页）含热力图/柱状图/科目进度/导出报告。</p>' +
      '<p>UI：考研主题色浅金黄 #FCF5E5 点缀＋强调 #F5B041；二级概览零进度条零图表（纯文字摘要）；全部空状态/异常有引导；归档方案新增按钮置灰。</p>' +
      '<p>影响范围：考研备考模块。数据：自动迁移（旧考研数据 → 默认备考方案），不删除旧数据。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.6 考试系统与主题色<span class="log-tag">更新</span></div>' +
      '<p>英语考试系统升级：支持自定义新增考试（专四/专八/雅思等）；考试倒计时按官方规则动态计算（四六级每年 6 月/12 月第三个周六，考研 12 月倒数第二个周末），支持手动设置日期；考试结束提示、考前 30 天冲刺高亮；考试可归档/恢复，自定义考试可删除（二次确认）。</p>' +
      '<p>每套考试数据完全隔离：生词本、模块进度、打卡各自独立，切换考试不串扰。</p>' +
      '<p>英语二级概览页 UI 精简：移除长条进度条（改文字状态摘要）、移除热力图图表（移到「统计回顾」三级页）；新增内置查词插件（ECDICT 开源词库，离线可用，一键加入当前考试生词本）。</p>' +
      '<p>全局板块主题色：13 个板块各自主色（专注红/学习记录绿/资料库蓝/收集箱紫/错题本橙/答疑青蓝/复盘深蓝/健康薄荷绿/日历蓝紫/账号灰/搜索深灰/AI 电光蓝/设置深灰蓝），统一架构、各板块不同气质。</p>' +
      '<p>影响范围：英语学习、全站配色。数据：自动迁移（考试自动日期规则、生词本按考试拆分），不删除旧数据。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.5 三级分层架构<span class="log-tag">重构</span></div>' +
      '<p>整体改为三级分层：首页（入口卡片）→ 领域概览页（功能卡片入口）→ 详情专区（长列表/图表/表单），每个子页面左上角有返回。</p>' +
      '<p>首页重构：问候横幅、今日目标（固定）、今日待办最多 3 条、领域入口卡片组（小文字徽章，无粗进度条）、快捷工具卡（收集箱/快速打卡/最近继续）。</p>' +
      '<p>英语学习重构：二级页 6 区块（考试倒计时+切换、专项导航 6 卡、打卡统计+热力图、生词本预览、AI 工具箱、关联资料）；6 个三级专区（词汇/听力/阅读/写作/翻译/口语）；考试切换（考研英语/六级/四级）进度数据相互独立；打卡选科目自动累加进度。</p>' +
      '<p>考研备考重构：二级概览页 5 卡片入口（科目总览/本周计划/领域任务/统计/资料库），三级专区（科目进度细窄条、周计划、统计面板、任务管理）。</p>' +
      '<p>AI 知识学习重构：移除全部进度条，改为「每日 30 分钟学习包」闭环（生成今日内容 → 页面内阅读 → 写笔记 → 完成打卡 30 分钟 → 存入历史）；三级历史资料库含周图表与热力图。</p>' +
      '<p>AI 英语专区：作文批改、口语对话、翻译（需配置 API 密钥启用，未配置置灰提示）。</p>' +
      '<p>影响范围：全部模块。数据：自动迁移（英语多考试结构、AI 学习结构），不删除旧数据。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.4 页面背景<span class="log-tag">更新</span></div>' +
      '<p>设置页新增「页面背景」：5 款开源 CSS/SVG 图案背景（经典米白 / 淡雅波点 / 细线网格 / 柔和波浪 / 清新渐变），点击即切换，卡片与文字不受影响。</p>' +
      '<p>影响范围：设置页、页面外观。数据：新增背景选择（默认经典米白）。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.3 专注与记录<span class="log-tag">更新</span></div>' +
      '<p>番茄钟独立为「专注」页面：圆形进度环、25/45/60 预设、今日番茄与专注统计、专注历史，完成后自动记录并弹小奖励。</p>' +
      '<p>新增「学习记录」页面：自动汇总你今天干了什么（打卡、完成任务、专注、新增资料/答疑/错题/生词、复盘），含今日时间线、最近 7 天回顾和鼓励语。</p>' +
      '<p>打卡与任务完成增加鼓励与奖励：连续打卡天数、随机小奖励弹窗（打卡/专注/目标达成时）。</p>' +
      '<p>AI 帮手：对话回答后可点「保存到工作台」，按答疑/资料/生词分类存放，科目自动推荐可修改。</p>' +
      '<p>影响范围：导航、健康页、AI 帮手、打卡。数据：新增专注记录与任务完成时间（不删除旧数据）。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.2 合并导入<span class="log-tag">更新</span></div>' +
      '<p>设置页新增「合并导入」：把聊天/学习中产生的资料文件增量追加到工作台（预览+确认，不覆盖现有数据）。</p>' +
      '<p>影响范围：设置与数据。数据：无变化。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.1 体验优化<span class="log-tag">更新</span></div>' +
      '<p>手机端「更多」抽屉改为从左侧滑出，分组更清晰（开始 / 我的领域 / 工具 / 系统）。</p>' +
      '<p>考研日期更正为 2028 考研（初试 2027 年 12 月 25 日），倒计时与日历同步。</p>' +
      '<p>「四六级」领域升级为「英语学习」（长期技能：词汇/听力/口语/阅读/写作），四六级作为内部专项（含考试倒计时与听力/阅读/写作/翻译进度）。</p>' +
      '<p>英语学习新增：生词本（记录生词、标记掌握、复习提醒）、英语配套功能快捷入口（答疑库 / 错题本 / AI 帮手）。</p>' +
      '<p>影响范围：手机导航、考研备考、英语学习领域、设置。数据：自动迁移旧数据（不删除）。你需要的操作：无。</p></div>' +
      '<div class="log-item"><div class="log-date">2026-08-15 · v0.1.0 第一版<span class="log-tag">新增</span></div>' +
      '<p>工作台第一版上线：今日聚合、领域模块（考研备考 / 四六级 / AI 学习 / 学业课程 / 论文写作，可增删）、资料库（链接自动识别平台）、收集箱（AI 建议去向）、跨模块搜索、错题本、答疑库、复盘（每日 / 每周 AI 草稿）、健康（睡眠 / 运动 / 状态 / 番茄钟）、账号管理、重要日期日历、设置与数据（导出 / 导入 / 回收站）。</p>' +
      '<p>影响范围：全部模块。数据：本地新建。你需要的操作：无。</p></div>' +
      '<div class="li-sub">更多更新会陆续记录在这里。</div>');

    return html;
  }

  /* 领域视图分发 */
  function domainView(dm) {
    if (!dm) return empty("领域不存在");
    if (dm.type === "courses") return coursesView(dm);
    if (dm.type === "paper") return paperView(dm);
    if (dm.type === "english") return englishOverview(dm);
    if (dm.type === "kaoyan") return kaoyanOverview(dm);
    if (dm.type === "ailearn") return aiOverview(dm);
    return domain(dm);
  }
  /* 英语专区（按名称生成） */
  function englishZone(dm, zoneName) {
    var zones = {
      "听力": { id: "cet-listening", emoji: "🎧", name: "听力", desc: "真题听力、精听训练、听力素材", tag: "听力" },
      "阅读": { id: "cet-reading", emoji: "📝", name: "阅读", desc: "真题阅读、长难句、错题记录", tag: "阅读", extra: zoneReading },
      "写作": { id: "cet-writing", emoji: "✍️", name: "写作", desc: "范文、模板、AI 批改、作文素材", tag: "写作", extra: zoneWriting },
      "翻译": { id: "cet-translation", emoji: "🌐", name: "翻译", desc: "真题翻译练习、句式积累", tag: "翻译", extra: zoneTranslation },
      "口语": { id: "cet-speaking", emoji: "🗣️", name: "口语", desc: "AI 口语对话练习", tag: "口语", extra: zoneSpeaking }
    };
    return cetGenericZone(dm, zones[zoneName]);
  }

  window.Views = {
    today: today,
    domainView: domainView,
    kySubjects: kySubjects,
    kyTasks: kyTasks,
    kyWeekly: kyWeekly,
    kyFiles: kyFiles,
    kyStats: kyStats,
    tasksAll: tasksAll,
    cetVocab: cetVocab,
    cetWordbook: cetWordbook,
    cetExams: cetExams,
    cetStats: cetStats,
    englishZone: englishZone,
    aiHistory: aiHistory,
    library: library,
    inbox: inbox,
    search: search,
    ai: ai,
    accounts: accounts,
    health: health,
    focus: focus,
    activity: activity,
    reviews: reviews,
    mistakes: mistakes,
    qa: qa,
    calendar: calendar,
    settings: settings
  };
})();
