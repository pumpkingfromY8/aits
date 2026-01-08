const SUPABASE_URL = "https://awfifqxnniqkrmhvbonn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmlmcXhubmlxa3JtaHZib25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Mjg0NzcsImV4cCI6MjA4MzQwNDQ3N30.IkL3OUOS2m_JKTSI4RhGKZZDxH-n0sx2bDEkzO79vr0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function loadUsers() {
  const { data, error } = await supabaseClient
    .from("users")
    .select(
      `
          id,
          fname,
          mname,
          lname,
          position,
          email,
          cell_no,
          access
        `
    )
    .order("id", { ascending: true });

  console.log("DATA:", data);
  console.log("ERROR:", error);

  const tbody = document.getElementById("userTable");
  tbody.innerHTML = "";

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Error loading users</td></tr>`;
    return;
  }

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No users found</td></tr>`;
    return;
  }

  data.forEach((user) => {
    const row = document.createElement("tr");
    row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.fname} ${user.mname ?? ""} ${user.lname}</td>
          <td>${user.position}</td>
          <td>${user.email}</td>
          <td>${user.cell_no}</td>
          <td>${user.access}</td>
        `;
    tbody.appendChild(row);
  });
}

loadUsers();
