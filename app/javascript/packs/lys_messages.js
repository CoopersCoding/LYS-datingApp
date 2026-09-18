function initLYSMessages() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.lysMessagesInitialized === "true") return

  root.dataset.lysMessagesInitialized = "true"

  let conversations = []
  let activeConversationId = null

  async function apiRequest(path, options = {}) {
    const headers = Object.assign(
      { "Accept": "application/json" },
      options.headers || {}
    )

    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json"
    }

    const csrfToken = document.querySelector("meta[name='csrf-token']")?.content
    if (csrfToken && options.method && options.method.toUpperCase() !== "GET") {
      headers["X-CSRF-Token"] = csrfToken
    }

    const response = await fetch(path, Object.assign({}, options, {
      headers,
      credentials: "same-origin"
    }))

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.error || (data.errors && data.errors.join(", ")) || "Something went wrong."
      throw new Error(message)
    }

    return data
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

  async function loadConversations() {
    const data = await apiRequest("/api/conversations")
    conversations = data.conversations || []

    root.querySelectorAll("[data-conversation]").forEach((row) => {
      const rowName = (row.getAttribute("data-chat-name") || "").trim().toLowerCase()
      const conversation = conversations.find((item) => {
        return (item.other_user?.first_name || "").trim().toLowerCase() === rowName
      })

      if (conversation) {
        row.dataset.conversationId = String(conversation.id)
      }
    })

    return conversations
  }

  async function renderConversation(row, scrollOnMobile = false) {
    if (!row) return

    if (!row.dataset.conversationId) {
      await loadConversations()
    }

    const conversationId = row.dataset.conversationId
    if (!conversationId) return

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

    if (name) name.textContent = personName
    if (intent) intent.textContent = personIntent

    if (avatar && personAvatar) {
      avatar.src = personAvatar
      avatar.alt = personName
    }

    body.innerHTML = '<div class="lys-chat-day">Loading...</div>'

    try {
      const data = await apiRequest(`/api/conversations/${conversationId}`)
      const conversation = data.conversation
      activeConversationId = conversation.id

      body.innerHTML = ""

      const day = document.createElement("div")
      day.className = "lys-chat-day"
      day.textContent = "Recent"
      body.appendChild(day)

      ;(conversation.messages || []).forEach((message) => {
        const bubble = document.createElement("div")
        bubble.className = `lys-bubble ${message.mine ? "lys-bubble-mine" : "lys-bubble-theirs"}`
        bubble.textContent = message.body
        body.appendChild(bubble)
      })

      body.scrollTop = body.scrollHeight

      if (scrollOnMobile && window.matchMedia("(max-width: 820px)").matches) {
        window.setTimeout(() => {
          panel.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 40)
      }
    } catch (_error) {
      body.innerHTML = '<div class="lys-chat-day">Unable to load this conversation.</div>'
    }
  }

  async function conversationForCommunityButton(button) {
    const card = button.closest("[data-community-card]")
    const heading = card && card.querySelector("h2")
    if (!heading) return null

    const personName = heading.textContent.split(",")[0].trim().toLowerCase()

    if (conversations.length === 0) {
      await loadConversations()
    }

    const conversation = conversations.find((item) => {
      return (item.other_user?.first_name || "").trim().toLowerCase() === personName
    })

    if (!conversation) return null

    return Array.from(root.querySelectorAll("[data-conversation]")).find((row) => {
      const rowName = (row.getAttribute("data-chat-name") || "").trim().toLowerCase()
      return rowName === personName
    }) || null
  }

  root.addEventListener("click", async (event) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const row = target.closest("[data-conversation]")
    if (row) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      await renderConversation(row, true)
      return
    }

    const messageButton = target.closest("[data-message-nav]")
    if (messageButton) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const rowForPerson = await conversationForCommunityButton(messageButton)
      showMessagesPage()

      const fallback = root.querySelector("[data-conversation].is-active") || root.querySelector("[data-conversation]")
      await renderConversation(rowForPerson || fallback, true)
    }
  }, true)

  const messageForm = root.querySelector("[data-message-form]")
  if (messageForm) {
    messageForm.addEventListener("submit", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()

      const input = messageForm.querySelector("input[name='message']")
      const button = messageForm.querySelector("button[type='submit']")
      const body = root.querySelector("[data-chat-body]")
      const text = input?.value.trim() || ""

      if (!text || !activeConversationId) return

      if (button) {
        button.disabled = true
        button.textContent = "Sending..."
      }

      try {
        const data = await apiRequest(`/api/conversations/${activeConversationId}/messages`, {
          method: "POST",
          body: JSON.stringify({ message: { body: text } })
        })

        const bubble = document.createElement("div")
        bubble.className = "lys-bubble lys-bubble-mine"
        bubble.textContent = data.message.body
        body?.appendChild(bubble)

        if (input) input.value = ""
        if (body) body.scrollTop = body.scrollHeight
      } finally {
        if (button) {
          button.disabled = false
          button.textContent = "Send"
        }
      }
    }, true)
  }

  loadConversations().then(() => {
    const activeRow = root.querySelector("[data-conversation].is-active") || root.querySelector("[data-conversation]")
    const messagesPage = root.querySelector('[data-page="messages"]')

    if (activeRow && messagesPage && !messagesPage.hidden) {
      renderConversation(activeRow)
    }
  }).catch(() => {})
}

document.addEventListener("turbolinks:load", initLYSMessages)
