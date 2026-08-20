// =====================================
// SUPABASE CONFIG
// =====================================

const SUPABASE_URL =
    "https://awfifqxnniqkrmhvbonn.supabase.co";

const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IkF3ZmlmcXhubmlxa3JtaHZib25uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4Mjg0NzcsImV4cCI6MjA4MzQwNDQ3N30.IkL3OUOS2m_JKTSI4RhGKZZDxH-n0sx2bDEkzO79vr0";
console.log("taskscriptloaded");

// Create Supabase client
const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


console.log(
    "Supabase client initialized:",
    supabaseClient
);


// =====================================
// LOAD ACTIVITIES
// =====================================

async function loadActivities() {

    console.log("Loading activities...");


    // =====================================
    // GET HTML ELEMENTS
    // =====================================

    const grid =
        document.getElementById("activityGrid");

    const status =
        document.getElementById("activityStatus");


    console.log("Activity grid:", grid);
    console.log("Activity status:", status);


    // =====================================
    // CHECK GRID
    // =====================================

    if (!grid) {

        console.error(
            "ERROR: #activityGrid was not found."
        );

        return;
    }


    if (status) {

        status.innerHTML =
            "Loading activities...";

    }


    // =====================================
    // GET DATA FROM SUPABASE
    // =====================================

    const {
        data,
        error
    } = await supabaseClient

        .from("submitted_task")

        .select(`
            id,
            fullname,
            training_center,
            image_url,
            image_name
        `)

        .order(
            "id",
            {
                ascending: false
            }
        );


    // =====================================
    // DEBUG
    // =====================================

    console.log(
        "Supabase returned data:",
        data
    );

    console.log(
        "Supabase returned error:",
        error
    );


    // =====================================
    // ERROR
    // =====================================

    if (error) {

        console.error(
            "DATABASE ERROR:",
            error
        );


        if (status) {

            status.innerHTML =
                `Error loading activities: ${error.message}`;

        }

        return;
    }


    // =====================================
    // NO DATA
    // =====================================

    if (!data || data.length === 0) {

        console.log(
            "No records found in submitted_task."
        );


        if (status) {

            status.innerHTML =
                "No activities found.";

        }

        return;
    }


    console.log(
        `Found ${data.length} activities.`
    );


    // =====================================
    // CLEAR GRID
    // =====================================

    grid.innerHTML = "";


    if (status) {

        status.innerHTML =
            `${data.length} activities found.`;

    }


    // =====================================
    // DISPLAY EACH ACTIVITY
    // =====================================

    data.forEach(
        (activity) => {


            console.log(
                "Displaying activity:",
                activity
            );


            // =================================
            // CREATE CARD
            // =================================

            const card =
                document.createElement("div");


            card.className =
                "activity-card";


            // =================================
            // IMAGE URL
            // =================================

            let imageUrl = "";


            // First priority:
            // image_url from database

            if (
                activity.image_url &&
                activity.image_url.trim() !== ""
            ) {

                imageUrl =
                    activity.image_url;

            }


            // Second priority:
            // Generate Supabase Storage URL

            else if (
                activity.image_name &&
                activity.image_name.trim() !== ""
            ) {

                imageUrl =
                    `${SUPABASE_URL}/storage/v1/object/public/aits_assets/${encodeURIComponent(activity.image_name)}`;

            }


            // Third priority:
            // fallback image

            else {

                imageUrl =
                    "../assets/images/uploadfile.gif";

            }


            console.log(
                "Image URL:",
                imageUrl
            );


            // =================================
            // CARD HTML
            // =================================

            card.innerHTML = `

                <div class="activity-image-container">

                    <img
                        class="activity-image"
                        src="${imageUrl}"
                        alt="${activity.fullname || "Activity"}"
                        loading="lazy"
                    >

                </div>


                <div class="activity-content">

                    <div class="activity-name">

                        ${activity.fullname || "Unknown User"}

                    </div>


                    <div class="activity-center">

                        ${activity.training_center || "Unknown Center"}

                    </div>


                    <div class="activity-file">

                        ${activity.image_name || "No file name"}

                    </div>

                     <a download="${imageUrl}" href="${imageUrl}"
                         class="button button--flex">
                         Download CV<i class="fas fa-download button__icon"></i>
                    </a>

                </div>

            `;


            // =================================
            // IMAGE ERROR HANDLER
            // =================================

            const image =
                card.querySelector(".activity-image");


            image.addEventListener(
                "error",
                function () {

                    console.error(
                        "Failed to load image:",
                        image.src
                    );

                    image.src =
                        "../assets/images/uploadfile.gif";

                }
            );


            // =================================
            // ADD CARD TO GRID
            // =================================

            grid.appendChild(card);

        }
    );

}


// =====================================
// RUN AFTER PAGE LOAD
// =====================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadActivities
    );

} else {

    loadActivities();

}