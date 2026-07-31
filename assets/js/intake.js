//COMMENT: §§§ SECTION 1: CONFIGURATION §§§

//COMMENT: [DEFINE INTAKE PARAMETERS]
const near_term_timeline_values = new Set([
    "Within 3 months",
    "3–6 months",
    "6–12 months"
]);

const direct_sale_direction = "Sell to a third party";
const urgent_change_trigger = (
    "Something has changed and I need to make decisions sooner than expected."
);
const engagement_brief_storage_key = "noble_last_engagement_brief";
const internal_review_mode_enabled = (
    new URLSearchParams(window.location.search).get("review") === "1"
);

//COMMENT: [DEFINE HUMAN CONVERSATION PHASES]
const intake_phase_definitions = [
    { label: "Why now", stage_indexes: [0] },
    { label: "Your business", stage_indexes: [1] },
    { label: "What comes next", stage_indexes: [2, 3, 4, 5] },
    { label: "Readiness", stage_indexes: [6, 7] },
    { label: "About you", stage_indexes: [8, 9] }
];


//COMMENT: §§§ SECTION 2: DOM REFERENCES §§§

//COMMENT: [COLLECT INTAKE ELEMENTS]
const intake_form_element = document.querySelector("#engagement-intake");
const intake_stage_elements = Array.from(
    document.querySelectorAll("[data-intake-stage]")
);
const intake_back_button = document.querySelector("[data-intake-back]");
const intake_next_button = document.querySelector("[data-intake-next]");
const intake_actions_element = document.querySelector("[data-intake-actions]");
const intake_count_element = document.querySelector("[data-intake-count]");
const intake_label_element = document.querySelector("[data-intake-label]");
const form_error_element = document.querySelector("[data-form-error]");
const intake_review_element = document.querySelector("[data-intake-review]");
const intake_success_element = document.querySelector("[data-intake-success]");
const intake_observations_element = document.querySelector("[data-intake-observations]");
const advisor_brief_element = document.querySelector("[data-advisor-brief]");
const internal_brief_preview_element = document.querySelector(
    "[data-internal-brief-preview]"
);
const success_title_element = document.querySelector("[data-success-title]");
const download_brief_button = document.querySelector("[data-download-brief]");
const restart_intake_button = document.querySelector("[data-restart-intake]");

const near_term_panel = document.querySelector("[data-near-term-panel]");
const intake_phase_elements = Array.from(
    document.querySelectorAll("[data-phase]")
);


//COMMENT: §§§ SECTION 3: VALIDATION §§§

//COMMENT: [VALIDATE REQUIRED INTAKE STRUCTURE]
const missing_intake_elements = [];

if (!intake_form_element) {
    missing_intake_elements.push("intake form");
}

if (!intake_stage_elements.length) {
    missing_intake_elements.push("intake stages");
}

if (!intake_back_button || !intake_next_button) {
    missing_intake_elements.push("intake navigation controls");
}

if (!intake_review_element || !intake_success_element) {
    missing_intake_elements.push("intake review / confirmation area");
}

if (missing_intake_elements.length) {
    throw new Error(
        `Missing required Noble intake elements: ${missing_intake_elements.join(", ")}`
    );
}


//COMMENT: §§§ SECTION 4: INTAKE STATE §§§

//COMMENT: [DEFINE WORKING INTAKE STATE]
let active_stage_index = 0;
let intake_response_data = {};
let current_advisor_brief = "";


//COMMENT: [READ SINGLE FORM VALUE]
function get_single_value(field_name) {
    const selected_field = intake_form_element.querySelector(
        `[name="${field_name}"]:checked`
    );

    if (selected_field) {
        return selected_field.value;
    }

    const field_element = intake_form_element.elements.namedItem(field_name);

    if (!field_element || field_element instanceof RadioNodeList) {
        return "";
    }

    return String(field_element.value || "").trim();
}


//COMMENT: [READ MULTIPLE FORM VALUES]
function get_multiple_values(field_name) {
    return Array.from(
        intake_form_element.querySelectorAll(
            `[name="${field_name}"]:checked`
        )
    ).map((field_element) => field_element.value);
}


