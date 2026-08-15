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

  /* ==================== 今日 ==================== */
  function today() {
    var W = window.W, d = W.data;
    var html = "";
    var greeting = "你好";
    var hh = new Date().getHours();
    if (hh < 6) greeting = "夜深了";
    else if (hh < 12) greeting = "早上好";
    else if (hh < 14) greeting = "中午好";
    else if (hh < 19) greeting = "下午好";
    else greeting = "晚上好";

    /* 今日目标 */
    var g = (d.goals || []).filter(function (x) { return x.date === todayStr(); });
    var doneMin = 0, planMin = 0;
    g.forEach(function (x) { planMin += (x.minutes || 0); });
    (d.studyLog || []).filter(function (x) { return x.date === todayStr(); }).forEach(function (x) { doneMin += (x.minutes || 0); });
    var goalHtml;
    if (g.length === 0) {
      goalHtml = '<div class="empty">今天还没有设定学习目标' +
        '<div class="empty-tip">先定个小目标，晚上看完成率</div></div>' +
        '<button class="btn block" data-action="add-goal">' + ic("target") + "设定今日目标</button>";
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

    /* 今日任务 */
    var todayTasks = (d.tasks || []).filter(function (t) { return t.date === todayStr() ? !t.done : (!t.date && !t.done); });
    var doneTasks = (d.tasks || []).filter(function (t) { return t.date === todayStr() && t.done; });
    var tasksHtml = (todayTasks.length === 0 && doneTasks.length === 0
      ? empty("今天没有安排任务", "点下方按钮添加，或从收集箱确认")
      : todayTasks.map(taskItem).join("") + doneTasks.map(taskItem).join("")) +
      '<button class="btn ghost small" data-action="add-task" style="margin-top:8px;">' + ic("plus") + "添加任务</button>";

    /* 今日课程 */
    var dayCN = weekCN();
    var courseDoms = (d.domains || []).filter(function (x) { return x.type === "courses"; });
    var coursesToday = [];
    courseDoms.forEach(function (cd) {
      (cd.courses || []).forEach(function (c) {
        if (c.day === dayCN) coursesToday.push({ c: c, d: cd.name });
      });
    });
    var courseHtml;
    if (coursesToday.length === 0) {
      courseHtml = empty("今天没有课", "有课的话在「学业课程」里添加");
    } else {
      courseHtml = '<div class="list">' + coursesToday.map(function (x) {
        return '<div class="list-item"><div style="width:8px;height:8px;border-radius:50%;background:var(--accent);flex-shrink:0;"></div>' +
          '<div class="li-main"><div class="li-title">' + esc(x.c.name) + "</div>" +
          '<div class="li-sub">' + esc(x.d) + (x.c.teacher ? " · " + esc(x.c.teacher) : "") + "</div></div>" +
          '<span class="li-meta">' + esc(x.c.time || "") + (x.c.place ? " " + esc(x.c.place) : "") + "</span></div>";
      }).join("") + "</div>";
    }

    /* 待确认（收集箱） */
    var pending = (d.inbox || []).filter(function (x) { return x.status === "待分拣"; });
    var pendingHtml = pending.length === 0
      ? empty("收集箱没有待确认内容")
      : '<div class="list">' + pending.slice(0, 5).map(function (x) {
        return '<div class="list-item"><div class="li-main"><div class="li-title">' + esc(x.content || x.url || "无标题") + "</div>" +
          '<div class="li-sub">' + esc(x.platform || "文字") + " · 等待确认去向</div></div>" +
          '<button class="btn small plain" data-action="open-inbox">处理</button></div>';
      }).join("") + "</div>" +
      '<button class="btn ghost small" data-action="open-inbox" style="margin-top:8px;">' + ic("inbox") + "打开收集箱</button>";

    /* 异常提醒 */
    var alerts = [];
    (d.tasks || []).forEach(function (t) {
      if (!t.done && t.date && t.date < todayStr()) {
        alerts.push("任务「" + t.title + "」已逾期（" + t.date + "）");
      }
    });
    (d.calendar || []).forEach(function (c) {
      var dd = daysDiff(c.date);
      if (dd != null && dd >= 0 && dd <= 3) {
        alerts.push((dd === 0 ? "今天" : dd + " 天后") + "是「" + c.title + "」");
      }
    });
    var lastLog = (d.studyLog || []).filter(function (x) { return x.date < todayStr(); });
    if (lastLog.length > 0) {
      var lastDate = lastLog[lastLog.length - 1].date;
      var gap = Math.round((new Date(todayStr() + "T00:00:00") - new Date(lastDate + "T00:00:00")) / 86400000);
      if (gap >= 2) alerts.push("已连续 " + gap + " 天没有学习打卡了");
    }
    var alertHtml = alerts.length === 0
      ? empty("一切正常，没有异常", "保持住")
      : '<div class="list">' + alerts.map(function (a) {
        return '<div class="list-item"><span style="color:var(--danger);">' + ic("alert") + "</span>" +
          '<div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(a) + "</div></div></div>";
      }).join("") + "</div>";

    /* 最近可继续 */
    var recent = [];
    (d.resources || []).slice().sort(function (a, b) { return b.updatedAt > a.updatedAt ? 1 : -1; }).slice(0, 2).forEach(function (r) {
      recent.push({ t: "资料", title: r.title, act: "open-library" });
    });
    (d.reviews || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; }).slice(0, 2).forEach(function (r) {
      recent.push({ t: "复盘", title: r.date + " 复盘", act: "open-reviews" });
    });
    (d.qa || []).slice().sort(function (a, b) { return b.date > a.date ? 1 : -1; }).slice(0, 2).forEach(function (q) {
      recent.push({ t: "答疑", title: q.question, act: "open-qa" });
    });
    var recentHtml = recent.length === 0
      ? empty("还没有记录", "开始使用后这里会出现最近的内容")
      : '<div class="list">' + recent.map(function (r) {
        return '<div class="list-item"><span class="tag">' + esc(r.t) + "</span>" +
          '<div class="li-main"><div class="li-title" style="font-weight:400;">' + esc(r.title) + "</div></div>" +
          '<button class="btn small plain" data-action="' + r.act + '">继续</button></div>';
      }).join("") + "</div>";

    html += '<div class="card tint-green"><div style="font-size:20px;font-weight:800;">' + greeting + "，今天也要加油</div>" +
      '<div style="color:var(--sub);font-size:13px;margin-top:4px;">' + dateCN(todayStr()) + " " + weekCN() + " · 距 2027 年考研还有 " +
      '<b style="color:var(--accent-dark);">' + daysDiff(W.settings.kaoyanDate) + "</b> 天</div></div>";

    html += '<div class="today-grid">' +
      card(cardHead("今日目标", "先定目标再看完成率", "goal"), goalHtml) +
      card(cardHead("今日课程", "来自学业课程", "course"), courseHtml) +
      card(cardHead("今日任务", "点击圆圈完成", "task"), tasksHtml) +
      card(cardHead("异常提醒", "需要留意的事", "alert"), alertHtml) +
      card(cardHead("待确认", "收集箱等待分拣", "inbox"), pendingHtml) +
      card(cardHead("最近可继续", "接着上次的做", "recent"), recentHtml) +
      "</div>";

    return html;
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

    /* 番茄钟 */
    html += card(cardHead("专注计时（番茄钟）", "页面打开时有效，手机锁屏会暂停", "timer"),
      '<div class="timer-display" id="timerDisp">25:00</div>' +
      '<div class="timer-controls">' +
      '<button class="btn small plain" data-action="timer-preset" data-min="25">25 分</button>' +
      '<button class="btn small plain" data-action="timer-preset" data-min="45">45 分</button>' +
      '<button class="btn small plain" data-action="timer-preset" data-min="60">60 分</button></div>' +
      '<div class="timer-controls">' +
      '<button class="btn" data-action="timer-toggle" id="timerBtn">' + ic("play") + "开始</button>" +
      '<button class="btn plain" data-action="timer-reset">' + ic("refresh") + "重置</button></div>" +
      '<div class="li-sub" style="text-align:center;margin-top:10px;">到点会提示休息。专注完成后可打卡学习时长。</div>');

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
    return domain(dm);
  }

  window.Views = {
    today: today,
    domainView: domainView,
    library: library,
    inbox: inbox,
    search: search,
    ai: ai,
    accounts: accounts,
    health: health,
    reviews: reviews,
    mistakes: mistakes,
    qa: qa,
    calendar: calendar,
    settings: settings
  };
})();
