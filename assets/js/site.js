(function () {
  "use strict";

  var INFO = "info/";
  var IMAGES = "assets/images/";       // web-optimized copies (scripts/optimize-images.sh)
  var IMAGES_FALLBACK = "info/images/"; // originals, used if an optimized copy is missing

  var page = document.body.dataset.page;
  var main = document.getElementById("main");

  document.querySelectorAll("[data-nav]").forEach(function (a) {
    if (a.dataset.nav === page) a.classList.add("is-active");
  });

  /* ---------- helpers ---------- */

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function getJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path + " " + r.status);
      return r.json();
    });
  }

  function getText(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error(path + " " + r.status);
      return r.text();
    });
  }

  // Blank-line separated paragraphs; single newlines become line breaks.
  function paragraphs(md) {
    return md.trim().split(/\n\s*\n/).map(function (block) {
      var p = el("p");
      block.trim().split("\n").forEach(function (line, i) {
        if (i) p.appendChild(el("br"));
        p.appendChild(document.createTextNode(line.trim()));
      });
      return p;
    });
  }

  function image(file, alt, eager) {
    var img = el("img", { src: IMAGES + file, alt: alt || "", loading: eager ? "eager" : "lazy", decoding: "async" });
    img.addEventListener("error", function onError() {
      img.removeEventListener("error", onError);
      img.src = IMAGES_FALLBACK + file;
    });
    return img;
  }

  // Accepts a YouTube / Vimeo link, or a path to a video file (mp4, webm…).
  function videoEmbed(url, title) {
    var yt = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) {
      return el("iframe", {
        src: "https://www.youtube-nocookie.com/embed/" + yt[1] + "?rel=0",
        title: title || "video",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "",
        loading: "lazy"
      });
    }
    var vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) {
      return el("iframe", {
        src: "https://player.vimeo.com/video/" + vimeo[1],
        title: title || "video",
        allow: "autoplay; fullscreen; picture-in-picture",
        allowfullscreen: "",
        loading: "lazy"
      });
    }
    return el("video", { src: url, controls: "", playsinline: "", preload: "metadata" });
  }

  function caption(work) {
    return work.title + ", " + work.media.join(" / ") + ", " + work.year;
  }

  // Top frame: video when there is one, otherwise the first image.
  function heroFrame(work, video) {
    var src = video || work.video;
    if (src) return el("div", { class: "frame" }, [videoEmbed(src, work.title)]);
    if (work.images && work.images.length) {
      return el("div", { class: "frame" }, [image(work.images[0], work.title, true)]);
    }
    return el("div", { class: "frame" });
  }

  function credits(work) {
    var rows = [];
    (work.myRoles || []).forEach(function (role) { rows.push([role, "Bomi Kwon"]); });
    (work.collaborators || []).forEach(function (c) { if (c.name) rows.push([c.role, c.name]); });
    if (work.format && work.format.duration) rows.push(["Duration", work.format.duration]);
    return el("dl", { class: "credits" }, rows.map(function (r) {
      return el("div", null, [el("dt", { text: r[0] }), el("dd", { text: r[1] })]);
    }));
  }

  function fail(err) {
    console.error(err);
    main.appendChild(el("p", {
      class: "caption",
      text: "콘텐츠를 불러오지 못했습니다. 로컬에서는 웹 서버로 열어주세요 (예: python3 -m http.server)."
    }));
  }

  /* ---------- pages ---------- */

  function renderHome() {
    getJSON(INFO + "works.json").then(function (data) {
      var featured = data.featured || {};
      var work = data.works.filter(function (w) { return w.id === featured.workId; })[0] || data.works[0];
      main.appendChild(el("a", { href: "work.html#" + work.id, "aria-label": work.title }, [
        heroFrame(work, featured.video)
      ]));
      // A playable video should not be wrapped in a link.
      if (featured.video || work.video) {
        var link = main.firstChild;
        main.replaceChild(link.firstChild, link);
      }
      main.appendChild(el("p", { class: "caption", text: caption(work) }));
    }).catch(fail);
  }

  // WORK: titles appear under the WORK menu; one work is shown at a time (work.html#<id>).
  function renderWork() {
    getJSON(INFO + "works.json").then(function (data) {
      var works = data.works;
      var texts = {};
      var list = el("ul", { class: "nav__works" }, works.map(function (w) {
        return el("li", null, [el("a", { href: "#" + w.id, "data-work": w.id, text: w.title })]);
      }));
      document.querySelector('[data-nav="work"]').insertAdjacentElement("afterend", list);

      function show() {
        var id = decodeURIComponent(location.hash.slice(1));
        var work = works.filter(function (w) { return w.id === id; })[0] || works[0];

        list.querySelectorAll("a").forEach(function (a) {
          a.classList.toggle("is-active", a.dataset.work === work.id);
        });

        var load = texts[work.id] || (texts[work.id] = work.description
          ? getText(INFO + work.description).catch(function () { return ""; })
          : Promise.resolve(""));

        load.then(function (md) {
          // Gallery = every image not already shown in the top frame.
          var rest = work.video ? work.images : work.images.slice(1);
          main.replaceChildren(el("article", { class: "work", id: "work-" + work.id }, [
            heroFrame(work),
            el("p", { class: "caption", text: caption(work) }),
            el("div", { class: "text" }, paragraphs(md).concat([credits(work)])),
            el("div", { class: "gallery" }, rest.map(function (f) {
              return el("div", { class: "frame" }, [image(f, work.title)]);
            }))
          ]));
          window.scrollTo(0, 0);
        });
      }

      window.addEventListener("hashchange", show);
      show();
    }).catch(fail);
  }

  /* ABOUT diagram: one empty cell → one filled cell → a row → a full grid */
  function marker(cols, rows, pattern, kind) {
    var m = el("div", { class: "marker" + (kind ? " marker--" + kind : ""), "aria-hidden": "true" });
    m.style.setProperty("--cols", cols);
    for (var i = 0; i < cols * rows; i++) {
      var on = typeof pattern === "function" ? pattern(i) : pattern[i];
      m.appendChild(el("i", { class: on ? "on" : "" }));
    }
    if (kind === "grid") {
      m.addEventListener("mouseover", function (e) {
        if (e.target.tagName === "I") e.target.classList.toggle("on");
      });
    }
    return m;
  }

  function renderAbout() {
    getText(INFO + "artiststatement.md").then(function (md) {
      var blocks = md.trim().split(/\n\s*\n/);
      var about = el("section", { class: "about" });

      var markers = [
        marker(9, 1, [0, 1, 1, 0, 1, 0, 0, 0, 1]),
        marker(9, 8, function () { return Math.random() < 0.38; }, "grid")
      ];
      var singles = [marker(1, 1, [0]), marker(1, 1, [1])];

      about.appendChild(el("div", { class: "about__row" }, [
        el("div", { class: "text about__intro" }, paragraphs(blocks[0])),
        singles[0]
      ]));

      blocks.slice(1).forEach(function (block, i) {
        var idx = block.indexOf(":");
        var title = idx > -1 ? block.slice(0, idx).trim() : "";
        var body = idx > -1 ? block.slice(idx + 1).trim() : block.trim();
        var m = i === 0 ? singles[1] : markers[i - 1] || null;

        about.appendChild(el("h2", { class: "text about__heading" }, [
          el("span", { class: "num", text: (i + 1) + "." }),
          el("span", { text: title })
        ]));
        about.appendChild(el("div", { class: "about__row" }, [
          el("div", { class: "text about__body" }, paragraphs(body)),
          m
        ]));
      });

      main.appendChild(about);
    }).catch(fail);
  }

  ({ home: renderHome, work: renderWork, about: renderAbout })[page]();
})();