//COMMENT: [CAPTURE CANONICAL FORM RESPONSES]
function capture_intake_responses() {
    const response_data = {};
    const form_data = new FormData(intake_form_element);

    for (const [field_name, field_value] of form_data.entries()) {
        if (field_name in response_data) {
            if (!Array.isArray(response_data[field_name])) {
                response_data[field_name] = [response_data[field_name]];
            }

            response_data[field_name].push(field_value);
            continue;
        }

        response_data[field_name] = field_value;
    }

    const multi_value_fields = [
        "dependency_areas",
        "transition_priorities",
        "decision_participants"
    ];

    multi_value_fields.forEach((field_name) => {
        response_data[field_name] = get_multiple_values(field_name);
    });

    intake_response_data = response_data;

    return response_data;
}


//COMMENT: §§§ SECTION 5: CONDITIONAL LOGIC §§§



//COMMENT: [UPDATE NEAR-TERM READINESS FOLLOW-UP]
function update_near_term_panel() {
    const transition_timeline = get_single_value("transition_timeline");
    const transition_direction = get_single_value("transition_direction");
    const trigger_reason = get_single_value("trigger_reason");

    const show_near_term_panel = (
        near_term_timeline_values.has(transition_timeline)
        || transition_direction === direct_sale_direction
        || trigger_reason === "I'm considering a sale within the next few years."
        || trigger_reason === urgent_change_trigger
    );

    near_term_panel?.classList.toggle(
        "is-visible",
        show_near_term_panel
    );

    const conditional_required_fields = [
        "buyer_discussions",
        "ma_advisor",
        "professional_team"
    ];

    conditional_required_fields.forEach((field_name) => {
        const field_element = intake_form_element.elements.namedItem(field_name);

        if (!field_element || field_element instanceof RadioNodeList) {
            return;
        }

        field_element.required = show_near_term_panel;

        if (!show_near_term_panel) {
            field_element.removeAttribute("aria-invalid");
        }
    });
}


//COMMENT: [ENFORCE EXCLUSIVE CHECKBOX OPTIONS]
function enforce_exclusive_checkbox(
    exclusive_checkbox_id,
    group_name
) {
    const exclusive_checkbox = document.querySelector(
        `#${exclusive_checkbox_id}`
    );

    if (!exclusive_checkbox) {
        return;
    }

    exclusive_checkbox.addEventListener("change", () => {
        if (!exclusive_checkbox.checked) {
            return;
        }

        intake_form_element.querySelectorAll(
            `[name="${group_name}"]`
        ).forEach((checkbox_element) => {
            if (checkbox_element !== exclusive_checkbox) {
                checkbox_element.checked = false;
            }
        });
    });

    intake_form_element.querySelectorAll(
        `[name="${group_name}"]`
    ).forEach((checkbox_element) => {
        if (checkbox_element === exclusive_checkbox) {
            return;
        }

        checkbox_element.addEventListener("change", () => {
            if (checkbox_element.checked) {
                exclusive_checkbox.checked = false;
            }
        });
    });
}


//COMMENT: §§§ SECTION 6: STAGE VALIDATION §§§

//COMMENT: [CLEAR FIELD VALIDATION STATE]
function clear_stage_validation(stage_element) {
    stage_element.querySelectorAll("[aria-invalid='true']").forEach(
        (field_element) => field_element.removeAttribute("aria-invalid")
    );

    form_error_element.textContent = "";
}


//COMMENT: [VALIDATE REQUIRED CHOICE GROUP]
function validate_choice_group(group_element) {
    const group_name = group_element.dataset.requiredGroup;

    if (!group_name) {
        return true;
    }

    const checked_fields = group_element.querySelectorAll(
        `[name="${group_name}"]:checked`
    );

    if (checked_fields.length) {
        return true;
    }

    const first_field = group_element.querySelector(
        `[name="${group_name}"]`
    );

    first_field?.setAttribute("aria-invalid", "true");

    return false;
}


