document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // small helper to avoid injecting raw HTML
      function escapeHtml(str) {
        return String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      // Populate activities list with participants section
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participantsArray = Array.isArray(details.participants) ? details.participants : [];
        const spotsLeft = details.max_participants - participantsArray.length;

        activityCard.innerHTML = `
          <div class="activity-main">
            <h4 class="activity-title">${escapeHtml(name)}</h4>
            <p class="activity-desc">${escapeHtml(details.description)}</p>
            <p class="activity-meta"><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
            <p class="activity-meta"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          </div>
        `;

        // Participants section (bulleted list with small badges)
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (participantsArray.length > 0) {
          participantsArray.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const badge = document.createElement("span");
            badge.className = "participant-badge";
            // create simple initials from local-part for a visual badge
            const initials = String(email)
              .split("@")[0]
              .split(/[\.\-_]/)
              .map(s => s[0] || "")
              .join("")
              .slice(0, 2)
              .toUpperCase();
            badge.textContent = initials;

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;

            li.appendChild(badge);
            li.appendChild(emailSpan);
            ul.appendChild(li);
          });
        } else {
          const li = document.createElement("li");
          li.className = "participant-empty muted";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        }

        participantsSection.appendChild(ul);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
