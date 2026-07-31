//COMMENT: §§§ SECTION 1: EXPERIENCE CONFIGURATION §§§

//COMMENT: [COLLECT CHAPTER CONTROLS AND DEFINE RESPONSIVE MODE]
const mobile_media_query = window.matchMedia("(max-width: 820px)");
const chapter_elements = Array.from(document.querySelectorAll("[data-chapter]"));
const experience_track_element = document.querySelector("[data-experience-track]");
const previous_button = document.querySelector("[data-prev-chapter]");
const next_button = document.querySelector("[data-next-chapter]");
const header_context_element = document.querySelector("[data-chapter-context]");
const nav_title_element = document.querySelector("[data-nav-title]");
const nav_count_element = document.querySelector("[data-nav-count]");
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

function chapter_title(chapter_element) {
    return chapter_element?.dataset.title || chapter_element?.id || "Chapter";
}

function update_experience_ui() {
    const active_chapter = chapter_elements[active_chapter_index];
    const active_title = chapter_title(active_chapter);
    const previous_chapter = chapter_elements[active_chapter_index - 1];
    const next_chapter = chapter_elements[active_chapter_index + 1];
    const is_mobile = mobile_media_query.matches;

    document.body.dataset.activeChapter = active_chapter.id;
    header_context_element.textContent = active_title;
    nav_title_element.textContent = active_title;
    if (nav_count_element) {
        nav_count_element.textContent = `${active_chapter_index + 1} / ${chapter_elements.length}`;
    }
    nav_progress_element.style.width = `${((active_chapter_index + 1) / chapter_elements.length) * 100}%`;

    previous_button.disabled = !previous_chapter;
    next_button.disabled = !next_chapter;

    previous_button.textContent = previous_chapter
        ? (is_mobile ? "← Back" : `← ${chapter_title(previous_chapter)}`)
        : "← Previous";
    next_button.textContent = next_chapter
        ? (is_mobile ? "Next →" : `${chapter_title(next_chapter)} →`)
        : "End";

    previous_button.setAttribute(
        "aria-label",
        previous_chapter ? `Previous chapter: ${chapter_title(previous_chapter)}` : "No previous chapter"
    );
    next_button.setAttribute(
        "aria-label",
        next_chapter ? `Next chapter: ${chapter_title(next_chapter)}` : "End of Noble experience"
    );

    chapter_elements.forEach((chapter_element, chapter_index) => {
        const is_active = chapter_index === active_chapter_index;
        chapter_element.setAttribute("aria-hidden", String(!is_active));
        if ("inert" in chapter_element) {
            chapter_element.inert = !is_active;
        }
    });

    chapter_link_elements.forEach((link_element) => {
        const target_id = link_element.getAttribute("href")?.replace("#", "");
        if (target_id === active_chapter.id) {
            link_element.setAttribute("aria-current", "step");
        } else {
            link_element.removeAttribute("aria-current");
        }
    });
}

function show_chapter(chapter_index, options = {}) {
    const bounded_index = Math.max(0, Math.min(chapter_elements.length - 1, chapter_index));
    active_chapter_index = bounded_index;
    const active_chapter = chapter_elements[active_chapter_index];

    experience_track_element.style.transform = `translate3d(-${active_chapter_index * 100}vw, 0, 0)`;

    if (options.reset_scroll !== false) {
        active_chapter.scrollTop = 0;
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
    if (document.body.classList.contains("has-open-menu")) {
        return;
    }

    if (event.target instanceof Element && event.target.closest("input, textarea, select, button")) {
        return;
    }

    if (event.key === "ArrowLeft") {
        show_chapter(active_chapter_index - 1);
    }
    if (event.key === "ArrowRight") {
        show_chapter(active_chapter_index + 1);
    }
});

