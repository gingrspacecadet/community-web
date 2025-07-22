document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminSqlForm");
  const sqlInput = document.getElementById("sql");
  const resultPre = document.getElementById("result");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const sql = sqlInput.value.trim();

    if (!sql) {
      resultPre.textContent = "SQL is required.";
      return;
    }
    resultPre.textContent = "Executing...";
    try {
      const res = await fetch("/api/admin/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      if (data.success) {
        let output = 'Success!\n';
        if (data.result && data.result.results) {
          output += JSON.stringify(data.result.results, null, 2);
        } else {
          output += JSON.stringify(data.result, null, 2);
        }
        resultPre.textContent = output;
      } else {
        resultPre.textContent = "Error: " + (data.error || "Unknown error");
      }
    } catch (err) {
      resultPre.textContent = "Request failed: " + err.message;
    }
  });
});
