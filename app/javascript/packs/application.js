// This file is automatically compiled by Webpack, along with any other files
// present in this directory. You're encouraged to place your actual application logic in
// a relevant structure within app/javascript and only use these pack files to reference
// that code so it'll be compiled.

import Rails from "@rails/ujs"
import Turbolinks from "turbolinks"
import * as ActiveStorage from "@rails/activestorage"
import "channels"

Rails.start()
Turbolinks.start()
ActiveStorage.start()

function initLastYearSingle() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.initialized === "true") return

  root.dataset.initialized = "true"

  const welcome = root.querySelector("[data-welcome-screen]")
  const appShell = root.querySelector("[data-app-shell]")
  const appPages = Array.from(root.querySelectorAll("[data-page]"))
  const navButtons = Array.from(root.querySelectorAll("[data-nav]"))
  const mobileNavButtons = Array.from(root.querySelectorAll(".lys-mobile-nav [data-nav]"))
  const desktopNavButtons = Array.from(root.querySelectorAll(".lys-desktop-nav [data-nav]"))
  const profileStream = root.querySelector("[data-profile-stream]")
  const signupModal = root.querySelector("[data-signup-modal]")
  const toast = root.querySelector("[data-toast]")
  let toastTimer

  const conversations = {
    mia: [
      ["theirs", "Have you tried that little coffee place downtown yet?"],
      ["mine", "Not yet, but I keep hearing about it. Worth going?"],
      ["theirs", "Definitely. And they have a patio that is actually quiet enough to talk."],
      ["mine", "You had me at quiet patio."],
      ["theirs", "That sounds perfect. Saturday?"]
    ],
    noah: [
      ["theirs", "You mentioned you like being near the water."],
      ["mine", "Absolutely. It is one of my favorite ways to reset."],
      ["theirs", "I know a great place near the water. Good food too."],
      ["mine", "Now you are speaking my language."]
    ],
    sofia: [
      ["theirs", "I think travel tells you a lot about a person."],
      ["mine", "Agreed. Especially how they handle the parts that do not go according to plan."],
      ["theirs", "Haha, I completely agree."],
      ["mine", "That may be the real compatibility test."]
    ]
  }

  function showToast(message) {
    if (!toast) return

    clearTimeout(toastTimer)
    toast.textContent = message
    toast.hidden = false

    toastTimer = window.setTimeout(() => {
      toast.hidden = true
    }, 2600)
  }

  function setActiveNav(pageName) {
    navButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === pageName)
    })
  }

  function showPage(pageName, updateHash = true) {
    if (!appShell || !welcome) return

    welcome.hidden = true
    appShell.hidden = false

    appPages.forEach((page) => {
      const isActive = page.dataset.page === pageName
      page.hidden = !isActive
      page.classList.toggle("is-active", isActive)
    })

    setActiveNav(pageName)

    if (updateHash) {
      window.history.replaceState(null, "", `#${pageName}`)
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function showWelcome() {
    if (!appShell || !welcome) return

    appShell.hidden = true
    welcome.hidden = false
    window.history.replaceState(null, "", window.location.pathname)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function openSignup() {
    if (!signupModal) return
    signupModal.hidden = false
    document.body.classList.add("lys-modal-open")
    const firstInput = signupModal.querySelector("input")
    if (firstInput) window.setTimeout(() => firstInput.focus(), 80)
  }

  function closeSignup() {
    if (!signupModal) return
    signupModal.hidden = true
    document.body.classList.remove("lys-modal-open")
  }

  function visibleProfileCards() {
    return Array.from(root.querySelectorAll("[data-profile]")).filter((card) => !card.hidden)
  }

  function showPool(pool) {
    root.querySelectorAll("[data-pool]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.pool === pool)
    })

    root.querySelectorAll("[data-profile]").forEach((profile) => {
      profile.hidden = profile.dataset.intent !== pool
    })

    if (profileStream) {
      profileStream.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function renderConversation(row) {
    const chatBody = root.querySelector("[data-chat-body]")
    const chatName = root.querySelector("[data-chat-name]")
    const chatIntent = root.querySelector("[data-chat-intent]")
    const chatAvatar = root.querySelector("[data-chat-avatar]")
    if (!chatBody || !row) return

    root.querySelectorAll("[data-conversation]").forEach((conversationRow) => {
      conversationRow.classList.toggle("is-active", conversationRow === row)
    })

    if (chatName) chatName.textContent = row.dataset.chatName || "Connection"
    if (chatIntent) chatIntent.textContent = row.dataset.chatIntent || "Connection"
    if (chatAvatar && row.dataset.chatAvatar) {
      chatAvatar.src = row.dataset.chatAvatar
      chatAvatar.alt = row.dataset.chatName || "Connection"
    }

    chatBody.innerHTML = ""

    const day = document.createElement("div")
    day.className = "lys-chat-day"
    day.textContent = "Recent"
    chatBody.appendChild(day)

    const messages = conversations[row.dataset.conversation] || []
    messages.forEach(([direction, text]) => {
      const bubble = document.createElement("div")
      bubble.className = `lys-bubble ${direction === "mine" ? "lys-bubble-mine" : "lys-bubble-theirs"}`
      bubble.textContent = text
      chatBody.appendChild(bubble)
    })

    chatBody.scrollTop = chatBody.scrollHeight
  }

  root.querySelectorAll("[data-enter-app]").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.enterApp || "discover"))
  })

  navButtons.forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.nav))
  })

  const brandHome = root.querySelector(".lys-welcome .lys-brand-button")
  if (brandHome) brandHome.addEventListener("click", showWelcome)

  root.querySelectorAll("[data-open-signup]").forEach((button) => {
    button.addEventListener("click", openSignup)
  })

  root.querySelectorAll("[data-close-signup]").forEach((button) => {
    button.addEventListener("click", closeSignup)
  })

  if (signupModal) {
    signupModal.addEventListener("click", (event) => {
      if (event.target === signupModal) closeSignup()
    })
  }

  root.querySelectorAll("[data-pool]").forEach((button) => {
    button.addEventListener("click", () => showPool(button.dataset.pool))
  })

  root.querySelectorAll("[data-connect]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.connect || "this person"
      button.textContent = "Request sent"
      button.disabled = true
      showToast(`Connection request sent to ${name}.`)
    })
  })

  root.querySelectorAll("[data-pass]").forEach((button) => {
    button.addEventListener("click", () => {
      const currentCard = button.closest("[data-profile]")
      if (!currentCard) return

      const cards = visibleProfileCards()
      const currentIndex = cards.indexOf(currentCard)
      const nextCard = cards[currentIndex + 1]

      if (nextCard) {
        nextCard.scrollIntoView({ behavior: "smooth", block: "start" })
      } else {
        showToast("You reached the end of this preview set.")
      }
    })
  })

  root.querySelectorAll("[data-audio-button]").forEach((button) => {
    button.addEventListener("click", () => {
      const isPlaying = button.classList.toggle("is-playing")
      const icon = button.querySelector(".lys-audio-icon")
      if (icon) icon.textContent = isPlaying ? "Pause" : "Play"
      showToast(isPlaying ? "Playing voice intro preview." : "Voice intro paused.")
    })
  })

  root.querySelectorAll("[data-community-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.communityFilter

      root.querySelectorAll("[data-community-filter]").forEach((filterButton) => {
        filterButton.classList.toggle("is-active", filterButton === button)
      })

      root.querySelectorAll("[data-community-card]").forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.intent !== filter
      })
    })
  })

  root.querySelectorAll("[data-message-nav]").forEach((button) => {
    button.addEventListener("click", () => showPage("messages"))
  })

  root.querySelectorAll("[data-conversation]").forEach((row) => {
    row.addEventListener("click", () => renderConversation(row))
  })

  const messageForm = root.querySelector("[data-message-form]")
  if (messageForm) {
    messageForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const input = messageForm.querySelector("input[name='message']")
      const chatBody = root.querySelector("[data-chat-body]")
      if (!input || !chatBody) return

      const message = input.value.trim()
      if (!message) return

      const bubble = document.createElement("div")
      bubble.className = "lys-bubble lys-bubble-mine"
      bubble.textContent = message
      chatBody.appendChild(bubble)
      input.value = ""
      chatBody.scrollTop = chatBody.scrollHeight
    })
  }

  root.querySelectorAll("[data-preference-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.classList.toggle("is-selected")
      const status = button.querySelector(":scope > span")
      if (status) status.textContent = selected ? "On" : "Off"
    })
  })

  const recordButton = root.querySelector("[data-record-button]")
  if (recordButton) {
    recordButton.addEventListener("click", () => {
      const card = recordButton.closest(".lys-record-card")
      if (!card) return

      const isRecording = card.classList.toggle("is-recording")
      recordButton.textContent = isRecording ? "Stop" : "Record"
      showToast(isRecording ? "Voice intro recording preview started." : "Voice intro preview stopped.")
    })
  }

  const signupForm = root.querySelector("[data-signup-form]")
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault()
      const firstNameInput = signupForm.querySelector("input[name='first_name']")
      const firstName = firstNameInput && firstNameInput.value.trim() ? firstNameInput.value.trim() : "there"
      closeSignup()
      showPage("discover")
      showToast(`Welcome, ${firstName}. Your preview profile is ready.`)
    })
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && signupModal && !signupModal.hidden) closeSignup()
  })

  const initialPage = window.location.hash.replace("#", "")
  if (["discover", "community", "messages", "profile"].includes(initialPage)) {
    showPage(initialPage, false)
  } else {
    showWelcome()
  }

  if (mobileNavButtons.length || desktopNavButtons.length) {
    setActiveNav(initialPage || "discover")
  }
}

document.addEventListener("turbolinks:load", initLastYearSingle)
