import requests, os, time

url = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
dest = r"C:\Users\Administrator\workbench\ecdict_full.csv"
headers = {"User-Agent": "Mozilla/5.0"}

if os.path.exists(dest):
    os.remove(dest)
start = 0
max_tries = 40
tries = 0
while tries < max_tries:
    h = dict(headers)
    h["Range"] = f"bytes={start}-"
    try:
        r = requests.get(url, headers=h, stream=True, timeout=90)
        if r.status_code in (200, 206):
            with open(dest, "ab") as f:
                for chunk in r.iter_content(1 << 20):
                    if chunk:
                        f.write(chunk)
                        start += len(chunk)
            print("DONE", start)
            break
        else:
            print("HTTP", r.status_code)
            tries += 1
    except Exception as e:
        print("ERR", str(e)[:100])
        tries += 1
        time.sleep(3)
print("FINAL", os.path.getsize(dest) if os.path.exists(dest) else 0)
