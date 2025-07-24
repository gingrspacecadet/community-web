fetch("https://cdn.jsdelivr.net/npm/franken-ui@2.0.0/dist/css/core.min.css")
    .then((response) => response.text())
    .then((css) => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(css);
        document.adoptedStyleSheets = [
            ...document.adoptedStyleSheets,
            styleSheet,
        ];
    })
    .catch((error) => console.error("Error loading stylesheet:", error));

fetch(
    "https://cdn.jsdelivr.net/npm/franken-ui@2.0.0/dist/css/utilities.min.css",
)
    .then((response) => response.text())
    .then((css) => {
        const styleSheet = new CSSStyleSheet();
        styleSheet.replaceSync(css);
        document.adoptedStyleSheets = [
            ...document.adoptedStyleSheets,
            styleSheet,
        ];
    })
    .catch((error) => console.error("Error loading stylesheet:", error));

import "https://cdn.jsdelivr.net/npm/franken-ui@2.0.0/dist/js/core.iife.js";
import "https://cdn.jsdelivr.net/npm/franken-ui@2.0.0/dist/js/icon.iife.js";

const htmlElement = document.documentElement;

const __FRANKEN__ = JSON.parse(localStorage.getItem("__FRANKEN__") || "{}");

if (
    __FRANKEN__.mode === "dark" ||
    (!__FRANKEN__.mode &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
) {
    htmlElement.classList.add("dark");
} else {
    htmlElement.classList.remove("dark");
}

htmlElement.classList.add(__FRANKEN__.theme || "uk-theme-zinc");
htmlElement.classList.add(__FRANKEN__.radii || "uk-radii-md");
htmlElement.classList.add(__FRANKEN__.shadows || "uk-shadows-sm");
htmlElement.classList.add(__FRANKEN__.font || "uk-font-sm");
htmlElement.classList.add(__FRANKEN__.chart || "uk-chart-default");

document.body.classList.add("bg-background", "text-foreground");