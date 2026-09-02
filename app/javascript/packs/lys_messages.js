function initLYSMessages() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.lysMessagesInitialized === "true") return

  root.dataset.lysMessagesInitialized = "true"

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

  function showMessagesPage() {
    const welcome = root.querySelector("[data-welcome-screen]")
    const appShell = root.querySelector("[data-app-shell]")

    if (welcome) welcome.hidden = true
    if (appShell) appShell.hidden = false

    root.querySelectorAll("[data-page]").forEach((page) => {
      const active = page.dataset.page === "messages"
      page.hidden = !active
      page.classList.toggle("is-active", active)
    })

    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.nav === "messages")
    })

    window.history.replaceState(null, "", "#messages")
  }

  function renderConversation(row, scrollOnMobile = false) {
    if (!row) return

    const panel = root.querySelector(".lys-chat-panel")
    if (!panel) return

    const header = panel.querySelector(".lys-chat-header")
    const body = panel.querySelector("[data-chat-body]")
    const name = header && header.querySelector("[data-chat-name]")
    const intent = header && header.querySelector("[data-chat-intent]")
    const avatar = header && header.querySelector("img[data-chat-avatar]")

    if (!body) return

    root.querySelectorAll("[data-conversation]").forEach((candidate) => {
      candidate.classList.toggle("is-active", candidate === row)
    })

    const personName = row.getAttribute("data-chat-name") || "Connection"
    const personIntent = row.getAttribute("data-chat-intent") || "Connection"
    const personAvatar = row.getAttribute("data-chat-avatar") || ""
    const conversationKey = row.getAttribute("data-conversation") || ""

    if (name) name.textContent = personName
    if (intent) intent.textContent = personIntent

    if (avatar && personAvatar) {
      avatar.src = personAvatar
      avatar.alt = personName
    }

    body.innerHTML = ""

    const day = document.createElement("div")
    day.className = "lys-chat-day"
    day.textContent = "Recent"
    body.appendChild(day)

    const messages = conversations[conversationKey] || []
    messages.forEach(([direction, text]) => {
      const bubble = document.createElement("div")
      bubble.className = `lys-bubble ${direction === "mine" ? "lys-bubble-mine" : "lys-bubble-theirs"}`
      bubble.textContent = text
      body.appendChild(bubble)
    })

    body.scrollTop = body.scrollHeight

    if (scrollOnMobile && window.matchMedia("(max-width: 820px)").matches) {
      window.setTimeout(() => {
        panel.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 40)
    }
  }

  function conversationForCommunityButton(button) {
    const card = button.closest("[data-community-card]")
    const heading = card && card.querySelector("h2")
    if (!heading) return null

    const personName = heading.textContent.split(",")[0].trim().toLowerCase()
    return Array.from(root.querySelectorAll("[data-conversation]")).find((row) => {
      const rowName = (row.getAttribute("data-chat-name") || "").trim().toLowerCase()
      return rowName === personName
    }) || null
  }

  root.addEventListener("click", (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const row = target.closest("[data-conversation]")
    if (row) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      renderConversation(row, true)
      return
    }

    const messageButton = target.closest("[data-message-nav]")
    if (messageButton) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const rowForPerson = conversationForCommunityButton(messageButton)
      showMessagesPage()

      const fallback = root.querySelector("[data-conversation].is-active") || root.querySelector("[data-conversation]")
      renderConversation(rowForPerson || fallback, true)
    }
  }, true)

  const activeRow = root.querySelector("[data-conversation].is-active") || root.querySelector("[data-conversation]")
  const messagesPage = root.querySelector('[data-page="messages"]')
  if (activeRow && messagesPage && !messagesPage.hidden) {
    renderConversation(activeRow)
  }
}

document.addEventListener("turbolinks:load", initLYSMessages)
