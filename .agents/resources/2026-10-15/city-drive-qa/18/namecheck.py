#!/usr/bin/env python3
"""Strict name existence check used by task 18 (stdlib only).

For each candidate: Google Play search (plain + quoted), iTunes Search API,
and RDAP lookups for the .com and .app domains. Writes raw evidence to
namecheck-results.json. The verdict heuristic only flags; every flagged hit
is read by a human/agent before a verdict is recorded.

Usage: python3 namecheck.py results.json "Name One" "Name Two" ...
"""
import difflib
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = {"User-Agent": "Mozilla/5.0"}
DATE = time.strftime("%Y-%m-%d")


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, ""
    except Exception as e:  # noqa: BLE001 - recorded as evidence of failure
        return -1, str(e)


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def play_titles(name, quoted):
    q = f'"{name}"' if quoted else name
    url = "https://play.google.com/store/search?q=" + urllib.parse.quote(q) + "&c=apps"
    status, body = fetch(url)
    titles = [html.unescape(t) for t in re.findall(r'<span class="DdYX5">([^<]+)</span>', body)]
    return url, status, titles


def itunes_titles(name):
    url = "https://itunes.apple.com/search?term=" + urllib.parse.quote(name) + "&entity=software&limit=50"
    status, body = fetch(url)
    titles = []
    try:
        titles = [r["trackName"] for r in json.loads(body)["results"]]
    except Exception:  # noqa: BLE001
        pass
    return url, status, titles


def rdap(domain):
    tld = domain.rsplit(".", 1)[1]
    base = {
        "com": "https://rdap.verisign.com/com/v1/domain/",
        "app": "https://pubapi.registry.google/rdap/domain/",
    }[tld]
    url = base + domain
    status, _ = fetch(url)
    state = {404: "available", 200: "registered"}.get(status, f"unknown({status})")
    return url, state


def flags(name, titles):
    n = norm(name)
    words = [norm(w) for w in name.split()]
    out = []
    for t in titles:
        nt = norm(t)
        ratio = difflib.SequenceMatcher(None, n, nt).ratio()
        if n in nt:
            out.append({"title": t, "why": "contains"})
        elif all(w in nt for w in words):
            out.append({"title": t, "why": "all-words"})
        elif ratio >= 0.8:
            out.append({"title": t, "why": f"similar {ratio:.2f}"})
    return out


def check(name):
    purl, pst, ptitles = play_titles(name, False)
    qurl, qst, qtitles = play_titles(name, True)
    iurl, ist, ititles = itunes_titles(name)
    slug = norm(name)
    com_url, com = rdap(slug + ".com")
    app_url, app = rdap(slug + ".app")
    return {
        "name": name,
        "checked_at": DATE,
        "play_plain": {"url": purl, "http": pst, "n_titles": len(ptitles), "flags": flags(name, ptitles), "top": ptitles[:8]},
        "play_quoted": {"url": qurl, "http": qst, "n_titles": len(qtitles), "flags": flags(name, qtitles), "top": qtitles[:8]},
        "itunes": {"url": iurl, "http": ist, "n_titles": len(ititles), "flags": flags(name, ititles), "top": ititles[:8]},
        "domains": {slug + ".com": {"url": com_url, "state": com}, slug + ".app": {"url": app_url, "state": app}},
    }


if __name__ == "__main__":
    out = sys.argv[1]
    results = []
    for n in sys.argv[2:]:
        results.append(check(n))
        time.sleep(1)
    with open(out, "w") as f:
        json.dump(results, f, indent=1)
    for r in results:
        nflags = len(r["play_plain"]["flags"]) + len(r["play_quoted"]["flags"]) + len(r["itunes"]["flags"])
        d = ",".join(f"{k}:{v['state']}" for k, v in r["domains"].items())
        print(f"{r['name']:<18} play={r['play_plain']['n_titles']}/{r['play_quoted']['n_titles']} itunes={r['itunes']['n_titles']} flags={nflags} {d}")
