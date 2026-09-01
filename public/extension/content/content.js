/**
 * JobLens Content Script (Manifest V3)
 * Non-invasive DOM extraction with platform adapters for LinkedIn, Indeed, Naukri, Webmail, etc.
 */

(() => {
  // Listen for extraction requests from side panel or service worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_PAGE_JOB_DATA") {
      const extracted = extractJobOrRecruitmentData();
      sendResponse(extracted);
    } else if (request.type === "GET_SELECTED_TEXT") {
      const selected = window.getSelection()?.toString()?.trim() || "";
      sendResponse({ selectedText: selected, url: window.location.href });
    }
    return true;
  });

  function extractJobOrRecruitmentData() {
    const url = window.location.href;
    const hostname = window.location.hostname.toLowerCase();
    const pageTitle = document.title || "";
    const selectedText = window.getSelection()?.toString()?.trim() || "";

    // 1. LinkedIn
    if (hostname.includes("linkedin.com")) {
      const isJobPage = url.includes("/jobs/") || document.querySelector(".jobs-description") || document.querySelector(".job-details-jobs-unified-top-card__job-title");
      if (isJobPage) {
        const titleEl = document.querySelector("h1.job-details-jobs-unified-top-card__job-title, h1.topcard__title, .jobs-unified-top-card__job-title");
        const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name, .topcard__flavor--black-link, .jobs-unified-top-card__company-name");
        const descEl = document.querySelector("#job-details, .jobs-description__content, .jobs-box__html-content, .show-more-less-html__markup");
        const recruiterEl = document.querySelector(".hirer-card__hirer-information, .jobs-poster__name");

        return {
          success: true,
          platform: "LinkedIn",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split(/[-|•]/)[0]?.trim() || "LinkedIn Job Posting",
          companyName: companyEl?.textContent?.trim() || "Not available",
          recruiterEmail: extractEmails(descEl?.textContent || "")[0] || "",
          applicationUrl: url,
          jobDescription: descEl?.textContent?.trim() || (document.body ? document.body.innerText.slice(0, 4000) : ""),
          recruiterName: recruiterEl?.textContent?.trim() || ""
        };
      }

      if (url.includes("/messaging/")) {
        const activeChat = document.querySelector(".msg-thread, .msg-conversation-card--active");
        const chatText = activeChat?.textContent?.trim() || selectedText;
        if (chatText) {
          return {
            success: true,
            platform: "LinkedIn Messaging",
            sourceType: "RECRUITER_CHAT",
            jobTitle: "Recruiter Direct Message",
            companyName: "LinkedIn Contact",
            recruiterEmail: extractEmails(chatText)[0] || "",
            applicationUrl: url,
            jobDescription: chatText
          };
        }
      }
    }

    // 2. Naukri
    if (hostname.includes("naukri.com")) {
      const titleEl = document.querySelector("h1[class*='styles_jcp-heading'], h1[class*='styles_job-title'], h1.jd-header-title");
      const companyEl = document.querySelector("a[class*='styles_company-name'], a[class*='styles_comp-name'], div[class*='styles_company-name']");
      const descEl = document.querySelector("section[class*='styles_job-desc-container'], div[class*='styles_JDRest__desc'], .dang-inner-html");

      if (titleEl || descEl) {
        const descText = descEl?.textContent?.trim() || document.body.innerText.slice(0, 4000);
        return {
          success: true,
          platform: "Naukri.com",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split("|")[0]?.trim() || "Naukri Job Opportunity",
          companyName: companyEl?.textContent?.trim() || "Naukri Employer",
          recruiterEmail: extractEmails(descText)[0] || "",
          applicationUrl: url,
          jobDescription: descText
        };
      }
    }

    // 3. Indeed
    if (hostname.includes("indeed.com")) {
      const titleEl = document.querySelector("h1.jobsearch-JobInfoHeader-title, [data-testid='jobsearch-JobInfoHeader-title']");
      const companyEl = document.querySelector("[data-testid='inlineHeader-companyName'], [data-company-name='true'], .jobsearch-InlineCompanyRating-companyHeader");
      const descEl = document.querySelector("#jobDescriptionText, .jobsearch-jobDescriptionText");

      if (titleEl || descEl) {
        const descText = descEl?.textContent?.trim() || "";
        return {
          success: true,
          platform: "Indeed",
          sourceType: "JOB_POSTING",
          jobTitle: titleEl?.textContent?.trim() || pageTitle.split("-")[0]?.trim() || "Indeed Job Posting",
          companyName: companyEl?.textContent?.trim() || "Indeed Employer",
          recruiterEmail: extractEmails(descText)[0] || "",
          applicationUrl: url,
          jobDescription: descText
        };
      }
    }

    // 4. Webmail (Gmail / Outlook)
    if (hostname.includes("mail.google.com")) {
      const subjectEl = document.querySelector("h2.hP");
      const senderEl = document.querySelector("span.gD");
      const bodyEl = document.querySelector("div.a3s.aiL, div[role='main'] .adn.ads");

      if (subjectEl && bodyEl) {
        const senderEmail = senderEl?.getAttribute("email") || senderEl?.textContent || "";
        const bodyText = bodyEl.textContent?.trim() || "";
        return {
          success: true,
          platform: "Gmail",
          sourceType: "EMAIL_INVITATION",
          jobTitle: subjectEl.textContent?.trim() || "Recruitment Email Offer",
          companyName: extractCompanyFromEmail(senderEmail) || "Email Sender",
          recruiterEmail: senderEmail,
          applicationUrl: url,
          jobDescription: bodyText
        };
      }
    }

    // 5. Lever / Greenhouse / Workday Career Portals
    if (hostname.includes("lever.co") || hostname.includes("greenhouse.io") || hostname.includes("myworkdayjobs.com") || url.includes("/careers/") || url.includes("/job/")) {
      const heading = document.querySelector("h1, h2");
      const mainContent = document.querySelector("main, article, [role='main'], .content, #content");
      const descText = mainContent?.textContent?.trim() || document.body.innerText.slice(0, 4000);

      return {
        success: true,
        platform: "Careers Portal",
        sourceType: "CAREERS_PAGE",
        jobTitle: heading?.textContent?.trim() || pageTitle.split(/[-|]/)[0]?.trim() || "Corporate Job Posting",
        companyName: hostname.replace(/^www\./, "").split(".")[0].toUpperCase(),
        recruiterEmail: extractEmails(descText)[0] || "",
        applicationUrl: url,
        jobDescription: descText
      };
    }

    // 6. Generic Heuristic Detection
    const fullBodyText = document.body ? document.body.innerText : "";
    const recruitmentKeywords = /\b(job description|responsibilities|qualifications|apply now|compensation|salary|per month|per annum|work from home|remote position|requirements)\b/i;
    
    if (recruitmentKeywords.test(fullBodyText)) {
      const heading = document.querySelector("h1, h2, title");
      return {
        success: true,
        platform: "Web Page",
        sourceType: "JOB_POSTING",
        jobTitle: heading?.textContent?.trim() || pageTitle.split(/[-|]/)[0]?.trim() || "Identified Job Opportunity",
        companyName: hostname.replace(/^www\./, ""),
        recruiterEmail: extractEmails(fullBodyText)[0] || "",
        applicationUrl: url,
        jobDescription: selectedText || fullBodyText.slice(0, 3500)
      };
    }

    // Non-recruitment page
    return {
      success: false,
      platform: "Generic Web Page",
      sourceType: "NON_JOB",
      jobTitle: "",
      companyName: "",
      recruiterEmail: "",
      applicationUrl: url,
      jobDescription: selectedText
    };
  }

  function extractEmails(text) {
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return matches ? Array.from(new Set(matches)) : [];
  }

  function extractCompanyFromEmail(email) {
    if (!email || !email.includes("@")) return "";
    const domain = email.split("@")[1].toLowerCase();
    const freeProviders = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com"];
    if (freeProviders.includes(domain)) return "";
    return domain.split(".")[0].toUpperCase();
  }
})();