#!/usr/bin/env python3
"""Second, independent pass for the top names: query variants and other storefronts."""
import json, sys, time, urllib.parse
sys.path.insert(0, ".")
from namecheck import fetch as _fetch, norm, flags, DATE

def fetch(u):
    for i in range(4):
        st, b = _fetch(u)
        if st != 429:
            return st, b
        time.sleep(10 * (i + 1))
    return st, b

import re, html

VARIANTS = {
    "Honkville": ["Honkville game", "Honk ville", "Honkville driving", "Honkville car"],
    "Tarmac Town": ["Tarmac Town game", "TarmacTown", "Tarmac Town driving", "Tarmac Town car"],
    "Kerbside Run": ["Kerbside Run game", "Kerbsiderun", "Kerbside Run driving", "Curbside Run"],
}
out = []
for name, qs in VARIANTS.items():
    rec = {"name": name, "checked_at": DATE, "queries": []}
    for q in qs:
        purl = "https://play.google.com/store/search?q=" + urllib.parse.quote(q) + "&c=apps"
        st, body = fetch(purl)
        titles = [html.unescape(t) for t in re.findall(r'<span class="DdYX5">([^<]+)</span>', body)]
        rec["queries"].append({"store": "play", "q": q, "url": purl, "http": st, "n": len(titles), "flags": flags(name, titles)})
        for cc in ("us", "gb", "ca"):
            iurl = f"https://itunes.apple.com/search?term={urllib.parse.quote(q)}&entity=software&country={cc}&limit=50"
            st, body = fetch(iurl)
            try:
                tt = [r["trackName"] for r in json.loads(body)["results"]]
            except Exception:
                tt = []
            rec["queries"].append({"store": f"itunes-{cc}", "q": q, "url": iurl, "http": st, "n": len(tt), "flags": flags(name, tt)})
        time.sleep(3)
    out.append(rec)
json.dump(out, open("recheck-results.json", "w"), indent=1)
for r in out:
    bad = [(q["store"], q["q"], f) for q in r["queries"] for f in q["flags"]]
    print(r["name"], "queries", len(r["queries"]), "flagged", bad)
