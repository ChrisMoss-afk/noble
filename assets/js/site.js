//COMMENT: §§§ SECTION 1: SHARED MENU CONFIGURATION §§§

//COMMENT: [COLLECT MENU CONTROLS]
const menu_open_buttons = Array.from(
    document.querySelectorAll("[data-menu-open]")
);
const menu_close_buttons = Array.from(
    document.querySelectorAll("[data-menu-close]")
);

//COMMENT: [DEFINE ACTIVE MENU STATE]
let active_menu_element = null;
let active_menu_trigger = null;


//COMMENT: §§§ SECTION 2: MENU STATE MANAGEMENT §§§

//COMMENT: [APPLY OPEN OR CLOSED MENU STATE]
function set_menu_state(
    menu_element,
    is_open,
    trigger_element = null
) {
    if (!menu_element) {
        return;
    }

    menu_element.setAttribute("aria-hidden", String(!is_open));
    document.body.classList.toggle("has-open-menu", is_open);

    if (trigger_element) {
        trigger_element.setAttribute("aria-expanded", String(is_open));
    }

    if (is_open) {
        active_menu_element = menu_element;
        active_menu_trigger = trigger_element;

        const close_button = menu_element.querySelector("[data-menu-close]");
        close_button?.focus();
        return;
    }

    active_menu_element = null;
    active_menu_trigger?.focus();
    active_menu_trigger = null;
}


//COMMENT: §§§ SECTION 3: MENU EVENT BINDINGS §§§

//COMMENT: [BIND MENU OPEN CONTROLS]
menu_open_buttons.forEach((open_button) => {
    open_button.addEventListener("click", () => {
        const menu_id = open_button.getAttribute("aria-controls");
        const menu_element = (
            menu_id
                ? document.getElementById(menu_id)
                : null
        );

        set_menu_state(menu_element, true, open_button);
    });
});


//COMMENT: [BIND MENU CLOSE CONTROLS]
menu_close_buttons.forEach((close_button) => {
    close_button.addEventListener("click", () => {
        const menu_element = close_button.closest("[data-menu]");
        set_menu_state(menu_element, false, active_menu_trigger);
    });
});


//COMMENT: [BIND ESCAPE KEY CLOSE BEHAVIOR]
document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !active_menu_element) {
        return;
    }

    set_menu_state(active_menu_element, false, active_menu_trigger);
});