//COMMENT: [VALIDATE ACTIVE STAGE]
function validate_active_stage() {
    const stage_element = intake_stage_elements[active_stage_index];
    const invalid_fields = [];

    clear_stage_validation(stage_element);

    stage_element.querySelectorAll("[data-required-group]").forEach(
        (group_element) => {
            if (!validate_choice_group(group_element)) {
                invalid_fields.push(
                    group_element.querySelector("input")
                );
            }
        }
    );

    stage_element.querySelectorAll(
        "input[required], select[required], textarea[required]"
    ).forEach((field_element) => {
        if (field_element.type === "radio") {
            return;
        }

        if (field_element.type === "checkbox") {
            if (!field_element.checked) {
                field_element.setAttribute("aria-invalid", "true");
                invalid_fields.push(field_element);
            }
            return;
        }

        if (!field_element.value.trim()) {
            field_element.setAttribute("aria-invalid", "true");
            invalid_fields.push(field_element);
            return;
        }

        if (
            field_element.type === "email"
            && !field_element.checkValidity()
        ) {
            field_element.setAttribute("aria-invalid", "true");
            invalid_fields.push(field_element);
        }
    });

    const first_invalid_field = invalid_fields.find(Boolean);

    if (first_invalid_field) {
        form_error_element.textContent = (
            "Please complete the required information before continuing."
        );
        first_invalid_field.focus();
        return false;
    }

    return true;
}


//COMMENT: §§§ SECTION 7: STAGE NAVIGATION §§§

//COMMENT: [UPDATE ACTIVE STAGE PRESENTATION]
function update_stage_presentation(stage_index) {
    active_stage_index = Math.max(
        0,
        Math.min(intake_stage_elements.length - 1, stage_index)
    );

    intake_stage_elements.forEach((stage_element, current_index) => {
        const is_active_stage = current_index === active_stage_index;

        stage_element.classList.toggle("is-active", is_active_stage);
        stage_element.hidden = !is_active_stage;
    });

    const active_stage_element = intake_stage_elements[active_stage_index];
    const active_phase_index = intake_phase_definitions.findIndex(
        (phase_definition) => phase_definition.stage_indexes.includes(active_stage_index)
    );
    const normalized_phase_index = Math.max(0, active_phase_index);
    const active_phase = intake_phase_definitions[normalized_phase_index];
    const progress_percentage = (
        ((normalized_phase_index + 1) / intake_phase_definitions.length) * 100
    );

    intake_count_element.textContent = (
        `Conversation phase ${normalized_phase_index + 1} of ${intake_phase_definitions.length}`
    );
    intake_label_element.textContent = active_phase.label;

    intake_phase_elements.forEach((phase_element, phase_index) => {
        phase_element.classList.toggle(
            "is-current",
            phase_index === normalized_phase_index
        );
        phase_element.classList.toggle(
            "is-complete",
            phase_index < normalized_phase_index
        );
    });

    document.documentElement.style.setProperty(
        "--intake-progress",
        `${progress_percentage}%`
    );

    intake_back_button.disabled = active_stage_index === 0;
    intake_next_button.textContent = (
        active_stage_index === intake_stage_elements.length - 1
            ? "Prepare Engagement Brief →"
            : "Continue →"
    );

    form_error_element.textContent = "";

    if (active_stage_index === intake_stage_elements.length - 1) {
        capture_intake_responses();
        render_review();
    }

    const first_focusable = active_stage_element.querySelector(
        "input:not([type='hidden']), select, textarea, button"
    );

    first_focusable?.focus({ preventScroll: true });

    window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth"
    });
}


//COMMENT: [MOVE TO NEXT STAGE]
function move_to_next_stage() {
    update_near_term_panel();

    if (!validate_active_stage()) {
        return;
    }

    capture_intake_responses();

    if (active_stage_index === intake_stage_elements.length - 1) {
        complete_intake();
        return;
    }

    update_stage_presentation(active_stage_index + 1);
}


