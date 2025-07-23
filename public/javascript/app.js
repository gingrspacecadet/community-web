document.addEventListener("DOMContentLoaded", () => {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const descriptionInput = document.getElementById("descriptionInput");
  const tagsInput = document.getElementById("tagsInput");
  const container = document.createElement("div");
  container.className = "components-list";
  document.querySelector(".app-container").appendChild(container);

  async function fetchAndDisplayComponents() {
    container.innerHTML = "<h2>Uploaded Components</h2>";
    try {
      const res = await fetch("/api/components/list");
      const data = await res.json();
      if (data.components && data.components.length > 0) {
        const list = document.createElement("ul");
        data.components.forEach((comp) => {
          const li = document.createElement("li");
          let userDisplay = comp.username
            ? `<span style="color:#888">by ${comp.username}</span><br/>`
            : "";
          // Escape HTML for name, description, and tags
          function escapeHtml(str) {
            return str.replace(/[&<>"']/g, function(tag) {
              const chars = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
              };
              return chars[tag] || tag;
            });
          }
          const safeName = escapeHtml(comp.name);
          const safeDescription = escapeHtml(comp.description || "");
          let tagsDisplay =
            comp.tags && comp.tags.length
              ? `<div class="tags-list">${comp.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(" ")}</div>`
              : "";
          li.innerHTML = `<strong>${safeName}</strong> <small>(${comp.created_at})</small><br/>${userDisplay}<em>${safeDescription}</em>${tagsDisplay}`;

          // Button group container for vertical alignment and centering
          const btnGroup = document.createElement("div");
          btnGroup.className = "button-group vertical";

          const downloadBtn = document.createElement("button");
          downloadBtn.textContent = "Download";
          downloadBtn.addEventListener("click", () => {
            const base64 = comp.data || "";
            if (!base64) {
              alert("No file data available.");
              return;
            }
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = comp.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          });
          btnGroup.appendChild(downloadBtn);

          const copyBtn = document.createElement("button");
          copyBtn.textContent = "Copy";
          copyBtn.addEventListener("click", async () => {
            const base64 = comp.data || "";
            if (!base64) {
              alert("No file data available.");
              return;
            }
            try {
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              // Convert bytes to string (plain text body)
              const decoder = new TextDecoder();
              const text = decoder.decode(bytes);
              await navigator.clipboard.writeText(text);
              alert("File body copied to clipboard as plain text!");
            } catch (err) {
              alert("Failed to copy: " + err);
            }
          });
          btnGroup.appendChild(copyBtn);
          li.appendChild(btnGroup);
          list.appendChild(li);
        });
        container.appendChild(list);
      } else {
        container.innerHTML += "<p>No components uploaded yet.</p>";
      }
    } catch (err) {
      container.innerHTML += "<p>Error loading components.</p>";
    }
  }

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    const description = descriptionInput.value.trim();
    const tags = tagsInput.value.trim();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }
    if (!description) {
      alert("Please enter a description.");
      return;
    }

    const allowedExt = [".nbt", ".bp", ".schem"];
    const fileName = file.name.toLowerCase();
    if (!allowedExt.some((ext) => fileName.endsWith(ext))) {
      alert("Invalid file type. Only .nbt, .bp, or .schem files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("fileInput", file);
    formData.append("descriptionInput", description);
    formData.append("tagsInput", tags);

    const username = getCookie("username");
    if (username) {
      formData.append("username", username);
    }

    try {
      const response = await fetch("/api/components/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        alert("File uploaded successfully!");
        fileInput.value = "";
        descriptionInput.value = "";
        tagsInput.value = "";
        fetchAndDisplayComponents();
      } else {
        alert("Upload failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      alert("Upload error: " + err.message);
    }
  });

  async function isAdmin() {
    const username = getCookie("username");
    const admins = ['_justparrot', 'thehuckle', 'gingrspacecadet'];
    return admins.includes(username);
  }

  async function renderAdminLink() {
    if (await isAdmin()) {
      let nav = document.querySelector('nav');
      if (!nav) {
        nav = document.createElement('nav');
        document.body.insertBefore(nav, document.body.firstChild);
      }
      const adminLink = document.createElement('a');
      adminLink.href = '/pages/admin.html';
      adminLink.textContent = 'Admin';
      nav.appendChild(adminLink);
    }
  }

  renderAdminLink();
  fetchAndDisplayComponents();
});
