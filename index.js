document.addEventListener("DOMContentLoaded", () => {
  const loadingDiv = document.getElementById("loading");
  const resultDiv = document.getElementById("result");
  const messageDiv = document.getElementById("message");

  /**
   * The DOM element with the ID "unsupported".
   * Typically used to display a message or content when a feature or browser is not supported.
   * @type {HTMLElement|null}
   */
  const unsupportedDiv = document.getElementById("unsupported");

  // Show loading state initially
  loadingDiv.classList.remove("hidden");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0].url;
    if (!url.includes("linkedin.com/in/")) {
      loadingDiv.classList.add("hidden");
      unsupportedDiv.classList.remove("hidden");
      return;
    }
    // Send a message to the background script to start the process
    chrome.runtime.sendMessage(
      { action: "findProfileData", tabId: tabs[0].id },
      (response) => {
        loadingDiv.classList.add("hidden");
        if (response.status === "success" && response.data) {
          /**
           * The data returned from the HTTP response.
           * @type {*}
           */
          const data = response.data;
          document.getElementById("profileName").textContent =
            `${data.name || ""}`.trim() || "N/A";
          document.getElementById(
            "profileDesignation"
          ).textContent = `Designation: ${data.designation || "N/A"}`;
          document.getElementById(
            "profileOrganization"
          ).textContent = `Organization: ${data.organization || "N/A"}`;
          document.getElementById("profileEmail").textContent = `Email: ${
            data.email || "N/A"
          }`;
          document.getElementById("profileScore").textContent = `Score: ${
            data.score !== undefined ? data.score : "N/A"
          }`;
          document.getElementById("profileDomain").textContent = `Domain: ${
            data.domain || "N/A"
          }`;
          document.getElementById("profilePhone").textContent = `Phone: ${
            data.phone_number || "N/A"
          }`;
          document.getElementById("profileTwitter").textContent = `Twitter: ${
            data.twitter || "N/A"
          }`;
          document.getElementById("profileLinkedin").textContent = `LinkedIn: ${
            data.linkedin_url || "N/A"
          }`;
          document.getElementById(
            "profileVerification"
          ).textContent = `Verification: ${
            data.verification
              ? `${data.verification.status} (${data.verification.date})`
              : "N/A"
          }`;
          document.getElementById(
            "profileSourcesCount"
          ).textContent = `Sources found: ${
            Array.isArray(data?.sources) ? data?.sources?.length : 0
          }`;
          resultDiv.classList.remove("hidden");
        } else {
          messageDiv.classList.remove("hidden");
          messageDiv.querySelector("p").textContent =
            response.message || "No data found.";
        }
      }
    );
  });
});
