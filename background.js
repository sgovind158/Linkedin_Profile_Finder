chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
if (request.action === "findProfileData") {
    (async () => {
        const hunterIoApiKey = "007e9a1b09990a523dc428df3214babcae7b3059"; // REPLACE WITH YOUR API KEY

        // Execute a script on the current page to scrape the data
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            sendResponse({ status: "error", message: "Could not find active tab." });
            return;
        }

        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: scrapeProfileData,
            });
            console.log('Scraping results:', results);
            const scrapedData = results[0].result;

            if (!scrapedData.fullName || !scrapedData.company) {
                sendResponse({ status: "error", message: "Could not find required profile details on the page." });
                return;
            }

            const fullName = scrapedData?.fullName;
            const company = scrapedData?.company;

            const apiUrl = `https://api.hunter.io/v2/email-finder?company=${company}&full_name=${fullName}&api_key=${hunterIoApiKey}`;

            const response = await fetch(apiUrl);
            const data = await response.json();
            console.log('Hunter.io API response:', data);
            if (data.data && data.data.email) {
                const profileData = {
                    name: `${data.data.first_name} ${data.data.last_name}`,
                    email: data.data.email,
                    organization: data.data.company,
                    designation: data.data.position ? data.data.position : scrapedData.designation,
                    score: data.data.score,
                    domain: data.data.domain,
                    phone_number: data.data.phone_number,
                    twitter: data.data.twitter,
                    linkedin_url: data.data.linkedin_url,
                    verification: data.data.verification,
                    sources: data.data.sources || []
                };
                sendResponse({ status: "success", data: profileData });
            } else {
                sendResponse({ status: "error", message: "No data found" });
            }

        } catch (error) {
            console.error('Scraping or API error:', error);
            sendResponse({ status: "error", message: "An error occurred. Please try again." });
        }
    })();
    return true; // Indicates that the response is asynchronous
}
});

/**
 * Scrapes the LinkedIn profile page for the person's name, current company, and designation.
 * This function will be injected and run directly on the page.
 */
/**
 * Scrapes the full name and company information from a LinkedIn profile page.
 *
 * @returns {{ fullName: string|null, company: string|null }} An object containing the user's full name and company.
 * If the information cannot be found, the values will be null.
 */
function scrapeProfileData() {
    console.log('Scraping LinkedIn profile data...');
    
try {
    // const profileNameElement = document.querySelector('h1.uDKjoEYCneiyuVVNuofeaCRDhyncyxXbBcDw');
    // console.log('Profile Name Element:', profileNameElement);
    const profileNameElement = document.querySelector('a[href*="/overlay/about-this-profile/"] h1');
const fullName = profileNameElement ? profileNameElement.textContent.trim() : null;
  const designation = document.querySelector(".text-body-medium.break-words")?.innerText || "";

    console.log('Full Name:', fullName);
    // let company = document?.querySelector('.pRXDeimWEHFUXZxGvgbQlBJcqWnKPIJvIZA > li.ZFoHObxbDcqcUqHtuYBoFEVgOSgCsWpewzShqs:first-child')?.innerText?document.querySelector('.pRXDeimWEHFUXZxGvgbQlBJcqWnKPIJvIZA > li.ZFoHObxbDcqcUqHtuYBoFEVgOSgCsWpewzShqs:first-child').innerText:""
     // Try to find company name in a more robust way
        let company = null;

        // 1. Try to find the "Current company" button and get the text inside the <div>
        const companyButton = Array.from(document.querySelectorAll('button[aria-label^="Current company"]'))[0];
        if (companyButton) {
            const companyDiv = companyButton.querySelector('div');
            if (companyDiv && companyDiv.textContent.trim()) {
                company = companyDiv.textContent.trim();
            }
        }

        // 2. Fallback: Try to find company name in the experience section (if above fails)
        if (!company) {
            const expSection = document.querySelector('section[id*="experience"]');
            if (expSection) {
                const firstCompany = expSection.querySelector('span[aria-hidden="true"]');
                if (firstCompany && firstCompany.textContent.trim()) {
                    company = firstCompany.textContent.trim();
                }
            }
        }

        console.log('Company:', company);
    console.log('Company:', company); 
    return {
        fullName,
        company,
        designation
    };
} catch (error) {
    return {
        fullName: null,
        company: null,
        designation: null
    };
}
}
