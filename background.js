chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "findProfileData") {
    console.log("Received request to find profile data");
    (async () => {
      const hunterIoApiKey = ""; //Add Your Hunter.io API key here
        if (!hunterIoApiKey) {
        sendResponse({
            status: "error",
            message: "Hunter.io API key is missing. Please add it in the code.",
          });
          return;
        }

      // Execute a script on the current page to scrape the data
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab) {
        sendResponse({
          status: "error",
          message: "Could not find active tab.",
        });
        return;
      }

      // Inject the scraping function into the page
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: scrapeProfileData,
        });
        const scrapedData = results[0].result;
        if (!scrapedData.fullName || !scrapedData.company) {
          sendResponse({
            status: "error",
            message: "Could not find required profile details on the page.",
          });
          return;
        }

        const fullName = scrapedData?.fullName;
        const company = scrapedData?.company;

        const apiUrl = `https://api.hunter.io/v2/email-finder?company=${company}&full_name=${fullName}&api_key=${hunterIoApiKey}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.data && data.data.email) {
        /**
         * Represents a user's profile data.
         * @typedef {Object} ProfileData
         * @property {string} name - The full name of the user.
         * @property {string} email - The user's email address.
         * @property {string} organization - The company or organization the user is associated with.
         * @property {string} designation - The user's job title or designation.
         * @property {number} score - The user's score (relevance, confidence, etc.).
         * @property {string} domain - The domain associated with the user.
         * @property {string} phone_number - The user's phone number.
         * @property {string} twitter - The user's Twitter handle or profile URL.
         * @property {string} linkedin_url - The user's LinkedIn profile URL.
         * @property {string} verification - The verification status or method.
         * @property {Array} sources - The sources from which the profile data was obtained.
         */
          const profileData = {
            name: `${data.data.first_name} ${data.data.last_name}`,
            email: data.data.email,
            organization: data.data.company,
            designation: data.data.position
              ? data.data.position
              : scrapedData.designation,
            score: data.data.score,
            domain: data.data.domain,
            phone_number: data.data.phone_number,
            twitter: data.data.twitter,
            linkedin_url: data.data.linkedin_url,
            verification: data.data.verification,
            sources: data.data.sources || [],
          };
          sendResponse({ status: "success", data: profileData });
        } else {
          sendResponse({ status: "error", message: "No data found" });
        }
      } catch (error) {
        sendResponse({
          status: "error",
          message: "An error occurred. Please try again.",
        });
      }
    })();
    return true; // Indicates that the response is asynchronous
  }
});

/**
 * Scrapes LinkedIn profile data from the current page.
 *
 * Attempts to extract the user's full name, current company, and designation
 * by querying specific DOM elements. Uses multiple strategies to robustly
 * identify the company name, including checking for a "Current company" button
 * and falling back to the experience section if necessary.
 *
 * @returns {Object} An object containing:
 *   @property {string|null} fullName - The user's full name, or null if not found.
 *   @property {string|null} company - The user's current company, or null if not found.
 *   @property {string} designation - The user's designation, or an empty string if not found.
 */
function scrapeProfileData() {

  try {

    const profileNameElement = document.querySelector(
      'a[href*="/overlay/about-this-profile/"] h1'
    );
    const fullName = profileNameElement
      ? profileNameElement.textContent.trim()
      : null;
    const designation =
      document.querySelector(".text-body-medium.break-words")?.innerText || "";

    // Try to find company name in a more robust way
    let company = null;

    // 1. Try to find the "Current company" button and get the text inside the <div>
    const companyButton = Array.from(
      document.querySelectorAll('button[aria-label^="Current company"]')
    )[0];
    if (companyButton) {
      const companyDiv = companyButton.querySelector("div");
      if (companyDiv && companyDiv.textContent.trim()) {
        company = companyDiv.textContent.trim();
      }
    }

    // 2. Fallback: Try to find company name in the experience section (if above fails)
    if (!company) {
      const expSection = document.querySelector('section[id*="experience"]');
      if (expSection) {
        const firstCompany = expSection.querySelector(
          'span[aria-hidden="true"]'
        );
        if (firstCompany && firstCompany.textContent.trim()) {
          company = firstCompany.textContent.trim();
        }
      }
    }

    return {
      fullName,
      company,
      designation,
    };
  } catch (error) {
    return {
      fullName: null,
      company: null,
      designation: null,
    };
  }
}
