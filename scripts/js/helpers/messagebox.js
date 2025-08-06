export function showMessageBox(message) {
  // Simple modal implementation for demonstration
  const modal = document.createElement("div");
  modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #333;
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 15px;
      align-items: center;
      max-width: 300px;
      text-align: center;
    `;
  modal.innerHTML = `
      <p>${message}</p>
      <button style="
        padding: 8px 15px;
        background: #0078d4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">OK</button>
    `;
  document.body.appendChild(modal);
  const okButton = modal.querySelector("button");
  okButton?.addEventListener("click", () => {
    document.body.removeChild(modal);
  });
}
