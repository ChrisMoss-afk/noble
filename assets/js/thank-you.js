//COMMENT: §§§ DEDICATED THANK-YOU PAGE §§§
const engagement_brief_storage_key = "noble_last_engagement_brief";
const title_element = document.querySelector("[data-thank-you-title]");
const observations_element = document.querySelector("[data-thank-you-observations]");

function classify_dependency(response_data) {
    const independence_value = response_data.owner_independence;

    if (
        independence_value === "The business is heavily dependent on my involvement."
        || independence_value === "Several areas would struggle without me."
    ) {
        return "High";
    }

    if (
        independence_value
        === "Leadership could run it, but I would still be needed for important decisions."
    ) {
        return "Moderate";
    }

    if (independence_value === "The business would operate normally.") {
        return "Low";
    }

    return "Unclear";
}

function build_observations(response_data) {
    const near_term_values = new Set([
        "Within 3 months",
        "3–6 months",
        "6–12 months"
    ]);
    const observations = [];
    const dependency = classify_dependency(response_data);

    if (dependency === "High") {
        observations.push({
            title: "Owner independence",
            detail: "Your answers suggest that reducing reliance on you may be an important part of improving transition readiness."
        });
    } else if (dependency === "Moderate") {
        observations.push({
            title: "Decision independence",
            detail: "Leadership appears able to carry meaningful responsibility, with some important decisions still concentrated around you."
        });
    } else {
        observations.push({
            title: "Operating continuity",
            detail: "The first conversation can test how durable the business is without your day-to-day presence."
        });
    }

    if (["Limited confidence", "No current view"].includes(response_data.value_confidence)) {
        observations.push({
            title: "Value clarity",
            detail: "A clearer view of current value and what could materially improve it appears worth establishing early."
        });
    } else {
        observations.push({
            title: "Value evidence",
            detail: "You already have some view of value; the useful next step is testing how current and decision-ready that view is."
        });
    }

    if (near_term_values.has(response_data.transition_timeline)) {
        observations.push({
            title: "Timing",
            detail: "Your timeline is relatively near-term, so the first conversation should separate immediate decisions from preparation work that can still create options."
        });
    } else if (response_data.transition_timeline === "No defined timeline yet") {
        observations.push({
            title: "Optionality",
            detail: "You do not need a fixed transition date to begin strengthening the business and preserving future choices."
        });
    } else {
        observations.push({
            title: "Preparation runway",
            detail: "Your current horizon leaves time to strengthen the business before a transition becomes an urgent project."
        });
    }

    return observations.slice(0, 3);
}

function render_observations(response_data) {
    if (!observations_element) {
        return;
    }

    const observations = build_observations(response_data);
    observations_element.replaceChildren();

    observations.forEach((observation, index) => {
        const article = document.createElement("article");
        const number = document.createElement("span");
        const content = document.createElement("div");
        const title = document.createElement("strong");
        const detail = document.createElement("p");

        article.className = "intake-observation";
        number.className = "intake-observation__number";
        content.className = "intake-observation__content";

        number.textContent = String(index + 1).padStart(2, "0");
        title.textContent = observation.title;
        detail.textContent = observation.detail;

        content.append(title, detail);
        article.append(number, content);
        observations_element.append(article);
    });
}

try {
    const stored_value = window.localStorage.getItem(engagement_brief_storage_key);

    if (stored_value) {
        const stored_brief = JSON.parse(stored_value);
        const response_data = stored_brief.responses || {};

        if (response_data.contact_name && title_element) {
            title_element.textContent = `Thank you, ${response_data.contact_name}.`;
        }

        render_observations(response_data);
    }
} catch (storage_error) {
    console.warn("The saved engagement brief could not be read.", storage_error);
}
