import csv, json, os

SRC = r"C:\Users\Administrator\workbench\ecdict_full.csv"
DST = r"C:\Users\Administrator\workbench\dict.js"
LIMIT = 8000

if not os.path.exists(SRC):
    print("源文件不存在:", SRC)
    raise SystemExit(1)

words = []
with open(SRC, "r", encoding="utf-8", errors="ignore") as f:
    reader = csv.DictReader(f)
    for row in reader:
        w = (row.get("word") or "").strip().lower()
        t = (row.get("translation") or "").strip()
        p = (row.get("phonetic") or "").strip()
        if not w or not t or len(w) > 30 or " " in w:
            continue
        collins = row.get("collins") or ""
        try:
            c = int(collins) if collins.strip() else 0
        except Exception:
            c = 0
        # 只要常用词：有柯林斯星级 或 词频标记
        frq = (row.get("frq") or "").strip()
        bnc = (row.get("bnc") or "").strip()
        if c <= 0 and not frq and not bnc:
            continue
        words.append({"w": w, "p": p, "t": t[:120], "c": c})

# 按 柯林斯星级 > 词频排序，取高频前 LIMIT
def rank(x):
    return (x["c"] > 0, len(x["w"]))
words.sort(key=lambda x: -x["c"])
words = words[:LIMIT]

out = {}
for x in words:
    e = {}
    if x["p"]: e["p"] = x["p"]
    e["t"] = x["t"]
    if x["c"]: e["c"] = x["c"]
    out[x["w"]] = e

with open(DST, "w", encoding="utf-8") as f:
    f.write("/* 内置查词词库：ECDICT 开源词典（github.com/skywind3000/ECDICT，MIT）高频词精简版 */\n")
    f.write("window.WB_DICT = ")
    json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")

print("词条数:", len(out))
print("文件大小: %.2f MB" % (os.path.getsize(DST) / 1048576))
