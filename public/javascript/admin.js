// admin.js - Frontend for admin SQL executor

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('adminSqlForm');
  const sqlInput = document.getElementById('sql');
  const resultPre = document.getElementById('result');

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sql = sqlInput.value.trim();
    const password = getCookie('password');
    if (!password || !sql) {
      resultPre.textContent = 'Password (from cookie) and SQL are required.';
      return;
    }
    resultPre.textContent = 'Executing...';
    try {
      const res = await fetch('/api/admin/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, sql })
      });
      const data = await res.json();
      if (data.success) {
        resultPre.textContent = 'Success!\n' + JSON.stringify(data.result, null, 2);
      } else {
        resultPre.textContent = 'Error: ' + (data.error || 'Unknown error');
      }
    } catch (err) {
      resultPre.textContent = 'Request failed: ' + err.message;
    }
  });
});
