/* =========================================================
   Mysuru Civic Connect — shared script
   Used by index.html and report.html
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. Mobile navigation
     --------------------------------------------------------- */
  function initNav() {
    var toggle = document.getElementById("navToggle");
    var links = document.getElementById("navLinks");
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      var isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     2. Data: problem types & Mysuru localities + Wards
     --------------------------------------------------------- */
  var PROBLEM_TYPES = [
    { id: "pothole", label: "Pothole / Damaged Road", icon: "road" },
    { id: "garbage", label: "Garbage / Waste", icon: "trash" },
    { id: "streetlight", label: "Streetlight", icon: "bulb" },
    { id: "drainage", label: "Drainage / Flooding", icon: "drop" },
    { id: "water", label: "Water Supply", icon: "tap" },
    { id: "debris", label: "Construction Debris", icon: "brick" },
    { id: "publicspace", label: "Public Space / Tree", icon: "tree" },
    { id: "traffic", label: "Traffic / Road Sign", icon: "sign" },
    { id: "other", label: "Other", icon: "dots" }
  ];

  var PROBLEM_ICONS = {
    road: '<path d="M4 21 10 3h4l6 18"/><path d="M9 15h6"/>',
    trash: '<path d="M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-9 0 1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3z"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/>',
    tap: '<path d="M6 9V6a2 2 0 0 1 2-2h4M6 9h9a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3"/>',
    brick: '<rect x="3" y="6" width="8" height="5"/><rect x="13" y="6" width="8" height="5"/><rect x="7" y="13" width="8" height="5"/>',
    tree: '<path d="M12 3 7 10h3l-4 6h4v5h4v-5h4l-4-6h3z"/>',
    sign: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none"/>',
    dots: '<circle cx="6" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.2" fill="currentColor" stroke="none"/>'
  };

  var MYSURU_LOCALITIES = [
    "Vijayanagar", "Kuvempunagar", "Saraswathipuram", "Jayalakshmipuram",
    "Gokulam", "Hebbal", "Hootagalli", "Bogadi", "Dattagalli", "JP Nagar",
    "Bannimantap", "Metagalli", "Rajiv Nagar", "Udayagiri", "Devaraja Mohalla",
    "Lakshmipuram", "Vontikoppal", "Yadavgiri", "Vidyaranyapuram",
    "Ramakrishnanagar", "Srirampura", "Alanahalli", "Kadakola",
    "Other Mysuru Area"
  ];

  // Mapping localities to official Mysuru City Corporation Wards (matching portal.js & worker.html)
  var LOCALITY_TO_WARD = {
    "Rajiv Nagar": { id: 1, name: "Rajiv Nagar / Udayagiri / Srirampura" },
    "Udayagiri": { id: 1, name: "Rajiv Nagar / Udayagiri / Srirampura" },
    "Srirampura": { id: 1, name: "Rajiv Nagar / Udayagiri / Srirampura" },
    "Devaraja Mohalla": { id: 2, name: "Devaraja Mohalla / Vontikoppal" },
    "Vontikoppal": { id: 2, name: "Devaraja Mohalla / Vontikoppal" },
    "Kuvempunagar": { id: 3, name: "Kuvempunagar" },
    "Vijayanagar": { id: 4, name: "Vijayanagar / Bogadi / Dattagalli" },
    "Bogadi": { id: 4, name: "Vijayanagar / Bogadi / Dattagalli" },
    "Dattagalli": { id: 4, name: "Vijayanagar / Bogadi / Dattagalli" },
    "Hebbal": { id: 5, name: "Hebbal / Hootagalli" },
    "Hootagalli": { id: 5, name: "Hebbal / Hootagalli" },
    "Saraswathipuram": { id: 6, name: "Saraswathipuram / Jayalakshmipuram" },
    "Jayalakshmipuram": { id: 6, name: "Saraswathipuram / Jayalakshmipuram" },
    "Lakshmipuram": { id: 7, name: "Lakshmipuram" },
    "Gokulam": { id: 8, name: "Gokulam / Metagalli / Yadavgiri" },
    "Metagalli": { id: 8, name: "Gokulam / Metagalli / Yadavgiri" },
    "Yadavgiri": { id: 8, name: "Gokulam / Metagalli / Yadavgiri" },
    "JP Nagar": { id: 9, name: "JP Nagar / Bannimantap" },
    "Bannimantap": { id: 9, name: "JP Nagar / Bannimantap" },
    "Vidyaranyapuram": { id: 10, name: "Vidyaranyapuram / Ramakrishnanagar / Alanahalli / Kadakola" },
    "Ramakrishnanagar": { id: 10, name: "Vidyaranyapuram / Ramakrishnanagar / Alanahalli / Kadakola" },
    "Alanahalli": { id: 10, name: "Vidyaranyapuram / Ramakrishnanagar / Alanahalli / Kadakola" },
    "Kadakola": { id: 10, name: "Vidyaranyapuram / Ramakrishnanagar / Alanahalli / Kadakola" },
    "Other Mysuru Area": { id: 0, name: "Other Mysuru Area" }
  };

  var MYSURU_BOUNDS = {
    minLat: 12.20, maxLat: 12.42,
    minLng: 76.53, maxLng: 76.75
  };

  function isWithinMysuru(lat, lng) {
    return lat >= MYSURU_BOUNDS.minLat && lat <= MYSURU_BOUNDS.maxLat &&
           lng >= MYSURU_BOUNDS.minLng && lng <= MYSURU_BOUNDS.maxLng;
  }

  /* ---------------------------------------------------------
     3. Report form
     --------------------------------------------------------- */
  function initReportForm() {
    var grid = document.getElementById("problemTypeGrid");
    if (!grid) return;

    var state = {
      problemType: null,
      problemTypeId: null,
      description: "",
      locality: "",
      wardId: null,
      wardName: "",
      priority: "medium",
      address: "",
      lat: null,
      lng: null,
      photos: []
    };

    /* ---- Problem type grid ---- */
    PROBLEM_TYPES.forEach(function (type) {
      var wrapper = document.createElement("div");
      wrapper.className = "problem-type-option";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = "problemType";
      input.id = "problem-" + type.id;
      input.value = type.id;

      var label = document.createElement("label");
      label.setAttribute("for", input.id);
      label.innerHTML =
        '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        PROBLEM_ICONS[type.icon] + "</svg><span>" + type.label + "</span>";

      input.addEventListener("change", function () {
        state.problemType = type.label;
        state.problemTypeId = type.id;
        updateSummary();
      });

      wrapper.appendChild(input);
      wrapper.appendChild(label);
      grid.appendChild(wrapper);
    });

    /* ---- Description + char count ---- */
    var description = document.getElementById("description");
    var charCount = document.getElementById("charCount");
    description.addEventListener("input", function () {
      state.description = description.value;
      charCount.textContent = String(description.value.length);
      updateSummary();
    });

    /* ---- Address search ---- */
    var addressSearch = document.getElementById("addressSearch");
    addressSearch.addEventListener("input", function () {
      state.address = addressSearch.value;
      updateMapLabel();
      updateSummary();
    });

    /* ---- Locality & Ward selector ---- */
    var localitySelect = document.getElementById("localitySelect");

    MYSURU_LOCALITIES.forEach(function (name) {
      var opt = document.createElement("option");
      opt.value = name;
      var wardInfo = LOCALITY_TO_WARD[name];
      opt.textContent = wardInfo ? (name + " (Ward " + wardInfo.id + ")") : name;
      localitySelect.appendChild(opt);
    });

    localitySelect.addEventListener("change", function () {
      state.locality = localitySelect.value;
      var wardObj = LOCALITY_TO_WARD[state.locality];
      if (wardObj) {
        state.wardId = wardObj.id;
        state.wardName = wardObj.name;
      } else {
        state.wardId = 0;
        state.wardName = "Other Mysuru Area";
      }
      updateMapLabel();
      updateSummary();
    });

    /* ---- Use my location ---- */
    var useLocationBtn = document.getElementById("useLocationBtn");
    var locationStatus = document.getElementById("locationStatus");
    var mapCoords = document.getElementById("mapCoords");

    useLocationBtn.addEventListener("click", function () {
      if (!("geolocation" in navigator)) {
        showLocationStatus("Location access isn't available on this device.", "warn");
        return;
      }

      showLocationStatus("Detecting your location in Mysuru...", "ok");

      navigator.geolocation.getCurrentPosition(
        function (position) {
          var lat = position.coords.latitude;
          var lng = position.coords.longitude;
          setMapPoint(lat, lng, { recenter: true, zoom: 16 });

          if (isWithinMysuru(lat, lng)) {
            showLocationStatus("Location captured within Mysuru.", "ok");
          } else {
            showLocationStatus(
              "Mysuru Civic Connect currently accepts complaints within Mysuru only. " +
              "Your detected location appears to be outside Mysuru.",
              "warn"
            );
          }
        },
        function () {
          showLocationStatus("We couldn't access your location. Please allow location access, or search your address instead.", "warn");
        }
      );
    });

    function showLocationStatus(message, type) {
      locationStatus.textContent = message;
      locationStatus.className = "location-status show " + type;
    }

    function updateMapLabel() {
      var hint = document.getElementById("mapHint");
      if (!hint) return;
      var text = state.locality || state.address || "Click the map or drag the pin to set the exact location";
      hint.textContent = text;
    }

    /* ---- Interactive map ---- */
    var reportMap = null;
    var reportMarker = null;
    var DEFAULT_MAP_CENTER = [12.305, 76.645];

    function setMapPoint(lat, lng, opts) {
      opts = opts || {};
      state.lat = lat;
      state.lng = lng;
      mapCoords.textContent = "lat " + lat.toFixed(5) + ", lng " + lng.toFixed(5);

      if (reportMarker) {
        reportMarker.setLatLng([lat, lng]);
      }
      if (reportMap && opts.recenter) {
        reportMap.setView([lat, lng], opts.zoom || reportMap.getZoom());
      }

      if (isWithinMysuru(lat, lng)) {
        showLocationStatus("Location set within Mysuru.", "ok");
      } else {
        showLocationStatus(
          "Mysuru Civic Connect currently accepts complaints within Mysuru only. " +
          "The pin looks like it's outside Mysuru.",
          "warn"
        );
      }
      updateSummary();
    }

    function initReportMap() {
      var mapEl = document.getElementById("mapCanvas");
      if (!mapEl || typeof L === "undefined") return;

      reportMap = L.map("mapCanvas", { zoomControl: true }).setView(DEFAULT_MAP_CENTER, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(reportMap);

      reportMarker = L.marker(DEFAULT_MAP_CENTER, { draggable: true }).addTo(reportMap);

      reportMarker.on("dragend", function () {
        var pos = reportMarker.getLatLng();
        setMapPoint(pos.lat, pos.lng);
      });

      reportMap.on("click", function (e) {
        setMapPoint(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(function () { reportMap.invalidateSize(); }, 200);
    }

    initReportMap();

    /* ---- Address search ---- */
    addressSearch.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();

      var query = addressSearch.value.trim();
      if (!query) return;

      showLocationStatus("Searching for that address...", "ok");

      var url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(query + ", Mysuru, Karnataka, India");

      fetch(url, { headers: { "Accept": "application/json" } })
        .then(function (res) { return res.json(); })
        .then(function (results) {
          if (!results || !results.length) {
            showLocationStatus("Couldn't find that address. Try a nearby landmark, or drop the pin manually.", "warn");
            return;
          }
          var lat = parseFloat(results[0].lat);
          var lng = parseFloat(results[0].lon);
          setMapPoint(lat, lng, { recenter: true, zoom: 16 });
        })
        .catch(function () {
          showLocationStatus("Address search failed. You can still drop the pin manually on the map.", "warn");
        });
    });

    /* ---- Photo upload & AI Auto-Analyzer integration ---- */
    var dropzone = document.getElementById("uploadDropzone");
    var photoInput = document.getElementById("photoInput");
    var photoPreviews = document.getElementById("photoPreviews");
    var uploadLimitMsg = document.getElementById("uploadLimitMsg");
    var MAX_PHOTOS = 5;

    // Create AI Trigger & Status Bar dynamically right below the dropzone
    var aiControls = document.createElement("div");
    aiControls.id = "aiAnalyzerControls";
    aiControls.style.display = "none";
    aiControls.style.marginTop = "12px";
    aiControls.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 12px 14px; background: #e7f4ea; border: 1px solid #b9d2bd; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">✨</span>
          <span style="font-size: 0.9rem; font-weight: 600; color: #1e5c37;">AI Photo Analyzer</span>
          <span id="aiRunningStatus" style="font-size: 0.85rem; color: #58685c; display: none;">Analyzing image with Gemini...</span>
        </div>
        <button type="button" id="btnTriggerAi" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.88rem;">
          ✨ Auto-Fill with AI
        </button>
      </div>
      <div id="aiBannerSuccess" style="display: none; margin-top: 8px; padding: 8px 12px; background: #ffffff; border: 1px solid #2f7d4f; border-radius: 6px; font-size: 0.85rem; color: #16231a;">
        <strong>AI Detected:</strong> <span id="aiResultText"></span>
      </div>
    `;
    dropzone.parentNode.insertBefore(aiControls, photoPreviews);

    var btnTriggerAi = document.getElementById("btnTriggerAi");
    var aiRunningStatus = document.getElementById("aiRunningStatus");
    var aiBannerSuccess = document.getElementById("aiBannerSuccess");
    var aiResultText = document.getElementById("aiResultText");

    btnTriggerAi.addEventListener("click", function () {
      if (!state.photos.length) return;
      runAiAnalysis(state.photos[0].file);
    });

   function runAiAnalysis(file) {
      btnTriggerAi.disabled = true;
      btnTriggerAi.textContent = "Analyzing...";
      aiRunningStatus.style.display = "inline";
      aiRunningStatus.style.color = "#58685c";
      aiBannerSuccess.style.display = "none";

      MycApi.analyzePhoto(file, function (stepMessage) {
        aiRunningStatus.textContent = stepMessage;
      })
        .then(function (result) {
          aiRunningStatus.textContent = "Populating form fields...";

          // 1. Auto-select category radio button
          if (result.problemTypeId) {
            var targetRadio = document.getElementById("problem-" + result.problemTypeId);
            if (targetRadio) {
              targetRadio.checked = true;
              var matched = PROBLEM_TYPES.find(function (t) { return t.id === result.problemTypeId; });
              if (matched) {
                state.problemType = matched.label;
                state.problemTypeId = matched.id;
              }
            }
          }

          // 2. Auto-fill English + Kannada descriptions
          var combinedDesc = (result.description_en || "").trim();
          if (result.description_kn) {
            combinedDesc += "\n\nವಿವರಣೆ (ಕನ್ನಡ):\n" + result.description_kn.trim();
          }

          if (combinedDesc) {
            description.value = combinedDesc;
            state.description = combinedDesc;
            charCount.textContent = String(combinedDesc.length);
          }

          // 3. Set detected Urgency
          if (result.urgency) {
            state.priority = result.urgency.toLowerCase();
          }

          // 4. Show success banner
          aiResultText.textContent = (state.problemType || "Civic Issue") + " · Urgency: " + (result.urgency || "Medium") + " · Kannada Translation Added";
          aiBannerSuccess.style.display = "block";
          aiRunningStatus.style.display = "none";

          updateSummary();
        })
        .catch(function (err) {
          console.error("AI Analysis error:", err);
          aiRunningStatus.style.display = "inline";
          aiRunningStatus.style.color = "#dc2626";
          aiRunningStatus.textContent = "Error: " + (err.name === 'AbortError' ? 'Request timed out' : err.message);
        })
        .finally(function () {
          btnTriggerAi.disabled = false;
          btnTriggerAi.textContent = "✨ Auto-Fill with AI";
        });
    }

    dropzone.addEventListener("click", function () {
      photoInput.click();
    });

    dropzone.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        photoInput.click();
      }
    });

    ["dragover", "dragenter"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach(function (evt) {
      dropzone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropzone.classList.remove("dragover");
      });
    });

    dropzone.addEventListener("drop", function (e) {
      handleFiles(e.dataTransfer.files);
    });

    photoInput.addEventListener("change", function () {
      handleFiles(photoInput.files);
      photoInput.value = "";
    });

    function handleFiles(fileList) {
      var files = Array.prototype.slice.call(fileList).filter(function (file) {
        return /image\/(jpeg|png)/.test(file.type);
      });

      var remaining = MAX_PHOTOS - state.photos.length;
      if (files.length > remaining) {
        uploadLimitMsg.classList.add("show");
      } else {
        uploadLimitMsg.classList.remove("show");
      }

      files.slice(0, remaining).forEach(function (file) {
        var url = URL.createObjectURL(file);
        var photo = { file: file, url: url, id: Date.now() + Math.random() };
        state.photos.push(photo);
        renderPhotoThumb(photo);
      });

      if (state.photos.length > 0) {
        aiControls.style.display = "block";
      } else {
        aiControls.style.display = "none";
        aiBannerSuccess.style.display = "none";
      }

      updateSummary();
    }

    function renderPhotoThumb(photo) {
      var thumb = document.createElement("div");
      thumb.className = "photo-thumb";
      thumb.dataset.id = photo.id;

      var img = document.createElement("img");
      img.src = photo.url;
      img.alt = "Uploaded photo preview";

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.innerHTML = "&times;";
      removeBtn.setAttribute("aria-label", "Remove photo");
      removeBtn.addEventListener("click", function () {
        state.photos = state.photos.filter(function (p) { return p.id !== photo.id; });
        thumb.remove();
        uploadLimitMsg.classList.remove("show");
        if (!state.photos.length) {
          aiControls.style.display = "none";
          aiBannerSuccess.style.display = "none";
        }
        updateSummary();
      });

      thumb.appendChild(img);
      thumb.appendChild(removeBtn);
      photoPreviews.appendChild(thumb);
    }

    /* ---- Live summary ---- */
    function updateSummary() {
      setSummaryValue("summaryProblem", state.problemType);
      setSummaryValue("summaryDescription", state.description ? truncate(state.description, 90) : "");

      var locationText = "";
      if (state.locality) {
        var w = state.wardId !== null ? (" (Ward " + state.wardId + ")") : "";
        locationText = state.locality + w + ", Mysuru";
      } else if (state.address) {
        locationText = state.address + ", Mysuru";
      }
      setSummaryValue("summaryLocation", locationText);

      var photosEmpty = document.getElementById("summaryPhotosEmpty");
      var photosWrap = document.getElementById("summaryPhotos");
      photosWrap.innerHTML = "";
      if (state.photos.length > 0) {
        photosEmpty.style.display = "none";
        state.photos.forEach(function (photo) {
          var img = document.createElement("img");
          img.src = photo.url;
          img.alt = "";
          photosWrap.appendChild(img);
        });
      } else {
        photosEmpty.style.display = "block";
      }
    }

    function setSummaryValue(elId, value) {
      var el = document.getElementById(elId);
      if (!el) return;
      if (value) {
        el.textContent = value;
        el.classList.remove("placeholder");
      } else {
        el.textContent = placeholderFor(elId);
        el.classList.add("placeholder");
      }
    }

    function placeholderFor(elId) {
      var map = {
        summaryProblem: "Not selected yet",
        summaryDescription: "Not entered yet",
        summaryLocation: "Not set yet"
      };
      return map[elId] || "—";
    }

    function truncate(text, max) {
      return text.length > max ? text.slice(0, max).trim() + "…" : text;
    }

    /* ---- Submit ---- */
    var form = document.getElementById("reportForm");
    var reportFormWrap = document.getElementById("reportFormWrap");
    var successOverlay = document.getElementById("successOverlay");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!state.problemType) {
        showLocationStatus("Please choose a problem type before submitting.", "warn");
        grid.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (!state.locality && !state.address) {
        showLocationStatus("Please add a location before submitting.", "warn");
        document.getElementById("localitySelect").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (state.lat !== null && state.lng !== null && !isWithinMysuru(state.lat, state.lng)) {
        showLocationStatus("Mysuru Civic Connect currently accepts complaints within Mysuru only.", "warn");
        return;
      }

      if (typeof MycApi === "undefined" || !MycApi.isConfigured()) {
        showSubmitError("The complaint backend isn't connected yet. Set MYC_API_URL in api.js.");
        return;
      }

      var submitBtn = document.getElementById("submitBtn");
      submitBtn.disabled = true;
      var originalBtnText = submitBtn.textContent;
      submitBtn.textContent = "Submitting…";
      hideSubmitError();

      MycApi.createComplaint({
        category: state.problemType,
        description: state.description,
        locality: state.locality,
        wardId: state.wardId,
        address: state.address,
        lat: state.lat,
        lng: state.lng,
        priority: state.priority || "medium",
        photos: state.photos.map(function (p) { return p.file; })
      })
        .then(function (result) {
          if (result.error) throw new Error(result.error);

          var locationText = state.locality ? (state.locality + ", Mysuru") : (state.address + ", Mysuru");

          document.getElementById("successId").textContent = "Complaint ID: " + result.id;
          document.getElementById("successLocation").textContent = locationText;
          document.getElementById("successType").textContent = state.problemType;

          reportFormWrap.classList.add("hide");
          successOverlay.classList.add("show");
          window.scrollTo({ top: 0, behavior: "smooth" });
        })
        .catch(function (err) {
          console.error("Complaint submission failed:", err);
          showSubmitError("Something went wrong submitting your complaint. Please try again.");
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        });
    });

    function showSubmitError(msg) {
      var el = document.getElementById("submitError");
      if (!el) return;
      el.textContent = msg;
      el.style.display = "block";
    }

    function hideSubmitError() {
      var el = document.getElementById("submitError");
      if (!el) return;
      el.style.display = "none";
    }

    var reportAnotherBtn = document.getElementById("reportAnotherBtn");
    if (reportAnotherBtn) {
      reportAnotherBtn.addEventListener("click", function () {
        window.location.reload();
      });
    }

    updateSummary();
  }

  /* ---------------------------------------------------------
     Init
     --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReportForm();
  });
})();