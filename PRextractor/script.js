const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const analyzeBtn = document.getElementById("analyzeBtn");

let selectedImage = null;

// ======================================================
// IMAGE UPLOAD
// ======================================================

imageInput.addEventListener("change", function () {
  const file = this.files[0];

  if (!file) return;

  selectedImage = file;

  const reader = new FileReader();

  reader.onload = function (e) {
    preview.src = e.target.result;

    preview.classList.remove("d-none");

    document.getElementById("uploadContent").classList.add("d-none");
  };

  reader.readAsDataURL(file);
});

// ======================================================
// ANALYZE IMAGE
// ======================================================

// ======================================================
// ANALYZE IMAGE
// ======================================================

async function analyzeImage() {
  // ==================================================
  // GET ELEMENTS
  // ==================================================

  const apiKey = document.getElementById("apiKey").value.trim();

  const modelStatus = document.getElementById("modelStatus");

  const loading = document.getElementById("loading");

  const scanOverlay = document.getElementById("scanOverlay");

  // ==================================================
  // VALIDATION FIRST
  // ==================================================

  if (!apiKey) {
    alert("Please enter your Gemini API key.");

    return;
  }

  if (!selectedImage) {
    alert("Please upload an image.");

    return;
  }

  // ==================================================
  // NOW WE ARE ACTUALLY ANALYZING
  // ==================================================

  analyzeBtn.disabled = true;

  loading.classList.remove("d-none");

  scanOverlay.classList.add("active");

  // ==================================================
  // ANIMATION MESSAGES
  // ==================================================

  const messages = [
    "Reading document...",

    "Detecting table structure...",

    "Recognizing text...",

    "Analyzing quantities...",

    "Checking prices...",

    "Organizing extracted data...",
  ];

  let messageIndex = 0;

  // Show first message immediately

  modelStatus.innerText = `✨ ${messages[0]}`;

  // Start changing messages

  const messageInterval = setInterval(() => {
    messageIndex++;

    if (messageIndex >= messages.length) {
      messageIndex = 0;
    }

    modelStatus.innerText = `✨ ${messages[messageIndex]}`;
  }, 1200);

  // ==================================================
  // TRY
  // ==================================================

  try {
    // ==================================================
    // CONVERT IMAGE TO BASE64
    // ==================================================

    const base64 = await fileToBase64(selectedImage);

    // ==================================================
    // GEMINI PROMPT
    // ==================================================

    const prompt = `
You are an OCR document extraction system.

Analyze this image of a procurement request.

Extract the following information.

DOCUMENT:

- pr_no
- office
- grand_total

TABLE:

Extract EVERY item from the table.

Each item must contain:

- item_no
- quantity
- unit
- description
- unit_cost
- total_cost

IMPORTANT RULES:

1. Do not omit any table rows.
2. Do not invent values.
3. If something is unreadable, use null.
4. Remove currency symbols from numeric values.
5. Return numeric fields as numbers.
6. Preserve the wording of descriptions.
7. Preserve the capitalization of descriptions when possible.
8. Verify quantity × unit_cost against total_cost.
9. Extract the complete table.
10. Return ONLY valid JSON.

Return exactly this structure:

{
    "document": {
        "pr_no": "",
        "office": "",
        "grand_total": 0
    },
    "items": [
        {
            "item_no": 1,
            "quantity": 0,
            "unit": "",
            "description": "",
            "unit_cost": 0,
            "total_cost": 0
        }
    ]
}
`;

    // ==================================================
    // MODELS
    // ==================================================

    const models = [
      
       "gemini-2.5-flash",
       "gemini-2.5 Flash-Lite",
       "gemini-3.1-flash",
      "gemini-3.8-flash",

      "gemini-3.7-flash",

      "gemini-3.6-flash",

      "gemini-3.5-flash",
    ];

    let response = null;

    let data = null;

    let successfulModel = null;

    // ==================================================
    // TRY MODELS
    // ==================================================

    for (const model of models) {
      console.log("Trying model:", model);

      modelStatus.innerText = `✨ Connecting to ${model}...`;

      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            "x-goog-api-key": apiKey,
          },

          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },

                  {
                    inline_data: {
                      mime_type: selectedImage.type,

                      data: base64.split(",")[1],
                    },
                  },
                ],
              },
            ],

            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        },
      );

      // ==================================================
      // READ RESPONSE
      // ==================================================

      data = await response.json();

      // ==================================================
      // SUCCESS
      // ==================================================

      if (response.ok) {
        successfulModel = model;

        console.log("Successful model:", model);

        break;
      }

      // ==================================================
      // ERROR
      // ==================================================

      console.warn(`${model} failed:`, response.status, data);

      // Try another model only for temporary problems

      if (response.status !== 503 && response.status !== 429) {
        break;
      }
    }

    // ==================================================
    // ALL MODELS FAILED
    // ==================================================

    if (!response || !response.ok) {
      throw new Error(
        data?.error?.message ||
          `Gemini API failed with status ${response?.status || "unknown"}`,
      );
    }

    // ==================================================
    // SUCCESS STATUS
    // ==================================================

    modelStatus.innerText = `✓ Analyzed using ${successfulModel}`;

    console.log("Gemini response:", data);

    // ==================================================
    // GET GEMINI TEXT
    // ==================================================

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log("Gemini JSON text:", text);

    // ==================================================
    // PARSE JSON
    // ==================================================

    const result = JSON.parse(text);

    console.log("Parsed result:", result);

    // ==================================================
    // DISPLAY RESULT
    // ==================================================

    displayResult(result);
  } catch (error) {
    console.error("OCR ERROR:", error);

    alert("Error:\n\n" + error.message);

    modelStatus.innerText = "❌ Analysis failed";
  } finally {
    // ==================================================
    // STOP EVERYTHING
    // ==================================================

    clearInterval(messageInterval);

    loading.classList.add("d-none");

    analyzeBtn.disabled = false;

    scanOverlay.classList.remove("active");
  }
}
// ======================================================
// ANALYZE BUTTON
// ======================================================