//COMMENT: [MOVE TO PREVIOUS STAGE]
function move_to_previous_stage() {
    if (active_stage_index === 0) {
        return;
    }

    capture_intake_responses();
    update_stage_presentation(active_stage_index - 1);
}


//COMMENT: §§§ SECTION 8: REVIEW PRESENTATION §§§

//COMMENT: [CREATE REVIEW ITEM]
function create_review_item(item_label, item_value) {
    const review_item = document.createElement("div");
    const label_element = document.createElement("div");
    const value_element = document.createElement("div");

    review_item.className = "review-item";
    label_element.className = "review-item__label";
    value_element.className = "review-item__value";

    label_element.textContent = item_label;
    value_element.textContent = item_value || "Not provided";

    review_item.append(label_element, value_element);

    return review_item;
}


//COMMENT: [CREATE REVIEW SECTION]
function create_review_section(section_title, review_items) {
    const section_element = document.createElement("section");
    const title_element = document.createElement("h3");
    const grid_element = document.createElement("div");

    section_element.className = "review-section";
    title_element.className = "review-section__title";
    grid_element.className = "review-grid";

    title_element.textContent = section_title;

    review_items.forEach(([item_label, item_value]) => {
        const normalized_value = Array.isArray(item_value)
            ? item_value.join(", ")
            : item_value;

        grid_element.append(
            create_review_item(item_label, normalized_value)
        );
    });

    section_element.append(title_element, grid_element);

    return section_element;
}


//COMMENT: [RENDER VISITOR REVIEW]
function render_review() {
    const response_data = capture_intake_responses();

    intake_review_element.replaceChildren(
        create_review_section("Reason for Enquiry", [
            ["Why now", response_data.trigger_reason]
        ]),
        create_review_section("Business", [
            ["Industry", response_data.industry],
            ["Location", response_data.location],
            ["Revenue", response_data.revenue_range],
            ["Employees", response_data.employee_range],
            ["Ownership", response_data.ownership_role]
        ]),
        create_review_section("Direction and Readiness", [
            ["Direction", response_data.transition_direction],
            ["Value clarity", response_data.value_confidence],
            ["90-day independence", response_data.owner_independence],
            ["Owner dependency", response_data.dependency_areas],
            ["Timeline", response_data.transition_timeline],
            ["What matters", response_data.transition_priorities]
        ]),
        create_review_section("First Conversation", [
            ["People involved", response_data.decision_participants],
            ["Alignment", response_data.alignment_status],
            ["Desired clarity", response_data.clarity_goal]
        ]),
        create_review_section("Contact", [
            ["Name", response_data.contact_name],
            ["Company", response_data.company_name],
            ["Email", response_data.email],
            ["Phone", response_data.phone],
            ["Preference", response_data.contact_preference]
        ])
    );
}


//COMMENT: §§§ SECTION 9: INTERNAL ASSESSMENT §§§

//COMMENT: [CLASSIFY PROSPECT FIT]
function classify_fit(response_data) {
    const strong_revenue_ranges = new Set([
        "$2M–$3M",
        "$3M–$5M",
        "$5M–$7M"
    ]);
    const western_locations = new Set([
        "Alberta",
        "British Columbia",
        "Saskatchewan",
        "Manitoba"
    ]);

    if (
        strong_revenue_ranges.has(response_data.revenue_range)
        && western_locations.has(response_data.location)
    ) {
        return "Strong fit";
    }

    return "Potential fit — review context";
}


//COMMENT: [CLASSIFY TRANSITION URGENCY]
function classify_urgency(response_data) {
    const timeline_value = response_data.transition_timeline;

    if (["Within 3 months", "3–6 months"].includes(timeline_value)) {
        return "High / immediate";
    }

    if (timeline_value === "6–12 months") {
        return "Near-term";
    }

    if (timeline_value === "1–2 years") {
        return "Medium horizon";
    }

    if (timeline_value === "No defined timeline yet") {
        return "Exploratory — no defined clock";
    }

    return "Longer-horizon preparation";
}


//COMMENT: [CLASSIFY OWNER DEPENDENCY]
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


