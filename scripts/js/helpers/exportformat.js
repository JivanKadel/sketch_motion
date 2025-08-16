//  Shows a dialog to choose PNG export background.
//  Returns: { bg: 'transparent' | 'white', cancelled: boolean }

export default function showExportBackgroundDialog() {
  console.log("showExportBackgroundDialog called");

  // Create dialog elements
  const dialog = document.createElement("div");
  dialog.style.position = "fixed";
  dialog.style.top = "0";
  dialog.style.left = "0";
  dialog.style.width = "100vw";
  dialog.style.height = "100vh";
  dialog.style.background = "rgba(0,0,0,0.5)";
  dialog.style.display = "flex";
  dialog.style.alignItems = "center";
  dialog.style.justifyContent = "center";
  dialog.style.zIndex = "9999";

  // Detect dark mode (uses prefers-color-scheme)
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const box = document.createElement("div");
  box.style.background = isDark ? "#222" : "#fff";
  box.style.color = isDark ? "#eee" : "#222";
  box.style.padding = "24px 32px";
  box.style.borderRadius = "8px";
  box.style.boxShadow = isDark
    ? "0 2px 16px rgba(0,0,0,0.7)"
    : "0 2px 8px rgba(0,0,0,0.2)";
  box.style.minWidth = "260px";
  box.style.border = isDark ? "1px solid #444" : "1px solid #ccc";

  const title = document.createElement("h3");
  title.textContent = "Export PNG Background";
  title.style.marginTop = "0";
  title.style.marginBottom = "16px";
  title.style.color = isDark ? "#fff" : "#222";

  const form = document.createElement("form");
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "12px";

  // Radio options
  const transparentOption = document.createElement("label");
  transparentOption.style.color = isDark ? "#eee" : "#222";
  const transparentRadio = document.createElement("input");
  transparentRadio.type = "radio";
  transparentRadio.name = "bg";
  transparentRadio.value = "transparent";
  transparentRadio.checked = true;
  transparentOption.appendChild(transparentRadio);
  transparentOption.appendChild(
    document.createTextNode(" Transparent (default)")
  );

  const whiteOption = document.createElement("label");
  whiteOption.style.color = isDark ? "#eee" : "#222";
  const whiteRadio = document.createElement("input");
  whiteRadio.type = "radio";
  whiteRadio.name = "bg";
  whiteRadio.value = "white";
  whiteOption.appendChild(whiteRadio);
  whiteOption.appendChild(document.createTextNode(" White"));

  // Buttons
  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.justifyContent = "flex-end";
  btnRow.style.gap = "8px";

  const exportBtn = document.createElement("button");
  exportBtn.type = "submit";
  exportBtn.textContent = "Export";
  exportBtn.style.padding = "6px 16px";
  exportBtn.style.background = isDark ? "#444" : "#eee";
  exportBtn.style.color = isDark ? "#fff" : "#222";
  exportBtn.style.border = isDark ? "1px solid #666" : "1px solid #ccc";
  exportBtn.style.borderRadius = "4px";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.padding = "6px 16px";
  cancelBtn.style.background = isDark ? "#444" : "#eee";
  cancelBtn.style.color = isDark ? "#fff" : "#222";
  cancelBtn.style.border = isDark ? "1px solid #666" : "1px solid #ccc";
  cancelBtn.style.borderRadius = "4px";

  btnRow.appendChild(cancelBtn);
  btnRow.appendChild(exportBtn);

  form.appendChild(transparentOption);
  form.appendChild(whiteOption);
  form.appendChild(btnRow);

  box.appendChild(title);
  box.appendChild(form);
  dialog.appendChild(box);
  document.body.appendChild(dialog);

  // Cancel when clicking outside the dialog box
  dialog.addEventListener("mousedown", (e) => {
    if (e.target === dialog) {
      document.body.removeChild(dialog);
      // Use same resolve logic as cancelBtn
      if (typeof cancelBtn.onclick === "function") {
        cancelBtn.onclick();
      }
    }
  });

  return new Promise((resolve) => {
    form.onsubmit = (e) => {
      e.preventDefault();
      const bg = form.bg.value;
      console.log("Export background selected:", bg);
      document.body.removeChild(dialog);
      resolve({ bg, cancelled: false });
    };
    cancelBtn.onclick = () => {
      document.body.removeChild(dialog);
      resolve({ bg: "transparent", cancelled: true });
    };
  });
}
