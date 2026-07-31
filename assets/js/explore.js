//COMMENT: §§§ SECTION 1: EXPERIENCE CONFIGURATION §§§

//COMMENT: [COLLECT CHAPTER CONTROLS AND DEFINE RESPONSIVE MODE]
const desktop_media_query = window.matchMedia("(min-width: 821px)");
const chapter_elements = Array.from(document.querySelectorAll("[data-chapter]"));
const experience_track_element = document.querySelector("[data-experience-track]");
const previous_button = document.querySelector("[data-prev-chapter]");
const next_button = document.querySelector("[data-next-chapter]");
const header_context_element = document.querySelector("[data-chapter-context]");
const nav_title_element = document.querySelector("[data-nav-title]");
const nav_progress_element = document.querySelector("[data-nav-progress]");
const chapter_link_elements = Array.from(document.querySelectorAll("[data-chapter-link]"));

if (!chapter_elements.length || !experience_track_element || !previous_button || !next_button) {
    throw new Error("Missing required Noble experience elements.");
}

let active_chapter_index = 0;
let touch_start_x = null;
let touch_start_y = null;

function resolve_chapter_index_from_hash() {
    const requested_id = window.location.hash.replace("#", "");
    if (!requested_id) {
        return 0;
    }

    const legacy_id_map = {
        "firm-details": "noble",
        "program": "business-view"
    };
    const resolved_id = legacy_id_map[requested_id] || requested_id;
    const matching_index = chapter_elements.findIndex(
        (chapter_element) => chapter_element.id === resolved_id
    );
    return matching_index >= 0 ? matching_index : 0;
}

function update_experience_ui() {
    const active_chapter = chapter_elements[active_chapter_index];
    const chapter_title = active_chapter.dataset.title || active_chapter.id;
    const previous_chapter = chapter_elements[active_chapter_index - 1];
    const next_chapter = chapter_elements[active_chapter_index + 1];

    document.body.dataset.activeChapter = active_chapter.id;
    header_context_element.textContent = chapter_title;
    nav_title_element.textContent = chapter_title;
    nav_progress_element.style.width = `${((active_chapter_index + 1) / chapter_elements.length) * 100}%`;

    previous_button.disabled = !previous_chapter;
    previous_button.textContent = previous_chapter ? `← ${previous_chapter.dataset.title}` : "← Previous";
    next_button.disabled = !next_chapter;
    next_button.textContent = next_chapter ? `${next_chapter.dataset.title} →` : "End";
}

function show_chapter(chapter_index, options = {}) {
    const bounded_index = Math.max(0, Math.min(chapter_elements.length - 1, chapter_index));
    active_chapter_index = bounded_index;
    const active_chapter = chapter_elements[active_chapter_index];

    if (desktop_media_query.matches) {
        experience_track_element.style.transform = `translate3d(-${active_chapter_index * 100}vw, 0, 0)`;
        if (options.reset_scroll !== false) {
            active_chapter.scrollTop = 0;
        }
    } else if (options.scroll !== false) {
        active_chapter.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    if (options.update_hash !== false) {
        history.replaceState(null, "", `#${active_chapter.id}`);
    }

    update_experience_ui();
}

previous_button.addEventListener("click", () => show_chapter(active_chapter_index - 1));
next_button.addEventListener("click", () => show_chapter(active_chapter_index + 1));

chapter_link_elements.forEach((link_element) => {
    link_element.addEventListener("click", (event) => {
        const target_id = link_element.getAttribute("href")?.replace("#", "");
        const target_index = chapter_elements.findIndex((chapter_element) => chapter_element.id === target_id);
        if (target_index < 0) {
            return;
        }
        event.preventDefault();
        show_chapter(target_index);
        document.querySelector('[data-menu][aria-hidden="false"] [data-menu-close]')?.click();
    });
});

document.addEventListener("keydown", (event) => {
    if (!desktop_media_query.matches || document.body.classList.contains("has-open-menu")) {
        return;
    }

    if (event.key === "ArrowLeft") {
        show_chapter(active_chapter_index - 1);
    }
    if (event.key === "ArrowRight") {
        show_chapter(active_chapter_index + 1);
    }
});

experience_track_element.addEventListener("touchstart", (event) => {
    if (!desktop_media_query.matches || event.touches.length !== 1) {
        return;
    }
    touch_start_x = event.touches[0].clientX;
    touch_start_y = event.touches[0].clientY;
}, { passive: true });

experience_track_element.addEventListener("touchend", (event) => {
    if (!desktop_media_query.matches || touch_start_x === null || touch_start_y === null) {
        return;
    }

    const touch_end_x = event.changedTouches[0].clientX;
    const touch_end_y = event.changedTouches[0].clientY;
    const horizontal_distance = touch_end_x - touch_start_x;
    const vertical_distance = touch_end_y - touch_start_y;
    touch_start_x = null;
    touch_start_y = null;

    if (Math.abs(horizontal_distance) < 55 || Math.abs(horizontal_distance) <= Math.abs(vertical_distance)) {
        return;
    }

    show_chapter(active_chapter_index + (horizontal_distance < 0 ? 1 : -1));
}, { passive: true });

//COMMENT: §§§ SECTION 2: PROCESS STAGE SYSTEM §§§

//COMMENT: [COLLECT PROCESS STAGES AND MANAGE ACTIVE DETAIL]
const process_stage_elements = Array.from(document.querySelectorAll("[data-process-stage]"));

function set_process_stage(active_stage_element) {
    process_stage_elements.forEach((stage_element) => {
        const is_active = stage_element === active_stage_element;
        stage_element.classList.toggle("is-active", is_active);
        const trigger_element = stage_element.querySelector(".process-stage__trigger");
        const panel_element = stage_element.querySelector(".process-stage__panel");
        trigger_element?.setAttribute("aria-expanded", String(is_active));
        if (panel_element) {
            panel_element.hidden = !is_active;
        }
    });
}

process_stage_elements.forEach((stage_element) => {
    const trigger_element = stage_element.querySelector(".process-stage__trigger");
    trigger_element?.addEventListener("click", () => set_process_stage(stage_element));
});

//COMMENT: §§§ SECTION 3: MOBILE CHAPTER OBSERVATION §§§

//COMMENT: [OBSERVE THE DOMINANT VERTICAL CHAPTER ON SMALL SCREENS]
const mobile_chapter_observer = new IntersectionObserver((entries) => {
    if (desktop_media_query.matches) {
        return;
    }

    const visible_entry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible_entry) {
        return;
    }

    const observed_index = chapter_elements.indexOf(visible_entry.target);
    if (observed_index >= 0 && observed_index !== active_chapter_index) {
        active_chapter_index = observed_index;
        update_experience_ui();
        history.replaceState(null, "", `#${visible_entry.target.id}`);
    }
}, { threshold: [0.35, 0.6] });

chapter_elements.forEach((chapter_element) => mobile_chapter_observer.observe(chapter_element));

desktop_media_query.addEventListener("change", () => show_chapter(active_chapter_index, { scroll: false, reset_scroll: false, update_hash: false }));
show_chapter(resolve_chapter_index_from_hash(), { scroll: false, update_hash: false });