//COMMENT: [CLASSIFY TRANSITION CLARITY]
function classify_transition_clarity(response_data) {
    if (
        response_data.transition_direction === "I genuinely don't know yet"
        && response_data.transition_timeline === "No defined timeline yet"
    ) {
        return "Exploratory";
    }

    if (
        response_data.transition_direction === "Explore several possibilities"
        || response_data.transition_timeline === "No defined timeline yet"
    ) {
        return "Developing";
    }

    return "Defined enough to frame a pathway";
}


//COMMENT: [IDENTIFY LIKELY NOBLE PATHWAY]
function identify_likely_pathway(response_data) {
    const dependency_classification = classify_dependency(response_data);

    if (
        near_term_timeline_values.has(response_data.transition_timeline)
        && response_data.transition_direction === direct_sale_direction
    ) {
        return "Business Transition Program + near-term transition coordination review";
    }

    if (dependency_classification === "High") {
        return "Business Transition Program with owner-independence emphasis";
    }

    if (response_data.transition_timeline === "3–5 years") {
        return "Business Transition Program with value / readiness roadmap";
    }

    return "Business Transition Program — confirm scope in first conversation";
}


//COMMENT: [BUILD CONVERSATION PRIORITIES]
function build_conversation_priorities(response_data) {
    const priorities = [];
    const dependency_areas = response_data.dependency_areas || [];

    if (classify_dependency(response_data) === "High") {
        priorities.push(
            `Explore owner dependency, especially: ${dependency_areas.join(", ") || "areas not yet isolated"}.`
        );
    }

    if (["Limited confidence", "No current view"].includes(response_data.value_confidence)) {
        priorities.push(
            "Establish the owner's current understanding of value and what evidence supports it."
        );
    }

    if (near_term_timeline_values.has(response_data.transition_timeline)) {
        priorities.push(
            "Clarify the near-term timing, active transaction activity, and which external advisors are already involved."
        );
    }

    if (response_data.alignment_status && response_data.alignment_status !== "Generally aligned") {
        priorities.push(
            `Understand the decision environment: ${response_data.alignment_status}.`
        );
    }

    if (response_data.clarity_goal) {
        priorities.push(
            `Start with the owner's stated objective: ${response_data.clarity_goal}`
        );
    }

    if (!priorities.length) {
        priorities.push(
            "Confirm the owner's desired outcome, timing, and the highest-value readiness question to address first."
        );
    }

    return priorities.slice(0, 5);
}


//COMMENT: §§§ SECTION 10: VISITOR OBSERVATIONS §§§

