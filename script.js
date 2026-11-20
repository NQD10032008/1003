for (const [wrongPhrase, rightPhrase] of COMMON_OCR_FIXES.entries()) {
    if (wrongPhrase.includes(" ")) {
      const regex = new RegExp(`\\b${wrongPhrase}\\b`, "gi");
      fixed = fixed.replace(regex, (match) => {
        if (/^[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ]/.test(match)) {
          return rightPhrase.charAt(0).toUpperCase() + rightPhrase.slice(1);
        }
        return rightPhrase;
      });
    }
  }

  return fixed.trim();
}

function postProcessOcrText(rawText) {
  if (!rawText) return "";
  return rawText
    .normalize("NFC")
    .split(/\r?\n/)
    .map(fixVietnameseSpellingLine)
    .filter(Boolean)
    .join("\n")
    .trim();
}

function applyProcessedResult(rawText) {
  const noNoiseText = removeOcrNoise(rawText);
  return postProcessOcrText(noNoiseText);
}

// --- 3. KHỞI TẠO GIAO DIỆN, CHỌN ẢNH & OCR ---
document.addEventListener("DOMContentLoaded", () => {
  const selectImageBtn = document.getElementById("selectImageBtn");
  const imageInput = document.getElementById("imageInput");
  const dropZone = document.getElementById("dropZone");
  const recognizeBtn = document.getElementById("recognizeBtn");
  const resultText = document.getElementById("resultText");
  const activeCategoryBadge = document.getElementById("activeCategoryBadge");
  const messageBox = document.getElementById("messageBox");
  const progressWrapper = document.getElementById("progressWrapper");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const copyBtn = document.getElementById("copyBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");

  let selectedFiles = [];
  let lastOcrOutputSnapshot = "";

  function setStatus(msg, isError = false) {
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.classList.remove("hidden");
    messageBox.style.color = isError ? "#b91c1c" : "";
  }

  function handleFilesSelected(files) {
    selectedFiles = Array.from(files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (selectedFiles.length > 0) {
      if (recognizeBtn) recognizeBtn.disabled = false;
      setStatus(`Đã chọn ${selectedFiles.length} ảnh: ${selectedFiles[0].name}`);
    } else {
      if (recognizeBtn) recognizeBtn.disabled = true;
      setStatus("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WEBP...).", true);
    }
  }

  if (selectImageBtn && imageInput) {
    selectImageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      imageInput.value = "";
      imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener("change", (e) => {
      handleFilesSelected(e.target.files);
    });
  }

  if (dropZone) {