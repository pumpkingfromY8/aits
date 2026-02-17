const SUPABASE_URL = "https://awfifqxnniqkrmhvbonn.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmlmcXhubmlxa3JtaHZib25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Mjg0NzcsImV4cCI6MjA4MzQwNDQ3N30.IkL3OUOS2m_JKTSI4RhGKZZDxH-n0sx2bDEkzO79vr0";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase client initialized:", supabaseClient);

async function loadUsers() {
  // 1. Fetch data (Added 'address' and 'fb_url' assuming they exist in your DB)
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

  const container = document.getElementById("userCardsContainer");
  container.innerHTML = ""; // Clear existing content
  console.log(container, "");

  if (error) {
    container.innerHTML = `<p>Error loading users: ${error.message}</p>`;
    return;
  }

  if (data.length === 0) {
    container.innerHTML = `<p>No users found.</p>`;
    return;
  }

  // 2. Loop through data and generate the HTML
  data.forEach((user) => {
    const fullName = `${user.fname} ${user.mname ? user.mname + " " : ""}${
      user.lname
    }`;

    const listItem = document.createElement("li");
    listItem.innerHTML = `
          <div class="course-card">
            <figure class="card-banner img-holder" style="--width: 370; --height: 320;">
              <img src="./assets/images/wilmer.jpg" width="370" height="320" loading="lazy"
                alt="${fullName}" class="img-cover">
            </figure>

            <div class="card-content">
              <span class="badge">${user.position || "Member"}</span>

              <h3 class="h3">
                <a href="#" class="card-title">${fullName}</a>
              </h3>

              <ul class="card-meta-list">
                <li class="card-meta-item">
                  <ion-icon name="call-outline" aria-hidden="true"></ion-icon>
                  <a href="tel:${user.cell_no}">
                    <span class="span" style="color: blue;">${
                      user.cell_no
                    }</span>
                  </a>
                </li>

                <li class="card-meta-item">
                  <ion-icon name="mail-outline"></ion-icon>
                  <a href="mailto:${user.email}">
                    <span class="span" style="color: blue;">${user.email}</span>
                  </a>
                </li>

                <li class="card-meta-item">
                  <ion-icon name="logo-facebook"></ion-icon>
                  <a href="#">
                    <span class="span" style="color: blue;">View Profile</span>
                  </a>
                </li>

                <li class="card-meta-item">
                  <ion-icon name="location-outline" aria-hidden="true"></ion-icon>
                  <span class="span">Location Data Not in DB</span>
                </li>

                <li class="card-meta-item">
                  <ion-icon name="home-outline"></ion-icon>
                  <span class="span">Access Level: ${user.access}</span>
                </li>
              </ul>
            </div>
          </div>
        `;
    container.appendChild(listItem);
  });
}

loadUsers();