//COMMENT: [BUILD VISITOR-FACING OBSERVATIONS]
function build_visitor_observations(response_data) {
    const observations = [];
    const dependency_classification = classify_dependency(response_data);

    if (dependency_classification === "High") {
        observations.push({
            title: "Owner independence",
            detail: "Your answers suggest that reducing reliance on you may be an important part of improving transition readiness."
        });
    } else if (dependency_classification === "Moderate") {
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
            detail: "A clearer view of current value — and what could materially improve it — appears worth establishing early."
        });
    } else {
        observations.push({
            title: "Value evidence",
            detail: "You already have some view of value; the useful next step is testing how current and decision-ready that view is."
        });
    }

    if (near_term_timeline_values.has(response_data.transition_timeline)) {
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


//COMMENT: [RENDER VISITOR-FACING OBSERVATIONS]
function render_visitor_observations(response_data) {
    const observations = build_visitor_observations(response_data);

    intake_observations_element.replaceChildren();

    observations.forEach((observation, index) => {
        const observation_element = document.createElement("article");
        const number_element = document.createElement("span");
        const content_element = document.createElement("div");
        const title_element = document.createElement("strong");
        const detail_element = document.createElement("p");

        observation_element.className = "intake-observation";
        number_element.className = "intake-observation__number";
        content_element.className = "intake-observation__content";

        number_element.textContent = String(index + 1).padStart(2, "0");
        title_element.textContent = observation.title;
        detail_element.textContent = observation.detail;

        content_element.append(title_element, detail_element);
        observation_element.append(number_element, content_element);
        intake_observations_element.append(observation_element);
    });
}


//COMMENT: §§§ SECTION 11: ADVISOR BRIEF §§§

//COMMENT: [FORMAT LIST VALUE]
function format_list_value(value) {
    if (!value) {
        return "Not provided";
    }

    if (Array.isArray(value)) {
        return value.length ? value.join(", ") : "Not provided";
    }

    return value;
}


//COMMENT: [BUILD ADVISOR-FACING ENGAGEMENT BRIEF]
function build_advisor_brief(response_data) {
    const fit_classification = classify_fit(response_data);
    const urgency_classification = classify_urgency(response_data);
    const dependency_classification = classify_dependency(response_data);
    const clarity_classification = classify_transition_clarity(response_data);
    const likely_pathway = identify_likely_pathway(response_data);
    const conversation_priorities = build_conversation_priorities(response_data);

    const brief_lines = [
        "NOBLE ADVISORY GROUP — ENGAGEMENT BRIEF",
        "========================================",
        "",
        `${format_list_value(response_data.contact_name)} — ${format_list_value(response_data.company_name)}`,
        "",
        "INTERNAL CLASSIFICATION",
        `Fit: ${fit_classification}`,
        `Urgency: ${urgency_classification}`,
        `Owner dependency: ${dependency_classification}`,
        `Transition clarity: ${clarity_classification}`,
        `Potential pathway: ${likely_pathway}`,
        "",
        "REASON FOR ENQUIRY",
        format_list_value(response_data.trigger_reason),
        "",
        "BUSINESS PROFILE",
        `Industry: ${format_list_value(response_data.industry)}`,
        `Location: ${format_list_value(response_data.location)}`,
        `Revenue: ${format_list_value(response_data.revenue_range)}`,
        `Employees: ${format_list_value(response_data.employee_range)}`,
        `Owners: ${format_list_value(response_data.owner_count)}`,
        `Years operating: ${format_list_value(response_data.years_operating)}`,
        `Ownership role: ${format_list_value(response_data.ownership_role)}`,
        "",
        "DIRECTION",
        format_list_value(response_data.transition_direction),
        "",
        "VALUE CLARITY",
        `Confidence: ${format_list_value(response_data.value_confidence)}`,
        `Valuation / readiness review: ${format_list_value(response_data.valuation_status)}`,
        `Earnings trend: ${format_list_value(response_data.earnings_trend)}`,
        `Customer concentration: ${format_list_value(response_data.customer_concentration)}`,
        "",
        "OWNER INDEPENDENCE",
        `90-day scenario: ${format_list_value(response_data.owner_independence)}`,
        `Dependency areas: ${format_list_value(response_data.dependency_areas)}`,
        "",
        "TRANSITION",
        `Timeline: ${format_list_value(response_data.transition_timeline)}`,
        `What must be protected: ${format_list_value(response_data.transition_priorities)}`,
        `Buyer / investor discussions: ${format_list_value(response_data.buyer_discussions)}`,
        `M&A advisor: ${format_list_value(response_data.ma_advisor)}`,
        `Legal / accounting team: ${format_list_value(response_data.professional_team)}`,
        `Near-term timing trigger: ${format_list_value(response_data.near_term_trigger)}`,
        "",
        "DECISION ENVIRONMENT",
        `People involved: ${format_list_value(response_data.decision_participants)}`,
        `Current alignment: ${format_list_value(response_data.alignment_status)}`,
        "",
        "OWNER'S STATED PRIORITY",
        format_list_value(response_data.clarity_goal),
        "",
        "ADDITIONAL CONTEXT",
        format_list_value(response_data.additional_context),
        "",
        "SUGGESTED OPENING CONVERSATION",
        ...conversation_priorities.map(
            (priority, index) => `${index + 1}. ${priority}`
        ),
        "",
        "CONTACT",
        `Email: ${format_list_value(response_data.email)}`,
        `Phone: ${format_list_value(response_data.phone)}`,
        `Preferred contact: ${format_list_value(response_data.contact_preference)}`,
        `Best time: ${format_list_value(response_data.contact_window)}`
    ];

    return brief_lines
        .filter((line, index, lines) => {
            if (line !== "") {
                return true;
            }

            return index === 0 || lines[index - 1] !== "";
        })
        .join("\n");
}


//COMMENT: §§§ SECTION 12: COMPLETION §§§

//COMMENT: [COMPLETE ENGAGEMENT INTAKE]
function complete_intake() {
    const response_data = capture_intake_responses();

    current_advisor_brief = build_advisor_brief(response_data);

    try {
        window.localStorage.setItem(
            engagement_brief_storage_key,
            JSON.stringify({
                responses: response_data,
                advisor_brief: current_advisor_brief,
                saved_at: new Date().toISOString()
            })
        );
    } catch (storage_error) {
        console.warn(
            "The engagement brief could not be saved to browser storage.",
            storage_error
        );
    }

    success_title_element.textContent = (
        response_data.contact_name
            ? `Thank you, ${response_data.contact_name}.`
            : "Thank you."
    );

    render_visitor_observations(response_data);
    advisor_brief_element.textContent = current_advisor_brief;

    intake_form_element.hidden = true;
    intake_actions_element.hidden = true;
    intake_success_element.classList.add("is-visible");

    intake_success_element.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
        block: "start"
    });
}