//COMMENT: [SUPPORT DELIBERATE SWIPE NAVIGATION WITHOUT RELYING ON EDGE GESTURES]
experience_track_element.addEventListener("touchstart", (event) => {
    if (!mobile_media_query.matches || event.touches.length !== 1) {
        return;
    }

    const touch = event.touches[0];
    const edge_guard = 28;
    if (touch.clientX <= edge_guard || touch.clientX >= window.innerWidth - edge_guard) {
        touch_start_x = null;
        touch_start_y = null;
        return;
    }

    touch_start_x = touch.clientX;
    touch_start_y = touch.clientY;
}, { passive: true });

experience_track_element.addEventListener("touchend", (event) => {
    if (!mobile_media_query.matches || touch_start_x === null || touch_start_y === null) {
        return;
    }

    const touch_end_x = event.changedTouches[0].clientX;
    const touch_end_y = event.changedTouches[0].clientY;
    const horizontal_distance = touch_end_x - touch_start_x;
    const vertical_distance = touch_end_y - touch_start_y;
    touch_start_x = null;
    touch_start_y = null;

    if (Math.abs(horizontal_distance) < 80 || Math.abs(horizontal_distance) < Math.abs(vertical_distance) * 1.35) {
        return;
    }

    show_chapter(active_chapter_index + (horizontal_distance < 0 ? 1 : -1));
}, { passive: true });

//COMMENT: §§§ SECTION 2: PROCESS STAGE SYSTEM §§§

//COMMENT: [COLLECT PROCESS STAGES AND MANAGE ACTIVE DETAIL]
const process_stage_elements = Array.from(document.querySelectorAll("[data-process-stage]"));
const process_trigger_elements = process_stage_elements
    .map((stage_element) => stage_element.querySelector(".process-stage__trigger"))
    .filter(Boolean);

function set_process_stage(active_stage_element, options = {}) {
    const { move_focus = false } = options;

    process_stage_elements.forEach((stage_element) => {
        const is_active = stage_element === active_stage_element;
        stage_element.classList.toggle("is-active", is_active);
        const trigger_element = stage_element.querySelector(".process-stage__trigger");
        const panel_element = stage_element.querySelector(".process-stage__panel");

        trigger_element?.setAttribute("aria-expanded", String(is_active));
        trigger_element?.setAttribute("aria-selected", String(is_active));
        trigger_element?.setAttribute("tabindex", is_active ? "0" : "-1");

        if (panel_element) {
            panel_element.hidden = !is_active;
        }
    });

    if (move_focus) {
        active_stage_element.querySelector(".process-stage__trigger")?.focus();
    }
}

process_stage_elements.forEach((stage_element, stage_index) => {
    const trigger_element = stage_element.querySelector(".process-stage__trigger");
    if (!trigger_element) {
        return;
    }

    trigger_element.addEventListener("click", () => set_process_stage(stage_element));

    trigger_element.addEventListener("keydown", (event) => {
        let next_index = null;

        if (["ArrowRight", "ArrowDown"].includes(event.key)) {
            next_index = (stage_index + 1) % process_stage_elements.length;
        } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
            next_index = (stage_index - 1 + process_stage_elements.length) % process_stage_elements.length;
        } else if (event.key === "Home") {
            next_index = 0;
        } else if (event.key === "End") {
            next_index = process_stage_elements.length - 1;
        }

        if (next_index === null) {
            return;
        }

        event.preventDefault();
        set_process_stage(process_stage_elements[next_index], { move_focus: true });
    });
});

//COMMENT: §§§ SECTION 3: VIEWPORT AND HASH CONTINUITY §§§

//COMMENT: [KEEP THE ACTIVE CHAPTER ALIGNED ACROSS ROTATION, RESIZE, AND HASH CHANGES]
function realign_active_chapter() {
    show_chapter(active_chapter_index, {
        reset_scroll: false,
        update_hash: false
    });
}

mobile_media_query.addEventListener("change", realign_active_chapter);
window.addEventListener("resize", realign_active_chapter);
window.addEventListener("hashchange", () => {
    show_chapter(resolve_chapter_index_from_hash(), { update_hash: false });
});

experience_track_element.style.transition = "none";
show_chapter(resolve_chapter_index_from_hash(), { reset_scroll: false, update_hash: false });
requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        experience_track_element.style.removeProperty("transition");
    });
});
