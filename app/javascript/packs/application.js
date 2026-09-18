import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

Rails.start()
Turbolinks.start()
ActiveStorage.start()

function initLastYearSingle() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.navigationInitialized === "true") return

  root.dataset.navigationInitialized = "true"

  const welcome = root.querySelector("[data-welcome-screen]")
  const appShell = root.querySelector("[data-app-shell]")
  const pages = Array.from(root.querySelectorAll("[data-page]"))
  const navButtons = Array.from(root.querySelectorAll("[data-nav]"))

  function showPage(pageName, updateHash = true) {
    if (!appShell || !welcome) return

    welcome.hidden = true
    appShell.hidden = false

    pages.forEach((page) => {
      const active = page.dataset.page === pageName
      page.hidden = !active
      page.classList.toggle("is-active", active)
    })

    navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === pageName)
    })

    if (updateHash) window.history.replaceState(null, "", `#${pageName}`)
    window.scrollTo({ top: 0, behavior: "smooth" })

    document.dispatchEvent(new CustomEvent("lys:pagechange", { detail: { pageName } }))
  }

  function showWelcome() {
    if (!appShell || !welcome) return
    appShell.hidden = true
    welcome.hidden = false
    window.history.replaceState(null, "", window.location.pathname)
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.nav))
  })

  root.querySelector(".lys-welcome .lys-brand-button")?.addEventListener("click", showWelcome)

  root.querySelectorAll("[data-community-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.communityFilter

      root.querySelectorAll("[data-community-filter]").forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button)
      })

      root.querySelectorAll("[data-community-card]").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.intent !== filter
      })
    })
  })

  window.LYS = Object.assign(window.LYS || {}, { showPage, showWelcome })
}

document.addEventListener("turbolinks:load", initLastYearSingle)