analyzeBtn.addEventListener("click", analyzeImage);

// ======================================================
// FILE → BASE64
// ======================================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

// ======================================================
// DISPLAY RESULT
// ======================================================

function displayResult(result) {
  document.getElementById("documentInfo").classList.remove("d-none");

  document.getElementById("tableContainer").classList.remove("d-none");

  document.getElementById("actions").classList.remove("d-none");

  // ----------------------------------------------
  // Document information
  // ----------------------------------------------

  document.getElementById("prNo").value = result.document?.pr_no || "";

  document.getElementById("office").value = result.document?.office || "";

  // ----------------------------------------------
  // Table
  // ----------------------------------------------

  const tbody = document.getElementById("resultBody");

  tbody.innerHTML = "";

  if (result.items && Array.isArray(result.items)) {
    result.items.forEach((item) => {
      addRow(item);
    });
  }

  // ----------------------------------------------
  // Calculate total
  // ----------------------------------------------

  calculateGrandTotal();
}

// ======================================================
// ADD ROW
// ======================================================

function addRow(item = {}) {
  const tbody = document.getElementById("resultBody");

  const row = document.createElement("tr");

  row.innerHTML = `

        <td contenteditable="true">
            ${item.item_no ?? ""}
        </td>

        <td contenteditable="true">
            ${item.quantity ?? ""}
        </td>

        <td contenteditable="true">
            ${item.unit ?? ""}
        </td>

        <td contenteditable="true">
            ${item.description ?? ""}
        </td>

        <td contenteditable="true">
            ${item.unit_cost ?? ""}
        </td>

        <td contenteditable="true">
            ${item.total_cost ?? ""}
        </td>

    `;

  tbody.appendChild(row);

  row.addEventListener("input", calculateGrandTotal);
}

// ======================================================
// CALCULATE GRAND TOTAL
// ======================================================

function calculateGrandTotal() {
  const rows = document.querySelectorAll("#resultBody tr");

  let total = 0;

  rows.forEach((row) => {
    const value = parseFloat(row.cells[5].innerText) || 0;

    total += value;
  });

  document.getElementById("grandTotal").innerText =
    "₱" +
    total.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    });
}

// ======================================================
// EXPORT TO EXCEL
// ======================================================

function exportExcel() {
  const table = document.getElementById("resultTable");

  const workbook = XLSX.utils.table_to_book(table, {
    sheet: "Purchase Request",
  });

  XLSX.writeFile(workbook, "purchase-request.xlsx");
}
