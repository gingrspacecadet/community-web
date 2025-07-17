// app.js - Handles frontend file upload logic
document.addEventListener('DOMContentLoaded', () => {
  const uploadForm = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const descriptionInput = document.getElementById('descriptionInput');
  const container = document.createElement('div');
  container.className = 'components-list';
  document.querySelector('.app-container').appendChild(container);

  async function fetchAndDisplayComponents() {
    container.innerHTML = '<h2>Uploaded Components</h2>';
    try {
      const res = await fetch('/api/components/list');
      const data = await res.json();
      if (data.components && data.components.length > 0) {
        const list = document.createElement('ul');
        data.components.forEach(comp => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${comp.name}</strong> <small>(${comp.created_at})</small><br/><em>${comp.description || ''}</em>`;

          // Download button
          const downloadBtn = document.createElement('button');
          downloadBtn.textContent = 'Download';
          downloadBtn.style.marginLeft = '1em';
          downloadBtn.addEventListener('click', () => {
            // Decode base64 to binary and trigger download
            const base64 = comp.data || '';
            if (!base64) {
              alert('No file data available.');
              return;
            }
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const blob = new Blob([bytes]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = comp.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          });
          li.appendChild(downloadBtn);
          list.appendChild(li);
        });
        container.appendChild(list);
      } else {
        container.innerHTML += '<p>No components uploaded yet.</p>';
      }
    } catch (err) {
      container.innerHTML += '<p>Error loading components.</p>';
    }
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    const description = descriptionInput.value.trim();

    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    if (!description) {
      alert('Please enter a description.');
      return;
    }

    // Validate file extension
    const allowedExt = ['.nbt', '.bp', '.schem'];
    const fileName = file.name.toLowerCase();
    if (!allowedExt.some(ext => fileName.endsWith(ext))) {
      alert('Invalid file type. Only .nbt, .bp, or .schem files are allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('fileInput', file);
    formData.append('descriptionInput', description);

    try {
      const response = await fetch('/api/components/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        alert('File uploaded successfully!');
        fileInput.value = '';
        descriptionInput.value = '';
        fetchAndDisplayComponents();
      } else {
        alert('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    }
  });

  fetchAndDisplayComponents();
});