//COMMENT: [DOWNLOAD ADVISOR BRIEF]
function download_advisor_brief() {
    if (!current_advisor_brief) {
        return;
    }

    const response_data = capture_intake_responses();
    const safe_company_name = String(
        response_data.company_name || "Prospect"
    )
        .replace(/[^a-z0-9]+/gi, "_")
        .replace(/^_+|_+$/g, "");

    const brief_blob = new Blob(
        [current_advisor_brief],
        { type: "text/plain;charset=utf-8" }
    );
    const download_url = URL.createObjectURL(brief_blob);
    const download_link = document.createElement("a");

    download_link.href = download_url;
    download_link.download = (
        `Noble_Engagement_Brief_${safe_company_name || "Prospect"}.txt`
    );
    document.body.append(download_link);
    download_link.click();
    download_link.remove();
    URL.revokeObjectURL(download_url);
}


//COMMENT: [RESTART ENGAGEMENT INTAKE]
function restart_intake() {
    intake_form_element.reset();
    intake_response_data = {};
    current_advisor_brief = "";

    intake_success_element.classList.remove("is-visible");
    intake_form_element.hidden = false;
    intake_actions_element.hidden = false;

    update_near_term_panel();
    update_stage_presentation(0);
}


//COMMENT: §§§ SECTION 13: EVENT BINDING §§§

//COMMENT: [BIND FORM NAVIGATION]
intake_next_button.addEventListener("click", move_to_next_stage);
intake_back_button.addEventListener("click", move_to_previous_stage);


//COMMENT: [BIND CONDITIONAL RESPONSE LOGIC]
intake_form_element.addEventListener("change", () => {
    update_near_term_panel();
});


//COMMENT: [PREVENT NATIVE FORM SUBMISSION]
intake_form_element.addEventListener("submit", (event) => {
    event.preventDefault();
});


//COMMENT: [BIND INTERNAL REVIEW CONTROLS]
download_brief_button?.addEventListener("click", download_advisor_brief);
restart_intake_button?.addEventListener("click", restart_intake);


//COMMENT: [BIND EXCLUSIVE CHECKBOX GROUPS]
enforce_exclusive_checkbox("dependency-none", "dependency_areas");
enforce_exclusive_checkbox("participant-me", "decision_participants");


//COMMENT: §§§ SECTION 14: INITIALIZATION §§§

//COMMENT: [INITIALIZE INTERNAL REVIEW VISIBILITY]
if (internal_brief_preview_element) {
    internal_brief_preview_element.hidden = !internal_review_mode_enabled;
}


//COMMENT: [INITIALIZE CONDITIONAL PANELS]
update_near_term_panel();


//COMMENT: [INITIALIZE FIRST INTAKE STAGE]
update_stage_presentation(0);
