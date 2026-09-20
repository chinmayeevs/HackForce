/**
 * =========================================================
 * Mysuru Civic Connect — shared frontend API client
 * =========================================================
 * Used by report.html (submitting a complaint) and worker.html
 * (listing / accepting / rejecting / assigning / completing
 * complaints). Both pages just call the MycApi.* methods below;
 * this file is the only place that knows the actual backend URL.
 *
 * SETUP: paste your deployed Apps Script Web App URL (the one
 * ending in /exec) into MYC_API_URL below.
 * =========================================================
 */

var MYC_API_URL = "https://script.google.com/macros/s/AKfycbz6khr35OUQA_iksv1RefGH1jct3gck9fLz5oFLbsL6kZuouMCX8ct8Cf9wRj9z1VY/exec";

// Gemini API Key for civic photo analysis
var GEMINI_API_KEY = "AQ.Ab8RN6JLKfH9_Ha9Pe7LyRLiFym9st-SmrbCjTGCnjz3TFBYpg";

var MycApi = (function () {

  function isConfigured() {
    return !!MYC_API_URL && MYC_API_URL.indexOf("PASTE_") !== 0;
  }

  function post(payload) {
    return fetch(MYC_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function () {
      return { ok: true };
    });
  }

  function get(params) {
    var query = Object.keys(params || {})
      .filter(function (k) { return params[k] !== undefined && params[k] !== null && params[k] !== ""; })
      .map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); })
      .join("&");
    var sep = MYC_API_URL.indexOf("?") === -1 ? "?" : "&";
    return fetch(MYC_API_URL + (query ? sep + query : ""))
      .then(function (res) { return res.json(); });
  }

  function getCitizenToken() {
    var key = "mcc_citizen_token";
    var token = localStorage.getItem(key);
    if (!token) {
      token = "cit-" + Date.now() + "-" + Math.floor(Math.random() * 1e6);
      localStorage.setItem(key, token);
    }
    return token;
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Fast client-side image compressor (converts 10MB phone photo -> 50KB in ~30ms)
  function compressImageForAI(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var maxDim = 800;
          var width = img.width;
          var height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          var dataUrl = canvas.toDataURL("image/jpeg", 0.75);
          resolve(dataUrl.replace(/^data:image\/\w+;base64,/, ""));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---- AI Photo Analyzer (Using gemini-3.6-flash) ----
  function analyzePhoto(file, onProgress) {
    if (!GEMINI_API_KEY) {
      return Promise.reject(new Error("Gemini API key is missing."));
    }

    if (onProgress) onProgress("Optimizing image for AI...");

    return compressImageForAI(file).then(function (base64Data) {
      if (onProgress) onProgress("Connecting to Gemini 3.6 Flash...");

      var prompt = "You are an official civic inspector for Mysuru City Corporation (MCC), Karnataka. " +
        "Analyze this photo of a civic problem. " +
        "Return ONLY a valid raw JSON object with: " +
        "1. 'problemTypeId': select exactly one from ['pothole', 'garbage', 'streetlight', 'drainage', 'water', 'debris', 'publicspace', 'traffic', 'other']. " +
        "2. 'urgency': 'Low', 'Medium', or 'High'. " +
        "3. 'description_en': concise 40-70 word formal complaint description in English. " +
        "4. 'description_kn': accurate, formal Kannada translation of the complaint description in Kannada script. " +
        "5. 'tags': array of 3-4 short tags.";

      var requestPayload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              },
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 18000);

      var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" + GEMINI_API_KEY;

      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      })
      .then(function (res) {
        clearTimeout(timeoutId);
        if (!res.ok) {
          return res.json().then(function (err) {
            var msg = (err && err.error && err.error.message) || ("HTTP " + res.status);
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then(function (data) {
        var text = data && data.candidates && data.candidates[0] &&
                   data.candidates[0].content && data.candidates[0].content.parts &&
                   data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

        if (!text) throw new Error("Empty response received from AI.");
        text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
        return JSON.parse(text);
      });
    });
  }

  // ---- Citizen-facing (report.html, complaints.html) ----

  function createComplaint(fields) {
    var photoFiles = fields.photos || [];
    var citizenToken = getCitizenToken();

    return Promise.all(
      photoFiles.map(function (file) {
        return readFileAsDataURL(file).then(function (dataUrl) {
          return { data: dataUrl, type: file.type, name: file.name };
        });
      })
    ).then(function (photoPayloads) {
      return post({
        action: "create",
        category: fields.category || "",
        description: fields.description || "",
        locality: fields.locality || "",
        address: fields.address || "",
        lat: fields.lat != null ? fields.lat : null,
        lng: fields.lng != null ? fields.lng : null,
        wardId: fields.wardId != null ? fields.wardId : null,
        citizenToken: citizenToken,
        photos: photoPayloads,
        priority: fields.priority || "medium"
      });
    }).then(function () {
      return get({ action: "list", citizenToken: citizenToken });
    }).then(function (result) {
      if (!result || result.error || !result.complaints || !result.complaints.length) {
        throw new Error("Complaint may have been submitted, but we couldn't confirm it. Please check My Complaints.");
      }
      return result.complaints[0];
    });
  }

  function listMyComplaints() {
    return get({ action: "list", citizenToken: getCitizenToken() });
  }

  // ---- Worker/authority-facing (worker.html) ----

  function listComplaints(params) {
    return get(Object.assign({ action: "list" }, params || {}));
  }

  function getComplaint(id) {
    return get({ action: "get", id: id });
  }

  function acceptComplaint(id) {
    return post({ action: "acceptComplaint", id: id });
  }

  function rejectComplaint(id) {
    return post({ action: "rejectComplaint", id: id });
  }

  function assignWorker(id, workerId) {
    return post({ action: "assignWorker", id: id, workerId: workerId });
  }

  function markCompletion(id) {
    return post({ action: "markCompletion", id: id });
  }

  function verify(id) {
    return post({ action: "verify", id: id });
  }

  return {
    isConfigured: isConfigured,
    getCitizenToken: getCitizenToken,
    analyzePhoto: analyzePhoto,
    createComplaint: createComplaint,
    listMyComplaints: listMyComplaints,
    listComplaints: listComplaints,
    getComplaint: getComplaint,
    acceptComplaint: acceptComplaint,
    rejectComplaint: rejectComplaint,
    assignWorker: assignWorker,
    markCompletion: markCompletion,
    verify: verify
  };

})();