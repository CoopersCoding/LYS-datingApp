function initLYSMessages() {
  const root = document.querySelector("[data-lys-root]")
  if (!root || root.dataset.lysMessagesInitialized === "true") return

  root.dataset.lysMessagesInitialized = "true"

  const conversationList = root.querySelector("[data-conversation-list-body]")
  const communityGrid = root.querySelector("[data-community-grid]")
  const chatBody = root.querySelector("[data-chat-body]")
  const messageForm = root.querySelector("[data-message-form]")
  let conversations = []
  let activeConversationId = null

  function csrfToken() {
    return document.querySelector("meta[name='csrf-token']")?.content || ""
  }

  async function apiRequest(path, options = {}) {
    const headers = Object.assign({ "Accept": "application/json" }, options.headers || {})
    if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json"
    if (options.method && options.method.toUpperCase() !== "GET" && csrfToken()) {
      headers["X-CSRF-Token"] = csrfToken()
    }

    const response = await fetch(path, Object.assign({}, options, {
      headers,
      credentials: "same-origin"
    }))
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = data.error ||
        (data.errors && data.errors.join(", ")) ||
        `Request failed (${response.status} ${response.statusText}).`
      throw new Error(message)
    }

    return data
  }

  function placeholderAvatar(user) {
    return user.profile_image_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80"
  }

  function intentLabel(type) {
    return type === "romantic" ? "Dating" : "Friendship"
  }

  function renderConversationList() {
    if (!conversationList) return

    if (conversations.length === 0) {
      conversationList.innerHTML = '<p class="lys-empty-state">No conversations yet.</p>'
      return
    }

    conversationList.innerHTML = conversations.map((conversation) => {
      const user = conversation.other_user
      const active = Number(conversation.id) === Number(activeConversationId) ? " is-active" : ""
      return `
        <button type="button" class="lys-conversation-row${active}" data-conversation-id="${conversation.id}">
          <img src="${placeholderAvatar(user)}" alt="${user.first_name}" />
          <span class="lys-conversation-copy">
            <span><strong>${user.first_name}</strong><small>${intentLabel(conversation.connection_type)}</small></span>
            <span>${conversation.last_message || "Start the conversation."}</span>
          </span>
        </button>
      `
    }).join("")
  }

  function renderCommunity() {
    if (!communityGrid) return

    if (conversations.length === 0) {
      communityGrid.innerHTML = '<p class="lys-empty-state">Your accepted connections will appear here.</p>'
      return
    }

    communityGrid.innerHTML = conversations.map((conversation) => {
      const user = conversation.other_user
      const intent = conversation.connection_type === "romantic" ? "romance" : "friendship"
      const badgeClass = intent === "romance" ? " lys-intent-badge-romance" : ""
      const location = [user.city, user.state].filter(Boolean).join(", ") || "Location not added"

      return `
        <article class="lys-community-card" data-community-card data-intent="${intent}">
          <img src="${placeholderAvatar(user)}" alt="${user.first_name}" />
          <div class="lys-community-card-body">
            <div><h2>${user.first_name} ${user.last_name || ""}</h2><span>${location}</span></div>
            <span class="lys-intent-badge${badgeClass}">${intentLabel(conversation.connection_type)}</span>
            <p>You are connected. Keep the conversation going when you are ready.</p>
            <div class="lys-community-actions">
              <button type="button" class="lys-text-action" data-open-conversation="${conversation.id}">Message</button>
              <button type="button" class="lys-text-action" data-remove-connection="${conversation.connection_id}" data-remove-name="${user.first_name}">Remove connection</button>
            </div>
          </div>
        </article>
      `
    }).join("")
  }

  async function loadConversations() {
    const data = await apiRequest("/api/conversations")
    conversations = data.conversations || []

    if (!activeConversationId && conversations.length > 0) {
      activeConversationId = conversations[0].id
    }

    renderConversationList()
    renderCommunity()
    return conversations
  }

  async function openConversation(id, scrollOnMobile = false) {
    if (!id) return
    const data = await apiRequest(`/api/conversations/${id}`)
    const conversation = data.conversation
    activeConversationId = conversation.id

    renderConversationList()

    const user = conversation.other_user
    const headerName = root.querySelector("[data-chat-name]")
    const headerIntent = root.querySelector("[data-chat-intent]")
    const headerAvatar = root.querySelector("img[data-chat-avatar]")

    if (headerName) headerName.textContent = [user.first_name, user.last_name].filter(Boolean).join(" ")
    if (headerIntent) headerIntent.textContent = `${intentLabel(conversation.connection_type)} connection`
    if (headerAvatar) {
      headerAvatar.src = placeholderAvatar(user)
      headerAvatar.alt = user.first_name
    }

    if (chatBody) {
      chatBody.innerHTML = '<div class="lys-chat-day">Recent</div>'

      ;(conversation.messages || []).forEach((message) => {
        const bubble = document.createElement("div")
        bubble.className = `lys-bubble ${message.mine ? "lys-bubble-mine" : "lys-bubble-theirs"}`
        bubble.textContent = message.body
        chatBody.appendChild(bubble)
      })

      chatBody.scrollTop = chatBody.scrollHeight
    }

    if (scrollOnMobile && window.matchMedia("(max-width: 820px)").matches) {
      root.querySelector(".lys-chat-panel")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  conversationList?.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-conversation-id]")
    if (!button) return
    await openConversation(button.dataset.conversationId, true)
  })

  communityGrid?.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-connection]")
    if (removeButton) {
      const name = removeButton.dataset.removeName || "this person"
      if (!window.confirm(`Remove ${name} from your connections? They will return to Discover.`)) return

      removeButton.disabled = true
      removeButton.textContent = "Removing..."

      try {
        await apiRequest(`/api/connections/${removeButton.dataset.removeConnection}`, {
          method: "DELETE"
        })

        activeConversationId = null
        await loadConversations()
        document.dispatchEvent(new CustomEvent("lys:connectionschanged"))
      } catch (error) {
        window.alert(error.message)
        removeButton.disabled = false
        removeButton.textContent = "Remove connection"
      }
      return
    }

    const button = event.target.closest("[data-open-conversation]")
    if (!button) return
    window.LYS?.showPage("messages")
    await openConversation(button.dataset.openConversation, true)
  })

  messageForm?.addEventListener("submit", async (event) => {
    event.preventDefault()

    const input = messageForm.querySelector("input[name='message']")
    const sendButton = messageForm.querySelector("button[type='submit']")
    const body = input?.value.trim() || ""

    if (!body) return

    if (!activeConversationId) {
      await loadConversations()
    }
    if (!activeConversationId) return

    sendButton.disabled = true
    sendButton.textContent = "Sending..."

    try {
      await apiRequest(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: { body } })
      })

      input.value = ""
      await loadConversations()
      await openConversation(activeConversationId)
    } catch (error) {
      window.alert(error.message)
    } finally {
      sendButton.disabled = false
      sendButton.textContent = "Send"
    }
  })

  document.addEventListener("lys:pagechange", async (event) => {
    if (!["community", "messages"].includes(event.detail.pageName)) return

    try {
      await loadConversations()
      if (event.detail.pageName === "messages" && activeConversationId) {
        await openConversation(activeConversationId)
      }
    } catch (_error) {
      if (conversationList) conversationList.innerHTML = '<p class="lys-empty-state">Sign in to view conversations.</p>'
      if (communityGrid) communityGrid.innerHTML = '<p class="lys-empty-state">Sign in to view your community.</p>'
    }
  })

  document.addEventListener("lys:connectionschanged", async () => {
    try {
      await loadConversations()
    } catch (_error) {}
  })

  document.addEventListener("lys:authchange", async (event) => {
    if (!event.detail.signedIn) {
      conversations = []
      activeConversationId = null
      renderConversationList()
      renderCommunity()
      return
    }

    try {
      await loadConversations()
    } catch (_error) {}
  })
}

document.addEventListener("turbolinks:load", initLYSMessages)
